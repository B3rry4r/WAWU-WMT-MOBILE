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

/** Clears the pick between tests. */
export function resetAccountTypeForTests() {
  picked = null;
  listeners.forEach((listener) => listener());
}
