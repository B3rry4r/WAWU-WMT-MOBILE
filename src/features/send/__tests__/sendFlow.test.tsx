/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Send to a WAWU user (WALLET-02) on the real Expo Router stack: W7 to W12 as their real route files, with the Wallet tab's own
 * Send button, and the Hub as a stand-in `fetch` installed before the app's modules load (the API client keeps the `fetch` it
 * finds when it is made). The stand-in answers in the Hub's shapes, records every send's headers and body, and can answer a send
 * as the Hub does when the PIN is wrong, the wallet is short, the fees moved, nothing comes back, or the provider has not decided.
 */
const mockVault = new Map<string, string>();
/** `fail`: a write of the payment intent throws. `hang`: it never answers. Only keys of the intent store are touched. */
const mockVaultFault = { fail: false, hang: false };
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (key.startsWith('wmt.send.intents.')) {
      if (mockVaultFault.fail) throw new Error('keychain unavailable');
      if (mockVaultFault.hang) await new Promise(() => undefined);
    }
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const AMAKA = { wawuUserId: '11111111-1111-4111-8111-111111111111', displayName: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, tick: 'creator' };
const CHIDI = { wawuUserId: '22222222-2222-4222-8222-222222222222', displayName: 'Chidi Eze', handle: 'chidieze', avatarUrl: null, tick: 'professional' };
const SEND_ID = '33333333-3333-4333-8333-333333333333';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

/** `lost`: the Hub takes the send and its answer never arrives. `lost_before`: the request never reaches the Hub. */
type SendMode = 'ok' | 'pending' | 'failed' | 'short' | 'changed' | 'no_answer' | 'no_pin' | 'blocked' | 'lost' | 'lost_before';
const hub = {
  mode: 'ok' as SendMode,
  pins: [] as string[],
  wrongFirst: false,
  balanceKobo: 48_525_075,
  recent: [AMAKA] as unknown[],
  quoteTotalExtra: 2575,
  recipientsError: null as null | { status: number; reason: Record<string, unknown> },
  sends: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  searches: [] as string[],
  saved: [] as { id: string; kind: string; wawuUser: unknown }[],
  stored: null as null | Record<string, unknown>,
  pollsLeftPending: 0,
  /** Every payment the Hub made, by Idempotency-Key: a key it knows is answered again, never paid again. */
  created: {} as Record<string, ReturnType<typeof transfer>>,
  attempted: new Set<string>(),
  payments: 0,
  quotes: 0,
  quoteTtlMs: null as number | null,
  limit: null as null | { remaining: number | null },
  quoteExpiredForSend: false,
  saveFails: false,
};

function quote(amountKobo: number, extra = hub.quoteTotalExtra, ttlMs: number | null = hub.quoteTtlMs) {
  const wawu = 1000;
  return {
    kind: 'wawu_transfer',
    billCategory: null,
    amountKobo,
    fee: { providerFeeKobo: extra - wawu, wawuFeeKobo: wawu, totalFeeKobo: extra },
    parts: [
      { code: 'balance_transfer', source: 'provider', amountKobo: extra - wawu },
      { code: 'wawu_fee', source: 'wawu', amountKobo: wawu },
    ],
    totalKobo: amountKobo + extra,
    withinDailyLimit: hub.limit === null,
    remainingTodayKobo: hub.limit ? hub.limit.remaining : null,
    quoteToken: `tok-${amountKobo}-${extra}`,
    expiresAt: ttlMs === null ? '2099-01-01T00:00:00.000Z' : new Date(Date.now() + ttlMs).toISOString(),
  };
}

