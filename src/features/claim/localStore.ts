import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Two small things about this phone and this account that the claim feature remembers: whether the "Have an access
 * code?" step is still to be shown, and which token was current when a contact was last proven (so a claim knows its
 * token may be older than the proof). Nothing here is a secret and nothing is sent anywhere; the secure store is the one
 * store the app already ships, and the browser build used for development keeps them in localStorage.
 *
 * Every call is bounded and never throws: a store that fails or hangs reads as "nothing remembered", so a broken store
 * can never stop the app from opening (the step is simply not shown, the claim simply asks the Hub).
 */
const onWeb = Platform.OS === 'web';

/** How long a read or write may take before it is treated as "nothing". */
export const STORE_WAIT_MS = 1500;

/** Settles to `fallback` when `work` fails or takes longer than `STORE_WAIT_MS`. */
export function bounded<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), STORE_WAIT_MS);
    let running: Promise<T>;
    try {
      running = work();
    } catch {
      clearTimeout(timer);
      resolve(fallback);
      return;
    }
    running.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export const readLocal = (key: string): Promise<string | null> =>
  bounded(async () => (onWeb ? (globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key)), null);

export const writeLocal = (key: string, value: string): Promise<void> =>
  bounded(async () => {
    if (onWeb) globalThis.localStorage?.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  }, undefined);

/** One account's keys. A WAWU ID `sub` is a UUID, which the secure store accepts in a key. */
export const offerKey = (sub: string) => `wmt.claim.offer.${sub}`;
export const proofKey = (sub: string) => `wmt.claim.proof.${sub}`;
