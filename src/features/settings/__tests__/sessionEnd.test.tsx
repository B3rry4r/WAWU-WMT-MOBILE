/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * SETTINGS-01 round 2 (D1, D2 and the sign-out store refusal): these tests use the app's real session module and
 * the app's one query cache, kept across every session change the way one app process keeps it, so they prove what
 * a person can see when one account signs out and another signs in on the same phone.
 */

const mockVault = new Map<string, string>();
let mockVaultRefusesDelete = false;
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    if (mockVaultRefusesDelete) throw new Error('secure store refused');
    mockVault.delete(key);
  }),
}));

/** A token shaped like WAWU ID's: a JWT whose `sub` is the account. */
const jwtFor = (sub: string, n: number) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ sub, n })}.signature`;
};

type Person = 'A' | 'B';
const owners = new Map<string, Person>();
let issued = 0;
function pairFor(person: Person) {
  issued += 1;
  const accessToken = jwtFor(`account-${person}`, issued);
  const refreshToken = `refresh-${person}-${issued}`;
  owners.set(accessToken, person);
  return { accessToken, refreshToken };
}

/** What each person's Hub rows hold. */
const rows: Record<Person, { privacy: Record<string, unknown>; tgif: boolean; blocked: { id: string; name: string }[] }> = {
  A: { privacy: {}, tgif: true, blocked: [] },
  B: { privacy: {}, tgif: true, blocked: [] },
};
const freshRows = () => {
  rows.A = {
    privacy: { userWawuId: 'A', showPurchases: false, showSavedItems: false, showFollowing: true, showInMemberLists: true },
    tgif: true,
    blocked: [{ id: 'a-row-1', name: 'Spam Account' }],
  };
  rows.B = {
    privacy: { userWawuId: 'B', showPurchases: true, showSavedItems: true, showFollowing: true, showInMemberLists: true },
    tgif: true,
    blocked: [{ id: 'b-row-1', name: 'Tunde K.' }],
  };
};

/** Answers held until a test releases them, keyed `METHOD path whose-token`. */
const holds = new Map<string, Promise<void>>();
/** The status a held answer is finally released with. */
const releasedWith = new Map<string, number>();
/** Every request the fake Hub saw: `METHOD path as <whose token>`, in order. */
let seen: string[] = [];

function hold(key: string, status = 200) {
  let release: () => void = () => undefined;
  holds.set(
    key,
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  releasedWith.set(key, status);
  return () => {
    holds.delete(key);
    release();
  };
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  const text = request.method === 'GET' ? '' : await request.text();
  const body = text ? JSON.parse(text) : {};
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  const person = owners.get(token);
  const who = person ?? 'nobody';
  const key = `${request.method} ${path} ${who}`;
  seen.push(`${request.method} ${path} as ${who}`);
  const held = holds.get(key);
  if (held) {
    await held;
    const status = releasedWith.get(key) ?? 200;
    if (status !== 200) return json(status, { statusCode: status, message: status === 500 ? 'Internal server error' : 'Unauthorized', data: null });
  }
  if (!person) return json(401, { statusCode: 401, message: 'Unauthorized', data: null });
  if (path === '/api/hub/users/me') {
    return ok({
      wawuUserId: person,
      firstName: `Person ${person}`,
      lastName: null,
      email: `${person.toLowerCase()}@example.test`,
      phone: '+2348031234412',
      avatarUrl: null,
      verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
    });
  }
  if (path === '/api/hub/settings/tgif') {
    if (request.method === 'PATCH') rows[person].tgif = body.show;
    return ok({ show: rows[person].tgif });
  }
  if (path === '/api/hub/settings/privacy') {
    if (request.method === 'PATCH') rows[person].privacy = { ...rows[person].privacy, ...body };
    return ok(rows[person].privacy);
  }
  if (path === '/api/hub/settings/privacy/export') return ok([]);
  if (path === '/api/hub/settings/privacy/blocked' && request.method === 'GET') {
    const list = rows[person].blocked.map((b) => ({
      id: b.id,
      userWawuId: person,
      blockedWawuId: `p-${b.id}`,
      blockedAt: '2026-10-01T10:00:00.000Z',
      blockedUser: { wawuId: `p-${b.id}`, name: b.name, handle: null, avatarUrl: null, verification: null },
    }));
    return json(200, { statusCode: 200, message: 'OK', data: list, pagination: { currentPage: 1, nextPage: null, perPage: 100, total: list.length } });
  }
  const unblockOf = path.match(/^\/api\/hub\/settings\/privacy\/blocked\/(.+)$/);
  if (unblockOf && request.method === 'DELETE') {
    rows[person].blocked = rows[person].blocked.filter((b) => b.id !== unblockOf[1]);
    return ok(null);
  }
  if (path === '/auth/logout') return json(200, { data: { signedOut: true } });
  if (path === '/auth/change-password') return json(200, { data: pairFor(person) });
  return json(404, { statusCode: 404, message: 'Not found', data: null });
}) as typeof fetch;

const { adoptSession, resetSessionForTests, signOut } = require('@/api/session') as typeof import('@/api/session');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');

function frame(child: ReactElement) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={queryClient}>{child}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

const checked = (testID: string) => Boolean(screen.getByTestId(testID).props.accessibilityState?.checked);
const tap = (testID: string) => act(async () => fireEvent.press(screen.getByTestId(testID)));
const flush = () => act(async () => new Promise<void>((resolve) => setTimeout(resolve, 30)));
const cacheOf = (...key: string[]) => queryClient.getQueryData(['settings', ...key]) as Record<string, unknown> | undefined;

const privacyScreen = () => {
  const { PrivacyScreen } = require('../PrivacyScreen') as typeof import('../PrivacyScreen');
  return <PrivacyScreen onBack={jest.fn()} onOpenBlocked={jest.fn()} onOpenPolicy={jest.fn()} />;
};
const blockedScreen = () => {
  const { BlockedScreen } = require('../BlockedScreen') as typeof import('../BlockedScreen');
  return <BlockedScreen onBack={jest.fn()} />;
};
const settingsScreen = (over: Partial<Record<string, jest.Mock>> = {}) => {
  const { SettingsScreen } = require('../SettingsScreen') as typeof import('../SettingsScreen');
  const props = {
    onBack: jest.fn(),
    onOpenProfile: jest.fn(),
    onOpenNotifications: jest.fn(),
    onOpenPrivacy: jest.fn(),
    onOpenPassword: jest.fn(),
    onOpenAbout: jest.fn(),
    onOpenLegal: jest.fn(),
    onSignedOut: jest.fn(),
    ...over,
  };
  return { props, element: <SettingsScreen {...props} /> };
};

beforeEach(async () => {
  resetSessionForTests();
  queryClient.clear();
  mockVault.clear();
  mockVaultRefusesDelete = false;
  holds.clear();
  releasedWith.clear();
  seen = [];
  freshRows();
  (require('../devicePrefs') as typeof import('../devicePrefs')).resetPrefsForTests();
});

afterEach(() => {
  queryClient.clear();
});

describe('a save that answers after the account changed (D1)', () => {
  it('never flips the next account\'s switch, whether the save succeeds late', async () => {
    await adoptSession(pairFor('A'));
    const first = await render(frame(privacyScreen()));
    await screen.findByTestId('privacy-showFollowing');
    const release = hold('PATCH /api/hub/settings/privacy A');
    await tap('privacy-showFollowing');
    expect(checked('privacy-showFollowing')).toBe(false);
    await first.unmount();

    await signOut();
    await adoptSession(pairFor('B'));
    await render(frame(privacyScreen()));
    await screen.findByTestId('privacy-showFollowing');
    expect(checked('privacy-showFollowing')).toBe(true);

    release();
    await flush();
    expect(checked('privacy-showFollowing')).toBe(true);
    expect(cacheOf('privacy')).toMatchObject({ userWawuId: 'B', showFollowing: true });
  });

  it('nor rolls it back when the late save fails', async () => {
    await adoptSession(pairFor('A'));
    const first = await render(frame(privacyScreen()));
    await screen.findByTestId('privacy-showFollowing');
    const release = hold('PATCH /api/hub/settings/privacy A', 500);
    await tap('privacy-showFollowing');
    await first.unmount();

    await signOut();
    await adoptSession(pairFor('B'));
    rows.B.privacy = { ...rows.B.privacy, showFollowing: false };
    await render(frame(privacyScreen()));
    await screen.findByTestId('privacy-showFollowing');
    expect(checked('privacy-showFollowing')).toBe(false);

    release();
    await flush();
    expect(checked('privacy-showFollowing')).toBe(false);
    expect(cacheOf('privacy')).toMatchObject({ userWawuId: 'B', showFollowing: false });
  });

  it('holds for the TGIF switch on Settings too', async () => {
    await adoptSession(pairFor('A'));
    const a = settingsScreen();
    const first = await render(frame(a.element));
    await screen.findByTestId('settings-tgif');
    const release = hold('PATCH /api/hub/settings/tgif A');
    await tap('settings-tgif');
    expect(checked('settings-tgif')).toBe(false);
    await first.unmount();

    await signOut();
    await adoptSession(pairFor('B'));
    await render(frame(settingsScreen().element));
    await screen.findByTestId('settings-tgif');
    expect(checked('settings-tgif')).toBe(true);

    release();
    await flush();
    expect(checked('settings-tgif')).toBe(true);
    expect(cacheOf('tgif')).toEqual({ show: true });
  });

  it('keeps the same account\'s save: the guard is about the session, not the screen', async () => {
    await adoptSession(pairFor('A'));
    const first = await render(frame(privacyScreen()));
    await screen.findByTestId('privacy-showFollowing');
    const release = hold('PATCH /api/hub/settings/privacy A');
    await tap('privacy-showFollowing');
    await first.unmount();
    release();
    await flush();
    expect(cacheOf('privacy')).toMatchObject({ userWawuId: 'A', showFollowing: false });
  });

  it('never removes a row from the next account\'s blocked list when the old account\'s Unblock answers late', async () => {
    rows.B.blocked = [
      { id: 'a-row-1', name: 'Same Id Person' },
      { id: 'b-row-2', name: 'Tunde K.' },
    ];
    await adoptSession(pairFor('A'));
    const first = await render(frame(blockedScreen()));
    await screen.findByText('Spam Account');
    const release = hold('DELETE /api/hub/settings/privacy/blocked/a-row-1 A');
    await tap('blocked-unblock-a-row-1');
    await first.unmount();

    await signOut();
    await adoptSession(pairFor('B'));
    await render(frame(blockedScreen()));
    await screen.findByText('Same Id Person');

    release();
    await flush();
    expect(screen.getByText('Same Id Person')).toBeTruthy();
    expect(screen.getByText('Tunde K.')).toBeTruthy();
    expect((cacheOf('blocked') as { rows: unknown[]; total: number }).total).toBe(2);
  });
});

describe('after sign-out no settings screen sends a request (D2)', () => {
  it('Settings left mounted sends nothing once the session is over, not even to refetch', async () => {
    await adoptSession(pairFor('A'));
    const a = settingsScreen();
    await render(frame(a.element));
    await screen.findByText('Person A');
    seen = [];
    await act(async () => {
      await signOut();
    });
    await flush();
    await flush();
    expect(seen).toEqual([]);
  });

  it('Privacy and Blocked left mounted send nothing either', async () => {
    await adoptSession(pairFor('A'));
    await render(frame(privacyScreen()));
    await screen.findByTestId('privacy-showFollowing');
    await render(frame(blockedScreen()));
    await screen.findByText('Spam Account');
    seen = [];
    await act(async () => {
      await signOut();
    });
    await flush();
    await flush();
    expect(seen).toEqual([]);
  });

  it('the next account\'s Settings loads normally even while the old screen\'s requests are held', async () => {
    await adoptSession(pairFor('A'));
    const a = settingsScreen();
    await render(frame(a.element));
    await screen.findByText('Person A');
    // Whatever Settings might still ask for without a token is held and never answered.
    hold('GET /api/hub/users/me nobody');
    hold('GET /api/hub/settings/tgif nobody');
    await act(async () => {
      await signOut();
    });
    await adoptSession(pairFor('B'));
    await render(frame(settingsScreen().element));
    expect(await screen.findByText('Person B')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByTestId('settings-tgif').length).toBeGreaterThan(0));
    expect(seen.filter((line) => line.endsWith('as nobody'))).toEqual([]);
    expect(screen.queryByText('Your details did not load')).toBeNull();
  });

  it('a visitor with no session at all sends nothing and invents no data', async () => {
    await render(frame(settingsScreen().element));
    await render(frame(privacyScreen()));
    await render(frame(blockedScreen()));
    await flush();
    expect(seen).toEqual([]);
  });
});

describe('a password change that answers after the person signed out', () => {
  it('does not sign the phone back in as the account that left', async () => {
    const { ChangePasswordScreen } = require('../ChangePasswordScreen') as typeof import('../ChangePasswordScreen');
    const { getAccessToken } = require('@/api/session') as typeof import('@/api/session');
    await adoptSession(pairFor('A'));
    await render(frame(<ChangePasswordScreen onBack={jest.fn()} onDone={jest.fn()} />));
    const release = hold('POST /auth/change-password A');
    await fireEvent.changeText(screen.getByTestId('password-current'), 'old-password');
    await fireEvent.changeText(screen.getByTestId('password-new'), 'new-password-1');
    await tap('password-save');
    await act(async () => {
      await signOut();
    });
    release();
    await flush();
    expect(await getAccessToken()).toBeNull();
    expect(mockVault.size).toBe(0);
    expect(screen.getByText('Your password was changed')).toBeTruthy();
    expect(screen.getByText('You signed out before it finished. Sign in with your new password.')).toBeTruthy();
    expect(screen.queryByText('Password changed')).toBeNull();
  });
});

describe('sign out when the secure store refuses the delete', () => {
  it('still signs the person out in memory and empties the cache, and says the saved sign-in is still on the phone', async () => {
    await adoptSession(pairFor('A'));
    const a = settingsScreen();
    await render(frame(a.element));
    await screen.findByText('Person A');
    expect(cacheOf('me')).toBeTruthy();
    mockVaultRefusesDelete = true;
    await tap('settings-sign-out');
    const problem = await screen.findByTestId('settings-problem');
    expect(String(problem.props.children)).toBe(
      'You are signed out, but this phone could not remove your saved sign-in. Tap Sign out to try again.',
    );
    expect(cacheOf('me')).toBeUndefined();
    expect(a.props.onSignedOut).not.toHaveBeenCalled();
    const { getAccessToken } = require('@/api/session') as typeof import('@/api/session');
    expect(await getAccessToken()).toBeNull();
    expect(mockVault.size).toBe(2);
  });

  it('removes the saved sign-in on the next tap, and then leaves Settings', async () => {
    await adoptSession(pairFor('A'));
    const a = settingsScreen();
    await render(frame(a.element));
    await screen.findByText('Person A');
    mockVaultRefusesDelete = true;
    await tap('settings-sign-out');
    await screen.findByTestId('settings-problem');
    mockVaultRefusesDelete = false;
    await tap('settings-sign-out');
    await waitFor(() => expect(a.props.onSignedOut).toHaveBeenCalledTimes(1));
    expect(mockVault.size).toBe(0);
    expect(screen.queryByTestId('settings-problem')).toBeNull();
  });
});
