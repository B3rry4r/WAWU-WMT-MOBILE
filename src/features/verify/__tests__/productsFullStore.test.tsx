/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { hub, installHub, type HubProduct } from '@/features/store/testing/fakeHub';
import { fakeStore } from '@/features/store/testing/fakeIap';
import { renderSignedIn, resetApp } from '@/features/store/testing/screen';

/*
 * VF13 · all products used, with "Add 5 more products" bought in the store sheet (IAP-03, R-65, R-86; G-IAP-02-1), and the store's own price
 * on the three screens that used to draw the Hub's plan price (G-IAP-02-5: M16 "Get your tick", VF14 Renew, E21 "From"). The Hub is a stand-in
 * `fetch`; `expo-iap` is replaced at its own boundary. No wallet, PIN, quote, Bank charge or naira is drawn.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
jest.mock('expo-iap', () => require('@/features/store/testing/fakeIap').moduleMock);

const tier = (id: string, name: string, priceMinor: number, products = 3) => ({ id, name, days: 365, products, bonusPoints: 0, bonusPointsExpireDays: 365, priceMinor, eventPass: null, badge: { numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: false, preselected: false });
const PLANS = { currency: 'NGN', tiers: [tier('verify', 'Verify', 100_000), tier('plus', 'Verify Plus', 300_000, 10)], extraProducts: { count: 5, priceMinor: 150_000 }, checkoutBump: { points: 1000, priceMinor: 80_000 } };
/** The Hub's quote of the pack (`GET /plans/purchases/quote?kind=extra_products`): 200 when the pack is on offer to the person (R-100). */
const QUOTE_OK = { kind: 'extra_products', currency: 'NGN', extraMinor: 150_000, products: 5, productsAllowed: 3, productsAllowedAfter: 8, paymentKind: 'extra_products', payment: { kind: 'extra_products', targetId: 'extra', title: '5 more products', payee: null, priceKobo: 150_000, fee: { providerFeeKobo: 2500, wawuFeeKobo: 0, totalFeeKobo: 2500 }, totalKobo: 152_500, balanceKobo: 48_525_075, shortfallKobo: 0, willBeHeld: false, withinDailyLimit: true, remainingTodayKobo: null, quoteToken: 'tok-extra', expiresAt: '2099-01-01T00:00:00.000Z' } };
const PACK_SKU = 'africa.wawu.more.5';
const pack: HubProduct = { id: 'store-more', platform: 'android', storeProductId: PACK_SKU, kind: 'extra_products', title: 'Add 5 more products', subscription: false, grants: { points: null, credits: null, tierId: null, days: null, extraProducts: 5 } };
const tierProduct = (id: string): HubProduct => ({ id: `store-${id}`, platform: 'android', storeProductId: `africa.wawu.tier.${id}`, kind: 'tier', title: id, subscription: true, grants: { points: null, credits: null, tierId: id, days: 365 } });
const meTier = (allowed: () => number) => {
  const me = { state: 'active', tier: { id: 'verify', name: 'Verify', badge: null }, activeUntil: '2027-01-01T00:00:00.000Z', productsUsed: 3, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null };
  return Object.defineProperty(me, 'productsAllowed', { enumerable: true, get: allowed });
};

