/*
 * A stand-in for the native `expo-iap` module, for tests only (IAP-02). It stands at the module's own boundary: the functions below have
 * the module's names and shapes, and everything above them (the app's store layer, the screens) is the real code. A test installs it with
 *
 *   jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
 *
 * and steers what the store does next through `fakeStore`. The store sheet itself is not drawn: `requestPurchase` answers the way the
 * module does, with an event (a purchase, or an error) on the listeners.
 */
type Listener<T> = (event: T) => void;

export type ShelfProduct = { id: string; displayPrice: string; type: 'in-app' | 'subs'; offerToken?: string };
export type HeldPurchase = {
  id: string;
  productId: string;
  purchaseState: 'purchased' | 'pending';
  purchaseToken: string | null;
  transactionId?: string;
  isAcknowledgedAndroid?: boolean | null;
  obfuscatedProfileIdAndroid?: string | null;
  appAccountToken?: string | null;
};

/** What the store does with the next `requestPurchase`. */
export type NextBuy = { kind: 'buy'; purchase?: Partial<HeldPurchase> } | { kind: 'pending' } | { kind: 'error'; code: string } | { kind: 'reject'; code: string } | { kind: 'silent' };

export const fakeStore = {
  connectOk: true,
  products: [] as ShelfProduct[],
  next: { kind: 'buy' } as NextBuy,
  owned: [] as HeldPurchase[],
  finished: [] as { productId: string; isConsumable: boolean }[],
  finishFails: false,
  requests: [] as unknown[],
  restores: 0,
  fetches: [] as { skus: string[]; type: string }[],
  updated: [] as Listener<HeldPurchase>[],
  failed: [] as Listener<{ code: string; productId?: string | null; message: string }>[],
  serial: 0,
  reset() {
    this.connectOk = true;
    this.products = [];
    this.next = { kind: 'buy' };
    this.owned = [];
    this.finished = [];
    this.finishFails = false;
    this.requests = [];
    this.restores = 0;
    this.fetches = [];
    this.updated = [];
    this.failed = [];
    this.serial = 0;
  },
};

const sku = (args: unknown): string => {
  const a = args as { request?: { apple?: { sku?: string }; google?: { skus?: string[] } } };
  return a.request?.google?.skus?.[0] ?? a.request?.apple?.sku ?? '';
};

export const moduleMock = {
  initConnection: jest.fn(async () => fakeStore.connectOk),
  endConnection: jest.fn(async () => true),
  fetchProducts: jest.fn(async ({ skus, type }: { skus: string[]; type: string }) => {
    fakeStore.fetches.push({ skus, type });
    return fakeStore.products
      .filter((p) => skus.includes(p.id) && p.type === type)
      .map((p) => ({
        id: p.id,
        title: p.id,
        displayPrice: p.displayPrice,
        subscriptionOffers: p.offerToken ? [{ id: '', displayPrice: p.displayPrice, offerTokenAndroid: p.offerToken }] : undefined,
      }));
  }),
  purchaseUpdatedListener: jest.fn((listener: Listener<HeldPurchase>) => {
    fakeStore.updated.push(listener);
    return { remove: () => void (fakeStore.updated = fakeStore.updated.filter((l) => l !== listener)) };
  }),
  purchaseErrorListener: jest.fn((listener: Listener<{ code: string; productId?: string | null; message: string }>) => {
    fakeStore.failed.push(listener);
    return { remove: () => void (fakeStore.failed = fakeStore.failed.filter((l) => l !== listener)) };
  }),
  requestPurchase: jest.fn(async (args: unknown) => {
    fakeStore.requests.push(args);
    const productId = sku(args);
    const next = fakeStore.next;
    if (next.kind === 'reject') throw Object.assign(new Error(next.code), { code: next.code });
    await Promise.resolve();
    if (next.kind === 'silent') return null;
    if (next.kind === 'error') {
      for (const l of [...fakeStore.failed]) l({ code: next.code, productId, message: next.code });
      return null;
    }
    fakeStore.serial += 1;
    const purchase: HeldPurchase = {
      id: `tx-${fakeStore.serial}`,
      productId,
      purchaseState: next.kind === 'pending' ? 'pending' : 'purchased',
      purchaseToken: `token-${fakeStore.serial}`,
      transactionId: `${1000 + fakeStore.serial}`,
      isAcknowledgedAndroid: false,
      ...(next.kind === 'buy' ? next.purchase : {}),
    };
    for (const l of [...fakeStore.updated]) l(purchase);
    return null;
  }),
  finishTransaction: jest.fn(async ({ purchase, isConsumable }: { purchase: HeldPurchase; isConsumable?: boolean }) => {
    if (fakeStore.finishFails) throw new Error('already consumed');
    fakeStore.finished.push({ productId: purchase.productId, isConsumable: Boolean(isConsumable) });
  }),
  getAvailablePurchases: jest.fn(async () => [...fakeStore.owned]),
  restorePurchases: jest.fn(async () => {
    fakeStore.restores += 1;
  }),
};
