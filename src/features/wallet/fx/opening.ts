import { useSyncExternalStore } from 'react';

import type { FxCode } from './amount';

/**
 * The currencies this phone has asked the Hub to open and not yet had an answer for (FX-POLISH L1). Opening one takes several seconds, and
 * the choice has closed by then: whatever draws that currency says "Opening" from the pick, and no second pick of it is taken. It is held
 * outside any one screen (the Wallet, Home and Accounts all draw it), keyed by the signed-in account, and a currency leaves it when the Hub
 * has answered and the accounts have been read again, so the Hub's own "opening" row takes its place without a gap.
 */
const asked = new Map<string, Set<string>>();
const listeners = new Set<() => void>();
const NONE: ReadonlySet<FxCode> = new Set();
let snapshots = new Map<string, ReadonlySet<FxCode>>();

function changed(owner: string) {
  snapshots = new Map(snapshots);
  snapshots.set(owner, new Set(asked.get(owner) as Set<FxCode>));
  listeners.forEach((l) => l());
}

/** Marks a currency as being opened. False, and nothing changed, when it already is: a second pick is refused (checked at once, not after a redraw). */
export function beginOpening(owner: string, code: FxCode): boolean {
  const mine = asked.get(owner) ?? new Set<string>();
  if (mine.has(code)) return false;
  mine.add(code);
  asked.set(owner, mine);
  changed(owner);
  return true;
}

export function endOpening(owner: string, code: FxCode) {
  const mine = asked.get(owner);
  if (!mine?.delete(code)) return;
  changed(owner);
}

/** Forgets everything (tests, and a session that ended). */
export function resetOpening() {
  asked.clear();
  snapshots = new Map();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The currencies being opened for this account now. The same set object is returned until it changes. */
export function useOpening(owner: string | null): ReadonlySet<FxCode> {
  return useSyncExternalStore(
    subscribe,
    () => snapshots.get(owner ?? '') ?? NONE,
    () => NONE,
  );
}
