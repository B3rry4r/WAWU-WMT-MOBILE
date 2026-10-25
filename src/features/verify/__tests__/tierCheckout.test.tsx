/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useLocalSearchParams } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import { lightColors, radius } from '@/theme/tokens.generated';

import type { ComponentType } from 'react';

/*
 * Make it official (ME-12) on the real Expo Router stack: VF5 and VF5b (the tiers), VF6 to VF6d (the checkout, its states and the PIN),
 * VF7 (the grant) as the real route files, and the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in
 * answers in the Hub's shapes, records every purchase's headers and body, and answers a key it knows with its first purchase, as the Hub
 * does, so "one tap pair is one debit" is read from what the Hub was sent.
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

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const PASS = { verify: { id: 'watch_apply', name: 'Watch live, apply' }, plus: { id: 'maker_pass', name: 'Maker Pass' }, founding: { id: 'maker_pass_priority', name: 'Maker Pass, priority' } };
const TIERS = [
  { id: 'verify', name: 'Verify', days: 30, products: 3, bonusPoints: 100, bonusPointsExpireDays: 365, priceMinor: 100_000, eventPass: PASS.verify, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: false },
  { id: 'plus', name: 'Verify Plus', days: 180, products: 6, bonusPoints: 300, bonusPointsExpireDays: 365, priceMinor: 300_000, eventPass: PASS.plus, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: false },
  { id: 'founding', name: 'Founding Maker', days: 365, products: 10, bonusPoints: 600, bonusPointsExpireDays: 365, priceMinor: 500_000, eventPass: PASS.founding, badge: { id: 'founding', numbered: true }, packBonusPercent: 10, firstVoiceIntroIncluded: true, preselected: true },
];
const BUMP = { points: 1000, priceMinor: 80_000 };
const BANK_CHARGE = 2500;
const PURCHASE_ID = '66666666-6666-4666-8666-666666666666';
/**
 * The day these cases are read on unless one says otherwise. An end date is written against today (it carries its year when it is not
 * this year, FIX-78 F-3), so the clock is pinned: no case changes with the calendar. The router's test renderer installs the fake clock.
 */
const TODAY = '2026-10-18T09:00:00.000Z';
const pinClock = (iso: string) => jest.setSystemTime(new Date(iso));
/** The end of the held Verify tier when a case does not set one: later this year, on the pinned day. */
const HELD_UNTIL = '2026-11-26T00:00:00.000Z';

type Mode = 'ok' | 'pending' | 'lost' | 'changed' | 'failed' | 'wrongfirst';
const hub = {
  mode: 'ok' as Mode,
  /** RELEASE-02 D-1: the Hub bills this person in dollars (cents, the board's $3, $9 and $15). */
  usd: false,
  /** RELEASE-02 D-2: the account type on the profile (`GET /users/me`). A creator is offered "Record my voice" after paying; anyone else is not. */
  accountType: 'creator' as 'creator' | 'user',
  held: 'none' as 'none' | 'verify',
  /** The end date the Hub gives the tier held, when a test sets one (otherwise 26 Nov of this year). */
  until: null as string | null,
  balanceKobo: 48_525_075,
  shortfall: false,
  priceDrift: 0,
  /** RELEASE-02 second pass (M-1): the two parts of the fee the quote carries. The stack's real book-transfer fee is 0, so a case sets them to see both rows at 0 and at a figure. */
  providerFee: BANK_CHARGE,
  wawuFee: 0,
  /** RELEASE-02 second pass (L-p2-4): the number the Hub gives the Founding badge on `GET /users/me/profile-fields`; null while it serves none. */
  badgeNumber: null as number | null,
  fieldsReads: 0,
  quotes: [] as { kind: string; tierId: string | null; bump: string | null }[],
  buys: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  created: {} as Record<string, Record<string, unknown>>,
  purchase: null as null | Record<string, unknown>,
  polls: 0,
  payments: 0,
};

