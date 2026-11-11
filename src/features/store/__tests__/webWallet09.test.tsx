/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { renderSignedIn, resetApp } from '../testing/screen';

/*
 * WEBAPP-09 W3 and W4 on the web wallet purchase (see webWallet.test.tsx for the harness this copies). WEBAPP-06 (R-128): on the web build what the phone sells through the stores is paid from the wallet. These run the real Buy points screen as
 * the web (Platform.OS web) against a stand-in Hub that answers in the contract's shapes and records every request with its headers: the packs are
 * the Hub's list prices, Buy asks for a quote, Pay asks again and opens the PIN sheet, and the PIN goes out once, with an Idempotency-Key.
 * A phone with a store is unchanged: its tests are `store/__tests__/ladder*` and `buy.test.ts`.
 */
// The web build loads the live hook (`useWebBuy.web.tsx`); jest resolves the phone file (useWebBuy.tsx), so this test asks for the web one.
jest.mock('../webwallet/useWebBuy', () => jest.requireActual('../webwallet/useWebBuy.web'));
jest.mock('expo-secure-store', () => {
  const vault = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => vault.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void vault.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void vault.delete(key)),
  };
});
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  supportedAuthenticationTypesAsync: jest.fn(async () => []),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ Redirect: () => null, useRouter: () => ({ push: mockPush, navigate: mockNavigate, back: jest.fn(), canGoBack: () => false }), useIsFocused: () => true, router: { push: jest.fn() } }));
const mockNavigate = jest.fn();

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown, status = 200) => json(status, { statusCode: status, message: 'OK', data });

type Sent = { method: string; path: string; headers: Record<string, string>; body: unknown };
const hub = { sent: [] as Sent[], balanceKobo: 5_000_000 as number | null, tierRunning: false };
const PRICE = 100_000;
const quote = () => ({
  kind: 'points_pack',
  packId: 's',
  currency: 'NGN',
  packMinor: PRICE,
  points: 1000,
  bonusPercent: 0,
  bonusPoints: 0,
  totalPoints: 1000,
  expiryDays: 0,
  paymentKind: 'points_pack',
  payment: {
    kind: 'points_pack',
    targetId: 's',
    title: '1,000 points',
    payee: null,
    priceKobo: PRICE,
    fee: { providerFeeKobo: 0, wawuFeeKobo: 0, totalFeeKobo: 0 },
    totalKobo: PRICE,
    currency: 'NGN',
    feeMinor: (PRICE) - (PRICE),
    vatMinor: 0,
    vatOn: false,
    totalMinor: PRICE,
    receiveMinor: PRICE,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: hub.balanceKobo !== null && hub.balanceKobo < PRICE ? PRICE - hub.balanceKobo : null,
    willBeHeld: false,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: 'tok-1',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
});
const paid = () => ({
  id: 'pp-1',
  kind: 'points_pack',
  method: 'wallet',
  status: 'paid',
  statusMessage: null,
  payment: { id: 'pay-1', status: 'completed', delivered: true, failureReason: null, totalKobo: PRICE, priceKobo: PRICE },
});


const grantOf = (total: number | null) => (total === null ? null : { points: 2750, bonusPoints: total - 2750, totalPoints: total, expiresAt: null });
const paidView = (over: Record<string, unknown> = {}) => ({
  id: 'pp-1',
  kind: 'points_pack',
  packId: 'm',
  method: 'wallet',
  status: 'paid',
  statusMessage: null,
  grant: grantOf(3025),
  payment: { id: 'pay-1', status: 'completed', delivered: true, failureReason: null, totalKobo: PRICE, priceKobo: PRICE },
  ...over,
});
let answerPost: () => Response = () => ok(paidView(), 201);
let heldTier = false;
let answerRead: (id: string) => Response = () => ok(paidView());

beforeAll(() => {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/hub/, '');
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => (headers[k] = v));
    const body = request.method === 'POST' ? await request.json() : null;
    hub.sent.push({ method: request.method, path: path + url.search, headers, body });
    if (path === '/plans' && request.method === 'GET') {
      return ok({
        currency: 'NGN',
        currencyFixed: true,
        tiers: [{ id: 'verify', name: 'Verify', days: 365, products: 5, bonusPoints: 100, bonusPointsExpireDays: 0, priceMinor: 299_900, eventPass: null, badge: null, packBonusPercent: 0, firstVoiceIntroIncluded: false, preselected: true }],
        extraProducts: { count: 5, priceMinor: 150_000 },
        packs: [{ id: 'm', points: 2750, priceMinor: PRICE }],
        checkoutBump: null,
        actions: [],
        caps: {},
      });
    }
    if (path === '/plans/purchases/quote') {
      const q = quote();
      return ok(url.searchParams.get('kind') === 'upgrade' ? { ...q, kind: 'upgrade', payment: { ...q.payment, kind: 'upgrade', priceKobo: 700_000, totalKobo: 710_000 } } : { ...q, packId: 'm' });
    }
    if (path === '/plans/purchases' && request.method === 'POST') return answerPost();
    if (path.startsWith('/plans/purchases/') && request.method === 'GET') return answerRead(path.split('/').pop() as string);
    if (path === '/me/tier') return heldTier ? ok({ state: 'active', tier: { id: 'verify', name: 'Verify', badge: null }, activeUntil: '2027-01-01T00:00:00.000Z', productsAllowed: 5, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null }) : json(404, { statusCode: 404, message: 'none', data: null });
    if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-11-09T10:00:00Z' });
    return ok({});
  }) as typeof fetch;
});
rtl.configure({ asyncUtilTimeout: 10_000 });
beforeEach(() => {
  hub.sent = [];
  hub.balanceKobo = 5_000_000;
  answerPost = () => ok(paidView(), 201);
  answerRead = () => ok(paidView());
  heldTier = false;
  jest.replaceProperty(Platform, 'OS', 'web');
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const asked = (method: string, prefix: string) => hub.sent.filter((s) => s.method === method && s.path.startsWith(prefix));

async function payWithPin() {
  const { BuyScreen } = require('@/features/points/BuyScreen') as typeof import('@/features/points/BuyScreen');
  await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={jest.fn()} />);
  const pay = await rtl.screen.findByTestId('buy-pay');
  await rtl.act(async () => {
    rtl.fireEvent.press(pay);
  });
  await rtl.waitFor(() => expect(rtl.screen.getByText('Buy · ₦1,000')).toBeTruthy());
  await rtl.act(async () => {
    rtl.fireEvent.press(rtl.screen.getByText('Buy · ₦1,000'));
  });
  await rtl.waitFor(() => expect(rtl.screen.getByText('Enter your PIN')).toBeTruthy());
  for (const d of '4829') {
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByRole('button', { name: d }));
    });
  }
}

