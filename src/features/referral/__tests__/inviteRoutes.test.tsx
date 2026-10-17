import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import WelcomeRoute from '@/app/welcome';
import InviteRoute from '@/app/invite';
import InviteCardRoute from '@/app/invite-card';
import InviteRulesRoute from '@/app/invite-rules';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

import { referrals } from '../referralsForTests';

const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
// The Hub client keeps the fetch it finds when it is made, so the stand-in goes in as its address is read, and that
// address is a closed port on this machine: nothing here can reach a real host.
jest.mock('@/api/env', () => {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => mockFetch(input, init)) as typeof fetch;
  return { apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' };
});
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  invite: InviteRoute,
  'invite-card': InviteCardRoute,
  'invite-rules': InviteRulesRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
const profile = {
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  avatarUrl: null,
  verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
};

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  mockFetch.mockReset().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(input instanceof Request ? input.url : String(input), 'http://127.0.0.1:9').pathname;
    void init;
    if (path === '/api/hub/me/referrals') return ok(referrals());
    if (path === '/api/hub/users/me') return ok(profile);
    throw new TypeError('Network request failed');
  });
});

const signIn = () => {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
};

describe('REF-03: the Invite and earn routes', () => {
  it.each(['/invite', '/invite-rules', '/invite-card'])('a signed-out visit to %s goes to the welcome screen and loads nothing', async (url) => {
    await renderRouter(routes, { initialUrl: url });
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('RF1 opens RF4 from the help button and RF2 from Share, and each goes back to RF1', async () => {
    signIn();
    await renderRouter(routes, { initialUrl: '/invite' });
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
    expect(pathname()).toBe('/invite');

    await fireEvent.press(screen.getByTestId('invite-help'));
    await waitFor(() => expect(pathname()).toBe('/invite-rules'));
    expect(await screen.findByText('Rewards are held for 7 days.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('invite-rules-back'));
    await waitFor(() => expect(pathname()).toBe('/invite'));

    await fireEvent.press(await screen.findByTestId('invite-share'));
    await waitFor(() => expect(pathname()).toBe('/invite-card'));
    expect(await screen.findByTestId('invite-card')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('invite-card-back'));
    await waitFor(() => expect(pathname()).toBe('/invite'));
  });
});
