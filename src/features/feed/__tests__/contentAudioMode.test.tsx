/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * NATIVE-FIX · R-115: what a person LISTENS to keeps playing when the screen locks, is heard with the iPhone's silent switch on, and the
 * WAWU theme does neither. Run on Android and on iPhone (Platform.OS), with the real `AudioSource`, the real theme player and the real
 * AppState handlers.
 *
 * The phone's audio is a stand-in that behaves the way `expo-audio`'s native module does for the three things under test: it keeps the
 * last mode it was given (what that call left out takes the native default: the iPhone obeys the silent switch, Android does not);
 * it pauses every player when the app goes to the background unless that mode says `shouldPlayInBackground`; and a player only makes
 * a sound when it plays, so a piece is "audible" or not depending on the silent switch and the mode at the moment `play()` is called.
 */
import { act, render } from '@testing-library/react-native';
import { AppState, Platform, type AppStateStatus } from 'react-native';

type Mode = { playsInSilentMode?: boolean; shouldPlayInBackground?: boolean; interruptionMode?: string; allowsRecording?: boolean };
type Fake = {
  uri: string;
  playing: boolean;
  audible: boolean | null;
  loop: boolean;
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
  seekTo: jest.Mock;
  addListener: jest.Mock;
  setActiveForLockScreen: jest.Mock;
};

const mockPhone = {
  silentSwitch: false,
  mode: {} as Required<Pick<Mode, 'playsInSilentMode' | 'shouldPlayInBackground'>> & Mode,
  log: [] as string[],
  players: new Map<string, Fake>(),
  modeFails: false,
  modeGate: null as Promise<void> | null,
};

jest.mock('expo-audio', () => {
  const nativeMode = (mode: Mode) => {
    const { Platform: P } = require('react-native') as typeof import('react-native');
    return { ...mode, playsInSilentMode: mode.playsInSilentMode ?? P.OS !== 'ios', shouldPlayInBackground: mode.shouldPlayInBackground ?? false };
  };
  const make = (uri: string): Fake => {
    const { Platform: P } = require('react-native') as typeof import('react-native');
    const fake: Fake = {
      uri,
      playing: false,
      audible: null,
      loop: false,
      play: jest.fn(() => {
        fake.playing = true;
        fake.audible = !(P.OS === 'ios' && mockPhone.silentSwitch && !mockPhone.mode.playsInSilentMode);
        mockPhone.log.push(`play ${uri}`);
      }),
      pause: jest.fn(() => {
        fake.playing = false;
        mockPhone.log.push(`pause ${uri}`);
      }),
      remove: jest.fn(),
      seekTo: jest.fn(async () => undefined),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      setActiveForLockScreen: jest.fn((active: boolean, metadata?: { title?: string }) => {
        mockPhone.log.push(`lockscreen ${active ? `on ${metadata?.title ?? ''}` : 'off'} ${uri}`);
      }),
    };
    mockPhone.players.set(uri, fake);
    return fake;
  };
  const playerFor = (uri: string) => mockPhone.players.get(uri) ?? make(uri);
  return {
    useAudioPlayer: (uri: string) => playerFor(uri),
    createAudioPlayer: (uri: string) => playerFor(uri),
    setAudioModeAsync: async (mode: Mode) => {
      mockPhone.log.push(`mode ${JSON.stringify(mode)}`);
      if (mockPhone.modeGate) await mockPhone.modeGate;
      if (mockPhone.modeFails) throw new Error('The phone refused the audio mode');
      mockPhone.mode = nativeMode(mode);
    },
  };
});

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const THEME_FILE = 'file:///documents/wawu-theme.mp3';
jest.mock('../../music/themeTrack', () => ({
  THEME_URL: 'https://wawuafrica.com/wawu-theme.mp3',
  savedTrack: () => 'file:///documents/wawu-theme.mp3',
  fetchTrack: async () => 'file:///documents/wawu-theme.mp3',
}));

const { AudioSource } = require('../player') as typeof import('../player');
const { resetContentAudioForTests } = require('../player/audioMode') as typeof import('../player/audioMode');
type Music = typeof import('../../music/themeMusic');
let music: Music;

let appHandlers: ((next: AppStateStatus) => void)[] = [];
let appNow: AppStateStatus = 'active';
let platform: jest.ReplaceProperty<typeof Platform.OS>;

/** The phone's own side of leaving the screen: `expo-audio` pauses every player unless the last mode said to stay on. */
function phoneLeavesScreen(next: AppStateStatus) {
  if (next !== 'background' || mockPhone.mode.shouldPlayInBackground) return;
  mockPhone.players.forEach((p) => {
    if (p.playing) p.pause();
  });
}

