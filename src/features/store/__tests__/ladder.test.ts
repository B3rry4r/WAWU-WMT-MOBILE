/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

import { hub, installHub, type HubCredit, type HubProduct } from '../testing/fakeHub';
import { fakeStore, moduleMock } from '../testing/fakeIap';

/*
 * STORE-BUY-APP (R-101): a piece, a tip, a community pass and a paid question bought in Google Play or the App Store, on the price ladder
 * (`wawu.buy.<naira>`), from the intent to the grant. The native module (`expo-iap`) is replaced at its own boundary and the Hub is a
 * stand-in `fetch` that answers in the contract's shapes. What a person can do: pay the store and have the Hub give what the payment was
 * for, once; use a credit instead of the store; and, whatever stops a purchase, be told in the app's words. The store transaction is
 * finished only after the Hub's 201.
 */
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

const buyModule = () => require('../buy') as typeof import('../buy');
const iapModule = () => require('../iap') as typeof import('../iap');
const wordsModule = () => require('../words') as typeof import('../words');
const apiModule = () => require('../ladder/api') as typeof import('../ladder/api');
const memoryModule = () => require('../ladder/memory') as typeof import('../ladder/memory');

const TOKEN = '7d9f0c1e-2b3a-4c5d-8e6f-a1b2c3d4e5f6';
const PIECE = '11111111-1111-4111-8111-111111111111';
const CREATOR = '22222222-2222-4222-8222-222222222222';
const ROOM = '33333333-3333-4333-8333-333333333333';

const rung = (platform: 'android' | 'ios', naira: number): HubProduct => ({
  id: `buy-${platform}-${naira}`,
  platform,
  storeProductId: `wawu.buy.${naira}`,
  kind: 'buy',
  title: `Buy ${naira}`,
  subscription: false,
  grants: { points: null, credits: null, tierId: null, days: null },
  listPriceKobo: naira * 100,
  storePriceKobo: Math.ceil((naira * 1.2) / 10) * 10 * 100,
});
const ladder = (platform: 'android' | 'ios') => [100, 500, 1000, 2000, 5000].map((n) => rung(platform, n));
const question = (naira: number, text = 'How do I price my first course?') => ({ kind: 'question' as const, creatorWawuId: CREATOR, text, listPriceNaira: naira });
const SPECS = {
  content: { kind: 'content' as const, contentId: PIECE, listPriceNaira: 1000 },
  tip: { kind: 'tip' as const, creatorWawuId: CREATOR, listPriceNaira: 500 },
  pass: { kind: 'pass' as const, communityId: ROOM, listPriceNaira: 2000 },
  question: question(1000),
};
const credit = (id: string, naira: number, scope: HubCredit['scope'] = null): HubCredit => ({ id, amountKobo: naira * 100, scope, createdAt: '2026-10-27T00:00:00.000Z' });

let os: 'ios' | 'android' = 'ios';
beforeEach(() => {
  mockVault.clear();
  fakeStore.reset();
  hub.reset();
  installHub();
  hub.products = ladder(os);
  iapModule().resetIapForTests();
  jest.replaceProperty(Platform, 'OS', os);
});
afterEach(() => {
  jest.restoreAllMocks();
});

/** Puts the store sheet and the finish into the same log the Hub keeps, so the order of all four steps is one list. */
function orderLog(): string[] {
  const realBuy = moduleMock.requestPurchase.getMockImplementation();
  const realFinish = moduleMock.finishTransaction.getMockImplementation();
  moduleMock.requestPurchase.mockImplementationOnce(async (args: unknown) => {
    hub.reads.push('STORE SHEET');
    return (await realBuy?.(args)) ?? null;
  });
  moduleMock.finishTransaction.mockImplementationOnce(async (args: Parameters<typeof moduleMock.finishTransaction>[0]) => {
    hub.reads.push('FINISH');
    await realFinish?.(args);
  });
  return hub.reads;
}

