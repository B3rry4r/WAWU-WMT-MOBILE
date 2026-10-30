/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FRAME_BUFFER, PLAY_BUFFER } from '@/features/feed/player/buffer';

import { WelcomeScreen } from '../WelcomeScreen';

/*
 * PREVIEWS-APP (data cost): the welcome loop's player follows the same read-ahead rule as the feed's: two seconds while the screen is
 * not in front (it stays mounted under the screens pushed on it), the documented 20 once it plays, and it is not narrowed again when
 * another screen is pushed. Android's own setup callback is the real one (the mock runs it).
 */
const mockFocus = { value: true };
const mockPlayers: Record<string, unknown>[] = [];
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocus.value }));
jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useVideoPlayer: (_source: unknown, setup?: (p: Record<string, unknown>) => void) =>
      React.useMemo(() => {
        const p = { play: jest.fn(), pause: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) };
        setup?.(p);
        mockPlayers.push(p);
        return p;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []),
    VideoView: (props: Record<string, unknown>) => <View {...props} />,
  };
});

const screen = () => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <WelcomeScreen onCreateAccount={jest.fn()} onSignIn={jest.fn()} />
  </SafeAreaProvider>
);
const bufferOf = () => (mockPlayers[0] as { bufferOptions: unknown }).bufferOptions;

beforeEach(() => {
  mockPlayers.length = 0;
  mockFocus.value = true;
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('A1: the welcome loop (Android)', () => {
  it('a user opening the app gets the loop playing with the documented 20 s read', async () => {
    await rtl.render(screen());
    expect(mockPlayers).toHaveLength(1);
    expect((mockPlayers[0] as { play: jest.Mock }).play).toHaveBeenCalled();
    expect(bufferOf()).toBe(PLAY_BUFFER);
  });

  it('a welcome screen that is under another screen reads only two seconds, and widens when it comes back to the front, then keeps it', async () => {
    mockFocus.value = false;
    const view = await rtl.render(screen());
    expect(bufferOf()).toBe(FRAME_BUFFER);
    expect((mockPlayers[0] as { play: jest.Mock }).play).not.toHaveBeenCalled();
    mockFocus.value = true;
    await view.rerender(screen());
    expect(bufferOf()).toBe(PLAY_BUFFER);
    mockFocus.value = false;
    await view.rerender(screen());
    expect(bufferOf()).toBe(PLAY_BUFFER);
    expect(mockPlayers).toHaveLength(1);
  });
});
