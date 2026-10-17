/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Withdraw (WALLET-05: W17, W19, and W14 when the bank does not take it) on the real Expo Router stack, with the Wallet tab's own
 * Withdraw tile and the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the Hub's shapes
 * (the balance, the payout account, the fee quote, the bank send, the send by id), records every send's headers and body, and answers
 * a key it knows with its first withdrawal, as the Hub does.
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
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

const PAYOUT = { bankCode: '044', bankName: 'Access Bank', accountNumber: '0987654321', accountName: 'Lennox Emmanuel', matchesBvnName: true as boolean | null, updatedAt: '2026-10-01T09:00:00.000Z' };
const TRANSFER_ID = '55555555-5555-4555-8555-555555555555';
const PROVIDER = 4000;
const WAWU = 2500;

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

type Mode = 'ok' | 'lost' | 'wrong_first' | 'short' | 'not_your_name' | 'changed';
type Stored = Record<string, unknown> & { id: string; status: string };
const hub = {
  mode: 'ok' as Mode,
  balanceKobo: 48_525_075,
  payout: PAYOUT as typeof PAYOUT | null,
  quotes: 0,
  sends: [] as { pin: string | null; key: string; body: Record<string, unknown> }[],
  created: {} as Record<string, Stored>,
  debits: 0,
  stored: null as Stored | null,
  /** What the next reads of the send answer: the bank's decision, moved by the test. */
  decision: 'pending' as 'pending' | 'sent' | 'completed' | 'failed',
};

const quote = (amountKobo: number, wawu = WAWU) => ({
  kind: 'bank_transfer',
  billCategory: null,
  amountKobo,
  fee: { providerFeeKobo: PROVIDER, wawuFeeKobo: wawu, totalFeeKobo: PROVIDER + wawu },
  parts: [
    { code: 'bank_transfer', source: 'provider', amountKobo: PROVIDER },
    { code: 'wawu_fee', source: 'wawu', amountKobo: wawu },
  ],
  totalKobo: amountKobo + PROVIDER + wawu,
  withinDailyLimit: true,
  remainingTodayKobo: null,
  quoteToken: `tok-${amountKobo}-${wawu}`,
  expiresAt: '2099-01-01T00:00:00.000Z',
});

