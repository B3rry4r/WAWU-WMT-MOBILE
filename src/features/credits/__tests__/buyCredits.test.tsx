/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * Buy WAWU Credits (I28, I29) in the store sheet (IAP-02, R-86): credits are an in-app currency, so the packs are bought with Google Play
 * Billing or Apple In-App Purchase at the store's price, never from the wallet. The Hub is a stand-in `fetch`; `expo-iap` is replaced at its
 * own boundary.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);

const pack = (n: number, credits: number): HubProduct => ({
  id: `credits-${n}`,
  platform: 'android',
  storeProductId: `africa.wawu.credits.${credits}`,
  kind: 'credits',
  title: `${credits} credits`,
  subscription: false,
  grants: { points: null, credits, tierId: null, days: null },
});
const PACKS = [pack(1, 50), pack(2, 120), pack(3, 300)];
const PRICES = ['KSh 99', 'KSh 199', 'KSh 399'];

function serve(over: { available?: boolean; reason?: 'store_not_configured' | 'store_disabled' } = {}) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.products = PACKS;
  hub.open = over.available ?? true;
  hub.reason = over.reason ?? null;
  fakeStore.products = PACKS.map((p, i) => ({ id: p.storeProductId, displayPrice: PRICES[i], type: 'in-app' as const }));
  hub.routes['GET /credits'] = { userWawuId: 'me', creditBalance: 170, trialEndsAt: null };
}

async function boot(over: Parameters<typeof serve>[0] = {}) {
  serve(over);
  const { BuyCreditsSheet } = require('../BuyCreditsSheet') as typeof import('../BuyCreditsSheet');
  const props = { visible: true, onClose: jest.fn(), onAdded: jest.fn(), doneLabel: 'Back to chat' };
  await renderSignedIn(<BuyCreditsSheet {...props} />);
  return props;
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
});
const tap = (id: string) => rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId(id)));
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

describe('I28 · Buy WAWU Credits in the store sheet', () => {
  it('a person sees the Hub’s packs at the store’s own price, and no wallet, PIN, bank charge or naira', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('credits-packs')).toBeTruthy();
    expect(rtl.screen.getByTestId('credits-price-credits-1').props.children).toBe('KSh 99');
    expect(rtl.screen.getByTestId('credits-price-credits-3').props.children).toBe('KSh 399');
    expect(rtl.screen.getByText('Buy 120 credits · KSh 199')).toBeTruthy();
    for (const gone of ['credits-total', 'credits-short', 'credits-add']) expect(rtl.screen.queryByTestId(gone)).toBeNull();
    expect(rtl.screen.queryByText(/wallet|PIN|Bank charge|₦|Total/i)).toBeNull();
  });

  it('a person buys a pack: the Hub is given the Google Play token, grants it, and the pack is consumed after; I29 shows what they have', async () => {
    const props = await boot();
    await rtl.screen.findByTestId('credits-packs');
    await tap('credits-pack-credits-3');
    await tap('credits-buy');
    expect(await rtl.screen.findByTestId('credits-added-title')).toBeTruthy();
    expect(rtl.screen.getByTestId('credits-added-title').props.children).toBe('300 credits added');
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'africa.wawu.credits.300', purchaseToken: 'token-1' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.credits.300', isConsumable: true }]);
    expect(await rtl.screen.findByText('You have 170 credits.')).toBeTruthy();
    await tap('credits-added-done');
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onAdded).toHaveBeenCalled();
  });

  it('cancelled, pending, no connection to the store and a store that is unavailable are each said by their real cause', async () => {
    await boot();
    await rtl.screen.findByTestId('credits-packs');
    const press = () => tap('credits-buy');
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    await press();
    expect(await rtl.screen.findByText('Cancelled. You were not charged.')).toBeTruthy();
    fakeStore.next = { kind: 'pending' };
    await press();
    expect(await rtl.screen.findByText(/waiting for the store to finish/)).toBeTruthy();
    fakeStore.next = { kind: 'error', code: 'network-error' };
    await press();
    expect(await rtl.screen.findByText(/could not reach the store/)).toBeTruthy();
    fakeStore.next = { kind: 'error', code: 'billing-unavailable' };
    await press();
    expect(await rtl.screen.findByText(/Google Play is not available on this phone/)).toBeTruthy();
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('credits-added')).toBeNull();
  });

  it('a pack the store still holds from before is handed to the Hub and finished, and says so if it can not be', async () => {
    await boot();
    await rtl.screen.findByTestId('credits-packs');
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    await tap('credits-buy');
    expect(await rtl.screen.findByText(/still has an earlier purchase of this to finish/)).toBeTruthy();
  });

  it('the Hub not open for Google Play yet says plainly that buying is not open yet, and the sheet offers no Buy', async () => {
    await boot({ available: false, reason: 'store_not_configured' });
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('credits-buy')).toBeNull();
  });
});
