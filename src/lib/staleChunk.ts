import { Platform } from 'react-native';

/** Session key holding the time of the last reload this module made. */
export const RELOAD_STAMP_KEY = 'wmt-chunk-reload-at';
/** A second failed load inside this window is shown as the normal error screen, never reloaded again. */
export const RELOAD_WINDOW_MS = 60_000;

/** How far back an address the person was going to still counts when the error screen has already replaced it with `/`. */
export const TARGET_WINDOW_MS = 30_000;
let recent: { href: string; at: number }[] = [];

/**
 * The router moves the address to the route being opened, and the error screen then puts it back to `/`. So the page remembers the
 * addresses it was given (`pushState` and `replaceState`), and a reload from the error screen goes to the address the person was
 * going to. The web only, once.
 */
export function rememberAddresses(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.history === 'undefined') return;
  const h = window.history as History & { __wmtTracked?: boolean };
  if (h.__wmtTracked) return;
  h.__wmtTracked = true;
  for (const name of ['pushState', 'replaceState'] as const) {
    const original = h[name].bind(h);
    h[name] = (...args: Parameters<History['pushState']>) => {
      original(...args);
      try {
        recent = [...recent, { href: window.location.href, at: Date.now() }].slice(-8);
      } catch {
        // Not being able to remember an address only means the reload goes to the one showing.
      }
    };
  }
}

/** Puts the address the person was going to back in the bar (no navigation), when the error screen has replaced it with the root. */
function restoreTarget(now: number): void {
  try {
    moveToTarget(now);
  } catch {
    // The reload still goes ahead, to the address showing.
  }
}

function moveToTarget(now: number): void {
  const here = new URL(window.location.href);
  if (here.pathname !== '/') return;
  const target = [...recent].reverse().find((r) => now - r.at <= TARGET_WINDOW_MS && new URL(r.href).pathname !== '/');
  if (target) Object.getPrototypeOf(window.history).replaceState.call(window.history, window.history.state, '', target.href);
}

/** For tests: forgets the remembered addresses. */
export function resetRememberedAddresses(): void {
  recent = [];
}

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
  // Offline, a reload lands on the browser's own offline page: Try again and any unsent draft are lost. The error screen stays instead.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_STAMP_KEY));
    if (last && now - last >= 0 && now - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_STAMP_KEY, String(now));
    restoreTarget(now);
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

rememberAddresses();
