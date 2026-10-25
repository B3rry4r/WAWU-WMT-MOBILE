import { api, unwrap } from '@/api/client';
import { isApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { unreadable, type Envelope } from '@/features/wallet/api/home';

/**
 * The two Hub calls behind every purchase made in the store sheet (IAP-01, R-86):
 *
 * - `GET /store/products?platform=`: what is on sale in this phone's store (the points packs, the WAWU Credits packs, the tiers, the
 *   passes and the upload pack "Add 5 more products") and what each gives. It carries no price: the store's own is shown. `available: false` says the Hub is not open for this
 *   store yet (`store_not_configured`) or an admin paused it (`store_disabled`).
 * - `POST /store/purchases`: hands the Hub a purchase the store has just completed. The Hub asks the store's own server about it before it
 *   grants anything, and grants once per store transaction, so the same call again (a retry, a restore) answers the same purchase with
 *   `alreadyGranted: true`.
 *
 * The purchase never rejects: whatever came back (or did not) is one `SendOutcome`, so the buyer decides in one place whether the store
 * transaction may be finished. Only a 201 finishes it.
 */
export type StoreProductView = components['schemas']['StoreProductView'];
export type StoreCatalog = components['schemas']['StoreProductListView'];
export type StorePurchaseView = components['schemas']['StorePurchaseView'];
export type StoreKind = StoreProductView['kind'];
export type Platform = 'android' | 'ios';

const KINDS: StoreKind[] = ['points', 'credits', 'tier', 'pass', 'extra_products'];
const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/** The catalog, or a refusal to draw an answer that is not whole (never half empty). */
export function readCatalog(value: unknown, platform: Platform): StoreCatalog {
  const v = value as Partial<StoreCatalog> | null;
  if (!v || typeof v !== 'object' || typeof v.available !== 'boolean' || !Array.isArray(v.products)) throw unreadable('store');
  const products = v.products.map((row) => {
    const p = row as Partial<StoreProductView> | null;
    if (!p || !filled(p.id) || !filled(p.storeProductId) || !filled(p.title) || !KINDS.includes(p.kind as StoreKind) || typeof p.subscription !== 'boolean' || !p.grants || typeof p.grants !== 'object') {
      throw unreadable('store');
    }
    return p as StoreProductView;
  });
  const reason = v.reason === 'store_not_configured' || v.reason === 'store_disabled' ? v.reason : null;
  // The person's account token, which every purchase must carry. An answer without one is still drawn: the Hub decides what it accepts.
  return { platform, available: v.available, reason, accountToken: filled(v.accountToken) ? v.accountToken : '', products };
}

/** GET /store/products for this phone's store. */
export async function fetchCatalog(platform: Platform): Promise<StoreCatalog> {
  const body = (await unwrap(api.GET('/api/hub/store/products', { params: { query: { platform } } }))) as unknown as Envelope<StoreCatalog>;
  return readCatalog(body?.data, platform);
}

export const catalogQuery = (platform: Platform | null, owner: string | null) =>
  ({ queryKey: ['store', 'catalog', platform ?? 'none', owner ?? ''] as const, queryFn: () => fetchCatalog(platform as Platform), staleTime: 0, enabled: Boolean(platform) && Boolean(owner), retry: false }) as const;

export type SendInput = { platform: Platform; productId: string; purchaseToken: string | null; transactionId: string | null; communityId: string | null };

/** What the Hub came to on a purchase handed to it. Every outcome but `granted` leaves the store transaction open. */
export type SendOutcome =
  /** 201: the Hub granted it (or had, `alreadyGranted`). The store transaction may be finished now. */
  | { kind: 'granted'; purchase: StorePurchaseView }
  /** `store_not_configured` or `store_disabled`: buying here is not open yet. */
  | { kind: 'not_open'; why: 'not_configured' | 'disabled' }
  /** `store_purchase_pending`: the store has not finished taking the payment. Nothing was granted. */
  | { kind: 'store_pending' }
  /** The Hub, or the Hub's call to the store, could not be reached (no connection, a 5xx, `store_unreachable`, a 201 that cannot be read). Safe to send again. */
  | { kind: 'unreachable' }
  /** `store_purchase_taken`: another person already uses this store purchase or subscription, or it was made with another person's token. */
  | { kind: 'taken' }
  /** `store_purchase_other_room` (409): a pass payment the Hub already gave to another room (or the store recorded for another room). It is never given to this one. */
  | { kind: 'room_mismatch' }
  /** `store_account_token_missing` (422): the purchase carries no account token, so this version of the app did not bind it to the person. Update the app. */
  | { kind: 'update_app' }
  /** `store_grant_failed` (500): the store has the payment and the Hub could not finish giving it. The transaction stays open and goes again. */
  | { kind: 'grant_failed' }
  /** `store_pass_not_available`: the room cannot be joined with a pass (not sold, you host it, removed). The Hub's sentence. */
  | { kind: 'pass_unavailable'; message: string }
  /** `store_product_unknown`: the Hub no longer sells this product. */
  | { kind: 'unknown_product' }
  /** `store_purchase_invalid`: the store does not know it, or says it was cancelled, refunded or is for another app. The Hub's sentence. */
  | { kind: 'invalid'; message: string }
  /** Anything else the Hub refused (a missing receipt, a bad body). */
  | { kind: 'refused'; message: string };

function wholeView(value: unknown): value is StorePurchaseView {
  const v = value as Partial<StorePurchaseView> | null;
  return Boolean(v && typeof v === 'object' && filled(v.id) && filled(v.kind) && typeof v.alreadyGranted === 'boolean' && v.grant && typeof v.grant === 'object');
}

/** POST /store/purchases. Never rejects. */
export async function sendPurchase(input: SendInput): Promise<SendOutcome> {
  const body = {
    platform: input.platform,
    productId: input.productId,
    ...(input.platform === 'android' && input.purchaseToken ? { purchaseToken: input.purchaseToken } : {}),
    ...(input.platform === 'ios' && input.transactionId ? { transactionId: input.transactionId } : {}),
    ...(input.communityId ? { communityId: input.communityId } : {}),
  };
  try {
    const data = (await unwrap(api.POST('/api/hub/store/purchases', { body }))) as unknown as Envelope<StorePurchaseView>;
    // The Hub said created and the answer cannot be read: the grant may exist, so it is not a refusal. Sending it again answers it.
    return wholeView(data?.data) ? { kind: 'granted', purchase: data.data } : { kind: 'unreachable' };
  } catch (error) {
    if (!isApiError(error)) return { kind: 'unreachable' };
    const message = error.message || 'We could not take this purchase.';
    switch (error.code) {
      case 'store_not_configured':
        return { kind: 'not_open', why: 'not_configured' };
      case 'store_disabled':
        return { kind: 'not_open', why: 'disabled' };
      case 'store_purchase_pending':
        return { kind: 'store_pending' };
      case 'store_unreachable':
        return { kind: 'unreachable' };
      case 'store_purchase_taken':
        return { kind: 'taken' };
      case 'store_purchase_other_room':
        return { kind: 'room_mismatch' };
      case 'store_account_token_missing':
        return { kind: 'update_app' };
      case 'store_grant_failed':
        return { kind: 'grant_failed' };
      case 'store_pass_not_available':
        return { kind: 'pass_unavailable', message };
      case 'store_product_unknown':
        return { kind: 'unknown_product' };
      case 'store_purchase_invalid':
        return { kind: 'invalid', message };
      default:
        // No answer that proves anything (no connection, a timeout, a server fault) is not a refusal.
        return error.kind === 'network' || error.kind === 'server' || error.status === 0 || error.status >= 500 ? { kind: 'unreachable' } : { kind: 'refused', message };
    }
  }
}
