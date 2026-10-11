import { useEffect, useSyncExternalStore } from 'react';

import { getAccessToken, onSessionEnd } from '@/api/session';

import { offerKey, readLocal, writeLocal } from './localStore';
import { readClaims } from './tokenClaims';

/**
 * The "Have an access code?" step that comes once, right after a person signs up (JOIN-03 round 2, SHARED-CHANGES
 * JOIN-03 #4). It asks; it never decides anything and it never blocks the app.
 *
 *   - Sign-up marks the NEW account (`markOfferPending`, called where the sign-up's first session is adopted). Nobody
 *     who signed up before this build, and nobody who only signs in, is ever marked, so they never see it.
 *   - The root layout shows the step while `visible` is true. A mark that was written but not yet shown (the app was
 *     closed in between) is read back on the next start (`loadOfferStep`).
 *   - Showing it once is enough: the step settles its own mark the moment it is drawn (`settleOfferStep`), so closing
 *     the app on it never brings it back. Skip and Enter code both end it (`finishOfferStep`).
 *   - Every read and write is bounded and swallowed (localStore.ts): a store that fails or hangs means no step.
 */
type State = { sub: string | null; visible: boolean };

let state: State = { sub: null, visible: false };
let loading: Promise<void> | null = null;
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

/** The account is being signed up: its first session is about to be adopted. Writes the mark, then shows the step. */
export async function markOfferPending(accessToken: string): Promise<void> {
  const sub = readClaims(accessToken)?.sub;
  if (!sub) return;
  // Memory first: the layout draws the first signed-in screen the moment the session is adopted.
  publish({ sub, visible: true });
  await writeLocal(offerKey(sub), 'pending');
}

/** Cold start, signed in: reads the mark back. Only a mark still saying `pending` shows the step. */
export function loadOfferStep(): Promise<void> {
  loading ??= (async () => {
    const sub = readClaims(await getAccessToken())?.sub;
    if (!sub) return;
    if (state.sub === sub && state.visible) return;
    if ((await readLocal(offerKey(sub))) === 'pending') publish({ sub, visible: true });
  })().finally(() => {
    loading = null;
  });
  return loading;
}

/** The step has been drawn: it will not come again, even if the app is closed on it. */
export function settleOfferStep(): void {
  if (state.sub) void writeLocal(offerKey(state.sub), 'done');
}

/** Skip, or Enter code: the step is over for this account. */
export function finishOfferStep(): void {
  if (state.sub) void writeLocal(offerKey(state.sub), 'done');
  publish({ sub: state.sub, visible: false });
}

/** Signed out, or the session ended: nothing of the last account's is held for the next. */
export function resetOfferStep(): void {
  if (state.sub === null && !state.visible) return;
  publish({ sub: null, visible: false });
}

onSessionEnd(resetOfferStep);

/** For the root layout: whether the step is to be shown now. Reads the mark back on a cold start while signed in. */
export function useClaimOfferStep(signedIn: boolean): { visible: boolean } {
  const current = useSyncExternalStore(subscribe, () => state, () => state);
  useEffect(() => {
    if (signedIn) void loadOfferStep();
    else resetOfferStep();
  }, [signedIn]);
  return { visible: signedIn && current.visible };
}
