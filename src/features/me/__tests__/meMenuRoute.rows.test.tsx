/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

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
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'u1' }));

/** The Hub as a stand-in `fetch`, installed before the app's modules load (the API client keeps the `fetch` it finds). */
let answers: Record<string, unknown> = {};
let asked: string[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  asked.push(url.pathname);
  const data = answers[url.pathname];
  if (data === undefined) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const Me = (require('@/app/(tabs)/me') as typeof import('@/app/(tabs)/me')).default;
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { ACCESS_KEY, REFRESH_KEY } = require('@/api/tokenStore') as typeof import('@/api/tokenStore');

/** The destinations are the real route files' paths with a marker for a screen: the test is which path each row leads to. */
const stub = (name: string) =>
  function Stub() {
    return <Text testID="landed">{name}</Text>;
  };

const routes = {
  _layout: () => (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  ),
  me: Me,
  creator: stub('creator'),
  'library/index': stub('library'),
  purchases: stub('purchases'),
  'schools/mine': stub('courses'),
  saved: stub('saved'),
  notifications: stub('notifications'),
  verification: stub('verification'),
  'settings/index': stub('settings'),
};

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

const profile = (accountType: 'creator' | 'user') => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType,
  handle: 'lennox',
  bio: 'Filmmaker.',
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: null,
  tiktokHandle: null,
  xHandle: null,
  youtubeUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
  websiteUrl: null,
  createdAt: '2025-03-10T09:00:00.000Z',
  experience: [],
  verification: { creator: { verified: accountType === 'creator', expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
});

function hubAs(accountType: 'creator' | 'user') {
  answers = {
    '/api/hub/users/me': profile(accountType),
    '/api/hub/users/me/profile-fields': { wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: '2025-03-10T09:00:00.000Z' },
    '/api/hub/users/me/profile-stats': { wawuUserId: 'u1', followerCount: 0, followingCount: 0, postCount: 0 },
    '/api/hub/me/counts': { purchases: 12, saved: 31, unreadNotifications: 3, enrolledCourses: 1 },
    '/api/hub/money/earnings': {
      month: '2026-10',
      walletOpen: true,
      allTime: { earnedKobo: 12_840_000, sales: 31, streams: [] },
      thisMonth: { earnedKobo: 12_840_000, sales: 31, streams: [] },
      waiting: { count: 0, amountKobo: 0 },
      held: { count: 0, amountKobo: 0 },
    },
    '/api/hub/uploads/allowance': {
      tickHeld: false,
      uploads: { used: 4, allowed: 5, remaining: 1 },
      storage: { usedBytes: 0, limitBytes: 1, remainingBytes: 1 },
      free: { uploads: 5, storageBytes: 1 },
      withTick: { uploads: 25, storageBytes: 1 },
    },
  };
}

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes, { initialUrl: '/me' });
  await unmount();
}, 60_000);

beforeEach(() => {
  asked = [];
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set(ACCESS_KEY, tokenFor('u1'));
  mockVault.set(REFRESH_KEY, 'refresh-1');
  resetSessionForTests();
});

const ROW_IDS = ['dashboard', 'content', 'purchases', 'courses', 'saved', 'notifications', 'verification', 'settings'] as const;
const WHERE: Record<(typeof ROW_IDS)[number], [string, string]> = {
  dashboard: ['/creator', 'creator'],
  content: ['/library', 'library'],
  purchases: ['/purchases', 'purchases'],
  courses: ['/schools/mine', 'courses'],
  saved: ['/saved', 'saved'],
  notifications: ['/notifications', 'notifications'],
  verification: ['/verification', 'verification'],
  settings: ['/settings', 'settings'],
};

async function raiseMenu() {
  await renderRouter(routes, { initialUrl: '/me' });
  await waitFor(() => expect(screen.getByTestId('me-menu-button')).toBeTruthy());
  await fireEvent.press(screen.getByTestId('me-menu-button'));
  return screen.findByTestId('me-menu-list');
}

describe('ME-03: a user can open every screen the Me menu names, from the Me tab', () => {
  it('a creator sees all eight rows and each row leads to its screen, then Back is the Me tab', async () => {
    hubAs('creator');
    await raiseMenu();
    expect(await screen.findByText('1 enrolled')).toBeTruthy();
    expect(await screen.findByText('₦128,400 this month')).toBeTruthy();
    expect(await screen.findByText('Creator tick')).toBeTruthy();
    for (const id of ROW_IDS) expect(screen.getByTestId(`me-menu-${id}`)).toBeTruthy();
    for (const id of ROW_IDS) {
      if (!screen.queryByTestId('me-menu-list')) {
        await fireEvent.press(screen.getByTestId('me-menu-button'));
        await screen.findByTestId('me-menu-list');
      }
      await fireEvent.press(screen.getByTestId(`me-menu-${id}`));
      const [path, name] = WHERE[id];
      await waitFor(() => expect(pathname()).toBe(path));
      expect((await screen.findByTestId('landed')).props.children).toBe(name);
      // Back to the Me tab for the next row.
      const { router } = jest.requireActual('expo-router') as typeof import('expo-router');
      router.back();
      await waitFor(() => expect(pathname()).toBe('/me'));
    }
  });

  it('a fan sees six rows: no Creator dashboard and no My content, and the Hub is not asked for earnings', async () => {
    hubAs('user');
    await raiseMenu();
    expect(await screen.findByText('1 enrolled')).toBeTruthy();
    expect(screen.queryByTestId('me-menu-dashboard')).toBeNull();
    expect(screen.queryByTestId('me-menu-content')).toBeNull();
    for (const id of ['purchases', 'courses', 'saved', 'notifications', 'verification', 'settings'] as const) {
      expect(screen.getByTestId(`me-menu-${id}`)).toBeTruthy();
    }
    expect(screen.queryByText(/this month/)).toBeNull();
    expect(asked).not.toContain('/api/hub/money/earnings');
    expect(asked).not.toContain('/api/hub/uploads/allowance');
  });
});
