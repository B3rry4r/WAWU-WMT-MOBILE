import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

import { loadMusic, saveMusic } from '@/features/settings/devicePrefs';

import { onPieceSound } from './pieceSound';
import { fetchTrack, savedTrack } from './themeTrack';

/**
 * The WAWU theme (R-99), the website's own track played in the app. One player for the whole app, outside React like the
 * website's (`src/lib/sound.ts`), so it goes on across screens and the controls (the button above Create, the Settings
 * row) read and flip the same state.
 *
 * Silence is the default: nothing is fetched or played until a tap. The first tap downloads the song to the phone (`themeTrack`),
 * later taps play the file kept there. It loops. It never plays in the background: it pauses when the app leaves the screen and
 * plays again on return if it was on. A piece with sound starting stops it (`pieceSound`). Whether it is on is kept on the
 * phone only (`devicePrefs`), so a person who left it on hears it when the app next opens.
 */
export const THEME_FAILED = 'The WAWU theme could not be downloaded. Check your connection and try again.';

export type ThemeMusicState = {
  /** What the button and the Music row show: the song is on (playing, or paused only because the app is away). */
  on: boolean;
  /** The song is being downloaded for the first time. */
  busy: boolean;
  /** A line to say, once: the download failed. */
  notice: string | null;
};

const OFF: ThemeMusicState = { on: false, busy: false, notice: null };

let state = OFF;
let player: AudioPlayer | null = null;
let appWatch: NativeEventSubscription | null = null;
/** Moves on every stop and every piece starting, so an answer that was waited for after that is known to be stale. */
let turn = 0;
const listeners = new Set<() => void>();

function publish(next: Partial<ThemeMusicState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeMusic(): ThemeMusicState {
  return state;
}

/** The song's state for a screen. */
export function useThemeMusic(): ThemeMusicState {
  return useSyncExternalStore(subscribe, getThemeMusic, getThemeMusic);
}

function remember(on: boolean) {
  // Kept on this phone only. A store that will not write leaves this session as it is.
  void saveMusic(on).catch(() => undefined);
}

/** The phone leaving the screen pauses the song (never plays in the background); coming back plays it again if it was on. */
function watchApp() {
  appWatch ??= AppState.addEventListener('change', (next: AppStateStatus) => {
    if (!player) return;
    if (next !== 'active') player.pause();
    else if (state.on) player.play();
  });
}

function playFrom(uri: string) {
  if (!player) {
    player = createAudioPlayer(uri);
    player.loop = true;
  }
  watchApp();
  player.play();
}

/** The Music row and the button, off to on. The song is downloaded on the first ask only. */
async function turnOn(): Promise<void> {
  if (state.busy || state.on) return;
  const mine = ++turn;
  publish({ notice: null });
  let uri = savedTrack();
  try {
    if (!uri) {
      publish({ busy: true });
      uri = await fetchTrack();
    }
  } catch {
    if (mine === turn) publish({ busy: false, notice: THEME_FAILED });
    else publish({ busy: false });
    return;
  }
  publish({ busy: false });
  // A piece started, or somebody stopped it, while the song was coming down: it does not start after all.
  if (mine !== turn) return;
  try {
    playFrom(uri);
  } catch {
    publish({ notice: THEME_FAILED });
    return;
  }
  publish({ on: true });
  remember(true);
}

function turnOff(forget: boolean): void {
  turn += 1;
  if (player) player.pause();
  if (state.on || state.busy) publish({ on: false, busy: false });
  if (forget) remember(false);
}

/** The button: off to on, or on to off. */
export async function toggleThemeMusic(): Promise<void> {
  if (state.busy) return;
  if (state.on) turnOff(true);
  else await turnOn();
}

/** The Music switch asks for a state; asking for the one it is in does nothing. */
export async function setThemeMusic(next: boolean): Promise<void> {
  if (next === state.on || state.busy) return;
  await toggleThemeMusic();
}

/** The toast has been seen. */
export function clearThemeNotice(): void {
  if (state.notice) publish({ notice: null });
}

/**
 * When the app opens: plays again only if the person left it on and the song is still on the phone. It never downloads here,
 * because the song is fetched on a tap only.
 */
export async function resumeThemeMusic(): Promise<void> {
  if (state.on || state.busy) return;
  const mine = turn;
  if (!(await loadMusic())) return;
  const uri = savedTrack();
  if (!uri || mine !== turn || state.on || state.busy) return;
  try {
    playFrom(uri);
  } catch {
    return;
  }
  publish({ on: true });
}

// A piece with sound starting takes the floor, and the button shows off. The song stays off until the person taps again.
function yieldToPiece() {
  if (state.on || state.busy) turnOff(true);
}
onPieceSound(yieldToPiece);

/** Forgets everything the module holds. Tests only. */
export function resetThemeMusicForTests(): void {
  appWatch?.remove();
  appWatch = null;
  player = null;
  turn = 0;
  state = OFF;
  listeners.clear();
  onPieceSound(yieldToPiece);
}
