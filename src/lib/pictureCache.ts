import { Platform } from 'react-native';

import { onSessionEnd } from '@/api/session';

/** The worker's file in the web export (`public/wmt-sw.js`). */
export const PICTURE_WORKER = '/wmt-sw.js';

/** The worker's cache (`CACHE` in `public/wmt-sw.js`; a test keeps the two equal). */
export const PICTURE_CACHE = 'wmt-pictures-v1';

/**
 * Deletes every held picture. The worker answers from a picture's address alone and no longer checks the signature (that is the
 * point: the Hub signs again on every visit), so the signed link that proved the account could see a picture is only checked
 * when the picture is first fetched. A held picture must therefore never outlive the account that fetched it: it could be a
 * paid piece's full picture, or one whose access was since refunded or removed, and the next person on a shared browser
 * would be answered it for a request with any signature at all.
 */
export function clearPictureCache(): Promise<boolean> {
  if (typeof caches === 'undefined') return Promise.resolve(false);
  return caches.delete(PICTURE_CACHE).catch(() => false);
}

let clearingOnSessionEnd = false;

/**
 * WEBAPP-12: on the web build only, starts the worker that keeps pictures under their own address, so a picture the Hub signs
 * again on the next visit is not downloaded again. A phone has no browser worker and does nothing here; a browser without
 * service workers, or one that refuses it (a private window), shows its pictures as it always did.
 */
export function registerPictureCache(): void {
  if (Platform.OS === 'web' && !clearingOnSessionEnd) {
    // Sign-out, a refused refresh, and a sign-in that replaces another account all end a session (`onSessionEnd`).
    clearingOnSessionEnd = true;
    onSessionEnd(() => void clearPictureCache());
  }
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const start = () => {
    navigator.serviceWorker.register(PICTURE_WORKER).catch(() => undefined);
  };
  if (typeof document !== 'undefined' && document.readyState !== 'complete' && typeof window !== 'undefined') {
    window.addEventListener('load', start, { once: true });
  } else {
    start();
  }
}
