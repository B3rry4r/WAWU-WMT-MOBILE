import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { render } from '@testing-library/react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import RootLayout from '@/app/_layout';
import ComponentsRoute from '@/app/dev/components';
import ForgotPasswordRoute from '@/app/forgot-password';
import AuthPreview from '@/app/preview/auth';
import SignInRoute from '@/app/sign-in';
import WelcomeRoute from '@/app/welcome';
import AccountTypeRoute from '@/app/account-type';
import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Explore from '@/app/(tabs)/explore';
import Inbox from '@/app/(tabs)/inbox';
import Wallet from '@/app/(tabs)/wallet';
import Me from '@/app/(tabs)/me';
import { resetSessionForTests } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { SignInScreen } from '@/features/auth/SignInScreen';

const mockVault = new Map<string, string>();
/** While set, every read of the vault waits for it: a slow phone keystore. */
let mockVaultGate: Promise<void> | null = null;

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));

// Home reads the Hub once signed in (HOME-01). These tests are about the route guard, not
// Home's data, so every request goes to a closed local port and never leaves the machine.
jest.mock('@/api/env', () => ({ apiBaseUrl: 'http://127.0.0.1:9', identityBaseUrl: 'http://127.0.0.1:9' }));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    if (mockVaultGate) await mockVaultGate;
    return mockVault.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  'account-type': AccountTypeRoute,
  'sign-in': SignInRoute,
  'forgot-password': ForgotPasswordRoute,
  'preview/auth': AuthPreview,
  'dev/components': ComponentsRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
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
  mockVaultGate = null;
  resetSessionForTests();
  jest.mocked(SplashScreen.hideAsync).mockClear();
});

describe('a release build leaves the development-only routes', () => {
  const globals = globalThis as unknown as { __DEV__: boolean };
  beforeEach(() => {
    globals.__DEV__ = false;
  });
  afterEach(() => {
    globals.__DEV__ = true;
  });

  it.each(['/preview/auth', '/dev/components'])('a signed-out visitor to %s lands on the welcome screen, not a blank page', async (url) => {
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByTestId('welcome-sign-in')).not.toBeNull();
  });

  it.each(['/preview/auth', '/dev/components'])('a signed-in visitor to %s lands on Home', async (url) => {
    signedIn();
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
  });
});

describe('nothing is drawn until the stored session has been read', () => {
  let open: () => void = () => undefined;
  const slowVault = () => {
    mockVaultGate = new Promise<void>((resolve) => {
      open = resolve;
    });
  };

  it('a signed-in user on a slow keystore sees neither sign in nor Home until the read finishes, then only Home', async () => {
    signedIn();
    slowVault();
    const hide = jest.mocked(SplashScreen.hideAsync);
    await renderRouter(routes);
    expect(screen.queryByText('Welcome back')).toBeNull();
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(hide).not.toHaveBeenCalled();
    await act(async () => open());
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
    expect(hide).toHaveBeenCalled();
  });

  it('a signed-out user on a slow keystore sees nothing until the read finishes, then the welcome screen', async () => {
    slowVault();
    await renderRouter(routes);
    expect(screen.queryByText('Create. Sell. Get paid. Connect. Grow.')).toBeNull();
    expect(screen.queryByText('Welcome back')).toBeNull();
    expect(jest.mocked(SplashScreen.hideAsync)).not.toHaveBeenCalled();
    await act(async () => open());
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
  });
});

describe('the keyboard', () => {
  const noop = async () => undefined;
  const shown = (ui: React.ReactElement) =>
    render(ui, {
      wrapper: ({ children }) => (
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
          {children}
        </SafeAreaProvider>
      ),
    });

  it('A23 opens with the email field focused, A22 does not steal focus', async () => {
    await renderRouter(routes, { initialUrl: '/forgot-password' });
    await waitFor(() => expect(screen.getByTestId('forgot-email').props.autoFocus).toBe(true));
    expect(screen.queryByTestId('sign-in-email')).toBeNull();
  });

  it('A22 leaves the email field unfocused until the user taps it', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByTestId('sign-in-email')).toBeTruthy());
    expect(screen.getByTestId('sign-in-email').props.autoFocus).toBeFalsy();
  });

  /** Where the focused field sits in the form: the screen reports it when asked, as the phone does. */
  const fieldSitsAt = (y: number) => {
    jest.spyOn(ScrollView.prototype, 'getInnerViewNode').mockReturnValue({} as never);
    jest.spyOn(View.prototype, 'measureLayout').mockImplementation(((_to: unknown, ok: (x: number, y: number, w: number, h: number) => void) =>
      ok(0, y, 350, 90)) as never);
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    scrollTo.mockClear();
    return scrollTo;
  };

  it('a user who focuses Password has the form scrolled to it, wherever a banner has pushed it', async () => {
    const scrollTo = fieldSitsAt(317);
    await shown(<SignInScreen onSignIn={noop} onForgot={() => undefined} />);
    await fireEvent(screen.getByTestId('sign-in-password'), 'focus', { nativeEvent: {} });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ y: 317 - 20, animated: false });
  });

  it('A23 scrolls its email field into view when it is focused', async () => {
    const scrollTo = fieldSitsAt(40);
    await shown(<ForgotPasswordScreen onSend={async () => ({ expiresInSeconds: null })} onBackToSignIn={() => undefined} />);
    await fireEvent(screen.getByTestId('forgot-email'), 'focus', { nativeEvent: {} });
    expect(scrollTo).toHaveBeenCalledWith({ y: 40 - 20, animated: false });
  });
});

describe('signed-in screens outside the tabs (SHARED-CHANGES EXPLORE-01 #2, ME-11 #3)', () => {
  /** Each route's own screen, without the route file's own sign-in check, so only the route graph decides. */
  const plain = (title: string) =>
    function Plain() {
      return (
        <View>
          <Text accessibilityRole="header">{title}</Text>
        </View>
      );
    };
  const guarded = {
    ...routes,
    categories: plain('Categories'),
    'add-work': plain('Add a work'),
    'works/[wawuId]/index': plain('Works'),
    'works/[wawuId]/[workId]': plain('One work'),
  };
  const cases: [string, string][] = [
    ['/categories', 'Categories'],
    ['/add-work', 'Add a work'],
    ['/works/u1', 'Works'],
    ['/works/u1/w1', 'One work'],
  ];

  it.each(cases)('a signed-out visitor to %s lands on the welcome screen', async (url, title) => {
    await renderRouter(guarded, { initialUrl: url });
    await waitFor(() => expect(screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy());
    expect(screen.queryByRole('header', { name: title })).toBeNull();
  });

  it.each(cases)('a signed-in visitor to %s sees it', async (url, title) => {
    signedIn();
    await renderRouter(guarded, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: title })).toBeTruthy());
  });
});
