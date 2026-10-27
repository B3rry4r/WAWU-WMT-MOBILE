/* eslint-disable @typescript-eslint/no-require-imports */
import { act, render } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * THEME-MUSIC (R-99): the one WAWU theme player. The phone's audio, its file store and its saved choices are stood in
 * here; the module under test is the real one.
 */
const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockPlayer = { play: jest.fn(), pause: jest.fn(), remove: jest.fn(), loop: false };
const mockCreate = jest.fn((..._args: unknown[]) => mockPlayer);
jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreate(...args),
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(() => Promise.resolve()), addListener: jest.fn(() => ({ remove: jest.fn() })) }),
}));

const FILE = 'file:///documents/wawu-theme.mp3';
let mockSaved: string | null = null;
let mockSavedThrows = false;
let mockAppState: AppStateStatus = 'active';
let mockDownload: () => Promise<string>;
const mockDownloadCalls = jest.fn();
jest.mock('../themeTrack', () => ({
  THEME_URL: 'https://wawuafrica.com/wawu-theme.mp3',
  savedTrack: () => {
    if (mockSavedThrows) throw new Error('The documents folder could not be read');
    return mockSaved;
  },
  fetchTrack: () => {
    mockDownloadCalls();
    return mockDownload();
  },
}));

type Music = typeof import('../themeMusic');
let music: Music;
let appChange: ((next: AppStateStatus) => void) | null = null;
const appRemove = jest.fn();

const downloads = () => {
  mockDownload = async () => {
    mockSaved = FILE;
    return FILE;
  };
};

beforeEach(() => {
  mockStore.clear();
  mockSaved = null;
  mockSavedThrows = false;
  mockAppState = 'active';
  appChange = null;
  jest.clearAllMocks();
  mockPlayer.loop = false;
  downloads();
  Object.defineProperty(AppState, 'currentState', { configurable: true, get: () => mockAppState });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_type: string, handler: (next: AppStateStatus) => void) => {
    appChange = handler;
    return { remove: appRemove };
  }) as never);
  music = require('../themeMusic');
  music.resetThemeMusicForTests();
});

const appTo = (next: AppStateStatus) => act(async () => {
  mockAppState = next;
  appChange?.(next);
});
const tap = () => act(async () => void (await music.toggleThemeMusic()));

