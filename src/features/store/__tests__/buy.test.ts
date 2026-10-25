/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

import type { StoreItem } from '../model';
import { hub, installHub, type HubProduct } from '../testing/fakeHub';
import { fakeStore } from '../testing/fakeIap';

/*
 * Buying through the store sheet (IAP-02, R-86), from tap to grant, with the native module (`expo-iap`) replaced at its own boundary and
 * the Hub as a stand-in `fetch`. What a person can do: pay the store for a pack or a subscription and have the Hub grant it once; and
 * whatever stops the buy (cancelled, pending, already owned, no connection, the store unavailable, the Hub not open) is named by its real
 * cause, with the store transaction left open unless the Hub answered 201.
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

const pack = (platform: 'android' | 'ios', over: Partial<HubProduct> = {}): HubProduct => ({
  id: `p-${platform}-1000`,
  platform,
  storeProductId: 'africa.wawu.points.1000',
  kind: 'points',
  title: '1,000 points',
  subscription: false,
  grants: { points: 1000, credits: null, tierId: null, days: null },
  ...over,
});
const tier = (platform: 'android' | 'ios'): HubProduct => ({
  id: `t-${platform}`,
  platform,
  storeProductId: 'africa.wawu.tier.verify',
  kind: 'tier',
  title: 'Verify',
  subscription: true,
  grants: { points: null, credits: null, tierId: 'verify', days: 365 },
});
const passProduct = (platform: 'android' | 'ios'): HubProduct => ({
  id: `pass-${platform}`,
  platform,
  storeProductId: 'africa.wawu.pass.month',
  kind: 'pass',
  title: 'Monthly pass',
  subscription: false,
  grants: { points: null, credits: null, tierId: null, days: 30 },
});
const itemOf = (product: HubProduct, offerToken: string | null = null): StoreItem => ({ product, price: '₦2,500.00', offerToken });
const ROOM = '3f2b1c9e-7a44-4d0e-9a55-0c6d9f1b2a77';
const TOKEN = '7d9f0c1e-2b3a-4c5d-8e6f-a1b2c3d4e5f6';
const USER_ID = 'user-me-0001';

let os: 'ios' | 'android' = 'ios';
beforeEach(() => {
  mockVault.clear();
  fakeStore.reset();
  hub.reset();
  installHub();
  iapModule().resetIapForTests();
  jest.replaceProperty(Platform, 'OS', os);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('a pack bought on the App Store', () => {
  beforeAll(() => {
    os = 'ios';
  });

  it('a person pays the store, the Hub checks and grants it, and only then is the transaction finished', async () => {
    const product = pack('ios');
    hub.products = [product];
    const order: string[] = [];
    const { moduleMock } = require('@/features/store/testing/fakeIap') as typeof import('../testing/fakeIap');
    moduleMock.finishTransaction.mockImplementationOnce(async () => {
      order.push(`finish after ${hub.bodies.length} hub call`);
    });
    const result = await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'granted', finished: true, purchase: { alreadyGranted: false, grant: { points: 1000 } } });
    // The App Store gets the transaction id, never a token; the Hub is asked once.
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: 'africa.wawu.points.1000', transactionId: '1001' }]);
    expect(order).toEqual(['finish after 1 hub call']);
    expect(JSON.stringify(fakeStore.requests[0])).toContain('africa.wawu.points.1000');
  });

  it('a pack is consumed so it can be bought again, and a failure to finish does not take the grant back', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.finishFails = true;
    const result = await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'granted', finished: false });
    fakeStore.finishFails = false;
    await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN });
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.points.1000', isConsumable: true }]);
  });

  it('cancelling in the store sheet sends nothing to the Hub and finishes nothing', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'cancelled' });
    expect(hub.bodies).toEqual([]);
    expect(fakeStore.finished).toEqual([]);
  });

  it('a payment the store has not finished is pending: nothing is sent and nothing is granted', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'pending' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'store_pending' });
    expect(hub.bodies).toEqual([]);
  });

  it('the store saying it can not be reached is "network", and a store that will not open is "unavailable", each by its own cause', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'network-error' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'network' });
    fakeStore.next = { kind: 'reject', code: 'item-unavailable' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'item_unavailable' });
    fakeStore.connectOk = false;
    iapModule().resetIapForTests();
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'store_unavailable' });
    expect(hub.bodies).toEqual([]);
  });

  it('"already owned" hands the earlier purchase to the Hub and finishes it; with nothing to hand over it says so', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'already_owned' });
    fakeStore.owned = [{ id: 'tx-old', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '777' }];
    const result = await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'granted', finished: true });
    expect(hub.bodies.at(-1)).toMatchObject({ transactionId: '777' });
  });
});

describe('what the Hub can answer, and what the store transaction does then', () => {
  beforeAll(() => {
    os = 'ios';
  });

  it.each([
    ['store_not_configured', { kind: 'not_open', why: 'not_configured' }],
    ['store_disabled', { kind: 'not_open', why: 'disabled' }],
    ['store_purchase_pending', { kind: 'store_pending' }],
    ['store_unreachable', { kind: 'unreachable' }],
    ['network', { kind: 'unreachable' }],
    ['server', { kind: 'unreachable' }],
    ['store_purchase_taken', { kind: 'taken' }],
    ['store_account_token_missing', { kind: 'update_app' }],
    ['store_grant_failed', { kind: 'grant_failed' }],
    ['store_product_unknown', { kind: 'unknown_product' }],
    ['store_purchase_invalid', { kind: 'invalid', message: 'The Hub said so.' }],
    ['store_pass_not_available', { kind: 'pass_unavailable', message: 'The Hub said so.' }],
  ])('%s leaves the store transaction open (nothing finished) and is named by its cause', async (answer, expected) => {
    const product = pack('ios');
    hub.products = [product];
    hub.answer = answer;
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual(expected);
    expect(fakeStore.finished).toEqual([]);
  });

  it('a payment taken while the Hub could not be reached is handed over the next time, once, and finished', async () => {
    const product = pack('ios');
    hub.products = [product];
    hub.answer = 'network';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'unreachable' });
    // The store still holds it (nothing was finished).
    fakeStore.owned = [{ id: 'tx-1', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '1001' }];
    hub.answer = 'ok';
    const found = await buyModule().recover([product], { platform: 'ios', all: false });
    expect(found.granted).toHaveLength(1);
    expect(found.granted[0].grant.points).toBe(1000);
    expect(fakeStore.finished).toEqual([{ productId: product.storeProductId, isConsumable: true }]);
    // The same transaction again is "already granted": nothing more is given.
    const again = await buyModule().recover([product], { platform: 'ios', all: false });
    expect(again.granted).toHaveLength(0);
    expect(again.already).toBe(1);
  });
});

describe('a subscription bought on Google Play', () => {
  beforeAll(() => {
    os = 'android';
  });

  it('a tier opens the sheet for the offer, sends the purchase token, and is acknowledged (not consumed) after the Hub grants it', async () => {
    const product = tier('android');
    hub.products = [product];
    fakeStore.next = { kind: 'buy', purchase: { purchaseToken: 'play-token-1', isAcknowledgedAndroid: false } };
    const result = await buyModule().purchase(itemOf(product, 'offer-abc'), { platform: 'android', accountToken: TOKEN });
    expect(result).toMatchObject({ kind: 'granted', purchase: { grant: { tierId: 'verify' } } });
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'africa.wawu.tier.verify', purchaseToken: 'play-token-1' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.tier.verify', isConsumable: false }]);
    const asked = JSON.stringify(fakeStore.requests[0]);
    expect(asked).toContain('offer-abc');
    expect(asked).toContain('"subs"');
  });

  it('an upgrade names the tier it replaces, so Google Play changes the subscription instead of adding another', async () => {
    const product = tier('android');
    hub.products = [product];
    await buyModule().purchase(itemOf(product, 'offer-abc'), { platform: 'android', accountToken: TOKEN, replace: { productId: 'africa.wawu.tier.old', purchaseToken: 'old-token' } });
    const asked = JSON.stringify(fakeStore.requests[0]);
    expect(asked).toContain('old-token');
    expect(asked).toContain('africa.wawu.tier.old');
    expect(asked).toContain('charge-prorated-price');
  });

  it('a pass carries its room to the Hub and to the store, so a payment taken but not delivered still knows its room', async () => {
    const product = passProduct('android');
    hub.products = [product];
    const result = await buyModule().purchase(itemOf(product, 'offer-pass'), { platform: 'android', accountToken: TOKEN, communityId: ROOM });
    expect(result).toMatchObject({ kind: 'granted', purchase: { grant: { communityId: ROOM } } });
    expect(hub.bodies[0]).toMatchObject({ communityId: ROOM });
    expect(JSON.stringify(fakeStore.requests[0])).toContain(ROOM);
  });

  it('recovery hands over a pass using the room the store kept with it, and leaves a pass with no room alone', async () => {
    const product = passProduct('android');
    hub.products = [product];
    fakeStore.owned = [{ id: 'a', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'tok-a', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: ROOM }];
    expect((await buyModule().recover([product], { platform: 'android', all: false })).granted).toHaveLength(1);
    expect(hub.bodies[0]).toMatchObject({ communityId: ROOM, purchaseToken: 'tok-a' });
    hub.bodies = [];
    fakeStore.owned = [{ id: 'b', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'tok-b', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: null }];
    expect((await buyModule().recover([product], { platform: 'android', all: false })).granted).toHaveLength(0);
    expect(hub.bodies).toEqual([]);
  });

  it('opening a screen hands over only what the store has not finished; Restore purchases hands over the running subscriptions too', async () => {
    const product = tier('android');
    hub.products = [product];
    fakeStore.owned = [{ id: 'run', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'running', isAcknowledgedAndroid: true }];
    expect((await buyModule().recover([product], { platform: 'android', all: false })).granted).toHaveLength(0);
    expect(hub.bodies).toEqual([]);
    const restored = await buyModule().recover([product], { platform: 'android', all: true });
    expect(restored.granted).toHaveLength(1);
    expect(hub.bodies).toEqual([{ platform: 'android', productId: product.storeProductId, purchaseToken: 'running' }]);
  });

  it('a store transaction of a product the Hub does not sell is left alone', async () => {
    const product = tier('android');
    hub.products = [product];
    fakeStore.owned = [{ id: 'x', productId: 'some.other.app.product', purchaseState: 'purchased', purchaseToken: 'x', isAcknowledgedAndroid: false }];
    expect(await buyModule().recover([product], { platform: 'android', all: true })).toMatchObject({ granted: [], left: 0 });
    expect(hub.bodies).toEqual([]);
  });
});

/** What the purchase call hands the store, as the module takes it. */
const asked = (n = 0) => fakeStore.requests[n] as { type: string; request: { apple: { sku: string; appAccountToken?: string }; google: { obfuscatedAccountId?: string; obfuscatedProfileId?: string } } };

