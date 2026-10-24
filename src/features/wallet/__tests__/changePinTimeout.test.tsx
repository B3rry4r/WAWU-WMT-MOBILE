/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * FIX-87 (SHARED-CHANGES WALLET-06 #5): W36 and W37 against a Hub that takes the PIN change and never answers it.
 * The request ends after 30 s as "no answer", the screen says so and gives Back and Try again back, and Try again sends the
 * SAME request under the SAME key, so the Hub's one answer stands. A write without a key (the check of the PIN in use) is never ended.
 */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; pin: string | null; key: string | null; body: Record<string, unknown> | null; aborted: () => boolean };
/** A reply made when the request arrives; 'never' is a Hub that takes the request and does not answer; 'offline' is a phone with no network. */
type Answer = Reply | 'never' | 'offline' | ((call: Sent) => Reply | 'never' | 'offline');

const OWNER = '00000000-0000-4000-8000-0000000000a7';
const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
const state = (over: Record<string, unknown> = {}): Reply => ok({ isSet: true, changedAt: '2026-07-10T09:00:00.000Z', triesLeft: 5, lockedUntil: null, ...over });

let sent: Sent[] = [];
let fallback: Record<string, Answer> = {};
/** What the Hub did, by key: a repeat under a key it knows is answered with the first result, and nothing changes twice. */
let landed = new Map<string, Reply>();

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = await request.clone().text();
  const call: Sent = {
    method: request.method,
    path: url.pathname,
    pin: request.headers.get('x-transaction-pin'),
    key: request.headers.get('idempotency-key'),
    body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
    aborted: () => request.signal.aborted,
  };
  sent.push(call);
  const route = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  let answer = fallback[route];
  if (!answer) throw new Error(`no answer for ${route}`);
  if (typeof answer === 'function') answer = answer(call);
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'never')
    return new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const asked = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);
const press = async (name: string) => {
  await rtl.fireEvent.press(rtl.screen.getByRole('button', { name }));
};
async function type(digits: string) {
  for (const digit of digits) await press(digit);
}
/** Lets the fake clock run for `ms`, with React and the promises settling as it goes. */
const wait = (ms: number) =>
  rtl.act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
const backDisabled = () => Boolean(rtl.screen.getByRole('button', { name: 'Back' }).props.accessibilityState?.disabled);

const frame = (node: React.ReactElement) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
);

async function bootChange() {
  const { ChangePinScreen } = require('../settings/ChangePinScreen') as typeof import('../settings/ChangePinScreen');
  const props = { onBack: jest.fn(), onChanged: jest.fn(), onForgotPin: jest.fn(), onNoPin: jest.fn(), onNoWallet: jest.fn() };
  await rtl.render(frame(<ChangePinScreen {...props} />));
  await rtl.waitFor(() => expect(asked('GET', '/money/pin').length).toBeGreaterThan(0));
  return props;
}

/** A Hub that takes the first change under each key and, with `answerFirst` false, never answers that first request. */
function hubThatLosesTheFirstAnswer() {
  fallback['PUT /money/pin'] = (call) => {
    const key = call.key ?? '';
    const known = landed.get(key);
    if (known) return known;
    landed.set(key, state({ changedAt: '2026-10-10T09:00:00.000Z' }));
    return 'never';
  };
}

beforeEach(() => {
  // Only the clock and the timers are faked: the promises and the request objects run on the real queues.
  jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  sent = [];
  landed = new Map();
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/pin': state(), 'POST /money/pin/verify': state() };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
  jest.useRealTimers();
});