function transfer(status: 'completed' | 'pending' | 'failed', body: Record<string, unknown>) {
  const amountKobo = Number(body.amountKobo);
  return {
    id: SEND_ID,
    kind: 'wawu_user',
    status,
    amountKobo,
    fee: { providerFeeKobo: 1575, wawuFeeKobo: 1000, totalFeeKobo: 2575 },
    totalKobo: Number(body.expectedTotalKobo),
    note: (body.note as string | undefined) ?? null,
    reference: 'wawu-send-8f2k91qx',
    toWawuUser: AMAKA,
    toBankAccount: null,
    timeline: [],
    failureReason: status === 'failed' ? 'The bank turned this send down.' : null,
    reversal: null,
    statusMessage: status === 'pending' ? 'Waiting for the bank.' : null,
    transactionId: null,
    createdAt: '2026-10-16T09:42:00.000Z',
    completedAt: status === 'completed' ? '2026-10-16T09:42:05.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/money/recipients/recent') {
    if (hub.recipientsError) return refuse(hub.recipientsError.status, hub.recipientsError.reason);
    return ok(hub.recent);
  }
  if (path === '/money/recipients') {
    const q = url.searchParams.get('q') ?? '';
    hub.searches.push(q);
    return ok([AMAKA, CHIDI].filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase()) || p.handle.includes(q.toLowerCase())));
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-16T09:00:00.000Z' });
  if (path === '/money/transfers/presets') return ok({ quickAmounts: [{ amountKobo: 500_000 }, { amountKobo: 1_000_000 }], noteMaxLength: 100 });
  if (path === '/money/fees/quote') {
    hub.quotes += 1;
    return ok(quote(Number(url.searchParams.get('amountKobo'))));
  }
  if (path === '/money/transfers/wawu' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const pin = request.headers.get('x-transaction-pin');
    const key = request.headers.get('idempotency-key') ?? '';
    hub.sends.push({ pin, key, body });
    // The Hub answers a key it knows with the first payment, before it looks at the PIN or the quote.
    if (hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (hub.mode === 'lost_before' && hub.attempted.size === 0) {
      hub.attempted.add(key);
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    if (hub.quoteExpiredForSend) return refuse(409, { code: 'quote_changed', message: 'The fees changed.', feeQuote: quote(Number(body.amountKobo), 3575, null) });
    if (hub.wrongFirst && hub.sends.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'no_answer' && hub.sends.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'no_pin') return refuse(409, { code: 'pin_not_set', message: 'Set your PIN first.' });
    if (hub.mode === 'blocked') return refuse(403, { code: 'recipient_blocked', message: 'You can’t send money to this person.' });
    if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough money.', balanceKobo: 100_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 100_000 });
    if (hub.mode === 'changed' && hub.sends.length === 1) return refuse(409, { code: 'quote_changed', message: 'The fees changed.', feeQuote: quote(Number(body.amountKobo), 3575, null) });
    const status = hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'completed';
    hub.stored = transfer(status, body);
    hub.created[key] = hub.stored as ReturnType<typeof transfer>;
    hub.payments += 1;
    if (status === 'pending') hub.pollsLeftPending = 1;
    if (hub.mode === 'lost' && hub.payments === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: hub.stored });
  }
  if (path === `/money/transfers/${SEND_ID}` && method === 'GET') {
    if (hub.stored && hub.stored.status === 'pending') {
      if (hub.pollsLeftPending > 0) hub.pollsLeftPending -= 1;
      else hub.stored = transfer('completed', { amountKobo: hub.stored.amountKobo, expectedTotalKobo: hub.stored.totalKobo, note: hub.stored.note });
    }
    return ok(hub.stored);
  }
  if (path === '/money/beneficiaries' && method === 'GET') return ok(hub.saved);
  if (path === '/money/beneficiaries' && method === 'POST') {
    if (hub.saveFails) return refuse(409, { code: 'beneficiary_limit', message: 'You have saved the most people you can.' });
    const row = { id: 'b-1', kind: 'wawu_user', wawuUser: AMAKA, bankAccount: null, createdAt: '2026-10-16T09:43:00.000Z' };
    hub.saved = [row];
    return ok(row);
  }
  if (path.startsWith('/money/beneficiaries/') && method === 'DELETE') {
    hub.saved = [];
    return ok({});
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string, label: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
        {label ? <Text>{label}</Text> : null}
      </View>
    );
  }
  return Stub;
};

/** The Wallet tab's own Send button (the real `WalletActions`) on a stand-in tab. */
function WalletStandIn() {
  const router = useRouter();
  const { WalletActions } = require('@/features/wallet/home/WalletActions') as typeof import('@/features/wallet/home/WalletActions');
  return (
    <View>
      <Text accessibilityRole="header">Wallet tab</Text>
      <WalletActions actions={[{ key: 'send', icon: 'ArrowUpRight', label: 'Send', onPress: () => router.push('/send') }]} />
    </View>
  );
}

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    wallet: WalletStandIn,
    welcome: stub('Welcome', ''),
    'reset-pin': stub('Reset PIN', ''),
    'open-wallet': stub('Open your wallet', ''),
    'open-wallet-pin': stub('Create your PIN', ''),
    'send/index': page('@/app/send/index'),
    'send/amount': page('@/app/send/amount'),
    'send/review': page('@/app/send/review'),
    'send/receipt': page('@/app/send/receipt'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, {
    mode: 'ok',
    pins: [],
    wrongFirst: false,
    balanceKobo: 48_525_075,
    recent: [AMAKA],
    quoteTotalExtra: 2575,
    recipientsError: null,
    sends: [],
    searches: [],
    saved: [],
    stored: null,
    pollsLeftPending: 0,
    created: {},
    attempted: new Set<string>(),
    payments: 0,
    quotes: 0,
    quoteTtlMs: null,
    limit: null,
    quoteExpiredForSend: false,
    saveFails: false,
  });
  forgetIntentsInMemory();
  mockVaultFault.fail = false;
  mockVaultFault.hang = false;
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f2'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

