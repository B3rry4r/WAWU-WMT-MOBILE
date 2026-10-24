import { useEffect, useSyncExternalStore } from 'react';

import { getAccessToken, onSessionEnd } from '@/api/session';
import { readClaims } from '@/features/claim/tokenClaims';
import { readLocal, writeLocal } from '@/features/claim/localStore';

/**
 * "Your bonus is waiting" (VF1) comes once, right after a person signs up (R-43, SHARED-CHANGES VERIFY-01 #1). It shows and asks;
 * it never decides anything and it never blocks the app. It follows the same mark as the access-code step (JOIN-03, `offerStep.ts`):
 *
 *   - Sign-up marks the NEW account (`markBonusPending`, called where the sign-up's first session is adopted). Nobody who signed up
 *     before this build, and nobody who only signs in, is ever marked, so they never see it.
 *   - The root layout shows the step while `visible` is true. A mark written but not yet shown (the app closed in between) is read
 *     back on the next start (`loadBonusStep`).
 *   - Showing it once is enough: the step settles its own mark the moment it is drawn (`settleBonusStep`), so closing the app on it
 *     never brings it back. "Build my shop" ends it (`finishBonusStep`).
 *   - Every read and write is bounded and swallowed (`@/features/claim/localStore`): a store that fails or hangs means no step.
 */
type State = { sub: string | null; visible: boolean };

let state: State = { sub: null, visible: false };
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const bonusKey = (sub: string) => `wmt.verify.bonus.${sub}`;

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
export async function markBonusPending(accessToken: string): Promise<void> {
  const sub = readClaims(accessToken)?.sub;
  if (!sub) return;
  // Memory first: the layout draws the first signed-in screen the moment the session is adopted.
  publish({ sub, visible: true });
  await writeLocal(bonusKey(sub), 'pending');
}

/** Cold start, signed in: reads the mark back. Only a mark still saying `pending` shows the step. */
export function loadBonusStep(): Promise<void> {
  loading ??= (async () => {
    const sub = readClaims(await getAccessToken())?.sub;
    if (!sub) return;
    if (state.sub === sub && state.visible) return;
    if ((await readLocal(bonusKey(sub))) === 'pending') publish({ sub, visible: true });
  })().finally(() => {
    loading = null;
  });
  return loading;
}

/** The step has been drawn: it will not come again, even if the app is closed on it. */
export function settleBonusStep(): void {
  if (state.sub) void writeLocal(bonusKey(state.sub), 'done');
}

/** "Build my shop": the step is over for this account. */
export function finishBonusStep(): void {
  if (state.sub) void writeLocal(bonusKey(state.sub), 'done');
  publish({ sub: state.sub, visible: false });
}

/** Signed out, or the session ended: nothing of the last account's is held for the next. */
export function resetBonusStep(): void {
  if (state.sub === null && !state.visible) return;
  publish({ sub: null, visible: false });
}

onSessionEnd(resetBonusStep);

/**
 * For the root layout: whether the step is to be shown now. Reads the mark back on a cold start while signed in. `accountType` is what
 * WAWU ID's sign-up progress says: a discoverer ("user") has no shop to build, so VF1 is never mounted for them, not even its loading
 * state between A13 and Home (VERIFY-01 round 4), and their mark is settled so it cannot come back if they become a creator later.
 */
export function useBonusStep(signedIn: boolean, accountType?: string | null): { visible: boolean } {
  const current = useSyncExternalStore(subscribe, () => state, () => state);
  const discoverer = accountType === 'user';
  useEffect(() => {
    if (signedIn) void loadBonusStep();
    else resetBonusStep();
  }, [signedIn]);
  useEffect(() => {
    if (signedIn && discoverer && current.visible) finishBonusStep();
  }, [signedIn, discoverer, current.visible]);
  return { visible: signedIn && current.visible && !discoverer };
}
