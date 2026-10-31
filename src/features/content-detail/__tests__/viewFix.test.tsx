/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FeedItem } from '@/features/feed/api';

// The gesture handler's own jest setup: the native module is not there under jest.
require('react-native-gesture-handler/jestSetup');

/*
 * VIEW-FIX (R-117), parts A and C on the piece page, run as an Android phone with the real handlers: the full-screen button on a video asks
 * the player's view for the phone's own full-screen video; a picture opens full screen on black with pinch, swipe, a close X and the Android
 * back button; the PDF reader fills the screen; and while a player's file is still coming in the play button keeps its place and shows the
 * spinner, then gives way to pause the moment the sound or picture runs, or to the words when the file will not load.
 */
type Listener = (payload?: unknown) => void;
const mockVideo = { listeners: new Map<string, Listener[]>(), status: 'readyToPlay', source: null as unknown, enter: jest.fn(() => Promise.resolve()) };
const mockAudio = { listeners: [] as Listener[], isLoaded: true, isBuffering: false, source: null as unknown };

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  class VideoView extends React.Component<Record<string, unknown>> {
    enterFullscreen = () => mockVideo.enter();
    exitFullscreen = () => Promise.resolve();
    render() {
      return <View {...(this.props as object)} />;
    }
  }
  const player = {
    play: jest.fn(),
    pause: jest.fn(),
    currentTime: 0,
    duration: 0,
    get status() {
      return mockVideo.status;
    },
    addListener: (event: string, fn: Listener) => {
      mockVideo.listeners.set(event, [...(mockVideo.listeners.get(event) ?? []), fn]);
      return { remove: () => mockVideo.listeners.set(event, (mockVideo.listeners.get(event) ?? []).filter((l) => l !== fn)) };
    },
  };
  return {
    VideoView,
    useVideoPlayer: (source: unknown, setup?: (p: unknown) => void) => {
      mockVideo.source = source;
      return React.useMemo(() => {
        setup?.(player);
        return player;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    },
  };
});
jest.mock('expo-audio', () => {
  const React = require('react');
  const player = {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(async () => undefined),
    setActiveForLockScreen: jest.fn(),
    get isLoaded() {
      return mockAudio.isLoaded;
    },
    get isBuffering() {
      return mockAudio.isBuffering;
    },
    addListener: (_event: string, fn: Listener) => {
      mockAudio.listeners.push(fn);
      return { remove: () => void (mockAudio.listeners = mockAudio.listeners.filter((l) => l !== fn)) };
    },
  };
  return {
    useAudioPlayer: (source: unknown) => {
      mockAudio.source = source;
      return React.useMemo(() => player, []);
    },
    setAudioModeAsync: async () => undefined,
  };
});
// The Modal's own props are what the Android back button calls (onRequestClose), so the stand-in keeps them.
const mockModals: { props: Record<string, unknown> }[] = [];
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: { visible?: boolean; children?: React.ReactNode }) => {
      mockModals.push({ props });
      return props.visible === false ? null : <View testID="modal-host">{props.children}</View>;
    },
  };
});
const lastModal = () => mockModals[mockModals.length - 1].props as { visible: boolean; transparent: boolean; onRequestClose: () => void };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }) }));
jest.mock('@/features/store/ladder/usePrice', () => ({
  useShownPrice: () => ({ native: false, kobo: (list: number | null | undefined) => (list == null ? null : Math.round(list * 100)), forKobo: (list: number | null | undefined) => (list == null ? null : list), ready: true }),
}));

const { Media } = require('../Media') as typeof import('../Media');
const { PLAYER_FAILED } = require('@/features/feed/model') as typeof import('@/features/feed/model');
const { LOAD_PATIENCE_MS } = require('@/features/feed/player') as typeof import('@/features/feed/player');

const PREVIEW = 'https://cdn.test/previews/clip.mp4?sig=1';
const FULL = 'https://cdn.test/full/clip.mp4?sig=2';
const piece = (contentType: FeedItem['contentType'], over: Partial<FeedItem> = {}) =>
  ({ id: `${contentType}-1`, title: 'VFX for Beginners', contentType, accessType: 'paid', price: 8000, previewAssetUrl: PREVIEW, fullAssetUrl: null, fullAssetLocked: true, pageCount: null, coverUrl: null, ...over }) as unknown as FeedItem;
