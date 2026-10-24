/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Send to a bank account (WALLET-03) on the real Expo Router stack: W7's Bank account tab, W8, W9 (with W13), W10 and W11, W12 and
 * W14, as their real route files, with the Wallet tab's own Send button, and the Hub as a stand-in `fetch` installed before the app's
 * modules load. The stand-in answers in the Hub's shapes (the bank list, the name check with its token, the bank send, the saved
 * accounts and the payout account), records every send's headers and body, and answers a key it knows with its first payment.
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

const GTB = { code: '058', name: 'Guaranty Trust Bank' };
const KUDA = { code: '090267', name: 'Kuda MFB' };
const ACCOUNT = { bankCode: GTB.code, bankName: GTB.name, accountNumber: '0123456789', accountName: 'Test Holder One' };
const SAVED = { bankCode: KUDA.code, bankName: KUDA.name, accountNumber: '2011458890', accountName: 'Test Holder Two' };
const PAYOUT = { bankCode: '044', bankName: 'Access Bank', accountNumber: '0987654321', accountName: 'Test Owner', matchesBvnName: true, updatedAt: '2026-10-01T09:00:00.000Z' };
const SEND_ID = '44444444-4444-4444-8444-444444444444';
const NAME_TOKEN = 'name-token-0123456789';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

type TransferShape = { id: string; status: string; amountKobo: number; totalKobo: number; note: string | null } & Record<string, unknown>;
type Mode = 'ok' | 'pending' | 'failed' | 'reversed' | 'short' | 'changed' | 'no_answer' | 'lost' | 'name_changed';
const hub = {
  mode: 'ok' as Mode,
  wrongFirst: false,
  balanceKobo: 48_525_075,
  sends: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  checks: [] as { bankCode: string; accountNumber: string }[],
  created: {} as Record<string, TransferShape>,
  payments: 0,
  saved: [] as unknown[],
  payout: PAYOUT as typeof PAYOUT | null,
  nameCheck: 'ok' as 'ok' | 'refused' | 'limited' | 'down',
  stored: null as null | TransferShape,
  reversalReady: true,
  savedPosts: [] as Record<string, unknown>[],
  /** FIX-101 M-A: while set, POST /money/transfers/bank waits for it before answering (a Hub that takes its time). */
  hold: null as null | Promise<void>,
};

const FEE_PROVIDER = 4000;
const FEE_WAWU = 2500;