describe.each([
  ['ios', 'appAccountToken'],
  ['android', 'obfuscatedAccountId'],
] as const)('buying on the %s store', (platform, tokenField) => {
  beforeAll(() => {
    os = platform;
  });

  it.each(Object.entries(SPECS))('%s: the intent first, then the store sheet, then the post, and the transaction is finished only after the 201', async (kind, spec) => {
    const reads = orderLog();
    const result = await buyModule().purchaseLadder(spec, { platform, accountToken: TOKEN });
    expect(reads.filter((r) => r !== 'GET /store/products')).toEqual(['POST /store/intents', 'STORE SHEET', 'POST /store/purchases', 'FINISH']);
    expect(result).toMatchObject({ kind: 'granted', finished: true, purchase: { status: 'granted', buyKind: kind, intentId: 'intent-1' } });
    // The intent says what the payment is for, at the list price the person was shown.
    expect(hub.intents).toEqual([{ platform, ...spec }]);
    // The store sheet opens for the ladder product of that price with the intent's account token, never the person's user id.
    const asked = JSON.stringify(fakeStore.requests[0]);
    expect(asked).toContain(`wawu.buy.${spec.listPriceNaira}`);
    expect(asked).toContain(`"${tokenField}":"${TOKEN}"`);
    // The Hub is given the store's receipt and the intent it was made for.
    expect(hub.bodies).toEqual([
      { platform, productId: `wawu.buy.${spec.listPriceNaira}`, ...(platform === 'ios' ? { transactionId: '1001' } : { purchaseToken: 'token-1' }), intentId: 'intent-1' },
    ]);
    expect(fakeStore.finished).toEqual([{ productId: `wawu.buy.${spec.listPriceNaira}`, isConsumable: true }]);
    // Kept against the transaction until the Hub had it, then let go.
    expect(await memoryModule().intentOf(TOKEN, platform === 'ios' ? '1001' : 'token-1')).toBeNull();
  });

  it('the store taking the payment and the Hub not answering leaves the transaction open and the intent kept; the next start posts it with that intent and finishes it', async () => {
    hub.answer = 'network';
    const first = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(first).toEqual({ kind: 'unreachable' });
    expect(fakeStore.finished).toEqual([]);
    const key = platform === 'ios' ? '1001' : 'token-1';
    expect(await memoryModule().intentOf(TOKEN, key)).toBe('intent-1');
    // The app is opened again: the store still lists the payment.
    fakeStore.owned = [{ id: 'tx-1', productId: 'wawu.buy.1000', purchaseState: 'purchased', purchaseToken: 'token-1', transactionId: '1001', isAcknowledgedAndroid: false }];
    hub.answer = 'ok';
    const found = await buyModule().recover(hub.products as never, { platform, all: false, accountToken: TOKEN });
    expect(found.granted).toHaveLength(1);
    expect(found.granted[0]).toMatchObject({ status: 'granted', buyKind: 'content', intentId: 'intent-1' });
    expect(hub.bodies.at(-1)).toMatchObject({ productId: 'wawu.buy.1000', intentId: 'intent-1' });
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.1000', isConsumable: true }]);
    expect(await memoryModule().intentOf(TOKEN, key)).toBeNull();
  });

  it('F2: the intent is kept BEFORE the store sheet opens, so a kill while the sheet is open restores into the goods, never a late-sale credit', async () => {
    let keptWhenTheSheetOpened: string | null = null;
    moduleMock.requestPurchase.mockImplementationOnce(async () => {
      // The store sheet is open and the app has not been given any transaction id yet.
      keptWhenTheSheetOpened = await memoryModule().intentOf(TOKEN, 'no-transaction-yet', 'wawu.buy.1000');
      throw Object.assign(new Error('the app was killed here'), { code: 'unknown-failure' });
    });
    const first = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(first.kind).toBe('failed');
    expect(keptWhenTheSheetOpened).toBe('intent-1');
    // The store had taken the payment: it lists it at the next start, a transaction the app never saw.
    fakeStore.owned = [{ id: 'tx-7', productId: 'wawu.buy.1000', purchaseState: 'purchased', purchaseToken: 'token-7', transactionId: '1007', isAcknowledgedAndroid: false }];
    const found = await buyModule().recover(hub.products as never, { platform, all: false, accountToken: TOKEN });
    expect(hub.bodies.at(-1)).toMatchObject({ productId: 'wawu.buy.1000', intentId: 'intent-1' });
    expect(found.granted[0]).toMatchObject({ status: 'granted', buyKind: 'content', intentId: 'intent-1' });
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.1000', isConsumable: true }]);
  });

  it('F2: cancelling the store sheet lets the kept intent go, so a later payment is never given an intent that was abandoned', async () => {
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(result.kind).toBe('cancelled');
    expect(await memoryModule().intentOf(TOKEN, 'no-transaction-yet', 'wawu.buy.1000')).toBeNull();
  });

  // The App Store lets a second consumable of the same product be bought while the first is not finished; Google Play refuses it itself (already-owned).
  const onIos = platform === 'ios' ? it : it.skip;
  onIos('F3: with an earlier payment for the same price still held, Buy opens no store sheet: it hands the earlier payment over with its own intent and finishes it', async () => {
    await memoryModule().bindIntent(TOKEN, '1500', 'intent-old');
    hub.made.set('intent-old', { platform, ...SPECS.content });
    fakeStore.owned = [{ id: 'tx-old', productId: 'wawu.buy.1000', purchaseState: 'purchased', purchaseToken: 'token-old', transactionId: '1500', isAcknowledgedAndroid: false }];
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(fakeStore.requests).toEqual([]);
    expect(result).toMatchObject({ kind: 'earlier_purchase', purchase: { intentId: 'intent-old' } });
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.1000', isConsumable: true }]);
  });

  onIos('F3: after "Do not buy again" (the store took the payment, the Hub did not answer) a second tap on Buy opens no second store sheet and keeps waiting', async () => {
    hub.answer = 'network';
    const first = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(first).toEqual({ kind: 'unreachable' });
    expect(fakeStore.requests).toHaveLength(1);
    // The store lists the payment it took; the Hub is still not answering.
    fakeStore.owned = [{ id: 'tx-1', productId: 'wawu.buy.1000', purchaseState: 'purchased', purchaseToken: null, transactionId: '1001', isAcknowledgedAndroid: false }];
    const second = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(fakeStore.requests).toHaveLength(1);
    expect(second).toEqual({ kind: 'unreachable' });
    expect(fakeStore.finished).toEqual([]);
  });

  it('a payment found with no intent kept (another phone, or long ago) is posted as it is and the Hub turns it into a credit: shown as a credit, the transaction finished', async () => {
    fakeStore.owned = [{ id: 'tx-9', productId: 'wawu.buy.500', purchaseState: 'purchased', purchaseToken: 'token-9', transactionId: '1009', isAcknowledgedAndroid: false }];
    const found = await buyModule().recover(hub.products as never, { platform, all: false, accountToken: TOKEN });
    expect(hub.bodies).toHaveLength(1);
    expect(hub.bodies[0]).not.toHaveProperty('intentId');
    expect(found.granted[0]).toMatchObject({ status: 'credited' });
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.500', isConsumable: true }]);
  });

  it('a late sale (the Hub could not give what it was for) is a credit, never a grant, and the transaction is finished because the Hub has the payment', async () => {
    hub.late = true;
    const result = await buyModule().purchaseLadder(SPECS.tip, { platform, accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'credited', purchase: { status: 'credited' } });
    expect(fakeStore.finished).toHaveLength(1);
    const line = wordsModule().said(result, platform, false);
    expect(line).toMatchObject({ tone: 'warning', line: 'This purchase could not be finished in time. You have a ₦500 credit to use on Who Made This.' });
    expect(JSON.stringify(line)).not.toMatch(/cash|refund|withdraw/i);
  });

  it('a credit that covers the price is spent with no store sheet at all: the intent says payWith credit, nothing is posted, nothing is finished', async () => {
    hub.credits = [credit('c1', 1000)];
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN, payWith: 'credit' });
    expect(result).toMatchObject({ kind: 'granted', purchase: { buyKind: 'content', paidWithCredit: 'c1' } });
    expect(hub.intents).toEqual([{ platform, ...SPECS.content, payWith: 'credit' }]);
    expect(fakeStore.requests).toEqual([]);
    expect(hub.bodies).toEqual([]);
    expect(fakeStore.finished).toEqual([]);
  });

  it('a question credit pays for a question at that price or less, and for nothing else: the Hub refuses it for a piece and the person is told to pay in the store', async () => {
    hub.credits = [credit('q1', 1000, 'question')];
    const refused = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN, payWith: 'credit' });
    expect(refused).toMatchObject({ kind: 'intent_refused', code: 'store_credit_insufficient' });
    expect(wordsModule().said(refused, platform, false)).toEqual({ tone: 'danger', line: 'That credit can not pay for this. Pay in the store instead.' });
    expect(fakeStore.requests).toEqual([]);
    expect(hub.credits).toHaveLength(1);
    // The same credit pays for a cheaper question.
    const asked = await buyModule().purchaseLadder(question(500), { platform, accountToken: TOKEN, payWith: 'credit' });
    expect(asked).toMatchObject({ kind: 'granted', purchase: { buyKind: 'question', paidWithCredit: 'q1' } });
    expect(hub.credits).toHaveLength(0);
  });

  it.each([
    ['price_not_on_list', 'That price is not on the list any more. Pick a price from the list and try again.'],
    ['store_intent_price_changed', 'The price changed. Check the new price, then try again. You were not charged.'],
    ['store_intent_target_not_found', 'This is not available any more. You were not charged.'],
    ['store_product_unknown', 'This price is not on sale in the store. You were not charged.'],
  ])('the Hub refusing the intent (%s) opens no store sheet, charges nothing and says why', async (code, line) => {
    hub.intent = code;
    hub.intentMessage = '';
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'intent_refused', code });
    expect(wordsModule().said(result, platform, false)).toEqual({ tone: 'danger', line });
    expect(fakeStore.requests).toEqual([]);
    expect(hub.bodies).toEqual([]);
  });

  it('the Hub’s own sentence leads when it names the cause (a creator who is not taking questions)', async () => {
    hub.intent = 'store_intent_not_payable';
    hub.intentMessage = 'Adaeze is not taking questions right now.';
    const result = await buyModule().purchaseLadder(SPECS.question, { platform, accountToken: TOKEN });
    expect(wordsModule().said(result, platform, false)).toEqual({ tone: 'danger', line: 'Adaeze is not taking questions right now.' });
    expect(fakeStore.requests).toEqual([]);
  });

  it('the Hub not reachable for the intent says nothing was charged and opens no store sheet', async () => {
    hub.intent = 'network';
    const result = await buyModule().purchaseLadder(SPECS.tip, { platform, accountToken: TOKEN });
    expect(result).toEqual({ kind: 'not_started' });
    expect(wordsModule().said(result, platform, false)?.line).toMatch(/not charged/);
    expect(fakeStore.requests).toEqual([]);
  });

  it('the Hub not open for the store yet is said as not open, before any store sheet', async () => {
    hub.intent = 'store_not_configured';
    const result = await buyModule().purchaseLadder(SPECS.tip, { platform, accountToken: TOKEN });
    expect(result).toEqual({ kind: 'not_open', why: 'not_configured' });
    expect(fakeStore.requests).toEqual([]);
  });

  it('cancelling in the store sheet finishes nothing and posts nothing', async () => {
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    expect(await buyModule().purchaseLadder(SPECS.pass, { platform, accountToken: TOKEN })).toEqual({ kind: 'cancelled' });
    expect(hub.bodies).toEqual([]);
    expect(fakeStore.finished).toEqual([]);
  });

  it('the Hub refusing the purchase after the store took the payment leaves the transaction open, with the intent kept for the next try', async () => {
    hub.answer = 'store_purchase_invalid';
    hub.message = 'The store does not know this payment.';
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'invalid', message: 'The store does not know this payment.' });
    expect(fakeStore.finished).toEqual([]);
    expect(await memoryModule().intentOf(TOKEN, platform === 'ios' ? '1001' : 'token-1')).toBe('intent-1');
  });

  it('an earlier payment for the same price still held by the store is handed over with its own intent and finished; nothing new is bought', async () => {
    const key = platform === 'ios' ? '1500' : 'token-old';
    await memoryModule().bindIntent(TOKEN, key, 'intent-old');
    hub.made.set('intent-old', { platform, ...SPECS.content });
    fakeStore.owned = [{ id: 'tx-old', productId: 'wawu.buy.1000', purchaseState: 'purchased', purchaseToken: 'token-old', transactionId: '1500', isAcknowledgedAndroid: false }];
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'earlier_purchase', purchase: { intentId: 'intent-old', buyKind: 'content' } });
    expect(fakeStore.finished).toEqual([{ productId: 'wawu.buy.1000', isConsumable: true }]);
    expect(wordsModule().said(result, platform, false)?.line).toMatch(/earlier/);
  });

  it('a recovery that runs while a purchase is being made leaves that payment to the purchase (it would be posted without its intent otherwise)', async () => {
    let during: Awaited<ReturnType<ReturnType<typeof buyModule>['recover']>> | null = null;
    const real = moduleMock.requestPurchase.getMockImplementation();
    moduleMock.requestPurchase.mockImplementationOnce(async (args: unknown) => {
      // The store has taken the payment and lists it; the app came back to the front and a recovery ran before the buy posted it.
      fakeStore.owned = [{ id: 'tx-1', productId: 'wawu.buy.1000', purchaseState: 'purchased', purchaseToken: 'token-1', transactionId: '1001', isAcknowledgedAndroid: false }];
      during = await buyModule().recover(hub.products as never, { platform, all: false, accountToken: TOKEN });
      return (await real?.(args)) ?? null;
    });
    const result = await buyModule().purchaseLadder(SPECS.content, { platform, accountToken: TOKEN });
    expect(during).toMatchObject({ granted: [], left: 0 });
    expect(result).toMatchObject({ kind: 'granted', purchase: { status: 'granted', intentId: 'intent-1' } });
    expect(hub.bodies).toHaveLength(1);
  });
});

