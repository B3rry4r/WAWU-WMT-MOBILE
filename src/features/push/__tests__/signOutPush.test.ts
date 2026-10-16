import { Platform } from 'react-native';

import { restoreSession, resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { signOutOfThisPhone } from '@/features/settings/signOutFlow';

import { syncPush } from '../registration';
import { PUSH_TOKEN_KEY } from '../storage';

/**
 * INBOX-21, round 2: signing out when the Hub and WAWU ID behave like the real ones. The real session, API client
 * and sign-out run against a fake Hub that EXPIRES access tokens (a token the phone holds stops working, the way
 * WAWU ID's 15 minute token does) and a fake WAWU ID that ROTATES refresh tokens (a refresh ends the old one) and
 * ends the refresh token a logout names. pushFlow.test.ts has a Hub whose tokens never run out, which is why it
 * could not see the order bug these tests are about.
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
jest.mock('@/api/env', () => {
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => mockFetch(...args)) as typeof fetch;
  return { apiBaseUrl: 'http://hub.test', identityBaseUrl: 'http://id.test' };
});
jest.mock('expo-constants', () => ({ __esModule: true, default: { deviceName: 'Pixel 8' } }));

const mockPhone = { tokenHangs: false };
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true, status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true, status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() =>
    mockPhone.tokenHangs
      ? new Promise(() => undefined)
      : Promise.resolve({ type: 'expo', data: 'ExponentPushToken[phone-one]' }),
  ),
  setNotificationHandler: jest.fn(),
}));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** What the two servers hold. `validAccess` and `liveRefresh` are what each server still accepts. */
const world = {
  latency: 30,
  /** Which person holds which phone token. */
  holder: new Map<string, string>(),
  /** The person each token belongs to (access and refresh tokens alike). */
  person: new Map<string, string>(),
  calls: [] as string[],
  validAccess: new Set<string>(),
  liveRefresh: new Set<string>(),
  refreshCount: 0,
  hangDelete: false,
  hangLogout: false,
  /** How long the Hub keeps a registration before it stores it (a slow radio, a busy Hub). */
  postDelay: 0,
};

const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  const body = text ? JSON.parse(text) : {};
  const auth = request.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  world.calls.push(`${request.method} ${url.host}${url.pathname}`);
  if (url.host === 'id.test') {
    if (url.pathname === '/auth/logout') {
      if (world.hangLogout) return new Promise<Response>(() => undefined);
      await wait(world.latency);
      world.liveRefresh.delete(body.refreshToken);
      return json(200, { data: { signedOut: true } });
    }
    if (url.pathname === '/auth/refresh') {
      await wait(world.latency);
      if (!world.liveRefresh.has(body.refreshToken)) return json(401, { statusCode: 401, message: 'Unauthorized' });
      world.liveRefresh.delete(body.refreshToken);
      world.refreshCount += 1;
      const accessToken = `access-fresh-${world.refreshCount}`;
      const refreshToken = `refresh-fresh-${world.refreshCount}`;
      world.validAccess.add(accessToken);
      world.liveRefresh.add(refreshToken);
      world.person.set(accessToken, world.person.get(body.refreshToken) ?? '');
      world.person.set(refreshToken, world.person.get(body.refreshToken) ?? '');
      return json(200, { data: { accessToken, refreshToken } });
    }
    return json(404, {});
  }
  await wait(world.latency);
  if (!world.validAccess.has(auth)) return json(401, { statusCode: 401, message: 'Unauthorized', data: null });
  if (url.pathname === '/api/hub/push-tokens' && request.method === 'POST') {
    if (world.postDelay) await wait(world.postDelay);
    world.holder.set(body.expoPushToken, world.person.get(auth) ?? '');
    return ok({ registered: true });
  }
  if (url.pathname === '/api/hub/push-tokens' && request.method === 'DELETE') {
    if (world.hangDelete) return new Promise<Response>(() => undefined);
    const mine = world.holder.get(body.expoPushToken) === world.person.get(auth);
    if (mine) world.holder.delete(body.expoPushToken);
    return ok({ removed: mine });
  }
  return json(404, {});
};

const signedIn = async (who: 'A' | 'B') => {
  const access = `access-${who}`;
  const refresh = `refresh-${who}`;
  world.validAccess.add(access);
  world.liveRefresh.add(refresh);
  world.person.set(access, who);
  world.person.set(refresh, who);
  mockVault.set(ACCESS_KEY, access);
  mockVault.set(REFRESH_KEY, refresh);
  resetSessionForTests();
  await restoreSession();
};

/** The calls that touch the phone's registration or the session, in order, without the host. */
const orderOf = () => world.calls.map((call) => call.replace(/^(\w+) \w+\.test/, '$1 '));