function quote(amountKobo: number, wawu = FEE_WAWU) {
  return {
    kind: 'bank_transfer',
    billCategory: null,
    amountKobo,
    fee: { providerFeeKobo: FEE_PROVIDER, wawuFeeKobo: wawu, totalFeeKobo: FEE_PROVIDER + wawu },
    parts: [
      { code: 'bank_transfer', source: 'provider', amountKobo: FEE_PROVIDER },
      { code: 'wawu_fee', source: 'wawu', amountKobo: wawu },
    ],
    totalKobo: amountKobo + FEE_PROVIDER + wawu,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${amountKobo}-${wawu}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
}

function transfer(status: 'completed' | 'pending' | 'failed' | 'reversed', body: Record<string, unknown>): TransferShape {
  const amountKobo = Number(body.amountKobo);
  const reversed = status === 'reversed' || (status === 'failed' && hub.reversalReady && hub.mode === 'reversed');
  return {
    id: SEND_ID,
    kind: 'bank_account',
    status,
    amountKobo,
    fee: { providerFeeKobo: FEE_PROVIDER, wawuFeeKobo: FEE_WAWU, totalFeeKobo: FEE_PROVIDER + FEE_WAWU },
    totalKobo: Number(body.expectedTotalKobo),
    note: (body.note as string | undefined) ?? null,
    reference: 'wawu-bank-7c1d4a90',
    toWawuUser: null,
    toBankAccount: ACCOUNT,
    timeline: [],
    failureReason: status === 'failed' || status === 'reversed' ? 'The bank did not confirm it in time.' : null,
    reversal: reversed ? { returnedKobo: amountKobo + FEE_WAWU, keptKobo: FEE_PROVIDER, reversedAt: '2026-10-16T09:50:00.000Z' } : null,
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
  if (path === '/money/recipients/recent') return ok([]);
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-16T09:00:00.000Z' });
  if (path === '/money/transfers/presets') return ok({ quickAmounts: [{ amountKobo: 500_000 }, { amountKobo: 1_000_000 }], noteMaxLength: 100 });
  if (path === '/money/banks') return ok([GTB, KUDA, { code: '044', name: 'Access Bank' }]);
  if (path === '/money/payout-account') return ok(hub.payout);
  if (path === '/money/banks/name-check' && method === 'POST') {
    const body = (await request.json()) as { bankCode: string; accountNumber: string };
    hub.checks.push(body);
    if (hub.nameCheck === 'refused') return refuse(422, { code: 'name_check_failed', message: 'The bank does not know that account. Check the number and the bank.' });
    if (hub.nameCheck === 'limited') return refuse(429, { code: 'name_check_rate_limited', message: 'Too many checks. Try again in 20 minutes.' });
    if (hub.nameCheck === 'down') return refuse(503, { code: 'provider_unreachable', message: 'The bank did not answer. Try again.' });
    const bank = [GTB, KUDA].find((b) => b.code === body.bankCode) ?? GTB;
    return ok({ bankCode: bank.code, bankName: bank.name, accountNumber: body.accountNumber, accountName: body.accountNumber === SAVED.accountNumber ? SAVED.accountName : ACCOUNT.accountName, nameToken: NAME_TOKEN });
  }
  if (path === '/money/fees/quote') return ok(quote(Number(url.searchParams.get('amountKobo'))));
  if (path === '/money/transfers/bank' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const pin = request.headers.get('x-transaction-pin');
    const key = request.headers.get('idempotency-key') ?? '';
    hub.sends.push({ pin, key, body });
    if (hub.hold) await hub.hold;
    if (hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (hub.wrongFirst && hub.sends.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'no_answer' && hub.sends.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough money.', balanceKobo: 100_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 100_000 });
    if (hub.mode === 'changed' && hub.sends.length === 1) return refuse(409, { code: 'quote_changed', message: 'The fees changed.', feeQuote: quote(Number(body.amountKobo), 3500) });
    if (hub.mode === 'name_changed') return refuse(409, { code: 'account_name_changed', message: 'The bank now names Someone Else for this account, not Test Holder Two. Save the account again to confirm.' });
    const status = hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' || hub.mode === 'reversed' ? 'failed' : 'completed';
    hub.stored = transfer(status, body);
    hub.created[key] = hub.stored;
    hub.payments += 1;
    if (hub.mode === 'lost' && hub.payments === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: hub.stored });
  }
  if (path === `/money/transfers/${SEND_ID}` && method === 'GET') {
    if (hub.stored?.status === 'failed' && !hub.reversalReady && hub.mode === 'failed') {
      hub.reversalReady = true;
      hub.mode = 'reversed';
      return ok(hub.stored);
    }
    if (hub.stored && hub.mode === 'reversed') return ok(transfer('failed', { amountKobo: hub.stored.amountKobo, expectedTotalKobo: hub.stored.totalKobo }));
    return ok(hub.stored);
  }
  if (path === '/money/beneficiaries' && method === 'GET') return ok(hub.saved);
  if (path === '/money/beneficiaries' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.savedPosts.push(body);
    const row = { id: 'b-bank-1', kind: 'bank_account', wawuUser: null, bankAccount: ACCOUNT, createdAt: '2026-10-16T09:43:00.000Z' };
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
/** W15 as a stand-in that says what shortfall it was opened with (WALLET-05 builds the real one). */
function AddMoneyStandIn() {
  const { short } = useLocalSearchParams<{ short?: string }>();
  return (
    <View>
      <Text accessibilityRole="header">Add money</Text>
      <Text testID="add-money-short">{`short ${short ?? ''}`}</Text>
    </View>
  );
}
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
    // The bank list sheet reads through the app's provider, as the root layout gives it.
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    wallet: WalletStandIn,
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'add-money': AddMoneyStandIn,
    'send/index': page('@/app/send/index'),
    'send/bank': page('@/app/send/bank'),
    'send/amount': page('@/app/send/amount'),
    'send/review': page('@/app/send/review'),
    'send/receipt': page('@/app/send/receipt'),
    'send/failed': page('@/app/send/failed'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, {
    mode: 'ok',
    wrongFirst: false,
    balanceKobo: 48_525_075,
    sends: [],
    checks: [],
    created: {},
    payments: 0,
    saved: [],
    payout: PAYOUT,
    nameCheck: 'ok',
    stored: null,
    reversalReady: true,
    savedPosts: [],
    hold: null,
  });
  (require('../intent') as { forgetIntentsInMemory: () => void }).forgetIntentsInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f3'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
const typeIn = (testID: string, text: string) => fireEvent.changeText(screen.getByTestId(testID), text);

/** Wallet, Send, the Bank account tab: W8. */
async function toBank() {
  await renderRouter(routes, { initialUrl: '/wallet' });
  await fireEvent.press(await screen.findByRole('button', { name: 'Send' }));
  await fireEvent.press(await screen.findByRole('tab', { name: 'Bank account' }));
  await screen.findByTestId('send-bank-screen');
}
/** W8 with the account typed and the bank's answer in. */
async function toResolved(number = ACCOUNT.accountNumber, bank = GTB) {
  await toBank();
  await fireEvent.press(screen.getByTestId('send-bank-field'));
  await fireEvent.press(await screen.findByTestId(`bank-${bank.code}`));
  await typeIn('send-bank-number', number);
}
async function toAmount() {
  await toResolved();
  await screen.findByText(ACCOUNT.accountName);
  await fireEvent.press(screen.getByTestId('send-bank-continue'));
  await screen.findByTestId('send-amount-screen');
}
async function toReview(keys = '25000') {
  await toAmount();
  for (const k of keys) await fireEvent.press(screen.getByTestId(`amount-key-${k === '.' ? 'point' : k}`));
  await fireEvent.press(screen.getByTestId('send-continue'));
  await screen.findByTestId('send-review-screen');
  await screen.findByText(/^Send ₦/);
}
async function pay(pin = '1234') {
  await fireEvent.press(await screen.findByRole('button', { name: /^Send ₦/ }));
  await screen.findByText(/^Approve ₦/);
  await tap(pin);
}

describe('W8 · send to a bank account', () => {
  it('a user taps Send, switches to the Bank account tab and reaches W8; the other tab goes back to W7 without piling screens up', async () => {
    await toBank();
    expect(pathname()).toBe('/send/bank');
    expect(screen.getByRole('tab', { name: 'Bank account' }).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole('tab', { name: 'Who Made This? user' }));
    expect(await screen.findByTestId('send-recipient-screen')).toBeTruthy();
    expect(pathname()).toBe('/send');
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('Continue stays off until the bank has named the account: pick a bank, type ten digits, the bank’s name shows, then Continue opens W9 with that name', async () => {
    await toBank();
    const cont = screen.getByTestId('send-bank-continue');
    expect(cont.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('send-bank-field'));
    await fireEvent.press(await screen.findByTestId(`bank-${GTB.code}`));
    expect(screen.getByTestId('send-bank-continue').props.accessibilityState?.disabled).toBe(true);
    await typeIn('send-bank-number', '0123 456');
    expect(hub.checks).toHaveLength(0);
    await typeIn('send-bank-number', '0123 456 789');
    expect(await screen.findByText(ACCOUNT.accountName)).toBeTruthy();
    expect(hub.checks).toEqual([{ bankCode: GTB.code, accountNumber: ACCOUNT.accountNumber }]);
    await waitFor(() => expect(screen.getByTestId('send-bank-continue').props.accessibilityState?.disabled).toBeFalsy());
    await fireEvent.press(screen.getByTestId('send-bank-continue'));
    expect(await screen.findByTestId('send-amount-screen')).toBeTruthy();
    expect(screen.getByTestId('send-payee-name').props.children).toBe(ACCOUNT.accountName);
    expect(screen.getByText(`${GTB.name} · ${ACCOUNT.accountNumber}`)).toBeTruthy();
  });

  it('an account the bank does not know says so in the Hub’s words and Continue stays off; a check the bank did not answer offers Try again', async () => {
    hub.nameCheck = 'refused';
    await toResolved();
    expect(await screen.findByText('The bank does not know that account. Check the number and the bank.')).toBeTruthy();
    expect(screen.getByTestId('send-bank-continue').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('send-bank-field'));
    hub.nameCheck = 'down';
    await fireEvent.press(await screen.findByTestId(`bank-${KUDA.code}`));
    expect(await screen.findByTestId('send-bank-unchecked')).toBeTruthy();
    expect(screen.getByTestId('send-bank-continue').props.accessibilityState?.disabled).toBe(true);
    hub.nameCheck = 'ok';
    await fireEvent.press(screen.getByTestId('send-bank-retry'));
    expect(await screen.findByText(ACCOUNT.accountName)).toBeTruthy();
  });

  it('a check the bank did not answer says only that the name could not be checked, and never talks about saving', async () => {
    hub.nameCheck = 'down';
    await toResolved();
    expect(await screen.findByTestId('send-bank-unchecked')).toBeTruthy();
    expect(screen.getByText('We could not check the name now.')).toBeTruthy();
    expect(screen.queryByText(/Saving/)).toBeNull();
    expect(screen.getByTestId('send-bank-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('a user sees My payout account (tagged withdraw) and a saved account, and taps one to go straight to W9 with the Hub’s name', async () => {
    hub.saved = [{ id: 'b-9', kind: 'bank_account', wawuUser: null, bankAccount: SAVED, createdAt: '2026-10-10T09:00:00.000Z' }];
    await toBank();
    expect(await screen.findByText('My payout account')).toBeTruthy();
    expect(screen.getByText(`${PAYOUT.bankName} · ${PAYOUT.accountNumber} · withdraw`)).toBeTruthy();
    expect(screen.getByText(SAVED.accountName)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('saved-b-9'));
    expect(await screen.findByTestId('send-amount-screen')).toBeTruthy();
    expect(screen.getByTestId('send-payee-name').props.children).toBe(SAVED.accountName);
    // No name check was made: the Hub already holds the saved account's name.
    expect(hub.checks).toHaveLength(0);
  });

  it('with nothing saved and no payout account the section is not drawn at all', async () => {
    hub.payout = null;
    await toBank();
    await waitFor(() => expect(screen.queryByTestId('send-saved-loading')).toBeNull());
    expect(screen.queryByTestId('send-saved')).toBeNull();
    expect(screen.queryByText('Saved')).toBeNull();
  });
});

describe('W9 and W13 · the amount', () => {
  it('a user over the balance can tap Add money (W13) and reach Add money (W15) with what the amount is over by', async () => {
    await toAmount();
    for (const k of '500000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('send-over-balance');
    await fireEvent.press(screen.getByRole('button', { name: 'Add money' }));
    await waitFor(() => expect(pathname()).toBe('/add-money'));
    // ₦500,000 less ₦485,250.75, in kobo.
    expect(screen.getByTestId('add-money-short').props.children).toBe('short 1474925');
  });

  it('with an amount the balance covers there is no Add money on W9', async () => {
    await toAmount();
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('send-balance');
    expect(screen.queryByRole('button', { name: 'Add money' })).toBeNull();
  });

  it('an amount over the balance shows the shortfall line in place of the balance, and Continue stays off; a smaller amount turns it on', async () => {
    await toAmount();
    for (const k of '500000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(await screen.findByTestId('send-over-balance')).toBeTruthy();
    expect(screen.getByText(/^Over your balance of/)).toBeTruthy();
    expect(screen.getByTestId('send-continue').props.accessibilityState?.disabled).toBe(true);
    // W13's "Add money" (WALLET-05) opens W15 with what the amount is over the balance by: ₦500,000 less ₦485,250.75.
    expect(screen.getByRole('button', { name: 'Add money' })).toBeTruthy();
    await fireEvent.press(screen.getByTestId('amount-key-delete'));
    expect(screen.queryByTestId('send-over-balance')).toBeNull();
    expect(screen.getByTestId('send-balance')).toBeTruthy();
    expect(screen.getByTestId('send-continue').props.accessibilityState?.disabled).toBeFalsy();
  });
});

describe('W10, W11 and W12 · send, with the bank’s charge, and the receipt', () => {
  it('a user sending ₦25,000 sees Bank charge ₦40 + WAWU’s fee ₦25 = ₦65, the total on the button and "They get ₦25,000"', async () => {
    await toReview();
    expect(screen.getByText('Bank charge')).toBeTruthy();
    expect(screen.getByText("WAWU's fee")).toBeTruthy();
    expect(screen.getByText('Fees')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('Send ₦25,065')).toBeTruthy();
    expect(screen.getByText('They get ₦25,000')).toBeTruthy();
    expect(screen.getByText(GTB.name)).toBeTruthy();
    expect(screen.getByText(ACCOUNT.accountNumber)).toBeTruthy();
    expect(screen.queryByText(/Fintava|Nuvion/)).toBeNull();
    expect(hub.sends).toHaveLength(0);
  });

  it('the PIN sends the account, the amount, the quote and the name token (never the PIN in the body), and ends on a receipt with the bank charge', async () => {
    await toReview();
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].pin).toBe('1234');
    expect(hub.sends[0].body).toEqual({ bankCode: GTB.code, accountNumber: ACCOUNT.accountNumber, amountKobo: 2_500_000, expectedTotalKobo: 2_506_500, quoteToken: 'tok-2500000-2500', nameToken: NAME_TOKEN });
    expect(Object.values(hub.sends[0].body)).not.toContain('1234');
    expect(screen.getByTestId('receipt-to').props.children).toBe(`To ${ACCOUNT.accountName} · ${GTB.name} ${ACCOUNT.accountNumber}`);
    expect(screen.getByText('Bank charge')).toBeTruthy();
    expect(screen.getByTestId('receipt-total')).toBeTruthy();
    // "Save as beneficiary" saves the BANK account, by its bank and number (the Hub keeps the bank's name).
    await waitFor(() => expect(hub.savedPosts).toEqual([{ kind: 'bank_account', bankCode: GTB.code, accountNumber: ACCOUNT.accountNumber }]));
    await fireEvent.press(screen.getByTestId('receipt-done'));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a saved account is sent with no name token, because the Hub compares it with the name it holds', async () => {
    hub.saved = [{ id: 'b-9', kind: 'bank_account', wawuUser: null, bankAccount: SAVED, createdAt: '2026-10-10T09:00:00.000Z' }];
    await toBank();
    await fireEvent.press(await screen.findByTestId('saved-b-9'));
    await screen.findByTestId('send-amount-screen');
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await fireEvent.press(screen.getByTestId('send-continue'));
    await screen.findByText(/^Send ₦/);
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends[0].body).not.toHaveProperty('nameToken');
    expect(hub.sends[0].body).toMatchObject({ bankCode: SAVED.bankCode, accountNumber: SAVED.accountNumber });
  });

  it('a double tap on Send and a wrong PIN then the right one move the money once, on one key', async () => {
    hub.wrongFirst = true;
    await toReview();
    const send = await screen.findByRole('button', { name: /^Send ₦/ });
    await fireEvent.press(send);
    await fireEvent.press(send);
    await screen.findByText(/^Approve ₦/);
    await tap('9999');
    expect(await screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[0].key).toBe(hub.sends[1].key);
    expect(hub.payments).toBe(1);
  });

  it('FIX-101 M-A: while the Hub is still working on the send, the review says nothing about "no answer" and the PIN sheet keeps its checking state; the money is one payment', async () => {
    let release: () => void = () => undefined;
    hub.hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await toReview();
    await pay();
    await waitFor(() => expect(hub.sends).toHaveLength(1));
    // The clock is the router library's fake one: move it well past the time an unanswered request would take to show its line.
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId('send-review-retry')).toBeNull();
    expect(screen.queryByText(/Your last try got no answer/)).toBeNull();
    expect(screen.queryByText('Still confirming')).toBeNull();
    expect(screen.getByLabelText('Checking your PIN')).toBeTruthy();
    await act(async () => {
      hub.hold = null;
      release();
    });
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('FIX-101 M-A: a request the Hub truly did not answer says so, and only then', async () => {
    hub.mode = 'no_answer';
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    expect(screen.getByTestId('send-review-retry')).toBeTruthy();
    expect(screen.getByText(/Your last try got no answer/)).toBeTruthy();
  });

  it('an answer lost on the way, then a retry, sends the SAME request: one debit and one receipt', async () => {
    hub.mode = 'lost';
    await toReview();
    await pay();
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[0].key).toBe(hub.sends[1].key);
    expect(hub.sends[1].body).toEqual(hub.sends[0].body);
    expect(hub.payments).toBe(1);
  });

  it('a wallet short of the total says what is missing before the PIN; the Hub’s own 402 is the same figure', async () => {
    // The balance covers the ₦25,000 but not the ₦25,065 it costs: W9 lets it through, and W10 names what is missing.
    hub.balanceKobo = 2_503_000;
    await toAmount();
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await fireEvent.press(screen.getByTestId('send-continue'));
    await screen.findByTestId('send-review-screen');
    expect(await screen.findByText(/Not enough/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Send ₦/ })).toBeNull();
    expect(hub.sends).toHaveLength(0);
  });

  it('a user short on W10 can tap Add and reach Add money (W15) with the shortfall: the total less the bank’s balance (WALLET-05)', async () => {
    hub.balanceKobo = 2_503_000;
    await toAmount();
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await fireEvent.press(screen.getByTestId('send-continue'));
    await screen.findByTestId('send-review-screen');
    expect(await screen.findByText('Not enough in your Naira wallet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /^Add ₦/ }));
    await waitFor(() => expect(pathname()).toBe('/add-money'));
    expect(screen.getByTestId('add-money-short').props.children).toBe('short 3500');
  });

  it('a quote that changed since the review puts the new total on screen and sends nothing until it is read again', async () => {
    hub.mode = 'changed';
    await toReview();
    await pay();
    expect(await screen.findByText('The fees changed. Check the new total before you send.')).toBeTruthy();
    expect(screen.getByText('Send ₦25,075')).toBeTruthy();
    expect(hub.payments).toBe(0);
    await pay();
    expect(await screen.findByTestId('send-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1].key).not.toBe(hub.sends[0].key);
    expect(hub.sends[1].body).toMatchObject({ expectedTotalKobo: 2_507_500, quoteToken: 'tok-2500000-3500' });
  });

  it('an account whose holder changed is refused before anything is sent, in the Hub’s words, with the key given back', async () => {
    hub.mode = 'name_changed';
    hub.saved = [{ id: 'b-9', kind: 'bank_account', wawuUser: null, bankAccount: SAVED, createdAt: '2026-10-10T09:00:00.000Z' }];
    await toBank();
    await fireEvent.press(await screen.findByTestId('saved-b-9'));
    await screen.findByTestId('send-amount-screen');
    for (const k of '25000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await fireEvent.press(screen.getByTestId('send-continue'));
    await screen.findByText(/^Send ₦/);
    await pay();
    expect(await screen.findByText(/The bank now names Someone Else/)).toBeTruthy();
    expect(hub.payments).toBe(0);
  });
});

describe('W14 · a transfer the bank did not take', () => {
  it('a failed send with a reversal shows what came back and the charge kept, in the Hub’s words, and never "Nothing was taken"', async () => {
    hub.mode = 'reversed';
    await toReview();
    await pay();
    expect(await screen.findByTestId('send-failed-screen')).toBeTruthy();
    expect(pathname()).toBe('/send/failed');
    expect(await screen.findByText("Transfer didn't go through")).toBeTruthy();
    expect(screen.getByTestId('failed-reason').props.children).toBe('The bank did not confirm it in time.');
    expect(screen.getByText('Reversed to your wallet')).toBeTruthy();
    expect(screen.getByText('Returned to your wallet')).toBeTruthy();
    expect(screen.getByLabelText('25,025 naira')).toBeTruthy();
    expect(screen.getByText('Charge kept')).toBeTruthy();
    expect(screen.getByLabelText('40 naira')).toBeTruthy();
    expect(screen.getByText('wawu-bank-7c1d4a90')).toBeTruthy();
    expect(screen.getByText('Your money is back')).toBeTruthy();
    expect(screen.getByText('₦25,025 is back in your Naira wallet.')).toBeTruthy();
    expect(screen.queryByText(/Nothing was taken|full/i)).toBeNull();
    expect(screen.queryByText(/—/)).toBeNull();
  });

  it('a failure with no reversal on record yet says nothing about the money, and is read again until the Hub has one', async () => {
    hub.mode = 'failed';
    hub.reversalReady = false;
    await toReview();
    await pay();
    expect(await screen.findByTestId('send-failed-screen')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Reversed to your wallet')).toBeNull());
    expect(await screen.findByText('Failed')).toBeTruthy();
    expect(screen.queryByText('Your money is back')).toBeNull();
    expect(screen.queryByText('Returned to your wallet')).toBeNull();
    expect(screen.getByText('Your wallet shows where it stands')).toBeTruthy();
    expect(hub.payments).toBe(1);
  });

  it('Done returns to the wallet, and Try again starts the same account again from W8 with the bank and the number', async () => {
    hub.mode = 'reversed';
    await toReview();
    await pay();
    await screen.findByTestId('send-failed-screen');
    await fireEvent.press(await screen.findByTestId('failed-retry'));
    expect(await screen.findByTestId('send-bank-screen')).toBeTruthy();
    expect(pathname()).toBe('/send/bank');
    expect(screen.getByTestId('send-bank-field').props.value ?? '').toBeDefined();
    expect(screen.getByTestId('send-bank-number').props.value).toBe(ACCOUNT.accountNumber);
    expect(await screen.findByText(ACCOUNT.accountName)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('send-bank-continue'));
    expect(await screen.findByTestId('send-amount-screen')).toBeTruthy();
    // The amount it had comes back with it, and a new send takes a new key.
    expect(screen.getByTestId('send-amount').props.accessibilityLabel).toBeTruthy();
    expect(hub.payments).toBe(1);
  });

  it('Done on W14 returns to the Wallet tab', async () => {
    hub.mode = 'reversed';
    await toReview();
    await pay();
    await screen.findByTestId('send-failed-screen');
    await fireEvent.press(await screen.findByTestId('failed-done'));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });
});

// The router test library fakes the clock once it has rendered: let it move on where a screen waits on a timer.
afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});
