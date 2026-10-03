/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockVault = new Map<string, string>();
const mockStored: string[] = [];

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStored.push(`${key}=${value}`);
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000a1';
const BVN = '22190000111';
const NIN = '70190000999';

let sent: Sent[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string, extra: Record<string, unknown> = {}): Answer => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code, message, ...extra } },
});

const me = { wawuUserId: OWNER, phone: '+2348031234412', email: 'ada@example.com', firstName: 'Ada', lastName: 'Eze' };
const freshIdentity = { bvn: null, ninLast4: null, occupation: null, checksLeft: 3 };
const passedIdentity = { bvn: { last4: '0111', verifiedAt: '2026-10-03T10:00:00.000Z' }, ninLast4: '0999', occupation: null, checksLeft: 2 };
const prefill = { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' };

const A14 = "This isn't the number on your BVN. Use that one.";

function keyOf(method: string, path: string) {
  return `${method} ${path.replace(/^\/api\/hub/, '')}`;
}

/**
 * openapi-fetch keeps the fetch it was created with, so the one fetch is in
 * place before the app's modules are first required (in `boot`), and it
 * answers from `routes` and `fallback`, which each test sets.
 */
function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    sent.push({ method: request.method, path, body: await request.clone().text() });
    const key = keyOf(request.method, path);
    const answer = routes[key]?.shift() ?? fallback[key];
    if (!answer) throw new Error(`no answer for ${key}`);
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hold') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

function serve(extra: Record<string, Answer> = {}) {
  fallback = {
    'GET /users/me': ok(me),
    'GET /money/wallet': ok({ state: 'not_open' }),
    'GET /money/identity': ok(freshIdentity),
    ...extra,
  };
}

installFetch();

const clients: QueryClient[] = [];

/** Renders A26 with a fresh query cache, as a route would. */
async function boot() {
  const { OpenWalletScreen } = require('../OpenWalletScreen') as typeof import('../OpenWalletScreen');
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  const onClose = jest.fn();
  // No garbage-collection timer: a cache timer left running keeps jest from exiting.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  const wrap = (child: ReactElement) => (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {child}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
  await rtl.render(wrap(<OpenWalletScreen onClose={onClose} />));
  return { ...rtl, onClose, kept };
}

const checksSent = () => sent.filter((s) => s.method === 'POST' && s.path.endsWith('/money/identity/bvn'));

async function typeNumbers(app: Awaited<ReturnType<typeof boot>>, bvn = BVN, nin = NIN) {
  const { fireEvent, screen } = app;
  await fireEvent.changeText(await screen.findByTestId('open-wallet-bvn'), bvn);
  await fireEvent.changeText(screen.getByTestId('open-wallet-nin'), nin);
}

beforeEach(() => {
  sent = [];
  routes = {};
  mockStored.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', 'access-1');
  mockVault.set('wawu.session.refresh', 'refresh-1');
  serve();
  (require('../keptCheck') as typeof import('../keptCheck')).forgetKeptCheck();
});

afterEach(async () => {
  // Lets a refetch a test started (the identity after a refused check) land inside act.
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A26 · Open your wallet: BVN and NIN', () => {
  it('a user sees a loading view first, then their account phone as A3 draws it, and empty BVN and NIN fields', async () => {
    routes['GET /money/wallet'] = ['hold'];
    let app = await boot();
    expect(app.screen.getByTestId('open-wallet-loading')).toBeTruthy();
    await app.screen.unmount();

    routes = {};
    app = await boot();
    const phone = await app.screen.findByTestId('open-wallet-phone');
    expect(phone.props.value).toBe('0803 123 4412');
    expect(phone.props.readOnly).toBe(true);
    expect(app.screen.getByText('Must be the number on your BVN')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('');
    expect(app.screen.getByTestId('open-wallet-nin').props.value).toBe('');
  });

  it('a user who taps Continue with nothing typed is told what is missing, and nothing is sent', async () => {
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-continue'));
    expect(app.screen.getByText('Enter the 11 digits of your BVN.')).toBeTruthy();
    expect(app.screen.getByText('Enter the 11 digits of your NIN.')).toBeTruthy();
    expect(checksSent()).toHaveLength(0);
  });

  it('a user can enter their BVN and NIN and tap Continue: the check runs and the BVN’s name, date of birth and gender are kept for A5', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill })];
    const app = await boot();
    await typeNumbers(app, '2219 0000111', '70190000999');
    expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('2219 0000 111');
    expect(app.screen.getByTestId('open-wallet-nin').props.value).toBe('7019 0000 999');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));

    expect(await app.screen.findByTestId('open-wallet-confirmed')).toBeTruthy();
    expect(checksSent()).toHaveLength(1);
    expect(JSON.parse(checksSent()[0].body)).toEqual({ bvn: BVN, nin: NIN });
    expect(app.kept.readKeptCheck(OWNER)?.prefill).toEqual(prefill);
    expect(app.kept.readKeptCheck('someone-else')).toBeNull();
    // Shown back masked to the last 4 digits the server answered, never the typed numbers.
    expect(app.screen.getByText('•••• ••• 0111')).toBeTruthy();
    expect(app.screen.getByText('•••• ••• 0999')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-bvn')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onClose).toHaveBeenCalledTimes(1);
  });

  it('A14: a user whose BVN is registered to another phone sees the server’s sentence on the phone, can correct the number and continue', async () => {
    routes['POST /money/identity/bvn'] = [refusal(422, 'bvn_phone_mismatch', A14, { checksLeft: 2 }), ok({ identity: passedIdentity, prefill })];
    const app = await boot();
    await typeNumbers(app, '22190000222');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));

    expect(await app.screen.findByText(A14)).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-phone').props.accessibilityHint).toBe(A14);
    expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('2219 0000 222');
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();

    await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-bvn'), BVN);
    expect(app.screen.queryByText(A14)).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByTestId('open-wallet-confirmed')).toBeTruthy();
    expect(checksSent().map((s) => JSON.parse(s.body).bvn)).toEqual(['22190000222', BVN]);
  });

  it('a user whose BVN is not found sees the server’s sentence under the BVN', async () => {
    const said = 'We could not confirm that BVN. Check the number and try again.';
    routes['POST /money/identity/bvn'] = [refusal(422, 'bvn_not_confirmed', said, { checksLeft: 1 })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText(said)).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-bvn').props.accessibilityHint).toBe(said);
  });

  it('a user without a Nigerian BVN reaches a clear "Not available yet" end, from the link or from the server, not an error', async () => {
    let app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-no-bvn'));
    expect(app.screen.getByTestId('open-wallet-not-available')).toBeTruthy();
    expect(app.screen.getByText('Not available yet')).toBeTruthy();
    expect(checksSent()).toHaveLength(0);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onClose).toHaveBeenCalledTimes(1);
    await app.screen.unmount();

    const said = 'A Naira wallet needs a Nigerian phone number on your account.';
    routes['POST /money/identity/bvn'] = [refusal(422, 'phone_not_nigerian', said)];
    app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByTestId('open-wallet-not-available')).toBeTruthy();
    expect(app.screen.getByText(new RegExp(said))).toBeTruthy();
    expect(app.screen.queryByRole('alert')).toBeNull();
  });

  it('a user who has used today’s checks, or whose check could not run, is told so above the form and keeps what they typed', async () => {
    const limit = 'You have used today’s BVN checks. Try again later.';
    const down = 'We could not check your BVN right now. Try again in a moment.';
    routes['POST /money/identity/bvn'] = [refusal(429, 'identity_checks_exhausted', limit, { retryAfterSeconds: 3600 }), refusal(503, 'provider_unreachable', down), 'offline'];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText(limit)).toBeTruthy();
    expect(app.screen.getByText("You've used today's checks")).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-nin').props.value).toBe('7019 0000 999');

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText(down)).toBeTruthy();
    expect(app.screen.getByText("We couldn't check your BVN")).toBeTruthy();

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText('No connection')).toBeTruthy();
  });

  it('a double tap on Continue sends one check (each is charged)', async () => {
    routes['POST /money/identity/bvn'] = ['hold'];
    const app = await boot();
    await typeNumbers(app);
    const button = app.screen.getByTestId('open-wallet-continue');
    await app.fireEvent.press(button);
    await app.fireEvent.press(button);
    await app.waitFor(() => expect(checksSent()).toHaveLength(1));
  });

  it('a user whose wallet is already open, or still opening, is told so instead of the form', async () => {
    serve({ 'GET /money/wallet': ok({ state: 'open' }) });
    let app = await boot();
    expect(await app.screen.findByTestId('open-wallet-already-open')).toBeTruthy();
    await app.screen.unmount();

    serve({ 'GET /money/wallet': ok({ state: 'opening' }) });
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-opening')).toBeTruthy();
    await app.screen.unmount();

    serve();
    routes['POST /money/identity/bvn'] = [refusal(409, 'wallet_already_open', 'Your wallet is already open.')];
    app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByTestId('open-wallet-already-open')).toBeTruthy();
  });

  it('a user whose details could not load sees the error and can try again', async () => {
    routes['GET /users/me'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-error')).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('open-wallet-phone')).toBeTruthy();
  });

  it('the BVN and NIN are never written to the phone’s storage or the console, and the fields are cleared once the check passes', async () => {
    const logged: string[] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      jest.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logged.push(args.map(String).join(' '));
      }),
    );
    routes['POST /money/identity/bvn'] = [refusal(422, 'bvn_phone_mismatch', A14, { checksLeft: 2 }), ok({ identity: passedIdentity, prefill })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByText(A14);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    spies.forEach((spy) => spy.mockRestore());

    const kept = JSON.stringify(app.kept.readKeptCheck(OWNER));
    for (const secret of [BVN, NIN]) {
      expect(mockStored.join('\n')).not.toContain(secret);
      expect(logged.join('\n')).not.toContain(secret);
      expect(kept).not.toContain(secret);
    }
    expect(app.screen.queryByDisplayValue(/0000 111|0000 999/)).toBeNull();
  });
});
