import { View } from 'react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import SelfieReturnRoute from '@/app/selfie';
import WelcomeRoute from '@/app/welcome';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { extractExpoPathFromURL } from 'expo-router/build/fork/extractPathFromURL';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

/**
 * LINKS-01: `https://wawuafrica.com/selfie`, where the hosted selfie page sends a person back to, opened in the
 * installed app. It draws nothing of its own: a signed-in person lands on the selfie step (which asks the Hub where the
 * selfie stands), a signed-out one at the welcome screen.
 */
const mockVault = new Map<string, string>();
const mockFetch = jest.fn();
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

// The selfie step itself is built and tested elsewhere; here it only has to be the place the link ends.
const SelfieStepStandIn = () => <View testID="selfie-step" />;

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  selfie: SelfieReturnRoute,
  'open-wallet-selfie': SelfieStepStandIn,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  // Nothing is reachable: the link needs no answer from the Hub.
  mockFetch.mockImplementation(async () => {
    throw new TypeError('Network request failed');
  });
});

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

describe('LINKS-01: the hosted selfie page returns to https://wawuafrica.com/selfie', () => {
  it('a signed-in person lands on the selfie step', async () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: 'https://wawuafrica.com/selfie' });
    expect(await screen.findByTestId('selfie-step')).toBeTruthy();
    expect(pathname()).toBe('/open-wallet-selfie');
  });

  it('a signed-out visitor lands on the welcome screen, and the selfie step is not shown', async () => {
    await renderRouter(routes, { initialUrl: 'https://wawuafrica.com/selfie' });
    expect(await screen.findByTestId('welcome')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/welcome'));
    expect(screen.queryByTestId('selfie-step')).toBeNull();
  });

  it("the ways in (https and the app's own address) all name the same routes", () => {
    // What expo-router makes of an incoming address before it matches a route (the real function, not a stand-in).
    const pathOf = (url: string) => extractExpoPathFromURL([], url);
    expect(pathOf('https://wawuafrica.com/selfie')).toBe('selfie');
    expect(pathOf('wawu://selfie')).toBe('selfie');
    expect(pathOf('https://wawuafrica.com/r/lennox')).toBe('r/lennox');
    expect(pathOf('wawu://r/lennox')).toBe('r/lennox');
  });
});
