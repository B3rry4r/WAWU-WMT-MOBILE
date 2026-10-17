/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * I30 and I31 · A private community's monthly pass (INBOX-14, R-63). The Hub is a stand-in `fetch` installed before the app's modules load.
 * It answers in the Hub's shapes, records every quote and purchase (headers and body) and answers an Idempotency-Key it knows with the
 * first purchase, as the Hub does. This renderer draws a state change on its own clock, not inside `act`, so every check is repeated on a
 * real clock until it holds (`until`).
 */
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const ID = 'c0000000-0000-4000-8000-000000000001';
const PRICE = 200_000;
const BANK_CHARGE = 2325;
const TOTAL = PRICE + BANK_CHARGE;
const ENDS = '2026-11-16T12:00:00.000Z';
const REMOVED = 'The host has removed you from this room. Ask the host to let you back in.';

type Mode = 'paid' | 'pending' | 'lost_after' | 'short_on_pay' | 'changed';
const hub = {
  mode: 'paid' as Mode,
  balanceKobo: 48_525_075,
  pass: {} as Record<string, unknown>,
  quote: 'ok' as 'ok' | 'removed' | 'no_wallet',
  quotes: 0,
  buys: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Map<string, string>(),
  payments: 0,
  wrongFirst: false,
  purchaseReads: 0,
};

const newMember = () => ({ communityId: ID, sellsPass: true, priceKobo: PRICE, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: true, isHost: false });

function quoteView() {
  return {
    communityId: ID,
    title: 'Founders under 30',
    host: { wawuUserId: 'host1', displayName: 'Adaeze Okonkwo', handle: 'adaeze', avatarUrl: null, tick: null },
    priceKobo: PRICE,
    periodDays: 30,
    passUntil: (hub.pass.passUntil as string | null) ?? null,
    newPassUntil: ENDS,
    payment: {
      kind: 'community_pass',
      targetId: ID,
      title: 'Founders under 30',
      payee: null,
      priceKobo: PRICE,
      fee: { providerFeeKobo: BANK_CHARGE, wawuFeeKobo: 0, totalFeeKobo: BANK_CHARGE },
      totalKobo: TOTAL,
      balanceKobo: hub.balanceKobo,
      shortfallKobo: hub.balanceKobo < TOTAL ? TOTAL - hub.balanceKobo : null,
      willBeHeld: false,
      withinDailyLimit: true,
      remainingTodayKobo: null,
      quoteToken: 'tok-pass',
      expiresAt: '2099-01-01T00:00:00.000Z',
    },
  };
}

function purchaseView(status: 'paid' | 'pending') {
  return {
    id: 'cpp-1',
    method: 'wallet',
    communityId: ID,
    title: 'Founders under 30',
    status,
    statusMessage: status === 'pending' ? 'Paid, finishing it.' : null,
    priceKobo: PRICE,
    passUntil: status === 'paid' ? ENDS : null,
    payment: {
      id: 'pay-1',
      kind: 'community_pass',
      targetId: ID,
      title: 'Founders under 30',
      status: status === 'paid' ? 'completed' : 'pending',
      priceKobo: PRICE,
      fee: { providerFeeKobo: BANK_CHARGE, wawuFeeKobo: 0, totalFeeKobo: BANK_CHARGE },
      totalKobo: TOTAL,
      reference: 'WAW-PASS-1',
      hold: null,
      failureReason: null,
      delivered: status === 'paid',
      statusMessage: null,
      createdAt: '2026-10-17T10:00:00.000Z',
      completedAt: status === 'paid' ? '2026-10-17T10:00:03.000Z' : null,
    },
    createdAt: '2026-10-17T10:00:00.000Z',
    paidAt: status === 'paid' ? '2026-10-17T10:00:03.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === `/communities/${ID}/room`) {
    return ok({ id: ID, name: 'Founders under 30', kind: 'private', imageUrl: null, description: 'A room', hostWawuId: 'host1', memberCount: 640, messagesToday: 0, slug: 'founders', link: 'wawu/c/founders', role: 'none', messageCostInCredits: 1 });
  }
  if (path === '/users/host1/public-profile') return ok({ handle: 'adaeze' });
  if (path === `/communities/${ID}/pass` && method === 'GET') return ok(hub.pass);
  if (path === `/communities/${ID}/pass/quote`) {
    hub.quotes += 1;
    if (hub.quote === 'no_wallet') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.quote === 'removed') return refuse(409, { code: 'target_not_payable', message: REMOVED });
    return ok(quoteView());
  }
  if (path === `/communities/${ID}/pass` && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.buys.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    // The Hub answers a key it knows with the first purchase, before it looks at the PIN or the quote.
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: purchaseView(hub.paidKeys.get(key) as 'paid') });
    if (hub.wrongFirst && hub.buys.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'short_on_pay') return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 50_000, totalKobo: TOTAL, shortfallKobo: TOTAL - 50_000 });
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      hub.paidKeys.set(key, 'paid');
      hub.payments += 1;
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    const status = hub.mode === 'pending' ? 'pending' : 'paid';
    hub.paidKeys.set(key, status);
    hub.payments += 1;
    return json(201, { statusCode: 201, message: 'Created', data: purchaseView(status) });
  }
  if (path === `/communities/${ID}/pass/cpp-1` && method === 'GET') {
    hub.purchaseReads += 1;
    return ok(purchaseView('paid'));
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn(), canGoBack: () => true }),
}));
const mockPush = jest.fn();
const mockReplace = jest.fn();

