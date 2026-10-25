import { act, fireEvent, render, screen as native } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
import { resetSessionForTests, signIn, signOut } from '@/api/session';
import { ACCESS_KEY, REFRESH_KEY } from '@/api/tokenStore';
import { AccountTypeScreen, pickByKey } from '@/features/auth/AccountTypeScreen';
import { pickedAccountType, clearAccountType } from '@/features/auth/accountType';

const mockVault = new Map<string, string>();

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

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
};

const HEADLINE = 'Get paid for what you know';
const TITLE = 'What brings you to Who Made This?';
let requests: string[] = [];
/** When set, POST /auth/login answers with tokens; otherwise every request fails as if offline. */
let loginWorks = false;
const tokens = { data: { accessToken: 'access-1', refreshToken: 'refresh-1' } };

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockVault.clear();
  resetSessionForTests();
  clearAccountType();
  requests = [];
  loginWorks = false;
  mockScheme = 'dark';
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    requests.push(url);
    if (loginWorks && new URL(url).pathname === '/auth/login') {
      return new Response(JSON.stringify(tokens), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new TypeError('Network request failed');
  }) as typeof fetch;
});

const press = (name: string, role: 'button' | 'link' = 'button') => fireEvent.press(screen.getByRole(role, { name }));

describe('A1: welcome', () => {
  it('a user who opens the app signed out sees the headline, the line under it and both buttons', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    expect(screen.getByText('Sell your work and answer paid questions.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('image', { name: 'Who Made This?' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it.each(['light', 'dark'] as const)('a user sees the website picture as the cover, under the shade, in the %s theme (BRAND-01)', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    const cover = native.getByTestId('welcome-cover', { includeHiddenElements: true });
    expect([cover.props.source].flat()[0]).toEqual(require('../../assets/images/welcome-cover.jpg'));
    expect(cover.props.contentFit).toBe('cover');
    const style = StyleSheet.flatten(cover.props.style);
    expect(style).toMatchObject({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
    // The picture is the first thing drawn in the screen, so the shade, the words and the buttons are over it.
    const root = native.getByTestId('welcome');
    const layers = [...root.props.children]
      .flat()
      .filter(Boolean)
      .map((child: { props: { testID?: string; colors?: unknown } }) => child.props.testID ?? (child.props.colors ? 'shade' : 'other'))
      .filter((layer: string) => layer !== 'other');
    expect(layers.slice(0, 2)).toEqual(['welcome-cover', 'shade']);
  });

  it('says nothing that no source backs: no bank claim', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    expect(screen.queryByText(/bank/i)).toBeNull();
    expect(screen.queryByText(/wawu/i)).toBeNull();
  });

  it('a user can tap Create an account and reach A2', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    expect(screen.queryByText(HEADLINE)).toBeNull();
  });

  it('a user can tap Sign in and reach A22, with a Back button that returns to the welcome screen', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('makes no request to any server', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    expect(requests).toEqual([]);
  });

  it.each(['/', '/welcome', '/account-type'])('a signed-in user who opens %s lands on Home, never on the welcome screen or A2', async (url) => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByText(HEADLINE)).toBeNull();
    expect(screen.queryByText(TITLE)).toBeNull();
  });
});

describe('A22 to A2', () => {
  it('a user on A22 can tap New here? Create an account and reach A2, and Back returns to A22', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    expect(screen.getByText(/New here\?/)).toBeTruthy();
    await press('Create an account', 'link');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
  });

  it('A22 reached from the welcome screen has a Back button', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('A22 opened with no screen behind it still has a Back button, and it goes to the welcome screen (RELEASE-02, CHECK-3 L-8; this one assertion pinned "no Back button")', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
  });
});

describe('A2: why you are here', () => {
  const open = async () => {
    await renderRouter(routes, { initialUrl: '/account-type' });
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
  };
  const discover = () => screen.getByRole('radio', { name: /here to discover/ });
  const earn = () => screen.getByRole('radio', { name: /want to earn/ });

  it('shows both cards with the canvas words, with no "Free." claim and no WAWU name', async () => {
    await open();
    expect(screen.getByText("I'm here to discover")).toBeTruthy();
    expect(screen.getByText('Follow creators, buy their work, use the wallet.')).toBeTruthy();
    expect(screen.getByText('I want to earn')).toBeTruthy();
    expect(screen.getByText('Sell content, take paid questions, host events.')).toBeTruthy();
    expect(screen.queryByText(/free/i)).toBeNull();
    expect(screen.queryByText(/wawu/i)).toBeNull();
  });

  it('a user can pick discover, then change to earn, and only one is picked at a time', async () => {
    await open();
    expect(discover().props.accessibilityState.checked).toBe(false);
    expect(earn().props.accessibilityState.checked).toBe(false);
    await fireEvent.press(discover());
    expect(discover().props.accessibilityState.checked).toBe(true);
    expect(earn().props.accessibilityState.checked).toBe(false);
    expect(pickedAccountType()).toBe('discover');
    await fireEvent.press(earn());
    expect(earn().props.accessibilityState.checked).toBe(true);
    expect(discover().props.accessibilityState.checked).toBe(false);
    expect(pickedAccountType()).toBe('earn');
  });

  it('draws Continue (AUTH-04 adds A3 behind it), which waits for a pick, and makes no request', async () => {
    await open();
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(earn());
    expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(false);
    expect(requests).toEqual([]);
  });

  it('a user who goes back from A2 to the welcome screen and returns finds the pick kept', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await fireEvent.press(earn());
    await press('Back');
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    expect(earn().props.accessibilityState.checked).toBe(true);
  });
});

