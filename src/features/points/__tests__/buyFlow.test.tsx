/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * Buy points (PT4, PT4c) bought in the store sheet (IAP-02, R-86). The Hub is a stand-in `fetch` for `GET /store/products` and
 * `POST /store/purchases`; the native store module (`expo-iap`) is replaced at its own boundary. A person sees the Hub's packs at the
 * STORE's price, buys one in the store sheet, and the points are added once the Hub has checked the purchase. No wallet, PIN, bank charge or
 * naira is drawn anywhere on the screen.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);

const product = (n: number, points: number): HubProduct => ({
  id: `pack-${n}`,
  platform: 'ios',
  storeProductId: `africa.wawu.points.${points}`,
  kind: 'points',
  title: `${points} points`,
  subscription: false,
  grants: { points, credits: null, tierId: null, days: null },
});
const PACKS = [product(1, 1000), product(2, 2750), product(3, 6000)];
const PRICES = ['$1.99', '$4.99', '$9.99'];

function serve(over: { available?: boolean; reason?: 'store_not_configured' | 'store_disabled' } = {}) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.products = PACKS;
  hub.open = over.available ?? true;
  hub.reason = over.reason ?? null;
  fakeStore.products = PACKS.map((p, i) => ({ id: p.storeProductId, displayPrice: PRICES[i], type: 'in-app' as const }));
  hub.routes['GET /plans'] = { currency: 'NGN', packs: [{ id: 'pack-1', points: 1000, priceMinor: 100_000 }], tiers: [{ id: 'founding', name: 'Founding Maker', packBonusPercent: 10 }], extraProducts: { count: 5, priceMinor: 500_000 }, checkoutBump: { points: 1000, priceMinor: 80_000 } };
  hub.routes['GET /me/tier'] = { state: 'none', tier: null, activeUntil: null };
  hub.routes['GET /me/points'] = { balance: 3750, nextExpiry: null, lots: [], movements: [] };
}

async function boot(over: Parameters<typeof serve>[0] = {}) {
  serve(over);
  const { BuyScreen } = require('../BuyScreen') as typeof import('../BuyScreen');
  const props = { onBack: jest.fn(), onDone: jest.fn(), doneLabel: 'Back to AI tools' };
  await renderSignedIn(<BuyScreen {...props} />);
  return props;
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

describe('PT4 · Buy points in the store sheet', () => {
  it('a person sees the Hub’s packs with the STORE’s own price, and no wallet, PIN, bank charge or naira', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('buy-packs')).toBeTruthy();
    expect(rtl.screen.getByTestId('pack-price-pack-1').props.children).toBe('$1.99');
    expect(rtl.screen.getByTestId('pack-price-pack-2').props.children).toBe('$4.99');
    expect(rtl.screen.getByTestId('pack-price-pack-3').props.children).toBe('$9.99');
    // The middle pack is where the screen starts, as the board draws it; the button names the store's price for it.
    expect(rtl.screen.getByTestId('pack-pack-2').props.accessibilityState.checked).toBe(true);
    expect(rtl.screen.getByText('Buy · $4.99')).toBeTruthy();
    for (const gone of ['buy-methods', 'buy-method-wallet', 'buy-method-transfer', 'buy-fees', 'buy-short']) expect(rtl.screen.queryByTestId(gone)).toBeNull();
    expect(rtl.screen.queryByText(/wallet|PIN|Bank charge|₦/i)).toBeNull();
  });

  it('choosing another pack changes the button to that pack’s store price', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pack-pack-3')));
    expect(await rtl.screen.findByText('Buy · $9.99')).toBeTruthy();
  });

  it('a person buys a pack: the store sheet opens for it, the Hub grants it once, and "points added" shows the Hub’s count', async () => {
    const props = await boot();
    await rtl.screen.findByTestId('buy-packs');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByTestId('buy-added-title')).toBeTruthy();
    expect(rtl.screen.getByTestId('buy-added-title').props.children).toBe('2,750 points added');
    expect(hub.bodies).toEqual([{ platform: 'ios', productId: 'africa.wawu.points.2750', transactionId: '1001' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.points.2750', isConsumable: true }]);
    // The store binds the purchase to the person with the Hub's account token, not the user id.
    expect(JSON.stringify(fakeStore.requests[0])).toContain(hub.accountToken);
    expect(JSON.stringify(fakeStore.requests[0])).not.toContain('"me"');
    expect(await rtl.screen.findByTestId('buy-added-balance')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-done')));
    expect(props.onDone).toHaveBeenCalledTimes(1);
    expect(rtl.screen.getByText('Back to AI tools')).toBeTruthy();
  });

  it('cancelling in the store sheet says so, charges nothing and sends nothing to the Hub', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByText('Cancelled. You were not charged.')).toBeTruthy();
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('buy-added')).toBeNull();
  });

  it('a payment the store has not finished says it is pending and adds nothing', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    fakeStore.next = { kind: 'pending' };
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByText(/waiting for the store to finish/)).toBeTruthy();
    expect(hub.bodies).toEqual([]);
  });

  it('the store taking the payment while the Hub can not be reached says so, finishes nothing, and does not offer to pay again', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    hub.answer = 'network';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByText(/still confirming it\. Do not buy again/)).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
    expect(rtl.screen.queryByTestId('buy-added')).toBeNull();
  });

  it('a purchase the store took earlier and the Hub never got is finished when the screen opens, and the points are added', async () => {
    serve();
    fakeStore.owned = [{ id: 'old', productId: 'africa.wawu.points.1000', purchaseState: 'purchased', purchaseToken: 'jws', transactionId: '555' }];
    const { BuyScreen } = require('../BuyScreen') as typeof import('../BuyScreen');
    await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={jest.fn()} />);
    await rtl.screen.findByTestId('buy-packs');
    await rtl.waitFor(() => expect(hub.bodies).toEqual([{ platform: 'ios', productId: 'africa.wawu.points.1000', transactionId: '555' }]));
    await rtl.waitFor(() => expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.points.1000', isConsumable: true }]));
  });

  it('a tier’s bonus still shows on every pack as its chip', async () => {
    serve();
    hub.routes['GET /me/tier'] = { state: 'active', tier: { id: 'founding', name: 'Founding Maker' }, activeUntil: '2027-01-01T00:00:00.000Z' };
    const { BuyScreen } = require('../BuyScreen') as typeof import('../BuyScreen');
    await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={jest.fn()} />);
    await rtl.screen.findByTestId('buy-packs');
    expect((await rtl.screen.findAllByText('Founding +10%')).length).toBe(3);
  });
});

