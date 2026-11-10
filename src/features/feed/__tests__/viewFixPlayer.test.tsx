/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { audioLoadState, createLoadTracker, LOAD_PATIENCE_MS, videoLoadState } from '../player/loadState';

/*
 * VIEW-FIX (R-117) in the player module itself, as an Android phone with the real handlers: the phone's own full-screen video is asked for
 * through the player's view, and the players report their loading state (waiting, ready, failed) from what the phone's players say.
 */
type Listener = (payload?: unknown) => void;
const mockV = { listeners: new Map<string, Listener[]>(), status: 'idle', enter: jest.fn(() => Promise.resolve()), played: 0 };
const mockA = { listeners: [] as Listener[], isLoaded: false, isBuffering: false };

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  class VideoView extends React.Component<Record<string, unknown>> {
    enterFullscreen = () => mockV.enter();
    render() {
      return <View {...(this.props as object)} />;
    }
  }
  const player = {
    play: jest.fn(() => void (mockV.played += 1)),
    pause: jest.fn(),
    currentTime: 0,
    duration: 0,
    get status() {
      return mockV.status;
    },
    addListener: (event: string, fn: Listener) => {
      mockV.listeners.set(event, [...(mockV.listeners.get(event) ?? []), fn]);
      return { remove: () => mockV.listeners.set(event, (mockV.listeners.get(event) ?? []).filter((l) => l !== fn)) };
    },
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return { VideoView, useVideoPlayer: (_s: unknown, setup?: (p: unknown) => void) => React.useMemo(() => (setup?.(player), player), []) };
});
jest.mock('expo-audio', () => {
  const React = require('react');
  const player = {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(async () => undefined),
    setActiveForLockScreen: jest.fn(),
    get isLoaded() {
      return mockA.isLoaded;
    },
    get isBuffering() {
      return mockA.isBuffering;
    },
    addListener: (_e: string, fn: Listener) => {
      mockA.listeners.push(fn);
      return { remove: () => void (mockA.listeners = mockA.listeners.filter((l) => l !== fn)) };
    },
  };
  return { useAudioPlayer: () => React.useMemo(() => player, []), setAudioModeAsync: async () => undefined };
});

const { AudioSource, VideoSurface } = require('../player') as typeof import('../player');
const noop = () => undefined;
const settle = () => rtl.act(async () => void (await Promise.resolve()));

let os: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  os = jest.replaceProperty(Platform, 'OS', 'android');
  mockV.listeners = new Map();
  mockV.status = 'idle';
  mockV.enter.mockClear();
  mockV.played = 0;
  mockA.listeners = [];
  mockA.isLoaded = false;
  mockA.isBuffering = false;
});
afterEach(() => {
  os.restore();
  jest.useRealTimers();
});

describe('R-117 · what the players say about their file', () => {
  it('reads the phone players: loading and not loaded and buffering are waiting, an error is failed, anything else is ready; a stand-in that says nothing is not waiting', () => {
    expect(videoLoadState('loading')).toBe('waiting');
    expect(videoLoadState('readyToPlay')).toBe('ready');
    expect(videoLoadState('idle')).toBe('ready');
    expect(videoLoadState('error')).toBe('failed');
    expect(videoLoadState(undefined)).toBe('ready');
    expect(audioLoadState({ isLoaded: false })).toBe('waiting');
    expect(audioLoadState({ isLoaded: true, isBuffering: true })).toBe('waiting');
    expect(audioLoadState({ isLoaded: true, isBuffering: false })).toBe('ready');
    expect(audioLoadState({ error: 'Source error' })).toBe('failed');
    expect(audioLoadState({})).toBe('ready');
  });

  it('the tracker reports each change once, fails a wait that outlasts the patience, and does not unsay a failure when the player is stopped', () => {
    jest.useFakeTimers();
    const seen: string[] = [];
    const t = createLoadTracker((s) => seen.push(s));
    t.set('waiting');
    t.set('waiting');
    expect(seen).toEqual(['waiting']);
    jest.advanceTimersByTime(LOAD_PATIENCE_MS + 1);
    expect(seen).toEqual(['waiting', 'failed']);
    // The player keeps saying it is loading: the failure stays until a new ask.
    t.set('waiting');
    expect(seen).toEqual(['waiting', 'failed']);
    t.idle();
    expect(seen).toEqual(['waiting', 'failed']);
    t.begin();
    t.set('waiting');
    t.set('ready');
    expect(seen).toEqual(['waiting', 'failed', 'waiting', 'ready']);
    // A ready player holds no timer.
    jest.advanceTimersByTime(LOAD_PATIENCE_MS * 2);
    expect(seen).toHaveLength(4);
  });
});

