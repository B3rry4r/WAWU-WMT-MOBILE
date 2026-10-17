/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Buy points (POINTS-06) on the real Expo Router stack: PT4 (the packs, the way to pay, Pay), PT4b (paying) and PT4c (points added) as
 * the real route file, and the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the Hub's
 * shapes (the plans, the pack quote with its payment quote, the purchase), records every purchase's headers and body, and answers a
 * key it knows with its first purchase, as the Hub does.
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

const PACKS = [
  { id: 'pack_s', points: 1000, priceMinor: 100_000 },
  { id: 'pack_m', points: 2750, priceMinor: 250_000 },
  { id: 'pack_l', points: 6000, priceMinor: 500_000 },
];
const TIERS = [
  { id: 'verify', name: 'Verify', packBonusPercent: 0 },
  { id: 'founding', name: 'Founding Maker', packBonusPercent: 10 },
];
const BANK_CHARGE = 2325;
const PURCHASE_ID = '55555555-5555-4555-8555-555555555555';

type Mode = 'ok' | 'pending' | 'awaiting' | 'lost' | 'changed' | 'refused' | 'wrongfirst' | 'failed';
const hub = {
  mode: 'ok' as Mode,
  tier: 'none' as 'none' | 'founding' | 'verify',
  balanceKobo: 48_525_075,
  shortfall: false,
  expiryDays: 365,
  priceDrift: 0,
  needed: null as number | null,
  quotes: [] as string[],
  buys: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  created: {} as Record<string, Record<string, unknown>>,
  purchase: null as null | Record<string, unknown>,
  polls: 0,
  payments: 0,
  points: 1240,
};

function packQuote(packId: string) {
  const pack = PACKS.find((p) => p.id === packId) ?? PACKS[1];
  const percent = hub.tier === 'founding' ? 10 : 0;
  const bonus = Math.floor((pack.points * percent) / 100);
  const price = pack.priceMinor + hub.priceDrift;
  const total = price + BANK_CHARGE;
  return {
    kind: 'points_pack',
    packId: pack.id,
    currency: 'NGN',
    packMinor: price,
    points: pack.points,
    bonusPercent: percent,
    bonusPoints: bonus,
    totalPoints: pack.points + bonus,
    expiryDays: hub.expiryDays,
    paymentKind: 'points_pack',
    payment: {
      kind: 'points_pack',
      targetId: `pack-${pack.id}`,
      title: `${pack.points} points`,
      payee: null,
      priceKobo: price,
      fee: { providerFeeKobo: BANK_CHARGE, wawuFeeKobo: 0, totalFeeKobo: BANK_CHARGE },
      totalKobo: total,
      balanceKobo: hub.shortfall ? 100_000 : hub.balanceKobo,
      shortfallKobo: hub.shortfall ? total - 100_000 : 0,
      willBeHeld: false,
      withinDailyLimit: true,
      remainingTodayKobo: null,
      quoteToken: `tok-${pack.id}-${total}`,
      expiresAt: '2099-01-01T00:00:00.000Z',
    },
  };
}