describe('the account token binds every purchase to the person', () => {
  it('on the App Store the token is the app account token of a pack, a tier and a pass; never the user id', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    hub.products = [pack('ios'), tier('ios'), passProduct('ios')];
    for (const product of hub.products) await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM });
    expect(fakeStore.requests).toHaveLength(3);
    for (let i = 0; i < 3; i += 1) expect(asked(i).request.apple.appAccountToken).toBe(TOKEN);
    expect(JSON.stringify(fakeStore.requests)).not.toContain(USER_ID);
    // The room does not ride in the App Store's field: it holds the token.
    expect(JSON.stringify(asked(2).request.apple)).not.toContain(ROOM);
  });

  it('on Google Play the token is the obfuscated account id of a pack, a tier and a pass, and the room is the pass\'s profile id', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    hub.products = [pack('android'), tier('android'), passProduct('android')];
    for (const product of hub.products) await buyModule().purchase(itemOf(product, 'offer'), { platform: 'android', accountToken: TOKEN, communityId: ROOM });
    for (let i = 0; i < 3; i += 1) expect(asked(i).request.google.obfuscatedAccountId).toBe(TOKEN);
    expect(asked(0).request.google.obfuscatedProfileId).toBeUndefined();
    expect(asked(2).request.google.obfuscatedProfileId).toBe(ROOM);
    expect(JSON.stringify(fakeStore.requests)).not.toContain(USER_ID);
  });

  it('with no token from the Hub the app sends none (and never falls back to the user id)', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    hub.products = [pack('ios')];
    await buyModule().purchase(itemOf(pack('ios')), { platform: 'ios', accountToken: null });
    expect(asked().request.apple.appAccountToken).toBeUndefined();
    expect(asked().request.google.obfuscatedAccountId).toBeUndefined();
  });

  it('a pass bought on the App Store whose payment was taken before the Hub was told is finished with the room this phone kept, once', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = passProduct('ios');
    hub.products = [product];
    hub.answer = 'network';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM })).toEqual({ kind: 'unreachable' });
    fakeStore.owned = [{ id: 'tx-1', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '1001' }];
    hub.answer = 'ok';
    const found = await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN });
    expect(found.granted).toHaveLength(1);
    expect(hub.bodies.at(-1)).toMatchObject({ transactionId: '1001', communityId: ROOM });
    // Granted: what the phone kept is let go, so a running pass nobody is owed for is left alone from here on.
    hub.bodies = [];
    expect((await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).granted).toHaveLength(0);
    expect(hub.bodies).toEqual([]);
  });

  it('a tier bought on the App Store whose payment was taken before the Hub was told is finished by the next recovery; a running tier nobody is owed for is not sent', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = tier('ios');
    hub.products = [product];
    fakeStore.owned = [{ id: 'run', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '900' }];
    expect((await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).granted).toHaveLength(0);
    expect(hub.bodies).toEqual([]);
    hub.answer = 'network';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'unreachable' });
    hub.answer = 'ok';
    expect((await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).granted).toHaveLength(1);
  });

  it('"update the app" and "paid but not granted yet" leave the transaction open; the second is finished by the next recovery', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = pack('ios');
    hub.products = [product];
    hub.answer = 'store_account_token_missing';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'update_app' });
    hub.answer = 'store_grant_failed';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'grant_failed' });
    expect(fakeStore.finished).toEqual([]);
    fakeStore.owned = [{ id: 'tx-2', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '1002' }];
    hub.answer = 'ok';
    expect((await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).granted).toHaveLength(1);
    expect(fakeStore.finished).toEqual([{ productId: product.storeProductId, isConsumable: true }]);
  });
});

