/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { renderSignedIn, resetApp } from '../testing/screen';

/*
 * WEBAPP-06 (R-128): on the web build what the phone sells through the stores is paid from the wallet. These run the real Buy points screen as
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
        packs: [{ id: 's', points: 1000, priceMinor: PRICE }, { id: 'm', points: 2750, priceMinor: 250_000 }],
        checkoutBump: null,
        actions: [],
        caps: {},
      });
    }
    if (path === '/plans/purchases/quote') return ok(quote());
    if (path === '/plans/purchases' && request.method === 'POST') return ok(paid(), 201);
    if (path === '/me/tier') return json(404, { statusCode: 404, message: 'none', data: null });
    if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-11-09T10:00:00Z' });
    return ok({});
  }) as typeof fetch;
});
rtl.configure({ asyncUtilTimeout: 10_000 });
beforeEach(() => {
  hub.sent = [];
  hub.balanceKobo = 5_000_000;
  jest.replaceProperty(Platform, 'OS', 'web');
});
afterEach(async () => {
  await rtl.act(async () => new Promise((r) => setTimeout(r, 0)));
  rtl.cleanup();
  resetApp();
  jest.restoreAllMocks();
});

const asked = (method: string, prefix: string) => hub.sent.filter((s) => s.method === method && s.path.startsWith(prefix));

async function openPay() {
  const { BuyScreen } = require('@/features/points/BuyScreen') as typeof import('@/features/points/BuyScreen');
  const onDone = jest.fn();
  await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={onDone} />);
  const pay = await rtl.screen.findByTestId('buy-pay');
  // A double tap on Buy asks for one quote.
  await rtl.act(async () => {
    rtl.fireEvent.press(pay);
  });
  await rtl.act(async () => {
    rtl.fireEvent.press(pay);
  });
  return { onDone };
}

describe('WEBAPP-06 · points from the wallet on the web', () => {
  it('draws the Hub list prices as packs, not "Buy in the app"', async () => {
    const { BuyScreen } = require('@/features/points/BuyScreen') as typeof import('@/features/points/BuyScreen');
    await renderSignedIn(<BuyScreen onBack={jest.fn()} onDone={jest.fn()} />);
    expect(await rtl.screen.findByTestId('pack-web.points.s')).toBeTruthy();
    expect(rtl.screen.getByTestId('pack-web.points.m')).toBeTruthy();
    expect(rtl.screen.queryByText('Buy in the app')).toBeNull();
    expect(rtl.screen.queryByText(/Restore purchases/)).toBeNull();
    expect(rtl.screen.getAllByLabelText(/₦1,000/).length).toBeGreaterThan(0);
  });

  it('a user buys points with their PIN: one quote on a double tap, a fresh one on Pay, one payment with the PIN and one Idempotency-Key', async () => {
    const { onDone } = await openPay();
    await rtl.waitFor(() => expect(rtl.screen.getByText('Buy · ₦1,000')).toBeTruthy());
    expect(asked('GET', '/plans/purchases/quote')).toHaveLength(1);
    expect(asked('GET', '/plans/purchases/quote')[0].path).toContain('kind=points_pack&packId=s');
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByText('Buy · ₦1,000'));
    });
    await rtl.waitFor(() => expect(rtl.screen.getByText('Enter your PIN')).toBeTruthy());
    expect(asked('GET', '/plans/purchases/quote')).toHaveLength(2);
    for (const d of '4829') {
      await rtl.act(async () => {
        rtl.fireEvent.press(rtl.screen.getByRole('button', { name: d }));
      });
    }
    await rtl.waitFor(() => expect(asked('POST', '/plans/purchases')).toHaveLength(1));
    const sent = asked('POST', '/plans/purchases')[0];
    expect(sent.headers['x-transaction-pin']).toBe('4829');
    expect(sent.headers['idempotency-key']).toMatch(/^[0-9a-f-]{16,}$/);
    expect(sent.body).toEqual({ kind: 'points_pack', method: 'wallet', packId: 's', expectedTotalKobo: PRICE, quoteToken: 'tok-1' });
    // The Hub said paid: the points screen's own "added" view draws once.
    expect(await rtl.screen.findByText('Done')).toBeTruthy();
    expect(asked('POST', '/plans/purchases')).toHaveLength(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('a user with too little in the wallet sees the shortfall and the way to add money, and nothing is sent', async () => {
    hub.balanceKobo = 40_000;
    await openPay();
    await rtl.waitFor(() => expect(rtl.screen.getByText(/Not enough/)).toBeTruthy());
    expect(rtl.screen.getAllByText(/₦600/).length).toBeGreaterThan(0);
    expect(rtl.screen.queryByText('Buy · ₦1,000')).toBeNull();
    expect(rtl.screen.getByText('Add ₦600')).toBeTruthy();
    expect(asked('POST', '/plans/purchases')).toHaveLength(0);
  });
});

describe('WEBAPP-06 fix 1 · F1 and F2', () => {
  it('Add on the pay sheet goes to Add money with the shortfall, as every other pay screen does', async () => {
    hub.balanceKobo = 40_000;
    await openPay();
    await rtl.waitFor(() => expect(rtl.screen.getByText('Add ₦600')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByText('Add ₦600'));
    });
    const { addMoneyHref } = require('@/features/addmoney/entry') as typeof import('@/features/addmoney/entry');
    expect(mockPush).toHaveBeenCalledWith(addMoneyHref(60_000));
  });

  it('WEBAPP-08 F7: the pay sheet closes as Add sends the person to Add money (it never stays over the account number)', async () => {
    hub.balanceKobo = 40_000;
    await openPay();
    await rtl.waitFor(() => expect(rtl.screen.getByText('Add ₦600')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(rtl.screen.getByText('Add ₦600'));
    });
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Add ₦600')).toBeNull());
    expect(rtl.screen.queryByText('Not enough in your Naira wallet')).toBeNull();
  });

  it('every file under src/app/bills goes home on the web, and none draws on the web', async () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const root = path.join(process.cwd(), 'src/app/bills');
    const files: string[] = [];
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx$/.test(e.name) && files.push(path.join(d, e.name))));
    walk(root);
    expect(files.length).toBeGreaterThanOrEqual(9);
    for (const f of files) {
      expect(fs.readFileSync(f, 'utf8')).toContain('withBillsGuard(');
    }
    const { withBillsGuard } = require('@/features/bills/webGuard') as typeof import('@/features/bills/webGuard');
    const { Text } = require('react-native') as typeof import('react-native');
    const Guarded = withBillsGuard(() => <Text>bills page</Text>);
    await rtl.render(<Guarded />);
    expect(rtl.screen.queryByText('bills page')).toBeNull();
  });
});

describe('WEBAPP-06 · bills on the web (R-47)', () => {
  it('the money card on Home draws no Bills action on the web, and does on a phone', async () => {
    const { MoneyCard } = require('@/features/home/MoneyCard') as typeof import('@/features/home/MoneyCard');
    const props = { state: { kind: 'figure', kobo: 120_000 } as const, masked: false, onToggleMask: jest.fn(), onOpenWallet: jest.fn(), onRetryWallet: jest.fn(), onRetryBalance: jest.fn(), retrying: false, onSend: jest.fn(), onAdd: jest.fn(), onOpenBills: jest.fn() };
    await rtl.render(<MoneyCard {...props} />);
    expect(rtl.screen.queryByTestId('today-action-bills')).toBeNull();
    expect(rtl.screen.getByTestId('today-action-add')).toBeTruthy();
    rtl.cleanup();
    jest.replaceProperty(Platform, 'OS', 'android');
    await rtl.render(<MoneyCard {...props} />);
    expect(rtl.screen.getByTestId('today-action-bills')).toBeTruthy();
  });

  it('the /bills page sends a visitor on the web home', async () => {
    const { billsOffered } = require('@/features/bills/offered') as typeof import('@/features/bills/offered');
    expect(billsOffered()).toBe(false);
    jest.replaceProperty(Platform, 'OS', 'ios');
    expect(billsOffered()).toBe(true);
  });
});

