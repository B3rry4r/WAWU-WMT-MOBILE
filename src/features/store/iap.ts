import { Platform } from 'react-native';

import type { Product, ProductSubscription, Purchase } from 'expo-iap';

import { StoreFailure } from './failure';

/**
 * The store sheet's one doorway (IAP-02, R-86): the only file that reaches `expo-iap`, the native module for Google Play Billing and
 * Apple In-App Purchase. Everything above it works with the plain shapes below and never sees the module's own, so a test replaces the
 * module at this boundary and nothing else, and a phone build without the module reads as "the store is not available" rather than a crash.
 *
 * The module is read when first needed (never at import): a build that does not carry it (Expo Go, a build from before IAP-02) loads every
 * screen as before and answers `store_unavailable` only where a person tries to buy.
 */
export type Os = 'android' | 'ios';

/**
 * Why a store step did not finish, by its real cause. `already_owned` means the store still holds an earlier purchase of the same item.
 * `declined` is a payment the store refused (Google Play said no, for funds or another reason); the store is there, nothing was charged.
 */
export type StoreCause = 'cancelled' | 'pending' | 'already_owned' | 'network' | 'store_unavailable' | 'item_unavailable' | 'declined' | 'failed';

/** The store's own price for one product: the store formats it, in the person's own currency (R-86). */
export type StorePrice = {
  storeProductId: string;
  /** "₦2,500.00", "$4.99": exactly as the store wrote it. */
  price: string;
  /** What a subscription needs on Google Play to name the offer being bought (null for a pack and on the App Store). */
  offerToken: string | null;
};

/** One completed (or pending) store transaction, as the Hub needs it. `native` is the module's own object, kept only to finish it. */
export type StoreTransaction = {
  productId: string;
  /** Google Play. */
  purchaseToken: string | null;
  /** App Store. */
  transactionId: string | null;
  /** The store has not taken the payment yet (a slow method, a parent's approval). Nothing may be granted. */
  pending: boolean;
  /** Google Play: the store already acknowledged it. */
  acknowledged: boolean | null;
  /** The room a pass was bought for, which the buy put in the purchase (Google's profile id). Always null on the App Store, whose field carries the account token. */
  communityId: string | null;
  native: unknown;
};

export type BuyRequest = {
  storeProductId: string;
  subscription: boolean;
  offerToken: string | null;
  /**
   * The person's account token (`GET /store/products` `accountToken`, a stable UUID the Hub gives each person, never the user id). It binds the
   * purchase to the person: Google Play's obfuscated account id and the App Store's app account token. The Hub refuses a purchase with another's or none.
   */
  accountToken: string | null;
  /** The room, for a pass (Google Play's obfuscated profile id; the App Store's field holds the account token, so the room is kept on the phone, `./roomIntent`). */
  communityId: string | null;
  /** A running subscription of the same kind the new one replaces (an upgrade): Google Play needs the old token and product. */
  replace: { productId: string; purchaseToken: string } | null;
};

export type BuyResult = { ok: true; transaction: StoreTransaction } | { ok: false; cause: StoreCause };

type Module = typeof import('expo-iap');

let loaded: Module | null | undefined;

function iap(): Module | null {
  if (loaded !== undefined) return loaded;
  try {
    // Read here, not at the top: see the note above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require('expo-iap') as Module;
  } catch {
    loaded = null;
  }
  return loaded;
}

/** For tests: forget that the module was read. */
export function resetIapForTests(): void {
  loaded = undefined;
  connecting = null;
}

/** The store this phone buys from, or null where there is none (the web). */
export function storeOs(): Os | null {
  return Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null;
}

/** "Google Play" or "the App Store", for a sentence. */
export function storeName(os: Os | null): string {
  return os === 'ios' ? 'the App Store' : 'Google Play';
}

const CANCELLED: string[] = ['user-cancelled'];
const PENDING: string[] = ['pending', 'deferred-payment'];
const OWNED: string[] = ['already-owned'];
const NETWORK: string[] = ['network-error', 'service-timeout', 'remote-error', 'interrupted'];
const UNAVAILABLE: string[] = [
  'billing-unavailable',
  'iap-not-available',
  'service-disconnected',
  'feature-not-supported',
  'init-connection',
  'connection-closed',
  'activity-unavailable',
  'not-prepared',
];
const ITEM: string[] = ['item-unavailable', 'sku-not-found', 'sku-offer-mismatch', 'empty-sku-list', 'query-product'];

/**
 * Google Play's sub-response code for a payment it declined for want of funds. It rides on the purchase error as `subResponseCodeAndroid`
 * (openiap-google 4.0.3 `toOpenIapSubResponseCode`, read by expo-iap `nativeError.ts`).
 */
const INSUFFICIENT_FUNDS = 'payment-declined-due-to-insufficient-funds';

