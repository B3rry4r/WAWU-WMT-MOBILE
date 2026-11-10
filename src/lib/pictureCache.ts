import { Platform } from 'react-native';

/** The worker's file in the web export (`public/wmt-sw.js`). */
export const PICTURE_WORKER = '/wmt-sw.js';

/**
 * WEBAPP-12: on the web build only, starts the worker that keeps pictures under their own address, so a picture the Hub signs
 * again on the next visit is not downloaded again. A phone has no browser worker and does nothing here; a browser without
 * service workers, or one that refuses it (a private window), shows its pictures as it always did.
 */
export function registerPictureCache(): void {
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