const ROOM_B = 'b1b1b1b1-2c2c-4d3d-8e4e-5f5f5f5f5f5f';
const roomIntent = () => require('../roomIntent') as typeof import('../roomIntent');

describe('a community pass is bought once, for one room (IAP-03 round 2)', () => {
  it('on Google Play the pass is an in-app product that carries its room, and is consumed once the Hub has it, so it can be bought again for another room', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const product = passProduct('android');
    hub.products = [product];
    const first = await buyModule().purchase(itemOf(product), { platform: 'android', accountToken: TOKEN, communityId: ROOM });
    const second = await buyModule().purchase(itemOf(product), { platform: 'android', accountToken: TOKEN, communityId: ROOM_B });
    expect(first).toMatchObject({ kind: 'granted', finished: true });
    expect(second).toMatchObject({ kind: 'granted', finished: true });
    expect(hub.bodies.map((b) => b.communityId)).toEqual([ROOM, ROOM_B]);
    expect(fakeStore.finished).toEqual([
      { productId: product.storeProductId, isConsumable: true },
      { productId: product.storeProductId, isConsumable: true },
    ]);
    expect(asked(0).type).toBe('in-app');
    expect(asked(1).request.google.obfuscatedProfileId).toBe(ROOM_B);
  });

  it('on the App Store the room is kept against the transaction the moment the store hands it back; a recovery finishes it with that room and lets it go', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = passProduct('ios');
    hub.products = [product];
    hub.answer = 'network';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM })).toEqual({ kind: 'unreachable' });
    expect(await roomIntent().roomOf(TOKEN, '1001')).toBe(ROOM);
    // What the person was buying is no longer the thing owed: the transaction is.
    expect(await roomIntent().pendingBuy(TOKEN, product.storeProductId)).toBeNull();
    fakeStore.owned = [{ id: 'tx-1', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '1001' }];
    hub.answer = 'ok';
    const found = await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN });
    expect(found.granted).toHaveLength(1);
    expect(hub.bodies.at(-1)).toMatchObject({ transactionId: '1001', communityId: ROOM });
    expect(fakeStore.finished).toEqual([{ productId: product.storeProductId, isConsumable: true }]);
    expect(await roomIntent().roomOf(TOKEN, '1001')).toBeNull();
  });

  it('a payment held for room A is never given to room B, though B is what the person was last buying (F2b)', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = passProduct('ios');
    hub.products = [product];
    hub.answer = 'network';
    await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM });
    // The person opens room B and taps Buy; a slow payment keeps what they were trying to buy.
    fakeStore.next = { kind: 'pending' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM_B })).toEqual({ kind: 'store_pending' });
    expect(await roomIntent().pendingBuy(TOKEN, product.storeProductId)).toEqual({ communityId: ROOM_B });
    hub.answer = 'ok';
    hub.bodies = [];
    fakeStore.owned = [{ id: 'tx-1', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '1001' }];
    await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN });
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: product.storeProductId, transactionId: '1001', communityId: ROOM }]);
  });

  it('a held pass nothing was kept for is placed by what the person was buying only when it is the single such payment', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = passProduct('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'pending' };
    await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM_B });
    const held = (id: string) => ({ id: `tx-${id}`, productId: product.storeProductId, purchaseState: 'purchased' as const, purchaseToken: 'jws', transactionId: id });
    // Two payments nothing was kept for: neither can be placed, so neither is sent.
    fakeStore.owned = [held('2001'), held('2002')];
    expect((await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).granted).toHaveLength(0);
    expect(hub.bodies).toEqual([]);
    // One such payment is the one that was being bought.
    fakeStore.owned = [held('2001')];
    expect((await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).granted).toHaveLength(1);
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: product.storeProductId, transactionId: '2001', communityId: ROOM_B }]);
    expect(await roomIntent().pendingBuy(TOKEN, product.storeProductId)).toBeNull();
  });

  it('cancelling the store sheet leaves nothing owed; a slow payment keeps what was being bought', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = passProduct('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM })).toEqual({ kind: 'cancelled' });
    expect(await roomIntent().pendingBuy(TOKEN, product.storeProductId)).toBeNull();
  });

  it('a held pass is handed over with its own room: another room’s is given to that room and says so; one with no room is not sent; the same room is the purchase', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const product = passProduct('android');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    fakeStore.owned = [{ id: 'h', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'held', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: ROOM_B }];
    const other = await buyModule().purchase(itemOf(product), { platform: 'android', accountToken: TOKEN, communityId: ROOM });
    expect(other).toMatchObject({ kind: 'earlier_room', purchase: { grant: { communityId: ROOM_B } } });
    expect(hub.bodies).toEqual([{ platform: 'android', productId: product.storeProductId, purchaseToken: 'held', communityId: ROOM_B }]);
    hub.bodies = [];
    fakeStore.owned = [{ id: 'h', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'held', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: null }];
    expect(await buyModule().purchase(itemOf(product), { platform: 'android', accountToken: TOKEN, communityId: ROOM })).toEqual({ kind: 'already_owned' });
    expect(hub.bodies).toEqual([]);
    fakeStore.owned = [{ id: 'h', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'held', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: ROOM }];
    expect(await buyModule().purchase(itemOf(product), { platform: 'android', accountToken: TOKEN, communityId: ROOM })).toMatchObject({ kind: 'granted', purchase: { grant: { communityId: ROOM } } });
  });

  it('the Hub saying a payment belongs to another room is "room_mismatch" for a buy and is left alone, not retried as unconfirmed, by a recovery', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const product = passProduct('android');
    hub.products = [product];
    hub.answer = 'store_purchase_other_room';
    expect(await buyModule().purchase(itemOf(product), { platform: 'android', accountToken: TOKEN, communityId: ROOM })).toEqual({ kind: 'room_mismatch' });
    expect(fakeStore.finished).toEqual([]);
    fakeStore.owned = [{ id: 'h', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'held', isAcknowledgedAndroid: false, obfuscatedProfileIdAndroid: ROOM }];
    expect(await buyModule().recover([product], { platform: 'android', all: false })).toMatchObject({ granted: [], left: 0 });
  });
});

