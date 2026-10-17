/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
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

type Reply = { status: number; body: unknown; headers?: Record<string, string> };
/** `gate`: the answer waits until the test opens it (a check that answers late). */
type Answer = Reply | 'offline' | 'hold' | { gate: Promise<void>; then: Reply };
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
const prefill = { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' as const };

/** A sealed check handle as the server answers it (opaque to the app). */
const HANDLE = 'v1.k03-test-handle';

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
    let answer = routes[key]?.shift() ?? fallback[key];
    if (!answer) throw new Error(`no answer for ${key}`);
    if (typeof answer === 'object' && 'gate' in answer) {
      await answer.gate;
      answer = answer.then;
    }
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hold') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json', ...answer.headers } });
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

/*
 * The first test in this file used to pay for loading the screen's modules and React Native's components (loaded on
 * first use, by babel-preset-expo's lazy imports) and for the renderer's own start: 25 s on a cold transform cache,
 * which is what a fresh checkout has, against a test's 20 s. They load here, with the fetch in place, where no timeout
 * applies, and the first render of anything is paid in a hook with a budget of its own.
 */
const { OpenWalletScreen } = require('../OpenWalletScreen') as typeof import('../OpenWalletScreen');
const kept = require('../keptCheck') as typeof import('../keptCheck');
void [ActivityIndicator, Animated, Image, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

const clients: QueryClient[] = [];

/** A token shaped as WAWU ID's: only its `sub` claim is read by the app. */
function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });

/**
 * Renders A26 with a fresh query cache, as a route would, or with `shared`:
 * the app has one cache for every account that signs in on the phone.
 */