describe('PT4 · the Hub’s newer answers, by cause', () => {
  it('"update the app" says so plainly, and nothing is finished', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    hub.answer = 'store_account_token_missing';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByText('This version of the app can not take this purchase. Update the app, then try again.')).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
  });

  it('a payment the store has and the Hub could not finish adding yet says so, stays open, and is finished when the screen opens again', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    hub.answer = 'store_grant_failed';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByText(/we could not finish adding it yet/)).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
    expect(rtl.screen.queryByTestId('buy-added')).toBeNull();
  });

  it('another person already holding the purchase is said by that cause', async () => {
    await boot();
    await rtl.screen.findByTestId('buy-packs');
    hub.answer = 'store_purchase_taken';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('buy-pay')));
    expect(await rtl.screen.findByText(/Another WAWU account already uses this store purchase or subscription/)).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
  });
});

describe('PT4 · when buying can not happen', () => {
  it('the Hub not open for the store yet says plainly that buying is not open yet', async () => {
    await boot({ available: false, reason: 'store_not_configured' });
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('buy-pay')).toBeNull();
    expect(rtl.screen.queryByTestId('buy-packs')).toBeNull();
  });

  it('a store an admin has paused says buying is paused', async () => {
    await boot({ available: false, reason: 'store_disabled' });
    expect(await rtl.screen.findByText('Buying is paused for now. Please check back soon.')).toBeTruthy();
  });

  it('a store that will not open on this phone says so and offers Try again', async () => {
    serve();
    fakeStore.connectOk = false;
    const { BuyScreen } = require('../BuyScreen') as typeof import('../BuyScreen');
    await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={jest.fn()} />);
    expect(await rtl.screen.findByText('The store is not available')).toBeTruthy();
    expect(rtl.screen.getByText('Try again')).toBeTruthy();
  });

  it('a pack the store does not list is not drawn', async () => {
    serve();
    fakeStore.products = fakeStore.products.slice(0, 2);
    const { BuyScreen } = require('../BuyScreen') as typeof import('../BuyScreen');
    await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={jest.fn()} />);
    await rtl.screen.findByTestId('buy-packs');
    expect(rtl.screen.queryByTestId('pack-pack-3')).toBeNull();
  });
});
