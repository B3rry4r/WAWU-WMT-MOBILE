/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
const Clipboard = jest.mocked(require('expo-clipboard') as typeof import('expo-clipboard'));

/**
 * BILLS-09 (R-102), S7: the token card, Copy token and the units line when the Hub gives them, and the status read while a bill is
 * `processing` (every 10 seconds, for up to 3 minutes, then the "on its way" state stays, with Done).
 */

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(key);
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { ReceiptScreen, STATUS_READ } = require('../ReceiptScreen') as typeof import('../ReceiptScreen');
const { readRecord, fetchStatus, recordKey } = require('../api') as typeof import('../api');
const { groupToken } = require('../TokenCard') as typeof import('../TokenCard');
const { billDraft } = require('../draft') as typeof import('../draft');

queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });

const TOKEN = '4821 0937 5510 2286 7734';
const BILL = (over: Record<string, unknown> = {}) => ({
  id: 'bill-1',
  category: 'Utility Bills',
  billerName: 'Ikeja Electric',
  customerRef: '04123456789',
  amount: 10000,
  fee: 0,
  status: 'processing',
  providerReference: 'BPUSSD123',
  failureReason: null,
  createdAt: '2026-10-29T10:42:00.000Z',
  deliveredAt: null,
  refundReference: null,
  refundedAt: null,
  token: null,
  units: null,
  ...over,
});
const mine = (...items: unknown[]) => [ok({ items, currentPage: 1, perPage: 50, total: items.length })];
const status = (over: Record<string, unknown> = {}) =>
  ok({ id: 'bill-1', status: 'processing', token: null, units: null, providerReference: 'BPUSSD123', ...over });

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const open = (over: Partial<import('../ReceiptScreen').ReceiptScreenProps> = {}) =>
  rtl.render(wrap(<ReceiptScreen id="bill-1" onDone={jest.fn()} onTryAgain={jest.fn()} {...over} />));
const asked = (key: string) => sent.filter((s) => s === key).length;
const STATUS_KEY = 'GET /bills/bill-1/status';
const press = (testID: string) =>
  rtl.act(async () => {
    rtl.fireEvent.press(rtl.screen.getByTestId(testID));
  });
/** With the clock held, the query cache hands its answers over on a zero-length timer: step the clock a hair, a few times, and let promises run. */
const flush = async () => {
  for (let i = 0; i < 6; i++) {
    await rtl.act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
      await new Promise<void>((resolve) => setImmediate(resolve));
    });
  }
};
/** Moves the clock and lets the answers that were asked for land. */
const advance = async (ms: number) => {
  await rtl.act(async () => {
    jest.advanceTimersByTime(ms);
  });
  await flush();
};

beforeEach(() => {
  answers = {};
  sent = [];
  billDraft.clear();
  queryClient.clear();
  Clipboard.setStringAsync.mockClear();
});

afterEach(async () => {
  jest.useRealTimers();
  await queryClient.cancelQueries();
  rtl.cleanup();
  queryClient.clear();
});

