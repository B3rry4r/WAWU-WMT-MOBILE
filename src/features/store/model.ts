import type { Os } from './iap';
import { storeName } from './iap';
import type { StoreProductView } from './api';

/**
 * The words around a store purchase (R-86). The price is never one of them: it is the store's own, formatted by the store in the
 * person's own currency. A count of points or credits, a tier's name and a pass's days are the Hub's (`GET /store/products`).
 */

/** One product ready to draw and buy: the Hub's product and the store's own price for it. */
export type StoreItem = { product: StoreProductView; price: string; offerToken: string | null };

/** What a screen can be told about buying right now. */
export type StoreState =
  | { kind: 'loading' }
  /** The Hub is not open for this store yet (`store_not_configured`), or an admin paused it (`store_disabled`). */
  | { kind: 'not_open'; why: 'not_configured' | 'disabled' }
  /** There is no store on this device (the web, or a build without the module), or it will not open. */
  | { kind: 'store_unavailable'; web: boolean }
  /** The Hub or the store could not be asked. */
  | { kind: 'error'; message: string }
  | { kind: 'ready'; items: StoreItem[] };

export const NOT_OPEN_TITLE = 'Buying is not open yet';
export const NOT_OPEN_LINE = 'You can not buy this here just yet. Please check back soon.';
export const PAUSED_LINE = 'Buying is paused for now. Please check back soon.';

/** Where there is no store sheet to open. */
export function storeUnavailableLine(os: Os | null): string {
  return os === null ? 'Buying happens in the phone app, where the store can take your payment.' : `${storeName(os)} is not available on this phone right now. Check that you are signed in to it and that it is up to date, then try again.`;
}

/** "the App Store" or "Google Play". */
export { storeName };

/**
 * The store's own item for a tier, once the store has answered. Null while it is loading, not open, unavailable or failed, and when it does
 * not sell that tier: a screen then shows no price at all, never the Hub's plan price (IAP-03, R-86: bought "at the store's price in the
 * person's own currency").
 */
export function tierItemOf(state: StoreState, tierId: string | null | undefined): StoreItem | null {
  if (state.kind !== 'ready' || !tierId) return null;
  return state.items.find((i) => i.product.kind === 'tier' && i.product.grants.tierId === tierId) ?? null;
}

/** The count a points or credits product gives, for a row or a button. */
export function countOf(product: Pick<StoreProductView, 'grants'>): number {
  return product.grants.points ?? product.grants.credits ?? 0;
}

/** "1,000" for a count. */
export const plain = (n: number): string => new Intl.NumberFormat('en-US').format(Math.max(0, Math.floor(n)));

/** The store's own price, or the quiet word when the store did not give one. */
export const priceOf = (item: Pick<StoreItem, 'price'>): string => item.price;

/** "Buy · $4.99": the pay button's words. The price is the store's. */
export const buyLabel = (item: Pick<StoreItem, 'price'>, verb = 'Buy'): string => `${verb} · ${item.price}`;

/** The Restore purchases row. */
export const RESTORE_WORDS = {
  label: 'Restore purchases',
  hint: 'Already bought this on this account? Bring it back.',
  working: 'Checking the store...',
  nothing: 'There was nothing to restore.',
} as const;

/** "Restored 2 purchases.", "Everything is already up to date." */
export function restoredLine(granted: number, already: number): string {
  if (granted > 0) return granted === 1 ? 'Restored 1 purchase.' : `Restored ${granted} purchases.`;
  if (already > 0) return 'Everything is already up to date.';
  return RESTORE_WORDS.nothing;
}

/** What one pass purchase gives, for a price line: "for 30 days". A pass is bought once (IAP-03 round 2), so it is a length, never a rate. */
export function forDays(days: number | null): string {
  if (days === null || days <= 0) return '';
  return days === 1 ? 'for 1 day' : `for ${days} days`;
}
