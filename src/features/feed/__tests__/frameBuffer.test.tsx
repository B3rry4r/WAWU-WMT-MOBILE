/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { VideoSurface } from '../player';
import { FRAME_BUFFER, PLAY_BUFFER } from '../player/buffer';

/*
 * PREVIEWS-APP verifier finding (data cost): expo-video's Android player buffers 50 s ahead even while paused, so a surface that only
 * shows a first picture used to pull the clip on every view. A surface that is not playing reads about two seconds; one that plays gets
 * the documented 20 s, and is not narrowed again when it pauses. Android's own setup callback is the real one (the mock runs it).
 */
const mockPlayers: Record<string, unknown>[] = [];
jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useVideoPlayer: (_source: string, setup?: (p: Record<string, unknown>) => void) =>
      React.useMemo(() => {
        const p = { play: jest.fn(), pause: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })), currentTime: 0, duration: 0 };
        setup?.(p);
        mockPlayers.push(p);
        return p;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []),
    VideoView: (props: Record<string, unknown>) => <View {...props} />,
  };
});
jest.mock('expo-audio', () => ({ useAudioPlayer: () => ({}) }));

const noop = () => undefined;
const surface = (playing: boolean) => <VideoSurface uri="https://cdn.test/previews/clip.mp4" playing={playing} seek={null} frosted={false} onTime={noop} onEnded={noop} testID="v" />;
const bufferOf = (i = 0) => (mockPlayers[i] as { bufferOptions: { preferredForwardBufferDuration: number } }).bufferOptions;

beforeEach(() => {
  mockPlayers.length = 0;
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('the phone player reads ahead only as far as it is used (Android)', () => {
  it('a user opening a page whose clip only shows its first picture reads about two seconds of it, not the default 50', async () => {
    await rtl.render(surface(false));
    expect(bufferOf()).toBe(FRAME_BUFFER);
    expect(bufferOf().preferredForwardBufferDuration).toBeLessThanOrEqual(3);
  });

  it('a clip that plays from the start reads the 20 s a player is documented to read', async () => {
    await rtl.render(surface(true));
    expect(bufferOf()).toBe(PLAY_BUFFER);
    expect(bufferOf().preferredForwardBufferDuration).toBe(20);
  });

  it('a clip that is started widens its read, and keeps it when the person pauses', async () => {
    const view = await rtl.render(surface(false));
    expect(bufferOf()).toBe(FRAME_BUFFER);
    await view.rerender(surface(true));
    expect(bufferOf()).toBe(PLAY_BUFFER);
    await view.rerender(surface(false));
    expect(bufferOf()).toBe(PLAY_BUFFER);
    expect(mockPlayers).toHaveLength(1);
  });
});
