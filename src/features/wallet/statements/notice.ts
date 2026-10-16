import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';

/**
 * W38 ends with "Toast on W35" (the artboard's flow note): after Send statement the person is back on Wallet settings
 * and sees where the statement went. The statement route posts the notice as it closes; W35 draws it while it is up, and
 * it goes by itself after a moment. The words are the server's masked address, never one the phone made up.
 */
export const STATEMENT_SENT_MS = 4000;

let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function set(next: string | null) {
  message = next;
  listeners.forEach((listener) => listener());
}

export function postStatementSent(sentTo: string): void {
  if (timer) clearTimeout(timer);
  set(`Statement sent to ${sentTo}`);
  timer = setTimeout(() => {
    timer = null;
    set(null);
  }, STATEMENT_SENT_MS);
}

/** Takes the notice down now (a new session, a test). */
export function clearStatementSent(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  if (message !== null) set(null);
}

// A sign-out takes the notice down, so the next account to sign in never sees it.
onSessionEnd(clearStatementSent);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The notice while it is up, else null. */
export function useStatementSent(): string | null {
  return useSyncExternalStore(subscribe, () => message, () => message);
}
