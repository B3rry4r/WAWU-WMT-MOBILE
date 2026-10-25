/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

import type { ComponentType } from 'react';

/*
 * ME-13: Verification (M15, M16, M17) on the real route files. The Hub answers through a stand-in `fetch`; each state is
 * entered by what the Hub says (a wallet state, a review stage, the selfie's tries, a payment still confirming), never
 * by a switch in the app.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

/** The app's modules load after the Hub's stand-in is installed: the client keeps the `fetch` it finds when it loads. */
const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let resetSessionForTests: () => void;
let ACCESS_KEY: string;
let REFRESH_KEY: string;
let queryClient: import('@tanstack/react-query').QueryClient;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

type Hub = {
  wallet: { state: 'not_open' | 'opening' | 'open' | 'frozen'; openingFlow?: 'check' | 'review'; review?: { stage: string } | null };
  selfie: { matchedAt: string | null; checksLeft: number } | 'fails';
  tier: { state: string; tier?: { id: string; name: string } | null; activeUntil?: string | null };
  pending: { id: string; status?: string } | null;
  failWallet: boolean;
  /** RELEASE-02 D-7: what `GET /plans` answers: naira tiers, dollar tiers, or nothing (404). */
  plans: 'ngn' | 'usd' | 'none';
  /** The uploads allowance, or nothing (404). */
  allowance: boolean;
};
const fresh = (): Hub => ({ wallet: { state: 'not_open' }, selfie: { matchedAt: null, checksLeft: 3 }, tier: { state: 'none' }, pending: null, failWallet: false, plans: 'none', allowance: false });
let hub: Hub = fresh();
const calls: string[] = [];
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });

function install() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
    calls.push(`${request.method} ${path}`);
    switch (`${request.method} ${path}`) {
      case 'GET /money/wallet':
        if (hub.failWallet) return new Response(JSON.stringify({ statusCode: 500, message: 'Something went wrong.' }), { status: 500 });
        return ok({
          state: hub.wallet.state,
          account: hub.wallet.state === 'open' ? { accountNumber: '8100000528', accountName: 'Ada Eze', bankName: 'Loma Bank', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-07T09:00:00.000Z' } : null,
          limits: null,
          pin: { isSet: false, changedAt: null, triesLeft: 5, lockedUntil: null },
          bankTransfers: { allowed: true, blockedBy: null },
          beneficiaryCount: 0,
          accountNumberStatus: hub.wallet.state === 'open' ? 'active' : 'none',
          openingFlow: hub.wallet.openingFlow ?? null,
          review: hub.wallet.review ? { reasons: [], canResubmit: true, canResubmitAt: null, decidedAt: null, ...hub.wallet.review } : null,
        });
      case 'GET /money/identity/selfie':
        if (hub.selfie === 'fails') return new Response(JSON.stringify({ statusCode: 409, message: 'Check your BVN first.' }), { status: 409 });
        return ok(hub.selfie);
      case 'GET /me/tier':
        return ok({ tier: null, activeFrom: null, activeUntil: null, productsAllowed: 5, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null, ...hub.tier });
      case 'GET /plans': {
        if (hub.plans === 'none') return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
        const usd = hub.plans === 'usd';
        const tier = (id: string, name: string, days: number, naira: number, cents: number) => ({ id, name, days, products: 3, bonusPoints: 100, bonusPointsExpireDays: 365, priceMinor: usd ? cents : naira, eventPass: null, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: id === 'founding' });
        return ok({ currency: usd ? 'USD' : 'NGN', currencyFixed: false, tiers: [tier('verify', 'Verify', 30, 100_000, 300), tier('plus', 'Verify Plus', 180, 300_000, 900), tier('founding', 'Founding Maker', 365, 500_000, 1500)], extraProducts: { count: 5, priceMinor: 150_000 }, packs: [], checkoutBump: { points: 1000, priceMinor: 80_000 }, actions: [], caps: {} });
      }
      case 'GET /uploads/allowance':
        if (!hub.allowance) return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
        return ok({ tickHeld: false, uploads: { used: 0, allowed: 5, remaining: 5 }, storage: { usedBytes: 0, quotaBytes: 1_073_741_824 }, free: { uploads: 5, storageBytes: 1_073_741_824 }, withTick: { uploads: 25, storageBytes: 10_737_418_240 } });
      case 'GET /plans/purchases/pending':
        return ok({ purchase: hub.pending ? { id: hub.pending.id, kind: 'tier', tierId: 'founding', status: hub.pending.status ?? 'pending' } : null });
      default:
        return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
    }
  }) as typeof fetch;
}

