/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AudioSource, canPlay, loadPeaks, VideoSurface } from '../player';

type Listener = (payload?: unknown) => void;

/** A stand-in player that records what the module asks of it and lets a test fire the player's events. */
function fakePlayer() {
  const listeners = new Map<string, Listener[]>();
  const calls: string[] = [];
  let position = 0;
  const writes: number[] = [];
  const player = {
    get currentTime() {
      return position;
    },
    set currentTime(to: number) {
      position = to;
      writes.push(to);
      calls.push(`currentTime ${to}`);
    },
    duration: 0,
    loop: true,
    timeUpdateEventInterval: 0,
    staysActiveInBackground: true,
    showNowPlayingNotification: true,
    play: jest.fn(() => calls.push('play')),
    pause: jest.fn(() => calls.push('pause')),
    seekTo: jest.fn((to: number) => {
      calls.push(`seekTo ${to}`);
      return Promise.resolve();
    }),
    addListener: jest.fn((event: string, fn: Listener) => {
      listeners.set(event, [...(listeners.get(event) ?? []), fn]);
      return { remove: jest.fn(() => listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn))) };
    }),
  };
  const fire = (event: string, payload?: unknown) => (listeners.get(event) ?? []).forEach((l) => l(payload));
  const count = (event: string) => (listeners.get(event) ?? []).length;
  return { player, fire, count, calls, writes, setup: false };
}

let mockVideo = fakePlayer();
let mockAudio = fakePlayer();
let mockVideoSource: unknown = null;
let mockAudioSource: unknown = null;

jest.mock('expo-video', () => {
  const { View } = require('react-native');
  return {
    useVideoPlayer: (source: unknown, setup: (p: unknown) => void) => {
      mockVideoSource = source;
      if (!mockVideo.setup) {
        mockVideo.setup = true;
        setup(mockVideo.player);
      }
      return mockVideo.player;
    },
    VideoView: (props: Record<string, unknown>) => <View {...props} />,
  };
});

jest.mock('expo-audio', () => ({
  useAudioPlayer: (source: unknown) => {
    mockAudioSource = source;
    return mockAudio.player;
  },
}));

const noop = () => undefined;

beforeEach(() => {
  mockVideo = fakePlayer();
  mockAudio = fakePlayer();
  mockVideoSource = null;
  mockAudioSource = null;
});

