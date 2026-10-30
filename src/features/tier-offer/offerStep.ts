import { useEffect, useSyncExternalStore } from 'react';

import { getAccessToken, onSessionEnd } from '@/api/session';
import { accountTypeWriteResult } from '@/features/auth/accountTypeWrite';
import { readClaims } from '@/features/claim/tokenClaims';

import { fetchTierOffer, markTierOfferSeen } from './api';

/**
 * The tier offer (TIER-OFFER, R-94; who sees it and how often is the Hub's, R-105): a full screen that offers the three tiers, first thing once
 * the sign-up's email, name and access-code steps are done, before "Set up your account" and the other setup steps and before Home (FIX-P5,
 * lead ruling 27 Oct 2026). It shows and asks; it never decides who is offered it and it never blocks the app. The Hub decides
 * (`GET /me/tier-offer`): for any signed-in person, whatever their account type, who holds no running tier, on every app start while the admin
 * setting `tier_offer.every_start_on` is on (the default), and once per person when it is off. Nothing here keeps "once" or "creators only".
 *
 *   - Once the sign-up gate is open (`asked`), the Hub is asked once per signed-in session, for every account type. A new account has had its
 *     type copied to the Hub by then. The email, name and access-code steps come first; the setup steps (A11 to A13) wait behind the offer.
 *   - The answer is waited for a short, bounded time (`TIER_OFFER_WAIT_MS`). An answer that fails or comes late means no offer this
 *     session; the next start asks again, because nothing was marked. A Hub that has not been updated yet answers no for a buyer: nothing is
 *     drawn, nothing breaks, and the app goes on to Home.
 *   - When the Hub does not say show while the sign-up has just written an account type to it (the write is what gives a new person the profile
 *     the Hub reads the type from), the Hub is asked once more, within one more bounded wait that also covers the write still being on its way.
 *     An answer that already says show is never asked twice, and a start that wrote nothing asks once (F1, round 2; any type, R-105).
 *   - The screen tells the Hub the moment it is drawn (`settleTierOffer`), once per start. The Hub keeps that mark: with the setting off it is
 *     what stops the offer on any phone; with it on (the default) the offer still comes on the next start. Closing the app on the offer never
 *     decides anything here.
 *   - Subscribe ends the step and hands the tier to the layout's bridge, which opens the checkout (VF6) once the offer is gone.
 *   - It never holds a session change. A session that ends while the app is up and the gate stays open (a sign-in over another account,
 *     a refresh that brings one) resets the step: the app is not held for it, nothing is asked for the new account and no offer is
 *     drawn (the next start asks). Only a start, or a sign-in after a sign-out, holds the splash, and only for the bounded wait.
 */
export const TIER_OFFER_WAIT_MS = 2500;

type Phase = 'idle' | 'asking' | 'visible' | 'done';
type State = {
  sub: string | null;
  phase: Phase;
  closeButton: boolean;
  checkout: { tierId: string; kind: 'tier' } | null;
  /** The app has been let through (the step ended, or never applied) since the gate opened: a session that changes under it holds nothing. */
  live: boolean;
};

const initial: State = {
  sub: null,
  phase: 'idle',
  closeButton: true,
  checkout: null,
  live: false,
};
let state: State = initial;
let started = false;
let settled = false;
const listeners = new Set<() => void>();

function publish(next: State) {
  state = next.phase === 'visible' || next.phase === 'done' ? { ...next, live: true } : next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The work, or null once `ms` have passed. */
async function within<T>(work: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([work, late]);
  } finally {
    clearTimeout(timer);
  }
}

