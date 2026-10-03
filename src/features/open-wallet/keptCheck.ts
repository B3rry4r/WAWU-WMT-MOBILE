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
 * A check is charged and can take seconds, and its answer can arrive after
 * the screen that sent it has closed or the session has ended. So a write
 * needs a ticket taken when the check is sent (`ticketFor`), and every
 * `forgetKeptCheck` (sign-out, session end, another account, leaving the
 * step) voids every ticket already handed out: a late answer is refused,
 * never kept.
 *
 * It never holds the BVN or the NIN themselves: those live in A26's fields
 * until the check answers, and no longer.
 */
type Kept = { owner: string; check: BvnCheck };

let kept: Kept | null = null;
/** Bumped by every forget: a ticket from before it can no longer write. */
let era = 0;
const listeners = new Set<() => void>();

/** Taken when a check is sent; good for one write while nothing is forgotten. */
export type KeepTicket = { readonly owner: string; readonly era: number };

export function ticketFor(owner: string): KeepTicket {
  return { owner, era };
}

function changed() {
  listeners.forEach((listener) => listener());
}

/** Keeps the check for the ticket's owner. False, and nothing kept, when the ticket was voided by a forget. */
export function keepCheck(ticket: KeepTicket, check: BvnCheck): boolean {
  if (ticket.era !== era) return false;
  kept = { owner: ticket.owner, check: { identity: { ...check.identity }, prefill: { ...check.prefill } } };
  changed();
  return true;
}

/** The kept check for this account, or null (none kept, or another person's). */
export function readKeptCheck(owner: string | undefined): BvnCheck | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.check;
}

export function forgetKeptCheck(): void {
  era += 1;
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