const appTo = (next: AppStateStatus) =>
  act(async () => {
    appNow = next;
    [...appHandlers].forEach((handler) => handler(next));
  });

/** Lets the chained mode call, then the play, go through. */
const settle = () =>
  act(async () => {
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
  });

const noop = () => undefined;
const A = 'https://files.example/a.mp3';
const B = 'https://files.example/b.mp3';
/** A piece has a title (an audio post, an audiobook, a podcast, a Studio result). NATIVE-FIX r2: the helper gives it one by default, as a real piece has. */
const piece = (uri: string, playing: boolean, title = 'A titled piece') => <AudioSource key={uri} uri={uri} playing={playing} seek={null} title={title} onTime={noop} onEnded={noop} />;
/** A short voice clip has no title (Hear name, Voice Intro playback, a voice sample). */
const clip = (uri: string, playing: boolean) => <AudioSource key={uri} uri={uri} playing={playing} seek={null} onTime={noop} onEnded={noop} />;
/** The audio session a mode makes, by expo-audio's native rules (iOS `setAudioMode` in AudioModule.swift; Android `requestAudioFocus` in AudioModule.kt). */
const sessionOf = (os: string, m: Mode) =>
  os === 'ios'
    ? m.playsInSilentMode
      ? `playback ${m.interruptionMode}`
      : m.interruptionMode === 'doNotMix'
        ? 'soloAmbient'
        : 'ambient'
    : `${m.playsInSilentMode ? 'plays' : 'obeys'} silent, focus ${m.interruptionMode === 'mixWithOthers' ? 'none' : m.interruptionMode === 'duckOthers' ? 'duck' : 'transient'}`;
/** The session before anything sets a mode, which is all the app had for listening before R-115: iPhone `.soloAmbient` (system default), Android transient focus (mode null) and plays in silent mode. */
const oldDefault = (os: string) => (os === 'ios' ? 'soloAmbient' : 'plays silent, focus transient');
const lastMode = () => mockPhone.log.filter((l) => l.startsWith('mode ')).slice(-1)[0] ?? '';
const index = (text: string) => mockPhone.log.findIndex((l) => l.startsWith(text));

beforeEach(() => {
  mockStore.clear();
  mockPhone.silentSwitch = false;
  mockPhone.log = [];
  mockPhone.players = new Map();
  mockPhone.modeFails = false;
  mockPhone.modeGate = null;
  mockPhone.mode = { playsInSilentMode: Platform.OS !== 'ios', shouldPlayInBackground: false };
  appHandlers = [];
  appNow = 'active';
  resetContentAudioForTests();
  Object.defineProperty(AppState, 'currentState', { configurable: true, get: () => appNow });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, handler: (next: AppStateStatus) => void) => {
    appHandlers.push(handler);
    return { remove: () => void (appHandlers = appHandlers.filter((h) => h !== handler)) };
  }) as never);
  music = require('../../music/themeMusic');
  music.resetThemeMusicForTests();
  AppState.addEventListener('change', phoneLeavesScreen);
});

afterEach(() => {
  platform?.restore();
  jest.restoreAllMocks();
});

