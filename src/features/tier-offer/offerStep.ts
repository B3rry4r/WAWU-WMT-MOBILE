import { useEffect, useSyncExternalStore } from 'react';

import { getAccessToken, onSessionEnd } from '@/api/session';
import { readClaims } from '@/features/claim/tokenClaims';

import { fetchTierOffer, markTierOfferSeen } from './api';

/**
 * The tier offer (TIER-OFFER, R-94): a full screen that offers the three tiers once, after sign-up's own steps and before Home. It shows
 * and asks; it never decides who is offered it (the Hub does, `GET /me/tier-offer`: a creator account not yet shown it and holding no
 * running tier) and it never blocks the app.
 *
 *   - Once the sign-up gate is open (`asked`), the Hub is asked once per signed-in session. A new account has had its type copied to the
 *     Hub by then, and the sign-up's own steps (access code, A11 to A13) come first: the layout shows the offer only after them.
 *   - The answer is waited for a short, bounded time (`TIER_OFFER_WAIT_MS`). An answer that fails or comes late means no offer this
 *     session; the next start asks again, because nothing was marked.
 *   - "Shown once" lives on the Hub, so it holds across phones: the screen tells the Hub the moment it is drawn (`settleTierOffer`),
 *     so closing the app on it never brings it back.
 *   - Subscribe ends the step and hands the tier to the layout's bridge, which opens the checkout (VF6) once the offer is gone.
 */
export const TIER_OFFER_WAIT_MS = 2500;

type Phase = 'idle' | 'asking' | 'visible' | 'done';
type State = {
  sub: string | null;
  phase: Phase;
  closeButton: boolean;
  checkout: { tierId: string; kind: 'tier' | 'tiers' } | null;
};

const initial: State = {
  sub: null,
  phase: 'idle',
  closeButton: true,
  checkout: null,
};
let state: State = initial;
let started = false;
let settled = false;
const listeners = new Set<() => void>();

function publish(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Asks the Hub once for this session. Never throws; a failure or a late answer is "no offer". */
async function ask(): Promise<void> {
  if (started) return;
  started = true;
  const sub = readClaims(await getAccessToken())?.sub;
  if (!sub) {
    publish({ ...state, phase: 'done' });
    return;
  }
  publish({ ...state, sub, phase: 'asking' });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), TIER_OFFER_WAIT_MS);
  });
  const answer = await Promise.race([fetchTierOffer().catch(() => null), late]);
  clearTimeout(timer);
  // The session may have ended while the Hub was answering: its answer is for someone else now.
  if (state.sub !== sub || state.phase !== 'asking') return;
  publish(answer?.show ? { ...state, phase: 'visible', closeButton: answer.closeButton } : { ...state, phase: 'done' });
}

/** The offer has been drawn: the Hub is told, so it will not come again, even if the app is closed on it. Never throws. */
export function settleTierOffer(): void {
  if (settled) return;
  settled = true;
  void markTierOfferSeen().catch(() => {
    // The Hub could not be told: the offer may be drawn once more on the next start, never twice in this one.
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

/** Signed out, or the session ended: nothing of the last account's is held for the next. */
export function resetTierOffer(): void {
  started = false;
  settled = false;
  if (state === initial) return;
  publish(initial);
}

onSessionEnd(resetTierOffer);

/**
 * For the root layout. `asked` is true once the sign-up gate is open for a signed-in person. `accountType` is what WAWU ID's sign-up
 * progress says: a discoverer ("user") has no shop for a tier to unlock, so the Hub is not even asked. `holding` is true from the
 * moment the gate opens until the Hub has answered (at most `TIER_OFFER_WAIT_MS`), so the splash waits and Home is never drawn first
 * for a person who is to be offered the tiers.
 */
export function useTierOfferStep(
  asked: boolean,
  accountType?: string | null,
): {
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
  const discoverer = accountType === 'user';
  useEffect(() => {
    if (!asked) return;
    if (discoverer) publish({ ...state, phase: 'done' });
    else void ask();
  }, [asked, discoverer]);
  const open = asked && !discoverer && current.phase !== 'visible' && current.phase !== 'done';
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
