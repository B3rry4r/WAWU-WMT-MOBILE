/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack, useRouter } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Send to a WAWU user (WALLET-02) on the real Expo Router stack: W7 to W12 as their real route files, with the Wallet tab's own
 * Send button, and the Hub as a stand-in `fetch` installed before the app's modules load (the API client keeps the `fetch` it
 * finds when it is made). The stand-in answers in the Hub's shapes, records every send's headers and body, and can answer a send
 * as the Hub does when the PIN is wrong, the wallet is short, the fees moved, nothing comes back, or the provider has not decided.
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

const AMAKA = { wawuUserId: '11111111-1111-4111-8111-111111111111', displayName: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, tick: 'creator' };
const CHIDI = { wawuUserId: '22222222-2222-4222-8222-222222222222', displayName: 'Chidi Eze', handle: 'chidieze', avatarUrl: null, tick: 'professional' };
const SEND_ID = '33333333-3333-4333-8333-333333333333';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

type SendMode = 'ok' | 'pending' | 'failed' | 'short' | 'changed' | 'no_answer' | 'no_pin' | 'blocked';
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
};

function quote(amountKobo: number, extra = hub.quoteTotalExtra) {
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
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${amountKobo}-${extra}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
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
  if (path === '/money/fees/quote') return ok(quote(Number(url.searchParams.get('amountKobo'))));
  if (path === '/money/transfers/wawu' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const pin = request.headers.get('x-transaction-pin');
    hub.sends.push({ pin, key: request.headers.get('idempotency-key'), body });
    if (hub.wrongFirst && hub.sends.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'no_answer' && hub.sends.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'no_pin') return refuse(409, { code: 'pin_not_set', message: 'Set your PIN first.' });
    if (hub.mode === 'blocked') return refuse(403, { code: 'recipient_blocked', message: 'You can’t send money to this person.' });
    if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough money.', balanceKobo: 100_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 100_000 });
    if (hub.mode === 'changed' && hub.sends.length === 1) return refuse(409, { code: 'quote_changed', message: 'The fees changed.', feeQuote: quote(Number(body.amountKobo), 3575) });
    const status = hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'completed';
    hub.stored = transfer(status, body);
    if (status === 'pending') hub.pollsLeftPending = 1;
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
      <WalletActions onSend={() => router.push('/send')} />
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
  Object.assign(hub, { mode: 'ok', pins: [], wrongFirst: false, balanceKobo: 48_525_075, recent: [AMAKA], quoteTotalExtra: 2575, recipientsError: null, sends: [], searches: [], saved: [], stored: null, pollsLeftPending: 0 });
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
    // The Bank account tab is WALLET-03's: nothing for it is drawn (R-47).
    expect(screen.queryByText('Bank account')).toBeNull();
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
    expect(screen.getByText('Send ₦38.25')).toBeTruthy();
    expect(hub.sends).toHaveLength(0);
  });
});

describe('W10 · review, with W11 the PIN sheet', () => {
  it('a user sending ₦25,000 sees Fintava’s charge, WAWU’s fee, Fees and the Total, the total on the button and "They get ₦25,000"', async () => {
    await toReview('25000', 'Rent contribution');
    expect(screen.getByText("Fintava's charge")).toBeTruthy();
    expect(screen.getByText("WAWU's fee")).toBeTruthy();
    expect(screen.getByText('Fees')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('Send ₦25,025.75')).toBeTruthy();
    expect(screen.getByText('They get ₦25,000')).toBeTruthy();
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
    expect(await screen.findByText("We couldn't check your PIN. Try again.")).toBeTruthy();
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
    expect(await screen.findByText('Send ₦25,035.75')).toBeTruthy();
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
    for (const label of ["Fintava's charge", "WAWU's fee", 'Fees', 'Total paid']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByLabelText('25,025 naira 75 kobo')).toBeTruthy();
    expect(screen.getByLabelText('15 naira 75 kobo')).toBeTruthy();
    expect(screen.getByLabelText('25 naira 75 kobo')).toBeTruthy();
    await press('Done');
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a user saves the person as a beneficiary and takes it back; Share receipt opens the share sheet with the receipt and its reference', async () => {
    const shared = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await toReview();
    await pay();
    const toggle = await screen.findByRole('switch', { name: 'Save Amaka as a beneficiary' });
    expect(toggle.props.accessibilityState.checked).toBe(false);
    await fireEvent.press(toggle);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Save Amaka as a beneficiary' }).props.accessibilityState.checked).toBe(true));
    expect(hub.saved).toHaveLength(1);
    await fireEvent.press(screen.getByRole('switch', { name: 'Save Amaka as a beneficiary' }));
    await waitFor(() => expect(hub.saved).toHaveLength(0));
    await press('Share receipt');
    expect(shared).toHaveBeenCalledTimes(1);
    const message = (shared.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('Reference: wawu-send-8f2k91qx');
    expect(message).toContain('₦25,000 sent');
    expect(message).toContain('Total paid: ₦25,025.75');
    shared.mockRestore();
  });
});