function serve({ products = [pack], prices = { [PACK_SKU]: '$4.99' } as Record<string, string>, available = true } = {}) {
  hub.reset();
  fakeStore.reset();
  installHub();
  hub.open = available;
  hub.reason = available ? null : 'store_not_configured';
  hub.products = products;
  fakeStore.products = products.flatMap((p) => (prices[p.storeProductId] ? [{ id: p.storeProductId, displayPrice: prices[p.storeProductId], type: p.subscription ? ('subs' as const) : ('in-app' as const) }] : []));
  hub.routes['GET /plans'] = PLANS;
  hub.routes['GET /plans/purchases/quote'] = QUOTE_OK;
  hub.routes['GET /me/tier'] = meTier(() => (hub.bodies.length > 0 ? 8 : 3));
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (require('@/features/store/iap') as typeof import('@/features/store/iap')).resetIapForTests();
  mockVault.clear();
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const sheet = async () => {
  const { ProductsFullSheet } = require('../ProductsFullSheet') as typeof import('../ProductsFullSheet');
  const up = jest.fn();
  const library = jest.fn();
  await renderSignedIn(<ProductsFullSheet onClose={jest.fn()} onUpgrade={up} onOpenLibrary={library} />);
  return { up, library };
};

describe('VF13 · Add 5 more products in the store sheet', () => {
  it('draws the pack at the STORE’s price beside Upgrade instead and Open library, with no wallet, PIN or naira', async () => {
    serve();
    await sheet();
    expect(await rtl.screen.findByTestId('full-title')).toHaveTextContent('You have used 3 of 3');
    expect(await rtl.screen.findByTestId('full-offer-price')).toHaveTextContent('$4.99');
    expect(rtl.screen.getByTestId('full-offer')).toHaveTextContent(/Add 5 more products/);
    expect(rtl.screen.getByTestId('full-add')).toHaveTextContent('Add 5 · $4.99');
    expect(rtl.screen.getByTestId('full-upgrade')).toHaveTextContent('Upgrade instead');
    expect(rtl.screen.getByTestId('full-library')).toHaveTextContent('Open library');
    expect(rtl.screen.queryByText(/₦|PIN|Bank charge|wallet/i)).toBeNull();
    // R-100: the Hub's quote of the pack is read once, only for its refusal (eligibility); nothing is bought from the wallet.
    expect(hub.reads.filter((r) => r.includes('/plans/purchases'))).toEqual(['GET /plans/purchases/quote']);
  });

  it('buys it in the store sheet, the Hub is handed the purchase, and the sheet says how many were added and what the person can publish now', async () => {
    serve();
    await sheet();
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('full-add')));
    expect(await rtl.screen.findByTestId('full-added-title')).toHaveTextContent('5 more products added');
    expect(hub.bodies).toHaveLength(1);
    expect(hub.bodies[0]).toMatchObject({ platform: 'android', productId: PACK_SKU });
    expect(fakeStore.finished).toEqual([{ productId: PACK_SKU, isConsumable: true }]);
    expect(await rtl.screen.findByTestId('full-added-line')).toHaveTextContent('You can publish up to 8 products now.');
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
  });

  it('a payment cancelled in the store sheet says so, asks the Hub nothing and leaves the offer', async () => {
    serve();
    fakeStore.next = { kind: 'error', code: 'user-cancelled' };
    await sheet();
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('full-add')));
    expect(await rtl.screen.findByText(/Cancelled. You were not charged./)).toBeTruthy();
    expect(hub.bodies).toHaveLength(0);
    expect(rtl.screen.getByTestId('full-add')).toBeTruthy();
  });

  it('shows no price and no buy button while the store is loading, never a wrong price', async () => {
    serve();
    let release: () => void = () => undefined;
    hub.hold = new Promise<void>((r) => (release = r));
    await sheet();
    expect(await rtl.screen.findByTestId('full-offer-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('full-offer-price')).toBeNull();
    expect(rtl.screen.queryByTestId('full-add')).toBeNull();
    expect(rtl.screen.queryByText(/₦|\$/)).toBeNull();
    await rtl.act(async () => release());
    expect(await rtl.screen.findByTestId('full-offer-price')).toHaveTextContent('$4.99');
  });

  it('a store the Hub is not open for, or one with no such pack, draws no offer and keeps the two other buttons', async () => {
    serve({ available: false });
    await sheet();
    expect(await rtl.screen.findByText('Buying is not open yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('full-offer')).toBeNull();
    expect(rtl.screen.getByTestId('full-upgrade')).toBeTruthy();
    expect(rtl.screen.getByTestId('full-library')).toBeTruthy();
  });

  it('a store with no such pack draws no offer and no error, and the sheet is worded without it', async () => {
    serve({ products: [tierProduct('verify')], prices: { 'africa.wawu.tier.verify': '$9.99' } });
    await sheet();
    expect(await rtl.screen.findByTestId('full-title')).toBeTruthy();
    await rtl.waitFor(() => expect(hub.reads).toContain('GET /store/products'));
    expect(rtl.screen.queryByTestId('full-offer')).toBeNull();
    expect(rtl.screen.queryByTestId('full-add')).toBeNull();
    expect(rtl.screen.getByTestId('full-line')).toHaveTextContent('Move up a tier, or take something down.');
  });
});

describe('VF13 · the pack is offered only where the Hub would sell it (R-100, PACK-CAP)', () => {
  const mine = (over: Record<string, unknown>) => ({ state: 'active', tier: { id: 'verify', name: 'Verify', badge: null }, activeUntil: '2027-01-01T00:00:00.000Z', productsAllowed: 3, productsUsed: 3, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null, ...over });
  const QUOTE = 'GET /plans/purchases/quote';
  const TIER_SENTENCE = 'More products come with a higher tier. Move up a tier to add more.';
  const CAP_SENTENCE = "That's the most products a profile can hold.";
  const refuse = (code: string, message: string, status = 409, from = 1) => (hub.errors[QUOTE] = { status, code, message, from });

  it('Verify, full: the Hub refuses the pack, so only the tiers are drawn and the store is never asked', async () => {
    serve();
    refuse('pack_not_allowed', TIER_SENTENCE);
    await sheet();
    expect(await rtl.screen.findByTestId('full-title')).toHaveTextContent('You have used 3 of 3');
    expect(await rtl.screen.findByTestId('full-line')).toHaveTextContent('Move up a tier to publish another.');
    expect(rtl.screen.getByTestId('full-upgrade')).toHaveTextContent('Upgrade instead');
    expect(rtl.screen.queryByTestId('full-offer')).toBeNull();
    expect(rtl.screen.queryByTestId('full-add')).toBeNull();
    expect(rtl.screen.queryByTestId('full-offer-loading')).toBeNull();
    expect(rtl.screen.queryByText(/\$4\.99|Add 5/)).toBeNull();
    expect(fakeStore.requests).toEqual([]);
  });

  it('Founding Maker at 20 of 20: the cap sentence, no pack and no buy button', async () => {
    serve();
    refuse('pack_not_allowed', CAP_SENTENCE);
    hub.routes['GET /me/tier'] = mine({ tier: { id: 'founding', name: 'Founding Maker', badge: null }, productsAllowed: 20, productsUsed: 20, extraProducts: 10 });
    await sheet();
    expect(await rtl.screen.findByTestId('full-title')).toHaveTextContent('You have used 20 of 20');
    expect(await rtl.screen.findByTestId('full-line')).toHaveTextContent("That's the most products a profile can hold.");
    expect(rtl.screen.queryByTestId('full-add')).toBeNull();
    expect(rtl.screen.queryByTestId('full-offer')).toBeNull();
    expect(rtl.screen.queryByTestId('full-upgrade')).toBeNull();
    expect(rtl.screen.getByTestId('full-library')).toBeTruthy();
    expect(fakeStore.requests).toEqual([]);
  });

  it('a person with no tier or an ended one, or only a verification tick, is refused by the Hub (tier_required) and is not offered the pack', async () => {
    serve();
    refuse('tier_required', 'Extra products are added to a plan you have. Pick a plan first.', 402);
    hub.routes['GET /me/tier'] = mine({ state: 'none', tier: null, productsAllowed: 25, productsUsed: 25, activeUntil: null });
    await sheet();
    expect(await rtl.screen.findByTestId('full-title')).toHaveTextContent('You have used 25 of 25');
    await rtl.waitFor(() => expect(hub.reads).toContain(QUOTE));
    expect(rtl.screen.queryByTestId('full-offer')).toBeNull();
    expect(rtl.screen.queryByTestId('full-add')).toBeNull();
    expect(rtl.screen.queryByText(/\$4\.99|Add 5/)).toBeNull();
    expect(rtl.screen.getByTestId('full-library')).toBeTruthy();
    expect(fakeStore.requests).toEqual([]);
  });

  it('a Founding Maker with room is offered the pack, and a tier that is ending still is', async () => {
    serve();
    hub.routes['GET /me/tier'] = mine({ state: 'ending' });
    await sheet();
    expect(await rtl.screen.findByTestId('full-add')).toHaveTextContent('Add 5 · $4.99');
  });

  it('a person with no wallet is still offered the pack when the Hub says wallet_not_open (eligibility came first; the store path needs no wallet)', async () => {
    serve();
    refuse('wallet_not_open', 'Open your wallet first.');
    await sheet();
    expect(await rtl.screen.findByTestId('full-add')).toHaveTextContent('Add 5 · $4.99');
  });

  it('asks the Hub again just before the store sheet: a pack_not_allowed then closes the offer with the Hub’s message and never opens the store', async () => {
    serve();
    await sheet();
    const add = await rtl.screen.findByTestId('full-add');
    // The rule moves after the person looked: the second read of the quote is refused.
    refuse('pack_not_allowed', TIER_SENTENCE, 409, hub.reads.filter((r) => r === QUOTE).length + 1);
    await rtl.act(async () => rtl.fireEvent.press(add));
    expect(await rtl.screen.findByTestId('full-refused')).toHaveTextContent(TIER_SENTENCE);
    expect(rtl.screen.queryByTestId('full-add')).toBeNull();
    expect(rtl.screen.queryByTestId('full-offer')).toBeNull();
    expect(fakeStore.requests).toEqual([]);
    expect(hub.bodies).toHaveLength(0);
  });

  it('when the Hub cannot be asked just before the store sheet, the store is not opened and the person is told to try again', async () => {
    serve();
    await sheet();
    const add = await rtl.screen.findByTestId('full-add');
    refuse('internal_error', 'The server is having trouble.', 500, hub.reads.filter((r) => r === QUOTE).length + 1);
    await rtl.act(async () => rtl.fireEvent.press(add));
    expect(await rtl.screen.findByTestId('full-check-failed')).toHaveTextContent('We could not check this right now. Try again.');
    expect(rtl.screen.getByTestId('full-add')).toBeTruthy();
    expect(fakeStore.requests).toEqual([]);
    expect(hub.bodies).toHaveLength(0);
  });
});

describe('G-IAP-02-5 · the price on M16, VF14 Renew and E21 is the store’s, never the Hub’s plan price', () => {
  const { tierItemOf } = require('@/features/store/model') as typeof import('@/features/store/model');
  const { getTickOf } = require('@/features/verification/TicksSection') as typeof import('@/features/verification/TicksSection');
  const { fromLine } = require('@/features/events/host/hostTier') as typeof import('@/features/events/host/hostTier');
  const item = (id: string, price: string) => ({ product: tierProduct(id) as never, price, offerToken: null });
  const ready = (...items: ReturnType<typeof item>[]) => ({ kind: 'ready' as const, items });
  const plans = { ...PLANS, currency: 'NGN' as const, tiers: PLANS.tiers as never };

  it('tierItemOf is null until the store has answered and when it does not sell the tier', () => {
    expect(tierItemOf({ kind: 'loading' }, 'verify')).toBeNull();
    expect(tierItemOf({ kind: 'not_open', why: 'not_configured' }, 'verify')).toBeNull();
    expect(tierItemOf({ kind: 'store_unavailable', web: true }, 'verify')).toBeNull();
    expect(tierItemOf(ready(item('plus', '$19.99')), 'verify')).toBeNull();
    expect(tierItemOf(ready(item('verify', '$9.99')), 'verify')?.price).toBe('$9.99');
  });

  it('M16: the row names the cheapest tier the store sells with the store’s price, and shows no price while the store has not answered', () => {
    expect(getTickOf(plans, null, ready(item('verify', '$9.99'), item('plus', '$19.99')))?.line).toBe('Verify · $9.99 for 12 months');
    expect(getTickOf(plans, null, ready(item('plus', '$19.99')))?.line).toBe('Verify Plus · $19.99 for 12 months');
    expect(getTickOf(plans, null, { kind: 'loading' })?.line).toBe('Verify for 12 months');
    expect(getTickOf(plans, null, { kind: 'store_unavailable', web: true })?.line).toBe('Verify for 12 months');
    expect(JSON.stringify(getTickOf(plans, null, { kind: 'loading' }))).not.toMatch(/₦|1,000/);
  });

  it('E21: "From" is the store’s price of the lowest tier (the one the Hub names in the refusal, else the cheapest the store sells), and no line while the store is loading', () => {
    expect(fromLine(ready(item('verify', '$9.99'), item('plus', '$19.99')), plans)).toBe('From $9.99.');
    expect(fromLine(ready(item('plus', '$19.99')), plans)).toBe('From $19.99.');
    expect(fromLine(ready(item('plus', '$19.99'), item('verify', '$9.99')), null, { lowestTier: { id: 'plus', name: 'Verify Plus', priceMinor: 300_000 } } as never)).toBe('From $19.99.');
    expect(fromLine({ kind: 'loading' }, plans)).toBeNull();
    expect(fromLine({ kind: 'not_open', why: 'disabled' }, plans)).toBeNull();
  });
});

describe('G-IAP-02-5 · on the screens themselves (F4)', () => {
  it('E21: the host gate draws "From" with the store’s price of the cheapest tier it sells, and nothing while the store is still loading', async () => {
    const { HostGateScreen } = require('@/features/events/host/HostGateScreen') as typeof import('@/features/events/host/HostGateScreen');
    serve({ products: [tierProduct('verify'), tierProduct('plus')], prices: { 'africa.wawu.tier.verify': '$9.99', 'africa.wawu.tier.plus': '$19.99' } });
    let release: () => void = () => undefined;
    hub.hold = new Promise<void>((r) => (release = r));
    await renderSignedIn(<HostGateScreen refusal={null} onBack={jest.fn()} />);
    await rtl.screen.findByText(/Verify/);
    expect(rtl.screen.queryByText(/From/)).toBeNull();
    await rtl.act(async () => release());
    expect(await rtl.screen.findByText('From $9.99.')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
  });

  it('E21: a store that sells no tier leaves the "From" line out', async () => {
    const { HostGateScreen } = require('@/features/events/host/HostGateScreen') as typeof import('@/features/events/host/HostGateScreen');
    serve({ products: [pack] });
    await renderSignedIn(<HostGateScreen refusal={null} onBack={jest.fn()} />);
    await rtl.screen.findByText(/Verify/);
    await rtl.waitFor(() => expect(hub.reads).toContain('GET /store/products'));
    expect(rtl.screen.queryByText(/From/)).toBeNull();
  });

  it('VF14: Renew carries the store’s price of the tier held, and says only "Renew" until the store has answered', async () => {
    const { YourTierScreen } = require('../YourTierScreen') as typeof import('../YourTierScreen');
    serve({ products: [tierProduct('verify')], prices: { 'africa.wawu.tier.verify': '$9.99' } });
    hub.routes['GET /me/tier'] = { state: 'ending', tier: { id: 'verify', name: 'Verify', badge: null }, activeFrom: '2026-01-01T00:00:00.000Z', activeUntil: '2026-11-01T00:00:00.000Z', productsAllowed: 3, productsUsed: 1, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null };
    let release: () => void = () => undefined;
    hub.hold = new Promise<void>((r) => (release = r));
    const renew = jest.fn();
    await renderSignedIn(<YourTierScreen onBack={jest.fn()} onRenew={renew} onUpgrade={jest.fn()} onSeeTiers={jest.fn()} />);
    expect(await rtl.screen.findByTestId('your-tier-renew')).toHaveTextContent(/^Renew$/);
    await rtl.act(async () => release());
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('your-tier-renew')).toHaveTextContent('Renew · $9.99'));
    expect(rtl.screen.queryByText(/₦/)).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('your-tier-renew')));
    expect(renew).toHaveBeenCalledWith('verify');
  });

  it('VF14: a tier the store does not sell has no price on Renew, never the Hub’s plan price', async () => {
    const { YourTierScreen } = require('../YourTierScreen') as typeof import('../YourTierScreen');
    serve({ products: [tierProduct('plus')], prices: { 'africa.wawu.tier.plus': '$19.99' } });
    hub.routes['GET /me/tier'] = { state: 'active', tier: { id: 'verify', name: 'Verify', badge: null }, activeFrom: '2026-01-01T00:00:00.000Z', activeUntil: '2027-01-01T00:00:00.000Z', productsAllowed: 3, productsUsed: 1, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null };
    await renderSignedIn(<YourTierScreen onBack={jest.fn()} onRenew={jest.fn()} onUpgrade={jest.fn()} onSeeTiers={jest.fn()} />);
    const renew = await rtl.screen.findByTestId('your-tier-renew');
    await rtl.waitFor(() => expect(hub.reads).toContain('GET /store/products'));
    expect(renew).toHaveTextContent(/^Renew$/);
    expect(rtl.screen.queryByText(/₦|1,000/)).toBeNull();
  });
});
