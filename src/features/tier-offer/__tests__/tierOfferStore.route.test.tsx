/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';
import { Platform, Text, View } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';

/**
 * The tier offer in the store lineage (IAP-02 merged with main's TIER-OFFER, R-86, R-94): every tier price the offer shows is the STORE's, and
 * Subscribe opens the same store checkout the tiers sheet opens, whose Buy opens the store sheet and sends the purchase to the Hub. It is the
 * real root layout, offer route and checkout route; the Hub is a stand-in `fetch` and `expo-iap` is replaced at its own boundary. No wallet,
 * PIN or bank charge is drawn or asked for.
 */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);

const ADA = 'account-ada';
const tier = (id: string, name: string, priceMinor: number, products: number, preselected = false) => ({
  id,
  name,
  days: 365,
  products,
  bonusPoints: 0,
  bonusPointsExpireDays: 365,
  priceMinor,
  eventPass: { id: 'c', name: 'Maker Pass' },
  badge: { id, numbered: false },
  packBonusPercent: 0,
  firstVoiceIntroIncluded: false,
  preselected,
});
const plans = (currency = 'NGN') => ({
  currency,
  currencyFixed: false,
  extraProducts: { count: 5, priceMinor: 150000 },
  packs: [],
  checkoutBump: { points: 1000, priceMinor: 80000 },
  actions: [],
  caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 },
  tiers: [tier('verify', 'Verify', 299900, 3), tier('plus', 'Verify Plus', 599900, 6, true), tier('founding', 'Founding Maker', 999900, 10)],
});
const tierProduct = (id: string, title: string): HubProduct => ({
  id: `store-${id}`,
  platform: 'android',
  storeProductId: `africa.wawu.tier.${id}`,
  kind: 'tier',
  title,
  subscription: true,
  grants: { points: null, credits: null, tierId: id, days: 365 },
});
/** The store's own prices, in the person's own currency: never the Hub's naira figures above. */
const STORE_PRICES: Record<string, string> = { verify: '$2.99', plus: '$5.99', founding: '$9.99' };

// The API client keeps the first `fetch` it finds, so the stand-in Hub is installed before anything of the app is loaded.
installHub();

const RootLayout = require('@/app/_layout').default as typeof import('@/app/_layout').default;
const TabsLayout = require('@/app/(tabs)/_layout').default as typeof import('@/app/(tabs)/_layout').default;
const Home = require('@/app/(tabs)/index').default as typeof import('@/app/(tabs)/index').default;
const Explore = require('@/app/(tabs)/explore').default as typeof import('@/app/(tabs)/explore').default;
const Inbox = require('@/app/(tabs)/inbox').default as typeof import('@/app/(tabs)/inbox').default;
const Wallet = require('@/app/(tabs)/wallet').default as typeof import('@/app/(tabs)/wallet').default;
const Me = require('@/app/(tabs)/me').default as typeof import('@/app/(tabs)/me').default;
const TierOfferRoute = require('@/app/tier-offer').default as typeof import('@/app/tier-offer').default;
const CheckoutRoute = require('@/app/checkout').default as typeof import('@/app/checkout').default;
const WelcomeRoute = require('@/app/welcome').default as typeof import('@/app/welcome').default;
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { ACCESS_KEY, REFRESH_KEY } = require('@/api/tokenStore') as typeof import('@/api/tokenStore');
const { resetSignupGate } = require('@/features/auth/signupGate') as typeof import('@/features/auth/signupGate');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetTierOffer } = require('../offerStep') as typeof import('../offerStep');
const { resetIapForTests } = require('@/features/store/iap') as typeof import('@/features/store/iap');

const stub = (name: string) =>
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{`route ${name}`}</Text>
      </View>
    );
  };
const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'tier-offer': TierOfferRoute,
  checkout: CheckoutRoute,
  'tier-done': stub('tier-done'),
  tiers: stub('tiers'),
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;