describe('H2 · H5 · the phone plays a video', () => {
  it('can play: the post draws its controls', () => {
    expect(canPlay).toBe(true);
  });

  const surface = (over: Partial<React.ComponentProps<typeof VideoSurface>> = {}) => (
    <VideoSurface uri="https://files.example/a.mp4" playing seek={null} frosted={false} onTime={noop} onEnded={noop} testID="v" {...over} />
  );

  it('plays the file it is given, once, without loop or background play, and reports every quarter second', async () => {
    await rtl.render(surface());
    expect(mockVideoSource).toBe('https://files.example/a.mp4');
    expect(mockVideo.player.loop).toBe(false);
    expect(mockVideo.player.timeUpdateEventInterval).toBe(0.25);
    expect(mockVideo.player.staysActiveInBackground).toBe(false);
    expect(mockVideo.player.showNowPlayingNotification).toBe(false);
    expect(mockVideo.player.play).toHaveBeenCalledTimes(1);
  });

  it('draws the picture without the phone own controls, filling the frame', async () => {
    await rtl.render(surface());
    const view = rtl.screen.getByTestId('v');
    expect(view.props.nativeControls).toBe(false);
    expect(view.props.contentFit).toBe('cover');
    expect(StyleSheet.flatten(view.props.style).filter).toBeUndefined();
  });

  it('a user can pause and play it again: playing follows the post', async () => {
    const view = await rtl.render(surface({ playing: false }));
    expect(mockVideo.player.pause).toHaveBeenCalled();
    expect(mockVideo.player.play).not.toHaveBeenCalled();
    await view.rerender(surface({ playing: true }));
    expect(mockVideo.player.play).toHaveBeenCalledTimes(1);
    await view.rerender(surface({ playing: false }));
    expect(mockVideo.calls.slice(-1)).toEqual(['pause']);
  });

  it('reports the position and the length as the file plays, and 0 for a length it has not read', async () => {
    const onTime = jest.fn();
    await rtl.render(surface({ onTime }));
    mockVideo.player.currentTime = 12.5;
    mockVideo.player.duration = 80;
    await rtl.act(async () => mockVideo.fire('timeUpdate', { currentTime: 12.5 }));
    expect(onTime).toHaveBeenLastCalledWith(12.5, 80);
    mockVideo.player.duration = Number.NaN;
    await rtl.act(async () => mockVideo.fire('sourceLoad'));
    expect(onTime).toHaveBeenLastCalledWith(12.5, 0);
    mockVideo.player.duration = 0;
    await rtl.act(async () => mockVideo.fire('statusChange'));
    expect(onTime).toHaveBeenLastCalledWith(12.5, 0);
  });

  it('says so when the file plays to its end', async () => {
    const onEnded = jest.fn();
    await rtl.render(surface({ onEnded }));
    await rtl.act(async () => mockVideo.fire('playToEnd'));
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('a user can scrub: a seek moves the file once, before it plays again, and the same request does not move it twice', async () => {
    const view = await rtl.render(surface({ playing: false }));
    mockVideo.calls.length = 0;
    await view.rerender(surface({ playing: true, seek: { to: 30, at: 1 } }));
    expect(mockVideo.calls).toEqual(['currentTime 30', 'play']);
    await view.rerender(surface({ playing: true, seek: { to: 30, at: 1 }, onTime: jest.fn() }));
    expect(mockVideo.writes).toEqual([30]);
    await view.rerender(surface({ playing: true, seek: { to: 30, at: 2 } }));
    expect(mockVideo.writes).toEqual([30, 30]);
  });

  it('frosts the frame when the preview has ended (H5): blurred and grown past the edges', async () => {
    await rtl.render(surface({ frosted: true }));
    const style = StyleSheet.flatten(rtl.screen.getByTestId('v').props.style);
    expect(style.filter).toEqual([{ blur: 22 }]);
    expect(style.transform).toEqual([{ scale: 1.15 }]);
  });

  it('lets go of its listeners when the post goes away', async () => {
    const view = await rtl.render(surface());
    expect(mockVideo.count('timeUpdate')).toBe(1);
    await view.unmount();
    expect(mockVideo.count('timeUpdate')).toBe(0);
    expect(mockVideo.count('playToEnd')).toBe(0);
  });
});

describe('H6 · the phone plays an audio post', () => {
  const source = (over: Partial<React.ComponentProps<typeof AudioSource>> = {}) => (
    <AudioSource uri="https://files.example/a.mp3" playing seek={null} onTime={noop} onEnded={noop} {...over} />
  );

  it('plays the file and draws nothing itself', async () => {
    const view = await rtl.render(source());
    expect(mockAudioSource).toBe('https://files.example/a.mp3');
    expect(mockAudio.player.play).toHaveBeenCalledTimes(1);
    expect(view.toJSON()).toBeNull();
  });

  it('reports the position and the length from the status, and the end', async () => {
    const onTime = jest.fn();
    const onEnded = jest.fn();
    await rtl.render(source({ onTime, onEnded }));
    await rtl.act(async () => mockAudio.fire('playbackStatusUpdate', { currentTime: 4, duration: 61, didJustFinish: false }));
    expect(onTime).toHaveBeenLastCalledWith(4, 61);
    expect(onEnded).not.toHaveBeenCalled();
    await rtl.act(async () => mockAudio.fire('playbackStatusUpdate', { currentTime: 61, duration: 61, didJustFinish: true }));
    expect(onEnded).toHaveBeenCalledTimes(1);
    await rtl.act(async () => mockAudio.fire('playbackStatusUpdate', { currentTime: 0, duration: Number.NaN, didJustFinish: false }));
    expect(onTime).toHaveBeenLastCalledWith(0, 0);
  });

  it('a user can pause and play it again', async () => {
    const view = await rtl.render(source({ playing: false }));
    expect(mockAudio.player.pause).toHaveBeenCalled();
    await view.rerender(source({ playing: true }));
    expect(mockAudio.player.play).toHaveBeenCalledTimes(1);
  });

  it('a user can move back and on: a seek moves the file once', async () => {
    const view = await rtl.render(source({ playing: true }));
    await view.rerender(source({ playing: true, seek: { to: 15, at: 1 } }));
    await view.rerender(source({ playing: true, seek: { to: 15, at: 1 }, onTime: jest.fn() }));
    expect(mockAudio.player.seekTo.mock.calls).toEqual([[15]]);
  });

  it('plays again from the top after it played to its end', async () => {
    const onEnded = jest.fn();
    const view = await rtl.render(source({ playing: true, onEnded }));
    await rtl.act(async () => mockAudio.fire('playbackStatusUpdate', { currentTime: 61, duration: 61, didJustFinish: true }));
    await view.rerender(source({ playing: false, onEnded }));
    mockAudio.calls.length = 0;
    await view.rerender(source({ playing: true, onEnded }));
    await rtl.waitFor(() => expect(mockAudio.calls).toEqual(['seekTo 0', 'play']));
  });

  it('lets go of its listener when the post goes away', async () => {
    const view = await rtl.render(source());
    expect(mockAudio.count('playbackStatusUpdate')).toBe(1);
    await view.unmount();
    expect(mockAudio.count('playbackStatusUpdate')).toBe(0);
  });

  it('draws level bars: the phone has no decoder for a waveform', async () => {
    expect(await loadPeaks('https://files.example/a.mp3', 40)).toBeNull();
  });
});
