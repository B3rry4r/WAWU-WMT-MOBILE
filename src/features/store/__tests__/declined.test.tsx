/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import type { StoreItem } from '../model';
import { hub, installHub, type HubProduct } from '../testing/fakeHub';
import { fakeStore } from '../testing/fakeIap';
import { renderSignedIn, resetApp } from '../testing/screen';

/*
 * TIER-CARDS item 2: a payment the store refused is said as a refused payment, never as "the store is not available on this phone".
 * Google Play Billing's ERROR (response code 6) and SERVICE_UNAVAILABLE (2) both reach the app as the code `service-error`
 * (openiap-google 4.0.3 `OpenIapError.fromBillingResponseCode`, then expo-iap `ErrorCode.ServiceError`), and a payment Google declined for
 * insufficient funds carries the sub-response code `payment-declined-due-to-insufficient-funds`. The module is replaced at its own boundary.
 */
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

const OLD_WORDS = /not available on this phone/;
const GOOGLE = "Google Play didn't take the payment. You weren't charged. Check your payment method in Google Play, then try again.";
const APPLE = "The App Store didn't take the payment. You weren't charged. Check your payment method in the App Store, then try again.";
const TOKEN = '7d9f0c1e-2b3a-4c5d-8e6f-a1b2c3d4e5f6';

const tierProduct = (id: string, title: string): HubProduct => ({
  id: `store-${id}`,
  platform: 'android',
  storeProductId: `africa.wawu.tier.${id}`,
  kind: 'tier',
  title,
  subscription: true,
  grants: { points: null, credits: null, tierId: id, days: 365 },
});
const founding = tierProduct('founding', 'Founding Maker');
const item: StoreItem = { product: founding, price: '₦9,999.00', offerToken: 'offer-founding' };
const iapModule = () => require('../iap') as typeof import('../iap');

beforeEach(() => {
  mockVault.clear();
  fakeStore.reset();
  hub.reset();
  installHub();
  iapModule().resetIapForTests();
  jest.replaceProperty(Platform, 'OS', 'android');
  hub.products = [founding];
  fakeStore.products = [{ id: founding.storeProductId, displayPrice: '₦9,999.00', type: 'subs', offerToken: 'offer-founding' }];
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const tryBuy = async (next: typeof fakeStore.next) => {
  fakeStore.next = next;
  const { purchase } = require('../buy') as typeof import('../buy');
  const { said } = require('../words') as typeof import('../words');
  const result = await purchase(item, { platform: 'android', accountToken: TOKEN });
  return { result, line: said(result, 'android', true)?.line ?? null };
};

describe('a payment the store refused is a declined payment', () => {
  it('a Google Play ERROR while buying (service-error) says Google Play did not take the payment, and never "not available on this phone"', async () => {
    const { result, line } = await tryBuy({ kind: 'error', code: 'service-error' });
    expect(result).toEqual({ kind: 'declined' });
    expect(line).toBe(GOOGLE);
    expect(line).not.toMatch(OLD_WORDS);
  });

  it("Google's insufficient-funds sub-response code is declined whatever code it arrives with", async () => {
    for (const code of ['purchase-error', 'user-cancelled', 'unknown']) {
      fakeStore.reset();
      fakeStore.products = [{ id: founding.storeProductId, displayPrice: '₦9,999.00', type: 'subs', offerToken: 'offer-founding' }];
      const { result, line } = await tryBuy({ kind: 'error', code, sub: 'payment-declined-due-to-insufficient-funds' });
      expect(result).toEqual({ kind: 'declined' });
      expect(line).toBe(GOOGLE);
    }
  });

  it('the App Store is named on an iPhone, with a capital', () => {
    const { said } = require('../words') as typeof import('../words');
    expect(said({ kind: 'declined' }, 'ios', true)).toEqual({ tone: 'danger', line: APPLE });
    expect(said({ kind: 'declined' }, 'android', false)).toEqual({ tone: 'danger', line: GOOGLE });
  });

  it('a code that truly means no store on the phone still says so', async () => {
    for (const code of ['billing-unavailable', 'iap-not-available', 'service-disconnected', 'feature-not-supported', 'not-prepared', 'init-connection', 'connection-closed', 'activity-unavailable']) {
      const { result, line } = await tryBuy({ kind: 'error', code });
      expect({ code, kind: result.kind }).toEqual({ code, kind: 'store_unavailable' });
      expect(line).toMatch(OLD_WORDS);
    }
  });

  it('asking the store for prices keeps its old answer for service-error: the store could not be reached', async () => {
    const iap = iapModule();
    const { moduleMock } = require('@/features/store/testing/fakeIap') as typeof import('../testing/fakeIap');
    moduleMock.fetchProducts.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'service-error' }));
    await expect(iap.fetchPrices({ packs: [], subscriptions: [founding.storeProductId] })).rejects.toMatchObject({ storeCause: 'store_unavailable' });
  });
});

describe('the checkout says it', () => {
  it('a person whose payment Google declined sees the declined words on the checkout, and the old words nowhere', async () => {
    hub.routes['GET /plans'] = {
      currency: 'NGN',
      tiers: [{ id: 'founding', name: 'Founding Maker', days: 365, products: 10, bonusPoints: 600, bonusPointsExpireDays: 365, priceMinor: 2_500_000, eventPass: null, badge: { numbered: true }, packBonusPercent: 10, firstVoiceIntroIncluded: false, preselected: true }],
      extraProducts: { count: 5, priceMinor: 500_000 },
      checkoutBump: { points: 1000, priceMinor: 80_000 },
    };
    hub.routes['GET /me/tier'] = { state: 'none', tier: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null };
    fakeStore.next = { kind: 'error', code: 'service-error', sub: 'payment-declined-due-to-insufficient-funds' };
    const { CheckoutScreen } = require('@/features/verify/CheckoutScreen') as typeof import('@/features/verify/CheckoutScreen');
    await renderSignedIn(<CheckoutScreen kind="tier" tierId="founding" onBack={jest.fn()} onPaid={jest.fn()} />);
    await rtl.screen.findByTestId('checkout-pay');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('checkout-pay')));
    const said = await rtl.screen.findByTestId('checkout-said');
    expect(said).toHaveTextContent(`That didn't go through${GOOGLE}`);
    expect(rtl.screen.queryByText(OLD_WORDS)).toBeNull();
    expect(hub.bodies).toEqual([]);
  });
});
