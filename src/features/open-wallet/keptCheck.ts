import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';
import type { BvnCheck } from '@/api/walletIdentity';

import type { FiatCode } from './api/world';

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
/**
 * The review opening has no BVN check to read a name from (the Hub answers `step_not_used`), and its open call
 * takes the BVN and the NIN themselves, never a handle (BACKEND_GAPS G-460). So A31 holds the two numbers, digits
 * only, here in memory until Submit sends them: never the secure store, never logged, gone with every forget
 * (sign-out, session end, another account, the flow closing). They are shown masked, or not at all.
 */
export type HeldNumbers = { bvn: string; nin: string };
/** What the person typed on the details step of the review opening, in the shape the open call takes. */
export type HeldPerson = { firstName: string; lastName: string; dateOfBirth: string; gender: 'male' | 'female'; middleName?: string };

/** A5's home address, in its three parts, as the person typed them. */
export type HomeAddress = { street: string; city: string; state: string };

/**
 * WALLET-41 (R-87): a person who lives outside Nigeria opens without a BVN. The country they chose and the currency of
 * their first account, held beside empty numbers (so every later step reads them as the review opening, with no BVN to
 * send). In memory only, gone with every forget like the rest.
 */
export type HeldWorld = { country: string; currency: FiatCode };

/**
 * The passed check as kept: the prefill and the step's state (last 4 digits
 * only), without the handle, which is kept beside it (`readHandle`).
 */
export type KeptCheck = Omit<BvnCheck, 'checkHandle'>;

/**
 * One account's Open your wallet, in memory. `check` and `handle` are null
 * once the server refused the handle (`expireKeptCheck`): the person must run
 * the BVN check again, and what they typed on A5 (`address`, `occupation`)
 * waits for the new check, with the server's sentence (`notice`) for A26.
 */
type Kept = {
  owner: string;
  check: KeptCheck | null;
  handle: string | null;
  address: HomeAddress | null;
  occupation: string | null;
  notice: string | null;
  /** The review opening only (KYC-07): the BVN and NIN typed on A31, held to go with the open call. */
  numbers: HeldNumbers | null;
  /** The review opening only (KYC-07): the name, date of birth and gender typed on the details step. */
  person: HeldPerson | null;
  /** WALLET-41: the country and first currency of a person outside Nigeria; null for a Nigerian opening. */
  world: HeldWorld | null;
};

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

/**
 * Keeps the check for the ticket's owner. False, and nothing kept, when the
 * ticket was voided by a forget. A5's address and occupation from an earlier
 * check of the same account, kept through `expireKeptCheck`, carry over to
 * the new one, so A5 comes back filled in.
 */
export function keepCheck(ticket: KeepTicket, check: BvnCheck): boolean {
  if (ticket.era !== era) return false;
  const carried = kept && kept.owner === ticket.owner ? kept : null;
  kept = {
    owner: ticket.owner,
    check: { identity: { ...check.identity }, prefill: { ...check.prefill } },
    handle: check.checkHandle,
    address: carried?.address ?? null,
    occupation: carried?.occupation ?? null,
    notice: null,
    numbers: null,
    person: null,
    world: null,
  };
  changed();
  return true;
}

/**
 * Holds the BVN and NIN of the review opening for the ticket's owner (KYC-07). False, and nothing held, when the
 * ticket was voided by a forget. The name and address typed on the details step of an earlier try of the same
 * account carry over, so a person who comes back to A31 and corrects a digit finds the rest still filled in.
 */
export function keepNumbers(ticket: KeepTicket, numbers: HeldNumbers): boolean {
  if (ticket.era !== era) return false;
  const carried = kept && kept.owner === ticket.owner ? kept : null;
  kept = {
    owner: ticket.owner,
    check: null,
    handle: null,
    address: carried?.address ?? null,
    occupation: null,
    notice: null,
    numbers: { bvn: numbers.bvn, nin: numbers.nin },
    person: carried?.person ?? null,
    world: null,
  };
  changed();
  return true;
}

/**
 * Holds the country and first currency of a person outside Nigeria (WALLET-41). There are no numbers to send, so the
 * numbers are held empty: the details step and the documents read it as the review opening. The name and address typed
 * on an earlier try of the same account carry over.
 */