describe('the WAWU theme player', () => {
  it('is silent until somebody taps: nothing is fetched, nothing is created, nothing plays', async () => {
    await act(async () => music.resumeThemeMusic());
    expect(music.getThemeMusic()).toEqual({ on: false, busy: false, notice: null });
    expect(mockDownloadCalls).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('the first tap fetches the song once, plays it on a loop and remembers it is on', async () => {
    await tap();
    expect(mockDownloadCalls).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0]?.[0]).toBe(FILE);
    expect(mockPlayer.loop).toBe(true);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(music.getThemeMusic()).toMatchObject({ on: true, busy: false, notice: null });
    expect(mockStore.get('wmt.pref.music')).toBe('on');
  });

  it('shows it is working while the song downloads, and ignores a second tap meanwhile', async () => {
    let finish: (uri: string) => void = () => undefined;
    mockDownload = () => new Promise<string>((resolve) => (finish = resolve));
    const first = music.toggleThemeMusic();
    expect(music.getThemeMusic().busy).toBe(true);
    await act(async () => void (await music.toggleThemeMusic()));
    expect(mockDownloadCalls).toHaveBeenCalledTimes(1);
    mockSaved = FILE;
    await act(async () => {
      finish(FILE);
      await first;
    });
    expect(music.getThemeMusic()).toMatchObject({ on: true, busy: false });
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('later taps reuse the file kept on the phone: one fetch, one player, pause and play again', async () => {
    await tap();
    await tap();
    expect(music.getThemeMusic().on).toBe(false);
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(mockStore.get('wmt.pref.music')).toBe('off');
    await tap();
    expect(music.getThemeMusic().on).toBe(true);
    expect(mockDownloadCalls).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);
  });

  it('a download that fails says so, stays off, plays nothing and remembers nothing; the next tap tries again', async () => {
    mockDownload = async () => {
      throw new Error('Network request failed');
    };
    await tap();
    expect(music.getThemeMusic()).toEqual({ on: false, busy: false, notice: music.THEME_FAILED });
    expect(music.THEME_FAILED).not.toMatch(/—/);
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(mockStore.has('wmt.pref.music')).toBe(false);
    downloads();
    await tap();
    expect(music.getThemeMusic()).toMatchObject({ on: true, notice: null });
    expect(mockDownloadCalls).toHaveBeenCalledTimes(2);
  });

  it('the notice can be put away', async () => {
    mockDownload = async () => {
      throw new Error('offline');
    };
    await tap();
    await act(async () => music.clearThemeNotice());
    expect(music.getThemeMusic().notice).toBeNull();
  });

  it('a person who left it on hears it again when the app opens; one who left it off does not', async () => {
    await tap();
    music.resetThemeMusicForTests();
    mockPlayer.play.mockClear();
    await act(async () => music.resumeThemeMusic());
    expect(music.getThemeMusic().on).toBe(true);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);

    await tap();
    music.resetThemeMusicForTests();
    mockPlayer.play.mockClear();
    await act(async () => music.resumeThemeMusic());
    expect(music.getThemeMusic().on).toBe(false);
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('left on but the song is no longer on the phone: it stays silent and does not download without a tap', async () => {
    mockStore.set('wmt.pref.music', 'on');
    await act(async () => music.resumeThemeMusic());
    expect(music.getThemeMusic().on).toBe(false);
    expect(mockDownloadCalls).not.toHaveBeenCalled();
  });

  it('pauses when the app leaves the screen and plays again on return, only if it was on', async () => {
    await tap();
    await appTo('background');
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(music.getThemeMusic().on).toBe(true);
    await appTo('active');
    expect(mockPlayer.play).toHaveBeenCalledTimes(2);

    await tap();
    mockPlayer.play.mockClear();
    await appTo('background');
    await appTo('active');
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('never asks the phone to play in the background', async () => {
    await tap();
    expect(mockCreate.mock.calls[0]?.[1]).toBeUndefined();
    expect(Object.keys(mockPlayer)).not.toContain('staysActiveInBackground');
  });

  it('a piece with sound starting stops it, the button shows off, and it stays off next time', async () => {
    await tap();
    const { pieceStartedSound } = require('../pieceSound') as typeof import('../pieceSound');
    await act(async () => pieceStartedSound());
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(music.getThemeMusic().on).toBe(false);
    expect(mockStore.get('wmt.pref.music')).toBe('off');
  });

  it('a piece starting while the song is still downloading means it does not start afterwards', async () => {
    let finish: (uri: string) => void = () => undefined;
    mockDownload = () => new Promise<string>((resolve) => (finish = resolve));
    const first = music.toggleThemeMusic();
    const { pieceStartedSound } = require('../pieceSound') as typeof import('../pieceSound');
    await act(async () => pieceStartedSound());
    mockSaved = FILE;
    await act(async () => {
      finish(FILE);
      await first;
    });
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(music.getThemeMusic()).toMatchObject({ on: false, busy: false, notice: null });
  });

  it('listens for the app leaving the screen from setup, before anything has played', async () => {
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(appChange).not.toBeNull();
    await appTo('background');
    await appTo('active');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('a download that finishes while the app is in the background does not start the song; it starts when the app returns, if still on', async () => {
    let finish: (uri: string) => void = () => undefined;
    mockDownload = () => new Promise<string>((resolve) => (finish = resolve));
    const first = music.toggleThemeMusic();
    await appTo('background');
    mockSaved = FILE;
    await act(async () => {
      finish(FILE);
      await first;
    });
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(music.getThemeMusic()).toMatchObject({ on: true, busy: false });
    await appTo('active');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('a start that is waiting for the app to return is cancelled by a piece starting, and does not play on return', async () => {
    mockSaved = FILE;
    await appTo('background');
    await tap();
    expect(music.getThemeMusic().on).toBe(true);
    const { pieceStartedSound } = require('../pieceSound') as typeof import('../pieceSound');
    await act(async () => pieceStartedSound());
    await appTo('active');
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(music.getThemeMusic().on).toBe(false);
  });

  it('opening the app in the background does not play the song until the app is on screen', async () => {
    await tap();
    music.resetThemeMusicForTests();
    mockPlayer.play.mockClear();
    mockCreate.mockClear();
    await appTo('background');
    await act(async () => music.resumeThemeMusic());
    expect(mockPlayer.play).not.toHaveBeenCalled();
    await appTo('active');
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('a saved file that cannot be read is a notice for a tap, and silence at open', async () => {
    mockSavedThrows = true;
    await tap();
    expect(music.getThemeMusic()).toEqual({ on: false, busy: false, notice: music.THEME_FAILED });
    mockStore.set('wmt.pref.music', 'on');
    await act(async () => music.resumeThemeMusic());
    expect(music.getThemeMusic().on).toBe(false);
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('sign-out stops the song, releases the player and forgets the on for this run; the phone\'s own choice stays', async () => {
    const session = require('@/api/session') as typeof import('@/api/session');
    await session.adoptSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    await tap();
    expect(music.getThemeMusic().on).toBe(true);
    mockPlayer.pause.mockClear();
    await act(async () => session.signOut());
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
    expect(mockPlayer.remove).toHaveBeenCalledTimes(1);
    expect(music.getThemeMusic()).toEqual({ on: false, busy: false, notice: null });
    expect(mockStore.get('wmt.pref.music')).toBe('on');

    // The next person to open the app on this phone meets the phone's choice, with a new player.
    await session.adoptSession({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    await act(async () => music.resumeThemeMusic());
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(music.getThemeMusic().on).toBe(true);
    await act(async () => session.signOut());
    expect(music.getThemeMusic().on).toBe(false);
  });

  it('sign-out while the song downloads means it never starts', async () => {
    const session = require('@/api/session') as typeof import('@/api/session');
    await session.adoptSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    let finish: (uri: string) => void = () => undefined;
    mockDownload = () => new Promise<string>((resolve) => (finish = resolve));
    const first = music.toggleThemeMusic();
    await act(async () => session.signOut());
    mockSaved = FILE;
    await act(async () => {
      finish(FILE);
      await first;
    });
    expect(mockPlayer.play).not.toHaveBeenCalled();
    expect(music.getThemeMusic()).toEqual({ on: false, busy: false, notice: null });
  });

  it('the Settings switch asks for a state: on starts it, off stops it, and asking for the state it is in does nothing', async () => {
    await act(async () => void (await music.setThemeMusic(false)));
    expect(mockPlayer.pause).not.toHaveBeenCalled();
    await act(async () => void (await music.setThemeMusic(true)));
    await act(async () => void (await music.setThemeMusic(true)));
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    await act(async () => void (await music.setThemeMusic(false)));
    expect(music.getThemeMusic().on).toBe(false);
  });
});

describe('where pieces start playing', () => {
  it('the feed players tell the theme when a piece plays, and not when it is paused', async () => {
    const { AudioSource, VideoSurface } = require('@/features/feed/player') as typeof import('@/features/feed/player');
    const noop = () => undefined;
    await tap();
    const props = { uri: 'https://example.test/a.mp3', seek: null, onTime: noop, onEnded: noop };
    const view = await render(<AudioSource {...props} playing={false} />);
    expect(music.getThemeMusic().on).toBe(true);
    await view.rerender(<AudioSource {...props} playing />);
    expect(music.getThemeMusic().on).toBe(false);

    await tap();
    expect(music.getThemeMusic().on).toBe(true);
    const video = await render(<VideoSurface {...props} frosted={false} playing />);
    expect(music.getThemeMusic().on).toBe(false);
    await video.unmount();
  });
});
