import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';

/**
 * M10: after Save on M8 the person is back on M1 and sees "Profile saved". M8's route posts the notice as it
 * closes; the Me tab draws it while it is up, and it goes by itself after a moment.
 */
export const PROFILE_SAVED_MS = 2500;

let visible = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function set(next: boolean) {
  visible = next;
  listeners.forEach((listener) => listener());
}

export function postProfileSaved(): void {
  if (timer) clearTimeout(timer);
  set(true);
  timer = setTimeout(() => {
    timer = null;
    set(false);
  }, PROFILE_SAVED_MS);
}

/** Takes the notice down now (a new session, a test). */
export function clearProfileSaved(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  if (visible) set(false);
}

// A sign-out takes the notice down, so the next account to sign in never sees it.
onSessionEnd(clearProfileSaved);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True while "Profile saved" is up. */
export function useProfileSaved(): boolean {
  return useSyncExternalStore(subscribe, () => visible, () => visible);
}