describe('R-117 A · VideoSurface asks the view for the phone full-screen video (Android)', () => {
  const surface = (over: Partial<React.ComponentProps<typeof VideoSurface>> = {}) => <VideoSurface uri="https://files.example/a.mp4" playing seek={null} frosted={false} onTime={noop} onEnded={noop} testID="v" {...over} />;

  it('each new number is one request to enterFullscreen; the same number again, a re-render and a new surface asking nothing do not repeat it; the view allows any rotation', async () => {
    const view = await rtl.render(surface());
    expect(rtl.screen.getByTestId('v').props.fullscreenOptions).toEqual({ enable: true, orientation: 'default' });
    expect(mockV.enter).not.toHaveBeenCalled();
    await view.rerender(surface({ fullscreenAt: 1 }));
    expect(mockV.enter).toHaveBeenCalledTimes(1);
    await view.rerender(surface({ fullscreenAt: 1 }));
    expect(mockV.enter).toHaveBeenCalledTimes(1);
    await view.rerender(surface({ fullscreenAt: 2 }));
    expect(mockV.enter).toHaveBeenCalledTimes(2);
    // It does not pause or restart the player on the way in: the play state is the surface's, untouched.
    expect(mockV.played).toBe(1);
  });

  it('a view that refuses (or is gone) opens nothing and breaks nothing', async () => {
    mockV.enter.mockImplementationOnce(() => Promise.reject(new Error('no activity')));
    const view = await rtl.render(surface());
    await view.rerender(surface({ fullscreenAt: 1 }));
    await settle();
    expect(mockV.enter).toHaveBeenCalledTimes(1);
  });
});

describe('R-117 C · the players report their load state (Android)', () => {
  it('video: waiting while the player says loading and it is asked to play, ready when it is, failed on an error; nothing while it is only holding its first picture', async () => {
    const seen: string[] = [];
    mockV.status = 'loading';
    const idle = await rtl.render(<VideoSurface uri="https://files.example/a.mp4" playing={false} seek={null} frosted={false} onTime={noop} onEnded={noop} onLoad={(s) => seen.push(s)} />);
    await rtl.act(async () => (mockV.listeners.get('statusChange') ?? []).forEach((l) => l({ status: 'loading' })));
    expect(seen).toEqual([]);
    await idle.unmount();

    await rtl.render(<VideoSurface uri="https://files.example/a.mp4" playing seek={null} frosted={false} onTime={noop} onEnded={noop} onLoad={(s) => seen.push(s)} />);
    expect(seen).toEqual(['waiting']);
    await rtl.act(async () => (mockV.listeners.get('statusChange') ?? []).forEach((l) => l({ status: 'readyToPlay' })));
    expect(seen).toEqual(['waiting', 'ready']);
    await rtl.act(async () => (mockV.listeners.get('statusChange') ?? []).forEach((l) => l({ status: 'error' })));
    expect(seen).toEqual(['waiting', 'ready', 'failed']);
  });

  it('audio: waiting while the file is not loaded or is buffering, ready when the sound runs, failed on an error', async () => {
    const seen: string[] = [];
    const status = (over: Record<string, unknown>) => rtl.act(async () => mockA.listeners.forEach((l) => l({ currentTime: 0, duration: 30, playing: false, didJustFinish: false, isLoaded: true, isBuffering: false, error: null, ...over })));
    await rtl.render(<AudioSource uri="https://files.example/a.mp3" playing seek={null} onTime={noop} onEnded={noop} onLoad={(s) => seen.push(s)} />);
    await settle();
    expect(seen).toEqual(['waiting']);
    await status({ isLoaded: true, isBuffering: true });
    expect(seen).toEqual(['waiting']);
    await status({ playing: true });
    expect(seen).toEqual(['waiting', 'ready']);
    await status({ playing: false, isBuffering: true });
    expect(seen).toEqual(['waiting', 'ready', 'waiting']);
    await status({ playing: false, error: 'Source error' });
    expect(seen).toEqual(['waiting', 'ready', 'waiting', 'failed']);
  });
});
