import type { Platform, SendInput, SendOutcome, StoreProductView, StorePurchaseView } from './api';
import { sendPurchase } from './api';
import * as iap from './iap';
import type { StoreCause, StoreTransaction } from './iap';
import type { StoreItem } from './model';

/**
 * Buying through the store sheet, from tap to grant (IAP-02, R-86). The order is the point:
 *
 * 1. the store sheet opens and the person pays the STORE (Google Play or the App Store), at the store's price in their own currency;
 * 2. the store transaction goes to the Hub (`POST /store/purchases`), which asks the store's own server before it grants anything;
 * 3. ONLY when the Hub answers 201 is the transaction finished (a pack consumed, a subscription acknowledged). Any other answer leaves it
 *    open, so the store gives it back (Restore, the next time the app starts a buy screen) and the Hub is asked again, never granting twice.
 *
 * Every way it can stop is a `PurchaseResult` named by its real cause, so a screen says what happened: cancelled, still pending at the
 * store, already owned, no connection, the store unavailable, the Hub not open for buying yet, or charged and not yet confirmed.
 */
export type PurchaseResult =
  | { kind: 'granted'; purchase: StorePurchaseView; finished: boolean }
  | { kind: 'cancelled' }
  /** The store has not taken the payment yet, or the Hub's check says so. Nothing was granted. */
  | { kind: 'store_pending' }
  /** The store still holds an earlier purchase of this and none of it could be handed over. */
  | { kind: 'already_owned' }
  /** The store could not be reached before anything was charged. */
  | { kind: 'network' }
  | { kind: 'store_unavailable' }
  | { kind: 'item_unavailable' }
  | { kind: 'not_open'; why: 'not_configured' | 'disabled' }
  /** The store took the payment and the Hub could not confirm it yet. The transaction is left open and goes again (Restore, the next open). */
  | { kind: 'unreachable' }
  | { kind: 'taken' }
  | { kind: 'pass_unavailable'; message: string }
  | { kind: 'unknown_product' }
  | { kind: 'invalid'; message: string }
  | { kind: 'refused'; message: string }
  | { kind: 'failed' };

export type BuyOptions = {
  platform: Platform;
  /** The signed-in account (Google Play's obfuscated account id). */
  accountId: string | null;
  /** The room, for a pass. */
  communityId?: string | null;
  /** A running subscription this one replaces (an upgrade). */
  replace?: { productId: string; purchaseToken: string } | null;
};

const consumable = (product: Pick<StoreProductView, 'subscription'>): boolean => !product.subscription;

/** Transactions on their way to the Hub right now, so a buy and a recovery never send the same one at once. */
const sending = new Map<string, Promise<SendOutcome>>();

function sendOnce(input: SendInput): Promise<SendOutcome> {
  const key = `${input.platform}:${input.purchaseToken ?? input.transactionId ?? ''}`;
  const running = sending.get(key);
  if (running) return running;
  const call = sendPurchase(input).finally(() => sending.delete(key));
  sending.set(key, call);
  return call;
}

/** Hands one transaction to the Hub, and finishes it at the store only on a 201. */
async function hand(
  platform: Platform,
  product: Pick<StoreProductView, 'storeProductId' | 'subscription'>,
  transaction: StoreTransaction,
  communityId: string | null,
): Promise<SendOutcome & { finished?: boolean }> {
  const outcome = await sendOnce({ platform, productId: product.storeProductId, purchaseToken: transaction.purchaseToken, transactionId: transaction.transactionId, communityId });
  if (outcome.kind !== 'granted') return outcome;
  return { ...outcome, finished: await iap.finish(transaction, consumable(product)) };
}

