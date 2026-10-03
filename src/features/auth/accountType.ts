import { useSyncExternalStore } from 'react';

/** What A2 asks: someone who has come to discover and buy, or to earn. The sign-up screens after it read the pick. */
export type AccountType = 'discover' | 'earn';

let picked: AccountType | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The pick so far, and the way to change it. Nothing is picked until the user picks one. */
export function useAccountType(): [AccountType | null, (next: AccountType) => void] {
  const current = useSyncExternalStore(subscribe, () => picked, () => picked);
  const pick = (next: AccountType) => {
    picked = next;
    listeners.forEach((listener) => listener());
  };
  return [current, pick];
}

/** Reads the pick outside a component (the screen that follows A2 sends it with the sign-up). */
export const pickedAccountType = (): AccountType | null => picked;

/**
 * Forgets the pick. Called when a new visit to the signed-out screens starts (the
 * welcome screen mounts, as it does after a sign-out) and when a sign-in succeeds, so
 * one person's pick never reaches the next person's sign-up on a shared phone. The pick
 * lives in memory only: it survives Back and return within a sign-up, and is lost on a
 * reload or when Android ends the app (Default (agent), owner may override). It holds no secret.
 */
export function clearAccountType() {
  picked = null;
  listeners.forEach((listener) => listener());
}