/**
 * The cause a store error code names. `step` says where the error came from. While BUYING (`'buy'`) the store is plainly there (the connection
 * opened and the sheet was asked for), so `service-error` is the store refusing the payment: Google Play's ERROR (response code 6) and
 * SERVICE_UNAVAILABLE (2) both arrive as that one code (openiap-google 4.0.3 `OpenIapError.fromBillingResponseCode`, expo-iap errorMapping.ts
 * lines 63 and 67), and a payment declined for insufficient funds carries the sub-response code above. Asking the store for prices or a
 * restore (`'ask'`, the default) keeps `service-error` as "the store could not be reached". A code the module adds later is a plain failure.
 */
export function causeOf(code: unknown, sub?: unknown, step: 'ask' | 'buy' = 'ask'): StoreCause {
  const c = typeof code === 'string' ? code : '';
  if (step === 'buy' && sub === INSUFFICIENT_FUNDS) return 'declined';
  if (CANCELLED.includes(c)) return 'cancelled';
  if (PENDING.includes(c)) return 'pending';
  if (OWNED.includes(c)) return 'already_owned';
  if (NETWORK.includes(c)) return 'network';
  if (c === 'service-error') return step === 'buy' ? 'declined' : 'store_unavailable';
  if (UNAVAILABLE.includes(c)) return 'store_unavailable';
  if (ITEM.includes(c)) return 'item_unavailable';
  return 'failed';
}

const codeOf = (error: unknown): unknown => (typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined);
const subOf = (error: unknown): unknown => (typeof error === 'object' && error !== null ? (error as { subResponseCodeAndroid?: unknown }).subResponseCodeAndroid : undefined);

let connecting: Promise<boolean> | null = null;

/** Opens the store connection, once at a time. False where there is no store or it will not open. */
export function connect(): Promise<boolean> {
  const m = iap();
  if (!m || storeOs() === null) return Promise.resolve(false);
  if (connecting) return connecting;
  const run = (async () => {
    try {
      return (await m.initConnection()) !== false;
    } catch {
      return false;
    }
  })();
  connecting = run.then((ok) => {
    // A connection that failed is tried again the next time; one that opened is kept.
    if (!ok) connecting = null;
    return ok;
  });
  return connecting;
}

type Priced = Product | ProductSubscription;

function offerOf(product: Priced): { price: string; token: string | null } {
  const offers = 'subscriptionOffers' in product ? (product.subscriptionOffers ?? []) : [];
  // The base plan is the offer with no offer id of its own; a trial or a discount carries one.
  const base = offers.find((o) => !o.id) ?? offers[0];
  if (!base) return { price: product.displayPrice, token: null };
  return { price: base.displayPrice || product.displayPrice, token: base.offerTokenAndroid ?? null };
}

/**
 * The store's price for each product it knows, keyed by the store's own id. A product the store does not list is left out. Throws
 * `StoreFailure` when the store cannot be reached.
 */
export async function fetchPrices(ids: { packs: string[]; subscriptions: string[]; passes?: string[] }): Promise<Map<string, StorePrice>> {
  const m = iap();
  if (!m || storeOs() === null) throw new StoreFailure('store_unavailable');
  if (!(await connect())) throw new StoreFailure('store_unavailable');
  const out = new Map<string, StorePrice>();
  try {
    const asked: [string[], 'in-app' | 'subs' | 'all'][] = [
      [ids.packs, 'in-app'],
      [ids.subscriptions, 'subs'],
      // A community pass is bought once: a consumable in-app product on Google Play, a non-renewing subscription on the App Store. The App
      // Store files that under neither "in-app" nor "subs" for certain, so its passes are asked for by id with every type (IAP-03 round 2).
      [ids.passes ?? [], storeOs() === 'ios' ? 'all' : 'in-app'],
    ];
    for (const [skus, type] of asked) {
      if (skus.length === 0) continue;
      const found = (await m.fetchProducts({ skus, type })) ?? [];
      for (const product of found as Priced[]) {
        const offer = offerOf(product);
        if (offer.price) out.set(product.id, { storeProductId: product.id, price: offer.price, offerToken: offer.token });
      }
    }
  } catch (error) {
    throw new StoreFailure(causeOf(codeOf(error)) === 'failed' ? 'store_unavailable' : causeOf(codeOf(error)));
  }
  return out;
}

function transactionOf(p: Purchase): StoreTransaction {
  const android = p as Purchase & { isAcknowledgedAndroid?: boolean | null; obfuscatedProfileIdAndroid?: string | null };
  const ios = p as Purchase & { transactionId?: string | null };
  const isIos = Platform.OS === 'ios';
  return {
    productId: p.productId,
    purchaseToken: isIos ? null : (p.purchaseToken ?? null),
    transactionId: isIos ? (ios.transactionId ?? p.id ?? null) : null,
    pending: p.purchaseState === 'pending',
    acknowledged: isIos ? null : (android.isAcknowledgedAndroid ?? null),
    communityId: isIos ? null : (android.obfuscatedProfileIdAndroid ?? null),
    native: p,
  };
}