describe('A2 with a screen after it', () => {
  const shown = (onContinue: (type: string) => void) =>
    render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <AccountTypeScreen onContinue={onContinue} />
      </SafeAreaProvider>,
    );

  it('Continue waits for a pick, then hands the pick on', async () => {
    const onContinue = jest.fn();
    await shown(onContinue);
    const button = native.getByRole('button', { name: 'Continue' });
    expect(button.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(button);
    expect(onContinue).not.toHaveBeenCalled();
    await act(async () => {
      await fireEvent.press(native.getByRole('radio', { name: /want to earn/ }));
    });
    await fireEvent.press(native.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledWith('earn');
  });
});

describe('the status bar follows the screen in front', () => {
  /**
   * React Native keeps one entry per mounted StatusBar and merges them in mount order,
   * the last one winning (`StatusBar._propsStack`, `mergePropsStack`); the merged result,
   * what the phone is told, is `StatusBar._currentValues`. The root layout's entry carries
   * the theme's style; A1's light entry must exist only while A1 is in front.
   */
  const barStyle = () => (StatusBar as unknown as { _currentValues: { barStyle: { value: string } } | null })._currentValues?.barStyle.value;
  const themeDefault = (scheme: 'light' | 'dark') => (scheme === 'dark' ? 'light-content' : 'dark-content');

  it.each(['light', 'dark'] as const)('in the %s theme, A1 has light icons, A2 has the theme default, Back to A1 is light again', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe('light-content'));
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe(themeDefault(scheme)));
    await press('Back');
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe('light-content'));
  });

  it.each(['light', 'dark'] as const)('in the %s theme, A22 reached from A1 has the theme default, Back to A1 is light again', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe(themeDefault(scheme)));
    await press('Back');
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe('light-content'));
  });
});

describe('the pick is never carried to the next person', () => {
  const earn = () => screen.getByRole('radio', { name: /want to earn/ });

  it('a sign-in that succeeds forgets the pick', async () => {
    loginWorks = true;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await fireEvent.press(earn());
    expect(pickedAccountType()).toBe('earn');
    await press('Back');
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'lennox@wawu.africa');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'a-long-password');
    await press('Sign in');
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(pickedAccountType()).toBeNull();
  });

  it('after a sign-out the next visitor finds nothing picked on A2', async () => {
    loginWorks = true;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await fireEvent.press(earn());
    // A session that starts by another way than A22 (the sign-up that AUTH-04 adds) keeps the pick until sign-out.
    await act(async () => {
      await signIn('lennox@wawu.africa', 'a-long-password');
    });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(pickedAccountType()).toBe('earn');
    await act(async () => {
      await signOut();
    });
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    expect(pickedAccountType()).toBeNull();
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    expect(earn().props.accessibilityState.checked).toBe(false);
  });
});

describe('A2 layout against the canvas', () => {
  it('the body starts 10 down from the bar, as auth.js line 10 draws it (pt: 10), with no extra space above the title', async () => {
    await render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <AccountTypeScreen />
      </SafeAreaProvider>,
    );
    let node = native.getByText(TITLE).parent;
    while (node && !node.props.contentContainerStyle) node = node.parent;
    const content = StyleSheet.flatten(node?.props.contentContainerStyle);
    expect(content.paddingTop).toBe(10);
    const title = StyleSheet.flatten(native.getByText(TITLE).props.style);
    expect(title.paddingTop ?? 0).toBe(0);
  });
});

describe('A2 from a keyboard (web)', () => {
  const key = (k: string) => ({ nativeEvent: { key: k }, preventDefault: jest.fn() });

  it.each([' ', 'Enter'])('a user can pick a focused card with %p', async (k) => {
    await renderRouter(routes, { initialUrl: '/account-type' });
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await fireEvent(screen.getByRole('radio', { name: /here to discover/ }), 'keyDown', key(k));
    expect(screen.getByRole('radio', { name: /here to discover/ }).props.accessibilityState.checked).toBe(true);
    expect(pickedAccountType()).toBe('discover');
  });

  it('any other key picks nothing', () => {
    const pick = jest.fn();
    (pickByKey(pick) as { onKeyDown: (e: ReturnType<typeof key>) => void }).onKeyDown(key('a'));
    expect(pick).not.toHaveBeenCalled();
  });
});
