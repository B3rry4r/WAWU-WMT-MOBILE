import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';
import type { BvnCheck } from '@/api/walletIdentity';

/**
 * The answer to the BVN check that passed on A26, held for A5 (KYC-03): the
 * name, date of birth and gender the BVN gave (`prefill`) and the step's state
 * (`identity`: last 4 digits only). The backend answers the prefill once and
 * does not keep it (BACKEND_GAPS G-25), so the app holds it, in memory only:
 * never the secure store, never logged, gone when the app process ends.
 *
 * A5 adds the home address the person typed (`keepAddress`), which A7 sends
 * when it opens the account (MONEY-12 takes it once and stores none of it).
 * It lives in the same place and goes with the rest on every forget.
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
 * until the check answers, and no longer. What it holds in their place is the
 * check's `checkHandle` (KYC-03, BACKEND_GAPS G-72): the numbers sealed under
 * a server key, unreadable on the phone, good for 30 minutes, sent back to
 * the selfie match and the account opening. It goes with the rest on every
 * forget, and is never stored or logged.
 */
/** A5's home address, in its three parts, as the person typed them. */
export type HomeAddress = { street: string; city: string; state: string };

/**
 * The passed check as kept: the prefill and the step's state (last 4 digits
 * only), without the handle, which is kept beside it (`readHandle`).
 */
export type KeptCheck = Omit<BvnCheck, 'checkHandle'>;

type Kept = { owner: string; check: KeptCheck; handle: string; address: HomeAddress | null };

let kept: Kept | null = null;
/** Bumped by every forget: a ticket from before it can no longer write. */
let era = 0;
const listeners = new Set<() => void>();

/**
 * Taken when a check is sent. The store checks one thing: that no forget has
 * happened since the ticket was taken (its `era`). Until then the ticket may
 * write, more than once; after any forget it never can. The owner it names is
 * the account the details are kept for, not something the store verifies.
 */
export type KeepTicket = { readonly owner: string; readonly era: number };

export function ticketFor(owner: string): KeepTicket {
  return { owner, era };
}

function changed() {
  listeners.forEach((listener) => listener());
}

/** True while no forget has happened since the ticket was taken: an answer under it may still act. */
export function ticketIsLive(ticket: KeepTicket): boolean {
  return ticket.era === era;
}

/** Keeps the check for the ticket's owner. False, and nothing kept, when the ticket was voided by a forget. */
export function keepCheck(ticket: KeepTicket, check: BvnCheck): boolean {
  if (ticket.era !== era) return false;
  kept = {
    owner: ticket.owner,
    check: { identity: { ...check.identity }, prefill: { ...check.prefill } },
    handle: check.checkHandle,
    address: null,
  };
  changed();
  return true;
}

/**
 * Keeps A5's address beside the passed check of the ticket's owner. False, and
 * nothing kept, when the ticket was voided by a forget or no check is kept for
 * that owner (A7 sends it with the check's name and date of birth, never alone).
 */
export function keepAddress(ticket: KeepTicket, address: HomeAddress): boolean {
  if (ticket.era !== era || !kept || kept.owner !== ticket.owner) return false;
  kept = { ...kept, address: { ...address } };
  changed();
  return true;
}

/** The check handle kept for this account, or null (none kept, or another person's). */
export function readHandle(owner: string | undefined): string | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.handle;
}

/** A5's address kept for this account, or null (none typed yet, or another person's). */
export function readAddress(owner: string | undefined): HomeAddress | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.address;
}

/** The kept check for this account, or null (none kept, or another person's). */
export function readKeptCheck(owner: string | undefined): KeptCheck | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.check;
}

export function forgetKeptCheck(): void {
  era += 1;
  if (!kept) return;
  kept = null;
  changed();
}

/**
 * The session drops the kept details itself, on every way a session ends
 * (FIX-04's `onSessionEnd`): sign-out, a refused refresh, a sign-in that
 * replaces a session, and a refresh that answers another account's token.
 * The last two keep the status `signedIn`, so no screen's own check of the
 * status could see them. Forgetting also voids every ticket already out.
 */
onSessionEnd(forgetKeptCheck);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For A5 and A26: the kept check for this account, re-read when it changes. */
export function useKeptCheck(owner: string | undefined): KeptCheck | null {
  const current = useSyncExternalStore(subscribe, () => kept, () => kept);
  if (!current || !owner || current.owner !== owner) return null;
  return current.check;
}

/** For A5 and A6: the kept check and the address together for this account, re-read when either changes. */
export function useKeptOpening(owner: string | undefined): { check: KeptCheck; handle: string; address: HomeAddress | null } | null {
  const current = useSyncExternalStore(subscribe, () => kept, () => kept);
  if (!current || !owner || current.owner !== owner) return null;
  return { check: current.check, handle: current.handle, address: current.address };
}
