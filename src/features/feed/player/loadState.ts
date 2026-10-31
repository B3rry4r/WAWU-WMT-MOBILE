import type { LoadState } from './types';

/**
 * R-117 · how long a player that was asked to play may wait for its file before it says it could not (a pacing figure, not a product one). A
 * player that has been waiting this long is `failed`: the spinner never stays on for ever. The audio player reports nothing when a file
 * cannot be fetched, so for it this is the only way a bad link is ever heard of (the Bio player used the same figure on its own).
 */
export const LOAD_PATIENCE_MS = 15000;

/** What `expo-audio` says of a file (the player's own fields, or a status update): loaded, buffering, an error. */
export type AudioLoadFacts = { isLoaded?: boolean; isBuffering?: boolean; error?: string | null };

/** `false` or `true` is a fact; a player that says nothing (a stand-in, the web) is not waiting. */
export function audioLoadState(facts: AudioLoadFacts): LoadState {
  if (facts.error) return 'failed';
  return facts.isLoaded === false || facts.isBuffering === true ? 'waiting' : 'ready';
}

/** `expo-video`'s `status`: `loading` is the file coming in (and the player running dry), `error` a file it cannot play. */
export function videoLoadState(status: string | undefined | null): LoadState {
  if (status === 'error') return 'failed';
  return status === 'loading' ? 'waiting' : 'ready';
}

export type LoadTracker = {
  /** The player's reading of the file. `failed` stays until the player is ready or `begin` is called. */
  set: (next: LoadState) => void;
  /** A new ask to play: forgets an earlier failure. */
  begin: () => void;
  /** Nothing is asked of the player (paused, or gone): the state is `ready` and the patience timer is off. A `failed` is not unsaid. */
  idle: () => void;
};

/**
 * Reports a player's load state to `report`, only when it changes, and turns a wait that outlasts the patience into `failed`. The timer
 * runs only while waiting, so a player that is ready, paused or gone holds none.
 */
export function createLoadTracker(report: (state: LoadState) => void, patience: number = LOAD_PATIENCE_MS): LoadTracker {
  let state: LoadState = 'ready';
  let timer: ReturnType<typeof setTimeout> | null = null;
  const stopTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const move = (next: LoadState) => {
    if (next === state) return;
    state = next;
    stopTimer();
    if (next === 'waiting') {
      timer = setTimeout(() => {
        timer = null;
        move('failed');
      }, patience);
    }
    report(next);
  };
  return {
    set: (next) => {
      // A file that failed stays failed until the person asks again or the player is really ready.
      if (state === 'failed' && next === 'waiting') return;
      move(next);
    },
    begin: () => {
      stopTimer();
      if (state === 'failed') move('ready');
    },
    idle: () => {
      stopTimer();
      // A failure was reported once and is the screen's to show; stopping the player (which it does when it fails) must not unsay it.
      if (state === 'failed') state = 'ready';
      else move('ready');
    },
  };
}
