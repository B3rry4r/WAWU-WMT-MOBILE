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
  subscription: true,
  grants: { points: null, credits: null, tierId: null, days: 30 },
});
const itemOf = (product: HubProduct, offerToken: string | null = null): StoreItem => ({ product, price: '₦2,500.00', offerToken });
const ROOM = '3f2b1c9e-7a44-4d0e-9a55-0c6d9f1b2a77';

let os: 'ios' | 'android' = 'ios';
beforeEach(() => {
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
    const result = await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' });
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
    const result = await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' });
    expect(result).toMatchObject({ kind: 'granted', finished: false });
    fakeStore.finishFails = false;
    await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' });
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.points.1000', isConsumable: true }]);
  });

  it('cancelling in the store sheet sends nothing to the Hub and finishes nothing', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'cancelled' });
    expect(hub.bodies).toEqual([]);
    expect(fakeStore.finished).toEqual([]);
  });

  it('a payment the store has not finished is pending: nothing is sent and nothing is granted', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'pending' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'store_pending' });
    expect(hub.bodies).toEqual([]);
  });

  it('the store saying it can not be reached is "network", and a store that will not open is "unavailable", each by its own cause', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'network-error' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'network' });
    fakeStore.next = { kind: 'reject', code: 'item-unavailable' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'item_unavailable' });
    fakeStore.connectOk = false;
    iapModule().resetIapForTests();
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'store_unavailable' });
    expect(hub.bodies).toEqual([]);
  });

  it('"already owned" hands the earlier purchase to the Hub and finishes it; with nothing to hand over it says so', async () => {
    const product = pack('ios');
    hub.products = [product];
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'already_owned' });
    fakeStore.owned = [{ id: 'tx-old', productId: product.storeProductId, purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '777' }];
    const result = await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' });
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
    ['store_product_unknown', { kind: 'unknown_product' }],
    ['store_purchase_invalid', { kind: 'invalid', message: 'The Hub said so.' }],
    ['store_pass_not_available', { kind: 'pass_unavailable', message: 'The Hub said so.' }],
  ])('%s leaves the store transaction open (nothing finished) and is named by its cause', async (answer, expected) => {
    const product = pack('ios');
    hub.products = [product];
    hub.answer = answer;
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual(expected);
    expect(fakeStore.finished).toEqual([]);
  });

  it('a payment taken while the Hub could not be reached is handed over the next time, once, and finished', async () => {
    const product = pack('ios');
    hub.products = [product];
    hub.answer = 'network';
    expect(await buyModule().purchase(itemOf(product), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'unreachable' });
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
    const result = await buyModule().purchase(itemOf(product, 'offer-abc'), { platform: 'android', accountId: 'me' });
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
    await buyModule().purchase(itemOf(product, 'offer-abc'), { platform: 'android', accountId: 'me', replace: { productId: 'africa.wawu.tier.old', purchaseToken: 'old-token' } });
    const asked = JSON.stringify(fakeStore.requests[0]);
    expect(asked).toContain('old-token');
    expect(asked).toContain('africa.wawu.tier.old');
    expect(asked).toContain('charge-prorated-price');
  });

  it('a pass carries its room to the Hub and to the store, so a payment taken but not delivered still knows its room', async () => {
    const product = passProduct('android');
    hub.products = [product];
    const result = await buyModule().purchase(itemOf(product, 'offer-pass'), { platform: 'android', accountId: 'me', communityId: ROOM });
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

describe('a phone with no store', () => {
  it('the web build says the store is unavailable and opens nothing', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    iapModule().resetIapForTests();
    expect(iapModule().storeOs()).toBeNull();
    expect(await buyModule().purchase(itemOf(pack('ios')), { platform: 'ios', accountId: 'me' })).toEqual({ kind: 'store_unavailable' });
    expect(hub.bodies).toEqual([]);
  });

  it('a build without the module reads as "the store is not available", not a crash', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.resetModules();
    jest.doMock('expo-iap', () => {
      throw new Error('Cannot find native module ExpoIap');
    });
    const fresh = require('../iap') as typeof import('../iap');
    expect(await fresh.connect()).toBe(false);
    expect(await fresh.buy({ storeProductId: 'x', subscription: false, offerToken: null, accountId: null, communityId: null, replace: null })).toEqual({ ok: false, cause: 'store_unavailable' });
    jest.dontMock('expo-iap');
  });
});
