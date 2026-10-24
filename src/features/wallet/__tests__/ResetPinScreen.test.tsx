/* eslint-disable @typescript-eslint/no-require-imports */
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
/** A reply made when the request arrives, from what it carried: a stand-in server with a rule of its own. */
type Rule = (call: Sent) => Reply | 'offline';
type Answer = Reply | 'offline' | 'hold' | Rule | Promise<Reply>;
type Sent = { method: string; path: string; url: string; pin: string | null; key: string | null; body: Record<string, unknown> | null };

const OWNER = '00000000-0000-4000-8000-0000000000a8';
const SET_AT = '2026-07-10T09:00:00.000Z';
const RESET_ID = '5f1c1c1e-6a1d-4d4e-9a53-0d6b0b0c0a01';
const RESET_ID_2 = '5f1c1c1e-6a1d-4d4e-9a53-0d6b0b0c0a02';

let sent: Sent[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
const state = (over: Record<string, unknown> = {}): Reply => ok({ isSet: true, changedAt: SET_AT, triesLeft: 5, lockedUntil: null, ...over });
/** The reset the server answers: whom it went to, and when another can be asked for (by default, 42 seconds on). */
const started = (over: Record<string, unknown> = {}): Reply =>
  ok({
    resetId: RESET_ID,
    sentTo: '+234 *** *** 4412',
    resendAvailableAt: new Date(Date.now() + 42_000).toISOString(),
    resendInSeconds: 42,
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    ...over,
  });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = await request.clone().text();
  const call: Sent = {
    method: request.method,
    path: url.pathname,
    url: request.url,
    pin: request.headers.get('x-transaction-pin'),
    key: request.headers.get('idempotency-key'),
    body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
  };
  sent.push(call);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  let answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  if (typeof answer === 'function') answer = answer(call);
  if (answer instanceof Promise) answer = await answer;
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hold')
    return new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

type Props = { onBack: jest.Mock; onDone: jest.Mock; onNoWallet: jest.Mock; onNoPin: jest.Mock };

async function boot(): Promise<Props> {
  const { ResetPinScreen } = require('../settings/ResetPinScreen') as typeof import('../settings/ResetPinScreen');
  const props = { onBack: jest.fn(), onDone: jest.fn(), onNoWallet: jest.fn(), onNoPin: jest.fn() };
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ResetPinScreen {...props} />
    </SafeAreaProvider>,
  );
  return props;
}

async function type(digits: string) {
  for (const digit of digits) await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: digit }));
}
const asked = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);
/** The screen at the boxes, with a code sent. */
async function atBoxes() {
  const props = await boot();
  expect(await rtl.screen.findByTestId('reset-pin-code')).toBeTruthy();
  await rtl.screen.findByText('To +234 *** *** 4412');
  return props;
}

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  sent = [];
  routes = {};
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/pin': state(),
    'POST /money/pin/reset': started(),
    'POST /money/pin/reset/confirm': state({ changedAt: '2026-10-10T09:00:00.000Z' }),
  };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
});