function quoteFor(kind: string, tierId: string, bump: boolean) {
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[2];
  const held = TIERS.find((t) => t.id === 'verify');
  const plan = (kind === 'upgrade' && held ? tier.priceMinor - held.priceMinor : tier.priceMinor) + hub.priceDrift;
  const bumpMinor = bump ? BUMP.priceMinor : 0;
  const price = plan + bumpMinor;
  const fee = hub.providerFee + hub.wawuFee;
  const total = price + fee;
  const balance = hub.shortfall ? 320_000 : hub.balanceKobo;
  return {
    kind,
    tierId: tier.id,
    fromTierId: kind === 'upgrade' ? 'verify' : null,
    bump,
    currency: 'NGN',
    planMinor: plan,
    bumpMinor,
    bumpPoints: bump ? BUMP.points : 0,
    paymentKind: bump ? 'tier_bump' : 'tier',
    payment: {
      kind: bump ? 'tier_bump' : 'tier',
      targetId: tier.id,
      title: tier.name,
      payee: null,
      priceKobo: price,
      fee: { providerFeeKobo: hub.providerFee, wawuFeeKobo: hub.wawuFee, totalFeeKobo: fee },
      totalKobo: total,
      balanceKobo: balance,
      shortfallKobo: Math.max(0, total - balance),
      willBeHeld: false,
      withinDailyLimit: true,
      remainingTodayKobo: null,
      quoteToken: `tok-${tier.id}-${bump ? 'b' : 'p'}-${total}`,
      expiresAt: '2099-01-01T00:00:00.000Z',
    },
  };
}

function purchaseOf(status: string, body: Record<string, unknown>) {
  const tier = TIERS.find((t) => t.id === body.tierId) ?? TIERS[2];
  const bump = body.bump === true;
  const method = String(body.method);
  const q = quoteFor(String(body.kind), tier.id, bump);
  return {
    id: PURCHASE_ID,
    kind: body.kind,
    tierId: tier.id,
    fromTierId: null,
    bump,
    method,
    currency: 'NGN',
    amountMinor: q.payment.priceKobo,
    status,
    statusMessage: status === 'failed' ? 'The bank did not take this payment.' : status === 'pending' ? 'Waiting for the bank.' : null,
    payment: null,
    transfer:
      status === 'awaiting_transfer'
        ? { accountNumber: '9021184473', accountName: 'Test Holder', bankName: 'Test MFB', bankCode: '090', priceKobo: q.payment.priceKobo, bankChargeKobo: BANK_CHARGE, totalKobo: q.payment.totalKobo, balanceKobo: 320_000, amountNeededKobo: q.payment.totalKobo - 320_000, expiresAt: '2099-01-01T00:00:00.000Z' }
        : null,
    grant:
      status === 'paid'
        ? {
            tier: { id: tier.id, name: tier.name, badge: tier.badge },
            activeFrom: '2026-10-17T00:00:00.000Z',
            activeUntil: '2027-10-17T00:00:00.000Z',
            productsAllowed: tier.products,
            bonusPoints: tier.bonusPoints,
            bonusPointsExpireAt: '2027-10-17T00:00:00.000Z',
            bumpPoints: bump ? BUMP.points : 0,
            bumpPointsExpireAt: bump ? '2027-10-17T00:00:00.000Z' : null,
            eventPass: tier.eventPass,
            firstVoiceIntroIncluded: true,
          }
        : null,
    createdAt: '2026-10-17T09:42:00.000Z',
    paidAt: status === 'paid' ? '2026-10-17T09:42:05.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/users/me') return ok({ wawuUserId: '00000000-0000-4000-8000-0000000000a7', accountType: hub.accountType });
  if (path === '/plans') {
    const cents: Record<string, number> = { verify: 300, plus: 900, founding: 1500 };
    const tiers = hub.usd ? TIERS.map((t) => ({ ...t, priceMinor: cents[t.id] })) : TIERS;
    return ok({ currency: hub.usd ? 'USD' : 'NGN', currencyFixed: false, tiers, extraProducts: { count: 5, priceMinor: 150_000 }, packs: [], checkoutBump: BUMP, actions: [], caps: {} });
  }
  if (path === '/users/me/profile-fields') {
    hub.fieldsReads += 1;
    const badge = hub.badgeNumber === null ? null : { id: 'founding', name: 'Founding Maker', numbered: true, number: hub.badgeNumber };
    return ok({ wawuUserId: '00000000-0000-4000-8000-0000000000a7', location: null, countryCode: null, countryName: null, regionCode: null, regionName: null, city: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null, badge });
  }
  if (path === '/me/tier') {
    if (hub.held === 'none') return ok({ state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null });
    return ok({ state: 'active', tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } }, activeFrom: '2026-10-01T00:00:00.000Z', activeUntil: hub.until ?? HELD_UNTIL, productsAllowed: 3, productsUsed: 2, extraProducts: 0, pointsIncluded: 100, firstVoiceIntroIncluded: true, eventPass: PASS.verify });
  }
  if (path === '/plans/purchases/quote') {
    hub.quotes.push({ kind: url.searchParams.get('kind') ?? '', tierId: url.searchParams.get('tierId'), bump: url.searchParams.get('bump') });
    return ok(quoteFor(url.searchParams.get('kind') ?? 'tier', url.searchParams.get('tierId') ?? 'founding', url.searchParams.get('bump') === 'true'));
  }
  if (path === '/plans/purchases' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const pin = request.headers.get('x-transaction-pin');
    const key = request.headers.get('idempotency-key') ?? '';
    hub.buys.push({ pin, key, body });
    // The Hub answers a key it knows with the first purchase, before it looks at the PIN or the quote.
    if (hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (hub.mode === 'wrongfirst' && hub.buys.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'changed' && hub.buys.length === 1) {
      hub.priceDrift = 5000;
      return refuse(409, { code: 'quote_changed', message: 'The price changed.' });
    }
    const status = body.method === 'transfer' ? 'awaiting_transfer' : hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'paid';
    const made = purchaseOf(status, body);
    hub.created[key] = made;
    hub.purchase = made;
    hub.payments += 1;
    if (hub.mode === 'lost' && hub.payments === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: made });
  }
  if (path === `/plans/purchases/${PURCHASE_ID}` && method === 'GET') {
    hub.polls += 1;
    if (hub.purchase && (hub.purchase.status === 'pending' || hub.purchase.status === 'awaiting_transfer') && hub.polls >= 2) {
      hub.purchase = purchaseOf('paid', { kind: hub.purchase.kind, tierId: hub.purchase.tierId, bump: hub.purchase.bump, method: hub.purchase.method });
    }
    return ok(hub.purchase);
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
function Where() {
  const params = useLocalSearchParams();
  return (
    <View>
      <Text testID="where">{`${usePathname()}?${new URLSearchParams(params as Record<string, string>).toString()}`}</Text>
    </View>
  );
}
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
        <Where />
      </View>
    );
  }
  return Stub;
};

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    wallet: stub('Wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'add-money': stub('Add money'),
    index: stub('Home'),
    tiers: page('@/app/tiers'),
    checkout: page('@/app/checkout'),
    'tier-done': page('@/app/tier-done'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/tiers' });
  await unmount();
}, 60_000);

