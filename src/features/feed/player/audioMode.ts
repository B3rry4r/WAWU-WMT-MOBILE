import { setAudioModeAsync, type AudioMode } from 'expo-audio';
import { Platform } from 'react-native';

/**
 * R-115 · the phone's audio session while a person LISTENS to something (an audio piece, an audiobook, a podcast, a Studio
 * result, a preview). The session is one setting for the whole app, so it is held only while a content player is playing:
 *
 * - `playsInSilentMode`: a piece the person pressed play on is heard with the iPhone's silent switch on (the phone's default
 *   session obeys the switch and plays nothing). The call is made BEFORE `play()`, and `holdContentAudio().ready` is what the player
 *   waits for.
 * - `shouldPlayInBackground`: a piece WITH A TITLE keeps playing when the screen locks or the app is left (a short clip without one
 *   does not, see `CLIP_MODE`). The binary allows it (`app.json`: `expo-audio` `enableBackgroundPlayback`, which adds the iPhone
 *   `audio` background mode and the Android media-playback foreground service); this is the setting that tells `expo-audio` not to
 *   pause its players on the way out.
 * - `doNotMix`: exclusive audio focus, which the lock screen controls need (`expo-audio`'s own rule).
 *
 * The WAWU theme (R-99) never takes this mode: when the last content player lets go, the session goes back to what the phone has
 * before anything sets one, so the theme pauses when the app leaves the screen exactly as it did before (the phone pauses it, and
 * the theme's own AppState listener does too). A piece starting also stops the theme (`pieceSound`), so the two are never both on
 * in the content mode.
 *
 * Content playing and a recording at once is not a state the app draws (recording is its own screen), so a mode set here does not
 * carry `allowsRecording`.
 */
export const CONTENT_MODE: Partial<AudioMode> = {
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'doNotMix',
  allowsRecording: false,
  shouldRouteThroughEarpiece: false,
};

/**
 * A short voice clip (Hear name, Voice Intro playback, a voice sample) has no title: it is heard with the silent switch on, but it
 * stops when the app leaves the screen, as before, and takes no lock screen.
 */
export const CLIP_MODE: Partial<AudioMode> = { ...CONTENT_MODE, shouldPlayInBackground: false };

/**
 * What the phone has before anything sets a mode, which is where the theme plays, and what the app used before R-115 (it set none
 * for listening): the iPhone obeys the silent switch (category `.soloAmbient`: `playsInSilentMode` false with `doNotMix`), Android
 * does not (its native default asks transient focus, which `doNotMix` also asks); nothing stays on in the background.
 */
export function restingMode(): Partial<AudioMode> {
  return {
    playsInSilentMode: Platform.OS !== 'ios',
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  };
}

/** How many content players are playing right now: those with a title (they keep on in the background) and the short clips. */
let titled = 0;
let clips = 0;
/** Which mode the phone was last given: the content mode, the clip mode, or the resting one. */
let inForce: 'content' | 'clip' | 'rest' = 'rest';
/** The last mode call, so the next one is made after it and the order the phone sees is the order made. */
let applied: Promise<void> = Promise.resolve();

/** Sets the mode after every earlier call. A phone that refuses (or a build without the module) must never stop a piece playing. */
function apply(mode: Partial<AudioMode>): Promise<void> {
  applied = applied.then(() => setAudioModeAsync(mode)).catch(() => undefined);
  return applied;
}

export type ContentHold = {
  /** Resolves once the content mode is on the phone; `play()` waits for it. */
  ready: Promise<void>;
  /** The player stopped, ended or went away. The last one out puts the resting mode back. Safe to call twice. */
  release: () => void;
};

/** Puts the mode the players now playing need on the phone, if it is not already there. */
function sync(): Promise<void> {
  const want = titled > 0 ? 'content' : clips > 0 ? 'clip' : 'rest';
  if (want !== inForce) {
    inForce = want;
    void apply(want === 'content' ? CONTENT_MODE : want === 'clip' ? CLIP_MODE : restingMode());
  }
  return applied;
}

/** A content player is about to play. A piece with a title stays on in the background; a clip without one does not. */
export function holdContentAudio(hasTitle: boolean): ContentHold {
  if (hasTitle) titled += 1;
  else clips += 1;
  const ready = sync();
  let released = false;
  return {
    ready,
    release: () => {
      if (released) return;
      released = true;
      if (hasTitle) titled -= 1;
      else clips -= 1;
      void sync();
    },
  };
}

/** Forgets the count and the queue. Tests only. */
export function resetContentAudioForTests(): void {
  titled = 0;
  clips = 0;
  inForce = 'rest';
  applied = Promise.resolve();
}
