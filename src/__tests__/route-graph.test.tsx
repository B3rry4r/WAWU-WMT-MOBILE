import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Appearance, Text, View, useColorScheme } from 'react-native';

import RootLayout, { THEME_READ_LIMIT_MS } from '@/app/_layout';
import AccountTypeRoute from '@/app/account-type';
import ForgotPasswordRoute from '@/app/forgot-password';
import SignInRoute from '@/app/sign-in';
import NotFoundRoute from '@/app/+not-found';
import WelcomeRoute from '@/app/welcome';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { THEME_KEY } from '@/features/settings/devicePrefs';

import appConfig from '../../app.json';

/**
 * SHARED-05: every signed-in screen that is not a tab sits under the route graph's signed-in guard, and
 * the Theme a person chose is applied before the first screen is drawn. The screens are plain stand-ins
 * with a header each, so only the route graph decides what shows (the route files carry no sign-in check).
 */

const mockVault = new Map<string, string>();
/** While set, a read of the theme waits for it: a slow phone store. */
let mockThemeGate: Promise<void> | null = null;

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('@/api/env', () => ({ apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    if (key === 'wmt.pref.theme' && mockThemeGate) await mockThemeGate;
    return mockVault.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const plain = (title: string) =>
  function Plain() {
    return (
      <View>
        <Text accessibilityRole="header">{title}</Text>
      </View>
    );
  };

const signedInOnly: [string, string][] = [
  ['/payout-account', 'Payout bank'],
  ['/edit-profile', 'Edit profile'],
  ['/social-links', 'Social links'],
  ['/open-wallet', 'Open wallet'],
  ['/open-wallet-details', 'Open wallet details'],
  ['/open-wallet-selfie', 'Open wallet selfie'],
  ['/open-wallet-account', 'Open wallet account'],
  ['/open-wallet-pin', 'Open wallet PIN'],
  ['/settings', 'Settings'],
  ['/settings/notifications', 'Settings notifications'],
  ['/settings/privacy', 'Settings privacy'],
  ['/settings/blocked', 'Settings blocked'],
  ['/settings/password', 'Settings password'],
];

const publicRoutes: [string, string][] = [
  ['/about', 'About'],
  ['/terms', 'Terms'],
  ['/privacy-policy', 'Privacy policy'],
];

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'account-type': AccountTypeRoute,
  'sign-in': SignInRoute,
  'forgot-password': ForgotPasswordRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'payout-account': plain('Payout bank'),
  'edit-profile': plain('Edit profile'),
  'social-links': plain('Social links'),
  'open-wallet': plain('Open wallet'),
  'open-wallet-details': plain('Open wallet details'),
  'open-wallet-selfie': plain('Open wallet selfie'),
  'open-wallet-account': plain('Open wallet account'),
  'open-wallet-pin': plain('Open wallet PIN'),
  'settings/index': plain('Settings'),
  'settings/notifications': plain('Settings notifications'),
  'settings/privacy': plain('Settings privacy'),
  'settings/blocked': plain('Settings blocked'),
  'settings/password': plain('Settings password'),
  about: plain('About'),
  terms: plain('Terms'),
  'privacy-policy': plain('Privacy policy'),
  '+not-found': NotFoundRoute,
};

const signedIn = () => {
  mockVault.set(ACCESS_KEY, 'stored-access');
  mockVault.set(REFRESH_KEY, 'stored-refresh');
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  mockThemeGate = null;
  resetSessionForTests();
});

describe('signed-in screens outside the tabs (SHARED-CHANGES WALLET-11 #2, ME-06 #3, KYC-05 R1, KYC-03 R1, KYC-04 R1, SETTINGS-01 #3)', () => {
  it.each(signedInOnly)('a signed-out visitor to %s lands on the welcome screen', async (url, title) => {
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByRole('header', { name: title })).toBeNull();
  });

  it.each(signedInOnly)('a signed-in visitor to %s sees it', async (url, title) => {
    signedIn();
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: title })).toBeTruthy());
  });
});