beforeEach(() => {
  pinClock(TODAY);
  Object.assign(hub, { mode: 'ok', usd: false, accountType: 'creator', held: 'none', until: null, balanceKobo: 48_525_075, shortfall: false, priceDrift: 0, providerFee: BANK_CHARGE, wawuFee: 0, badgeNumber: null, fieldsReads: 0, quotes: [], buys: [], created: {}, purchase: null, polls: 0, payments: 0 });
  (require('../purchaseIntent') as { forgetIntentInMemory: () => void }).forgetIntentInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000a7'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});

const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
async function toCheckout(path = '/checkout?kind=tier&tier=founding') {
  await renderRouter(routes, { initialUrl: path });
  await screen.findByTestId('checkout-fees');
}
async function pay(pin = '1234') {
  await fireEvent.press(screen.getByTestId('checkout-pay'));
  await screen.findByText(/ for the Founding Maker tier/);
  await tap(pin);
}

describe('VF5 · Make it official', () => {
  it('a user sees the Hub’s tiers with Founding Maker chosen, and Continue opens the checkout with it', async () => {
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByTestId('tier-founding').props.accessibilityState.checked).toBe(true);
    expect(screen.getByText('₦1,000')).toBeTruthy();
    expect(screen.getByText('₦5,000')).toBeTruthy();
    expect(screen.getByText('30 days · 3 products · 100 points · Watch live, apply')).toBeTruthy();
    expect(screen.getByText('Numbered Founding badge, 10% bonus on points packs')).toBeTruthy();
    expect(screen.getByText('Best')).toBeTruthy();
    expect(screen.queryByText(/Example values|Fintava/)).toBeNull();
    expect(screen.getByText('Continue with Founding Maker')).toBeTruthy();
    // Choosing another tier changes the button.
    await fireEvent.press(screen.getByTestId('tier-plus'));
    expect(await screen.findByText('Continue with Verify Plus')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tiers-continue'));
    expect(await screen.findByTestId('checkout-screen')).toBeTruthy();
  });

  it('Continue closes the sheet before the checkout shows, so Pay is not under a Modal, and back from the checkout opens it again as it was (S7 F1)', async () => {
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    await fireEvent.press(screen.getByTestId('tier-plus'));
    await fireEvent.press(screen.getByTestId('tiers-continue'));
    await screen.findByTestId('checkout-fees');
    // The sheet (the tiers screen's Modal) holds nothing while the checkout is in front: a Modal left open would cover Pay on a phone.
    // Hidden elements are counted on purpose: the stack hides the screen under the checkout, but a real Modal sits above the stack.
    const all = { includeHiddenElements: true } as const;
    expect(screen.queryByTestId('tiers-continue', all)).toBeNull();
    expect(screen.queryByTestId('tiers-list', all)).toBeNull();
    expect(screen.queryByRole('dialog', all)).toBeNull();
    expect(screen.getByTestId('checkout-pay')).toBeTruthy();
    // Back from the checkout is the tiers again, with the choice made there.
    await fireEvent.press(screen.getByTestId('points-back'));
    await screen.findByTestId('tiers-list');
    expect(screen.getByTestId('tier-plus').props.accessibilityState.checked).toBe(true);
    expect(screen.getByText('Continue with Verify Plus')).toBeTruthy();
  });

  it('two taps on Continue open one checkout', async () => {
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    const go = screen.getByTestId('tiers-continue');
    await fireEvent.press(go);
    await fireEvent.press(go);
    await screen.findByTestId('checkout-fees');
    await fireEvent.press(screen.getByTestId('points-back'));
    await screen.findByTestId('tiers-list');
    expect(screen.queryByTestId('checkout-screen')).toBeNull();
  });

  it('a person on Verify sees their own tier and the others at the Hub’s difference (VF5b), and Upgrade opens the checkout for an upgrade', async () => {
    hub.held = 'verify';
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    expect(screen.getByTestId('tiers-title')).toHaveTextContent('Upgrade your tier');
    expect(screen.getByTestId('tiers-blurb')).toHaveTextContent("You're on Verify until 26 Nov. Pay only the difference.");
    expect(screen.getByText('Your tier')).toBeTruthy();
    expect(screen.getByText('₦2,000')).toBeTruthy();
    expect(screen.getByText('₦4,000')).toBeTruthy();
    expect(screen.getAllByText('pay only')).toHaveLength(2);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText('Upgrade · pay ₦4,000')).toBeTruthy();
    expect(hub.quotes.every((q) => q.kind === 'upgrade')).toBe(true);
    const before = hub.quotes.length;
    await fireEvent.press(screen.getByTestId('tiers-continue'));
    expect(await screen.findByTestId('checkout-screen')).toBeTruthy();
    // The sheet is closed once the checkout shows (S7 F1), and the checkout asks for the upgrade without the offer (S7 F2).
    expect(screen.queryByTestId('tiers-continue', { includeHiddenElements: true })).toBeNull();
    await waitFor(() => expect(hub.quotes.slice(before).some((q) => q.kind === 'upgrade' && q.tierId === 'founding' && q.bump === 'false')).toBe(true));
    expect(hub.quotes.slice(before).some((q) => q.bump === 'true')).toBe(false);
  });

  /*
   * A tier's end date carries its year when it is not this year (VF5b, FIX-78 F-3), and "this year" is the Lagos year: 23:00 UTC on 31 Dec is
   * already midnight on 1 Jan in Lagos. Each row is read at a pinned instant, so the rows hold at every moment of the real year, the hour
   * around New Year included: 23:30 UTC on 31 Dec is 00:30 on 1 Jan in Lagos.
   */
  it.each([
    { now: '2026-10-18T09:00:00.000Z', until: '2027-07-15T10:00:00.000Z', when: 'until 15 Jul 2027' },
    { now: '2026-12-31T22:59:59.000Z', until: '2027-07-15T10:00:00.000Z', when: 'until 15 Jul 2027' },
    { now: '2026-12-31T23:00:00.000Z', until: '2027-07-15T10:00:00.000Z', when: 'until 15 Jul' },
    { now: '2026-12-31T23:30:00.000Z', until: '2027-07-15T10:00:00.000Z', when: 'until 15 Jul' },
    { now: '2027-01-01T00:30:00.000Z', until: '2027-07-15T10:00:00.000Z', when: 'until 15 Jul' },
    { now: '2026-12-31T23:30:00.000Z', until: '2027-01-01T10:00:00.000Z', when: 'until 1 Jan' },
  ])('a person on a tier ending $until, read at $now, is told "$when" (VF5b)', async ({ now, until, when }) => {
    pinClock(now);
    hub.held = 'verify';
    hub.until = until;
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    expect(screen.getByTestId('tiers-blurb')).toHaveTextContent(new RegExp(`^You're on Verify ${when}\\. Pay only the difference\\.$`));
  });
});

describe('VF6 and VF7 · pay with the PIN', () => {
  it('a user sees the tier, the way to pay, the offer unticked and the tier’s own total with the Bank charge, pays once with the PIN, and lands on what the Hub granted', async () => {
    await toCheckout();
    expect(screen.getByTestId('checkout-line')).toHaveTextContent('12 months · 10 products');
    expect(screen.getByText('Balance ₦485,250.75')).toBeTruthy();
    // The offer adds to the amount paid, so it starts unticked (S7 F2): Pay is the tier alone until the person opts in.
    expect(screen.getByTestId('checkout-bump').props.accessibilityState.checked).toBe(false);
    expect(screen.getByText('Add 1,000 points for ₦800')).toBeTruthy();
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/₦5,025/);
    // The fee is its parts then the total (BRIEF rule 3): the price, the Bank charge, WAWU's fee, the Total. This one assertion pinned the
    // one-line "₦5,000 + ₦25 Bank charge" note, which RELEASE-02 second pass M-1 replaces.
    expect(screen.getByTestId('checkout-price')).toHaveTextContent(/₦5,000/);
    expect(screen.getByTestId('checkout-bank-charge')).toHaveTextContent(/Bank charge.*₦25/);
    expect(screen.getByTestId('checkout-wawu-fee')).toHaveTextContent(/WAWU.s fee.*₦0/);
    expect(screen.getByText('Pay ₦5,025')).toBeTruthy();
    expect(hub.quotes.every((q) => q.bump === 'false')).toBe(true);
    // The wallet covers it, so the Hub pays from the wallet and no transfer card is offered (POINTS-06's ruling).
    expect(screen.queryByTestId('checkout-method-transfer')).toBeNull();
    await pay();
    expect(await screen.findByTestId('official-title')).toHaveTextContent("You're official");
    expect(screen.getByTestId('official-points')).toHaveTextContent(/^Points added600$/);
    expect(screen.getByTestId('official-products')).toHaveTextContent(/10$/);
    expect(screen.getByTestId('official-pass')).toHaveTextContent(/Maker Pass, priority/);
    expect(hub.buys).toHaveLength(1);
    expect(hub.buys[0].pin).toBe('1234');
    expect(hub.buys[0].body).toEqual({ kind: 'tier', tierId: 'founding', bump: false, method: 'wallet', expectedTotalKobo: 502_500, quoteToken: 'tok-founding-p-502500' });
    expect(Object.values(hub.buys[0].body)).not.toContain('1234');
    expect(hub.payments).toBe(1);
    // The board's "Record my voice" opens VF8, which VERIFY-03 built: it is drawn now, in the place of Done (this one assertion pinned
    // the state before VERIFY-03, by its own comment).
    expect(screen.getByTestId('official-voice')).toBeTruthy();
    expect(screen.queryByTestId('official-done')).toBeNull();
    // No dead end: the shared header's back is the way out for a person who does not record (the board draws no second button).
    expect(screen.getByTestId('points-back')).toBeTruthy();
  });

  it('L-p2-4: the Founding Maker success shows the badge with the number the Hub gave it', async () => {
    hub.badgeNumber = 128;
    await toCheckout();
    await pay();
    expect(await screen.findByTestId('official-title')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('official-badge')).toHaveTextContent('Founding Maker #128'));
  });

  it('L-p2-4: a Founding badge the Hub has not numbered yet shows the name alone, never a number of the app\u2019s own', async () => {
    hub.badgeNumber = null;
    await toCheckout();
    await pay();
    expect(await screen.findByTestId('official-title')).toBeTruthy();
    await waitFor(() => expect(hub.fieldsReads).toBeGreaterThan(0));
    expect(screen.getByTestId('official-badge')).toHaveTextContent(/^Founding Maker$/);
  });

  it('L-p2-4: a tier with no numbered badge never asks for the number', async () => {
    await toCheckout('/checkout?kind=tier&tier=verify');
    await fireEvent.press(screen.getByTestId('checkout-pay'));
    await screen.findByText(/ for the Verify tier/);
    await tap('1234');
    expect(await screen.findByTestId('official-title')).toBeTruthy();
    expect(screen.getByTestId('official-badge')).toHaveTextContent(/^Verify$/);
    expect(hub.fieldsReads).toBe(0);
  });

  it('M-1: a fee of ₦0 is still drawn as its parts, never "No fee", and Pay and the PIN sheet carry the total', async () => {
    hub.providerFee = 0;
    hub.wawuFee = 0;
    await toCheckout();
    expect(screen.getByTestId('checkout-price')).toHaveTextContent(/Price.*₦5,000/);
    expect(screen.getByTestId('checkout-bank-charge')).toHaveTextContent(/Bank charge.*₦0/);
    expect(screen.getByTestId('checkout-wawu-fee')).toHaveTextContent(/WAWU.s fee.*₦0/);
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/Total.*₦5,000/);
    expect(screen.queryByText(/no fee/i)).toBeNull();
    expect(screen.getByText('Pay ₦5,000')).toBeTruthy();
    await pay();
    expect(await screen.findByTestId('official-title')).toBeTruthy();
    expect(hub.buys[0].body.expectedTotalKobo).toBe(500_000);
  });

  it('M-1: both parts of a real fee are drawn and add up to the total on the button and the PIN sheet', async () => {
    hub.providerFee = 2325;
    hub.wawuFee = 1000;
    await toCheckout();
    expect(screen.getByTestId('checkout-price')).toHaveTextContent(/₦5,000/);
    expect(screen.getByTestId('checkout-bank-charge')).toHaveTextContent(/Bank charge.*₦23\.25/);
    expect(screen.getByTestId('checkout-wawu-fee')).toHaveTextContent(/WAWU.s fee.*₦10/);
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/₦5,033\.25/);
    expect(screen.getByText('Pay ₦5,033.25')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('checkout-pay'));
    await screen.findByText(/₦5,033\.25 for the Founding Maker tier/);
    await tap('1234');
    await screen.findByTestId('official-title');
    expect(hub.buys[0].body.expectedTotalKobo).toBe(503_325);
  });

  it('M-1: an upgrade draws the breakdown too, from the quote for the difference', async () => {
    hub.held = 'verify';
    hub.providerFee = 0;
    await toCheckout('/checkout?kind=upgrade&tier=founding');
    expect(screen.getByTestId('checkout-price')).toHaveTextContent(/₦4,000/);
    expect(screen.getByTestId('checkout-bank-charge')).toHaveTextContent(/₦0/);
    expect(screen.getByTestId('checkout-wawu-fee')).toHaveTextContent(/₦0/);
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/₦4,000/);
    expect(screen.queryByText(/no fee/i)).toBeNull();
    expect(screen.getByText('Pay ₦4,000')).toBeTruthy();
  });

  it('a user who ticks the offer pays the tier and the offer, and the Hub is sent it', async () => {
    await toCheckout();
    await fireEvent.press(screen.getByTestId('checkout-bump'));
    await screen.findByText('Pay ₦5,825');
    expect(screen.getByTestId('checkout-bump').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('checkout-price')).toHaveTextContent(/₦5,800/);
    expect(screen.getByTestId('checkout-bank-charge')).toHaveTextContent(/₦25/);
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/₦5,825/);
    await pay();
    expect(await screen.findByTestId('official-points')).toHaveTextContent(/600 \+ 1,000/);
    expect(hub.buys[0].body).toEqual({ kind: 'tier', tierId: 'founding', bump: true, method: 'wallet', expectedTotalKobo: 582_500, quoteToken: 'tok-founding-b-582500' });
  });

  it('a user who taps Pay twice is asked for one PIN and debited once (V8)', async () => {
    await toCheckout();
    const before = hub.quotes.length;
    await fireEvent.press(screen.getByTestId('checkout-pay'));
    await fireEvent.press(screen.getByTestId('checkout-pay'));
    await screen.findByText(/ for the Founding Maker tier/);
    // One fresh quote for the tap pair, and one PIN sheet.
    expect(hub.quotes.length - before).toBe(1);
    await tap('1234');
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('a wrong PIN sends the same key again with the right one, and the Hub debits once', async () => {
    hub.mode = 'wrongfirst';
    await toCheckout();
    await pay('0000');
    expect(await screen.findByText(/4 tries left/)).toBeTruthy();
    await tap('1234');
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[1].key).toBe(hub.buys[0].key);
    expect(hub.payments).toBe(1);
  });

  it('a lost answer is sent again as it was: one key, one debit, one tier (V8)', async () => {
    hub.mode = 'lost';
    await toCheckout();
    await pay();
    // The Hub took it and the answer never came back: the PIN is asked for again, never a new quote.
    await waitFor(() => expect(hub.buys).toHaveLength(1));
    const quotesAfterFirst = hub.quotes.length;
    await tap('1234');
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[1].key).toBe(hub.buys[0].key);
    expect(hub.buys[1].body).toEqual(hub.buys[0].body);
    expect(hub.quotes.length).toBe(quotesAfterFirst);
    expect(hub.payments).toBe(1);
  });

  it('a price that moved is shown and nothing is sent until the next Pay', async () => {
    hub.mode = 'changed';
    await toCheckout();
    await pay();
    expect(await screen.findByText('Pay ₦5,075')).toBeTruthy();
    expect(hub.buys).toHaveLength(1);
    expect(hub.payments).toBe(0);
    await pay();
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[1].key).not.toBe(hub.buys[0].key);
    expect(hub.buys[1].body).toMatchObject({ bump: false, expectedTotalKobo: 507_500 });
    expect(hub.payments).toBe(1);
  });

  it('a payment the bank has not confirmed is read by its id, never sent again, and ends on the grant', async () => {
    hub.mode = 'pending';
    await toCheckout();
    await pay();
    expect(await screen.findByTestId('checkout-confirming')).toBeTruthy();
    expect(screen.getByText('Paying...')).toBeTruthy();
    await sleep(4100);
    await sleep(4100);
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(1);
    expect(hub.polls).toBeGreaterThanOrEqual(2);
  });
});

