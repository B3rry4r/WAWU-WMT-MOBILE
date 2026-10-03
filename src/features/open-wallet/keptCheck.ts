import { useSyncExternalStore } from 'react';

import type { BvnCheck } from '@/api/walletIdentity';

/**
 * The answer to the BVN check that passed on A26, held for A5 (KYC-03): the
 * name, date of birth and gender the BVN gave (`prefill`) and the step's state
 * (`identity`: last 4 digits only). The backend answers the prefill once and
 * does not keep it (BACKEND_GAPS G-25), so the app holds it, in memory only:
 * never the secure store, never logged, gone when the app process ends.
 *
 * It belongs to one account. A different person signed in on the same phone
 * reads nothing (`readKeptCheck` compares the owner), and `forgetKeptCheck`
 * drops it once Open your wallet no longer needs it.
 *
 * It never holds the BVN or the NIN themselves: those live in A26's fields
 * until the check answers, and no longer.
 */
type Kept = { owner: string; check: BvnCheck };

let kept: Kept | null = null;
const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => listener());
}

export function keepCheck(owner: string, check: BvnCheck): void {
  kept = { owner, check: { identity: { ...check.identity }, prefill: { ...check.prefill } } };
  changed();
}

/** The kept check for this account, or null (none kept, or another person's). */
export function readKeptCheck(owner: string | undefined): BvnCheck | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.check;
}

export function forgetKeptCheck(): void {
  if (!kept) return;
  kept = null;
  changed();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For A5 and A26: the kept check for this account, re-read when it changes. */
export function useKeptCheck(owner: string | undefined): BvnCheck | null {
  const current = useSyncExternalStore(subscribe, () => kept, () => kept);
  if (!current || !owner || current.owner !== owner) return null;
  return current.check;
}