/**
 * Opens the store sheet and waits for what the person does with it. The module reports the result as an event (the purchase, or an
 * error), so both are listened for before the sheet opens, and the first one for this product settles the call.
 */
export async function buy(request: BuyRequest): Promise<BuyResult> {
  const m = iap();
  const os = storeOs();
  if (!m || os === null) return { ok: false, cause: 'store_unavailable' };
  if (!(await connect())) return { ok: false, cause: 'store_unavailable' };
  return new Promise<BuyResult>((resolve) => {
    let settled = false;
    const subs: { remove: () => void }[] = [];
    const settle = (result: BuyResult) => {
      if (settled) return;
      settled = true;
      for (const s of subs) s.remove();
      resolve(result);
    };
    subs.push(
      m.purchaseUpdatedListener((p: Purchase) => {
        if (p.productId !== request.storeProductId) return;
        const t = transactionOf(p);
        settle(t.pending ? { ok: false, cause: 'pending' } : { ok: true, transaction: t });
      }),
    );
    subs.push(
      m.purchaseErrorListener((e) => {
        if (e.productId && e.productId !== request.storeProductId) return;
        settle({ ok: false, cause: causeOf(e.code, (e as { subResponseCodeAndroid?: unknown }).subResponseCodeAndroid, 'buy') });
      }),
    );
    // The person's account token goes to BOTH stores on every purchase; the room of a pass rides in Google's profile id only.
    const token = request.accountToken ?? undefined;
    const room = request.communityId ?? undefined;
    const apple = { sku: request.storeProductId, ...(token ? { appAccountToken: token } : {}) };
    const google = { skus: [request.storeProductId], obfuscatedAccountId: token, obfuscatedProfileId: room };
    const args = request.subscription
      ? {
          type: 'subs' as const,
          request: {
            apple,
            google: {
              ...google,
              subscriptionOffers: request.offerToken ? [{ sku: request.storeProductId, offerToken: request.offerToken }] : [],
              ...(request.replace
                ? {
                    purchaseToken: request.replace.purchaseToken,
                    subscriptionProductReplacementParams: { oldProductId: request.replace.productId, replacementMode: 'charge-prorated-price' as const },
                  }
                : {}),
            },
          },
        }
      : { type: 'in-app' as const, request: { apple, google } };
    Promise.resolve()
      .then(() => m.requestPurchase(args as Parameters<Module['requestPurchase']>[0]))
      .catch((error: unknown) => settle({ ok: false, cause: causeOf(codeOf(error), subOf(error), 'buy') }));
  });
}

/**
 * Tells the store the purchase is delivered: a pack or a pass is consumed (so it can be bought again), a subscription acknowledged. Called only
 * after the Hub has answered 201. Never throws: the grant stands whether or not the store takes this (the Hub also acknowledges on its side),
 * and a transaction left open is seen and finished on the next ask.
 */
export async function finish(transaction: StoreTransaction, consumable: boolean): Promise<boolean> {
  const m = iap();
  if (!m) return false;
  try {
    await m.finishTransaction({ purchase: transaction.native as Purchase, isConsumable: consumable });
    return true;
  } catch {
    return false;
  }
}

/** What the store holds that was bought and not finished, plus the subscriptions that are running. Empty where there is no store. */
export async function owned(): Promise<StoreTransaction[]> {
  const m = iap();
  if (!m || storeOs() === null || !(await connect())) return [];
  try {
    const list = (await m.getAvailablePurchases()) ?? [];
    // iOS (F3): StoreKit never lists a consumable as an entitlement, so `getAvailablePurchases` cannot show a `wawu.buy.*` payment the Hub was
    // not told about; StoreKit's unfinished transactions (`getPendingTransactionsIOS`) can. Read both, once each transaction. A transaction the
    // store has not cleared yet comes back as `pending`, so a screen waits for it and nothing posts it.
    let unfinished: typeof list = [];
    if (Platform.OS === 'ios' && typeof m.getPendingTransactionsIOS === 'function') {
      try {
        unfinished = ((await m.getPendingTransactionsIOS()) ?? []) as typeof list;
      } catch {
        unfinished = [];
      }
    }
    const seen = new Set<string>();
    const all = [...list, ...unfinished].filter((p) => {
      const key = `${p.productId}:${(p as { transactionId?: string | null }).transactionId ?? p.id ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return all.map(transactionOf);
  } catch {
    return [];
  }
}

/** Restore purchases: asks the store to sync what this account bought, then reads what it holds. Throws `StoreFailure` when the store cannot be reached. */
export async function restore(): Promise<StoreTransaction[]> {
  const m = iap();
  if (!m || storeOs() === null || !(await connect())) throw new StoreFailure('store_unavailable');
  try {
    await m.restorePurchases();
  } catch (error) {
    const cause = causeOf(codeOf(error));
    // A restore that found nothing, or that the person turned down at the store's sign-in, is not a failure of the store.
    if (cause !== 'cancelled' && cause !== 'failed') throw new StoreFailure(cause);
  }
  return owned();
}

