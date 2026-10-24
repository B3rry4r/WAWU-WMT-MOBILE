/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * VF5, VF5b (the tiers sheet), VF6 (checkout) and VF7 (You're official), with a tier bought in the store sheet (IAP-02, R-86). A tier is a
 * subscription: the person pays the store at the store's price, the Hub checks it with the store and grants the tier, and the store renews
 * it until they cancel there. The Hub is a stand-in `fetch`; `expo-iap` is replaced at its own boundary. No wallet, PIN, bank charge,
 * difference quote or "pay only" is drawn.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);

const plan = (id: string, name: string, priceMinor: number, over: object = {}) => ({
  id,
  name,
  days: 365,
  products: id === 'verify' ? 3 : 10,
  bonusPoints: id === 'verify' ? 0 : 600,
  bonusPointsExpireDays: 365,
  priceMinor,
  eventPass: id === 'founding' ? { id: 'ep', name: 'Founders pass' } : null,
  badge: { numbered: id === 'founding' },
  packBonusPercent: 0,
  firstVoiceIntroIncluded: false,
  preselected: id === 'plus',
  ...over,
});
const PLANS = {
  currency: 'NGN',
  tiers: [plan('verify', 'Verify', 500_000), plan('plus', 'Verify Plus', 1_000_000), plan('founding', 'Founding Maker', 2_500_000)],
  extraProducts: { count: 5, priceMinor: 500_000 },
  checkoutBump: { points: 1000, priceMinor: 80_000 },
};
const tierProduct = (id: string, title: string): HubProduct => ({
  id: `store-${id}`,
  platform: 'android',
  storeProductId: `africa.wawu.tier.${id}`,
  kind: 'tier',
  title,
  subscription: true,
  grants: { points: null, credits: null, tierId: id, days: 365 },
});
const PRICES: Record<string, string> = { verify: '$9.99', plus: '$19.99', founding: '$49.99' };

function serve(me: object = { state: 'none', tier: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null }, available = true) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.open = available;
  hub.reason = available ? null : 'store_not_configured';
  hub.products = [tierProduct('verify', 'Verify'), tierProduct('plus', 'Verify Plus'), tierProduct('founding', 'Founding Maker')];
  fakeStore.products = hub.products.map((p) => ({ id: p.storeProductId, displayPrice: PRICES[p.grants.tierId as string], type: 'subs' as const, offerToken: `offer-${p.grants.tierId}` }));
  hub.routes['GET /plans'] = PLANS;
  hub.routes['GET /me/tier'] = me;
}
const running = (id: string, name: string) => ({ state: 'active', tier: { id, name, badge: null }, activeUntil: '2027-01-01T00:00:00.000Z', productsAllowed: 3, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null });

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

describe('VF5 · the tiers sheet', () => {
  const boot = async () => {
    const { TiersScreen } = require('../TiersScreen') as typeof import('../TiersScreen');
    const onContinue = jest.fn();
    await renderSignedIn(<TiersScreen onClose={jest.fn()} onContinue={onContinue} />);
    return onContinue;
  };

  it('a person sees each tier the Hub sells at the store’s own price, starts on the Hub’s preselected one, and continues with it', async () => {
    serve();
    const onContinue = await boot();
    expect(await rtl.screen.findByTestId('tiers-list')).toBeTruthy();
    expect(rtl.screen.getByTestId('tier-price-verify').props.children).toBe('$9.99');
    expect(rtl.screen.getByTestId('tier-price-plus').props.children).toBe('$19.99');
    expect(rtl.screen.getByTestId('tier-price-founding').props.children).toBe('$49.99');
    expect(rtl.screen.getByTestId('tier-plus').props.accessibilityState.checked).toBe(true);
    expect(rtl.screen.queryByText(/pay only|₦|wallet/i)).toBeNull();
    await tap('tier-founding');
    await tap('tiers-continue');
    expect(onContinue).toHaveBeenCalledWith('tier', 'founding');
  });

  it('a person on a running tier sees only the tiers above it, the store’s price for the step up, and no difference quote', async () => {
    serve(running('verify', 'Verify'));
    const onContinue = await boot();
    expect(await rtl.screen.findByTestId('tiers-list')).toBeTruthy();
    // Their own tier is marked and can not be chosen; the tiers above it can.
    expect(rtl.screen.getByText('Your tier')).toBeTruthy();
    expect(rtl.screen.getByTestId('tier-verify').props.accessibilityRole).toBe('text');
    expect(rtl.screen.getByTestId('tier-plus').props.accessibilityRole).toBe('radio');
    expect(rtl.screen.getByText(/The store works out what moving up costs/)).toBeTruthy();
    expect(rtl.screen.getByText('Upgrade to Verify Plus · $19.99')).toBeTruthy();
    await tap('tiers-continue');
    expect(onContinue).toHaveBeenCalledWith('upgrade', 'plus');
  });

  it('a tier the store does not list is not drawn', async () => {
    serve();
    fakeStore.products = fakeStore.products.filter((p) => !p.id.endsWith('founding'));
    await boot();
    await rtl.screen.findByTestId('tiers-list');
    expect(rtl.screen.queryByTestId('tier-founding')).toBeNull();
    expect(rtl.screen.getByTestId('tier-plus')).toBeTruthy();
  });

  it('the Hub not open for the store yet says buying is not open yet, with no Continue', async () => {
    serve(undefined, false);
    await boot();
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('tiers-continue')).toBeNull();
  });
});