/** The phone forgets what the app held in memory (a reload, the app closed and opened); what it wrote to the secure store stays. */
function forgetIntentsInMemory() {
  try {
    (require('../intent') as { forgetIntentsInMemory?: () => void }).forgetIntentsInMemory?.();
  } catch {
    // The payment intent store does not exist on the build under test.
  }
}
async function restartApp() {
  screen.unmount();
  forgetIntentsInMemory();
  await queryClient.cancelQueries();
  queryClient.clear();
  session.resetSessionForTests();
}
const REVIEW_URL = `/send/review?id=${AMAKA.wawuUserId}&name=Amaka%20Nwosu&handle=amaka&tick=creator&amount=2500000`;
/** The router test library fakes the clock (and Date) once it has rendered: time passes by being moved on. */
const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const closeSheet = () => fireEvent.press(screen.getByRole('button', { name: 'Close' }));
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
const typeIn = (testID: string, text: string) => fireEvent.changeText(screen.getByTestId(testID), text);

async function toAmount() {
  await renderRouter(routes, { initialUrl: '/wallet' });
  await fireEvent.press(await screen.findByRole('button', { name: 'Send' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Send to Amaka Nwosu' }));
  await screen.findByTestId('send-amount-screen');
}
async function toReview(keys = '25000', note = '') {
  await toAmount();
  for (const k of keys) await fireEvent.press(screen.getByTestId(`amount-key-${k === '.' ? 'point' : k}`));
  if (note) await typeIn('send-note', note);
  await fireEvent.press(screen.getByTestId('send-continue'));
  await screen.findByTestId('send-review-screen');
  await screen.findByText(/^Send ₦/);
}
async function pay(pin = '1234') {
  await fireEvent.press(await screen.findByRole('button', { name: /^Send ₦/ }));
  await screen.findByText(/^Approve ₦/);
  await tap(pin);
}

describe('W7 · find who to send to', () => {
  it('a user taps Send on the Wallet tab and lands on W7 with their recent people; Back returns to the tab', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Send' }));
    expect(await screen.findByTestId('send-recipient-screen')).toBeTruthy();
    expect(pathname()).toBe('/send');
    expect(await screen.findByRole('button', { name: 'Send to Amaka Nwosu' })).toBeTruthy();
    // WALLET-03 adds the Bank account tab beside Who Made This? user, as W7 draws it.
    expect(screen.getByRole('tab', { name: 'Who Made This? user' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Bank account' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a user types a name and picks a result: the Hub is asked with that text and the result carries the tick and the handle', async () => {
    await renderRouter(routes, { initialUrl: '/send' });
    await typeIn('send-search', 'chi');
    expect(await screen.findByText('Chidi Eze', {}, { timeout: 3000 })).toBeTruthy();
    expect(hub.searches).toContain('chi');
    expect(screen.getByText('@chidieze · Professional')).toBeTruthy();
    expect(screen.getByTestId('tick-pro')).toBeTruthy();
    await fireEvent.press(screen.getByTestId(`result-${CHIDI.wawuUserId}`));
    expect(await screen.findByTestId('send-amount-screen')).toBeTruthy();
    expect(screen.getByTestId('send-payee-name').props.children).toBe('Chidi Eze');
  });

  // FIX-101 F2: one person with a wallet and no name used to fail the whole list ("Your recipients could not be read").
  it('a recent person with no name is listed as "Someone" and the rest of the list is read as usual', async () => {
    const NONAME = { wawuUserId: '44444444-4444-4444-8444-444444444444', displayName: '', handle: null, avatarUrl: null, tick: null };
    hub.recent = [AMAKA, NONAME];
    await renderRouter(routes, { initialUrl: '/send' });
    expect(await screen.findByRole('button', { name: 'Send to Amaka Nwosu' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Send to Someone' })).toBeTruthy();
    expect(screen.queryByText(/could not be read/)).toBeNull();
  });

  it('one typed character is not searched; a search with nobody says so', async () => {
    await renderRouter(routes, { initialUrl: '/send' });
    await typeIn('send-search', 'a');
    expect(await screen.findByTestId('send-search-hint')).toBeTruthy();
    await typeIn('send-search', 'zzz');
    expect(await screen.findByTestId('send-results-empty', {}, { timeout: 3000 })).toBeTruthy();
    expect(hub.searches).toEqual(['zzz']);
  });

  it('a user with no recent people sees what to type', async () => {
    hub.recent = [];
    await renderRouter(routes, { initialUrl: '/send' });
    expect(await screen.findByTestId('send-recent-empty')).toBeTruthy();
  });

  it('a user with no wallet is led to Open your wallet', async () => {
    hub.recipientsError = { status: 409, reason: { code: 'wallet_not_open', message: 'Open your wallet first.' } };
    await renderRouter(routes, { initialUrl: '/send' });
    await waitFor(() => expect(pathname()).toBe('/open-wallet'));
  });
});

describe('W9 · the amount', () => {
  it('a user types an amount on the keypad, taps a quick amount the Hub gave, adds a note and continues; Continue is off at nothing', async () => {
    await toAmount();
    expect(screen.getByTestId('send-continue').props.accessibilityState?.disabled).toBeTruthy();
    expect(await screen.findByTestId('send-balance')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('amount-key-2'));
    await fireEvent.press(screen.getByTestId('amount-key-5'));
    expect(screen.getByTestId('send-amount').props.accessibilityLabel).toBe('25 naira');
    await fireEvent.press(await screen.findByTestId('send-presets-1000000'));
    expect(screen.getByTestId('send-amount').props.accessibilityLabel).toBe('10,000 naira');
    await typeIn('send-note', 'Rent contribution');
    await fireEvent.press(screen.getByTestId('send-continue'));
    expect(await screen.findByText('Rent contribution')).toBeTruthy();
    expect(pathname()).toBe('/send/review');
  });

  it('kobo are typed whole: 12.5 is ₦12.50, and the review is asked for that amount in kobo', async () => {
    await toReview('12.5');
    expect(screen.getByText('Send ₦12.50')).toBeTruthy();
    expect(screen.getByText('₦38.25')).toBeTruthy();
    expect(hub.sends).toHaveLength(0);
  });
});

describe('W10 · review, with W11 the PIN sheet', () => {
  it('a user sending ₦25,000 sees Bank charge, WAWU’s fee, Fees and the Total, and what they receive on the button (R2-MONEY D-02)', async () => {
    await toReview('25000', 'Rent contribution');
    expect(screen.getByText("Bank charge")).toBeTruthy();
    expect(screen.getByText("WAWU's fee")).toBeTruthy();
    expect(screen.getByText('Fees')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('₦25,025.75')).toBeTruthy();
    expect(screen.getByText('Send ₦25,000')).toBeTruthy();
    expect(screen.queryByText('Send ₦25,025.75')).toBeNull();
    expect(screen.queryByText(/They get/)).toBeNull();
    expect(screen.getByText('@amaka')).toBeTruthy();
    expect(screen.getByText('Rent contribution')).toBeTruthy();
  });

  it('a wrong PIN says how many tries are left, uses no new key and sends nothing twice; the right PIN sends with the SAME key and ends on the receipt', async () => {
    hub.wrongFirst = true;
    await toReview();
    await pay('9999');
    expect(await screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[0].key).toBe(hub.sends[1].key);
    expect(hub.sends.map((s) => s.pin)).toEqual(['9999', '1234']);
    // The PIN is a header only; the body carries the amount, the person, the quote and the note.
    expect(hub.sends[1].body).toEqual({ amountKobo: 2_500_000, expectedTotalKobo: 2_502_575, recipientWawuUserId: AMAKA.wawuUserId, quoteToken: 'tok-2500000-2575' });
    expect(JSON.stringify(hub.sends[1].body)).not.toContain('1234');
  });

  it('a request that gets no answer asks for the PIN again and sends the same key, so the money moves once', async () => {
    hub.mode = 'no_answer';
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[0].key).toBe(hub.sends[1].key);
  });

  it('a wallet that cannot cover the total shows the bank’s own figures and sends nothing', async () => {
    hub.mode = 'short';
    await toReview();
    await pay();
    expect(await screen.findByText('Not enough in your Naira wallet')).toBeTruthy();
    expect(screen.getByText(/You have ₦1,000.00/)).toBeTruthy();
    expect(screen.queryByTestId('send-receipt-screen')).toBeNull();
  });

  it('when the fees moved, the user sees the new total and the next send takes a new key and the new quote', async () => {
    hub.mode = 'changed';
    await toReview();
    await pay();
    expect(await screen.findByText('₦25,035.75')).toBeTruthy();
    expect(await screen.findByText('The fees changed. Check the new total before you send.')).toBeTruthy();
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1].key).not.toBe(hub.sends[0].key);
    expect(hub.sends[1].body.quoteToken).toBe('tok-2500000-3575');
    expect(hub.sends[1].body.expectedTotalKobo).toBe(2_503_575);
  });

  it('a refusal says why in the Hub’s own words and nothing is sent twice', async () => {
    hub.mode = 'blocked';
    await toReview();
    await pay();
    expect(await screen.findByText('You can’t send money to this person.')).toBeTruthy();
  });

  it('a send the provider has not decided is "still confirming", never sent again, and ends on the receipt when it completes', async () => {
    hub.mode = 'pending';
    await toReview();
    await pay();
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(await screen.findByTestId('send-receipt-screen', {}, { timeout: 15_000 })).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
  }, 30_000);

  it('no PIN yet opens the PIN creation screen and sends nothing more; Forgot PIN opens the reset', async () => {
    hub.mode = 'no_pin';
    await toReview();
    await pay();
    await waitFor(() => expect(pathname()).toBe('/open-wallet-pin'));
  });
});

describe('W12 · the receipt', () => {
  it('shows what was sent, to whom, the reference, the date in Lagos time and every charge with the total paid; Done returns to the Wallet tab', async () => {
    await toReview('25000', 'Rent');
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(screen.getByText('sent')).toBeTruthy();
    expect(screen.getByTestId('receipt-to').props.children).toBe('To Amaka Nwosu · @amaka');
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('wawu-send-8f2k91qx')).toBeTruthy();
    expect(screen.getByText('16 Oct 2026, 10:42')).toBeTruthy();
    expect(screen.getByText('Naira wallet')).toBeTruthy();
    expect(screen.getByText('Rent')).toBeTruthy();
    for (const label of ["Bank charge", "WAWU's fee", 'Fees', 'Total paid']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByLabelText('25,025 naira 75 kobo')).toBeTruthy();
    expect(screen.getByLabelText('15 naira 75 kobo')).toBeTruthy();
    expect(screen.getByLabelText('25 naira 75 kobo')).toBeTruthy();
    await press('Done');
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('the beneficiary switch starts ON and the person is saved; the user takes it back and puts it on again; Share receipt opens the share sheet with the receipt and its reference', async () => {
    const shared = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await toReview();
    await pay();
    const toggle = await screen.findByRole('switch', { name: 'Save Amaka as a beneficiary' });
    expect(toggle.props.accessibilityState.checked).toBe(true);
    await waitFor(() => expect(hub.saved).toHaveLength(1));
    await fireEvent.press(screen.getByRole('switch', { name: 'Save Amaka as a beneficiary' }));
    await waitFor(() => expect(hub.saved).toHaveLength(0));
    expect(screen.getByRole('switch', { name: 'Save Amaka as a beneficiary' }).props.accessibilityState.checked).toBe(false);
    await fireEvent.press(screen.getByRole('switch', { name: 'Save Amaka as a beneficiary' }));
    await waitFor(() => expect(hub.saved).toHaveLength(1));
    await press('Share receipt');
    expect(shared).toHaveBeenCalledTimes(1);
    const message = (shared.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('Reference: wawu-send-8f2k91qx');
    expect(message).toContain('₦25,000 sent');
    expect(message).toContain('Total paid: ₦25,025.75');
    shared.mockRestore();
  });
});

describe('W12 · the beneficiary switch (round 2)', () => {
  it('when the Hub will not save the person the switch shows off and says why', async () => {
    hub.saveFails = true;
    await toReview();
    await pay();
    expect(await screen.findByText('You have saved the most people you can.')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Save Amaka as a beneficiary' }).props.accessibilityState.checked).toBe(false);
    expect(hub.saved).toHaveLength(0);
  });

  it('a send still confirming points to Wallet activity and promises no notice', async () => {
    hub.stored = transfer('pending', { amountKobo: 2_500_000, expectedTotalKobo: 2_502_575 });
    hub.pollsLeftPending = 50;
    await renderRouter(routes, { initialUrl: `/send/receipt?id=${SEND_ID}` });
    const line = await screen.findByTestId('receipt-confirming');
    expect(JSON.stringify(line.props.children)).toMatch(/Wallet activity/);
    expect(JSON.stringify(line.props.children)).not.toMatch(/let you know/);
  });
});

describe('W10 · a payment intent is kept until the Hub has the last word (round 2)', () => {
  it('a send marked pending cannot be sent again after a reload: the review finds it, shows it pending, reads it by id and never offers Send', async () => {
    hub.mode = 'pending';
    await toReview();
    await pay();
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    await restartApp();
    // The Hub still has it pending when the review opens (a send it had already decided is the next tests' case).
    hub.pollsLeftPending = 1;
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Send ₦/ })).toBeNull();
    expect(await screen.findByTestId('send-receipt-screen', {}, { timeout: 15_000 })).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.payments).toBe(1);
  }, 30_000);

  it('Back from a pending send goes to the wallet with one message on the screen; opening the same send again finds it pending, not a fresh Send', async () => {
    hub.mode = 'pending';
    await toReview();
    await pay();
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(screen.queryAllByText(/confirming/i)).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
    hub.pollsLeftPending = 50;
    await fireEvent.press(await screen.findByRole('button', { name: 'Send' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Send to Amaka Nwosu' }));
    await screen.findByTestId('send-amount-screen');
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await fireEvent.press(screen.getByTestId('send-continue'));
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Send ₦/ })).toBeNull();
    expect(hub.sends).toHaveLength(1);
  }, 30_000);

  it('a send that got no answer is sent again with the SAME key and request after the screen is left and opened again: the Hub makes one payment', async () => {
    hub.mode = 'lost';
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await closeSheet();
    await fireEvent.press(screen.getByTestId('review-back'));
    await fireEvent.press(await screen.findByTestId('send-continue'));
    await screen.findByTestId('send-review-screen');
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1].key).toBe(hub.sends[0].key);
    expect(hub.sends[1].body).toEqual(hub.sends[0].body);
    expect(hub.payments).toBe(1);
  });

  it('the same after the app is closed and opened: the intent is on the phone', async () => {
    hub.mode = 'lost';
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await restartApp();
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends[1].key).toBe(hub.sends[0].key);
    expect(hub.sends[1].body).toEqual(hub.sends[0].body);
    expect(hub.payments).toBe(1);
  });

  it('a send with no answer and then a quote that has run out: Send goes to the PIN with the same request, asking for no new quote and taking no new key', async () => {
    hub.mode = 'lost';
    hub.quoteTtlMs = 1500;
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await closeSheet();
    await sleep(1600);
    await fireEvent.press(await screen.findByRole('button', { name: /^Send ₦/ }));
    await screen.findByText(/^Approve ₦/);
    await tap('1234');
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.quotes).toBe(1);
    expect(hub.sends[1].key).toBe(hub.sends[0].key);
    expect(hub.sends[1].body).toEqual(hub.sends[0].body);
    expect(hub.payments).toBe(1);
  });

  it('only when the Hub says no payment exists for the key (the quote ran out and nothing was made) does the next send take a new key and the new quote', async () => {
    hub.mode = 'lost_before';
    hub.quoteTtlMs = 1500;
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await closeSheet();
    await sleep(1600);
    hub.quoteExpiredForSend = true;
    await fireEvent.press(await screen.findByRole('button', { name: /^Send ₦/ }));
    await screen.findByText(/^Approve ₦/);
    await tap('1234');
    expect(await screen.findByText('₦25,035.75')).toBeTruthy();
    expect(await screen.findByText('The fees changed. Check the new total before you send.')).toBeTruthy();
    hub.quoteExpiredForSend = false;
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(3);
    expect(hub.sends[1].key).toBe(hub.sends[0].key);
    expect(hub.sends[2].key).not.toBe(hub.sends[0].key);
    expect(hub.sends[2].body.quoteToken).toBe('tok-2500000-3575');
    expect(hub.payments).toBe(1);
  });
});

describe('W10 · a final answer lets the intent go (round 2)', () => {
  it('a send the Hub completed leaves nothing behind: the same person and amount opens a fresh review and takes a new key', async () => {
    await toReview();
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    await restartApp();
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByRole('button', { name: /^Send ₦/ })).toBeTruthy();
    expect(screen.queryByTestId('send-review-retry')).toBeNull();
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends[1].key).not.toBe(hub.sends[0].key);
    expect(hub.payments).toBe(2);
  });

  it('a send the Hub failed leaves nothing behind either, and Try again takes a new key and a fresh quote', async () => {
    hub.mode = 'failed';
    await toReview();
    await pay();
    expect(await screen.findByText('The bank turned this send down.')).toBeTruthy();
    await restartApp();
    hub.mode = 'ok';
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByRole('button', { name: /^Send ₦/ })).toBeTruthy();
    expect(screen.queryByTestId('send-review-retry')).toBeNull();
  });

  it('a wrong PIN leaves nothing behind (no money moved), and the retype in the same review keeps the key', async () => {
    hub.wrongFirst = true;
    await toReview();
    await pay('9999');
    expect(await screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await restartApp();
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByRole('button', { name: /^Send ₦/ })).toBeTruthy();
    expect(screen.queryByTestId('send-review-retry')).toBeNull();
    expect(hub.sends).toHaveLength(1);
  });

  it('a request with no answer says the next Send checks it first', async () => {
    hub.mode = 'lost';
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await restartApp();
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByTestId('send-review-retry')).toBeTruthy();
  });
});