const area = (node: React.ReactElement) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>;
const media = (p: FeedItem) => <Media piece={p} tag={{ icon: 'Play', text: 'Video' }} by="Tife Adeola" />;
const emit = (event: string, payload?: unknown) => rtl.act(async () => (mockVideo.listeners.get(event) ?? []).forEach((l) => l(payload)));
const emitAudio = (payload: Record<string, unknown>) => rtl.act(async () => mockAudio.listeners.forEach((l) => l({ currentTime: 0, duration: 0, playing: false, didJustFinish: false, error: null, ...payload })));
const settle = () => rtl.act(async () => void (await Promise.resolve()));

let os: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  os = jest.replaceProperty(Platform, 'OS', 'android');
  mockVideo.listeners = new Map();
  mockVideo.status = 'readyToPlay';
  mockVideo.enter.mockClear();
  mockAudio.listeners = [];
  mockAudio.isLoaded = true;
  mockAudio.isBuffering = false;
});
afterEach(() => {
  os.restore();
  jest.useRealTimers();
});

describe('R-117 A · a video opens full screen (Android)', () => {
  it('a user can press the full-screen button on the piece page: the player is asked for the phone own full-screen video, once per press, with any rotation allowed', async () => {
    await rtl.render(media(piece('video')));
    const button = rtl.screen.getByTestId('detail-media-fullscreen');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Full screen, VFX for Beginners');
    const box = StyleSheet.flatten(button.props.style);
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(rtl.screen.getByTestId('detail-media-video').props.fullscreenOptions).toEqual({ enable: true, orientation: 'default' });

    expect(mockVideo.enter).not.toHaveBeenCalled();
    await rtl.act(async () => rtl.fireEvent.press(button));
    expect(mockVideo.enter).toHaveBeenCalledTimes(1);
    await rtl.act(async () => rtl.fireEvent.press(button));
    expect(mockVideo.enter).toHaveBeenCalledTimes(2);
  });

  it('a locked piece goes full screen with its preview and nothing more: the player holds the preview file, never the full one', async () => {
    await rtl.render(media(piece('video', { fullAssetUrl: FULL, fullAssetLocked: true })));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-fullscreen')));
    expect(mockVideo.source).toBe(PREVIEW);
    expect(mockVideo.enter).toHaveBeenCalledTimes(1);
  });

  it("what the person owns plays full screen as the full file, from the same player (so its position and play state go in and come out as they were)", async () => {
    await rtl.render(media(piece('video', { accessType: 'paid', fullAssetUrl: FULL, fullAssetLocked: false })));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-fullscreen')));
    expect(mockVideo.source).toBe(FULL);
    expect(mockVideo.enter).toHaveBeenCalledTimes(1);
  });

  it('the full-screen button is a video thing: a book, a photo and an audio piece have none', async () => {
    for (const type of ['pdf', 'audio', 'image'] as const) {
      const view = await rtl.render(area(media(piece(type, { previewAssetUrl: type === 'pdf' ? 'https://cdn.test/a.pdf' : type === 'image' ? 'https://cdn.test/a.jpg' : 'https://cdn.test/a.mp3' }))));
      expect(rtl.screen.queryByTestId('detail-media-fullscreen')).toBeNull();
      await view.unmount();
    }
  });
});