describe('S7 · the token card', () => {
  it('a delivered electricity bill shows "Your token", the token in groups, Copy token and the units', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: '48210937551022867734', units: '45.2' }));
    await open();
    await rtl.screen.findByTestId('receipt-token-card');
    expect(rtl.screen.getByText('Your token')).toBeTruthy();
    expect(rtl.screen.getByTestId('receipt-token').props.children).toBe(TOKEN);
    expect(rtl.screen.getByText('Copy token')).toBeTruthy();
    expect(rtl.screen.getByText('45.2 kWh')).toBeTruthy();
    // The rest of S7 is as it was: the number, the reference, the date and the total.
    expect(rtl.screen.getByText('0412 3456 789')).toBeTruthy();
    expect(rtl.screen.getByText('BPUSSD123')).toBeTruthy();
    expect(rtl.screen.getByText('Total paid')).toBeTruthy();
  });

  it('Copy token puts the token on the phone, then says Copied', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: TOKEN, units: '45.2' }));
    await open();
    await rtl.screen.findByTestId('receipt-token-copy');
    await press('receipt-token-copy');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(TOKEN);
    await rtl.waitFor(() => expect(rtl.screen.getByText('Copied')).toBeTruthy());
  });

  it('never says Copied when the phone refuses', async () => {
    Clipboard.setStringAsync.mockResolvedValueOnce(false);
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: TOKEN }));
    await open();
    await rtl.screen.findByTestId('receipt-token-copy');
    await press('receipt-token-copy');
    expect(rtl.screen.queryByText('Copied')).toBeNull();
    expect(rtl.screen.getByText('Copy token')).toBeTruthy();
  });

  it('a token with no units draws no units line', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: TOKEN, units: null }));
    await open();
    await rtl.screen.findByTestId('receipt-token-card');
    expect(rtl.screen.queryByTestId('receipt-units')).toBeNull();
  });

  it('units with no token draw no card and no units line', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: null, units: '45.2' }));
    await open();
    await rtl.screen.findByTestId('receipt-card');
    expect(rtl.screen.queryByTestId('receipt-token-card')).toBeNull();
    expect(rtl.screen.queryByText('45.2 kWh')).toBeNull();
  });

  it('a bill with no token (airtime, data, cable) is S7 as before: no card', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', category: 'Airtime', customerRef: '08031234412' }));
    await open();
    await rtl.screen.findByTestId('receipt-card');
    expect(rtl.screen.queryByText('Your token')).toBeNull();
    expect(rtl.screen.queryByText('Copy token')).toBeNull();
  });

  it('a token the Hub gave before the provider confirmed is drawn, and the bill still reads "on its way"', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'processing', token: TOKEN }));
    answers[STATUS_KEY] = [status({ token: TOKEN })];
    await open();
    await rtl.screen.findByTestId('receipt-token-card');
    expect(rtl.screen.getByText('Payment received, on its way')).toBeTruthy();
  });

  it('a failed bill draws no token card', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'failed', token: TOKEN }));
    await open();
    await rtl.screen.findByTestId('failed-card');
    expect(rtl.screen.queryByTestId('receipt-token-card')).toBeNull();
  });
});