describe('a pass payment the app never saw complete, while finished passes are still listed by the store (IAP-03 round 3, F-1, G-1)', () => {
  const held = (id: string, productId = 'africa.wawu.pass.month') => ({ id: `tx-${id}`, productId, purchaseState: 'purchased' as const, purchaseToken: 'jws', transactionId: id });
  const ios = (): HubProduct => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const product = passProduct('ios');
    hub.products = [product];
    return product;
  };
  /** Two passes bought through the app: the Hub has them and the app finished them. StoreKit lists a non-renewing pass for ever. */
  async function twoFinishedPasses(product: HubProduct) {
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM })).toMatchObject({ kind: 'granted', finished: true });
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM })).toMatchObject({ kind: 'granted', finished: true });
    hub.bodies = [];
  }

  it('F-1: one new payment the app never saw complete is placed with the room being bought and handed to the Hub, next to two finished passes', async () => {
    const product = ios();
    await twoFinishedPasses(product);
    // The app was closed while the sheet for room B was up: the entry for B is kept, the payment is taken, the transaction never came back inside the buy.
    await roomIntent().rememberBuy(TOKEN, product.storeProductId, ROOM_B);
    fakeStore.owned = [held('1001'), held('1002'), held('3001')];
    const found = await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN });
    expect(found).toMatchObject({ granted: [expect.anything()], already: 0, left: 0, unplaced: 0 });
    // Only the new one goes to the Hub, with its room; the two finished ones are not sent again.
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: product.storeProductId, transactionId: '3001', communityId: ROOM_B }]);
    expect(await roomIntent().pendingBuy(TOKEN, product.storeProductId)).toBeNull();
    // Restore purchases is the same code: the delivered one is not sent again.
    hub.bodies = [];
    expect(await buyModule().recover([product], { platform: 'ios', all: true, accountToken: TOKEN })).toMatchObject({ granted: [], unplaced: 0 });
    expect(hub.bodies).toEqual([]);
  });

  it('G-1: a finished pass still listed by the store is not sent again, opened again and again, and says nothing', async () => {
    const product = ios();
    await twoFinishedPasses(product);
    fakeStore.owned = [held('1001'), held('1002')];
    for (let open = 0; open < 5; open += 1) {
      expect(await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).toEqual({ granted: [], already: 0, left: 0, notOpen: false, unplaced: 0 });
    }
    expect(hub.bodies).toEqual([]);
    // Even with a stale entry for another room (a buy that never completed) and a single finished pass listed: it is not given to that room.
    await roomIntent().rememberBuy(TOKEN, product.storeProductId, ROOM_B);
    fakeStore.owned = [held('1001')];
    expect(await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).toEqual({ granted: [], already: 0, left: 0, notOpen: false, unplaced: 0 });
    expect(hub.bodies).toEqual([]);
  });

  it('G-1: when finishing fails on the phone the Hub is asked once per open, answers "already", and says nothing', async () => {
    const product = ios();
    fakeStore.finishFails = true;
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountToken: TOKEN, communityId: ROOM })).toMatchObject({ kind: 'granted', finished: false });
    fakeStore.finishFails = false;
    fakeStore.owned = [held('1001')];
    hub.bodies = [];
    const found = await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN });
    expect(found).toMatchObject({ granted: [], already: 1, left: 0, unplaced: 0 });
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: product.storeProductId, transactionId: '1001', communityId: ROOM }]);
    // Finished now: it is let go, and the next open sends nothing.
    hub.bodies = [];
    expect(await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).toMatchObject({ granted: [], already: 0, unplaced: 0 });
    expect(hub.bodies).toEqual([]);
  });

  it('two new payments nothing was kept for are not guessed: neither goes to the Hub, the person is told, and Restore purchases in a room places one there', async () => {
    const product = ios();
    await twoFinishedPasses(product);
    await roomIntent().rememberBuy(TOKEN, product.storeProductId, ROOM_B);
    fakeStore.owned = [held('1001'), held('1002'), held('3001'), held('3002')];
    const first = await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN });
    expect(first).toMatchObject({ granted: [], left: 0, unplaced: 2 });
    expect(hub.bodies).toEqual([]);
    // The person opens a room and taps Restore purchases: that room is theirs to name. One payment goes there; the other waits for its own room.
    const restored = await buyModule().recover([product], { platform: 'ios', all: true, accountToken: TOKEN, restoreRoom: ROOM });
    expect(restored).toMatchObject({ granted: [expect.anything()], unplaced: 1 });
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: product.storeProductId, transactionId: '3001', communityId: ROOM }]);
  });

  it('with no payment owed on this phone, listed passes it did not finish (bought on another device) are left alone and nothing is said', async () => {
    const product = ios();
    fakeStore.owned = [held('4001'), held('4002')];
    expect(await buyModule().recover([product], { platform: 'ios', all: false, accountToken: TOKEN })).toEqual({ granted: [], already: 0, left: 0, notOpen: false, unplaced: 0 });
    expect(hub.bodies).toEqual([]);
  });
});

describe('a phone with no store', () => {
  it('the web build says the store is unavailable and opens nothing', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    iapModule().resetIapForTests();
    expect(iapModule().storeOs()).toBeNull();
    expect(await buyModule().purchase(itemOf(pack('ios')), { platform: 'ios', accountToken: TOKEN })).toEqual({ kind: 'store_unavailable' });
    expect(hub.bodies).toEqual([]);
  });

  it('a build without the module reads as "the store is not available", not a crash', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    // A module that will not load (it is read when first needed). This runs last: the registry is reset, so the shared stand-in is not the one the other tests hold.
    jest.resetModules();
    jest.doMock('expo-iap', () => {
      throw new Error('Cannot find native module ExpoIap');
    });
    const fresh = require('../iap') as typeof import('../iap');
    expect(await fresh.connect()).toBe(false);
    expect(await fresh.buy({ storeProductId: 'x', subscription: false, offerToken: null, accountToken: null, communityId: null, replace: null })).toEqual({ ok: false, cause: 'store_unavailable' });
  });
});
