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
type Answer = Reply | 'offline' | 'hold' | Rule;
type Sent = { method: string; path: string; url: string; pin: string | null; key: string | null; body: Record<string, unknown> | null };

const OWNER = '00000000-0000-4000-8000-0000000000a7';
const SET_AT = '2026-07-10T09:00:00.000Z';

let sent: Sent[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
const state = (over: Record<string, unknown> = {}): Reply => ok({ isSet: true, changedAt: SET_AT, triesLeft: 5, lockedUntil: null, ...over });

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
  if (answer === 'offline') throw new TypeError('Network request failed');
  // Held until the test ends: the cache's cancel aborts it, so nothing is left in flight.
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

type Props = { onBack: jest.Mock; onChanged: jest.Mock; onForgotPin: jest.Mock; onNoPin: jest.Mock; onNoWallet: jest.Mock };

async function boot(waitForRead = true): Promise<Props> {
  const { ChangePinScreen } = require('../settings/ChangePinScreen') as typeof import('../settings/ChangePinScreen');
  const props = { onBack: jest.fn(), onChanged: jest.fn(), onForgotPin: jest.fn(), onNoPin: jest.fn(), onNoWallet: jest.fn() };
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ChangePinScreen {...props} />
    </SafeAreaProvider>,
  );
  // The PIN's state is read at the start; the keypad is used once it has been.
  if (waitForRead) await rtl.waitFor(() => expect(sent.some((s) => s.method === 'GET' && s.path.endsWith('/money/pin'))).toBe(true));
  return props;
}

/** Types digits on the screen's own keypad. */
async function type(digits: string) {
  for (const digit of digits) await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: digit }));
}
const asked = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);
const idle = () => rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

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
  fallback = { 'GET /money/pin': state(), 'POST /money/pin/verify': state(), 'PUT /money/pin': state({ changedAt: '2026-10-10T09:00:00.000Z' }) };
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