function transferView(body: Record<string, unknown>): Stored {
  const amountKobo = Number(body.amountKobo);
  const decided = hub.decision;
  const status = decided === 'completed' ? 'completed' : decided === 'failed' ? 'failed' : 'pending';
  const timeline: Record<string, unknown>[] = [{ step: 'requested', at: '2026-10-16T09:42:00.000Z' }];
  if (decided === 'sent' || decided === 'completed') timeline.push({ step: 'sent_to_bank', at: '2026-10-16T09:43:00.000Z' });
  if (decided === 'completed') timeline.push({ step: 'completed', at: '2026-10-16T09:50:00.000Z' });
  return {
    id: TRANSFER_ID,
    kind: 'bank_account',
    status,
    amountKobo,
    fee: { providerFeeKobo: PROVIDER, wawuFeeKobo: WAWU, totalFeeKobo: PROVIDER + WAWU },
    totalKobo: Number(body.expectedTotalKobo),
    note: null,
    reference: 'wawu-bank-7c1d4a90',
    toWawuUser: null,
    toBankAccount: { bankCode: PAYOUT.bankCode, bankName: PAYOUT.bankName, accountNumber: PAYOUT.accountNumber, accountName: PAYOUT.accountName },
    timeline,
    failureReason: decided === 'failed' ? 'The bank did not take the transfer.' : null,
    reversal: decided === 'failed' ? { returnedKobo: amountKobo + WAWU, keptKobo: PROVIDER, reversedAt: '2026-10-16T09:55:00.000Z' } : null,
    statusMessage: status === 'pending' ? 'Waiting for the bank.' : null,
    transactionId: null,
    createdAt: '2026-10-16T09:42:00.000Z',
    completedAt: decided === 'completed' ? '2026-10-16T09:50:00.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-16T09:00:00.000Z' });
  if (path === '/money/payout-account') return ok(hub.payout);
  if (path === '/money/fees/quote') {
    hub.quotes += 1;
    return ok(quote(Number(url.searchParams.get('amountKobo')), hub.mode === 'changed' && hub.quotes > 1 ? 3500 : WAWU));
  }
  if (path === '/money/transfers/bank' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.sends.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    if (hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (hub.mode === 'wrong_first' && hub.sends.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough money.', balanceKobo: 100_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 100_000 });
    if (hub.mode === 'not_your_name') return refuse(409, { code: 'account_not_in_your_name', message: 'This account is not in your name. Save one that is, then withdraw.' });
    hub.stored = transferView(body);
    hub.created[key] = hub.stored;
    hub.debits += 1;
    if (hub.mode === 'lost' && hub.debits === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return json(201, { statusCode: 201, message: 'Created', data: hub.stored });
  }
  if (path === `/money/transfers/${TRANSFER_ID}` && method === 'GET') {
    hub.stored = hub.stored ? transferView({ amountKobo: hub.stored.amountKobo, expectedTotalKobo: hub.stored.totalKobo }) : null;
    return hub.stored ? ok(hub.stored) : json(404, { statusCode: 404, message: 'Not found' });
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
function WalletStandIn() {
  const router = useRouter();
  const { WalletActions } = require('@/features/wallet/home/WalletActions') as typeof import('@/features/wallet/home/WalletActions');
  return (
    <View>
      <Text accessibilityRole="header">Wallet tab</Text>
      <WalletActions actions={[{ key: 'withdraw', icon: 'Landmark', label: 'Withdraw', onPress: () => router.push('/withdraw') }]} />
    </View>
  );
}

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
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
    'payout-account': stub('Payout bank'),
    'withdraw/index': page('@/app/withdraw/index'),
    'withdraw/receipt': page('@/app/withdraw/receipt'),
    'withdraw/failed': page('@/app/withdraw/failed'),
    'send/receipt': stub('Send receipt'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { mode: 'ok', balanceKobo: 48_525_075, payout: PAYOUT, quotes: 0, sends: [], created: {}, debits: 0, stored: null, decision: 'pending' });
  (require('@/features/send/intent') as { forgetIntentsInMemory: () => void }).forgetIntentsInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f6'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
  jest.restoreAllMocks();
});
afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const tick = async (ms: number) => {
  for (let spent = 0; spent < ms; spent += 50) {
    await act(async () => {
      jest.advanceTimersByTime(50);
    });
  }
};
const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
const typeAmount = (text: string) => fireEvent.changeText(screen.getByTestId('withdraw-amount'), text);

/** The Wallet tab, Withdraw: W17 with the balance and the payout account read. */
async function toWithdraw() {
  await renderRouter(routes, { initialUrl: '/wallet' });
  await fireEvent.press(await screen.findByRole('button', { name: 'Withdraw' }));
  await screen.findByTestId('withdraw-available');
  await screen.findByTestId('withdraw-destination');
}
/** Types ₦50,000 and waits for its fees. */
async function toQuoted(text = '50000') {
  await toWithdraw();
  await typeAmount(text);
  await screen.findByTestId('withdraw-fees');
}
/** Every string on screen, in order, joined: a figure drawn as "₦", "40" and ".00" reads as "₦40.00". */
const plain = () => {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === 'string') out.push(node);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') walk((node as { children?: unknown }).children);
  };
  walk(screen.toJSON());
  return out.join('');
};
const submit = () => screen.getByTestId('withdraw-submit');
async function enterPin(pin = '1234') {
  await screen.findByText(/^Approve ₦/);
  await tap(pin);
}

