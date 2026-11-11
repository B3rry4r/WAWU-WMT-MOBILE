/** The channel every tab of the web app listens on; one message means "the session in the tab that sent it has ended". */
export const SESSION_CHANNEL = 'wmt-session';
/** The key the session module keeps the access token under (`ACCESS_KEY` in `src/api/tokenStore.ts`); its removal is the fallback signal. */
export const ACCESS_TOKEN_KEY = 'wawu.session.access';

let channel: BroadcastChannel | null = null;
const open = (): BroadcastChannel | null => {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(SESSION_CHANNEL);
    // Node (the tests) keeps its process alive for an open channel; a browser has no such method.
    (channel as unknown as { unref?: () => void }).unref?.();
  }
  return channel;
};

/** Tells every other open tab (only a browser has a BroadcastChannel or a window; a phone does nothing here) that this tab's session ended. The web only; a tab that cannot broadcast says nothing (the others use the storage event). */
export function announceSessionEnd(): void {
  try {
    open()?.postMessage('ended');
  } catch {
    // A closed channel or a refused post leaves the other tabs to the storage event.
  }
}

/**
 * Calls `handler` when another tab's session ends: a BroadcastChannel message, or, where the browser has none, the removal of the
 * access token from localStorage (the browser fires `storage` in the other tabs only). Returns the stop function.
 */
export function onOtherTabSessionEnd(handler: () => void): () => void {
  const bc = open();
  if (bc) {
    const listen = () => handler();
    bc.addEventListener('message', listen);
    return () => bc.removeEventListener('message', listen);
  }
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => undefined;
  const listen = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY && event.newValue === null) handler();
  };
  window.addEventListener('storage', listen);
  return () => window.removeEventListener('storage', listen);
}