/** Asks the Hub once for this session (twice, when an account type was just written and the first answer was not "show"). Never throws; a failure or a late answer is "no offer". */
async function ask(): Promise<void> {
  if (started) return;
  started = true;
  const sub = readClaims(await getAccessToken())?.sub;
  if (!sub) {
    publish({ ...state, phase: 'done' });
    return;
  }
  publish({ ...state, sub, phase: 'asking' });
  let answer = await within(fetchTierOffer().catch(() => null), TIER_OFFER_WAIT_MS);
  if (!answer?.show && state.sub === sub && state.phase === 'asking') {
    // The write of the account type (whichever it is) may have landed after the Hub answered: one more look, never more.
    const again = await within(
      accountTypeWriteResult().then((held) => (held ? fetchTierOffer().catch(() => null) : null)),
      TIER_OFFER_WAIT_MS,
    );
    answer = again ?? answer;
  }
  // The session may have ended while the Hub was answering: its answer is for someone else now.
  if (state.sub !== sub || state.phase !== 'asking') return;
  publish(answer?.show ? { ...state, phase: 'visible', closeButton: answer.closeButton } : { ...state, phase: 'done' });
}

/** The offer has been drawn: the Hub is told (once per start). Whether it comes again is the Hub's setting. Never throws. */
export function settleTierOffer(): void {
  if (settled) return;
  settled = true;
  void markTierOfferSeen().catch(() => {
    // The Hub could not be told: nothing changes here; the next start asks the Hub again.
  });
}

/** X, Not now, or Subscribe: the step is over. `checkout` (Subscribe) is what the bridge opens next. */
export function finishTierOffer(checkout: State['checkout'] = null): void {
  if (state.phase === 'visible') settleTierOffer();
  publish({ ...state, phase: 'done', checkout });
}

/** The checkout Subscribe asked for, taken once by the bridge. */
export function takeTierOfferCheckout(): State['checkout'] {
  const next = state.checkout;
  if (next) state = { ...state, checkout: null };
  return next;
}

/** Signed out, or the gate is closed: nothing of the last account's is held for the next, and the next sign-in holds and asks afresh. */
export function resetTierOffer(): void {
  started = false;
  settled = false;
  if (state === initial) return;
  publish(initial);
}

/**
 * The session ended: nothing of the last account's is held for the next. When the app is up and stays up (a sign-in over another account, a
 * refresh that brings one: the gate does not close), the next account's start is not held for the offer either; `live` says so. A sign-out
 * closes the gate, which resets the rest (`resetTierOffer`).
 */
function endTierOfferSession(): void {
  started = false;
  settled = false;
  if (state === initial) return;
  publish({ ...initial, live: state.live });
}

onSessionEnd(endTierOfferSession);

/**
 * For the root layout. `asked` is true once the sign-up gate is open for a signed-in person. The account type is not passed: the app does not
 * decide who is offered the tiers, the Hub does (R-105). `holding` is true from the moment the gate opens until the Hub has answered (at most
 * `TIER_OFFER_WAIT_MS`), so the splash waits and Home is never drawn first for a person who is to be offered the tiers.
 */
export function useTierOfferStep(asked: boolean): {
  visible: boolean;
  holding: boolean;
  closeButton: boolean;
  checkout: State['checkout'];
} {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
  const idle = current.phase === 'idle';
  useEffect(() => {
    // Signed out (or the gate is not open yet): whatever was held is dropped, so the next sign-in holds and asks afresh.
    if (!asked) resetTierOffer();
    // The session changed under a live app (the step was reset with the gate still open): no hold, no ask, no offer for it.
    else if (state.live) {
      if (state.phase === 'idle') publish({ ...state, phase: 'done' });
    } else void ask();
    // `idle` is here so a reset under an open gate is seen: it lands on 'idle' while `asked` has not changed.
  }, [asked, idle]);
  const open = asked && !(current.live && idle) && current.phase !== 'visible' && current.phase !== 'done';
  return {
    visible: asked && current.phase === 'visible',
    holding: open,
    closeButton: current.closeButton,
    checkout: current.checkout,
  };
}

/** For the offer screen: whether this offer has the close X (true) or a "Not now" button (false). The Hub's answer to the one ask. */
export function useTierOfferCloseButton(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.closeButton,
    () => state.closeButton,
  );
}