describe('W17 · Withdraw', () => {
  it('a user taps Withdraw on the Wallet tab and sees the bank’s balance, the payout account as the destination with Change, and no fee until there is an amount', async () => {
    await toWithdraw();
    expect(pathname()).toBe('/withdraw');
    expect(plain()).toContain('₦485,250.75');
    expect(screen.getByText('Available in Naira')).toBeTruthy();
    expect(screen.getByTestId('withdraw-destination-line').props.children).toBe('Access Bank · 0987654321');
    expect(screen.getByTestId('withdraw-destination-sub').props.children).toBe('Lennox Emmanuel · payout account');
    expect(screen.getByRole('button', { name: 'Change the payout account' })).toBeTruthy();
    expect(screen.queryByTestId('withdraw-fees')).toBeNull();
    expect(submit().props.accessibilityState?.disabled).toBe(true);
  });

  it('shows ₦40 + ₦25 = ₦65 on ₦50,000, the button “Withdraw ₦50,065” and the line “Your bank gets ₦50,000”', async () => {
    await toQuoted();
    expect(screen.getByText('Bank charge')).toBeTruthy();
    expect(screen.getByText("WAWU's fee")).toBeTruthy();
    expect(screen.getByText('Fees')).toBeTruthy();
    for (const row of ['withdraw-fee-bank', 'withdraw-fee-wawu', 'withdraw-fee-total']) expect(screen.getByTestId(row)).toBeTruthy();
    expect(plain()).toMatch(/Bank charge₦40.*WAWU's fee₦25.*Fees₦65/);
    expect(screen.getByRole('button', { name: 'Withdraw ₦50,065' })).toBeTruthy();
    expect(screen.getByTestId('withdraw-gets').props.children).toBe('Your bank gets ₦50,000');
    expect(screen.queryByText(/Fintava|Nuvion/)).toBeNull();
  });

  it('Max fills the most the balance and its fees allow, from the Hub’s own fee', async () => {
    await toWithdraw();
    await fireEvent.press(screen.getByRole('button', { name: 'Withdraw the most you can' }));
    await screen.findByTestId('withdraw-fees');
    // ₦485,250.75 less ₦65: ₦485,185.75, and the button shows the whole balance.
    expect(screen.getByTestId('withdraw-amount').props.value).toBe('485,185.75');
    expect(screen.getByRole('button', { name: 'Withdraw ₦485,250.75' })).toBeTruthy();
    expect(screen.queryByTestId('withdraw-block')).toBeNull();
  });

  it('Change opens the payout account screen (A21)', async () => {
    await toWithdraw();
    await fireEvent.press(screen.getByRole('button', { name: 'Change the payout account' }));
    await waitFor(() => expect(pathname()).toBe('/payout-account'));
  });

  it('an amount over the balance is said in the bank’s figure, and Withdraw stays off', async () => {
    await toWithdraw();
    await typeAmount('600000');
    expect(await screen.findByText('Over your balance of ₦485,250.75')).toBeTruthy();
    expect(submit().props.accessibilityState?.disabled).toBe(true);
  });

  it('an amount whose fees tip it over the balance names the shortfall and asks for a smaller amount', async () => {
    hub.balanceKobo = 5_003_000;
    await toQuoted('50000');
    expect(await screen.findByTestId('withdraw-block')).toBeTruthy();
    expect(plain()).toContain('Take ₦35 off the amount');
    expect(submit().props.accessibilityState?.disabled).toBe(true);
  });

  it('with no payout account it says so and leads to A21; withdrawing is off', async () => {
    hub.payout = null;
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Withdraw' }));
    expect(await screen.findByTestId('withdraw-no-account')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Change the payout account' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Add a payout account' }));
    await waitFor(() => expect(pathname()).toBe('/payout-account'));
  });

  it('a payout account that is not in the person’s name blocks Withdraw before any PIN (R-51)', async () => {
    hub.payout = { ...PAYOUT, matchesBvnName: false };
    await toQuoted();
    expect(screen.getByText('This payout account is not in your name. Change it to withdraw.')).toBeTruthy();
    expect(submit().props.accessibilityState?.disabled).toBe(true);
    expect(hub.sends).toHaveLength(0);
  });
});