async function boot(shared?: QueryClient) {
  const onClose = jest.fn();
  const onContinue = jest.fn();
  // No garbage-collection timer: a cache timer left running keeps jest from exiting.
  const client = shared ?? newClient();
  clients.push(client);
  const wrap = (child: ReactElement) => (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {child}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
  await rtl.render(wrap(<OpenWalletScreen onClose={onClose} onContinue={onContinue} />));
  return { ...rtl, onClose, onContinue, kept, client };
}

/**
 * After the session ends with A26 still mounted, the screen drops its reads and
 * react-query re-reads for the observers still there: let that settle inside
 * act, so no update lands after the test.
 */
async function settle(app: Awaited<ReturnType<typeof boot>>) {
  await app.waitFor(() => expect(app.client.isFetching()).toBe(0));
  await app.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

const allTextOf = (app: Awaited<ReturnType<typeof boot>>) => JSON.stringify(app.screen.toJSON());
const checksSent = () => sent.filter((s) => s.method === 'POST' && s.path.endsWith('/money/identity/bvn'));

/**
 * Types or pastes into a field as the platform would: a `maxLength` on the
 * field cuts the text before `onChangeText` sees it (react-native and the
 * browser both do), so a test catches a limit that drops pasted digits.
 */
async function typeInto(field: ReturnType<typeof rtl.screen.getByTestId>, text: string) {
  const max = field.props.maxLength;
  await rtl.fireEvent.changeText(field, typeof max === 'number' ? text.slice(0, max) : text);
}

async function typeNumbers(app: Awaited<ReturnType<typeof boot>>, bvn = BVN, nin = NIN) {
  await typeInto(await app.screen.findByTestId('open-wallet-bvn'), bvn);
  await typeInto(app.screen.getByTestId('open-wallet-nin'), nin);
}

beforeEach(() => {
  sent = [];
  routes = {};
  mockStored.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  serve();
  kept.forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
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
  it('a user sees a loading view first, then A31 as drawn: "Complete your account" and "1 of 4", the hints, the lock line, empty BVN and NIN fields and no phone field', async () => {
    routes['GET /money/wallet'] = ['hold'];
    let app = await boot();
    expect(app.screen.getByTestId('open-wallet-loading')).toBeTruthy();
    await app.screen.unmount();

    routes = {};
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.screen.getByText('Complete your account')).toBeTruthy();
    expect(app.screen.getByTestId('auth-step').props.children).toBe('1 of 4');
    expect(app.screen.getByText('Verify your identity')).toBeTruthy();
    expect(app.screen.getByText('Needed for your account number. Your phone number must match your BVN record.')).toBeTruthy();
    expect(app.screen.getByText('Dial *565*0# to get it')).toBeTruthy();
    expect(app.screen.getByText('Dial *346# to get it')).toBeTruthy();
    expect(app.screen.getByText('Checked with NIBSS. Never shown on your profile.')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-phone')).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-no-bvn')).toBeNull();
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
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
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
    // KYC-03: the sealed handle the check answered is kept beside it, in memory only.
    expect(app.kept.readHandle(OWNER)).toBe(HANDLE);
    expect(mockStored).toEqual([]);
    // Shown back masked to the last 4 digits the server answered, never the typed numbers.
    expect(app.screen.getByText('•••• ••• 0111')).toBeTruthy();
    expect(app.screen.getByText('•••• ••• 0999')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-bvn')).toBeNull();
    // KYC-03: the pass goes straight on to A5; seen again, the check's end offers Continue (A5) and Back (leave).
    expect(app.onContinue).toHaveBeenCalledTimes(1);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onContinue).toHaveBeenCalledTimes(2);
    expect(app.onClose).not.toHaveBeenCalled();
    await app.fireEvent.press(app.screen.getByTestId('auth-back'));
    expect(app.onClose).toHaveBeenCalledTimes(1);
  });

  it('a pass that answers no check handle (G-72) is not a pass the next steps can use: nothing is kept and A5 does not open', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByTestId('open-wallet-banner')).toBeTruthy();
    expect(app.screen.getByText('Your details could not be read. Try again.')).toBeTruthy();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.onContinue).not.toHaveBeenCalled();
  });

  it('A14: a user whose BVN is registered to another phone sees the board’s banner over the form, can correct the number and continue', async () => {
    routes['POST /money/identity/bvn'] = [refusal(422, 'bvn_phone_mismatch', A14, { checksLeft: 2 }), ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    const app = await boot();
    await typeNumbers(app, '22190000222');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));

    expect(await app.screen.findByTestId('open-wallet-phone-mismatch')).toBeTruthy();
    expect(app.screen.getByText("Your phone doesn't match your BVN record")).toBeTruthy();
    expect(app.screen.getByText('Use the number on your BVN, or update it with your bank.')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('2219 0000 222');
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();

    await typeInto(app.screen.getByTestId('open-wallet-bvn'), BVN);
    expect(app.screen.queryByTestId('open-wallet-phone-mismatch')).toBeNull();
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

  it('a user without a Nigerian phone number reaches a clear "Not available yet" end from the server, not an error (A31 draws no link for it)', async () => {
    const said = 'A Naira wallet needs a Nigerian phone number on your account.';
    routes['POST /money/identity/bvn'] = [refusal(422, 'phone_not_nigerian', said)];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByTestId('open-wallet-not-available')).toBeTruthy();
    expect(app.screen.getByText(new RegExp(said))).toBeTruthy();
    expect(app.screen.getByText('Not available yet')).toBeTruthy();
    expect(app.screen.queryByRole('alert')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onClose).toHaveBeenCalledTimes(1);
  });

  it('a user who has used today’s checks, or whose check could not run, is told so above the form and keeps what they typed', async () => {
    const limit = 'You have used today’s BVN checks. Try again later.';
    const down = 'We could not check your BVN right now. Try again in a moment.';
    routes['POST /money/identity/bvn'] = [refusal(429, 'identity_checks_exhausted', limit, { retryAfterSeconds: 3600 }), refusal(503, 'provider_unreachable', down), 'offline'];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    // The wait is the server's own figure (reason.retryAfterSeconds 3600), in words.
    expect(await app.screen.findByText('Try again in about an hour.')).toBeTruthy();
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
    // Both taps in the same frame, through the press handler the platform
    // calls: the button has not re-rendered as busy yet, so only the
    // in-flight guard can stop the second.
    await app.act(async () => {
      button.props.onClick({ nativeEvent: {} });
      button.props.onClick({ nativeEvent: {} });
    });
    await app.waitFor(() => expect(checksSent()).toHaveLength(1));
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(checksSent()).toHaveLength(1);
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
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
  });

  it('a user who pastes a BVN or NIN with spaces, dashes or dots round the digits keeps all 11 digits', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    const app = await boot();
    const bvnField = await app.screen.findByTestId('open-wallet-bvn');
    for (const pasted of ['2219 - 0000 - 111', '  2219 0000 111  ', '221-900-001-11', '221 900 001 11', '2219.0000.111']) {
      await typeInto(app.screen.getByTestId('open-wallet-bvn'), '');
      await typeInto(app.screen.getByTestId('open-wallet-bvn'), pasted);
      expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('2219 0000 111');
    }
    expect(bvnField.props.maxLength).toBeUndefined();
    await typeInto(app.screen.getByTestId('open-wallet-nin'), '7019 - 0000 - 999 ');
    expect(app.screen.getByTestId('open-wallet-nin').props.value).toBe('7019 0000 999');
    // More than 11 digits keeps the first 11, as typing past the end would.
    await typeInto(app.screen.getByTestId('open-wallet-nin'), '701900009991234');
    expect(app.screen.getByTestId('open-wallet-nin').props.value).toBe('7019 0000 999');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    expect(JSON.parse(checksSent()[0].body)).toEqual({ bvn: BVN, nin: NIN });
  });

  it('a refused check never turns into a failed load: with the Hub unreachable the banner and the typed numbers stay, even when every read then fails', async () => {
    routes['POST /money/identity/bvn'] = ['offline'];
    const app = await boot();
    await typeNumbers(app);
    serve({ 'GET /users/me': 'offline', 'GET /money/wallet': 'offline', 'GET /money/identity': 'offline' });
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText('No connection')).toBeTruthy();
    await app.act(async () => {
      await app.client.refetchQueries();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.client.getQueryCache().findAll({ queryKey: ['open-wallet', 'me'] })[0]?.state.status).toBe('error');
    expect(app.screen.queryByTestId('open-wallet-error')).toBeNull();
    expect(app.screen.getByText('No connection')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('2219 0000 111');
    expect(app.screen.getByTestId('open-wallet-nin').props.value).toBe('7019 0000 999');
    // Only the one check was sent; nothing re-read the identity on its own.
    expect(checksSent()).toHaveLength(1);
  });

  it('the address limit says how long to wait from the answer’s Retry-After headers, and "later" when there is none', async () => {
    const throttled = (headers?: Record<string, string>): Answer => ({
      status: 429,
      body: { statusCode: 429, message: 'ThrottlerException: Too Many Requests', data: null },
      headers,
    });
    routes['POST /money/identity/bvn'] = [
      throttled({ 'Retry-After-short': '60', 'Retry-After-medium': '3448' }),
      throttled({ 'Retry-After-short': '42' }),
      throttled(),
    ];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText('Try again in about an hour.')).toBeTruthy();
    expect(app.screen.getByText('Too many tries')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText('Try again in under a minute.')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText('Try again later.')).toBeTruthy();
    expect(app.screen.queryByText(/Wait a minute/)).toBeNull();
  });

  it('"BVN confirmed" shows only for a kept check whose last 4 digits are the server’s current ones', async () => {
    const kept = require('../keptCheck') as typeof import('../keptCheck');
    serve({ 'GET /money/identity': ok(passedIdentity) });
    kept.keepCheck(kept.ticketFor(OWNER), { identity: { ...passedIdentity, bvn: { last4: '9999', verifiedAt: '2026-10-02T10:00:00.000Z' } }, prefill, checkHandle: HANDLE });
    let app = await boot();
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
    await app.screen.unmount();

    kept.keepCheck(kept.ticketFor(OWNER), { identity: passedIdentity, prefill, checkHandle: HANDLE });
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-confirmed')).toBeTruthy();
  });

  it('the kept BVN details are forgotten when the user signs out', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    expect(app.kept.readKeptCheck(OWNER)).not.toBeNull();
    const session = require('@/api/session') as typeof import('@/api/session');
    await app.act(async () => {
      await session.signOut();
    });
    await settle(app);
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
  });

  it('the kept BVN details are forgotten when the session ends because the refresh is refused', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    const session = require('@/api/session') as typeof import('@/api/session');
    const refused = jest.fn(async () => new Response(JSON.stringify({ statusCode: 401, message: 'invalid refresh token' }), { status: 401 }));
    const hubFetch = globalThis.fetch;
    globalThis.fetch = refused as typeof fetch;
    try {
      await app.act(async () => {
        await session.refreshAccessToken(await session.getAccessToken() as string);
        // Let the screen's own reaction to the ended session settle inside act.
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    } finally {
      globalThis.fetch = hubFetch;
    }
    // The ended session drops A26's reads; any read that follows settles inside act too.
    await settle(app);
    expect(refused).toHaveBeenCalled();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
  });

  it('a handle refused at A6 or A7 lands here with the server’s sentence; a new pass keeps A5’s address and the sentence goes', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE }), ok({ identity: passedIdentity, prefill, checkHandle: 'v1.k03-test-handle-2' })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    // A5 kept the address; A6 then met 409 bvn_not_checked and the route restarted with the server's words.
    app.kept.keepAddress(app.kept.ticketFor(OWNER), { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' }, 'Filmmaker');
    await app.act(async () => app.kept.expireKeptCheck('Check your BVN again to continue.'));

    expect(await app.screen.findByTestId('open-wallet-check-again')).toBeTruthy();
    expect(app.screen.getByText('We need a new BVN check')).toBeTruthy();
    expect(app.screen.getByText('Check your BVN again to continue. Your home address and occupation are kept.')).toBeTruthy();
    expect(allTextOf(app)).not.toMatch(/\u2014/);
    expect(app.screen.getByTestId('open-wallet-bvn').props.value).toBe('');

    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    expect(app.onContinue).toHaveBeenCalledTimes(2);
    expect(app.screen.queryByTestId('open-wallet-check-again')).toBeNull();
    expect(app.kept.readHandle(OWNER)).toBe('v1.k03-test-handle-2');
    expect(app.kept.readAddress(OWNER)).toEqual({ street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
    expect(app.kept.readOccupation(OWNER)).toBe('Filmmaker');
    expect(mockStored).toEqual([]);
  });

  it('a restart with no sentence (nothing was kept) shows the form without a banner, and what waits is still forgotten on leaving', async () => {
    const kept = require('../keptCheck') as typeof import('../keptCheck');
    kept.keepCheck(kept.ticketFor(OWNER), { identity: passedIdentity, prefill, checkHandle: HANDLE });
    kept.keepAddress(kept.ticketFor(OWNER), { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
    kept.expireKeptCheck(null);
    const app = await boot();
    await app.screen.findByTestId('open-wallet-bvn');
    expect(app.screen.queryByTestId('open-wallet-check-again')).toBeNull();
    // Kept for this account across A26's mount; gone when A26 goes.
    expect(app.kept.readAddress(OWNER)).not.toBeNull();
    await app.screen.unmount();
    expect(app.kept.readAddress(OWNER)).toBeNull();
  });

  it('the kept BVN details are forgotten when Open your wallet is left, and when another account opens it', async () => {
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    let app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    await app.screen.unmount();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();

    app.kept.keepCheck(app.kept.ticketFor('someone-else'), { identity: passedIdentity, prefill, checkHandle: HANDLE });
    app = await boot();
    await app.screen.findByTestId('open-wallet-bvn');
    expect(app.kept.readKeptCheck('someone-else')).toBeNull();
  });

  it('a pass that answers after the user left the step mid-check is never kept, and re-entry shows the form', async () => {
    let open = () => undefined as void;
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    routes['POST /money/identity/bvn'] = [{ gate, then: { status: 200, body: { statusCode: 200, message: 'OK', data: { identity: passedIdentity, prefill, checkHandle: HANDLE } } } }];
    let app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.waitFor(() => expect(checksSent()).toHaveLength(1));
    // Header Back while the check is running: the step closes.
    await app.screen.unmount();
    await app.act(async () => {
      open();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    // The closed step writes nothing at all, not even the identity into the query cache,
    // and its reads left with it.
    expect(app.client.getQueryCache().findAll({ queryKey: ['open-wallet'] })).toHaveLength(0);
    expect(app.client.getQueryCache().findAll().map((q) => q.state.data)).not.toContainEqual(passedIdentity);

    serve({ 'GET /money/identity': ok(passedIdentity) });
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
  });

  it('a pass that answers after the session that sent it ended is never kept, even when the same person signs in again', async () => {
    let open = () => undefined as void;
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    routes['POST /money/identity/bvn'] = [{ gate, then: { status: 200, body: { statusCode: 200, message: 'OK', data: { identity: passedIdentity, prefill, checkHandle: HANDLE } } } }];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.waitFor(() => expect(checksSent()).toHaveLength(1));
    const session = require('@/api/session') as typeof import('@/api/session');
    await app.act(async () => {
      await session.signOut();
    });
    await settle(app);
    // The same person signs in again before the answer lands.
    mockVault.set('wawu.session.access', tokenFor(OWNER));
    mockVault.set('wawu.session.refresh', 'refresh-2');
    session.resetSessionForTests();
    await app.act(async () => {
      await session.restoreSession();
    });
    await app.act(async () => {
      open();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
  });

  it('even a stray late write is refused by the store once the step forgot', async () => {
    const kept = require('../keptCheck') as typeof import('../keptCheck');
    const ticket = kept.ticketFor(OWNER);
    const app = await boot();
    await app.screen.findByTestId('open-wallet-bvn');
    await app.screen.unmount();
    expect(kept.keepCheck(ticket, { identity: passedIdentity, prefill, checkHandle: HANDLE })).toBe(false);
    expect(kept.readKeptCheck(OWNER)).toBeNull();
  });

  it('with one query cache across a sign-out and a sign-in as someone else, B never sees A’s phone or A’s wallet, even while B’s reads are slow', async () => {
    const OTHER = '00000000-0000-4000-8000-0000000000b2';
    const shared = newClient();
    const session = require('@/api/session') as typeof import('@/api/session');
    // A, with an open wallet, on A26.
    serve({ 'GET /money/wallet': ok({ state: 'open' }) });
    let app = await boot(shared);
    expect(await app.screen.findByTestId('open-wallet-already-open')).toBeTruthy();
    await app.screen.unmount();
    // A26's reads leave with it.
    expect(shared.getQueryCache().findAll({ queryKey: ['open-wallet'] })).toHaveLength(0);
    // Put A's answers back in the shared cache, as an app-wide cache would hold them (FIX-04 clears it).
    shared.setQueryData(['users', 'me', 'open-wallet'], { wawuUserId: OWNER, phone: me.phone });
    shared.setQueryData(['money', 'wallet', 'state'], 'open');
    await app.act(async () => {
      await session.signOut();
    });
    await settle(app);
    // B signs in; B has no wallet and B's reads are held.
    mockVault.set('wawu.session.access', tokenFor(OTHER));
    mockVault.set('wawu.session.refresh', 'refresh-b');
    session.resetSessionForTests();
    let releaseB = () => undefined as void;
    const gate = new Promise<void>((resolve) => {
      releaseB = resolve;
    });
    let releaseWallet = () => undefined as void;
    const walletGate = new Promise<void>((resolve) => {
      releaseWallet = resolve;
    });
    serve();
    routes['GET /users/me'] = [{ gate, then: { status: 200, body: { statusCode: 200, message: 'OK', data: { ...me, wawuUserId: OTHER, phone: '+2348099990001' } } } }];
    routes['GET /money/wallet'] = [{ gate: walletGate, then: { status: 200, body: { statusCode: 200, message: 'OK', data: { state: 'not_open' } } } }];
    app = await boot(shared);
    expect(app.screen.getByTestId('open-wallet-loading')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet')).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-already-open')).toBeNull();
    // B's account answers; B's wallet read is still held: nothing of A's wallet shows meanwhile.
    await app.act(async () => {
      releaseB();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(app.screen.queryByTestId('open-wallet-already-open')).toBeNull();
    expect(app.screen.getByTestId('open-wallet-loading')).toBeTruthy();
    await app.act(async () => {
      releaseWallet();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-already-open')).toBeNull();
  });

  it('a person whose real-shaped token payload holds - and _ (and a non-ASCII name) sees the form with their phone', async () => {
    const claims = {
      sub: '6c1f2a9e-4b7d-4e2a-9c3f-8d5e7b1a0f42',
      email: 'personx@example.test',
      firstName: 'Ngozi',
      lastName: 'Ọ̀kọ̀',
      avatarUrl: 'https://cdn.example.test/u/a.png?v=10',
      iat: 1791043200,
      exp: 1791044100,
    };
    const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const payload = part(claims);
    expect(payload).toMatch(/-/);
    expect(payload).toMatch(/_/);
    mockVault.set('wawu.session.access', `${part({ alg: 'RS256', typ: 'JWT' })}.${payload}.MEUCIQDx-_sig`);
    serve({ 'GET /users/me': ok({ ...me, wawuUserId: claims.sub, firstName: 'Ngozi', lastName: 'Ọ̀kọ̀' }) });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet')).toBeTruthy();
  });

  it('an account read that is not the signed-in account is never shown', async () => {
    // The Hub answers as someone else (a stale or crossed answer): A26 waits instead of painting it.
    serve({ 'GET /users/me': ok({ ...me, wawuUserId: '00000000-0000-4000-8000-0000000000c3', phone: '+2348077770000' }) });
    const app = await boot();
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(app.screen.getByTestId('open-wallet-loading')).toBeTruthy();
    expect(app.screen.queryByDisplayValue('0807 777 0000')).toBeNull();
  });

  it('A26’s reads are dropped when the session ends while it is open', async () => {
    const app = await boot();
    await app.screen.findByTestId('open-wallet-bvn');
    expect(app.client.getQueryCache().findAll({ queryKey: ['open-wallet'] }).length).toBeGreaterThan(0);
    const session = require('@/api/session') as typeof import('@/api/session');
    await app.act(async () => {
      await session.signOut();
    });
    await settle(app);
    // Nothing read before the session ended is left, and nothing is read as nobody.
    const left = app.client.getQueryCache().findAll({ queryKey: ['open-wallet'] });
    expect(left.filter((q) => q.state.data !== undefined)).toHaveLength(0);
    expect(left.filter((q) => q.state.fetchStatus !== 'idle')).toHaveLength(0);
    expect(sent.filter((x) => x.path.endsWith('/users/me'))).toHaveLength(1);
  });

  it('the BVN and NIN are never written to the phone’s storage or the console, and the fields are cleared once the check passes', async () => {
    const logged: string[] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      jest.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logged.push(args.map(String).join(' '));
      }),
    );
    routes['POST /money/identity/bvn'] = [refusal(422, 'bvn_phone_mismatch', A14, { checksLeft: 2 }), ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    const app = await boot();
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-phone-mismatch');
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

describe('the kept BVN details end with the session, on every way it ends (FIX-04 onSessionEnd), with the app’s own query client', () => {
  const B = '00000000-0000-4000-8000-0000000000b2';
  const pair = (sub: string, n: string) => ok({ accessToken: tokenFor(sub), refreshToken: `refresh-${n}` });

  /** A passes the check on A26, drawn with the app's real query client (`createQueryClient`). */
  async function passAsA() {
    const { createQueryClient } = require('@/api/query') as typeof import('@/api/query');
    routes['POST /money/identity/bvn'] = [ok({ identity: passedIdentity, prefill, checkHandle: HANDLE })];
    const app = await boot(createQueryClient());
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await app.screen.findByTestId('open-wallet-confirmed');
    expect(app.kept.readKeptCheck(OWNER)).not.toBeNull();
    return app;
  }

  it('a refresh that answers another account’s token (the status stays signed in) drops A’s details at once, A26 still mounted', async () => {
    const app = await passAsA();
    const session = require('@/api/session') as typeof import('@/api/session');
    let ends = 0;
    const off = session.onSessionEnd(() => {
      ends += 1;
    });
    routes['GET /users/me'] = ['hold'];
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    let keptRightAfter: unknown = 'not read';
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      keptRightAfter = app.kept.readKeptCheck(OWNER);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    off();
    expect(ends).toBe(1);
    expect(session.useSession).toBeDefined();
    expect(await session.getAccessToken()).toBe(tokenFor(B));
    expect(keptRightAfter).toBeNull();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.kept.readKeptCheck(B)).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
  });

  it('a sign-in that replaces the session drops A’s details at once, A26 still mounted', async () => {
    const app = await passAsA();
    const session = require('@/api/session') as typeof import('@/api/session');
    routes['GET /users/me'] = ['hold'];
    routes['POST /auth/login'] = [pair(B, 'b')];
    let keptRightAfter: unknown = 'not read';
    await app.act(async () => {
      await session.signIn('b@example.test', 'pw-123456');
      keptRightAfter = app.kept.readKeptCheck(OWNER);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(keptRightAfter).toBeNull();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.kept.readKeptCheck(B)).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
  });

  it('A to B to A without a sign-out: A’s new session never gets the old session’s details back', async () => {
    const app = await passAsA();
    const session = require('@/api/session') as typeof import('@/api/session');
    routes['GET /users/me'] = ['hold'];
    routes['POST /auth/refresh'] = [pair(B, 'b'), pair(OWNER, 'a2')];
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    routes['GET /users/me'] = [];
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    await app.waitFor(() => expect(app.screen.queryByTestId('open-wallet-loading')).toBeNull());
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
    await settle(app);
  });

  it('A’s check answering after a switch to B without a sign-out is not kept', async () => {
    const { createQueryClient } = require('@/api/query') as typeof import('@/api/query');
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    routes['POST /money/identity/bvn'] = [{ gate, then: { status: 200, body: { statusCode: 200, message: 'OK', data: { identity: passedIdentity, prefill, checkHandle: HANDLE } } } }];
    const app = await boot(createQueryClient());
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    const session = require('@/api/session') as typeof import('@/api/session');
    routes['GET /users/me'] = ['hold'];
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    await app.act(async () => {
      release();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.kept.readKeptCheck(B)).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
  });

  it('after a refresh that answers B, A26 shows B’s own form and A’s details are gone', async () => {
    const app = await passAsA();
    const session = require('@/api/session') as typeof import('@/api/session');
    routes['GET /users/me'] = [ok({ ...me, wawuUserId: B, phone: '+2348039990077' })];
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    await settle(app);
  });
});

describe('an answer from an ended session writes nothing, and a gone A26 hears no session end', () => {
  const B = '00000000-0000-4000-8000-0000000000b2';
  const pair = (sub: string, n: string) => ok({ accessToken: tokenFor(sub), refreshToken: `refresh-${n}` });

  /**
   * A's check is held; the session ends (a refresh answering B's token) and a
   * later onSessionEnd listener releases A's answer, so it lands after the
   * forget but before React has drawn anything new: the narrowest window.
   */
  async function answerInsideSessionEnd(answer: Reply, bMe: Answer = 'hold') {
    const { createQueryClient } = require('@/api/query') as typeof import('@/api/query');
    const client = createQueryClient();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    routes['POST /money/identity/bvn'] = [{ gate, then: answer }];
    const app = await boot(client);
    await typeNumbers(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    const session = require('@/api/session') as typeof import('@/api/session');
    const off = session.onSessionEnd(() => release());
    routes['GET /users/me'] = [bMe];
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    off();
    return { app, client };
  }

  it('a pass landing as the session ends puts none of A’s identity in the app’s cache, and keeps nothing', async () => {
    const { app, client } = await answerInsideSessionEnd({ status: 200, body: { statusCode: 200, message: 'OK', data: { identity: passedIdentity, prefill, checkHandle: HANDLE } } });
    expect(client.getQueryCache().findAll({ queryKey: ['open-wallet', 'identity'] }).filter((q) => q.state.data !== undefined)).toHaveLength(0);
    expect(client.getQueryCache().findAll().map((q) => q.state.data)).not.toContainEqual(passedIdentity);
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.kept.readKeptCheck(B)).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-confirmed')).toBeNull();
  });

  it('a refusal landing as the session ends moves no screen state: B, once read, gets B’s own form, not A’s end', async () => {
    const said = 'A Naira wallet needs a Nigerian phone number on your account.';
    const { app } = await answerInsideSessionEnd(
      { status: 422, body: { statusCode: 422, message: said, data: null, reason: { code: 'phone_not_nigerian', message: said } } },
      ok({ ...me, wawuUserId: B, phone: '+2348039990088' }),
    );
    expect(await app.screen.findByTestId('open-wallet-bvn')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-not-available')).toBeNull();
    expect(app.screen.queryByText(said)).toBeNull();
    await settle(app);
  });

  it('a session end after A26 has closed reaches nothing of the gone screen', async () => {
    const { createQueryClient } = require('@/api/query') as typeof import('@/api/query');
    const client = createQueryClient();
    const app = await boot(client);
    await app.screen.findByTestId('open-wallet-bvn');
    const removeSpy = jest.spyOn(client, 'removeQueries');
    await app.screen.unmount();
    const afterUnmount = removeSpy.mock.calls.length;
    const session = require('@/api/session') as typeof import('@/api/session');
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    await app.act(async () => {
      await session.refreshAccessToken((await session.getAccessToken()) as string);
      await session.signOut();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(removeSpy.mock.calls.length - afterUnmount).toBe(0);
    removeSpy.mockRestore();
  });

  it('opening and closing A26 twenty times leaves no session-end listener behind', async () => {
    const session = require('@/api/session') as typeof import('@/api/session');
    const real = session.onSessionEnd;
    let live = 0;
    const spy = jest.spyOn(session, 'onSessionEnd').mockImplementation((listener: () => void) => {
      live += 1;
      const off = real(listener);
      return () => {
        live -= 1;
        off();
      };
    });
    try {
      for (let i = 0; i < 20; i += 1) {
        const app = await boot();
        await app.screen.findByTestId('open-wallet-bvn');
        await app.screen.unmount();
      }
    } finally {
      spy.mockRestore();
    }
    expect(live).toBe(0);
  });
});
