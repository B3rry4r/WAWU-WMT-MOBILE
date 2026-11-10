/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * VIEW-FIX part D · R-115 / R-117: a titled piece keeps playing on lock and shows on the lock screen, whichever screen started it. Run on
 * Android and on iPhone (Platform.OS), with the real `AudioSource`, the real piece page (`Media`) and the real AppState handlers.
 *
 * The phone's audio is a stand-in that keeps what the native modules keep: the last mode (a player is paused on background unless the mode
 * says `shouldPlayInBackground`), and ONE lock screen for the whole app. "Hide" is answered the way each platform answers it:
 * Android clears the lock screen only for the player that owns it (`AudioPlayer.setActiveForLockScreen` checks `isActiveForLockScreen`),
 * the iPhone clears it for whoever asks (`MediaController.setActivePlayer(nil)`, node_modules/expo-audio/ios).
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { FeedItem } from '../api';

type Listener = (payload: unknown) => void;
type Fake = {
  uri: string;
  playing: boolean;
  isActive: boolean;
  listeners: Listener[];
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
  addListener: jest.Mock;
  setActiveForLockScreen: jest.Mock;
};

const mockPhone = {
  shouldPlayInBackground: false,
  players: new Map<string, Fake>(),
  lockOwner: null as Fake | null,
  lockTitle: null as string | null,
};

jest.mock('expo-audio', () => {
  const make = (uri: string): Fake => {
    const { Platform: P } = require('react-native') as typeof import('react-native');
    const fake: Fake = {
      uri,
      playing: false,
      isActive: false,
      listeners: [],
      play: jest.fn(() => {
        fake.playing = true;
      }),
      pause: jest.fn(() => {
        fake.playing = false;
      }),
      seekTo: jest.fn(async () => undefined),
      addListener: jest.fn((_event: string, fn: Listener) => {
        fake.listeners.push(fn);
        return { remove: jest.fn(() => void (fake.listeners = fake.listeners.filter((l) => l !== fn))) };
      }),
      setActiveForLockScreen: jest.fn((active: boolean, metadata?: { title?: string }) => {
        if (active) {
          if (mockPhone.lockOwner && mockPhone.lockOwner !== fake) mockPhone.lockOwner.isActive = false;
          mockPhone.lockOwner = fake;
          fake.isActive = true;
          mockPhone.lockTitle = metadata?.title ?? null;
        } else if (P.OS === 'ios') {
          // iPhone: the one now-playing entry is cleared for whoever asks.
          if (mockPhone.lockOwner) mockPhone.lockOwner.isActive = false;
          mockPhone.lockOwner = null;
          mockPhone.lockTitle = null;
        } else if (fake.isActive) {
          // Android: only the owner clears it.
          fake.isActive = false;
          if (mockPhone.lockOwner === fake) {
            mockPhone.lockOwner = null;
            mockPhone.lockTitle = null;
          }
        }
      }),
    };
    mockPhone.players.set(uri, fake);
    return fake;
  };
  return {
    useAudioPlayer: (uri: string) => mockPhone.players.get(uri) ?? make(uri),
    createAudioPlayer: (uri: string) => mockPhone.players.get(uri) ?? make(uri),
    setAudioModeAsync: async (mode: { shouldPlayInBackground?: boolean }) => {
      mockPhone.shouldPlayInBackground = Boolean(mode.shouldPlayInBackground);
    },
  };
});
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));
jest.mock('@/features/store/ladder/usePrice', () => ({
  useShownPrice: () => ({ native: false, kobo: (list: number | null | undefined) => (list == null ? null : Math.round(list * 100)), forKobo: (list: number | null | undefined) => (list == null ? null : list), ready: true }),
}));

const { AudioSource, resetLockScreenForTests } = require('../player') as typeof import('../player') & { resetLockScreenForTests: () => void };
const { resetContentAudioForTests } = require('../player/audioMode') as typeof import('../player/audioMode');
const { Media } = require('@/features/content-detail/Media') as typeof import('@/features/content-detail/Media');

const FEED_SONG = 'https://cdn.test/previews/feed-song.mp3?sig=1';
const OWN_TRACK = 'https://cdn.test/full/own-track.mp3?sig=2';
const noop = () => undefined;
const settle = () =>
  act(async () => {
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
  });