describe('S7 · the status read while a bill is processing', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
  });

  it('reads the bill once at once and then every 10 seconds, and stops when the Hub says delivered, with the token card', async () => {
    answers['GET /bills/mine'] = mine(BILL());
    answers[STATUS_KEY] = [status(), status(), status({ status: 'delivered', token: '48210937551022867734', units: '45.2' })];
    await open();
    await flush();
    await flush();
    expect(rtl.screen.getByText('Payment received, on its way')).toBeTruthy();
    expect(asked(STATUS_KEY)).toBe(1);
    expect(STATUS_READ.everyMs).toBe(10_000);

    await advance(9_000);
    expect(asked(STATUS_KEY)).toBe(1);
    await advance(1_500);
    expect(asked(STATUS_KEY)).toBe(2);
    expect(rtl.screen.getByText('Payment received, on its way')).toBeTruthy();

    await advance(10_000);
    expect(asked(STATUS_KEY)).toBe(3);
    await rtl.screen.findByTestId('receipt-token-card');
    expect(rtl.screen.getByTestId('receipt-token').props.children).toBe(TOKEN);
    expect(rtl.screen.getByText('45.2 kWh')).toBeTruthy();
    expect(rtl.screen.queryByText('Payment received, on its way')).toBeNull();
    expect(rtl.screen.getByTestId('receipt-share')).toBeTruthy();

    await advance(60_000);
    expect(asked(STATUS_KEY)).toBe(3);
  });

  it('a bill the Hub says failed becomes S12', async () => {
    answers['GET /bills/mine'] = mine(BILL());
    answers[STATUS_KEY] = [status({ status: 'failed' })];
    await open();
    await flush();
    await flush();
    await rtl.screen.findByTestId('failed-card');
    // Round 1 (lead ruling): a failed bill is one the Hub took the payment for, so it never says "Payment didn't go through".
    expect(rtl.screen.getByText("We couldn't deliver your bill")).toBeTruthy();
    expect(rtl.screen.getByTestId('receipt-retry')).toBeTruthy();
  });

  it('stops after 3 minutes and keeps the "on its way" state, with Done', async () => {
    answers['GET /bills/mine'] = mine(BILL());
    answers[STATUS_KEY] = [status()];
    const onDone = jest.fn();
    await open({ onDone });
    await flush();
    await flush();
    expect(STATUS_READ.forMs).toBe(180_000);
    // The clock moves ten seconds at a time, as it does on a phone, and each answer lands before the next tick.
    for (let seconds = 10; seconds <= 179; seconds += 10) await advance(10_000);
    const before = asked(STATUS_KEY);
    expect(before).toBeGreaterThanOrEqual(18);
    expect(before).toBeLessThanOrEqual(19);
    for (let seconds = 0; seconds < 60; seconds += 10) await advance(10_000);
    const after = asked(STATUS_KEY);
    expect(after).toBeLessThanOrEqual(19);
    for (let seconds = 0; seconds < 120; seconds += 10) await advance(10_000);
    expect(asked(STATUS_KEY)).toBe(after);
    expect(rtl.screen.getByText('Payment received, on its way')).toBeTruthy();
    expect(rtl.screen.queryByTestId('receipt-error')).toBeNull();
    await press('receipt-done');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a read that cannot be answered is not an error on screen: the state stays and the next read is tried', async () => {
    answers['GET /bills/mine'] = mine(BILL());
    answers[STATUS_KEY] = ['offline', status({ status: 'delivered', token: TOKEN })];
    await open();
    await flush();
    await flush();
    expect(asked(STATUS_KEY)).toBe(1);
    expect(rtl.screen.getByText('Payment received, on its way')).toBeTruthy();
    expect(rtl.screen.queryByTestId('receipt-error')).toBeNull();
    await advance(10_500);
    expect(asked(STATUS_KEY)).toBe(2);
    await rtl.screen.findByTestId('receipt-token-card');
  });

  it('a delivered bill that has its token, or a failed one, is not read at all', async () => {
    // (A delivered electricity bill with no token is read again: S7 says the token is not here yet, fixRound1.test.tsx.)
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: TOKEN }));
    await open();
    await flush();
    await flush();
    await advance(30_000);
    expect(asked(STATUS_KEY)).toBe(0);
  });
});

describe('the Hub’s records and status answers, read', () => {
  it('readRecord keeps a token and units as text, and drops anything that is not a plain token or number', () => {
    expect(readRecord(BILL({ token: TOKEN, units: '45.2' }))).toMatchObject({ token: TOKEN, units: '45.2' });
    expect(readRecord(BILL({ token: null, units: null }))).toMatchObject({ token: null, units: null });
    expect(readRecord(BILL({ token: undefined, units: undefined }))).toMatchObject({ token: null, units: null });
    expect(readRecord(BILL({ token: '<b>x</b>', units: 'lots' }))).toMatchObject({ token: null, units: null });
    expect(readRecord(BILL({ token: 12345678, units: 45.2 }))).toMatchObject({ token: null, units: null });
  });

  it('fetchStatus reads the Hub’s answer, and puts nothing in the record it does not hold', async () => {
    answers[STATUS_KEY] = [status({ status: 'delivered', token: TOKEN, units: '45.2' })];
    expect(await fetchStatus('bill-1')).toEqual({ id: 'bill-1', status: 'delivered', token: TOKEN, units: '45.2', providerReference: 'BPUSSD123' });
    answers[STATUS_KEY] = [ok({ id: 'bill-1', status: 'mystery' })];
    await expect(fetchStatus('bill-1')).rejects.toBeTruthy();
    expect(queryClient.getQueryData(recordKey('bill-1'))).toBeUndefined();
  });

  it('groupToken groups a run of digits in fours and leaves anything else as the Hub wrote it', () => {
    expect(groupToken('48210937551022867734')).toBe(TOKEN);
    expect(groupToken(TOKEN)).toBe(TOKEN);
    expect(groupToken('4821-0937-5510-2286-7734')).toBe('4821-0937-5510-2286-7734');
    expect(groupToken('ABCD1234')).toBe('ABCD1234');
    expect(groupToken('1234567')).toBe('1234567');
    expect(groupToken('12345678')).toBe('1234 5678');
  });
});
