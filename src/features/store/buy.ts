import type { Platform, SendInput, SendOutcome, StoreProductView, StorePurchaseView } from './api';
import { sendPurchase } from './api';
import * as iap from './iap';
import type { StoreCause, StoreTransaction } from './iap';
import type { StoreItem } from './model';
import { bindRoom, forgetBuy, pendingBuy, rememberBuy, roomOf, unbindRoom } from './roomIntent';

/**
 * Buying through the store sheet, from tap to grant (IAP-02, R-86). The order is the point:
 *
 * 1. the store sheet opens and the person pays the STORE (Google Play or the App Store), at the store's price in their own currency;
 * 2. the store transaction goes to the Hub (`POST /store/purchases`), which asks the store's own server before it grants anything;
 * 3. ONLY when the Hub answers 201 is the transaction finished (a pack or a pass consumed, a subscription acknowledged). Any other answer
 *    leaves it open, so the store gives it back (Restore, the next time the app starts a buy screen) and the Hub is asked again, never granting twice.
 *
 * A tier is the one subscription. A community pass is bought once for one room (IAP-03 round 2): the same product can be bought again, for
 * another room or to renew, and a payment still held by the store is for the room it was bought for, never for the room on screen now.
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
  /** The Hub says this pass payment was already given to another room, or the store recorded it for another room. It is never given to this one. */
  | { kind: 'room_mismatch' }
  /**
   * The store was still holding an earlier pass payment, bought for ANOTHER room. It was handed to the Hub with its own room, granted there and
   * finished, and nothing was bought for this room: the person buys again.
   */
  | { kind: 'earlier_room'; purchase: StorePurchaseView }
  /** The Hub says the purchase carried no account token: this version of the app can not take it. */
  | { kind: 'update_app' }
  /** The store has the payment and the Hub could not finish giving it yet. The transaction is left open and goes again. */
  | { kind: 'grant_failed' }
  | { kind: 'pass_unavailable'; message: string }
  | { kind: 'unknown_product' }
  | { kind: 'invalid'; message: string }
  | { kind: 'refused'; message: string }
  | { kind: 'failed' };

export type BuyOptions = {
  platform: Platform;
  /** The person's account token from `GET /store/products` (never the user id): Google Play's obfuscated account id and the App Store's app account token. */
  accountToken: string | null;
  /** The room, for a pass. */
  communityId?: string | null;
  /** A running subscription this one replaces (an upgrade). */
  replace?: { productId: string; purchaseToken: string } | null;
};

const consumable = (product: Pick<StoreProductView, 'subscription'>): boolean => !product.subscription;

