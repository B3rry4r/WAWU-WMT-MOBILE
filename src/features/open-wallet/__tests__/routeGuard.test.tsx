import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import RootLayout from '@/app/_layout';
import AccountTypeRoute from '@/app/account-type';
import ForgotPasswordRoute from '@/app/forgot-password';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';

/**
 * KYC-06 round 2 (SHARED-CHANGES KYC-06 #1): the four screens after the selfie (A26 to A29) sit under the
 * signed-in guard. Signed out, none of them stays on screen (A26 and A27 used to wait on a skeleton for ever,
 * A28 said "Checking your details" with no way out). The screens are stand-ins, so only the route graph decides.
 */
const mockVault = new Map<string, string>();

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('@/api/env', () => ({ apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
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

const lastSteps: [string, string][] = [
  ['/open-wallet-id', 'Your ID document'],
  ['/open-wallet-address', 'Proof of address'],
  ['/open-wallet-checking', 'Checking your details'],
  ['/open-wallet-rejected', 'We could not open your wallet'],
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
  'open-wallet-id': plain('Your ID document'),
  'open-wallet-address': plain('Proof of address'),
  'open-wallet-checking': plain('Checking your details'),
  'open-wallet-rejected': plain('We could not open your wallet'),
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
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
});

describe('the last steps of Open your wallet are signed-in screens (SHARED-CHANGES KYC-06 #1)', () => {
  it.each(lastSteps)('a signed-out visitor to %s lands on the welcome screen', async (url, title) => {
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByRole('header', { name: title })).toBeNull();
  });

  it.each(lastSteps)('a signed-in visitor to %s sees it', async (url, title) => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: title })).toBeTruthy());
  });
});