export function keepWorld(ticket: KeepTicket, world: HeldWorld): boolean {
  if (ticket.era !== era) return false;
  const carried = kept && kept.owner === ticket.owner ? kept : null;
  kept = {
    owner: ticket.owner,
    check: null,
    handle: null,
    address: carried?.address ?? null,
    occupation: null,
    notice: null,
    numbers: { bvn: '', nin: '' },
    person: carried?.person ?? null,
    world: { country: world.country, currency: world.currency },
  };
  changed();
  return true;
}

/** The country and first currency held for this account, or null (none held, a Nigerian opening, or another person's). */
export function readWorld(owner: string | undefined): HeldWorld | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.world;
}

/** Holds the name, date of birth and gender (and the address) typed on the review opening's details step, beside the numbers. */
export function keepPerson(ticket: KeepTicket, person: HeldPerson, address: HomeAddress): boolean {
  if (ticket.era !== era || !kept || kept.owner !== ticket.owner || !kept.numbers) return false;
  kept = { ...kept, person: { ...person }, address: { ...address } };
  changed();
  return true;
}

/** The numbers held for this account, or null (none held, or another person's). */
export function readNumbers(owner: string | undefined): HeldNumbers | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.numbers;
}

/** The name, date of birth and gender held for this account, or null. */
export function readPerson(owner: string | undefined): HeldPerson | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.person;
}

/**
 * Keeps A5's address beside the passed check of the ticket's owner. False, and
 * nothing kept, when the ticket was voided by a forget or no check is kept for
 * that owner (A7 sends it with the check's name and date of birth, never alone).
 */
export function keepAddress(ticket: KeepTicket, address: HomeAddress, occupation: string | null = null): boolean {
  if (ticket.era !== era || !kept || kept.owner !== ticket.owner || !kept.check) return false;
  kept = { ...kept, address: { ...address }, occupation: occupation ?? kept.occupation };
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

/** A5's occupation kept for this account, or null. */
export function readOccupation(owner: string | undefined): string | null {
  if (!kept || !owner || kept.owner !== owner) return null;
  return kept.occupation;
}

/** True when anything of Open your wallet is kept for this account (a check, or what waits for a new one). */
export function isKeptFor(owner: string | undefined): boolean {
  return Boolean(kept && owner && kept.owner === owner);
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
 * The server refused the kept check's handle (`409 bvn_not_checked`: its 30
 * minutes ran out, or another check passed): the check and the handle are
 * forgotten, every ticket out is void, and the person must run the BVN check
 * again. What they typed on A5 stays, for this account, with `notice` (the
 * server's sentence) for A26 to show. The session end and leaving the flow
 * still forget it all (`forgetKeptCheck`).
 */
export function expireKeptCheck(notice: string | null): void {
  era += 1;
  if (!kept) return;
  // A restart without a sentence (A5 or A6 seeing nothing kept as they close, right after the refusal) keeps the one there.
  kept = { ...kept, check: null, handle: null, notice: notice ?? kept.notice };
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

/** For A26: why the person is back for a new check (the server's sentence), with whether an address waits for it. */
export function useCheckNotice(owner: string | undefined): { notice: string; addressKept: boolean } | null {
  const current = useSyncExternalStore(subscribe, () => kept, () => kept);
  if (!current || !owner || current.owner !== owner || current.check || !current.notice) return null;
  return { notice: current.notice, addressKept: current.address !== null };
}

/** For the review opening's details step (KYC-07): the numbers, with the name and address typed so far, or null while no numbers are held. */
export function useHeldReview(
  owner: string | undefined,
): { numbers: HeldNumbers; person: HeldPerson | null; address: HomeAddress | null; world: HeldWorld | null } | null {
  const current = useSyncExternalStore(subscribe, () => kept, () => kept);
  if (!current || !owner || current.owner !== owner || !current.numbers) return null;
  return { numbers: current.numbers, person: current.person, address: current.address, world: current.world };
}

/** For A5 and A6: the kept check, its handle and A5's details together for this account, or null without a check. */
export function useKeptOpening(
  owner: string | undefined,
): { check: KeptCheck; handle: string; address: HomeAddress | null; occupation: string | null } | null {
  const current = useSyncExternalStore(subscribe, () => kept, () => kept);
  if (!current || !owner || current.owner !== owner || !current.check || !current.handle) return null;
  return { check: current.check, handle: current.handle, address: current.address, occupation: current.occupation };
}
