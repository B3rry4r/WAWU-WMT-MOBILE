import { act, fireEvent, render, screen as native } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { useVideoPlayer } from 'expo-video';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Platform, StatusBar, StyleSheet } from 'react-native';
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
import { welcomeLift } from '@/features/auth/WelcomeScreen';
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
   * Round 3 (owner, 29 Oct 2026, WELCOME-TEXT): the owner's own 15 s file replaces the 8 s one; the file case pins its hash and size.
   * Round 4 (owner, 30 Oct 2026, R-111, WELCOME-FULL): "remove the shade or container that pushes the video up and let the video be full
   * screen". The panel, its fade and the box above it are gone; the video is the whole screen and the words and buttons sit over it. The
   * cases that pinned the box and the panel are changed: the full-screen case (the root's children, no `welcome-stage`, no panel margin),
   * the panel and fade case (now: no panel, no shade, no gradient) and the words case (no panel to be inside).
   */
  const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
  const PLAYER = () => jest.mocked(useVideoPlayer).mock.results.at(-1)?.value as { play: jest.Mock; pause: jest.Mock; loop: boolean; muted: boolean };
  const flat = (testID: string) => StyleSheet.flatten(native.getByTestId(testID, { includeHiddenElements: true }).props.style);
  const idsOf = (node: { children: unknown[] }) => node.children.map((child) => (typeof child === 'string' ? undefined : (child as { props: { testID?: string } }).props.testID));

  it.each(['light', 'dark'] as const)('a person opening the app sees the welcome video fill the screen with the words and buttons over it, with no panel and no logo drawn by the app, in the %s theme (R-111)', async (scheme) => {
    mockScheme = scheme;
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    const root = native.getByTestId('welcome');
    // The screen is the video's own base purple behind everything, so nothing flashes before the first frame and any gap is purple, never black.
    expect(darkColors.surfaceWelcomeVideoBase).toBe('#280C41');
    expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(darkColors.surfaceWelcomeVideoBase);
    // The source is the approved asset itself, looping and silent.
    const [source, setup] = jest.mocked(useVideoPlayer).mock.calls[0] as [unknown, (p: { loop: boolean; muted: boolean }) => void];
    expect(source).toEqual(require('../../assets/video/welcome-loop.mp4'));
    const fake = { loop: false, muted: false };
    setup(fake);
    expect(fake).toMatchObject({ loop: true, muted: true });
    // The video is the first layer and fills the whole screen from its top edge (under the status bar) to its foot; the words and buttons
    // are the second layer, drawn over it. Cropped to fill and never stretched; no controls.
    expect(idsOf(root)).toEqual(['welcome-video', 'welcome-content']);
    expect(flat('welcome-video')).toEqual(FILL);
    expect(flat('welcome-content')).toMatchObject({ flex: 1, justifyContent: 'flex-end' });
    expect(idsOf(native.getByTestId('welcome-video'))).toEqual(['welcome-video-view']);
    const view = native.getByTestId('welcome-video-view', { includeHiddenElements: true });
    expect(view.props.contentFit).toBe('cover');
    expect(view.props.nativeControls).toBe(false);
    expect(view.props.pointerEvents).toBe('none');
    expect(view.props.player).toBe(PLAYER());
    expect(flat('welcome-video-view')).toEqual({ ...FILL, width: '100%', height: '100%' });
    // Named for the app, once, as an image; the layer takes no touches.
    expect(screen.getAllByRole('image', { name: 'Who Made This?' })).toHaveLength(1);
    expect(native.getByTestId('welcome-video').props.pointerEvents).toBe('none');
    // R-90's mark, its spacers and its glow, the photo before it, round 1's whole-screen layer and round 2's box, panel and fade are not drawn.
    for (const gone of ['welcome-mark', 'welcome-mark-art', 'welcome-above', 'welcome-below', 'welcome-cover', 'welcome-bottom', 'welcome-stage', 'welcome-panel', 'welcome-fade']) {
      expect(native.queryByTestId(gone, { includeHiddenElements: true })).toBeNull();
    }
  });

  it('plays the file the owner approved, byte for byte: 1080 x 1920, 15 s, no sound, never re-encoded (R-98, 29 Oct 2026)', () => {
    const file = readFileSync(join(__dirname, '../../assets/video/welcome-loop.mp4'));
    expect(file.length).toBe(4160801);
    expect(createHash('sha256').update(file).digest('hex')).toBe('fc533cb4ab104a9306e755c859c48c8b6817227980d4343e4eecebac79acd624');
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

  it('nothing sits between the video and the words: no panel, no shade, no gradient, no blur (R-111)', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    // The words' layers carry no colour of their own: the video shows straight through them.
    for (const id of ['welcome-content', 'welcome-words']) {
      const style = flat(id);
      expect(style.backgroundColor).toBeUndefined();
      expect(style.opacity).toBeUndefined();
    }
    // The only coloured thing on the whole screen besides the two buttons is the base purple behind the video.
    const tree = JSON.stringify(native.toJSON());
    expect(tree).not.toMatch(/blur/i);
    expect(tree).not.toMatch(/LinearGradient/);
    expect(native.queryByTestId('welcome-blur', { includeHiddenElements: true })).toBeNull();
    expect(native.queryByTestId('welcome-fade', { includeHiddenElements: true })).toBeNull();
    expect(native.queryByTestId('welcome-panel', { includeHiddenElements: true })).toBeNull();
    // The words and both buttons are drawn over the video: later in the screen than the video's layer.
    const kids = idsOf(native.getByTestId('welcome'));
    expect(kids.indexOf('welcome-content')).toBeGreaterThan(kids.indexOf('welcome-video'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-words'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-create'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-sign-in'));
  });

  describe('the mark and its orbit stay above the title (R-111)', () => {
    /** Phones the owner named, with the title's top edge as the screen lays it out with no home bar (measured in the web export). */
    const PHONES = [
      { width: 320, height: 568, wordsTop: 319.84, lift: 113 },
      { width: 360, height: 780, wordsTop: 531.84, lift: 58 },
      { width: 390, height: 844, wordsTop: 595.84, lift: 41 },
      { width: 430, height: 932, wordsTop: 683.84, lift: 18 },
    ];
    /** The foot of the lowest sticker as a share of the video's height: measured over the 15 s (0.729), and with a sticker's soft edge (0.74, what the screen uses). */
    const MEASURED_FOOT = 0.729;
    const WITH_EDGE = 0.74;
    const footOnScreen = ({ width, height }: { width: number; height: number }, lift: number, share: number) => {
      const shown = Math.max(height, (width * 1920) / 1080);
      return (height - shown) / 2 + share * shown - lift;
    };

    it.each(PHONES)('lifts the video by the room it is short on at $width x $height, so the lowest sticker ends above the title', (phone) => {
      const lift = welcomeLift(phone);
      expect(lift).toBe(phone.lift);
      // The measured foot, and its soft edge, end at least 12 above the title's top edge...
      expect(footOnScreen(phone, lift, MEASURED_FOOT)).toBeLessThanOrEqual(phone.wordsTop - 12);
      expect(footOnScreen(phone, lift, WITH_EDGE)).toBeLessThanOrEqual(phone.wordsTop - 12);
      // ...and the lift is no more than that needs: one pixel less would leave the soft edge inside the 12.
      expect(footOnScreen(phone, lift - 1, WITH_EDGE)).toBeGreaterThan(phone.wordsTop - 12);
    });

    it('never lowers the video: a screen with room to spare, and a title that sits far below, lift nothing', () => {
      expect(welcomeLift({ width: 390, height: 844, wordsTop: 700 })).toBe(0);
      expect(welcomeLift({ width: 430, height: 932, wordsTop: 900 })).toBe(0);
    });

    it('lifts more when the words stand higher (a home bar, a bigger system font), and the video is only moved, never scaled or cropped', async () => {
      expect(welcomeLift({ width: 390, height: 844, wordsTop: 595.84 - 34 })).toBeGreaterThan(welcomeLift({ width: 390, height: 844, wordsTop: 595.84 }));
      await renderRouter(routes);
      await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
      // Before the screen has been laid out the video sits at the top, as the one full-screen layer.
      expect(flat('welcome-video')).toEqual(FILL);
      const layout = (id: string, frame: { x: number; y: number; width: number; height: number }) =>
        act(() => {
          fireEvent(native.getByTestId(id), 'layout', { nativeEvent: { layout: frame } });
        });
      await layout('welcome', { x: 0, y: 0, width: 390, height: 844 });
      expect(flat('welcome-video')).toEqual(FILL);
      await layout('welcome-words', { x: 0, y: 595.84, width: 390, height: 114.16 });
      expect(flat('welcome-video')).toEqual({ ...FILL, transform: [{ translateY: -41 }] });
      // A home bar of 34 raises the words by 34 on a phone like that: the video follows by the same.
      await layout('welcome-words', { x: 0, y: 561.84, width: 390, height: 114.16 });
      expect(flat('welcome-video')).toEqual({ ...FILL, transform: [{ translateY: -75 }] });
      // The layer keeps its size on every lift: still the screen's four edges, the video inside still cover at 100%.
      expect(flat('welcome-video-view')).toEqual({ ...FILL, width: '100%', height: '100%' });
      expect(native.getByTestId('welcome-video-view', { includeHiddenElements: true }).props.contentFit).toBe('cover');
      // Roomy enough again: back to the top.
      await layout('welcome-words', { x: 0, y: 700, width: 390, height: 114.16 });
      expect(flat('welcome-video')).toEqual(FILL);
    });
  });

  describe('on Android (R-111, phone paths)', () => {
    let android: { restore: () => void };
    afterEach(() => android?.restore());

    it('the video fills the screen from the top edge, under the status bar, with no black showing anywhere, on a phone with a navigation bar', async () => {
      android = jest.replaceProperty(Platform, 'OS', 'android');
      await renderRouter(routes);
      await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
      // The layer is the screen's four edges from the top (the status bar is drawn over it, the app is edge to edge), with no margin or inset.
      expect(flat('welcome-video')).toEqual(FILL);
      expect(flat('welcome')).toMatchObject({ flex: 1, backgroundColor: darkColors.surfaceWelcomeVideoBase });
      // A texture view (it moves with the screen and takes the lift), covering its layer at full size.
      const view = native.getByTestId('welcome-video-view', { includeHiddenElements: true });
      expect(view.props.surfaceType).toBe('textureView');
      expect(view.props.contentFit).toBe('cover');
      expect(flat('welcome-video-view')).toEqual({ ...FILL, width: '100%', height: '100%' });
      // Lifted by a short phone's navigation bar, the video is moved and the strip it leaves is the base purple, not black.
      await act(async () => {
        fireEvent(native.getByTestId('welcome'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 780 } } });
        fireEvent(native.getByTestId('welcome-words'), 'layout', { nativeEvent: { layout: { x: 0, y: 499.84, width: 360, height: 114.16 } } });
      });
      expect(flat('welcome-video').transform).toEqual([{ translateY: -90 }]);
      const colours = JSON.stringify(native.toJSON()).match(/"backgroundColor":"[^"]+"/g) ?? [];
      expect(colours.every((c) => !/#000(000)?"|black|rgba\(0, ?0, ?0/i.test(c))).toBe(true);
      // The status bar is light and the words and buttons are over the video on Android too.
      await waitFor(() => expect((StatusBar as unknown as { _currentValues: { barStyle: { value: string } } | null })._currentValues?.barStyle.value).toBe('light-content'));
      expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-sign-in'));
    });
  });

  it('the words and buttons keep their copy, sizes and spacing, now straight over the video (R-98, R-111)', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText(HEADLINE)).toBeTruthy());
    expect(flat('welcome-words')).toMatchObject({ paddingHorizontal: 24, paddingBottom: 28 });
    const title = StyleSheet.flatten(screen.getByText(HEADLINE).props.style);
    expect(title).toMatchObject({ fontSize: 24, lineHeight: 24 * 1.05, letterSpacing: -0.04 * 24 });
    expect(title.color).toBe(darkColors.textOnAccent);
    const line = StyleSheet.flatten(screen.getByText('Create. Sell. Get paid. Grow.').props.style);
    expect(line).toMatchObject({ opacity: 0.8, lineHeight: 15 * 1.45 });
    expect(line.color).toBe(darkColors.textOnAccent);
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    // The words and the two buttons are in the one layer over the video, none beside it.
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-create'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-sign-in'));
    expect(native.getByTestId('welcome-content')).toContainElement(native.getByTestId('welcome-words'));
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