/** What a held transaction is told apart by: the App Store's transaction id, or Google Play's purchase token. */
const keyOf = (t: StoreTransaction): string | null => t.transactionId ?? t.purchaseToken;

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
  const isPass = product.kind === 'pass';
  const communityId = isPass ? (options.communityId ?? null) : null;
  // The App Store's account field is taken by the token, so a tier (and the room of a pass) is kept on the phone until the Hub has the purchase.
  const remembers = product.subscription || isPass;
  if (remembers) await rememberBuy(options.accountToken, product.storeProductId, communityId);
  const bought = await iap.buy({
    storeProductId: product.storeProductId,
    subscription: product.subscription,
    offerToken: item.offerToken,
    accountToken: options.accountToken,
    communityId,
    replace: options.replace ?? null,
  });
  if (!bought.ok) {
    if (bought.cause !== 'already_owned') {
      // Nothing was bought, so nothing is owed. A slow payment keeps its entry: it may still clear.
      if (remembers && bought.cause !== 'pending') await forgetBuy(options.accountToken);
      return fromCause(bought.cause);
    }
    // The store still holds an earlier purchase of this: hand that one over first, and say so if it cannot be.
    const found = (await iap.owned()).find((t) => t.productId === product.storeProductId);
    if (!found) return { kind: 'already_owned' };
    // A pass held by the store is for the room it was bought for (Google Play kept it in the purchase, the App Store's is kept by
    // transaction on this phone). It is handed over with THAT room, never the room being bought now (F2b); one with no room known can not be placed.
    const heldRoom = isPass ? (found.communityId ?? (await roomOf(options.accountToken, keyOf(found)))) : communityId;
    if (isPass && !heldRoom) return { kind: 'already_owned' };
    const outcome = await hand(options.platform, product, found, heldRoom);
    if (outcome.kind === 'granted') {
      if (remembers) await forgetBuy(options.accountToken);
      if (isPass && outcome.finished) await unbindRoom(options.accountToken, keyOf(found));
      if (isPass && heldRoom !== communityId) return { kind: 'earlier_room', purchase: outcome.purchase };
      return fromOutcome(outcome);
    }
    if (outcome.kind === 'room_mismatch') return outcome;
    return outcome.kind === 'unreachable' || outcome.kind === 'grant_failed' ? { kind: outcome.kind } : { kind: 'already_owned' };
  }
  const key = keyOf(bought.transaction);
  // The store has taken the payment: the room it was for is kept against THIS transaction before anything else can go wrong, and the
  // entry for what the person was trying to buy is let go (the transaction's own is the one that counts from here).
  if (isPass) {
    await bindRoom(options.accountToken, key, communityId);
    await forgetBuy(options.accountToken);
  }
  const outcome = await hand(options.platform, product, bought.transaction, communityId);
  if (outcome.kind === 'granted') {
    if (product.subscription) await forgetBuy(options.accountToken);
    if (isPass && outcome.finished) await unbindRoom(options.accountToken, key);
  }
  return fromOutcome(outcome);
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
 * acknowledged (Restore purchases). Without it only what is still open at the store: a pack or a pass not yet consumed, a tier not yet
 * acknowledged. A transaction of a product the Hub does not sell, or a pass whose room is not known, is left alone.
 *
 * A held pass is handed over with the room it was bought for: the one Google Play kept in the purchase, or the one this phone kept against
 * that transaction. The latest thing the person was trying to buy stands in only for a pass nothing was kept for, and only when it is the
 * single such pass held, so a payment for one room is never given to the room being looked at (F2b).
 */
export async function recover(
  products: readonly StoreProductView[],
  options: { platform: Platform; all: boolean; transactions?: StoreTransaction[]; accountToken?: string | null },
): Promise<Recovery> {
  const result: Recovery = { granted: [], already: 0, left: 0, notOpen: false };
  const token = options.accountToken ?? null;
  const held = options.transactions ?? (await iap.owned());
  const passes = held.filter((t) => !t.pending && products.find((p) => p.storeProductId === t.productId)?.kind === 'pass');
  const placed = new Map<StoreTransaction, string | null>();
  for (const t of passes) placed.set(t, t.communityId ?? (await roomOf(token, keyOf(t))));
  const unplaced = passes.filter((t) => !placed.get(t));
  for (const t of held) {
    const product = products.find((p) => p.storeProductId === t.productId);
    if (!product || t.pending) continue;
    // A running subscription the store already acknowledged is handed over only by Restore, or when this phone remembers it owes the Hub this
    // product (the App Store never says whether the Hub was told).
    const owed = product.subscription ? await pendingBuy(token, product.storeProductId) : null;
    if (!options.all && product.subscription && t.acknowledged !== false && !owed) continue;
    let communityId: string | null = null;
    let fromEntry = false;
    if (product.kind === 'pass') {
      communityId = placed.get(t) ?? null;
      if (!communityId && unplaced.length === 1 && unplaced[0] === t) {
        communityId = (await pendingBuy(token, product.storeProductId))?.communityId ?? null;
        fromEntry = communityId !== null;
      }
      if (!communityId) continue;
    }
    const outcome = await hand(options.platform, product, t, communityId);
    if (outcome.kind === 'granted') {
      if (outcome.purchase.alreadyGranted) result.already += 1;
      else result.granted.push(outcome.purchase);
      if (product.subscription || fromEntry) await forgetBuy(token);
      if (product.kind === 'pass' && outcome.finished) await unbindRoom(token, keyOf(t));
    } else if (outcome.kind === 'not_open') result.notOpen = true;
    else if (outcome.kind !== 'taken' && outcome.kind !== 'room_mismatch') result.left += 1;
  }
  return result;
}

/** The subscription of a product the person holds now, for an upgrade: Google Play needs its token to replace it. */
export async function heldSubscription(productIds: readonly string[]): Promise<{ productId: string; purchaseToken: string } | null> {
  const found = (await iap.owned()).find((t) => productIds.includes(t.productId) && t.purchaseToken);
  return found?.purchaseToken ? { productId: found.productId, purchaseToken: found.purchaseToken } : null;
}