describe.each(['android', 'ios'] as const)('listening on %s (R-115)', (os) => {
  beforeEach(() => {
    platform = jest.replaceProperty(Platform, 'OS', os);
    mockPhone.mode = { playsInSilentMode: os !== 'ios', shouldPlayInBackground: false };
  });

  it('runs as that phone', () => {
    expect(Platform.OS).toBe(os);
  });

  it('a user can listen to an audio piece and it keeps playing when the app goes to the background and when it comes back', async () => {
    await render(piece(A, true));
    await settle();
    const audio = mockPhone.players.get(A)!;
    expect(audio.playing).toBe(true);
    // The phone was told to stay on before the piece started.
    expect(index('mode')).toBeGreaterThanOrEqual(0);
    expect(index('mode')).toBeLessThan(index('play'));
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);

    await appTo('inactive');
    await appTo('background');
    expect(audio.pause).not.toHaveBeenCalled();
    expect(audio.playing).toBe(true);
    await appTo('active');
    expect(audio.playing).toBe(true);
  });

  it('without the content mode the phone pauses the piece on the way out (the stand-in is faithful: this is what the owner heard)', async () => {
    await render(piece(A, false));
    const audio = mockPhone.players.get(A)!;
    audio.play();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(false);
    await appTo('background');
    expect(audio.playing).toBe(false);
  });

  it('the theme music stops when the app goes to the background and plays again on return', async () => {
    await act(async () => void (await music.toggleThemeMusic()));
    const theme = mockPhone.players.get(THEME_FILE)!;
    expect(theme.playing).toBe(true);
    expect(theme.loop).toBe(true);
    // The theme asked for no audio mode of its own and for no lock screen.
    expect(index('mode')).toBe(-1);
    expect(theme.setActiveForLockScreen).not.toHaveBeenCalled();

    await appTo('background');
    expect(theme.playing).toBe(false);
    expect(music.getThemeMusic().on).toBe(true);
    await appTo('active');
    expect(theme.playing).toBe(true);
  });

  it('the theme music stops by its own listener even if the phone had been left in the content mode', async () => {
    mockPhone.mode = { playsInSilentMode: true, shouldPlayInBackground: true };
    await act(async () => void (await music.toggleThemeMusic()));
    const theme = mockPhone.players.get(THEME_FILE)!;
    expect(theme.playing).toBe(true);
    await appTo('background');
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);
    expect(theme.playing).toBe(false);
  });

  it('a piece starting stops the theme, and when the piece pauses the phone goes back to the resting mode, so the theme stops on background again', async () => {
    await act(async () => void (await music.toggleThemeMusic()));
    const theme = mockPhone.players.get(THEME_FILE)!;
    const view = await render(piece(A, false));
    await view.rerender(piece(A, true));
    await settle();
    expect(music.getThemeMusic().on).toBe(false);
    expect(theme.playing).toBe(false);
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);

    await view.rerender(piece(A, false));
    await settle();
    // NATIVE-FIX r2 (assertion changed): the resting mode is the old default session, so interruptionMode is 'doNotMix' (it was 'mixWithOthers').
    expect(mockPhone.mode).toMatchObject({ shouldPlayInBackground: false, playsInSilentMode: os !== 'ios', interruptionMode: 'doNotMix' });

    await act(async () => void (await music.toggleThemeMusic()));
    expect(theme.playing).toBe(true);
    await appTo('background');
    expect(theme.playing).toBe(false);
  });

  it('the resting mode comes back when the piece ends or its screen goes away', async () => {
    const view = await render(piece(A, true));
    await settle();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);
    await view.unmount();
    await settle();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(false);
  });

  it('two pieces: the mode stays on until the last one lets go', async () => {
    const view = await render(
      <>
        {piece(A, true)}
        {piece(B, false)}
      </>,
    );
    await settle();
    await view.rerender(
      <>
        {piece(A, true)}
        {piece(B, true)}
      </>,
    );
    await settle();
    await view.rerender(
      <>
        {piece(A, false)}
        {piece(B, true)}
      </>,
    );
    await settle();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);
    expect(lastMode()).toContain('"shouldPlayInBackground":true');
    await view.rerender(
      <>
        {piece(A, false)}
        {piece(B, false)}
      </>,
    );
    await settle();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(false);
  });

  it('a piece shows on the lock screen with its name while it plays and leaves it when it pauses', async () => {
    const view = await render(piece(A, true, 'Kemi reads Chapter 1'));
    await settle();
    expect(mockPhone.players.get(A)!.setActiveForLockScreen).toHaveBeenCalledWith(true, { title: 'Kemi reads Chapter 1' });
    await view.rerender(piece(A, false, 'Kemi reads Chapter 1'));
    await settle();
    expect(mockPhone.players.get(A)!.setActiveForLockScreen).toHaveBeenLastCalledWith(false);
  });

  it('after a piece the phone is back in the session it had before the app set any, so the theme sounds as it did before', async () => {
    const view = await render(piece(A, true));
    await settle();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);
    await view.rerender(piece(A, false));
    await settle();
    expect(sessionOf(os, mockPhone.mode)).toBe(oldDefault(os));
    expect(mockPhone.mode).toMatchObject({ shouldPlayInBackground: false, allowsRecording: false, shouldRouteThroughEarpiece: false });
    // The theme, started now with the iPhone silent switch on, obeys the switch on iPhone and not on Android, as before.
    mockPhone.silentSwitch = true;
    await act(async () => void (await music.toggleThemeMusic()));
    expect(mockPhone.players.get(THEME_FILE)!.audible).toBe(os !== 'ios');
  });

  it('a short voice clip without a title is heard, but takes no background mode and no lock screen, and stops when the app goes to the background', async () => {
    const view = await render(clip(A, true));
    await settle();
    const audio = mockPhone.players.get(A)!;
    expect(audio.playing).toBe(true);
    expect(index('mode')).toBeLessThan(index('play'));
    expect(mockPhone.mode).toMatchObject({ playsInSilentMode: true, shouldPlayInBackground: false });
    expect(mockPhone.log.filter((l) => l.startsWith('mode ')).every((l) => l.includes('"shouldPlayInBackground":false'))).toBe(true);
    expect(audio.setActiveForLockScreen).not.toHaveBeenCalled();

    await appTo('inactive');
    await appTo('background');
    expect(audio.playing).toBe(false);

    await view.rerender(clip(A, false));
    await settle();
    expect(sessionOf(os, mockPhone.mode)).toBe(oldDefault(os));
    expect(audio.setActiveForLockScreen).not.toHaveBeenCalled();
  });

  it('a clip playing next to a titled piece: the piece keeps the background mode until it lets go, then the clip has its own, then the resting one', async () => {
    const both = (a: boolean, b: boolean) => (
      <>
        {piece(A, a)}
        {clip(B, b)}
      </>
    );
    const view = await render(both(true, true));
    await settle();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(true);
    expect(mockPhone.players.get(A)!.setActiveForLockScreen).toHaveBeenCalledWith(true, { title: 'A titled piece' });
    expect(mockPhone.players.get(B)!.setActiveForLockScreen).not.toHaveBeenCalled();
    await view.rerender(both(false, true));
    await settle();
    expect(mockPhone.mode).toMatchObject({ playsInSilentMode: true, shouldPlayInBackground: false });
    await view.rerender(both(false, false));
    await settle();
    expect(sessionOf(os, mockPhone.mode)).toBe(oldDefault(os));
  });

  it('a phone that refuses the audio mode still plays the piece', async () => {
    mockPhone.modeFails = true;
    await render(piece(A, true));
    await settle();
    expect(mockPhone.players.get(A)!.playing).toBe(true);
  });

  it('a piece stopped before the phone has answered never starts', async () => {
    let answer: () => void = noop;
    mockPhone.modeGate = new Promise<void>((resolve) => (answer = resolve));
    const view = await render(piece(A, true));
    await view.rerender(piece(A, false));
    answer();
    await settle();
    expect(mockPhone.players.get(A)!.play).not.toHaveBeenCalled();
    expect(mockPhone.mode.shouldPlayInBackground).toBe(false);
  });
});