describe('W10 · over the limit, the quote, and the fee call (round 2)', () => {
  it('a send over today’s limit is a blocked review with the Hub’s figure and Cancel only: no failed payment, no Try again', async () => {
    hub.limit = { remaining: 1_500_000 };
    await toAmount();
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await fireEvent.press(screen.getByTestId('send-continue'));
    expect(await screen.findByText('This send is over your limit for today. You can send ₦15,000 more today.')).toBeTruthy();
    expect(screen.queryByText("Payment didn't go through")).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Send ₦/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByTestId('send-amount-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(0);
  });

  it('after the quote has run out, one tap on Send asks again and, with the total unchanged, goes on to the PIN', async () => {
    hub.quoteTtlMs = 1;
    await toReview();
    await fireEvent.press(screen.getByRole('button', { name: /^Send ₦/ }));
    expect(await screen.findByText(/^Approve ₦/)).toBeTruthy();
    expect(hub.quotes).toBe(2);
    await tap('1234');
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
  });

  it('after the quote has run out and the total moved, one tap shows the new total and its notice and waits for the next tap', async () => {
    hub.quoteTtlMs = 1;
    await toReview();
    hub.quoteTotalExtra = 3575;
    await fireEvent.press(screen.getByRole('button', { name: /^Send ₦/ }));
    expect(await screen.findByText('₦25,035.75')).toBeTruthy();
    expect(await screen.findByText('The fees changed. Check the new total before you send.')).toBeTruthy();
    expect(screen.queryByText(/^Approve ₦/)).toBeNull();
  });

  it('the fee quote is asked for once when the review opens, and not again when the app is focused again (the provider has mounted the client)', async () => {
    const { focusManager } = require('@tanstack/react-query') as typeof import('@tanstack/react-query');
    queryClient.mount();
    try {
      await toReview();
      await sleep(300);
      expect(hub.quotes).toBe(1);
      await act(async () => {
        focusManager.setFocused(false);
        focusManager.setFocused(true);
      });
      await sleep(300);
      expect(hub.quotes).toBe(1);
    } finally {
      focusManager.setFocused(undefined);
      queryClient.unmount();
    }
  });
});


/** The key one account's intents are kept under, as the review writes it (the test account's `sub`). */
const OWNER = '00000000-0000-4000-8000-0000000000f2';
const storeKey = `wmt.send.intents.${OWNER}`;
const DAY = 24 * 60 * 60 * 1000;
const storedRows = (): { key: string; phase: string; transferId: string | null; payeeId: string; amountKobo: number }[] => JSON.parse(mockVault.get(storeKey) ?? '[]');
const seedIntent = (over: Record<string, unknown> = {}) =>
  mockVault.set(
    storeKey,
    JSON.stringify([
      {
        key: 'stalekey-0000-1111',
        payeeId: AMAKA.wawuUserId,
        amountKobo: 2_500_000,
        note: 'last month',
        quote: quote(2_500_000),
        phase: 'pending',
        transferId: SEND_ID,
        at: Date.now() - 3 * DAY,
        ...over,
      },
    ]),
  );
const EARLIER_WENT = 'Your earlier send of ₦25,000 to Amaka went through. See Wallet activity.';
const EARLIER_NOT = 'Your earlier send of ₦25,000 to Amaka did not go through. See Wallet activity.';

describe('W10 · an old send the Hub already decided is not this send (round 3)', () => {
  it('S9 · a pending intent from days ago that the Hub completed: no old receipt, one line, a fresh review, and a new send takes a new key', async () => {
    hub.stored = transfer('completed', { amountKobo: 2_500_000, expectedTotalKobo: 2_502_575, note: 'last month' });
    seedIntent();
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByText(EARLIER_WENT)).toBeTruthy();
    expect(pathname()).toBe('/send/review');
    expect(screen.queryByTestId('send-receipt-screen')).toBeNull();
    expect(await screen.findByRole('button', { name: /^Send ₦/ })).toBeTruthy();
    expect(storedRows()).toHaveLength(0);
    expect(hub.sends).toHaveLength(0);
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].key).not.toBe('stalekey-0000-1111');
    expect(hub.payments).toBe(1);
  });

  it('S14 · the same for an old send the Hub failed: one line that it did not go through, and the person can send fresh', async () => {
    hub.stored = transfer('failed', { amountKobo: 2_500_000, expectedTotalKobo: 2_502_575 });
    seedIntent();
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByText(EARLIER_NOT)).toBeTruthy();
    expect(screen.queryByText(/Payment didn.t go through/)).toBeNull();
    expect(await screen.findByRole('button', { name: /^Send ₦/ })).toBeTruthy();
    expect(storedRows()).toHaveLength(0);
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends[0].key).not.toBe('stalekey-0000-1111');
  });

  it('a stored intent the Hub still has as pending keeps blocking; when this review has seen it pending and the Hub then decides it, it goes to the receipt', async () => {
    hub.stored = transfer('pending', { amountKobo: 2_500_000, expectedTotalKobo: 2_502_575 });
    hub.pollsLeftPending = 1;
    seedIntent({ at: Date.now() - 60 * 1000 });
    await renderRouter(routes, { initialUrl: REVIEW_URL });
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Send ₦/ })).toBeNull();
    expect(screen.queryByTestId('send-review-earlier')).toBeNull();
    expect(await screen.findByTestId('send-receipt-screen', {}, { timeout: 15_000 })).toBeTruthy();
    expect(hub.sends).toHaveLength(0);
    expect(storedRows()).toHaveLength(0);
  }, 30_000);

  it('a send this review started and found pending goes to its own receipt when it completes (this review was watching)', async () => {
    hub.mode = 'pending';
    await toReview();
    await pay();
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(await screen.findByTestId('send-receipt-screen', {}, { timeout: 15_000 })).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
  }, 30_000);

  it('a receipt that shows an old send decided lets its stored intent go', async () => {
    hub.stored = transfer('completed', { amountKobo: 2_500_000, expectedTotalKobo: 2_502_575 });
    seedIntent();
    await renderRouter(routes, { initialUrl: `/send/receipt?id=${SEND_ID}` });
    expect(await screen.findByTestId('receipt-head')).toBeTruthy();
    await waitFor(() => expect(storedRows()).toHaveLength(0));
  });
});