/** The Hub: the offer asks, the plans, the store's catalog and its purchase check. The store sells all three tiers. */
function serve(currency = 'NGN') {
  hub.reset();
  fakeStore.reset();
  hub.products = [tierProduct('verify', 'Verify'), tierProduct('plus', 'Verify Plus'), tierProduct('founding', 'Founding Maker')];
  fakeStore.products = hub.products.map((p) => ({ id: p.storeProductId, displayPrice: STORE_PRICES[p.grants.tierId as string], type: 'subs' as const, offerToken: `offer-${p.grants.tierId}` }));
  hub.routes['GET /users/me'] = { wawuUserId: ADA, accountType: 'creator', firstName: 'Ada', lastName: 'Obi', handle: 'ada' };
  hub.routes['GET /plans'] = plans(currency);
  hub.routes['GET /me/tier-offer'] = { show: true, closeButton: true };
  hub.routes['POST /me/tier-offer/seen'] = { seenAt: '2026-10-27T10:00:00.000Z' };
  hub.routes['GET /me/tier'] = { state: 'none', tier: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null };
}

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  resetIapForTests();
  queryClient.clear();
  mockVault.clear();
  resetSessionForTests();
  resetTierOffer();
  resetSignupGate();
  mockVault.set(ACCESS_KEY, tokenFor(ADA));
  mockVault.set(REFRESH_KEY, 'stored-refresh');
});
afterEach(() => {
  jest.restoreAllMocks();
});

/** The wallet's checkout for a plan (R-86 removed it from this lineage): its quote, its purchase and its status read. */
const WALLET_CHECKOUT = /\/plans\/purchases/;

describe('the tier offer sells through the store (R-86, R-94)', () => {
  it('a person sees the store’s own price on each tier, taps Subscribe, reaches that tier’s store checkout, and Buy opens the store sheet and sends the purchase to the Hub', async () => {
    serve();
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-list')).toBeTruthy());

    // Every price on the offer is the store's, in the person's currency; the Hub's naira figures are not drawn.
    expect(screen.getByTestId('tier-price-verify').props.children).toBe(STORE_PRICES.verify);
    expect(screen.getByTestId('tier-price-plus').props.children).toBe(STORE_PRICES.plus);
    expect(screen.getByTestId('tier-price-founding').props.children).toBe(STORE_PRICES.founding);
    expect(screen.queryByText(/₦/)).toBeNull();

    await fireEvent.press(screen.getByTestId('tier-offer-subscribe-plus'));
    await waitFor(() => expect(screen.getByTestId('checkout-pay')).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-screen')).toBeNull();
    expect(screen.getByTestId('checkout-price').props.children).toBe(STORE_PRICES.plus);
    expect(screen.queryByText(/PIN|Bank charge|wallet|₦/i)).toBeNull();

    // Buy opens the store sheet for that tier's product, and the Hub is asked to check the purchase with the store.
    await fireEvent.press(screen.getByTestId('checkout-pay'));
    await waitFor(() => expect(fakeStore.requests).toHaveLength(1));
    expect(JSON.stringify(fakeStore.requests[0])).toContain('africa.wawu.tier.plus');
    await waitFor(() => expect(hub.bodies).toHaveLength(1));
    expect(hub.bodies[0]).toMatchObject({ productId: 'africa.wawu.tier.plus' });
    await waitFor(() => expect(screen.getByRole('header', { name: 'route tier-done' })).toBeTruthy());

    // The wallet checkout was never asked (no quote, no wallet purchase), and the only writes were marking the offer seen and the store purchase.
    expect(hub.reads.filter((read) => WALLET_CHECKOUT.test(read))).toEqual([]);
    expect(hub.reads.filter((read) => read.startsWith('POST ')).sort()).toEqual(['POST /me/tier-offer/seen', 'POST /store/purchases']);
  });

  it('a person billed in dollars is not turned away to the tiers sheet: Subscribe reaches the same store checkout, in the store’s currency', async () => {
    serve('USD');
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-subscribe-founding')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('tier-offer-subscribe-founding'));
    await waitFor(() => expect(screen.getByTestId('checkout-pay')).toBeTruthy());
    expect(screen.getByTestId('checkout-price').props.children).toBe(STORE_PRICES.founding);
    expect(screen.queryByRole('header', { name: 'route tiers' })).toBeNull();
  });

  it('the X still leaves the offer for good and Home opens, with the store ready', async () => {
    serve();
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-list')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-screen')).toBeNull();
    expect(hub.reads.filter((read) => read === 'POST /me/tier-offer/seen')).toHaveLength(1);
  });

  it('the store not open yet says so on the offer, with no Subscribe, and the way out stays', async () => {
    serve();
    hub.open = false;
    hub.reason = 'store_not_configured';
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByText('Buying is not open yet')).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-subscribe-plus')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByRole('header', { name: 'Home' })).toBeTruthy());
  });
});
