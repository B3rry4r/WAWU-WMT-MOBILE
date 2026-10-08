import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import SettingsRoute from '@/app/settings/index';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

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

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'settings/index': SettingsRoute,
};

/** The router's own view of where it is (what `toHavePathname` reads). */
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
  // The Hub and WAWU ID cannot be reached: every answer fails as if the phone were offline.
  globalThis.fetch = jest.fn(async () => {
    throw new TypeError('Network request failed');
  }) as typeof fetch;
});

describe('BRAND-01: Settings has a way in', () => {
  it('a signed-in user on the Me tab can tap Menu, then Settings, and land on Settings at /settings', async () => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: '/me' });
    await waitFor(() => expect(screen.getByTestId('me-menu-button')).toBeTruthy());
    expect(pathname()).toBe('/me');

    await fireEvent.press(screen.getByTestId('me-menu-button'));
    await fireEvent.press(await screen.findByTestId('me-menu-settings'));

    await waitFor(() => expect(pathname()).toBe('/settings'));
    expect(await screen.findByTestId('settings-screen')).toBeTruthy();
  });
});
