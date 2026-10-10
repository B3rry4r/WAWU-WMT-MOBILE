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
type Answer = Reply | 'offline' | 'hold';
type Sent = { method: string; path: string; url: string; pin: string | null; body: Record<string, unknown> | null };

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
/** The reset the server answers: whom it went to, and when another can be asked for (by default, far ahead). */
const started = (over: Record<string, unknown> = {}): Reply =>
  ok({
    resetId: RESET_ID,
    sentTo: '+234 *** *** 4412',
    resendAvailableAt: new Date(Date.now() + 42_000).toISOString(),
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    ...over,
  });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = await request.clone().text();
  sent.push({ method: request.method, path: url.pathname, url: request.url, pin: request.headers.get('x-transaction-pin'), body: text ? (JSON.parse(text) as Record<string, unknown>) : null });
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
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
    routes['POST /money/pin/reset'] = [started({ resendAvailableAt: new Date(Date.now() + 1_200).toISOString() }), started({ resetId: RESET_ID_2 })];
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

  it('a reset that got no answer is checked: if the PIN’s time moved on it landed and the user is done', async () => {
    routes['POST /money/pin/reset/confirm'] = ['offline'];
    routes['GET /money/pin'] = [state(), state({ changedAt: '2026-10-10T09:00:00.000Z' })];
    const props = await atBoxes();
    await type('481902');
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    expect(asked('POST', '/money/pin/reset/confirm')).toHaveLength(1);
  });

  it('a reset that got no answer and did not land starts again at the new PIN, and the same code is used', async () => {
    routes['POST /money/pin/reset/confirm'] = ['offline'];
    const props = await atBoxes();
    await type('481902');
    await type('4821');
    await type('4821');
    expect(await rtl.screen.findByText("We couldn't reset your PIN. Try again.")).toBeTruthy();
    expect(rtl.screen.getByText('Step 1 of 2')).toBeTruthy();
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    expect(asked('POST', '/money/pin/reset/confirm').map((c) => c.body?.code)).toEqual(['481902', '481902']);
  });

  it('when neither the reset nor the check got an answer the screen says it does not know, keeps the keys off, and Try again checks again', async () => {
    routes['POST /money/pin/reset/confirm'] = ['offline'];
    routes['GET /money/pin'] = [state(), 'offline'];
    const props = await atBoxes();
    await type('481902');
    await type('4821');
    await type('4821');
    expect(await rtl.screen.findByText("We couldn't check whether your PIN was reset. No connection. Check your internet and try again.")).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBe(true);
    routes['GET /money/pin'] = [state({ changedAt: '2026-10-10T09:00:00.000Z' })];
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
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
