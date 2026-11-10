import { useCallback, useEffect, useRef, useState } from 'react';

import type { LoadState } from './types';

/**
 * R-117 · what a screen with a player of its own reads from the player's `onLoad`: `waiting` while the file is coming in (the play button
 * shows the spinner in its place), `failed` when it will not load (the screen says so in words), and `attempt`, which goes up when the person
 * asks again after a failure, so the screen can give the player a new `key` (a fresh player asks for the file again; the old one keeps its error).
 * `playing` is what the screen asks of the player. A failure is cleared the moment the person asks to play again.
 */
export function usePlayerLoad(playing: boolean, onFailed?: () => void) {
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [was, setWas] = useState(playing);
  const stop = useRef(onFailed);
  useEffect(() => {
    stop.current = onFailed;
  });
  // A new ask to play after a failure is a new attempt (adjusted while rendering, so the child player sees it in the same pass).
  if (playing !== was) {
    setWas(playing);
    if (playing && failed) {
      setFailed(false);
      setAttempt((n) => n + 1);
    }
  }
  const onLoad = useCallback((state: LoadState) => {
    setWaiting(state === 'waiting');
    if (state === 'failed') {
      setFailed(true);
      stop.current?.();
    } else if (state === 'ready') setFailed(false);
  }, []);
  return { waiting: waiting && playing, failed, attempt, onLoad };
}