describe('W10 · what the store may and may not do (round 3)', () => {
  it('a second tab opened before the first tab sent takes the key that tab wrote, so the money moves once', async () => {
    await toReview();
    // The other tab sent after this one opened: its intent is in the shared store, and this tab has never seen it.
    seedIntent({ key: 'tab-one-key', phase: 'unknown', transferId: null, at: Date.now(), note: '' });
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].key).toBe('tab-one-key');
    expect(hub.payments).toBe(1);
  });

  it('a second tab that finds the first tab\'s send pending shows it pending and sends nothing', async () => {
    await toReview();
    seedIntent({ key: 'tab-one-key', phase: 'pending', transferId: SEND_ID, at: Date.now() });
    hub.stored = transfer('pending', { amountKobo: 2_500_000, expectedTotalKobo: 2_502_575 });
    hub.pollsLeftPending = 50;
    await fireEvent.press(await screen.findByRole('button', { name: /^Send ₦/ }));
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(screen.queryByText(/^Approve ₦/)).toBeNull();
    expect(hub.sends).toHaveLength(0);
  });

  it('when the store cannot keep the payment, nothing is sent and the person is told; with the store back, one send goes', async () => {
    await toReview();
    mockVaultFault.fail = true;
    await pay();
    expect(await screen.findByText('We could not get this payment ready. Try again.')).toBeTruthy();
    expect(hub.sends).toHaveLength(0);
    expect(screen.queryByText(/^Approve ₦/)).toBeNull();
    expect(screen.queryByTestId('send-review-retry')).toBeNull();
    mockVaultFault.fail = false;
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('a store that does not answer in time is the same: nothing is sent', async () => {
    await toReview();
    mockVaultFault.hang = true;
    await pay();
    await sleep(2000);
    expect(await screen.findByText('We could not get this payment ready. Try again.')).toBeTruthy();
    expect(hub.sends).toHaveLength(0);
  });

  it('W10 still-confirming points to Wallet activity, like W12', async () => {
    hub.mode = 'pending';
    await toReview();
    await pay();
    expect(await screen.findByText('Still confirming')).toBeTruthy();
    expect(screen.getByText(/Check Wallet activity for the result/)).toBeTruthy();
    expect(screen.queryByText(/pay a second time/)).toBeNull();
  });
});