describe('Withdraw, the PIN and W19', () => {
  it('Withdraw asks the PIN, sends once to the payout account with one key and the quote it saw, and opens W19 “on its way” with its timeline', async () => {
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(pathname()).toBe('/withdraw/receipt');
    expect(hub.sends).toHaveLength(1);
    const sent = hub.sends[0]!;
    expect(sent.pin).toBe('1234');
    expect(sent.key.length).toBeGreaterThan(7);
    expect(sent.body).toEqual({ bankCode: '044', accountNumber: '0987654321', amountKobo: 5_000_000, expectedTotalKobo: 5_006_500, quoteToken: 'tok-5000000-2500' });
    expect(screen.getByTestId('withdraw-receipt-word').props.children).toBe('on its way');
    expect(screen.getByTestId('withdraw-receipt-to').props.children).toBe('To Access Bank · 0987654321');
    expect(screen.getByTestId('withdraw-step-requested-time').props.children).toBe('10:42');
    expect(screen.getByText('Sent to Access Bank')).toBeTruthy();
    expect(screen.getByText('In your bank account')).toBeTruthy();
    expect(screen.queryByText(/Usually within minutes/)).toBeNull();
    expect(screen.getByText('Total paid')).toBeTruthy();
    expect(screen.getByText('wawu-bank-7c1d4a90')).toBeTruthy();
  });

  it('W19 fills in as the bank decides: the second step gets its time, then “sent” once the bank account has it', async () => {
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin();
    await screen.findByTestId('withdraw-receipt-screen');
    expect(screen.queryByTestId('withdraw-step-sent-time')).toBeNull();
    hub.decision = 'sent';
    await tick(4200);
    expect(await screen.findByTestId('withdraw-step-sent-time')).toBeTruthy();
    expect(screen.getByTestId('withdraw-step-sent-time').props.children).toBe('10:43');
    hub.decision = 'completed';
    await tick(4200);
    await waitFor(() => expect(screen.getByTestId('withdraw-receipt-word').props.children).toBe('sent'));
    expect(screen.getByTestId('withdraw-step-arrived-time').props.children).toBe('10:50');
  });

  it('Share receipt opens the phone’s share sheet with the receipt and its reference, and Done returns to the Wallet tab', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin();
    await screen.findByTestId('withdraw-receipt-screen');
    await fireEvent.press(screen.getByRole('button', { name: 'Share receipt' }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0]?.[0]?.message).toContain('Reference: wawu-bank-7c1d4a90');
    expect(share.mock.calls[0]?.[0]?.message).toContain('Total paid: ₦50,065');
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('ATTACK double tap: two taps on Withdraw open one PIN sheet and one send', async () => {
    await toQuoted();
    await fireEvent.press(submit());
    await fireEvent.press(submit());
    await enterPin();
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends).toHaveLength(1);
    expect(hub.debits).toBe(1);
  });

  it('ATTACK wrong PIN: the sheet says so and keeps the keypad, and the right PIN goes with the SAME key, so the money moves once', async () => {
    hub.mode = 'wrong_first';
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin('0000');
    expect(await screen.findByText(/4 tries left|tries left/i)).toBeTruthy();
    await tap('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[0]!.key).toBe(hub.sends[1]!.key);
    expect(hub.sends[0]!.pin).toBe('0000');
    expect(hub.debits).toBe(1);
  });

  it('ATTACK short balance: the Hub’s refusal shows the bank’s own balance, nothing is withdrawn and the next try is a new attempt', async () => {
    hub.mode = 'short';
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin();
    expect(await screen.findByText('Over your balance of ₦1,000')).toBeTruthy();
    expect(hub.debits).toBe(0);
    expect(pathname()).toBe('/withdraw');
  });

  it('ATTACK a lost answer, then a retry: the same request goes again, with the same key and quote, and the money moves once', async () => {
    hub.mode = 'lost';
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin();
    // The Hub took it and the answer never came: the sheet asks again, and nothing moves on.
    await waitFor(() => expect(hub.sends).toHaveLength(1));
    expect(pathname()).toBe('/withdraw');
    await tick(300);
    await tap('1234');
    await screen.findByTestId('withdraw-receipt-screen');
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1]!.key).toBe(hub.sends[0]!.key);
    expect(hub.sends[1]!.body).toEqual(hub.sends[0]!.body);
    expect(hub.debits).toBe(1);
  });

  it('a fresh quote is asked for on every tap: a fee that moved between the amount and the tap shows the new total and opens no PIN sheet', async () => {
    hub.mode = 'changed';
    await toQuoted();
    await fireEvent.press(submit());
    expect(await screen.findByText('The fees changed. Check the new total before you withdraw.')).toBeTruthy();
    expect(screen.queryByText(/^Approve ₦/)).toBeNull();
    expect(hub.sends).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Withdraw ₦50,075' })).toBeTruthy();
  });

  it('the Hub refusing an account not in the person’s name is said in its words, with nothing taken', async () => {
    hub.mode = 'not_your_name';
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin();
    expect(await screen.findByText('This account is not in your name. Save one that is, then withdraw.')).toBeTruthy();
    expect(screen.getByText('This withdrawal was not taken')).toBeTruthy();
    expect(hub.debits).toBe(0);
  });

  it('ATTACK a withdrawal the bank fails: W19 hands over to W14, which says the money is back from the Hub’s record', async () => {
    await toQuoted();
    await fireEvent.press(submit());
    await enterPin();
    await screen.findByTestId('withdraw-receipt-screen');
    hub.decision = 'failed';
    await tick(4200);
    await waitFor(() => expect(pathname()).toBe('/withdraw/failed'));
    expect(await screen.findByText("Transfer didn't go through")).toBeTruthy();
    expect(await screen.findByText('Your money is back')).toBeTruthy();
    expect(plain()).toContain('₦50,025');
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(pathname()).toBe('/withdraw'));
  });
});