beforeAll(async () => {
  install();
  routes = {
    _layout: page('@/app/_layout'),
    '(tabs)/_layout': page('@/app/(tabs)/_layout'),
    '(tabs)/index': page('@/app/(tabs)/index'),
    '(tabs)/explore': page('@/app/(tabs)/explore'),
    '(tabs)/inbox': page('@/app/(tabs)/inbox'),
    '(tabs)/wallet': page('@/app/(tabs)/wallet'),
    '(tabs)/me': page('@/app/(tabs)/me'),
    verification: page('@/app/verification'),
    tiers: () => <Text accessibilityRole="header">Tiers</Text>,
    'open-wallet': () => <Text accessibilityRole="header">Open your wallet</Text>,
  };
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  resetSessionForTests = (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests;
  ({ ACCESS_KEY, REFRESH_KEY } = require('@/api/tokenStore') as typeof import('@/api/tokenStore'));
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  hub = fresh();
  calls.length = 0;
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set(ACCESS_KEY, tokenFor('00000000-0000-4000-8000-0000000000b1'));
  mockVault.set(REFRESH_KEY, 'refresh-1');
  resetSessionForTests();
  install();
});

const open = async () => {
  await renderRouter(routes, { initialUrl: '/verification' });
  await screen.findByTestId('verification-screen');
};
const settled = async () => screen.findByTestId('verification-identity');

describe('ME-13: Verification', () => {
  it('M16: a person with no wallet sees Not started and can tap the row to reach Open your wallet', async () => {
    await open();
    const row = await settled();
    expect(row).toHaveTextContent(/Identity check/);
    expect(row).toHaveTextContent(/Needed to get paid/);
    expect(row).toHaveTextContent(/Not started/);
    await fireEvent.press(row);
    await waitFor(() => expect(pathname()).toBe('/open-wallet'));
    expect(await screen.findByText('Open your wallet')).toBeTruthy();
  });

  it('M17: a person whose selfie used every try sees Not approved, Send your ID again, and the row still opens Open your wallet', async () => {
    hub.selfie = { matchedAt: null, checksLeft: 0 };
    await open();
    const row = await settled();
    expect(row).toHaveTextContent(/Send your ID again/);
    expect(row).toHaveTextContent(/Not approved/);
    expect(calls).toContain('GET /money/identity/selfie');
    await fireEvent.press(row);
    await waitFor(() => expect(pathname()).toBe('/open-wallet'));
  });

  it('M17: an opening the Hub rejected is Not approved too, and the selfie is not asked about', async () => {
    hub.wallet = { state: 'not_open', openingFlow: 'review', review: { stage: 'rejected' } };
    await open();
    expect(await settled()).toHaveTextContent(/Not approved/);
    expect(calls).not.toContain('GET /money/identity/selfie');
  });

  it('a selfie read that fails leaves the true state, Not started, never a guess of Not approved', async () => {
    hub.selfie = 'fails';
    await open();
    expect(await settled()).toHaveTextContent(/Not started/);
  });

  it('M15: a payment still confirming shows "Paid, still confirming" from the Hub, with no way to pay again drawn', async () => {
    hub.wallet = { state: 'open' };
    hub.pending = { id: 'p1' };
    await open();
    const banner = await screen.findByTestId('verification-confirming');
    expect(banner).toHaveTextContent(/Paid, still confirming/);
    expect(banner).toHaveTextContent(/Don't pay again\. Check back in a minute\./);
    expect(screen.queryByText('Get it')).toBeNull();
    expect(screen.queryByText('Pay')).toBeNull();
  });

  // SWEEP-APP-3 row 126: the Hub can answer /pending with a purchase it has already decided (refunded when the plan could not be granted, failed or reversed); that is nothing confirming, not an unreadable answer.
  it.each(['refunded', 'failed', 'reversed'])('M15: a purchase the Hub has already decided (%s) draws no banner and no error, as when nothing is confirming', async (status) => {
    hub.wallet = { state: 'open' };
    hub.pending = { id: 'p1', status };
    await open();
    await settled();
    expect(calls.filter((c) => c === 'GET /plans/purchases/pending').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('verification-confirming')).toBeNull();
    expect(screen.queryByTestId('verification-error')).toBeNull();
    expect(screen.queryByText(/could not be read/i)).toBeNull();
  });

  // SWEEP-APP-4 (part 3's low on row 126): a purchase read as paid whose claim is still open still blocks a second buy, so it is "Paid, still confirming", not nothing.
  it('M15: a purchase the Hub reads as paid but has not opened yet (claim still open) draws the confirming banner, and nothing to pay with', async () => {
    hub.wallet = { state: 'open' };
    hub.pending = { id: 'p1', status: 'paid' };
    await open();
    const banner = await screen.findByTestId('verification-confirming');
    expect(banner).toHaveTextContent(/Paid, still confirming/);
    expect(banner).toHaveTextContent(/Don't pay again\. Check back in a minute\./);
    expect(screen.queryByText('Get it')).toBeNull();
    expect(screen.queryByText('Pay')).toBeNull();
    expect(screen.queryByTestId('verification-error')).toBeNull();
  });

  // SWEEP-APP-6 (ME-13 L3, seen on the stack with the stand-in's hold released): the payment is decided while the page is open.
  it('M15: when the payment that was confirming is granted with the page open, the banner goes and the tier row comes, with no leaving the page', async () => {
    hub.wallet = { state: 'open' };
    hub.pending = { id: 'p1' };
    await open();
    await screen.findByTestId('verification-confirming');
    expect(screen.queryByTestId('verification-held')).toBeNull();
    hub.pending = null;
    hub.tier = { state: 'active', tier: { id: 'verify', name: 'Verify' }, activeUntil: '2026-11-17T05:26:00.262Z' };
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['verification', 'pending'] });
    });
    await waitFor(() => expect(screen.queryByTestId('verification-confirming')).toBeNull());
    const held = await screen.findByTestId('verification-held');
    expect(held).toHaveTextContent(/Verify/);
    expect(held).toHaveTextContent(/Active until 17 Nov 2026/);
  });

  it('with nothing confirming, no tier and no tiers the Hub will sell, there is no Your ticks part and no banner (the part now exists to carry "Get it", so it is drawn only when it has a row)', async () => {
    hub.wallet = { state: 'open' };
    await open();
    await settled();
    expect(screen.queryByTestId('verification-tier')).toBeNull();
    expect(screen.queryByTestId('verification-confirming')).toBeNull();
  });

  it('D-7 · M16: a person with no tier sees Your ticks with the cheapest tier, its price and length, and Get it opens the tiers', async () => {
    hub.wallet = { state: 'not_open' };
    hub.plans = 'ngn';
    await open();
    const row = await screen.findByTestId('verification-get-tick');
    expect(row).toHaveTextContent(/Get your tick/);
    expect(row).toHaveTextContent(/Verify · ₦1,000 for 30 days/);
    expect(screen.getByText('Your ticks')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('verification-get-tick-button'));
    await waitFor(() => expect(pathname()).toBe('/tiers'));
  });

  it('D-7: a person billed in dollars is shown the dollar price with the dollar sign', async () => {
    hub.plans = 'usd';
    await open();
    expect(await screen.findByTestId('verification-get-tick')).toHaveTextContent(/Verify · \$3 for 30 days/);
  });

  it('D-7: a person whose tier is running sees it, and Upgrade while a higher tier exists', async () => {
    hub.wallet = { state: 'open' };
    hub.plans = 'ngn';
    hub.tier = { state: 'active', tier: { id: 'plus', name: 'Verify Plus' }, activeUntil: '2026-10-12T10:00:00.000Z' };
    await open();
    expect(await screen.findByTestId('verification-held')).toHaveTextContent(/Verify Plus/);
    expect(screen.getByTestId('verification-get-tick')).toHaveTextContent(/Move up a tier/);
    expect(screen.getByText('Upgrade')).toBeTruthy();
  });

  it('D-7: a person on the highest tier is offered no step up', async () => {
    hub.wallet = { state: 'open' };
    hub.plans = 'ngn';
    hub.tier = { state: 'active', tier: { id: 'founding', name: 'Founding Maker' }, activeUntil: '2026-10-12T10:00:00.000Z' };
    await open();
    await screen.findByTestId('verification-held');
    expect(screen.queryByTestId('verification-get-tick')).toBeNull();
  });

  it('D-7 · M16: "Every tick gives you" draws the uploads and library space from the Hub, then reach and the tick, and nothing it did not give', async () => {
    hub.allowance = true;
    await open();
    expect(await screen.findByTestId('verification-gives-uploads')).toHaveTextContent(/Up to 25 uploads/);
    expect(screen.getByTestId('verification-gives-uploads')).toHaveTextContent(/Free accounts get 5/);
    expect(screen.getByTestId('verification-gives-space')).toHaveTextContent(/10 GB library space/);
    expect(screen.getByTestId('verification-gives-space')).toHaveTextContent(/Free accounts get 1 GB/);
    expect(screen.getByTestId('verification-gives-reach')).toHaveTextContent(/Reach more people/);
    expect(screen.getByTestId('verification-gives-tick')).toHaveTextContent(/And you can host events/);
  });

  it('D-7: with no allowance from the Hub, the two rows that carry its figures are not drawn', async () => {
    hub.allowance = false;
    await open();
    await screen.findByTestId('verification-gives-reach');
    expect(screen.queryByTestId('verification-gives-uploads')).toBeNull();
    expect(screen.queryByTestId('verification-gives-space')).toBeNull();
  });

  it('a person with a tier sees its name and day from the Hub, and an open wallet has no row to open', async () => {
    hub.wallet = { state: 'open' };
    hub.tier = { state: 'active', tier: { id: 'founding', name: 'Founding Maker' }, activeUntil: '2026-10-12T10:00:00.000Z' };
    await open();
    const held = await screen.findByTestId('verification-held');
    expect(held).toHaveTextContent(/Founding Maker/);
    expect(held).toHaveTextContent(/Active until 12 Oct 2026/);
    const row = await settled();
    expect(row).toHaveTextContent(/Open/);
    expect(row.props.onClick ?? row.props.onPress).toBeFalsy();
    expect(calls).not.toContain('GET /money/identity/selfie');
  });

  it('a read that fails shows the error state with a retry that asks the Hub again', async () => {
    hub.failWallet = true;
    await open();
    await screen.findByTestId('verification-error');
    hub.failWallet = false;
    await fireEvent.press(screen.getByText('Try again'));
    expect(await settled()).toHaveTextContent(/Not started/);
  });

  it('a signed-out visit is sent to the welcome screen', async () => {
    mockVault.clear();
    resetSessionForTests();
    await renderRouter({ ...routes, welcome: () => <Text>Welcome</Text> }, { initialUrl: '/verification' });
    await waitFor(() => expect(pathname()).toBe('/welcome'));
  });

  it('the Me menu has a Verification row that opens the page', async () => {
    await renderRouter(routes, { initialUrl: '/me' });
    await fireEvent.press(await screen.findByTestId('me-menu-button'));
    await fireEvent.press(await screen.findByTestId('me-menu-verification'));
    await waitFor(() => expect(pathname()).toBe('/verification'));
    await settled();
  });
});