describe('W36 · a PIN change the Hub never answers (FIX-87)', () => {
  it('ends after 30 s as "no answer", gives Back back, and Try again sends the same request under the same key: the Hub\'s one answer stands', async () => {
    hubThatLosesTheFirstAnswer();
    const props = await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-new');
    await type('4821');
    await type('4821');

    // The change is out and the Hub says nothing: the spinner is up and Back is off, as it should be while it waits.
    await rtl.screen.findByTestId('change-pin-saving');
    expect(backDisabled()).toBe(true);
    await wait(29_000);
    expect(rtl.screen.getByTestId('change-pin-saving')).toBeTruthy();
    expect(backDisabled()).toBe(true);
    expect(asked('PUT', '/money/pin')).toHaveLength(1);
    expect(asked('PUT', '/money/pin')[0].aborted()).toBe(false);

    // At 30 s the request ends. The screen does not send a second one at once (it waited as long as it will): it says it does not know.
    await wait(1_100);
    expect(await rtl.screen.findByText(/^We couldn't tell whether your PIN was changed\./)).toBeTruthy();
    expect(rtl.screen.queryByTestId('change-pin-saving')).toBeNull();
    expect(asked('PUT', '/money/pin')).toHaveLength(1);
    expect(asked('PUT', '/money/pin')[0].aborted()).toBe(true);
    expect(backDisabled()).toBe(false);
    expect(props.onChanged).not.toHaveBeenCalled();

    // Try again is the same request: same key, same PIN in use, same two entries.
    await press('Try again');
    await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
    const puts = asked('PUT', '/money/pin');
    expect(puts).toHaveLength(2);
    expect(puts[1].key).toBe(puts[0].key);
    expect(puts[0].key).toMatch(/\S/);
    expect(puts[1].pin).toBe('1234');
    expect(puts[0].pin).toBe('1234');
    expect(puts[1].body).toEqual({ newPin: '4821', newPinConfirmation: '4821' });
    expect(puts[1].body).toEqual(puts[0].body);
    // The Hub changed the PIN once, and nothing else was asked to find out.
    expect(landed.size).toBe(1);
    expect(asked('POST', '/money/pin/verify')).toHaveLength(1);
  });

  it('Back works once the request has ended, and a PIN typed afresh is a new attempt under a new key', async () => {
    hubThatLosesTheFirstAnswer();
    const props = await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-new');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('change-pin-saving');
    await wait(30_500);
    await rtl.screen.findByText(/^We couldn't tell whether your PIN was changed\./);
    await press('Back');
    expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
    expect(props.onBack).not.toHaveBeenCalled();
    expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBeFalsy();
    await type('1357');
    await type('1357');
    await rtl.screen.findByTestId('change-pin-saving');
    const keys = asked('PUT', '/money/pin').map((c) => c.key);
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
    await wait(30_500);
  });

  it('F1: Back from the no-answer line, then the SAME new PIN again, is the same change under the same key: the Hub answers its first, and no try is spent', async () => {
    // A Hub that takes the first change and never answers it; a DIFFERENT key after that meets a PIN that has already changed.
    fallback['PUT /money/pin'] = (call) => {
      const known = landed.get(call.key ?? '');
      if (known) return known;
      if (landed.size > 0) return refusal(403, 'pin_incorrect', 'Wrong PIN. 4 tries left.');
      landed.set(call.key ?? '', state({ changedAt: '2026-10-18T09:00:00.000Z' }));
      return 'never';
    };
    const props = await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-new');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('change-pin-saving');
    await wait(30_500);
    await rtl.screen.findByText(/^We couldn't tell whether your PIN was changed\./);
    await press('Back');
    expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();

    // The same two entries again. The PIN in use is not asked for again, and the request is the first one, as it was.
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
    const puts = asked('PUT', '/money/pin');
    expect(puts).toHaveLength(2);
    expect(puts[1].key).toBe(puts[0].key);
    expect(puts[1].pin).toBe(puts[0].pin);
    expect(puts[1].body).toEqual(puts[0].body);
    expect(landed.size).toBe(1);
    expect(asked('POST', '/money/pin/verify')).toHaveLength(1);
    expect(rtl.screen.queryByText(/Wrong PIN/)).toBeNull();
  });

  it('F1: the same new PIN typed again after Back is the same change, but another PIN is another change under another key', async () => {
    hubThatLosesTheFirstAnswer();
    const props = await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-new');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('change-pin-saving');
    await wait(30_500);
    await rtl.screen.findByText(/^We couldn't tell whether your PIN was changed\./);
    // Back, then a first entry the same and a second entry that differs: the Hub would refuse it as a mismatch, and it is not the held change.
    await press('Back');
    await rtl.screen.findByText('Step 1 of 2');
    await type('4821');
    await type('4822');
    await rtl.waitFor(() => expect(asked('PUT', '/money/pin')).toHaveLength(2));
    const keys = asked('PUT', '/money/pin').map((c) => c.key);
    expect(new Set(keys).size).toBe(2);
    expect(props.onChanged).not.toHaveBeenCalled();
    await wait(30_500);
  });

  it('F2: the 30 s end reads "We didn\'t get an answer", not "No connection"; a phone with no network still reads "No connection"', async () => {
    hubThatLosesTheFirstAnswer();
    await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-new');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('change-pin-saving');
    await wait(30_500);
    expect(await rtl.screen.findByText("We couldn't tell whether your PIN was changed. We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    expect(rtl.screen.queryByText(/No connection/)).toBeNull();

    // Another visit, on a phone that is offline: the failure is at once, and it is offline.
    await rtl.cleanup();
    sent = [];
    fallback['PUT /money/pin'] = 'offline';
    await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-new');
    await type('4821');
    await type('4821');
    expect(await rtl.screen.findByText("We couldn't tell whether your PIN was changed. No connection. Check your internet and try again.")).toBeTruthy();
    expect(rtl.screen.queryByText(/We didn't get an answer/)).toBeNull();
  });

  it('a write without a key is never ended: the check of the PIN in use waits for the Hub for as long as it takes', async () => {
    fallback['POST /money/pin/verify'] = 'never';
    const props = await bootChange();
    await type('1234');
    await rtl.screen.findByTestId('change-pin-checking');
    await wait(300_000);
    expect(rtl.screen.getByTestId('change-pin-checking')).toBeTruthy();
    const verifies = asked('POST', '/money/pin/verify');
    expect(verifies).toHaveLength(1);
    expect(verifies[0].key).toBeNull();
    expect(verifies[0].aborted()).toBe(false);
    expect(props.onChanged).not.toHaveBeenCalled();
  });
});

describe('W37 · a reset the Hub never answers (FIX-87)', () => {
  const RESET = ok({
    resetId: '00000000-0000-4000-8000-0000000000b1',
    sentTo: '+234 *** *** 4412',
    resendAvailableAt: '2026-10-18T09:01:00.000Z',
    resendInSeconds: 60,
    expiresAt: '2026-10-18T09:10:00.000Z',
  });

  it('F1: Back to the boxes, then the SAME code and the SAME new PIN again, is the same reset under the same key: the code is not refused as used', async () => {
    fallback['POST /money/pin/reset'] = RESET;
    // The first confirm lands and is never answered; any other key then meets a code that was already used.
    fallback['POST /money/pin/reset/confirm'] = (call) => {
      const known = landed.get(call.key ?? '');
      if (known) return known;
      if (landed.size > 0) return refusal(400, 'reset_code_invalid', 'That code is not right or has already been used.');
      landed.set(call.key ?? '', state({ changedAt: '2026-10-18T09:00:00.000Z' }));
      return 'never';
    };
    const { ResetPinScreen } = require('../settings/ResetPinScreen') as typeof import('../settings/ResetPinScreen');
    const props = { onBack: jest.fn(), onDone: jest.fn(), onNoWallet: jest.fn(), onNoPin: jest.fn() };
    await rtl.render(frame(<ResetPinScreen {...props} />));
    await rtl.screen.findByText('To +234 *** *** 4412');
    await type('481902');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('reset-pin-saving');
    await wait(30_500);
    await rtl.screen.findByText(/^We couldn't tell whether your PIN was reset\./);
    // Back to the new PIN, Back to the boxes, and the same code and the same two entries again.
    await press('Back');
    await press('Back');
    await type('481902');
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    const confirms = asked('POST', '/money/pin/reset/confirm');
    expect(confirms).toHaveLength(2);
    expect(confirms[1].key).toBe(confirms[0].key);
    expect(confirms[1].body).toEqual(confirms[0].body);
    expect(landed.size).toBe(1);
    expect(rtl.screen.queryByText(/already been used/)).toBeNull();
  });

  it('F2: the 30 s end of a reset reads "We didn\'t get an answer", not "No connection"', async () => {
    fallback['POST /money/pin/reset'] = RESET;
    fallback['POST /money/pin/reset/confirm'] = 'never';
    const { ResetPinScreen } = require('../settings/ResetPinScreen') as typeof import('../settings/ResetPinScreen');
    const props = { onBack: jest.fn(), onDone: jest.fn(), onNoWallet: jest.fn(), onNoPin: jest.fn() };
    await rtl.render(frame(<ResetPinScreen {...props} />));
    await rtl.screen.findByText('To +234 *** *** 4412');
    await type('481902');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('reset-pin-saving');
    await wait(30_500);
    expect(await rtl.screen.findByText("We couldn't tell whether your PIN was reset. We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    expect(rtl.screen.queryByText(/No connection/)).toBeNull();
  });

  it('ends after 30 s as "no answer" and Try again sends the same request under the same key', async () => {
    const reset = ok({
      resetId: '00000000-0000-4000-8000-0000000000b1',
      sentTo: '+234 *** *** 4412',
      resendAvailableAt: '2026-10-18T09:01:00.000Z',
      resendInSeconds: 60,
      expiresAt: '2026-10-18T09:10:00.000Z',
    });
    fallback['POST /money/pin/reset'] = reset;
    fallback['POST /money/pin/reset/confirm'] = (call) => {
      const key = call.key ?? '';
      const known = landed.get(key);
      if (known) return known;
      landed.set(key, state({ changedAt: '2026-10-18T09:00:00.000Z' }));
      return 'never';
    };
    const { ResetPinScreen } = require('../settings/ResetPinScreen') as typeof import('../settings/ResetPinScreen');
    const props = { onBack: jest.fn(), onDone: jest.fn(), onNoWallet: jest.fn(), onNoPin: jest.fn() };
    await rtl.render(frame(<ResetPinScreen {...props} />));
    await rtl.screen.findByText('To +234 *** *** 4412');
    await type('481902');
    await type('4821');
    await type('4821');
    await rtl.screen.findByTestId('reset-pin-saving');
    await wait(30_500);
    expect(await rtl.screen.findByText(/^We couldn't tell whether your PIN was reset\./)).toBeTruthy();
    const confirms = asked('POST', '/money/pin/reset/confirm');
    expect(confirms).toHaveLength(1);
    expect(confirms[0].aborted()).toBe(true);
    await press('Try again');
    await rtl.waitFor(() => expect(asked('POST', '/money/pin/reset/confirm')).toHaveLength(2));
    const again = asked('POST', '/money/pin/reset/confirm');
    expect(again[1].key).toBe(again[0].key);
    expect(again[1].body).toEqual(again[0].body);
    expect(landed.size).toBe(1);
  });
});