describe('R-117 A · a picture opens full screen (Android)', () => {
  const frames = [
    { position: 1, url: 'https://cdn.test/p/1.jpg', locked: false },
    { position: 2, url: 'https://cdn.test/p/2.jpg', locked: false },
    { position: 3, url: null, locked: true },
  ];
  const photos = (over: Partial<FeedItem> = {}) => piece('image', { previewAssetUrl: 'https://cdn.test/p/1.jpg', media: { contentId: 'i', contentType: 'image', durationLabel: null, pageCount: null, frameCount: 3, frames } as never, ...over });

  it('a tap on the picture opens it on black with a close X; the Android back button closes it', async () => {
    await rtl.render(area(media(photos())));
    expect(rtl.screen.queryByTestId('detail-media-viewer')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-open-picture')));
    const viewer = rtl.screen.getByTestId('detail-media-viewer');
    expect(StyleSheet.flatten(viewer.props.style).backgroundColor).toBe('rgba(0, 0, 0, 1)');
    expect(rtl.screen.getByTestId('detail-media-viewer-close').props.accessibilityLabel).toBe('Close');

    // The Android back button is the Modal's onRequestClose.
    expect(lastModal().visible).toBe(true);
    expect(lastModal().transparent).toBe(false);
    await rtl.act(async () => lastModal().onRequestClose());
    expect(rtl.screen.queryByTestId('detail-media-viewer')).toBeNull();

    // And the X closes it too.
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-open-picture')));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-viewer-close')));
    expect(rtl.screen.queryByTestId('detail-media-viewer')).toBeNull();
  });

  it('a set swipes from picture to picture, and a locked frame (no address) is never offered: the viewer holds the two pictures the person may see', async () => {
    await rtl.render(area(media(photos())));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-open-picture')));
    expect(rtl.screen.getByTestId('detail-media-viewer-count')).toBeTruthy();
    expect(rtl.screen.getByText('1 / 2')).toBeTruthy();
    expect(rtl.screen.queryByTestId('detail-media-viewer-page-2')).toBeNull();
    await rtl.act(async () => rtl.fireEvent(rtl.screen.getByTestId('detail-media-viewer-pages'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 390, y: 0 } } }));
    expect(rtl.screen.getByText('2 / 2')).toBeTruthy();
    expect(rtl.screen.getByTestId('detail-media-viewer-page-1-image').props.source).toEqual([{ uri: 'https://cdn.test/p/2.jpg' }]);
  });

  it('a user can pinch to zoom in and the picture settles back to fitted when the pinch ends small; a double tap zooms in and out', async () => {
    await rtl.render(area(media(photos())));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-open-picture')));
    const scale = () => StyleSheet.flatten(rtl.screen.getByTestId('detail-media-viewer-page-0-image').props.style).transform.find((t: Record<string, number>) => 'scale' in t).scale;
    expect(scale()).toBe(1);
    await rtl.act(async () => fireGestureHandler(getByGestureTestId('detail-media-viewer-page-0-pinch'), [{ scale: 1 }, { scale: 1.5 }, { scale: 2 }, { scale: 2.5 }, { scale: 2.5 }]));
    expect(scale()).toBeGreaterThan(2);
    await rtl.act(async () => fireGestureHandler(getByGestureTestId('detail-media-viewer-page-0-pinch'), [{ scale: 1 }, { scale: 0.7 }, { scale: 0.41 }, { scale: 0.41 }]));
    expect(scale()).toBe(1);
    await rtl.act(async () => fireGestureHandler(getByGestureTestId('detail-media-viewer-page-0-double-tap'), [{ numberOfPointers: 1 }]));
    expect(scale()).toBeGreaterThan(2);
    await rtl.act(async () => fireGestureHandler(getByGestureTestId('detail-media-viewer-page-0-double-tap'), [{ numberOfPointers: 1 }]));
    expect(scale()).toBe(1);
  });

  it('a photo with no frames list opens the one picture it draws, and a piece with no picture has nothing to open', async () => {
    await rtl.render(area(media(piece('image', { previewAssetUrl: 'https://cdn.test/p/only.jpg', media: undefined }))));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-open-picture')));
    expect(rtl.screen.getByTestId('detail-media-viewer-page-0-image').props.source).toEqual([{ uri: 'https://cdn.test/p/only.jpg' }]);
    expect(rtl.screen.queryByTestId('detail-media-viewer-count')).toBeNull();
  });
});

