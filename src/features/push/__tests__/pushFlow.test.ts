import { Platform } from 'react-native';

import { restoreSession, resetSessionForTests, signOut } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { signOutOfThisPhone } from '@/features/settings/signOutFlow';
import { SOUND_KEY } from '@/features/settings/devicePrefs';

import { forgetPush, installPushHandler, syncPush } from '../registration';
import { PUSH_ASKED_KEY, PUSH_TOKEN_KEY } from '../storage';

/**
 * INBOX-21 with the app's real session, API client and sign-out, a fake Hub that answers the way
 * INBOX-03's routes do (one owner per phone, removal of your own phone only), and expo-notifications
 * stood in for: the phone's permission and token are what a test sets.
 */

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
// The API client keeps the fetch it finds when it is created, so the hook-up happens as the client's env loads.
jest.mock('@/api/env', () => {
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => mockHubFetch(...args)) as typeof fetch;
  return { apiBaseUrl: 'http://hub.test', identityBaseUrl: 'http://id.test' };
});
jest.mock('expo-constants', () => ({ __esModule: true, default: { deviceName: 'Pixel 8' } }));

type Permission = { granted: boolean; canAskAgain: boolean; status: string };
const mockPhone = {
  permission: { granted: false, canAskAgain: true, status: 'undetermined' } as Permission,
  allowWhenAsked: true,
  token: 'ExponentPushToken[phone-one]',
  events: [] as string[],
  channels: new Map<string, Record<string, unknown>>(),
  handler: null as { handleNotification: () => Promise<Record<string, unknown>> } | null,
};
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(async (id: string, config: Record<string, unknown>) => {
    mockPhone.events.push('channel');
    mockPhone.channels.set(id, config);
  }),
  getPermissionsAsync: jest.fn(async () => ({ ...mockPhone.permission })),
  requestPermissionsAsync: jest.fn(async () => {
    mockPhone.events.push('ask');
    mockPhone.permission = mockPhone.allowWhenAsked
      ? { granted: true, canAskAgain: true, status: 'granted' }
      : { granted: false, canAskAgain: false, status: 'denied' };
    return { ...mockPhone.permission };
  }),
  getExpoPushTokenAsync: jest.fn(async () => {
    mockPhone.events.push('token');
    return { type: 'expo', data: mockPhone.token };
  }),
  setNotificationHandler: jest.fn((handler: typeof mockPhone.handler) => {
    mockPhone.handler = handler;
  }),
}));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

/** The Hub: which person holds which phone token, and every call it saw. */
const hub = {
  holder: new Map<string, string>(),
  calls: [] as string[],
  bodies: [] as Record<string, unknown>[],
  deletionAsked: false,
  offline: false,
  slowRegister: null as Promise<void> | null,
  failRemove: false,
};
const owners = new Map<string, string>([
  ['access-A', 'A'],
  ['access-B', 'B'],
]);

const mockHubFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  const text = request.method === 'GET' ? '' : await request.text();
  const body = text ? JSON.parse(text) : {};
  const person = owners.get(request.headers.get('authorization')?.replace('Bearer ', '') ?? '');
  hub.calls.push(`${request.method} ${path} as ${person ?? 'nobody'}`);
  if (hub.offline) throw new TypeError('Network request failed');
  if (path === '/auth/logout') return json(200, { data: { signedOut: true } });
  if (!person) return json(401, { statusCode: 401, message: 'Unauthorized', data: null });
  if (path === '/api/hub/push-tokens' && request.method === 'POST') {
    hub.bodies.push(body);
    if (hub.slowRegister) await hub.slowRegister;
    const valid = /^Expo(nent)?PushToken\[.+\]$/.test(body.expoPushToken) && ['android', 'ios'].includes(body.platform);
    if (!valid) return json(400, { statusCode: 400, message: 'Bad request', data: null });
    if (hub.deletionAsked) return ok({ registered: false });
    hub.holder.set(body.expoPushToken, person);
    return ok({ registered: true });
  }
  if (path === '/api/hub/push-tokens' && request.method === 'DELETE') {
    hub.bodies.push(body);
    if (hub.failRemove) return json(500, { statusCode: 500, message: 'Internal server error', data: null });
    const mine = hub.holder.get(body.expoPushToken) === person;
    if (mine) hub.holder.delete(body.expoPushToken);
    return ok({ removed: mine });
  }
  return json(404, { statusCode: 404, message: 'Not found', data: null });
};