let handlers: ((next: AppStateStatus) => void)[] = [];
const appTo = (next: AppStateStatus) =>
  act(async () => {
    // The phone's own side of leaving the screen: expo-audio pauses every player unless the last mode said to stay on.
    if (next === 'background' && !mockPhone.shouldPlayInBackground) mockPhone.players.forEach((p) => p.playing && p.pause());
    [...handlers].forEach((h) => h(next));
  });

/** The feed's audio post under the stack: it plays while Home is in front and stops when something else comes over it. */
const feedPost = (playing: boolean) => <AudioSource key="feed" uri={FEED_SONG} playing={playing} seek={null} title="Feed song" onTime={noop} onEnded={noop} />;
const ownPiece = {
  id: 'own-audio-1',
  title: 'My own track',
  contentType: 'audio',
  accessType: 'paid',
  price: 5000,
  previewAssetUrl: 'https://cdn.test/previews/own-track.mp3?sig=1',
  fullAssetUrl: OWN_TRACK,
  fullAssetLocked: false,
  pageCount: null,
  coverUrl: null,
} as unknown as FeedItem;
const page = (feedPlaying: boolean) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    {feedPost(feedPlaying)}
    <Media piece={ownPiece} tag={{ icon: 'AudioLines', text: 'Audio' }} by="Me" />
  </SafeAreaProvider>
);

let os: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  mockPhone.shouldPlayInBackground = false;
  mockPhone.players = new Map();
  mockPhone.lockOwner = null;
  mockPhone.lockTitle = null;
  handlers = [];
  resetContentAudioForTests();
  resetLockScreenForTests();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_t: string, h: (next: AppStateStatus) => void) => {
    handlers.push(h);
    return { remove: () => void (handlers = handlers.filter((x) => x !== h)) };
  }) as never);
});
afterEach(() => {
  os?.restore();
  jest.restoreAllMocks();
});

describe.each(['android', 'ios'] as const)('R-117 part D · a titled piece keeps playing on lock whichever screen started it (%s)', (platform) => {
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', platform);
  });

  it("the owner's path: the feed's post played and was left (Home lost focus), then his own audio piece is played from its page: it plays, shows on the lock screen and goes on when the screen locks", async () => {
    const view = await render(page(true));
    await settle();
    expect(mockPhone.lockTitle).toBe('Feed song');
    // Me, then his Content tab, then the piece: Home is behind, its post is no longer asked to play.
    await view.rerender(page(false));
    await settle();
    expect(mockPhone.lockOwner).toBeNull();
    expect(mockPhone.players.get(FEED_SONG)!.playing).toBe(false);

    await act(async () => fireEvent.press(screen.getByTestId('detail-media-play')));
    await settle();
    const own = mockPhone.players.get(OWN_TRACK)!;
    expect(own.playing).toBe(true);
    expect(mockPhone.shouldPlayInBackground).toBe(true);
    expect(mockPhone.lockOwner).toBe(own);
    expect(mockPhone.lockTitle).toBe('My own track');

    await appTo('inactive');
    await appTo('background');
    expect(own.playing).toBe(true);
    expect(mockPhone.lockOwner).toBe(own);
    await appTo('active');
    expect(own.playing).toBe(true);
  });

  it('a post that is let go of AFTER the piece page took over does not take the piece off the lock screen', async () => {
    // The feed's post is still asked to play when the piece starts (the focus change reaches it a moment later).
    const view = await render(page(true));
    await settle();
    await act(async () => fireEvent.press(screen.getByTestId('detail-media-play')));
    await settle();
    const own = mockPhone.players.get(OWN_TRACK)!;
    expect(mockPhone.lockOwner).toBe(own);

    await view.rerender(page(false));
    await settle();
    expect(mockPhone.players.get(FEED_SONG)!.playing).toBe(false);
    expect(own.playing).toBe(true);
    expect(mockPhone.lockOwner).toBe(own);
    expect(mockPhone.lockTitle).toBe('My own track');
    await appTo('background');
    expect(own.playing).toBe(true);
  });
});