describe('the credits a person holds', () => {
  it('a question credit is offered for a question at that price or less and never for a piece, a tip or a pass; an unscoped credit never for a question', () => {
    const { creditFor } = apiModule();
    const credits = [credit('q', 1000, 'question'), credit('u', 500)] as never;
    expect(creditFor(credits, 'question', 1000)?.id).toBe('q');
    expect(creditFor(credits, 'question', 500)?.id).toBe('q');
    expect(creditFor(credits, 'question', 2000)).toBeNull();
    for (const kind of ['content', 'tip', 'pass'] as const) {
      expect(creditFor(credits, kind, 500)?.id).toBe('u');
      expect(creditFor(credits, kind, 1000)).toBeNull();
    }
  });

  it('the smallest credit that covers the price is the one offered', () => {
    const { creditFor } = apiModule();
    expect(creditFor([credit('big', 5000), credit('small', 1000), credit('mid', 2000)] as never, 'content', 1000)?.id).toBe('small');
    expect(creditFor([], 'content', 100)).toBeNull();
    expect(creditFor(undefined, 'content', 100)).toBeNull();
  });
});

describe('the website and the web export keep the wallet', () => {
  it('with no store on the device nothing on the ladder is asked: no intent, no store sheet, and the store reads as unavailable', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    expect(iapModule().storeOs()).toBeNull();
    const result = await buyModule().purchaseLadder(SPECS.content, { platform: 'ios', accountToken: TOKEN }).catch(() => ({ kind: 'threw' }));
    // Nothing on the web calls this path (the screens check `native`); if it were called, no store sheet could open.
    expect(fakeStore.requests).toEqual([]);
    expect(result).not.toMatchObject({ kind: 'granted' });
  });
});