const signedInAs = async (access: string) => {
  mockVault.set(ACCESS_KEY, access);
  mockVault.set(REFRESH_KEY, `refresh-for-${access}`);
  resetSessionForTests();
  await restoreSession();
};

let platform: { restore: () => void } | null = null;
const setPlatform = (os: 'android' | 'ios' | 'web') => {
  platform?.restore();
  platform = jest.replaceProperty(Platform, 'OS', os);
};

beforeEach(() => {
  mockVault.clear();
  hub.holder.clear();
  hub.calls = [];
  hub.bodies = [];
  hub.deletionAsked = false;
  hub.offline = false;
  hub.slowRegister = null;
  hub.failRemove = false;
  mockPhone.permission = { granted: false, canAskAgain: true, status: 'undetermined' };
  mockPhone.allowWhenAsked = true;
  mockPhone.token = 'ExponentPushToken[phone-one]';
  mockPhone.events = [];
  mockPhone.channels.clear();
  mockPhone.handler = null;
  setPlatform('android');
});

afterEach(() => {
  platform?.restore();
  platform = null;
});

describe('a person who allows notifications', () => {
  it('is asked once, after the channel Android needs exists, and the phone is registered to them', async () => {
    await signedInAs('access-A');
    expect(await syncPush({ ask: true })).toBe('registered');
    expect(mockPhone.events).toEqual(['channel', 'ask', 'token']);
    expect(hub.holder.get('ExponentPushToken[phone-one]')).toBe('A');
    expect(hub.bodies[0]).toEqual({ expoPushToken: 'ExponentPushToken[phone-one]', platform: 'android', deviceLabel: 'Pixel 8' });
    expect(mockVault.get(PUSH_TOKEN_KEY)).toBe('ExponentPushToken[phone-one]');
  });

  it('is registered again on every start without being asked again', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    await syncPush({ ask: true });
    expect(mockPhone.events.filter((e) => e === 'ask')).toHaveLength(1);
    expect(hub.calls.filter((c) => c.startsWith('POST'))).toHaveLength(2);
  });

  it('is registered without a prompt where the system already allows it (Android before 13)', async () => {
    mockPhone.permission = { granted: true, canAskAgain: true, status: 'granted' };
    await signedInAs('access-A');
    expect(await syncPush({ ask: true })).toBe('registered');
    expect(mockPhone.events).not.toContain('ask');
  });

  it('shares one run between two starts at the same moment', async () => {
    await signedInAs('access-A');
    const [a, b] = await Promise.all([syncPush({ ask: true }), syncPush({ ask: true })]);
    expect([a, b]).toEqual(['registered', 'registered']);
    expect(hub.calls.filter((c) => c.startsWith('POST'))).toHaveLength(1);
  });

  it('moves the phone to the next person who signs in on it', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    await signedInAs('access-B');
    await syncPush({ ask: true });
    expect(hub.holder.get('ExponentPushToken[phone-one]')).toBe('B');
  });
});

describe('a person who refuses', () => {
  it('keeps using the app: nothing is registered, nothing throws, and they are never asked again', async () => {
    mockPhone.allowWhenAsked = false;
    await signedInAs('access-A');
    expect(await syncPush({ ask: true })).toBe('off');
    expect(hub.calls.filter((c) => c.includes('push-tokens'))).toEqual([]);
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
    expect(await syncPush({ ask: true })).toBe('off');
    expect(mockPhone.events.filter((e) => e === 'ask')).toHaveLength(1);
    expect(mockVault.get(PUSH_ASKED_KEY)).toBe('yes');
  });

  it('is registered on the next start if they switch notifications on in the phone settings', async () => {
    mockPhone.allowWhenAsked = false;
    await signedInAs('access-A');
    await syncPush({ ask: true });
    mockPhone.permission = { granted: true, canAskAgain: true, status: 'granted' };
    expect(await syncPush({ ask: true })).toBe('registered');
  });

  it('is not asked when the start does not ask (coming back to the front)', async () => {
    await signedInAs('access-A');
    expect(await syncPush({ ask: false })).toBe('off');
    expect(mockPhone.events).not.toContain('ask');
  });

  it('can still be signed out: there is nothing to remove', async () => {
    mockPhone.allowWhenAsked = false;
    await signedInAs('access-A');
    await syncPush({ ask: true });
    hub.calls = [];
    await signOutOfThisPhone();
    expect(hub.calls).toEqual(['POST /auth/logout as nobody']);
  });
});