describe('VF6a to VF6d · the states', () => {
  it('a wallet that is short shows what is needed and what it has, disables Pay, and Add money opens W15 with the shortfall', async () => {
    hub.shortfall = true;
    await toCheckout();
    expect(screen.getByTestId('checkout-short')).toBeTruthy();
    expect(screen.getByText('You need ₦5,025. Your wallet has ₦3,200.')).toBeTruthy();
    expect(screen.getByTestId('checkout-pay')).toBeDisabled();
    // A short wallet may pay by bank transfer instead (the Hub gives the wallet's own account with the PIN).
    expect(screen.getByTestId('checkout-method-transfer')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('checkout-add-money'));
    expect(await screen.findByTestId('where')).toHaveTextContent('/add-money?short=182500');
    expect(hub.buys).toHaveLength(0);
  });

  it('a short wallet that picks Bank transfer sees the wallet’s own account and the amount to send, and the tier lands when the money does', async () => {
    hub.shortfall = true;
    await toCheckout();
    await fireEvent.press(screen.getByTestId('checkout-method-transfer'));
    await pay();
    expect(await screen.findByTestId('transfer-number')).toHaveTextContent(/9021184473/);
    expect(screen.getByTestId('transfer-amount')).toHaveTextContent(/₦1,825/);
    expect(screen.getByTestId('transfer-bank')).toHaveTextContent(/Test MFB/);
    expect(screen.getByTestId('checkout-sent')).toBeTruthy();
    expect(hub.buys[0].body).toMatchObject({ method: 'transfer' });
    await sleep(4100);
    await sleep(4100);
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(1);
  });

  it('RELEASE-02 fix round 1: a wallet that covers the total draws no Bank transfer row, and Pay sends method wallet (the Hub settles a transfer order from a covering wallet, so the row would charge the wallet)', async () => {
    await toCheckout();
    expect(screen.getByText('Balance ₦485,250.75')).toBeTruthy();
    expect(screen.queryByTestId('checkout-method-transfer')).toBeNull();
    expect(screen.queryByText('Bank transfer')).toBeNull();
    expect(screen.getByTestId('checkout-method-wallet').props.accessibilityState.checked).toBe(true);
    await pay();
    await screen.findByTestId('official-title');
    expect(hub.buys).toHaveLength(1);
    expect(hub.buys[0].body).toMatchObject({ method: 'wallet' });
  });

  it('RELEASE-02 fix round 1: a short wallet draws the Bank transfer row beside the wallet, the wallet chosen, and the row can be picked', async () => {
    hub.shortfall = true;
    await toCheckout();
    expect(screen.getByTestId('checkout-method-transfer')).toBeTruthy();
    expect(screen.getByText('Bank transfer')).toBeTruthy();
    expect(screen.getByTestId('checkout-method-wallet').props.accessibilityState.checked).toBe(true);
    await fireEvent.press(screen.getByTestId('checkout-method-transfer'));
    expect(screen.getByTestId('checkout-method-transfer').props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId('checkout-pay')).toBeEnabled();
  });

  it('SWEEP-R2 (VF6): the chosen way to pay is a card of its own with the accent ring and tint, the other a hairline card; picking the other swaps them', async () => {
    hub.shortfall = true;
    await toCheckout();
    const flat = (value: unknown): Record<string, unknown> => Object.assign({}, ...[value].flat(Infinity).filter(Boolean));
    const style = (id: string) => flat(screen.getByTestId(id).props.style);
    const ring = (id: string) => (style(id).boxShadow as { spreadDistance: number; color: string; inset: boolean }[])?.[0];
    expect(ring('checkout-method-wallet')).toMatchObject({ spreadDistance: 2, color: lightColors.accent, inset: true });
    expect(style('checkout-method-wallet').backgroundColor).toBe(lightColors.accentTint);
    expect(ring('checkout-method-transfer')).toMatchObject({ spreadDistance: 1, color: lightColors.borderHairline, inset: true });
    expect(style('checkout-method-transfer').backgroundColor).toBe(lightColors.surfaceCard);
    expect(style('checkout-method-wallet').borderRadius).toBe(radius.card);
    await fireEvent.press(screen.getByTestId('checkout-method-transfer'));
    expect(ring('checkout-method-transfer')).toMatchObject({ spreadDistance: 2, color: lightColors.accent });
    expect(style('checkout-method-transfer').backgroundColor).toBe(lightColors.accentTint);
    expect(ring('checkout-method-wallet')).toMatchObject({ spreadDistance: 1, color: lightColors.borderHairline });
  });

  it('a refused payment shows the Hub’s own words, grants nothing, and can be tried again', async () => {
    hub.mode = 'failed';
    await toCheckout();
    await pay();
    expect(await screen.findByTestId('checkout-failed')).toBeTruthy();
    expect(screen.getByTestId('checkout-failed-line')).toHaveTextContent('The bank did not take this payment.');
    expect(screen.queryByTestId('official-title')).toBeNull();
    expect(screen.getByTestId('checkout-pay')).toBeEnabled();
  });
});


