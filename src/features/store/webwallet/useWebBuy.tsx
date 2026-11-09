import type { WebBuy } from './webBuyTypes';

export type { WebBuy } from './webBuyTypes';

const INERT: WebBuy = { busy: false, said: null, granted: null, begin: () => undefined, clear: () => undefined, sheets: null };

/**
 * The phone's side of the web wallet path (R-86: the phone is unchanged). It calls no hook and draws nothing: the live path is in
 * \`useWebBuy.web.tsx\`, which only the web build loads.
 */
export function useWebBuy(): WebBuy {
  return INERT;
}