describe('a start that cannot finish', () => {
  it('fails quietly when the Hub cannot be reached, and tries again next time', async () => {
    await signedInAs('access-A');
    hub.offline = true;
    expect(await syncPush({ ask: true })).toBe('failed');
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
    hub.offline = false;
    expect(await syncPush({ ask: true })).toBe('registered');
  });

  it('does not keep a phone the Hub refused (the account is being deleted)', async () => {
    await signedInAs('access-A');
    hub.deletionAsked = true;
    expect(await syncPush({ ask: true })).toBe('off');
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
  });

  it('fails quietly when the phone cannot get a token (no Google services, offline)', async () => {
    const notifications = jest.requireMock('expo-notifications');
    notifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('SERVICE_NOT_AVAILABLE'));
    await signedInAs('access-A');
    expect(await syncPush({ ask: true })).toBe('failed');
  });

  it('does nothing in the browser build', async () => {
    setPlatform('web');
    await signedInAs('access-A');
    expect(await syncPush({ ask: true })).toBe('unsupported');
    await forgetPush();
    expect(mockPhone.events).toEqual([]);
    expect(hub.calls).toEqual([]);
  });
});

describe('a person who signs out', () => {
  it('has the phone taken off their list while the session still works, then gets no more pushes on it', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    expect(hub.holder.size).toBe(1);
    hub.calls = [];
    await signOutOfThisPhone();
    expect(hub.calls).toContain('DELETE /api/hub/push-tokens as A');
    expect(hub.bodies.at(-1)).toEqual({ expoPushToken: 'ExponentPushToken[phone-one]' });
    expect(hub.holder.size).toBe(0);
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
  });

  it('removes the phone after the app was closed and opened again (the token was remembered)', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    await signedInAs('access-A');
    await signOutOfThisPhone();
    expect(hub.holder.size).toBe(0);
  });

  it('does not touch another person who holds the phone now', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    hub.holder.set('ExponentPushToken[phone-one]', 'B');
    await signOutOfThisPhone();
    expect(hub.holder.get('ExponentPushToken[phone-one]')).toBe('B');
  });

  it('is still signed out when the Hub cannot be reached, and the phone forgets its token', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    hub.offline = true;
    const result = await signOutOfThisPhone();
    expect(result.storeCleared).toBe(true);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
  });

  it('is still signed out when the Hub refuses the removal', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    hub.failRemove = true;
    const result = await signOutOfThisPhone();
    expect(result.storeCleared).toBe(true);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
  });

  it('waits for a registration still on its way, so it cannot land after the removal', async () => {
    await signedInAs('access-A');
    let release: () => void = () => undefined;
    hub.slowRegister = new Promise<void>((resolve) => {
      release = resolve;
    });
    const starting = syncPush({ ask: true });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const leaving = signOutOfThisPhone();
    await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    await Promise.all([starting, leaving]);
    expect(hub.holder.size).toBe(0);
    expect(hub.calls.filter((c) => c.includes('push-tokens')).map((c) => c.split(' ')[0])).toEqual(['POST', 'DELETE']);
  });

  it('signs out even when the session ends some other way (nothing left to remove with)', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    await signOut();
    await expect(forgetPush()).resolves.toBeUndefined();
  });
});

describe('how a push looks while the app is open and on Android', () => {
  it('shows a banner, never sets a badge, and plays a sound only when Z2 Sound is on', async () => {
    installPushHandler();
    expect(await mockPhone.handler?.handleNotification()).toEqual({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false });
    mockVault.set(SOUND_KEY, 'on');
    expect(await mockPhone.handler?.handleNotification()).toMatchObject({ shouldPlaySound: true, shouldSetBadge: false });
  });

  it('makes the default channel, silent until Z2 Sound is on', async () => {
    await signedInAs('access-A');
    await syncPush({ ask: true });
    expect(mockPhone.channels.get('default')).toMatchObject({ name: 'Who Made This?', importance: 4, sound: null });
    mockVault.set(SOUND_KEY, 'on');
    await syncPush({ ask: true });
    expect(mockPhone.channels.get('default')).toMatchObject({ sound: 'default' });
  });

  it('makes no channel on iOS and says iOS to the Hub', async () => {
    setPlatform('ios');
    await signedInAs('access-A');
    await syncPush({ ask: true });
    expect(mockPhone.channels.size).toBe(0);
    expect(hub.bodies[0]).toMatchObject({ platform: 'ios' });
  });
});