function purchase(status: string, body: Record<string, unknown>, method = 'wallet') {
  const quote = packQuote(String(body.packId));
  return {
    id: PURCHASE_ID,
    kind: 'points_pack',
    packId: quote.packId,
    method,
    currency: 'NGN',
    amountMinor: quote.packMinor,
    points: quote.points,
    bonusPoints: quote.bonusPoints,
    status,
    statusMessage: status === 'pending' ? 'Waiting for the bank.' : status === 'failed' ? 'The bank did not take this payment.' : null,
    payment: null,
    transfer:
      status === 'awaiting_transfer'
        ? { accountNumber: '8100000417', accountName: 'Test Holder', bankName: 'Test MFB', bankCode: '090', priceKobo: quote.packMinor, bankChargeKobo: BANK_CHARGE, totalKobo: quote.payment.totalKobo, balanceKobo: 0, amountNeededKobo: hub.needed ?? quote.payment.totalKobo, expiresAt: '2099-01-01T00:00:00.000Z' }
        : null,
    grant: status === 'paid' ? { points: quote.points, bonusPoints: quote.bonusPoints, totalPoints: quote.totalPoints, expiresAt: '2027-10-16T00:00:00.000Z' } : null,
    createdAt: '2026-10-16T09:42:00.000Z',
    paidAt: status === 'paid' ? '2026-10-16T09:42:05.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/plans') return ok({ currency: 'NGN', currencyFixed: false, tiers: TIERS, packs: PACKS, extraProducts: {}, checkoutBump: {}, actions: [], caps: {} });
  if (path === '/me/tier') {
    if (hub.tier === 'none') return ok({ state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null });
    const t = TIERS.find((x) => x.id === hub.tier);
    return ok({ state: 'active', tier: { id: t?.id, name: t?.name, badge: null }, activeFrom: '2026-10-01T00:00:00.000Z', activeUntil: '2027-10-01T00:00:00.000Z', productsAllowed: 3, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null });
  }
  if (path === '/plans/purchases/quote') {
    hub.quotes.push(url.searchParams.get('packId') ?? '');
    return ok(packQuote(url.searchParams.get('packId') ?? ''));
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
    if (hub.mode === 'refused') return refuse(409, { code: 'target_not_payable', message: 'Points packs are not on sale for your account yet.' });
    const status = body.method === 'transfer' ? 'awaiting_transfer' : hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'paid';
    const made = purchase(status, body, String(body.method));
    hub.created[key] = made;
    hub.purchase = made;
    hub.payments += 1;
    if (status === 'paid') hub.points += Number(made.points) + Number(made.bonusPoints);
    if (hub.mode === 'lost' && hub.payments === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: made });
  }
  if (path === `/plans/purchases/${PURCHASE_ID}` && method === 'GET') {
    hub.polls += 1;
    if (hub.purchase && (hub.purchase.status === 'pending' || hub.purchase.status === 'awaiting_transfer') && hub.polls >= 2) {
      hub.purchase = purchase('paid', { packId: hub.purchase.packId }, String(hub.purchase.method));
      hub.points += Number(hub.purchase.points) + Number(hub.purchase.bonusPoints);
    }
    return ok(hub.purchase);
  }
  if (path === '/me/points') return ok({ balance: hub.points, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
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
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
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
    wallet: stub('Wallet tab'),
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'points-buy': page('@/app/points-buy'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/points-buy' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { mode: 'ok', tier: 'none', balanceKobo: 48_525_075, shortfall: false, expiryDays: 365, priceDrift: 0, needed: null, quotes: [], buys: [], created: {}, purchase: null, polls: 0, payments: 0, points: 1240 });
  (require('../buyIntent') as { forgetIntentInMemory: () => void }).forgetIntentInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f4'));
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
async function toBuy() {
  await renderRouter(routes, { initialUrl: '/points-buy' });
  await screen.findByTestId('pack-pack_m');
  await screen.findByTestId('buy-fees');
}
/** The router test library fakes the clock once it has rendered: time passes by being moved on. */
const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
async function pay(pin = '1234') {
  await fireEvent.press(screen.getByTestId('buy-pay'));
  await screen.findByText(/ for buying /);
  await tap(pin);
}

describe('PT4 · the packs and the way to pay', () => {
  it('a user sees the Hub’s packs with their prices, the middle one chosen, Pay as the total with the Bank charge, and how long points last', async () => {
    await toBuy();
    expect(screen.getAllByRole('radio').filter((r) => String(r.props.testID).startsWith('pack-'))).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /^1,000 points, ₦1,000/ })).toBeTruthy();
    expect(screen.getByTestId('pack-pack_m').props.accessibilityState.checked).toBe(true);
    expect(hub.quotes).toEqual(['pack_m']);
    expect(screen.getByText('Pay ₦2,523.25')).toBeTruthy();
    expect(screen.getByTestId('buy-fees')).toHaveTextContent('₦2,500 + ₦23.25 Bank charge');
    expect(screen.getByTestId('buy-blurb')).toHaveTextContent("For AI tools. Points don't expire for 12 months.");
    expect(screen.getByText('Who Made This? wallet')).toBeTruthy();
    expect(screen.getByText('₦485,250.75')).toBeTruthy();
    // POINTS-06 ruling: a wallet that covers the pack is paid from by the Hub, so Bank transfer is not offered.
    expect(screen.queryByText('Bank transfer')).toBeNull();
    expect(screen.queryByTestId('buy-method-transfer')).toBeNull();
    expect(screen.queryByText(/Example values|Fintava|Nuvion/)).toBeNull();
    // Choosing another pack asks the Hub for that pack's quote.
    await fireEvent.press(screen.getByTestId('pack-pack_l'));
    await waitFor(() => expect(hub.quotes).toEqual(['pack_m', 'pack_l']));
    expect(await screen.findByText('Pay ₦5,023.25')).toBeTruthy();
  });

  it('a Founding Maker sees the bonus the Hub returns on each pack; a person with no tier sees none', async () => {
    hub.tier = 'founding';
    await toBuy();
    expect(await screen.findAllByText('Founding +10%')).toHaveLength(3);
    await fireEvent.press(screen.getByTestId('pack-pack_l'));
    await screen.findByText('Pay ₦5,023.25');
    await pay();
    expect(await screen.findByTestId('buy-added-title')).toHaveTextContent('6,600 points added');
  });

  it('a person with no tier sees no bonus chip', async () => {
    await toBuy();
    expect(screen.queryByText(/\+10%|Founding/)).toBeNull();
  });
});

