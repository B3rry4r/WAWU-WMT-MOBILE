import { useSyncExternalStore } from 'react';

/**
 * Whether A6 has already dropped the hosted selfie for this person (DV2-05 round 2). A6 drops the step when the
 * Hub says it is not part of the opening (`enabled: false`, or 409 `documents_closed`) and hands over to A28; A28
 * hands back to A6 when the documents say the selfie is all that is left. The Hub reads one switch for both, so
 * the two never disagree, but a Hub fault or a deploy half-way through can make them: without this note the two
 * screens send the person to each other without end. With it, A28 goes to A6 once, and after A6 has dropped the
 * step A28 stays and says it could not finish (a tap on Try again is one more round, never an automatic one).
 */
let droppedFor: string | null = null;
const listeners = new Set<() => void>();

function change(next: string | null) {
  if (droppedFor === next) return;
  droppedFor = next;
  listeners.forEach((listener) => listener());
}

/** A6 dropped the selfie for this person. */
export function noteSelfieDropped(owner: string | undefined): void {
  if (owner) change(owner);
}

/** True when A6 has dropped the selfie for this person and nothing has changed since. */
export function selfieWasDropped(owner: string | undefined): boolean {
  return Boolean(owner) && droppedFor === owner;
}

/** The Hub is consistent again, a new send began, or the person asked to try again: forget the note. */
export function forgetSelfieDrop(): void {
  change(null);
}

/** `selfieWasDropped`, read by a screen that must change when the note does. */
export function useSelfieDropped(owner: string | undefined): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => selfieWasDropped(owner),
    () => false,
  );
}