describe('RELEASE-02 · CHECK-3 D-1, a person the Hub bills in dollars', () => {
  it('sees the Hub’s dollar prices with the dollar sign, never a naira sign, and Continue explains instead of opening a naira checkout', async () => {
    hub.usd = true;
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    expect(screen.getByText('$3')).toBeTruthy();
    expect(screen.getByText('$9')).toBeTruthy();
    expect(screen.getByText('$15')).toBeTruthy();
    expect(screen.queryByText(/₦/)).toBeNull();
    await fireEvent.press(screen.getByTestId('tiers-continue'));
    // The Hub takes a tier payment only from a naira wallet, so there is no checkout to open: the sheet says so, plainly.
    expect(await screen.findByTestId('tiers-dollars')).toBeTruthy();
    expect(screen.getByText("Paying in dollars isn't open yet")).toBeTruthy();
    expect(screen.queryByTestId('checkout-screen')).toBeNull();
    expect(hub.quotes).toHaveLength(0);
    expect(hub.buys).toHaveLength(0);
  });

  it('is led to the wallet to add a dollar account, and no wallet is opened to pay dollars', async () => {
    hub.usd = true;
    await renderRouter(routes, { initialUrl: '/tiers' });
    await screen.findByTestId('tiers-list');
    await fireEvent.press(screen.getByTestId('tiers-continue'));
    await fireEvent.press(await screen.findByText('Add a dollar account'));
    // The dollar account is asked for through the route (`add`), so the wallet opens with US dollar as the first account.
    expect(await screen.findByTestId('where')).toHaveTextContent('/wallet?add=USD');
    expect(screen.queryByText('Open your wallet')).toBeNull();
    expect(hub.buys).toHaveLength(0);
  });
});

describe('RELEASE-02 · CHECK-3 D-2, money is never taken and then led to a screen that bounces', () => {
  it('a creator who paid is offered "Record my voice"', async () => {
    await toCheckout();
    await pay();
    await screen.findByTestId('official-title');
    expect(screen.getByTestId('official-voice')).toBeTruthy();
  });

  it('a fan who paid (a user account) ends on Done: "Record my voice" is not drawn, because the voice screens would send them Home', async () => {
    hub.accountType = 'user';
    await toCheckout();
    await pay();
    await screen.findByTestId('official-title');
    expect(screen.getByTestId('official-done')).toBeTruthy();
    expect(screen.queryByTestId('official-voice')).toBeNull();
  });
});