function fromCause(cause: StoreCause): PurchaseResult {
  switch (cause) {
    case 'cancelled':
      return { kind: 'cancelled' };
    case 'pending':
      return { kind: 'store_pending' };
    case 'already_owned':
      return { kind: 'already_owned' };
    case 'network':
      return { kind: 'network' };
    case 'store_unavailable':
      return { kind: 'store_unavailable' };
    case 'item_unavailable':
      return { kind: 'item_unavailable' };
    default:
      return { kind: 'failed' };
  }
}

function fromOutcome(outcome: SendOutcome & { finished?: boolean }): PurchaseResult {
  switch (outcome.kind) {
    case 'granted':
      return { kind: 'granted', purchase: outcome.purchase, finished: outcome.finished === true };
    case 'store_pending':
      return { kind: 'store_pending' };
    default:
      return outcome;
  }
}

/** Opens the store sheet for one product and carries the purchase to the Hub. */
export async function purchase(item: StoreItem, options: BuyOptions): Promise<PurchaseResult> {
  const { product } = item;
  const communityId = product.kind === 'pass' ? (options.communityId ?? null) : null;
  const bought = await iap.buy({
    storeProductId: product.storeProductId,
    subscription: product.subscription,
    offerToken: item.offerToken,
    accountId: options.accountId,
    communityId,
    replace: options.replace ?? null,
  });
  if (!bought.ok) {
    if (bought.cause !== 'already_owned') return fromCause(bought.cause);
    // The store still holds an earlier purchase of this: hand that one over first, and say so if it cannot be.
    const found = (await iap.owned()).find((t) => t.productId === product.storeProductId);
    if (!found) return { kind: 'already_owned' };
    const outcome = await hand(options.platform, product, found, communityId ?? found.communityId);
    return outcome.kind === 'granted' ? fromOutcome(outcome) : outcome.kind === 'unreachable' ? { kind: 'unreachable' } : { kind: 'already_owned' };
  }
  return fromOutcome(await hand(options.platform, product, bought.transaction, communityId));
}

export type Recovery = {
  /** Purchases the Hub granted now. */
  granted: StorePurchaseView[];
  /** Purchases the Hub already had. */
  already: number;
  /** Purchases the Hub could not take yet (no connection, the store's check pending). They stay open at the store. */
  left: number;
  /** The Hub is not open for this store. */
  notOpen: boolean;
};

/**
 * Hands the Hub what the store holds and the Hub has not been given. With `all`, also the subscriptions that are running and already
 * acknowledged (Restore purchases). Without it only what is still open at the store: a pack not yet consumed, a purchase not yet
 * acknowledged. A transaction of a product the Hub does not sell, or a pass whose room is not known, is left alone.
 */
export async function recover(products: readonly StoreProductView[], options: { platform: Platform; all: boolean; transactions?: StoreTransaction[] }): Promise<Recovery> {
  const result: Recovery = { granted: [], already: 0, left: 0, notOpen: false };
  const held = options.transactions ?? (await iap.owned());
  for (const t of held) {
    const product = products.find((p) => p.storeProductId === t.productId);
    if (!product || t.pending) continue;
    if (!options.all && product.subscription && t.acknowledged !== false) continue;
    const communityId = product.kind === 'pass' ? t.communityId : null;
    if (product.kind === 'pass' && !communityId) continue;
    const outcome = await hand(options.platform, product, t, communityId);
    if (outcome.kind === 'granted') {
      if (outcome.purchase.alreadyGranted) result.already += 1;
      else result.granted.push(outcome.purchase);
    } else if (outcome.kind === 'not_open') result.notOpen = true;
    else if (outcome.kind !== 'taken') result.left += 1;
  }
  return result;
}

/** The subscription of a product the person holds now, for an upgrade: Google Play needs its token to replace it. */
export async function heldSubscription(productIds: readonly string[]): Promise<{ productId: string; purchaseToken: string } | null> {
  const found = (await iap.owned()).find((t) => productIds.includes(t.productId) && t.purchaseToken);
  return found?.purchaseToken ? { productId: found.productId, purchaseToken: found.purchaseToken } : null;
}
