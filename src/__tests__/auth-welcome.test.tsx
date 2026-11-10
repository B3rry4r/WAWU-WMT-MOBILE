import { act, fireEvent, render, screen as native } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useVideoPlayer } from 'expo-video';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BackHandler, Platform, StatusBar, StyleSheet } from 'react-native';
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

/** The one line the welcome screen says (R-119); it was the headline 'The creators and professionals ecosystem.' with a second line before. */
const WELCOME_WORDS = 'Create. Sell. Get paid. Connect. Grow.';
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
  it('a user who opens the app signed out sees the mark, the one line under it and both buttons', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('image', { name: 'Who Made This?' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  /**
   * R-119 (owner, 31 Oct 2026, WELCOME-LOGO) replaces R-98 and R-111 here: no video, the app's own mark, one line, the two buttons. The
   * cases that pinned the video are replaced by the cases below; each one that changed, and why, is named in tasks/WELCOME-LOGO.md:
   * the whole-screen video case (the root's layers, the base purple behind the video, the player's loop and mute setup), the file's
   * hash and size, the play-and-pause-with-focus case, the "nothing between the video and the words" case, the lift cases (`welcomeLift`
   * is gone with the video) and the Android video case are now the cases for the mark, its centring, its page colour, no player, the
   * one line, and the phone's Back; the words-and-buttons case keeps its spacing and its buttons and drops the headline, the title's size
   * and the line's 0.8 opacity.
   */
  const PLAYER_CALLS = () => jest.mocked(useVideoPlayer).mock.calls;
  const flat = (testID: string) => StyleSheet.flatten(native.getByTestId(testID, { includeHiddenElements: true }).props.style);
  const idsOf = (node: { children: unknown[] }) => node.children.map((child) => (typeof child === 'string' ? undefined : (child as { props: { testID?: string } }).props.testID));

  it.each(['light', 'dark'] as const)('a person opening the app sees the app\'s own mark on the darkest page, one line under it and both buttons, with no video, no headline and no panel, in the %s theme (R-119)', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    const root = native.getByTestId('welcome');
    // The page is the app's darkest surface in both themes (the screen is always dark), nothing else colours it.
    expect(darkColors.surfacePage).toBe('#0B0A0D');
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({ flex: 1, backgroundColor: darkColors.surfacePage });
    // Two layers, the mark's room first and the words and buttons at the foot, with nothing else between or behind them.
    expect(idsOf(root)).toEqual(['welcome-stage', 'welcome-content']);
    // The mark is the app's own (BrandMark, the sticker cut for a dark page, the artwork the Explore header draws), named for the app once.
    const art = native.getByTestId('welcome-mark-art', { includeHiddenElements: true });
    expect([art.props.source].flat()[0]).toEqual(require('../../assets/brand/submark-sticker.png'));
    expect(art.props.contentFit).toBe('contain');
    expect(screen.getAllByRole('image', { name: 'Who Made This?' })).toHaveLength(1);
    expect(native.getByTestId('welcome-mark').props.accessibilityLabel).toBe('Who Made This?');
    // The layer that holds the mark takes no touches, so it never sits over a button.
    expect(native.getByTestId('welcome-stage', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
    // One line, the owner's words, and no other title.
    expect(screen.getAllByText(WELCOME_WORDS)).toHaveLength(1);
    expect(screen.queryByText(/creators and professionals/i)).toBeNull();
    expect(screen.queryByText('Create. Sell. Get paid. Grow.')).toBeNull();
    // No video: no player was asked for, no video layer, panel, fade, shade, gradient or blur is drawn.
    expect(PLAYER_CALLS()).toHaveLength(0);
    for (const gone of ['welcome-video', 'welcome-video-view', 'welcome-panel', 'welcome-fade', 'welcome-blur', 'welcome-cover', 'welcome-bottom']) {
      expect(native.queryByTestId(gone, { includeHiddenElements: true })).toBeNull();
    }
    const tree = JSON.stringify(native.toJSON());
    expect(tree).not.toMatch(/blur|LinearGradient|VideoView|RCTVideo/i);
    // Both buttons are in the foot layer, under the line.
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-words'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-create'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-sign-in'));
  });

  it('the welcome video is no longer a bundled requirement of the screen: the screen module reads no video file and no player (R-119)', () => {
    const source = readFileSync(join(__dirname, '../features/auth/WelcomeScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/welcome-loop|expo-video|useVideoPlayer|VideoView|welcomeLift|surfaceWelcomeVideoBase/);
    // The owner's file stays in the repo, untouched (removing it is its own task): the same bytes as when it was approved.
    const file = readFileSync(join(__dirname, '../../assets/video/welcome-loop.mp4'));
    expect(file.length).toBe(4160801);
    expect(createHash('sha256').update(file).digest('hex')).toBe('fc533cb4ab104a9306e755c859c48c8b6817227980d4343e4eecebac79acd624');
  });

  it('the mark is centred across, and centred down between the top safe area and the words: equal room above and below, at least 16 below on a short phone', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    // The stage is the room above the words (the layout gives it everything the words and buttons leave) and starts under the safe area;
    // the mark sits between two spacers that share what the mark leaves, centred across.
    const stage = native.getByTestId('welcome-stage', { includeHiddenElements: true });
    expect(flat('welcome-stage')).toMatchObject({ flex: 1, alignItems: 'center' });
    expect(typeof flat('welcome-stage').paddingTop).toBe('number');
    expect(idsOf(stage)).toEqual(['welcome-above', 'welcome-mark', 'welcome-below']);
    expect(flat('welcome-above').flex).toBe(1);
    expect(flat('welcome-below').flex).toBe(flat('welcome-above').flex);
    // The only difference between the spacers: a short phone keeps 16 below the mark, whatever the share, so the mark never touches the words.
    expect(flat('welcome-below').minHeight).toBe(16);
    expect(flat('welcome-above').minHeight).toBeUndefined();
    // The mark is its own 120 wide (the owner's picture: a little under a third of the width), never squeezed and never lifted by a transform.
    expect(flat('welcome-mark')).toMatchObject({ width: 120, flexShrink: 0 });
    expect(flat('welcome-mark').transform).toBeUndefined();
    expect(flat('welcome-mark').position).toBeUndefined();
    // The stage is the first layer and the words the second, so the words' top edge bounds the room from below.
    expect(idsOf(native.getByTestId('welcome'))).toEqual(['welcome-stage', 'welcome-content']);
    expect(native.getByTestId('welcome-content').props.style).toBeUndefined();
  });

  describe('on Android (R-119, phone paths)', () => {
    let android: { restore: () => void };
    let handlers: (() => boolean | null | undefined)[];
    let backSpy: jest.SpyInstance;
    /** The phone's Back: the handlers registered last answer first, and the first that says it handled the press ends it, as Android does. */
    const hardwareBack = async () => {
      let handled = false;
      await act(async () => {
        for (const handler of [...handlers].reverse()) {
          if (handler()) {
            handled = true;
            break;
          }
        }
      });
      return handled;
    };
    beforeEach(() => {
      handlers = [];
      backSpy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
        handlers.push(handler as () => boolean);
        return { remove: () => void handlers.splice(handlers.indexOf(handler as () => boolean), 1) };
      });
    });
    afterEach(() => {
      android?.restore();
      backSpy.mockRestore();
    });

    it('the mark, the line and both buttons are drawn, the page is the dark surface, the bar is light, and no video player is asked for', async () => {
      android = jest.replaceProperty(Platform, 'OS', 'android');
      await renderRouter(routes);
      await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
      expect(flat('welcome')).toMatchObject({ flex: 1, backgroundColor: darkColors.surfacePage });
      expect(native.getByTestId('welcome-mark-art', { includeHiddenElements: true })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
      expect(PLAYER_CALLS()).toHaveLength(0);
      // The page is dark, so the status bar's icons are light, as they were over the video.
      await waitFor(() => expect((StatusBar as unknown as { _currentValues: { barStyle: { value: string } } | null })._currentValues?.barStyle.value).toBe('light-content'));
    });

    it('the phone\'s Back on the welcome screen is not taken by the screen (it leaves the app, as before), and Back from Sign in returns to it', async () => {
      android = jest.replaceProperty(Platform, 'OS', 'android');
      await renderRouter(routes);
      await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
      // At the root of the signed-out stack nothing handles the press, so Android takes it and leaves the app.
      expect(await hardwareBack()).toBe(false);
      expect(screen.getByText(WELCOME_WORDS)).toBeTruthy();
      await press('Sign in');
      await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
      // One step in, the same press goes back to the welcome screen.
      expect(await hardwareBack()).toBe(true);
      await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
      expect(screen.queryByText('Welcome back')).toBeNull();
      expect(await hardwareBack()).toBe(false);
    });
  });

  it('the line and the buttons keep their size and spacing, with the line centred and in white (R-119)', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    expect(flat('welcome-words')).toMatchObject({ paddingHorizontal: 24, paddingBottom: 28 });
    const line = StyleSheet.flatten(screen.getByText(WELCOME_WORDS).props.style);
    expect(line).toMatchObject({ fontSize: 15, lineHeight: 15 * 1.45, textAlign: 'center' });
    expect(line.opacity).toBeUndefined();
    expect(line.color).toBe(darkColors.textOnAccent);
    // The buttons are as they were: Create an account in the accent, Sign in in glass, both full width and 10 apart.
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(StyleSheet.flatten(native.getByTestId('welcome-create').props.style).backgroundColor).toBe(darkColors.accent);
    expect(StyleSheet.flatten(native.getByTestId('welcome-sign-in').props.style).backgroundColor).toBe(darkColors.surfaceGlass);
    expect(flat('welcome-buttons')).toMatchObject({ gap: 10, paddingHorizontal: 20 });
    // The words and the two buttons are in the one foot layer, none beside it.
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-create'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-sign-in'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-words'));
  });


  it('says nothing that no source backs: no bank claim', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    expect(screen.queryByText(/bank/i)).toBeNull();
    expect(screen.queryByText(/wawu/i)).toBeNull();
  });

  it('a user can tap Create an account and reach A2', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    expect(screen.queryByText(WELCOME_WORDS)).toBeNull();
  });

  it('a user can tap Sign in and reach A22, with a Back button that returns to the welcome screen', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    expect(screen.queryByText('Welcome back')).toBeNull();
  });

  it('makes no request to any server', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    expect(requests).toEqual([]);
  });

  it.each(['/', '/welcome', '/account-type'])('a signed-in user who opens %s lands on Home, never on the welcome screen or A2', async (url) => {
    mockVault.set(ACCESS_KEY, 'stored-access');
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByText(WELCOME_WORDS)).toBeNull();
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
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('A22 opened with no screen behind it still has a Back button, and it goes to the welcome screen (RELEASE-02, CHECK-3 L-8; this one assertion pinned "no Back button")', async () => {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Back');
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await fireEvent.press(earn());
    await press('Back');
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe('light-content'));
    await press('Create an account');
    await waitFor(() => expect(screen.getByText(TITLE)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe(themeDefault(scheme)));
    await press('Back');
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe('light-content'));
  });

  it.each(['light', 'dark'] as const)('in the %s theme, A22 reached from A1 has the theme default, Back to A1 is light again', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await press('Sign in');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe(themeDefault(scheme)));
    await press('Back');
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
    await waitFor(() => expect(barStyle()).toBe('light-content'));
  });
});

describe('the pick is never carried to the next person', () => {
  const earn = () => screen.getByRole('radio', { name: /want to earn/ });

  it('a sign-in that succeeds forgets the pick', async () => {
    loginWorks = true;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(WELCOME_WORDS)).toBeTruthy());
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
