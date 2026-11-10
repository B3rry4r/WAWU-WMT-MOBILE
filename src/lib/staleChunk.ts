import { Platform } from 'react-native';

/** Session key holding the time of the last reload this module made. */
export const RELOAD_STAMP_KEY = 'wmt-chunk-reload-at';
/** A second failed load inside this window is shown as the normal error screen, never reloaded again. */
export const RELOAD_WINDOW_MS = 60_000;

/**
 * WEBAPP-12: the web export loads each route as its own hashed file. A tab left open across a deploy still asks for the old
 * names, the host answers them with `index.html`, and the browser refuses that as a script. Metro's loader rejects with an
 * `AsyncRequireError` ("Loading module ... failed"); the browsers' own bundlers use `ChunkLoadError`.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'AsyncRequireError' || name === 'ChunkLoadError') return true;
  return typeof message === 'string' && /^Loading module .+ failed\./.test(message);
}

/**
 * Reloads the page once so it takes the new deploy's file names (`index.html` is never cached), and returns true if it did.
 * The reload keeps the address the person was going to. A stamp in the tab's session storage stops it from looping: a failed
 * load within `RELOAD_WINDOW_MS` of the last reload returns false, and the error screen shows. Storage that cannot be read or
 * written also returns false, since a loop could not be ruled out. The web only; a phone has no chunks.
 */
export function reloadForNewDeploy(error: unknown, now: number = Date.now()): boolean {
  if (Platform.OS !== 'web' || !isChunkLoadError(error)) return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_STAMP_KEY));
    if (last && now - last >= 0 && now - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_STAMP_KEY, String(now));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}
