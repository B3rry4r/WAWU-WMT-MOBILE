import { useSyncExternalStore } from 'react';

/**
 * Whether A27 is sending the person's details and documents right now (DV2-05 round 2). While it is, the Hub's
 * answers about the opening are half-way (the details are in, the second document is not), so no other screen of
 * Open your wallet may read them as "go back to the documents": the screens under A27 (A31 holds the resume check)
 * wait, and A27 itself routes by the Hub's last answer once the send is over.
 */
let sending = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Marks a send as started; the returned function marks it over (once). */
export function beginOpeningSend(): () => void {
  sending += 1;
  emit();
  let over = false;
  return () => {
    if (over) return;
    over = true;
    sending -= 1;
    emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True while any screen of Open your wallet is sending the details and documents. */
export function useOpeningSending(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => sending > 0,
    () => false,
  );
}