describe('VF6 · checkout in the store sheet', () => {
  const boot = async (kind: 'tier' | 'renew' | 'upgrade' = 'tier', tierId = 'plus') => {
    const { CheckoutScreen } = require('../CheckoutScreen') as typeof import('../CheckoutScreen');
    const onPaid = jest.fn();
    await renderSignedIn(<CheckoutScreen kind={kind} tierId={tierId} onBack={jest.fn()} onPaid={onPaid} />);
    return onPaid;
  };

  it('a person sees the tier and the store’s price, and no payment method, bank charge, total, offer or PIN', async () => {
    serve();
    await boot();
    expect(await rtl.screen.findByTestId('checkout-summary')).toBeTruthy();
    expect(rtl.screen.getByTestId('checkout-price').props.children).toBe('$19.99');
    expect(rtl.screen.getByText('Buy · $19.99')).toBeTruthy();
    expect(rtl.screen.getByTestId('checkout-restore')).toBeTruthy();
    for (const gone of ['checkout-methods', 'checkout-total', 'checkout-bump', 'checkout-short', 'checkout-fees']) expect(rtl.screen.queryByTestId(gone)).toBeNull();
    expect(rtl.screen.queryByText(/wallet|Bank charge|Total|PIN/i)).toBeNull();
  });

  it('a person buys the tier: the Hub grants it from the Google Play token, the subscription is acknowledged, and VF7 opens for the tier', async () => {
    serve();
    const onPaid = await boot();
    await rtl.screen.findByTestId('checkout-pay');
    await tap('checkout-pay');
    await rtl.waitFor(() => expect(onPaid).toHaveBeenCalledWith('plus'));
    expect(hub.bodies).toEqual([{ platform: 'android', productId: 'africa.wawu.tier.plus', purchaseToken: 'token-1' }]);
    expect(fakeStore.finished).toEqual([{ productId: 'africa.wawu.tier.plus', isConsumable: false }]);
    expect(JSON.stringify(fakeStore.requests[0])).toContain('offer-plus');
    expect((fakeStore.requests[0] as { request: { google: { obfuscatedAccountId?: string } } }).request.google.obfuscatedAccountId).toBe(hub.accountToken);
  });

  it('an upgrade replaces the running tier in the store instead of adding another', async () => {
    serve(running('verify', 'Verify'));
    fakeStore.owned = [{ id: 'run', productId: 'africa.wawu.tier.verify', purchaseState: 'purchased', purchaseToken: 'old-token', isAcknowledgedAndroid: true }];
    const onPaid = await boot('upgrade', 'founding');
    await rtl.screen.findByTestId('checkout-pay');
    expect(rtl.screen.getByText('Upgrade · $49.99')).toBeTruthy();
    await tap('checkout-pay');
    await rtl.waitFor(() => expect(onPaid).toHaveBeenCalledWith('founding'));
    const asked = JSON.stringify(fakeStore.requests[0]);
    expect(asked).toContain('old-token');
    expect(asked).toContain('africa.wawu.tier.verify');
  });

  it('cancelled, pending and already-owned are each said by their cause, and nothing is granted', async () => {
    serve();
    const onPaid = await boot();
    await rtl.screen.findByTestId('checkout-pay');
    const press = () => tap('checkout-pay');
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    await press();
    expect(await rtl.screen.findByText('Cancelled. You were not charged.')).toBeTruthy();
    fakeStore.next = { kind: 'pending' };
    await press();
    expect(await rtl.screen.findByText(/waiting for the store to finish/)).toBeTruthy();
    fakeStore.next = { kind: 'error', code: 'already-owned' };
    await press();
    expect(await rtl.screen.findByText(/already have this on your store account\. Tap Restore purchases/)).toBeTruthy();
    expect(onPaid).not.toHaveBeenCalled();
    expect(hub.bodies).toEqual([]);
  });

  it('Restore purchases brings back a tier bought on this store account, and opens VF7 for it', async () => {
    serve();
    const onPaid = await boot();
    await rtl.screen.findByTestId('checkout-pay');
    fakeStore.owned = [{ id: 'run', productId: 'africa.wawu.tier.verify', purchaseState: 'purchased', purchaseToken: 'running', isAcknowledgedAndroid: true }];
    await tap('checkout-restore');
    await rtl.waitFor(() => expect(onPaid).toHaveBeenCalledWith('verify'));
    expect(fakeStore.restores).toBe(1);
  });

  it('the Hub not open for the store yet says buying is not open yet, with no Buy button', async () => {
    serve(undefined, false);
    await boot();
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('checkout-pay')).toBeNull();
  });
});

describe('VF7 · You’re official', () => {
  it('shows what the tier gives, from the plan, for the tier the Hub granted', async () => {
    serve();
    const { OfficialScreen } = require('../OfficialScreen') as typeof import('../OfficialScreen');
    await renderSignedIn(<OfficialScreen tierId="founding" onDone={jest.fn()} />);
    expect(await rtl.screen.findByTestId('official-title')).toBeTruthy();
    expect(rtl.screen.getByTestId('official-points')).toBeTruthy();
    expect(rtl.screen.getByTestId('official-products')).toBeTruthy();
    expect(rtl.screen.getByTestId('official-pass')).toBeTruthy();
  });
});