describe('W36 · Change the transaction PIN', () => {
  it('starts by asking for the PIN in use, in W36’s layout, with no step number and a way to reset it', async () => {
    await boot();
    expect(rtl.screen.getByTestId('change-pin-current')).toBeTruthy();
    expect(rtl.screen.getByText('Enter your current PIN')).toBeTruthy();
    expect(rtl.screen.queryByText(/^Step \d of 2$/)).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Forgot PIN?' })).toBeTruthy();
    expect(rtl.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    for (const digit of '0123456789') expect(rtl.screen.getByRole('button', { name: digit })).toBeTruthy();
  });

  it('a user can enter a new PIN and confirm it: the current PIN is checked, then the new one twice, and one change request carries all of it', async () => {
    const props = await boot();
    await type('1234');
    expect(await rtl.screen.findByText('Change your transaction PIN')).toBeTruthy();
    expect(rtl.screen.getByText('Step 1 of 2')).toBeTruthy();
    expect(rtl.screen.getByText("Four digits. You'll use it to approve every payment, transfer and withdrawal.")).toBeTruthy();
    // The check sent the PIN in its header, and nothing else.
    expect(asked('POST', '/money/pin/verify')).toHaveLength(1);
    expect(asked('POST', '/money/pin/verify')[0].pin).toBe('1234');
    expect(asked('POST', '/money/pin/verify')[0].body).toBeNull();

    await type('4821');
    expect(await rtl.screen.findByText('Enter it again')).toBeTruthy();
    expect(rtl.screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(asked('PUT', '/money/pin')).toHaveLength(0);

    await type('4821');
    await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
    const change = asked('PUT', '/money/pin');
    expect(change).toHaveLength(1);
    expect(change[0].pin).toBe('1234');
    expect(change[0].body).toEqual({ newPin: '4821', newPinConfirmation: '4821' });
    // No PIN ever travels in a URL.
    for (const call of sent) expect(call.url).not.toMatch(/1234|4821/);
  });

  it('a wrong current PIN says so in the server’s own sentence, clears the digits, and asks again at the same step', async () => {
    routes['POST /money/pin/verify'] = [refusal(403, 'pin_incorrect', 'Wrong PIN. 4 tries left.')];
    await boot();
    await type('9999');
    expect(await rtl.screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    expect(rtl.screen.getByTestId('change-pin-current')).toBeTruthy();
    expect(rtl.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    expect(asked('PUT', '/money/pin')).toHaveLength(0);
    // The next try goes through.
    await type('1234');
    expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
  });

  it('a locked PIN shows the countdown from the server’s lock time and the keypad stays off until it ends', async () => {
    routes['POST /money/pin/verify'] = [refusal(423, 'pin_locked', 'Too many wrong PINs. Try again when the lock ends.')];
    routes['GET /money/pin'] = [state(), state({ triesLeft: 0, lockedUntil: new Date(Date.now() + 29 * 60_000 + 30_000).toISOString() })];
    await boot();
    await type('9999');
    await rtl.screen.findByTestId('change-pin-locked');
    expect(rtl.screen.getByText(/Too many wrong tries\. Try again in 29:[0-9]{2}\./)).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: '1' }).props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: '1' }));
    expect(rtl.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    // Forgot PIN? is the way past a lock.
    expect(rtl.screen.getByRole('button', { name: 'Forgot PIN?' })).toBeTruthy();
  });

  it('a lock seen on an earlier visit is not drawn again once a reset has cleared it: the PIN’s state is read fresh each time the screen opens', async () => {
    const { queryClient } = require('@/api/query') as typeof import('@/api/query');
    // A cache that would keep the earlier answer for a minute, if the screen let it.
    queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 60_000 } });
    fallback['GET /money/pin'] = state({ triesLeft: 0, lockedUntil: new Date(Date.now() + 20 * 60_000).toISOString() });
    await boot();
    expect(await rtl.screen.findByTestId('change-pin-locked')).toBeTruthy();
    await rtl.cleanup();

    // The second visit's read is slow: the first frame must not be the earlier visit's lock.
    fallback['GET /money/pin'] = 'hold';
    await boot(false);
    await rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(rtl.screen.getByTestId('change-pin-current')).toBeTruthy();
    expect(rtl.screen.queryByTestId('change-pin-locked')).toBeNull();
    expect(rtl.screen.getByRole('button', { name: '1' }).props.accessibilityState.disabled).toBeFalsy();
  });

  it('a mismatch is the server’s sentence, back at step 1; the PIN in use is kept, so the next change is not asked for it again', async () => {
    routes['PUT /money/pin'] = [refusal(400, 'pin_mismatch', 'The two PINs do not match. Enter the same PIN twice.')];
    const props = await boot();
    await type('1234');
    await type('4821');
    await type('4822');
    expect(await rtl.screen.findByText('The two PINs do not match. Enter the same PIN twice.')).toBeTruthy();
    expect(rtl.screen.getByText('Step 1 of 2')).toBeTruthy();
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
    expect(asked('POST', '/money/pin/verify')).toHaveLength(1);
    expect(asked('PUT', '/money/pin').map((c) => c.pin)).toEqual(['1234', '1234']);
  });

  it('the request carries BOTH entries as typed: a server that compares them refuses two different ones, and accepts the same twice (kills: the first entry sent as both)', async () => {
    // The stand-in compares the two entries the way the Hub does; it does not just say what the test hopes.
    fallback['PUT /money/pin'] = (call) =>
      call.body?.newPin === call.body?.newPinConfirmation
        ? state({ changedAt: '2026-10-10T09:00:00.000Z' })
        : refusal(400, 'pin_mismatch', 'The two PINs do not match. Enter the same PIN twice.');
    const props = await boot();
    await type('1234');
    await type('4821');
    await type('4822');
    expect(await rtl.screen.findByText('The two PINs do not match. Enter the same PIN twice.')).toBeTruthy();
    expect(props.onChanged).not.toHaveBeenCalled();
    expect(asked('PUT', '/money/pin')).toHaveLength(1);
    expect(asked('PUT', '/money/pin')[0].body).toEqual({ newPin: '4821', newPinConfirmation: '4822' });
    // Typed the same twice, it goes through.
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
    expect(asked('PUT', '/money/pin')[1].body).toEqual({ newPin: '4821', newPinConfirmation: '4821' });
  });

  it('every attempt has its own Idempotency-Key, in the Hub’s format; a new entry after a refusal is a new attempt and a new key', async () => {
    routes['PUT /money/pin'] = [refusal(400, 'pin_mismatch', 'The two PINs do not match. Enter the same PIN twice.')];
    const props = await boot();
    await type('1234');
    await type('4821');
    await type('4822');
    await rtl.screen.findByText('The two PINs do not match. Enter the same PIN twice.');
    await type('4821');
    await type('4821');
    await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
    const keys = asked('PUT', '/money/pin').map((c) => c.key);
    expect(keys).toHaveLength(2);
    for (const key of keys) expect(key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(keys[0]).not.toBe(keys[1]);
    // The key is not on the other calls, and carries nothing of the PIN.
    expect(asked('POST', '/money/pin/verify')[0].key).toBeNull();
    for (const key of keys) expect(key).not.toMatch(/1234|4821|4822/);
  });

  describe('a change that got no answer is sent again with the same key (WALLET-06 round 2, D1)', () => {
    /** A stand-in Hub that keeps what landed under each key and answers a repeat as the Hub does. */
    function serverThatLoses(lose: number) {
      const landed = new Map<string, Reply>();
      let lost = 0;
      fallback['PUT /money/pin'] = (call) => {
        const key = call.key ?? '';
        const first = landed.get(key);
        const reply = first ?? state({ changedAt: '2026-10-10T09:00:00.000Z' });
        landed.set(key, reply);
        // The change reached the Hub; its answer did not reach the phone.
        if (lost < lose) {
          lost += 1;
          return 'offline';
        }
        return reply;
      };
      return landed;
    }

    it('the change landed and its answer was lost: the same request goes again at once, the user is done, and nothing else is read to find out', async () => {
      const landed = serverThatLoses(1);
      const props = await boot();
      await type('1234');
      await type('4821');
      await type('4821');
      await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
      const puts = asked('PUT', '/money/pin');
      expect(puts).toHaveLength(2);
      // The same request twice: same key, same PIN in use, same two entries.
      expect(puts[1].key).toBe(puts[0].key);
      expect(puts[1].pin).toBe('1234');
      expect(puts[1].body).toEqual(puts[0].body);
      expect(landed.size).toBe(1);
      // No verify with the new PIN (a wrong one would spend a try) and no read of the PIN's time to judge by.
      expect(asked('POST', '/money/pin/verify')).toHaveLength(1);
      expect(asked('POST', '/money/pin/verify')[0].pin).toBe('1234');
      // Nothing was asked between the two sends (the one read after the change is the screen refreshing what it shows).
      const first = sent.findIndex((c) => c.method === 'PUT');
      const second = sent.findIndex((c, i) => i > first && c.method === 'PUT');
      expect(sent.slice(first, second + 1).map((c) => c.method)).toEqual(['PUT', 'PUT']);
    });

    it('the PIN’s time moving for another reason while the change never lands is NOT taken for a change (kills: judging by changedAt)', async () => {
      // Another phone changed the PIN: every read of its time shows a new one. This phone's change never reaches the Hub.
      fallback['GET /money/pin'] = state({ changedAt: '2026-10-10T09:30:00.000Z' });
      routes['GET /money/pin'] = [state()];
      fallback['PUT /money/pin'] = 'offline';
      const props = await boot();
      await type('1234');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText(/^We couldn't tell whether your PIN was changed\./)).toBeTruthy();
      expect(props.onChanged).not.toHaveBeenCalled();
      // Sent twice (the repeat), never judged by a read.
      expect(asked('PUT', '/money/pin')).toHaveLength(2);
      expect(asked('GET', '/money/pin')).toHaveLength(1);
    });

    it('with no answer twice it says it does not know, keeps the keys off, and Try again sends the same request a third time under the same key', async () => {
      serverThatLoses(2);
      const props = await boot();
      await type('1234');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText("We couldn't tell whether your PIN was changed. No connection. Check your internet and try again.")).toBeTruthy();
      expect(props.onChanged).not.toHaveBeenCalled();
      // The keys stay off: a new PIN is never asked for while the first may have landed.
      expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBe(true);
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
      await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
      const keys = asked('PUT', '/money/pin').map((c) => c.key);
      expect(keys).toHaveLength(3);
      expect(new Set(keys).size).toBe(1);
    });

    it('someone else changed the PIN meanwhile: the repeat is refused for the PIN in use, the screen asks for it again and claims nothing', async () => {
      routes['PUT /money/pin'] = ['offline', refusal(403, 'pin_incorrect', 'Wrong PIN. 4 tries left.')];
      const props = await boot();
      await type('1234');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
      expect(rtl.screen.getByTestId('change-pin-current')).toBeTruthy();
      expect(props.onChanged).not.toHaveBeenCalled();
      expect(asked('GET', '/money/pin')).toHaveLength(1);
    });

    it('the Hub saying the first request is still running is shown in its own words with Try again, and no third send is made on its own', async () => {
      routes['PUT /money/pin'] = ['offline', refusal(409, 'idempotency_in_progress', 'This request is still going through. Check again in a moment.')];
      const props = await boot();
      await type('1234');
      await type('4821');
      await type('4821');
      expect(await rtl.screen.findByText('This request is still going through. Check again in a moment.')).toBeTruthy();
      expect(asked('PUT', '/money/pin')).toHaveLength(2);
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
      await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
      const keys = asked('PUT', '/money/pin').map((c) => c.key);
      expect(keys).toHaveLength(3);
      expect(new Set(keys).size).toBe(1);
    });

    it('Back from the unanswered change gives that attempt up and the keypad works again (D4)', async () => {
      fallback['PUT /money/pin'] = 'offline';
      const props = await boot();
      await type('1234');
      await type('4821');
      await type('4821');
      await rtl.screen.findByText(/^We couldn't tell whether your PIN was changed\./);
      expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBe(true);
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
      expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
      expect(props.onBack).not.toHaveBeenCalled();
      // The keys are on and the line and Try again are gone.
      expect(rtl.screen.getByRole('button', { name: '5' }).props.accessibilityState.disabled).toBeFalsy();
      expect(rtl.screen.queryByRole('button', { name: 'Try again' })).toBeNull();
      expect(rtl.screen.queryByText(/We couldn't tell/)).toBeNull();
      await type('1');
      expect(rtl.screen.getByLabelText('1 of 4 digits entered')).toBeTruthy();
      // And a new attempt made from here is a new key.
      fallback['PUT /money/pin'] = state({ changedAt: '2026-10-10T09:00:00.000Z' });
      await type('234');
      await type('1234');
      await rtl.waitFor(() => expect(props.onChanged).toHaveBeenCalledTimes(1));
      const keys = asked('PUT', '/money/pin').map((c) => c.key);
      expect(new Set(keys).size).toBe(2);
    });
  });

  it('the last digit sent twice at once makes one request', async () => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const real = globalThis.fetch;
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      if (request.method === 'POST' && request.url.endsWith('/money/pin/verify')) await held;
      return real(input, init);
    }) as typeof fetch;
    try {
      await boot();
      await type('123');
      const four = rtl.screen.getByRole('button', { name: '4' });
      await rtl.fireEvent.press(four);
      await rtl.fireEvent.press(four);
      release();
      expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
      expect(asked('POST', '/money/pin/verify')).toHaveLength(1);
    } finally {
      globalThis.fetch = real;
    }
  });

  it('Back at the second step returns to the first; Back at the first leaves the screen', async () => {
    const props = await boot();
    await type('1234');
    await type('4821');
    expect(await rtl.screen.findByText('Step 2 of 2')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
    expect(await rtl.screen.findByText('Step 1 of 2')).toBeTruthy();
    expect(props.onBack).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('Forgot PIN? opens the reset', async () => {
    const props = await boot();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(props.onForgotPin).toHaveBeenCalledTimes(1);
  });

  it('an account with no PIN is sent to create one, and one with no wallet to Open your wallet', async () => {
    fallback['GET /money/pin'] = state({ isSet: false, changedAt: null });
    const first = await boot();
    await rtl.waitFor(() => expect(first.onNoPin).toHaveBeenCalled());
    await rtl.cleanup();

    fallback['GET /money/pin'] = state();
    fallback['POST /money/pin/verify'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const second = await boot();
    await type('1234');
    await rtl.waitFor(() => expect(second.onNoWallet).toHaveBeenCalledTimes(1));
    await idle();
  });

  it('a refusal that is not the PIN’s (a frozen wallet) shows the server’s sentence and nothing is claimed', async () => {
    fallback['POST /money/pin/verify'] = refusal(423, 'wallet_frozen', 'Your wallet is frozen.');
    const props = await boot();
    await type('1234');
    expect(await rtl.screen.findByText('Your wallet is frozen.')).toBeTruthy();
    expect(props.onChanged).not.toHaveBeenCalled();
    expect(rtl.screen.getByTestId('change-pin-current')).toBeTruthy();
  });
});
