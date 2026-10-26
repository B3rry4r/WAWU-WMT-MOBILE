import { useSyncExternalStore } from 'react';

/**
 * Which account pays a wallet payment (PAY-FX, R-91). The Hub's paying routes (an unlock, a tip, a ticket, a school or legal fee,
 * a paid question, a chat request, a pass) all read one header, `X-Pay-Source-Currency`, so the choice lives here once and
 * `client.ts` puts it on every request: `null` is the naira wallet, exactly as before; a code ("USD") is the person's own account
 * in that currency. `fallback` is where it returns to when a pay sheet closes: the person's main currency when they have no naira
 * wallet at all (R-87), else null.
 *
 * No currency list, rate or fee is kept here: the codes come from the Hub's accounts and quotes.
 */
let fallback: string | null = null;
let naira = true;
let chosen: string | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function paySourceCode(): string | null {
  return chosen;
}

export function choosePaySource(code: string | null): void {
  if (chosen === code) return;
  chosen = code;
  emit();
}

/** Whether the person has a naira wallet to offer beside their other accounts. */
export function paySourceHasNaira(): boolean {
  return naira;
}

/** Sets where the choice returns to (and takes it there now), and whether the naira wallet is one of the person's accounts. */
export function setPaySourceDefaults(defaults: { fallback: string | null; hasNaira: boolean }): void {
  fallback = defaults.fallback;
  naira = defaults.hasNaira;
  choosePaySource(defaults.fallback);
}

/** A pay sheet closed: back to the default. */
export function resetPaySource(): void {
  choosePaySource(fallback);
}

/** A session ended: nothing carries over to the next person. */
export function clearPaySource(): void {
  fallback = null;
  naira = true;
  choosePaySource(null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePaySourceCode(): string | null {
  return useSyncExternalStore(subscribe, paySourceCode, paySourceCode);
}