const { PassScreen } = require('../PassScreen') as typeof import('../PassScreen');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  forgetAttempts();
  mockPush.mockClear();
  mockReplace.mockClear();
  Object.assign(hub, {
    mode: 'paid',
    balanceKobo: 48_525_075,
    pass: newMember(),
    quote: 'ok',
    quotes: 0,
    buys: [],
    paidKeys: new Map<string, string>(),
    payments: 0,
    wrongFirst: false,
    purchaseReads: 0,
  });
});

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

/** A check repeated on a real clock until it holds (or 4 seconds pass). */
async function until<T>(check: () => T): Promise<T> {
  const end = Date.now() + 4000;
  for (;;) {
    try {
      return check();
    } catch (error) {
      if (Date.now() > end) throw error;
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
}

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

async function boot() {
  const onBack = jest.fn();
  await render(<PassScreen id={ID} onBack={onBack} />);
  await until(() => rtl.screen.getByTestId('pass-body'));
  return onBack;
}

const pressTest = (testID: string) => rtl.fireEvent.press(rtl.screen.getByTestId(testID));
async function enterPin(pin: string) {
  for (const digit of pin) {
    const key = await until(() => rtl.screen.getByRole('button', { name: digit }));
    rtl.fireEvent.press(key);
    // The next digit waits for this one to be drawn: a press meets the screen as it was drawn last.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}
const payLabel = () => rtl.screen.getByTestId('pass-pay').props.accessibilityLabel as string;
async function reachPin() {
  await until(() => expect(payLabel()).toContain('Join · ₦2,023.25'));
  pressTest('pass-pay');
  await until(() => rtl.screen.getByText(/ for a 30 day pass$/));
}

describe('I30: a private room that sells a pass', () => {
  it('a person with no pass sees the host\'s price, the bank charge and the total, and the button carries the total', async () => {
    await boot();
    await until(() => rtl.screen.getByTestId('pass-total'));
    expect(rtl.screen.getByTestId('pass-price').props.children).toBeTruthy();
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByText('Reading inside is free.', { exact: false })).toBeTruthy();
    await until(() => expect(payLabel()).toContain('Join · ₦2,023.25'));
    // No host approval, no request, nothing about a monthly debit by itself.
    expect(rtl.screen.queryByText(/approve|request sent|renews 16|cancel any time/i)).toBeNull();
  });

  it('a user pays with the PIN: one purchase carrying the quote the person saw, then I31 says what was paid and when the pass ends', async () => {
    await boot();
    await reachPin();
    await enterPin('4829');
    await until(() => rtl.screen.getByTestId('pass-joined-title'));
    expect(rtl.screen.getByTestId('pass-joined-line').props.children).toBe('Paid ₦2,023.25 from your wallet. Your pass ends on 16 November.');
    expect(rtl.screen.getByText('Member')).toBeTruthy();
    expect(hub.buys).toHaveLength(1);
    expect(hub.buys[0].pin).toBe('4829');
    expect(hub.buys[0].body).toEqual({ expectedTotalKobo: TOTAL, quoteToken: 'tok-pass' });
    expect(hub.buys[0].key).toBeTruthy();
    expect(hub.payments).toBe(1);
  });

  it('a fresh quote is asked for on the tap, before the PIN', async () => {
    await boot();
    await until(() => expect(hub.quotes).toBeGreaterThan(0));
    const before = hub.quotes;
    await reachPin();
    expect(hub.quotes).toBe(before + 1);
  });

  it('a wrong PIN, then the right one: the Hub refused the first before anything moved, so the second is a new attempt, and one pass is given', async () => {
    hub.wrongFirst = true;
    await boot();
    await reachPin();
    await enterPin('1111');
    await until(() => expect(hub.buys).toHaveLength(1));
    await until(() => rtl.screen.getByText(/4 tries left|incorrect|wrong/i, { exact: false }));
    await enterPin('4829');
    await until(() => rtl.screen.getByTestId('pass-joined-title'));
    expect(hub.buys).toHaveLength(2);
    // A refused PIN proves nothing moved, so the next try is its own attempt (a fresh key); only the second was ever paid.
    expect(hub.buys[1].key).not.toBe(hub.buys[0].key);
    expect(hub.buys[1].body.expectedTotalKobo).toBe(hub.buys[0].body.expectedTotalKobo);
    expect(hub.payments).toBe(1);
    expect(hub.paidKeys.size).toBe(1);
  });

  it('an answer that is lost after the Hub took the payment, then a retry: one debit and one pass', async () => {
    hub.mode = 'lost_after';
    await boot();
    await reachPin();
    await enterPin('4829');
    await until(() => expect(hub.buys).toHaveLength(1));
    // The answer never came: the PIN sheet is still up and asks again with the same request.
    await until(() => rtl.screen.getByText(/connection|try again|didn.t hear/i, { exact: false }));
    await enterPin('4829');
    await until(() => rtl.screen.getByTestId('pass-joined-title'));
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[1].key).toBe(hub.buys[0].key);
    expect(hub.payments).toBe(1);
  });

  it('a wallet that is short shows what is missing and "Add ₦X", which opens W15 with the shortfall, and sends nothing (WALLET-05)', async () => {
    hub.balanceKobo = 50_000;
    await boot();
    await until(() => rtl.screen.getByTestId('pass-short'));
    const add = await until(() => rtl.screen.getByTestId('pass-add'));
    expect(add.props.accessibilityLabel).toContain('Add ₦1,523.25');
    expect(rtl.screen.getByTestId('pass-pay').props.accessibilityState.disabled).toBe(true);
    rtl.fireEvent.press(add);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/add-money', params: { short: String(TOTAL - 50_000) } });
    expect(hub.buys).toHaveLength(0);
  });

  it('a person with no wallet is led to Open your wallet, and nothing is sent', async () => {
    hub.quote = 'no_wallet';
    await boot();
    await until(() => rtl.screen.getByTestId('pass-no-wallet'));
    expect(rtl.screen.getByTestId('pass-pay').props.accessibilityLabel).toContain('Join · ₦2,000 a month');
    expect(hub.buys).toHaveLength(0);
  });
});

describe('I31 and a pass that ended', () => {
  it('a member with time left sees "You\'re in" with the end day and a Renew that adds 30 days, never an automatic one', async () => {
    hub.pass = { ...newMember(), passUntil: ENDS, active: true, canRenew: true, canBuy: true };
    await boot();
    await until(() => rtl.screen.getByTestId('pass-joined-title'));
    expect(rtl.screen.getByTestId('pass-joined-line').props.children).toBe('Your pass ends on 16 November. Renew any time to add 30 days.');
    await until(() => expect(payLabel()).toContain('Renew · ₦2,023.25'));
    expect(rtl.screen.getByTestId('pass-open')).toBeTruthy();
    expect(hub.buys).toHaveLength(0);
  });

  it('a person whose pass ended is shown the way back in: Renew, with the day it ended', async () => {
    hub.pass = { ...newMember(), passUntil: '2026-10-01T12:00:00.000Z', active: false, canRenew: true, canBuy: true };
    await boot();
    await until(() => rtl.screen.getByTestId('pass-ended-title'));
    expect(rtl.screen.getByTestId('pass-ended-line').props.children).toBe('Your pass ended on 1 October. Renew to come back in.');
    await until(() => expect(payLabel()).toContain('Renew · ₦2,023.25'));
  });

  it('renewing early pays once and I31 shows the new end day', async () => {
    hub.pass = { ...newMember(), passUntil: '2026-10-25T12:00:00.000Z', active: true, canRenew: true, canBuy: true };
    await boot();
    await until(() => expect(payLabel()).toContain('Renew · ₦2,023.25'));
    pressTest('pass-pay');
    await until(() => rtl.screen.getByText(/ for a 30 day pass$/));
    await enterPin('4829');
    await until(() => expect(rtl.screen.getByTestId('pass-joined-line').props.children).toBe('Paid ₦2,023.25 from your wallet. Your pass ends on 16 November.'));
    expect(hub.buys).toHaveLength(1);
  });
});

describe('a member the host removed (R-63: there is no join request)', () => {
  it('sees the Hub\'s own sentence and no Pay, and nothing is sent', async () => {
    hub.pass = { ...newMember(), canBuy: false, canRenew: false };
    hub.quote = 'removed';
    await boot();
    const blocked = await until(() => rtl.screen.getByTestId('pass-blocked'));
    expect(blocked).toBeTruthy();
    expect(rtl.screen.getByText('Removed by the host')).toBeTruthy();
    expect(rtl.screen.getByText(REMOVED)).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
    expect(rtl.screen.queryByText(/Join ·|Renew ·/)).toBeNull();
    expect(hub.buys).toHaveLength(0);
  });
});

describe('the host', () => {
  it('is inside already: the room opens and nothing is asked for', async () => {
    hub.pass = { ...newMember(), canBuy: false, isHost: true };
    await boot();
    await until(() => rtl.screen.getByTestId('pass-joined-title'));
    expect(rtl.screen.getByText('You host this room')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pass-pay')).toBeNull();
    expect(hub.quotes).toBe(0);
  });
});