describe('About, Terms and Privacy policy are public (SHARED-CHANGES SETTINGS-02 R1)', () => {
  it.each(publicRoutes)('a signed-out visitor to %s reads it', async (url, title) => {
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: title })).toBeTruthy());
    expect(screen.queryByText('Create. Sell. Get paid. Connect. Grow.')).toBeNull();
  });

  it.each(publicRoutes)('a signed-in visitor to %s reads it', async (url, title) => {
    signedIn();
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: title })).toBeTruthy());
  });

  it('listing them does not change where the app opens: nobody signed in opens the welcome screen', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'About' })).toBeNull();
  });

  it('and a signed-in cold start still opens Home', async () => {
    signedIn();
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'About' })).toBeNull();
  });
});

describe('an address the app has no screen for (CHECK-1 F-1)', () => {
  it('a signed-out visitor lands on the welcome screen, not on Expo\'s "Unmatched Route" page', async () => {
    await renderRouter(routes, { initialUrl: '/no-such-place' });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByText('Unmatched Route')).toBeNull();
  });

  it('a signed-in visitor lands on Home', async () => {
    signedIn();
    await renderRouter(routes, { initialUrl: '/no-such-place/at-all' });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByText('Unmatched Route')).toBeNull();
  });

  it('the site map of every route file is not part of the app (extra.router.sitemap is off)', () => {
    expect(appConfig.expo.extra.router).toEqual({ sitemap: false });
  });
});

describe('the chosen theme applies before the first screen (SHARED-CHANGES SETTINGS-01 #3 (a))', () => {
  /** What the first screen sees, and what had been applied to the phone by the time it was drawn. */
  let applied: string[] = [];
  let seenAtFirstDraw: { scheme: string | null | undefined; appliedBefore: string[] } | null = null;
  function Probe() {
    const scheme = useColorScheme();
    seenAtFirstDraw ??= { scheme, appliedBefore: [...applied] };
    return (
      <View>
        <Text accessibilityRole="header">Probe</Text>
      </View>
    );
  }

  beforeEach(() => {
    applied = [];
    seenAtFirstDraw = null;
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation((choice) => {
      applied.push(String(choice));
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('a person who picked Dark has it applied, and nothing is drawn until then', async () => {
    mockVault.set(THEME_KEY, 'dark');
    let open: () => void = () => undefined;
    mockThemeGate = new Promise<void>((resolve) => {
      open = resolve;
    });
    await renderRouter({ ...routes, welcome: Probe });
    expect(screen.queryByRole('header', { name: 'Probe' })).toBeNull();
    expect(applied).toEqual([]);
    open();
    await waitFor(() => expect(screen.getByRole('header', { name: 'Probe' })).toBeTruthy());
    expect(applied).toEqual(['dark']);
    expect(seenAtFirstDraw!.appliedBefore).toEqual(['dark']);
  });

  it('a phone store that never answers does not hold the app forever: after the limit it opens following the phone (SHARED-05 L1)', async () => {
    mockVault.set(THEME_KEY, 'dark');
    mockThemeGate = new Promise<void>(() => undefined);
    await renderRouter({ ...routes, welcome: Probe });
    expect(screen.queryByRole('header', { name: 'Probe' })).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(THEME_READ_LIMIT_MS - 1);
    });
    expect(screen.queryByRole('header', { name: 'Probe' })).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Probe' })).toBeTruthy());
    expect(applied).toEqual([]);
  });

  it.each([
    ['light', 'light'],
    ['system', 'unspecified'],
  ])('a saved %s is applied as %s before the first screen', async (saved, native) => {
    mockVault.set(THEME_KEY, saved);
    await renderRouter({ ...routes, welcome: Probe });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Probe' })).toBeTruthy());
    expect(seenAtFirstDraw!.appliedBefore).toEqual([native]);
  });

  it('nothing saved follows the phone, and the app still opens', async () => {
    await renderRouter({ ...routes, welcome: Probe });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Probe' })).toBeTruthy());
    expect(seenAtFirstDraw!.appliedBefore).toEqual(['unspecified']);
  });

  it('an unreadable phone store still lets the app open', async () => {
    const store = jest.requireMock('expo-secure-store') as { getItemAsync: jest.Mock };
    store.getItemAsync.mockImplementation(async (key: string) => {
      if (key === 'wmt.pref.theme') throw new Error('keystore locked');
      return mockVault.get(key) ?? null;
    });
    await renderRouter({ ...routes, welcome: Probe });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Probe' })).toBeTruthy());
    expect(seenAtFirstDraw!.appliedBefore).toEqual(['unspecified']);
  });
});