afterAll(() => {
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('W37 · Transaction PIN, reset', () => {
  it('arriving asks for a code, and until it is sent the screen is a quiet loading view with the keys off', async () => {
    fallback['POST /money/pin/reset'] = 'hold';
    await boot();
    expect(await rtl.screen.findByTestId('reset-pin-sending')).toBeTruthy();
    expect(rtl.screen.getByText('Enter the code we sent')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: '1' }).props.accessibilityState.disabled).toBe(true);
    expect(asked('POST', '/money/pin/reset')).toHaveLength(1);
  });

  it('a user sees where the code went in the server’s words, six boxes, and when they can ask again as a clock', async () => {
    await atBoxes();
    expect(rtl.screen.getByRole('header', { name: 'Reset PIN' })).toBeTruthy();
    expect(rtl.screen.getByText('Enter the code we sent')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
    expect(rtl.screen.getByText(/^Resend in 0:4[0-2]$/)).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: 'Resend code' })).toBeNull();
  });

  it('when the code goes by email the line says so, with the address the server masked', async () => {
    fallback['POST /money/pin/reset'] = started({ sentTo: 'a***@example.com' });
    await boot();
    expect(await rtl.screen.findByText('To your email, a***@example.com')).toBeTruthy();
  });

  it('a user can enter the code, choose a new PIN twice, and the reset request carries the reset, the code and both entries', async () => {
    const props = await atBoxes();
    await type('481902');
    expect(await rtl.screen.findByText('Change your transaction PIN')).toBeTruthy();
    expect(rtl.screen.getByText('Step 1 of 2')).toBeTruthy();
    // The code is held, not sent: the server checks it only together with the new PIN.
    expect(asked('POST', '/money/pin/reset/confirm')).toHaveLength(0);
    await type('4821');
    expect(await rtl.screen.findByText('Step 2 of 2')).toBeTruthy();
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    const call = asked('POST', '/money/pin/reset/confirm');
    expect(call).toHaveLength(1);
    expect(call[0].body).toEqual({ resetId: RESET_ID, code: '481902', newPin: '4821', newPinConfirmation: '4821' });
    expect(call[0].pin).toBeNull();
    for (const each of sent) expect(each.url).not.toMatch(/481902|4821/);
  });

  it('a wrong code sends the user back to the boxes with the server’s sentence, and the right one then works', async () => {
    routes['POST /money/pin/reset/confirm'] = [refusal(400, 'reset_code_invalid', 'That code is not right or has expired. Check it, or ask for a new one.')];
    const props = await atBoxes();
    await type('111111');
    await type('4821');
    await type('4821');
    expect(await rtl.screen.findByText('That code is not right or has expired. Check it, or ask for a new one.')).toBeTruthy();
    expect(rtl.screen.getByTestId('reset-pin-code')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
    expect(props.onDone).not.toHaveBeenCalled();
    await type('222222');
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    expect(asked('POST', '/money/pin/reset/confirm').map((c) => c.body?.code)).toEqual(['111111', '222222']);
  });

  it('a mismatch is the server’s sentence, back at step 1, with the code kept', async () => {
    routes['POST /money/pin/reset/confirm'] = [refusal(400, 'pin_mismatch', 'The two PINs do not match. Enter the same PIN twice.')];
    const props = await atBoxes();
    await type('481902');
    await type('4821');
    await type('4822');
    expect(await rtl.screen.findByText('The two PINs do not match. Enter the same PIN twice.')).toBeTruthy();
    expect(rtl.screen.getByText('Step 1 of 2')).toBeTruthy();
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    expect(asked('POST', '/money/pin/reset/confirm').map((c) => c.body?.code)).toEqual(['481902', '481902']);
  });

  it('a user can ask for another code once the clock reaches zero: Resend asks again, the new reset is the one confirmed, and the clock restarts', async () => {
    routes['POST /money/pin/reset'] = [started({ resendAvailableAt: new Date(Date.now() + 1_200).toISOString(), resendInSeconds: 1 }), started({ resetId: RESET_ID_2 })];
    const props = await atBoxes();
    await type('12');
    const resend = await rtl.screen.findByRole('button', { name: 'Resend code' }, { timeout: 4_000 });
    await rtl.fireEvent.press(resend);
    expect(await rtl.screen.findByText('We sent a new code.')).toBeTruthy();
    expect(asked('POST', '/money/pin/reset')).toHaveLength(2);
    expect(rtl.screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
    expect(rtl.screen.getByText(/^Resend in 0:4[0-2]$/)).toBeTruthy();
    await type('654321');
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    expect(asked('POST', '/money/pin/reset/confirm')[0].body).toEqual({ resetId: RESET_ID_2, code: '654321', newPin: '4821', newPinConfirmation: '4821' });
  });

  it('a code that could not be sent shows the server’s sentence with Try again, which asks again and shows the boxes', async () => {
    routes['POST /money/pin/reset'] = [refusal(503, 'provider_unreachable', 'We could not send the code right now. Try again in a moment.')];
    await boot();
    expect(await rtl.screen.findByTestId('reset-pin-error')).toBeTruthy();
    expect(rtl.screen.getByText("We couldn't send your code")).toBeTruthy();
    expect(rtl.screen.getByText('We could not send the code right now. Try again in a moment.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('To +234 *** *** 4412')).toBeTruthy();
    expect(asked('POST', '/money/pin/reset')).toHaveLength(2);
  });

  it('too many codes today is the server’s sentence with no Try again (asking again cannot help), and Back leaves', async () => {
    routes['POST /money/pin/reset'] = [refusal(429, 'reset_codes_exhausted', 'You have asked for too many codes today. Try again later.')];
    const props = await boot();
    expect(await rtl.screen.findByText('You have asked for too many codes today. Try again later.')).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('no connection when asking shows the app’s sentence and Try again', async () => {
    routes['POST /money/pin/reset'] = ['offline'];
    await boot();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('no PIN to reset leads to creating one, and no wallet to Open your wallet', async () => {
    fallback['POST /money/pin/reset'] = refusal(409, 'pin_not_set', 'Create your transaction PIN first.');
    const first = await boot();
    await rtl.waitFor(() => expect(first.onNoPin).toHaveBeenCalledTimes(1));
    await rtl.cleanup();

    fallback['POST /money/pin/reset'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const second = await boot();
    await rtl.waitFor(() => expect(second.onNoWallet).toHaveBeenCalledTimes(1));
  });

  it('the request carries BOTH entries as typed: a server that compares them refuses two different ones', async () => {
    fallback['POST /money/pin/reset/confirm'] = (call) =>
      call.body?.newPin === call.body?.newPinConfirmation ? state({ changedAt: '2026-10-10T09:00:00.000Z' }) : refusal(400, 'pin_mismatch', 'The two PINs do not match. Enter the same PIN twice.');
    const props = await atBoxes();
    await type('481902');
    await type('4821');
    await type('4822');
    expect(await rtl.screen.findByText('The two PINs do not match. Enter the same PIN twice.')).toBeTruthy();
    expect(props.onDone).not.toHaveBeenCalled();
    expect(asked('POST', '/money/pin/reset/confirm')[0].body).toEqual({ resetId: RESET_ID, code: '481902', newPin: '4821', newPinConfirmation: '4822' });
  });

  describe('a reset that got no answer is sent again with the same key (WALLET-06 round 2, D1)', () => {
    /** A stand-in Hub that keeps what landed under each key and answers a repeat as the Hub does. */
    function serverThatLoses(lose: number) {
      const landed = new Map<string, Reply>();
      let lost = 0;
      fallback['POST /money/pin/reset/confirm'] = (call) => {
        const key = call.key ?? '';
        const first = landed.get(key);
        const reply = first ?? state({ changedAt: '2026-10-10T09:00:00.000Z' });
        landed.set(key, reply);
        if (lost < lose) {
          lost += 1;
          return 'offline';
        }
        return reply;
      };
      return landed;
    }

    it('the reset landed and its answer was lost: the same request goes again at once, the user is done, and nothing is read to find out', async () => {
      const landed = serverThatLoses(1);
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
      const calls = asked('POST', '/money/pin/reset/confirm');
      expect(calls).toHaveLength(2);
      expect(calls[1].key).toBe(calls[0].key);
      expect(calls[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
      expect(calls[1].body).toEqual(calls[0].body);
      expect(landed.size).toBe(1);
      // The PIN's time is never read to judge by (W37 reads nothing of the PIN at all).
      expect(asked('GET', '/money/pin')).toHaveLength(0);
    });

    it('the PIN’s time moving for another reason while the reset never lands is NOT taken for a reset (kills: judging by changedAt)', async () => {
      fallback['GET /money/pin'] = state({ changedAt: '2026-10-10T09:30:00.000Z' });
      fallback['POST /money/pin/reset/confirm'] = 'offline';
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText(/^We couldn't tell whether your PIN was reset\./)).toBeTruthy();
      expect(props.onDone).not.toHaveBeenCalled();
      expect(asked('POST', '/money/pin/reset/confirm')).toHaveLength(2);
      expect(asked('GET', '/money/pin')).toHaveLength(0);
    });

    it('with no answer twice it says it does not know, keeps the keys off, and Try again sends the same request a third time under the same key', async () => {
      serverThatLoses(2);
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText("We couldn't tell whether your PIN was reset. No connection. Check your internet and try again.")).toBeTruthy();
      expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBe(true);
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
      await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
      const keys = asked('POST', '/money/pin/reset/confirm').map((c) => c.key);
      expect(keys).toHaveLength(3);
      expect(new Set(keys).size).toBe(1);
    });

    it('someone changed the PIN meanwhile, so the code is dead: the repeat is refused for the code and the screen claims nothing', async () => {
      routes['POST /money/pin/reset/confirm'] = ['offline', refusal(400, 'reset_code_invalid', 'That code is not right or has expired. Check it, or ask for a new one.')];
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText('That code is not right or has expired. Check it, or ask for a new one.')).toBeTruthy();
      expect(rtl.screen.getByTestId('reset-pin-code')).toBeTruthy();
      expect(props.onDone).not.toHaveBeenCalled();
    });

    it('T3: the very first send answered "still going through" (not offline) is not sent again on its own, in the reset’s words; Try again sends it under the same key', async () => {
      routes['POST /money/pin/reset/confirm'] = [refusal(409, 'idempotency_in_progress', 'Your PIN reset is still going through. Check again in a moment.')];
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText('Your PIN reset is still going through. Check again in a moment.')).toBeTruthy();
      await rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
      expect(asked('POST', '/money/pin/reset/confirm')).toHaveLength(1);
      expect(props.onDone).not.toHaveBeenCalled();
      expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBe(true);
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
      await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
      const keys = asked('POST', '/money/pin/reset/confirm').map((c) => c.key);
      expect(keys).toHaveLength(2);
      expect(new Set(keys).size).toBe(1);
    });

    it('N4: the repeat is told the PIN was changed again since: nothing is claimed, the person is back at the boxes with the Hub’s words, and the Hub is read again', async () => {
      // SWEEP-MONEY WALLET-06 T4: the wallet is read again (the money queries are invalidated).
      const reread = jest.spyOn((require('@/api/query') as typeof import('@/api/query')).queryClient, 'invalidateQueries');
      routes['POST /money/pin/reset/confirm'] = ['offline', refusal(409, 'pin_changed_again', 'Your PIN was changed again since. Check it in Wallet settings.')];
      fallback['POST /money/pin/reset'] = started({ resendInSeconds: 30 });
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText('Your PIN was changed again since. Check it in Wallet settings.')).toBeTruthy();
      expect(props.onDone).not.toHaveBeenCalled();
      expect(asked('POST', '/money/pin/reset/confirm')).toHaveLength(2);
      expect(reread).toHaveBeenCalledWith({ queryKey: ['money'] });
      expect(rtl.screen.getByTestId('reset-pin-code')).toBeTruthy();
      expect(rtl.screen.queryByRole('button', { name: 'Try again' })).toBeNull();
      expect(rtl.screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
    });

    it('a new attempt after a refusal is a new key', async () => {
      routes['POST /money/pin/reset/confirm'] = [refusal(400, 'pin_mismatch', 'The two PINs do not match. Enter the same PIN twice.')];
      const props = await atBoxes();
      await type('481902');
      await type('4821');
      await type('4822');
      await rtl.screen.findByText('The two PINs do not match. Enter the same PIN twice.');
      await type('4821');
      await type('4821');
      await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
      const keys = asked('POST', '/money/pin/reset/confirm').map((c) => c.key);
      expect(keys).toHaveLength(2);
      expect(keys[0]).not.toBe(keys[1]);
    });

    it('Back from the unanswered reset gives that attempt up and the keypad works again', async () => {
      fallback['POST /money/pin/reset/confirm'] = 'offline';
      await atBoxes();
      await type('481902');
      await type('4821');
      await type('4821');
      await rtl.screen.findByText(/^We couldn't tell whether your PIN was reset\./);
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
      expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
      expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBeFalsy();
      expect(rtl.screen.queryByRole('button', { name: 'Try again' })).toBeNull();
      await type('1');
      expect(rtl.screen.getByLabelText('1 of 4 digits entered')).toBeTruthy();
    });
  });

  describe('Resend counts the server’s seconds and claims a code only when one was sent (WALLET-06 round 2, D3)', () => {
    it('a phone clock ten minutes ahead does not open Resend early: the count is the server’s seconds, not resendAvailableAt against the clock', async () => {
      // The Hub says 45 seconds; resendAvailableAt, read against a clock that is ten minutes fast, is long past.
      fallback['POST /money/pin/reset'] = started({ resendAvailableAt: new Date(Date.now() - 10 * 60_000 + 45_000).toISOString(), resendInSeconds: 45 });
      await atBoxes();
      expect(rtl.screen.getByText(/^Resend in 0:4[3-5]$/)).toBeTruthy();
      expect(rtl.screen.queryByRole('button', { name: 'Resend code' })).toBeNull();
    });

    it('a phone clock ten minutes behind does not hold Resend shut: the count is still the server’s seconds', async () => {
      fallback['POST /money/pin/reset'] = started({ resendAvailableAt: new Date(Date.now() + 10 * 60_000 + 45_000).toISOString(), resendInSeconds: 45 });
      await atBoxes();
      expect(rtl.screen.getByText(/^Resend in 0:4[3-5]$/)).toBeTruthy();
    });

    describe('a phone clock changed while the count runs moves nothing (WALLET-06 round 3, N2)', () => {
      const realNow = Date.now.bind(Date);
      afterEach(() => {
        jest.restoreAllMocks();
      });
      const clockMoves = (ms: number) => jest.spyOn(Date, 'now').mockImplementation(() => realNow() + ms);

      it('a clock jumping ten minutes ahead does not open Resend early', async () => {
        fallback['POST /money/pin/reset'] = started({ resendInSeconds: 4 });
        await atBoxes();
        expect(rtl.screen.getByText(/^Resend in 0:0[34]$/)).toBeTruthy();
        clockMoves(10 * 60_000);
        await rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 1_300)));
        // The wall clock says the gap ended nine minutes ago. The Hub's seconds have not run: about three are left.
        expect(rtl.screen.getByText(/^Resend in 0:0[1-3]$/)).toBeTruthy();
        expect(rtl.screen.queryByRole('button', { name: 'Resend code' })).toBeNull();
      });

      it('a clock jumping ten minutes behind does not hold Resend shut once the Hub’s seconds have run', async () => {
        fallback['POST /money/pin/reset'] = started({ resendInSeconds: 2 });
        await atBoxes();
        clockMoves(-10 * 60_000);
        expect(await rtl.screen.findByRole('button', { name: 'Resend code' }, { timeout: 5_000 })).toBeTruthy();
        expect(rtl.screen.queryByText(/^Resend in /)).toBeNull();
      });
    });

    it('"We sent a new code." appears only after the resend route answers, and only for a different reset', async () => {
      let answer!: (reply: Reply) => void;
      routes['POST /money/pin/reset'] = [started({ resendInSeconds: 1, resendAvailableAt: new Date(Date.now() + 1_000).toISOString() }), new Promise<Reply>((resolve) => (answer = resolve)) as unknown as Answer];
      await atBoxes();
      const resend = await rtl.screen.findByRole('button', { name: 'Resend code' }, { timeout: 4_000 });
      await rtl.fireEvent.press(resend);
      // Out, not answered: nothing is claimed.
      expect(await rtl.screen.findByTestId('reset-pin-resending')).toBeTruthy();
      expect(rtl.screen.queryByText('We sent a new code.')).toBeNull();
      await rtl.act(async () => answer(started({ resetId: RESET_ID_2 })));
      expect(await rtl.screen.findByText('We sent a new code.')).toBeTruthy();
      expect(rtl.screen.getByText(/^Resend in 0:4[0-2]$/)).toBeTruthy();
    });

    it('a Resend the server answers with the same reset sent no code: nothing is claimed, the digits stay, and the count starts from the server’s seconds', async () => {
      routes['POST /money/pin/reset'] = [
        started({ resendInSeconds: 1, resendAvailableAt: new Date(Date.now() + 1_000).toISOString() }),
        // The Hub had not reached its gap: the same reset, no text, 30 seconds still to go.
        started({ resendInSeconds: 30 }),
      ];
      await atBoxes();
      await type('12');
      const resend = await rtl.screen.findByRole('button', { name: 'Resend code' }, { timeout: 4_000 });
      await rtl.fireEvent.press(resend);
      await rtl.waitFor(() => expect(asked('POST', '/money/pin/reset')).toHaveLength(2));
      expect(await rtl.screen.findByText(/^Resend in 0:(29|30)$/)).toBeTruthy();
      expect(rtl.screen.queryByText('We sent a new code.')).toBeNull();
      expect(rtl.screen.getByLabelText('Code, 2 of 6 digits entered')).toBeTruthy();
    });

    it('a Resend the server refuses claims nothing and says why', async () => {
      routes['POST /money/pin/reset'] = [
        started({ resendInSeconds: 1, resendAvailableAt: new Date(Date.now() + 1_000).toISOString() }),
        refusal(429, 'reset_codes_exhausted', 'You have asked for too many codes today. Try again later.'),
      ];
      await atBoxes();
      const resend = await rtl.screen.findByRole('button', { name: 'Resend code' }, { timeout: 4_000 });
      await rtl.fireEvent.press(resend);
      expect(await rtl.screen.findByText('You have asked for too many codes today. Try again later.')).toBeTruthy();
      expect(rtl.screen.queryByText('We sent a new code.')).toBeNull();
    });
  });

  it('Back steps back through the screens: second step, first step, the boxes, then leaves', async () => {
    const props = await atBoxes();
    await type('481902');
    await type('4821');
    expect(await rtl.screen.findByText('Step 2 of 2')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
    expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
    expect(await rtl.screen.findByTestId('reset-pin-code')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Code, 0 of 6 digits entered')).toBeTruthy();
    expect(props.onBack).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('draws no biometric key and no em-dash', async () => {
    await atBoxes();
    expect(rtl.screen.queryByRole('button', { name: /fingerprint|face/i })).toBeNull();
    const seen = new WeakSet<object>();
    const all = JSON.stringify(rtl.screen.toJSON(), (_k, v: unknown) => {
      if (typeof v === 'object' && v !== null) {
        if (seen.has(v)) return undefined;
        seen.add(v);
      }
      return v;
    });
    expect(all).not.toContain('—');
  });
});