describe('an audio piece with the iPhone silent switch on', () => {
  beforeEach(() => {
    mockPhone.silentSwitch = true;
  });

  it('on an iPhone a user presses play and hears it: the mode that ignores the switch is set before play', async () => {
    platform = jest.replaceProperty(Platform, 'OS', 'ios');
    mockPhone.mode = { playsInSilentMode: false, shouldPlayInBackground: false };
    await render(piece(A, true));
    await settle();
    const audio = mockPhone.players.get(A)!;
    expect(audio.playing).toBe(true);
    expect(audio.audible).toBe(true);
    expect(mockPhone.log.find((l) => l.startsWith('mode '))).toContain('"playsInSilentMode":true');
    expect(index('mode')).toBeLessThan(index('play'));
  });

  it('a short voice clip without a title is heard too, with the switch on', async () => {
    platform = jest.replaceProperty(Platform, 'OS', 'ios');
    mockPhone.mode = { playsInSilentMode: false, shouldPlayInBackground: false };
    await render(clip(A, true));
    await settle();
    expect(mockPhone.players.get(A)!.audible).toBe(true);
    expect(index('mode')).toBeLessThan(index('play'));
  });

  it('play waits for the phone to answer the mode, so the first second is heard too', async () => {
    platform = jest.replaceProperty(Platform, 'OS', 'ios');
    mockPhone.mode = { playsInSilentMode: false, shouldPlayInBackground: false };
    let answer: () => void = noop;
    mockPhone.modeGate = new Promise<void>((resolve) => (answer = resolve));
    await render(piece(A, true));
    await settle();
    expect(mockPhone.players.get(A)!.play).not.toHaveBeenCalled();
    answer();
    await settle();
    expect(mockPhone.players.get(A)!.audible).toBe(true);
  });

  it('the theme keeps today\'s mode: on an iPhone with the switch on it still obeys the switch, on Android it does not', async () => {
    for (const os of ['ios', 'android'] as const) {
      platform = jest.replaceProperty(Platform, 'OS', os);
      mockPhone.mode = { playsInSilentMode: os !== 'ios', shouldPlayInBackground: false };
      mockPhone.players = new Map();
      music.resetThemeMusicForTests();
      await act(async () => void (await music.toggleThemeMusic()));
      expect(mockPhone.players.get(THEME_FILE)!.audible).toBe(os !== 'ios');
      expect(index('mode')).toBe(-1);
      platform.restore();
    }
  });

  it('on Android the switch never mattered and the piece is heard', async () => {
    platform = jest.replaceProperty(Platform, 'OS', 'android');
    await render(piece(A, true));
    await settle();
    expect(mockPhone.players.get(A)!.audible).toBe(true);
  });
});
