import * as rtl from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WelcomeScreen } from '../WelcomeScreen';

/*
 * WELCOME-LOGO (R-119, 31 Oct 2026). This file pinned PREVIEWS-APP's data-cost rule for the welcome loop's player (2 s read-ahead while
 * the screen is under another one, the documented 20 once it plays). R-119 removes the video, so there is no player and no read-ahead to
 * pin: both cases are replaced by the one that still protects the phone's data on Android: opening the welcome screen asks expo-video
 * for no player at all, so nothing is downloaded or buffered, focused or not.
 */
const mockFocus = { value: true };
const mockPlayerCalls: unknown[][] = [];
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocus.value }));
jest.mock('expo-video', () => ({
  useVideoPlayer: (...args: unknown[]) => {
    mockPlayerCalls.push(args);
    return {};
  },
  VideoView: () => null,
}));

const screen = () => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <WelcomeScreen onCreateAccount={jest.fn()} onSignIn={jest.fn()} />
  </SafeAreaProvider>
);

beforeEach(() => {
  mockPlayerCalls.length = 0;
  mockFocus.value = true;
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('A1: the welcome screen on Android draws no video (R-119)', () => {
  it('a user opening the app gets no video player: nothing is read ahead, buffered or played', async () => {
    await rtl.render(screen());
    expect(rtl.screen.getByText('Create. Sell. Get paid. Connect. Grow.')).toBeTruthy();
    expect(mockPlayerCalls).toEqual([]);
    expect(rtl.screen.queryByTestId('welcome-video', { includeHiddenElements: true })).toBeNull();
    expect(rtl.screen.queryByTestId('welcome-video-view', { includeHiddenElements: true })).toBeNull();
  });

  it('a welcome screen under another screen, and again in front, still asks for no player', async () => {
    mockFocus.value = false;
    const view = await rtl.render(screen());
    expect(mockPlayerCalls).toEqual([]);
    mockFocus.value = true;
    await view.rerender(screen());
    mockFocus.value = false;
    await view.rerender(screen());
    expect(mockPlayerCalls).toEqual([]);
  });

  it('on a phone with a status bar and a navigation bar, the room for the mark starts under the status bar and the buttons clear the navigation bar', async () => {
    await rtl.render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 780 }, insets: { top: 28, left: 0, right: 0, bottom: 48 } }}>
        <WelcomeScreen onCreateAccount={jest.fn()} onSignIn={jest.fn()} />
      </SafeAreaProvider>,
    );
    expect(StyleSheet.flatten(rtl.screen.getByTestId('welcome-stage', { includeHiddenElements: true }).props.style).paddingTop).toBe(28);
    expect(StyleSheet.flatten(rtl.screen.getByTestId('welcome-buttons').props.style).paddingBottom).toBe(48);
    // A phone with no navigation bar still keeps 16 under the buttons.
    await rtl.cleanup();
    await rtl.render(screen());
    expect(StyleSheet.flatten(rtl.screen.getByTestId('welcome-buttons').props.style).paddingBottom).toBe(16);
  });
});