describe('PT4b and PT4c · paying with the PIN', () => {
  it('Pay opens the PIN with the total, sends the pack, the way, the total and the quote token (the PIN only in its header), and ends on PT4c with the balance', async () => {
    await toBuy();
    await pay();
    expect(await screen.findByTestId('buy-added-title')).toHaveTextContent('2,750 points added');
    expect(hub.buys).toHaveLength(1);
    expect(hub.buys[0].pin).toBe('1234');
    expect(hub.buys[0].body).toEqual({ kind: 'points_pack', packId: 'pack_m', method: 'wallet', expectedTotalKobo: 252_325, quoteToken: 'tok-pack_m-252325' });
    expect(Object.values(hub.buys[0].body)).not.toContain('1234');
    expect(await screen.findByTestId('buy-added-balance')).toHaveTextContent('Your balance is 3,990 points.');
    expect(hub.payments).toBe(1);
    await fireEvent.press(screen.getByTestId('buy-done'));
    await waitFor(() => expect(screen.queryByTestId('buy-added')).toBeNull());
  });

  it('a wrong PIN says how many tries are left and the right one sends the SAME key: one pack, one debit', async () => {
    hub.mode = 'wrongfirst';
    await toBuy();
    await pay('9999');
    expect(await screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('buy-added-title')).toBeTruthy();
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[0].key).toBe(hub.buys[1].key);
    expect(hub.payments).toBe(1);
  });

  it('a double tap on Pay asks for the price once and opens one PIN sheet', async () => {
    await toBuy();
    const asked = hub.quotes.length;
    const button = screen.getByTestId('buy-pay');
    await fireEvent.press(button);
    await fireEvent.press(button);
    await screen.findByText(/ for buying /);
    expect(hub.quotes.length).toBe(asked + 1);
    await tap('1234');
    expect(await screen.findByTestId('buy-added-title')).toBeTruthy();
    expect(hub.buys).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('an answer lost on the way, then a retry, sends the SAME request: one pack and one debit', async () => {
    hub.mode = 'lost';
    await toBuy();
    await pay();
    expect(await screen.findByText("We couldn't check your PIN. Try again.")).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('buy-added-title')).toBeTruthy();
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[0].key).toBe(hub.buys[1].key);
    expect(hub.buys[1].body).toEqual(hub.buys[0].body);
    expect(hub.payments).toBe(1);
  });

  it('a price that changed since the person looked puts the new total on screen and sends nothing until they tap Pay again', async () => {
    await toBuy();
    hub.priceDrift = 5000;
    await fireEvent.press(screen.getByTestId('buy-pay'));
    expect(await screen.findByText('The price changed. Check the new total before you pay.')).toBeTruthy();
    expect(await screen.findByText('Pay ₦2,573.25')).toBeTruthy();
    expect(hub.buys).toHaveLength(0);
    await pay();
    expect(await screen.findByTestId('buy-added-title')).toBeTruthy();
    expect(hub.buys[0].body).toMatchObject({ expectedTotalKobo: 257_325, quoteToken: 'tok-pack_m-257325' });
  });

  it('a wallet short of the total says so and Pay stays off; paying by bank transfer is still there', async () => {
    hub.shortfall = true;
    await toBuy();
    expect(await screen.findByTestId('buy-short')).toBeTruthy();
    expect(screen.getByTestId('buy-pay').props.accessibilityState?.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Add money' })).toBeNull();
    await fireEvent.press(screen.getByTestId('buy-method-transfer'));
    expect(screen.queryByTestId('buy-short')).toBeNull();
    expect(screen.getByTestId('buy-pay').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('a purchase the bank has not confirmed is PT4b: Paying, no second Pay, read by its id until it is decided', async () => {
    hub.mode = 'pending';
    await toBuy();
    await pay();
    await waitFor(() => expect(screen.getByTestId('buy-pay').props.accessibilityState?.disabled).toBe(true));
    expect(screen.getByText('Paying...')).toBeTruthy();
    await sleep(4100);
    await sleep(4100);
    expect(await screen.findByTestId('buy-added-title')).toBeTruthy();
    expect(hub.buys).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('a purchase the Hub refuses says why in its own words and Pay is there again', async () => {
    hub.mode = 'refused';
    await toBuy();
    await pay();
    expect(await screen.findByText('Points packs are not on sale for your account yet.')).toBeTruthy();
    expect(screen.queryByTestId('buy-added')).toBeNull();
    expect(screen.getByTestId('buy-pay').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('by bank transfer the PIN confirms it, the wallet’s own account is shown, and the points are added when the money lands', async () => {
    hub.shortfall = true;
    hub.needed = 152_325;
    await toBuy();
    await fireEvent.press(screen.getByTestId('buy-method-transfer'));
    await pay();
    expect(await screen.findByTestId('buy-transfer')).toBeTruthy();
    expect(hub.buys[0].body).toMatchObject({ method: 'transfer', packId: 'pack_m' });
    expect(screen.getByText('Test MFB')).toBeTruthy();
    expect(screen.getByText('8100000417')).toBeTruthy();
    expect(screen.getByTestId('transfer-amount')).toBeTruthy();
    expect(screen.getByText('Waiting for your transfer')).toBeTruthy();
    expect(screen.queryByTestId('buy-added')).toBeNull();
    await sleep(4100);
    await sleep(4100);
    expect(await screen.findByTestId('buy-added-title')).toHaveTextContent('2,750 points added');
    expect(hub.payments).toBe(1);
  });

  it('a wallet that covers the pack is not offered Bank transfer (the Hub pays from the wallet)', async () => {
    await toBuy();
    expect(screen.getByTestId('buy-method-wallet')).toBeTruthy();
    expect(screen.queryByTestId('buy-method-transfer')).toBeNull();
    expect(screen.queryByText('Bank transfer')).toBeNull();
    expect(screen.queryByTestId('buy-short')).toBeNull();
  });

  it('a short wallet is offered Bank transfer next to the wallet', async () => {
    hub.shortfall = true;
    await toBuy();
    expect(await screen.findByTestId('buy-short')).toBeTruthy();
    expect(screen.getByTestId('buy-method-wallet')).toBeTruthy();
    expect(screen.getByText('Bank transfer')).toBeTruthy();
  });

  it('by bank transfer when the money lands between the quote and the purchase (the Hub needs 0), the card shows the pack’s full price, never "Send ₦0.00"', async () => {
    hub.shortfall = true;
    hub.needed = 0;
    await toBuy();
    await fireEvent.press(screen.getByTestId('buy-method-transfer'));
    await pay();
    expect(await screen.findByTestId('buy-transfer')).toBeTruthy();
    expect(screen.getByTestId('transfer-amount')).toHaveTextContent(/₦2,523\.25/);
    expect(screen.queryByText(/₦0\.00/)).toBeNull();
  });

  it('by bank transfer with a short wallet, the card shows what is still needed', async () => {
    hub.shortfall = true;
    hub.needed = 152_325;
    await toBuy();
    await fireEvent.press(screen.getByTestId('buy-method-transfer'));
    await pay();
    expect(await screen.findByTestId('buy-transfer')).toBeTruthy();
    expect(screen.getByTestId('transfer-amount')).toHaveTextContent(/₦1,523\.25/);
  });
});