describe('R-117 A · a book fills the screen (Android)', () => {
  it('the PDF reader opens as a full-screen page on black, not a sheet, and closes with the back button', async () => {
    await rtl.render(area(media(piece('pdf', { previewAssetUrl: 'https://cdn.test/previews/book.pdf?sig=1', pageCount: 12 }))));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-book')));
    expect(lastModal().visible).toBe(true);
    expect(lastModal().transparent).toBe(false);
    const page = StyleSheet.flatten(rtl.screen.getByTestId('detail-media-reader').props.style);
    expect(page.flex).toBe(1);
    expect(page.backgroundColor).toBe('rgba(0, 0, 0, 1)');
    await rtl.act(async () => lastModal().onRequestClose());
    expect(lastModal().visible).toBe(false);
  });
});

describe('R-117 C · a player shows when its file is still coming in (Android)', () => {
  it('video: the play button keeps its place and shows the spinner while the player says loading, then gives way the moment it is ready', async () => {
    mockVideo.status = 'loading';
    await rtl.render(media(piece('video')));
    // Not asked to play yet: the Play disc, no spinner.
    expect(rtl.screen.getByTestId('detail-media-disc')).toBeTruthy();
    expect(rtl.screen.queryByTestId('detail-media-spinner')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-play')));
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
    expect(rtl.screen.queryByTestId('detail-media-disc')).toBeNull();
    mockVideo.status = 'readyToPlay';
    await emit('statusChange', { status: 'readyToPlay', oldStatus: 'loading' });
    expect(rtl.screen.queryByTestId('detail-media-spinner')).toBeNull();
    expect(rtl.screen.queryByTestId('detail-media-failed')).toBeNull();
    // It runs on a pause: a buffer that runs dry brings the spinner back.
    await emit('statusChange', { status: 'loading', oldStatus: 'readyToPlay' });
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
    await emit('statusChange', { status: 'readyToPlay', oldStatus: 'loading' });
    expect(rtl.screen.queryByTestId('detail-media-spinner')).toBeNull();
  });

  it('audio: the spinner shows while the file downloads or buffers (not loaded, then buffering) and goes when the sound runs', async () => {
    mockAudio.isLoaded = false;
    await rtl.render(media(piece('audio', { previewAssetUrl: 'https://cdn.test/previews/a.mp3?sig=1' })));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-play')));
    await settle();
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
    await emitAudio({ isLoaded: true, isBuffering: true });
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
    await emitAudio({ isLoaded: true, isBuffering: false, playing: true, currentTime: 1, duration: 30 });
    expect(rtl.screen.queryByTestId('detail-media-spinner')).toBeNull();
    expect(rtl.screen.queryByTestId('detail-media-failed')).toBeNull();
  });

  it('a file that will not load says so in words and stops, never a spinner for ever: the player reports the error, or no sound comes within the patience', async () => {
    mockVideo.status = 'loading';
    await rtl.render(media(piece('video')));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-play')));
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
    await emit('statusChange', { status: 'error', error: { message: 'gone' } });
    expect(rtl.screen.getByTestId('detail-media-failed').props.children).toBe(PLAYER_FAILED);
    expect(rtl.screen.queryByTestId('detail-media-spinner')).toBeNull();
    // A tap tries again.
    mockVideo.status = 'loading';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-play')));
    expect(rtl.screen.queryByTestId('detail-media-failed')).toBeNull();
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
  });

  it('audio that never reports a sound fails after the patience instead of spinning for ever', async () => {
    jest.useFakeTimers();
    mockAudio.isLoaded = false;
    await rtl.render(media(piece('audio', { previewAssetUrl: 'https://cdn.test/previews/a.mp3?sig=1' })));
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('detail-media-play')));
    await rtl.act(async () => void (await Promise.resolve()));
    expect(rtl.screen.getByTestId('detail-media-spinner')).toBeTruthy();
    await rtl.act(async () => void jest.advanceTimersByTime(LOAD_PATIENCE_MS + 10));
    expect(rtl.screen.queryByTestId('detail-media-spinner')).toBeNull();
    expect(rtl.screen.getByTestId('detail-media-failed').props.children).toBe(PLAYER_FAILED);
  });
});