let platform: { restore: () => void } | null = null;
beforeEach(() => {
  mockVault.clear();
  world.holder.clear();
  world.person.clear();
  world.calls = [];
  world.validAccess = new Set();
  world.liveRefresh = new Set();
  world.refreshCount = 0;
  world.hangDelete = false;
  world.hangLogout = false;
  world.postDelay = 0;
  mockPhone.tokenHangs = false;
  platform = jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  platform?.restore();
});

describe('signing out of a phone that is registered for push', () => {
  it('removes the phone, then ends the session, while the access token is still good', async () => {
    await signedIn('A');
    await syncPush({ ask: true });
    expect(world.holder.size).toBe(1);
    world.calls = [];
    await signOutOfThisPhone();
    expect(world.holder.size).toBe(0);
    expect(orderOf()).toEqual(['DELETE /api/hub/push-tokens', 'POST /auth/logout']);
    expect(world.liveRefresh.size).toBe(0);
  });

  it('still removes the phone when the access token ran out (15 minutes idle), and ends the refreshed session', async () => {
    await signedIn('A');
    await syncPush({ ask: true });
    expect(world.holder.size).toBe(1);
    // 15 minutes pass: the access token the app holds no longer works at the Hub.
    world.validAccess.delete('access-A');
    world.calls = [];
    const result = await signOutOfThisPhone();
    expect(result.storeCleared).toBe(true);
    expect(result.serverEnded).toBe(true);
    // The Hub refused the old token, the app took a new one, removed the phone, and only then ended the session.
    expect(orderOf()).toEqual(['DELETE /api/hub/push-tokens', 'POST /auth/refresh', 'DELETE /api/hub/push-tokens', 'POST /auth/logout']);
    expect(world.holder.size).toBe(0);
    // The logout named the refresh token the refresh handed out, so no live refresh token is left behind.
    expect(world.liveRefresh.size).toBe(0);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
  });

  it('signs out in about 3 seconds when the Hub never answers the removal, and still ends the session', async () => {
    await signedIn('A');
    await syncPush({ ask: true });
    world.hangDelete = true;
    const started = Date.now();
    const result = await signOutOfThisPhone();
    const took = Date.now() - started;
    expect(took).toBeGreaterThanOrEqual(2900);
    expect(took).toBeLessThan(5000);
    expect(result.storeCleared).toBe(true);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
    await wait(100);
    expect(orderOf()).toEqual(['POST /api/hub/push-tokens', 'DELETE /api/hub/push-tokens', 'POST /auth/logout']);
    expect(world.liveRefresh.size).toBe(0);
  }, 15000);

  it('signs out in about 3 seconds when neither the Hub nor WAWU ID answers', async () => {
    await signedIn('A');
    await syncPush({ ask: true });
    world.hangDelete = true;
    world.hangLogout = true;
    const started = Date.now();
    const result = await signOutOfThisPhone();
    expect(Date.now() - started).toBeLessThan(5000);
    expect(result.storeCleared).toBe(true);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
  }, 15000);
});

describe('a registration that is still on its way when the person signs out', () => {
  it('does not leave the phone registered to the person who signed out when it lands after the sign-out', async () => {
    await signedIn('A');
    world.postDelay = 4000;
    void syncPush({ ask: true });
    await wait(500);
    const started = Date.now();
    await signOutOfThisPhone();
    expect(Date.now() - started).toBeLessThan(5000);
    expect(mockVault.has(ACCESS_KEY)).toBe(false);
    // The Hub stores the registration after the sign-out; the phone takes it off again.
    await wait(4000);
    expect(world.holder.size).toBe(0);
    expect(mockVault.has(PUSH_TOKEN_KEY)).toBe(false);
  }, 20000);

  it('lets the next person who signed in keep the phone when the old registration lands after theirs', async () => {
    await signedIn('A');
    world.postDelay = 4000;
    void syncPush({ ask: true });
    await wait(500);
    await signOutOfThisPhone();
    world.postDelay = 0;
    await signedIn('B');
    await syncPush({ ask: true });
    expect(world.holder.size).toBe(1);
    expect([...world.holder.values()]).toEqual(['B']);
    // A's late registration lands now and gives the phone to A. B is signed in, so the phone takes it back for B.
    await wait(4500);
    expect([...world.holder.values()]).toEqual(['B']);
    expect(mockVault.get(ACCESS_KEY)).toBe('access-B');
  }, 20000);

  // Last on purpose: a registration that never finishes stays in the module until the process ends.
  it('never holds the next person back when it never finishes', async () => {
    await signedIn('A');
    mockPhone.tokenHangs = true;
    void syncPush({ ask: true });
    await wait(50);
    const started = Date.now();
    await signOutOfThisPhone();
    expect(Date.now() - started).toBeLessThan(5000);
    // Another person signs in on the phone, which can get its token now.
    mockPhone.tokenHangs = false;
    await signedIn('B');
    const outcome = await Promise.race([syncPush({ ask: true }), wait(1500).then(() => 'stuck')]);
    expect(outcome).toBe('registered');
    expect(world.holder.size).toBe(1);
  }, 15000);
});