describe('WEBAPP-09 W3 · the points sheet says what the Hub granted', () => {
  it('a Founding Maker pack: the sheet names the pack plus the bonus, 3,025, not the pack alone', async () => {
    await payWithPin();
    expect(await rtl.screen.findByText('3,025 points added')).toBeTruthy();
    expect(rtl.screen.queryByText('2,750 points added')).toBeNull();
  });

  it('a plain pack: the sheet names the Hub\'s total', async () => {
    answerPost = () => ok(paidView({ grant: grantOf(2750) }), 201);
    await payWithPin();
    expect(await rtl.screen.findByText('2,750 points added')).toBeTruthy();
  });

  it('an answer that carries no grant says "Points added" and no number (never the catalog\'s)', async () => {
    answerPost = () => ok(paidView({ grant: null }), 201);
    await payWithPin();
    expect(await rtl.screen.findByText('Points added')).toBeTruthy();
    expect(rtl.screen.queryByText(/2,750 points added/)).toBeNull();
  });
});

describe('WEBAPP-09 W4 · the same pack paid in another tab', () => {
  const inProgress = (paymentId: string | null) =>
    json(409, { statusCode: 409, message: "We're still confirming this payment. Don't pay again; we'll let you know.", reason: { code: 'payment_in_progress', ...(paymentId ? { paymentId } : {}) } });

  it('the losing tab reads the open payment and shows it paid, with one charge sent', async () => {
    answerPost = () => inProgress('pp-1');
    await payWithPin();
    expect(await rtl.screen.findByText('3,025 points added')).toBeTruthy();
    expect(asked('POST', '/plans/purchases')).toHaveLength(1);
    expect(asked('GET', '/plans/purchases/pp-1').length).toBeGreaterThan(0);
    expect(rtl.screen.queryByText('Still confirming')).toBeNull();
  });

  it('an open payment for a different pack is not taken for this one: the sheet still says it is being confirmed', async () => {
    answerPost = () => inProgress('pp-1');
    answerRead = () => ok(paidView({ packId: 's' }));
    await payWithPin();
    expect(await rtl.screen.findByText('Still confirming')).toBeTruthy();
    expect(rtl.screen.queryByText(/points added/)).toBeNull();
    expect(asked('POST', '/plans/purchases')).toHaveLength(1);
  });

  it('an answer that names no payment keeps the old words and reads nothing', async () => {
    answerPost = () => inProgress(null);
    await payWithPin();
    expect(await rtl.screen.findByText('Still confirming')).toBeTruthy();
    expect(asked('GET', '/plans/purchases/pp')).toHaveLength(0);
  });
});

describe('WEBAPP-09 W5 · an upgrade\'s checkout row shows what will be charged', () => {
  const boot = async (kind: 'tier' | 'upgrade') => {
    const { CheckoutScreen } = require('@/features/verify/CheckoutScreen') as typeof import('@/features/verify/CheckoutScreen');
    await renderSignedIn(<CheckoutScreen kind={kind} tierId="verify" onBack={jest.fn()} onPaid={jest.fn()} />);
  };

  it('the row and the button both say the quote\'s total, never the tier\'s full price', async () => {
    await boot('upgrade');
    expect(await rtl.screen.findByText('Upgrade · ₦7,100')).toBeTruthy();
    expect(rtl.screen.getByTestId('checkout-price').props.children).toBe('₦7,100');
    expect(rtl.screen.queryByText('₦2,999')).toBeNull();
  });

  it('a first purchase still shows the tier\'s price', async () => {
    await boot('tier');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('checkout-price').props.children).toBe('₦2,999'));
  });
});

describe('WEBAPP-09 W2 · the tiers sheet always has a way out on the web', () => {
  const boot = async () => {
    const { TiersScreen } = require('@/features/verify/TiersScreen') as typeof import('@/features/verify/TiersScreen');
    const onClose = jest.fn();
    await renderSignedIn(<TiersScreen onClose={onClose} onContinue={jest.fn()} />);
    return onClose;
  };

  it('a person on the highest tier sees a Close that closes', async () => {
    heldTier = true;
    const onClose = await boot();
    expect(await rtl.screen.findByText('You are on the highest tier')).toBeTruthy();
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByTestId('tiers-close'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
