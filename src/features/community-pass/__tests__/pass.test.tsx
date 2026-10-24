/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * I30 and I31 · A private community's pass, bought in the store sheet (IAP-02, R-86). The Hub is a stand-in `fetch` (the room, the pass and
 * the two store routes); `expo-iap` is replaced at its own boundary. A pass is a subscription: the person pays the store at the store's
 * price, the Hub checks it with the store and lets them in, and the store renews it until they cancel there. Restore purchases is on the screen.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }), usePathname: () => '/' }));

const ID = 'c0000000-0000-4000-8000-000000000001';
const PASS: HubProduct = {
  id: 'pass-month',
  platform: 'android',
  storeProductId: 'africa.wawu.pass.month',
  kind: 'pass',
  title: 'Monthly pass',
  subscription: true,
  grants: { points: null, credits: null, tierId: null, days: 30 },
};
const newMember = { communityId: ID, sellsPass: true, priceKobo: 200_000, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: true, isHost: false };

function serve(pass: Record<string, unknown> = newMember, over: { available?: boolean; reason?: 'store_not_configured' | 'store_disabled' } = {}) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.products = [PASS];
  hub.open = over.available ?? true;
  hub.reason = over.reason ?? null;
  fakeStore.products = [{ id: PASS.storeProductId, displayPrice: '$3.99', type: 'subs', offerToken: 'offer-month' }];
  hub.routes[`GET /communities/${ID}/room`] = { id: ID, name: 'Founders under 30', kind: 'private', imageUrl: null, description: 'A room', hostWawuId: 'host1', memberCount: 640, messagesToday: 0, slug: 'founders', link: 'wawu/c/founders', role: 'none', messageCostInCredits: 1 };
  hub.routes['GET /users/host1/public-profile'] = { handle: 'adaeze' };
  hub.routes[`GET /communities/${ID}/pass`] = pass;
}

async function boot(pass?: Record<string, unknown>, over?: Parameters<typeof serve>[1]) {
  serve(pass, over);
  const { PassScreen } = require('../PassScreen') as typeof import('../PassScreen');
  await renderSignedIn(<PassScreen id={ID} onBack={jest.fn()} />);
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

describe('I30 · Private, pay to join, in the store sheet', () => {
  it('a person sees the pass at the store’s own price, with Restore purchases, and no wallet, PIN, bank charge or naira', async () => {
    await boot();
    expect(await rtl.screen.findByTestId('pass-price')).toBeTruthy();
    expect(rtl.screen.getByText('$3.99 a month')).toBeTruthy();
    expect(rtl.screen.getByText('Join · $3.99')).toBeTruthy();
    expect(rtl.screen.getByTestId('pass-restore')).toBeTruthy();
    for (const gone of ['pass-breakdown', 'pass-total', 'pass-short', 'pass-no-wallet', 'pass-add']) expect(rtl.screen.queryByTestId(gone)).toBeNull();
    expect(rtl.screen.queryByText(/wallet|PIN|Bank charge|₦/i)).toBeNull();
  });

  it('a person joins: the store sheet opens for the pass with the room, the Hub lets them in, and I31 says when it runs to', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByTestId('pass-joined-title')).toBeTruthy();
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'africa.wawu.pass.month', purchaseToken: 'token-1', communityId: ID }]);
    // A subscription is acknowledged, never consumed.
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.pass.month', isConsumable: false }]);
    expect(JSON.stringify(fakeStore.requests[0])).toContain('offer-month');
    expect((fakeStore.requests[0] as { request: { google: { obfuscatedAccountId?: string; obfuscatedProfileId?: string } } }).request.google).toMatchObject({ obfuscatedAccountId: hub.accountToken, obfuscatedProfileId: ID });
    expect(rtl.screen.getByTestId('pass-joined-line').props.children).toMatch(/runs to 1 December/);
  });

  it('the Hub refusing the room (removed, or the host’s own) says why in the Hub’s words and the store transaction stays open', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    hub.answer = 'store_pass_not_available';
    hub.message = 'You host this room, so you do not need a pass.';
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText('You host this room, so you do not need a pass.')).toBeTruthy();
    expect(fakeStore.finished).toEqual([]);
  });

  it('cancelling or a pending payment in the store sheet is said by its cause and joins nobody', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText('Cancelled. You were not charged.')).toBeTruthy();
    fakeStore.next = { kind: 'pending' };
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-pay')));
    expect(await rtl.screen.findByText(/waiting for the store to finish/)).toBeTruthy();
    expect(hub.bodies).toEqual([]);
    expect(rtl.screen.queryByTestId('pass-joined-title')).toBeNull();
  });

  it('a pass the store holds for this account is brought back by Restore purchases, and says how many', async () => {
    await boot();
    await rtl.screen.findByTestId('pass-pay');
    fakeStore.owned = [{ id: 'run', productId: PASS.storeProductId, purchaseState: 'purchased', purchaseToken: 'running', isAcknowledgedAndroid: true, obfuscatedProfileIdAndroid: ID }];
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pass-restore')));
    expect(await rtl.screen.findByText('Restored 1 purchase.')).toBeTruthy();
    expect(fakeStore.restores).toBe(1);
    expect(hub.bodies).toEqual([{ platform: 'android', productId: PASS.storeProductId, purchaseToken: 'running', communityId: ID }]);
  });

  it('a member sees "You’re in" with the end day, that the store renews it, and no pay button', async () => {
    await boot({ ...newMember, active: true, canRenew: true, passUntil: '2026-11-16T12:00:00.000Z' });
    expect(await rtl.screen.findByTestId('pass-joined-title')).toBeTruthy();
    expect(rtl.screen.getByTestId('pass-joined-line').props.children).toMatch(/runs to 16 November.*renews it until you cancel there/);
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
    expect(rtl.screen.getByTestId('pass-restore')).toBeTruthy();
  });

  it('a member the host removed sees "Removed by the host" and no way to buy', async () => {
    await boot({ ...newMember, active: true, canBuy: false, canRenew: false, passUntil: '2026-11-16T12:00:00.000Z' });
    expect(await rtl.screen.findByTestId('pass-blocked')).toBeTruthy();
    expect(rtl.screen.getByText('The host has removed you from this room. Ask the host to let you back in.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
  });

  it('a removed member who still holds the store subscription is told to cancel it in the store', async () => {
    await boot({ ...newMember, active: true, canBuy: false, canRenew: false, passUntil: '2026-11-16T12:00:00.000Z', cancelInStore: true });
    expect(await rtl.screen.findByTestId('pass-cancel-in-store')).toBeTruthy();
    expect(rtl.screen.getByText(/keeps billing you until you cancel it there/)).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
  });

  it('a removed member with no store subscription is not told to cancel anything', async () => {
    await boot({ ...newMember, active: true, canBuy: false, canRenew: false, passUntil: '2026-11-16T12:00:00.000Z', cancelInStore: false });
    expect(await rtl.screen.findByTestId('pass-blocked')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-cancel-in-store')).toBeNull();
  });

  it('the Hub not open for Google Play yet says plainly that buying is not open yet', async () => {
    await boot(undefined, { available: false, reason: 'store_not_configured' });
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
  });
});
