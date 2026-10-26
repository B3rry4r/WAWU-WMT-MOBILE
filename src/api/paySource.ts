import { useSyncExternalStore } from 'react';

/**
 * Which account pays a wallet payment (PAY-FX, R-91). The Hub's paying routes (an unlock, a tip, a ticket, a school or legal fee,
 * a paid question, a chat request, a pass) all read one header, `X-Pay-Source-Currency`, so the choice lives here once and
 * `client.ts` puts it on the paying requests (`carriesPaySource`): `null` is the naira wallet, exactly as before; a code ("USD") is the person's own account
 * in that currency. `fallback` is where it returns to when a pay sheet closes: the person's main currency when they have no naira
 * wallet at all (R-87), else null.
 *
 * No currency list, rate or fee is kept here: the codes come from the Hub's accounts and quotes.
 */
/**
 * The requests that read the header: the quote and the payment of each paying feature, exactly the operations the Hub's contract
 * declares `X-Pay-Source-Currency` on (a spec compares this list with `contract/openapi.json`). Every other call goes out without it,
 * so a currency chosen on a pay sheet never rides on a wallet read, a feed or a chat.
 */
const PAYING: readonly (readonly [method: string, path: RegExp])[] = [
  ['GET', /\/money\/payments\/quote$/],
  ['POST', /\/money\/payments$/],
  ['GET', /\/tips\/wallet\/quote$/],
  ['POST', /\/tips\/wallet$/],
  ['GET', /\/content\/[^/]+\/unlock\/wallet\/quote$/],
  ['POST', /\/content\/[^/]+\/unlock\/wallet$/],
  ['POST', /\/dm\/[^/]+\/send\/wallet$/],
  ['POST', /\/dm\/send\/wallet\/pay$/],
  ['GET', /\/dm\/send\/wallet\/[^/]+\/quote$/],
  ['POST', /\/events\/[^/]+\/orders\/wallet$/],
  ['POST', /\/events\/orders\/wallet\/pay$/],
  ['GET', /\/events\/orders\/wallet\/[^/]+\/quote$/],
  ['GET', /\/legal\/requests\/[^/]+\/pay\/wallet\/quote$/],
  ['POST', /\/legal\/requests\/[^/]+\/pay\/wallet$/],
  ['GET', /\/communities\/[^/]+\/pass\/quote$/],
  ['POST', /\/communities\/[^/]+\/pass$/],
];

/** Whether the request is one of the paying calls above (a method and the URL's path, no query). */
export function carriesPaySource(method: string, pathname: string): boolean {
  const m = method.toUpperCase();
  return PAYING.some(([verb, path]) => verb === m && path.test(pathname));
}

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
