import { act, fireEvent, render, screen as native } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useVideoPlayer } from 'expo-video';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { processColor, StatusBar, StyleSheet } from 'react-native';
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
import { darkColors } from '@/theme/tokens.generated';

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

const HEADLINE = 'The creators and professionals ecosystem.';
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
  jest.mocked(useVideoPlayer).mockClear();
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
    expect(screen.getByText('Create. Sell. Get paid. Grow.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('image', { name: 'Who Made This?' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  /**
   * R-98 replaces R-90 here. The two tests that followed ("a user sees the vertical mark with its glow in the middle of the dark
   * page ..." and "a user sees the mark centred between the top safe area and the headline ...") pinned the mark picture, its glow,
   * its spacers and its size, which are gone by the owner's ruling (27 Oct 2026); they are replaced by the tests below.
   * Their lasting lines are kept: one image role named for the app, a layer that takes no touches, and no photo.
   * Round 2 (owner, 27 Oct 2026, a new video and a bottom panel): the cases of round 1 that pinned the full-screen video under the
   * words and the fade that started 180 above the headline (the whole-screen fill, `welcome-bottom`, the dark page colour behind it,
   * the 15 s file's hash and size) are changed to the box above a panel, the panel, the new token and the 8 s file's hash and size.
   */
  const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
  const PLAYER = () => jest.mocked(useVideoPlayer).mock.results.at(-1)?.value as { play: jest.Mock; pause: jest.Mock; loop: boolean; muted: boolean };
  const flat = (testID: string) => StyleSheet.flatten(native.getByTestId(testID, { includeHiddenElements: true }).props.style);
  const idsOf = (node: { children: unknown[] }) => node.children.map((child) => (typeof child === 'string' ? undefined : (child as { props: { testID?: string } }).props.testID));

  it.each(['light', 'dark'] as const)('a user sees the approved video filling the screen above a bottom panel, with no logo drawn by the app, in the %s theme (R-98)', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    const root = native.getByTestId('welcome');
    // The screen is the video's own base purple behind everything, so nothing flashes before the first frame and any seam is purple.
    expect(darkColors.surfaceWelcomeVideoBase).toBe('#280C41');
    expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(darkColors.surfaceWelcomeVideoBase);
    // The source is the approved asset itself, looping and silent.
    const [source, setup] = jest.mocked(useVideoPlayer).mock.calls[0] as [unknown, (p: { loop: boolean; muted: boolean }) => void];
    expect(source).toEqual(require('../../assets/video/welcome-loop.mp4'));
    const fake = { loop: false, muted: false };
    setup(fake);
    expect(fake).toMatchObject({ loop: true, muted: true });
    // The video's box is the room above the panel from the top of the screen (under the status bar), plus the overlap behind the
    // panel's top edge; cropped to fill that box, never stretched; no controls.
    expect(idsOf(root)).toEqual(['welcome-stage', 'welcome-panel']);
    expect(flat('welcome-stage')).toMatchObject({ flex: 1 });
    expect(flat('welcome-panel').marginTop).toBeLessThan(0);
    expect(flat('welcome-panel').marginTop).toBeGreaterThanOrEqual(-24);
    expect(idsOf(native.getByTestId('welcome-stage'))).toEqual(['welcome-video']);
    const view = native.getByTestId('welcome-video-view', { includeHiddenElements: true });
    expect(view.props.contentFit).toBe('cover');
    expect(view.props.nativeControls).toBe(false);
    expect(view.props.pointerEvents).toBe('none');
    expect(view.props.player).toBe(PLAYER());
    expect(flat('welcome-video-view')).toEqual({ ...FILL, width: '100%', height: '100%' });
    expect(flat('welcome-video')).toEqual(FILL);
    // Named for the app, once, as an image; the layer takes no touches.
    expect(screen.getAllByRole('image', { name: 'Who Made This?' })).toHaveLength(1);
    expect(native.getByTestId('welcome-video').props.pointerEvents).toBe('none');
    // R-90's mark, its spacers and its glow, and the photo before it, are not drawn; nor the whole-screen layer of round 1.
    for (const gone of ['welcome-mark', 'welcome-mark-art', 'welcome-above', 'welcome-below', 'welcome-cover', 'welcome-bottom']) {
      expect(native.queryByTestId(gone, { includeHiddenElements: true })).toBeNull();
    }
  });

  it('plays the file the owner approved, byte for byte: 1080 x 1920, 8 s, no sound, never re-encoded (R-98)', () => {
    const file = readFileSync(join(__dirname, '../../assets/video/welcome-loop.mp4'));
    expect(file.length).toBe(2248484);
    expect(createHash('sha256').update(file).digest('hex')).toBe('7635695f56be909a65fa3c5ffa45c9867a96e5d9157cf837edd9c0a7029080ef');
  });

  it('the video plays while the welcome screen is in front and pauses when another screen is on it, and plays again on Back (R-98)', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await waitFor(() => expect(PLAYER().play).toHaveBeenCalledTimes(1));
    expect(PLAYER().pause).not.toHaveBeenCalled();
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await waitFor(() => expect(PLAYER().pause).toHaveBeenCalledTimes(1));
    expect(PLAYER().play).toHaveBeenCalledTimes(1);
    await press('Back');
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    await waitFor(() => expect(PLAYER().play).toHaveBeenCalledTimes(2));
    expect(PLAYER().pause).toHaveBeenCalledTimes(1);
  });

  it('the words and buttons sit in a solid panel at the bottom in the video\'s base purple, with a short fade from clear to that colour above its top edge, and no blur (R-98)', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    const panel = native.getByTestId('welcome-panel');
    // The fade is the lowest of the panel's three parts, so the words and the buttons are drawn over it; the panel is drawn over the video.
    expect(idsOf(panel)).toEqual(['welcome-fade', 'welcome-words', undefined]);
    expect(flat('welcome-panel')).toMatchObject({ backgroundColor: darkColors.surfaceWelcomeVideoBase });
    const fade = native.getByTestId('welcome-fade', { includeHiddenElements: true });
    // Clear at the top and the panel's colour at the foot (the same colour at strength 0, never the word "transparent": it blends through black).
    expect(fade.props.colors[0]).toBe(processColor(`${darkColors.surfaceWelcomeVideoBase}00`));
    expect(fade.props.colors.at(-1)).toBe(processColor(`${darkColors.surfaceWelcomeVideoBase}FF`));
    expect(fade.props.locations[0]).toBe(0);
    expect(fade.props.locations.at(-1)).toBe(1);
    expect(fade.props.startPoint[1]).toBeCloseTo(0);
    expect(fade.props.endPoint[1]).toBeCloseTo(1);
    // It only ever darkens: each stop is at least as strong as the one above it.
    const strengths = fade.props.colors.map((c: number) => (c >>> 24) & 0xff);
    expect([...strengths].sort((x, y) => x - y)).toEqual(strengths);
    // It is short, sits on the video and ends at the panel's top edge, and takes no touches.
    const { top, height } = flat('welcome-fade');
    expect(height).toBeGreaterThan(0);
    expect(height).toBeLessThanOrEqual(24);
    expect(top).toBe(-height);
    expect(flat('welcome-fade')).toMatchObject({ position: 'absolute', left: 0, right: 0 });
    expect(fade.props.pointerEvents).toBe('none');
    // No blur anywhere on the screen.
    expect(JSON.stringify(native.toJSON())).not.toMatch(/blur/i);
    expect(native.queryByTestId('welcome-blur', { includeHiddenElements: true })).toBeNull();
  });

  it('the words and buttons keep their copy, sizes and spacing, now inside the panel (R-98)', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    expect(flat('welcome-words')).toMatchObject({ paddingHorizontal: 24, paddingBottom: 28 });
    const title = StyleSheet.flatten(screen.getByText(HEADLINE).props.style);
    expect(title).toMatchObject({ fontSize: 34, lineHeight: 34 * 1.05, letterSpacing: -0.04 * 34 });
    expect(title.color).toBe(darkColors.textOnAccent);
    const line = StyleSheet.flatten(screen.getByText('Create. Sell. Get paid. Grow.').props.style);
    expect(line).toMatchObject({ opacity: 0.8, lineHeight: 15 * 1.45 });
    expect(line.color).toBe(darkColors.textOnAccent);
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    // The panel is the words and the two buttons (and the fade); both are in it, none beside it.
    expect(native.getByTestId('welcome-panel')).toContainElement(native.getByTestId('welcome-create'));
    expect(native.getByTestId('welcome-panel')).toContainElement(native.getByTestId('welcome-sign-in'));
    expect(native.getByTestId('welcome-panel')).toContainElement(native.getByTestId('welcome-words'));
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
