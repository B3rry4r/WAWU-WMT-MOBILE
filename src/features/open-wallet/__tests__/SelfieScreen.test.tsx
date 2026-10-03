/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { CaptureResult, SelfieCapture } from '../selfie/types';

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
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

type Reply = { status: number; body: unknown; headers?: Record<string, string> };
type Answer = Reply | 'offline' | 'hold' | { gate: Promise<void>; then: Reply };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000d1';
/** A made-up capture: plain base64 of the right size, never a real face. */
const IMAGE = `/9j/${'A'.repeat(3000)}`;

let sent: Sent[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string, extra: Record<string, unknown> = {}): Reply => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code, message, ...extra } },
});

const identity = { bvn: { last4: '0111', verifiedAt: '2026-10-03T10:00:00.000Z' }, ninLast4: '0999', occupation: 'Filmmaker', checksLeft: 2 };
const prefill = { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' as const };
const address = { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' };
const A16 = "We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.";
const wallet = (state: string) => ok({ state, account: null, limits: null });

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    sent.push({ method: request.method, path, body: await request.clone().text() });
    const key = `${request.method} ${path.replace(/^\/api\/hub/, '')}`;
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
installFetch();

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

/** What A26 and A5 keep before A6: the passed check and the address, under tickets for the account. */
function keepOpening(options: { withAddress?: boolean; check?: { identity: typeof identity; prefill: typeof prefill } } = {}) {
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  kept.keepCheck(kept.ticketFor(OWNER), options.check ?? { identity, prefill });
  if (options.withAddress !== false) kept.keepAddress(kept.ticketFor(OWNER), address);
  return kept;
}

/** The test seam for the capture (no camera in jest): hands back what each tap gave, in turn. */
function cameraGiving(...results: CaptureResult[]): SelfieCapture & { taps: () => number } {
  let taps = 0;
  return {
    kind: 'ready',
    take: async () => {
      taps += 1;
      return results.shift() ?? { kind: 'image', image: IMAGE };
    },
    taps: () => taps,
  };
}

async function boot(capture: SelfieCapture = cameraGiving()) {
  const { SelfieScreen } = require('../SelfieScreen') as typeof import('../SelfieScreen');
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  const props = { onBack: jest.fn(), onLeave: jest.fn(), onRestart: jest.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  const wrap = (child: ReactElement) => (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>
  );
  await rtl.render(wrap(<SelfieScreen {...props} capture={capture} />));
  return { ...rtl, ...props, kept, client };
}

const matches = () => sent.filter((s) => s.method === 'POST' && s.path.endsWith('/money/identity/selfie'));
const openings = () => sent.filter((s) => s.method === 'POST' && s.path.endsWith('/money/wallet/open'));
const allText = (app: Awaited<ReturnType<typeof boot>>) => JSON.stringify(app.screen.toJSON());

async function take(app: Awaited<ReturnType<typeof boot>>) {
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-selfie-take'));
}

beforeEach(() => {
  sent = [];
  routes = {};
  mockStored.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/identity/selfie': ok({ matchedAt: null, checksLeft: 3 }),
    'POST /money/identity/selfie': ok({ matchedAt: '2026-10-03T10:05:00.000Z', checksLeft: 2 }),
    'POST /money/wallet/open': wallet('open'),
    'GET /money/wallet': wallet('opening'),
  };
  (require('../keptCheck') as typeof import('../keptCheck')).forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  jest.useRealTimers();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A6 · Selfie', () => {
  it('a user sees a loading view, then the oval and the brief’s words; nothing says or suggests a liveness check', async () => {
    keepOpening();
    routes['GET /money/identity/selfie'] = ['hold'];
    let app = await boot();
    expect(await app.screen.findByTestId('open-wallet-selfie-loading')).toBeTruthy();
    await app.screen.unmount();

    routes = {};
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-selfie')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-oval-idle', { includeHiddenElements: true })).toBeTruthy();
    expect(app.screen.getByText('Selfie')).toBeTruthy();
    expect(app.screen.getByText('Fit your face in the oval')).toBeTruthy();
    expect(app.screen.getByText('It must match your BVN photo.')).toBeTruthy();
    expect(allText(app)).not.toMatch(/blink|liveness|alive|live check|turn your head|move your head|smile/i);
  });

  it('a user can take the selfie: it is sent once, without the BVN, then A7 shows while the account opens, and the wallet opens', async () => {
    keepOpening();
    let release!: () => void;
    routes['POST /money/wallet/open'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: wallet('open') as Reply }];
    const app = await boot();
    await take(app);

    // A7: matched, the account opening, a spinner.
    expect(await app.screen.findByTestId('open-wallet-matched')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-oval-matched', { includeHiddenElements: true })).toBeTruthy();
    expect(app.screen.getByText('Matched to your BVN')).toBeTruthy();
    expect(app.screen.getByText('Opening your account')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-opening-spinner')).toBeTruthy();
    expect(allText(app)).not.toMatch(/blink|liveness|alive/i);

    expect(matches()).toHaveLength(1);
    // G-72: the selfie alone; the BVN is not asked for again or kept to be sent.
    expect(JSON.parse(matches()[0].body)).toEqual({ image: IMAGE });
    expect(openings()).toHaveLength(1);
    expect(JSON.parse(openings()[0].body)).toEqual({
      firstName: 'Ada',
      lastName: 'Eze',
      dateOfBirth: '1992-10-04',
      address: '14 Admiralty Way, Lekki, Lagos',
    });

    await app.act(async () => release());
    expect(await app.screen.findByTestId('open-wallet-opened')).toBeTruthy();
    expect(app.screen.getByText('Your wallet is open')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onLeave).toHaveBeenCalledTimes(1);
    // The selfie is never drawn back or stored.
    expect(allText(app)).not.toContain(IMAGE.slice(0, 40));
    expect(mockStored).toEqual([]);
  });

  it('A7 waits while the bank’s answer is confirmed, asking where the account stands, and ends when it opens', async () => {
    keepOpening();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    fallback['POST /money/wallet/open'] = wallet('opening');
    routes['GET /money/wallet'] = [wallet('opening'), wallet('opening'), wallet('open')];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByTestId('open-wallet-matched')).toBeTruthy();
    for (let i = 0; i < 3 && !app.screen.queryByTestId('open-wallet-opened'); i += 1) {
      await app.act(async () => {
        await jest.advanceTimersByTimeAsync(5000);
      });
    }
    expect(await app.screen.findByTestId('open-wallet-opened')).toBeTruthy();
    expect(openings()).toHaveLength(1);
    expect(sent.filter((s) => s.method === 'GET' && s.path.endsWith('/money/wallet')).length).toBeGreaterThanOrEqual(2);
  });

  it('A16: a user whose face did not match sees the server’s words, the red oval, and can try again', async () => {
    keepOpening();
    routes['POST /money/identity/selfie'] = [refusal(422, 'selfie_not_matched', A16, { checksLeft: 2 })];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByTestId('open-wallet-selfie-not-matched')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-oval-refused', { includeHiddenElements: true })).toBeTruthy();
    expect(app.screen.getByText("We couldn't match your face")).toBeTruthy();
    expect(app.screen.getByText(A16)).toBeTruthy();
    expect(openings()).toHaveLength(0);

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-try-again'));
    expect(app.screen.getByText('Fit your face in the oval')).toBeTruthy();
    await take(app);
    expect(await app.screen.findByTestId('open-wallet-opened')).toBeTruthy();
    expect(matches()).toHaveLength(2);
  });

  it('A16 with no match left today offers Done, not Try again', async () => {
    keepOpening();
    routes['POST /money/identity/selfie'] = [refusal(422, 'selfie_not_matched', A16, { checksLeft: 0 })];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByTestId('open-wallet-selfie-not-matched')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-selfie-try-again')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-done'));
    expect(app.onLeave).toHaveBeenCalledTimes(1);
  });

  it('a user who has used today’s matches is told when to try again, from the server’s figure', async () => {
    keepOpening();
    routes['POST /money/identity/selfie'] = [
      refusal(429, 'selfie_checks_exhausted', 'You have used today’s selfie checks. Try again later.', { retryAfterSeconds: 86_400 }),
    ];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByTestId('open-wallet-selfie-limit')).toBeTruthy();
    expect(app.screen.getByText("You've used today's selfie checks")).toBeTruthy();
    expect(app.screen.getByText('Try again in about 24 hours.')).toBeTruthy();
  });

  it('a match that could not run, or no connection, leaves A6 with the reason and the button to take it again', async () => {
    keepOpening();
    routes['POST /money/identity/selfie'] = [
      refusal(503, 'provider_unreachable', 'We could not check your selfie just now. Try again in a moment.', { retryAfterSeconds: 30 }),
      'offline',
    ];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByText("We couldn't check your selfie")).toBeTruthy();
    expect(app.screen.getByText('We could not check your selfie just now. Try again in a moment.')).toBeTruthy();
    await take(app);
    expect(await app.screen.findByText('No connection')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-selfie-take')).toBeTruthy();
    expect(openings()).toHaveLength(0);
  });

  it('today’s server refuses a match sent without the BVN (G-72): the user sees its words, nothing opens', async () => {
    keepOpening();
    routes['POST /money/identity/selfie'] = [{ status: 400, body: { statusCode: 400, message: ['bvn must be 11 digits'], data: null } }];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByText('bvn must be 11 digits')).toBeTruthy();
    expect(openings()).toHaveLength(0);
  });

  it('a capture that cannot be used is never sent; a cancelled one changes nothing', async () => {
    keepOpening();
    const camera = cameraGiving({ kind: 'cancelled' }, { kind: 'unusable' }, { kind: 'image', image: 'tooshort' });
    const app = await boot(camera);
    await take(app);
    expect(app.screen.getByText('Fit your face in the oval')).toBeTruthy();
    await take(app);
    expect(await app.screen.findByText('That photo could not be used')).toBeTruthy();
    await take(app);
    expect(await app.screen.findByText('That photo could not be used. Take it again.')).toBeTruthy();
    expect(camera.taps()).toBe(3);
    expect(matches()).toHaveLength(0);
  });

  it('a second tap while the match runs sends nothing more (each match is charged)', async () => {
    keepOpening();
    let release!: () => void;
    routes['POST /money/identity/selfie'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: refusal(422, 'selfie_not_matched', A16, { checksLeft: 2 }) }];
    const camera = cameraGiving();
    const app = await boot(camera);
    const button = await app.screen.findByTestId('open-wallet-selfie-take');
    // Both taps in the same frame, through the press handler the platform calls:
    // the button has not re-rendered as busy yet, so only the in-flight guard can stop the second.
    await app.act(async () => {
      button.props.onClick({ nativeEvent: {} });
      button.props.onClick({ nativeEvent: {} });
    });
    await app.waitFor(() => expect(matches()).toHaveLength(1));
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-take'));
    expect(camera.taps()).toBe(1);
    await app.act(async () => release());
    expect(await app.screen.findByTestId('open-wallet-selfie-not-matched')).toBeTruthy();
    expect(matches()).toHaveLength(1);
  });

  it('a selfie that already matched this check goes straight to A7 and the opening, without a new match', async () => {
    keepOpening();
    fallback['GET /money/identity/selfie'] = ok({ matchedAt: '2026-10-03T10:05:00.000Z', checksLeft: 2 });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-opened')).toBeTruthy();
    expect(matches()).toHaveLength(0);
    expect(openings()).toHaveLength(1);
  });

  it('an opening the bank refused ends with the server’s words; one that could not run can be asked for again', async () => {
    keepOpening();
    const said = 'Your account could not be opened. Check your details and try again.';
    routes['POST /money/wallet/open'] = [refusal(503, 'provider_unreachable', 'The bank is not answering. Try again in a moment.'), refusal(422, 'account_not_opened', said)];
    const app = await boot();
    await take(app);
    expect(await app.screen.findByTestId('open-wallet-open-failed')).toBeTruthy();
    expect(app.screen.getByText('The bank is not answering. Try again in a moment.')).toBeTruthy();
    // The selfie matched; the X now leaves the flow instead of going back to change what was sent.
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-close'));
    expect(app.onLeave).toHaveBeenCalledTimes(1);
    expect(app.onBack).not.toHaveBeenCalled();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-open-retry'));
    expect(await app.screen.findByTestId('open-wallet-not-opened')).toBeTruthy();
    expect(app.screen.getByText(said)).toBeTruthy();
    expect(openings()).toHaveLength(2);
    expect(matches()).toHaveLength(1);
  });

  it('a check the server no longer holds sends the user back to A26, from the match or from the opening', async () => {
    keepOpening();
    routes['POST /money/identity/selfie'] = [refusal(409, 'bvn_not_checked', 'Check your BVN again first.')];
    let app = await boot();
    await take(app);
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalledTimes(1));
    await app.screen.unmount();

    routes['POST /money/wallet/open'] = [refusal(409, 'bvn_not_checked', 'Check your BVN again first.')];
    app = await boot();
    await take(app);
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalledTimes(1));
  });

  it('with nothing kept for this account, or no address from A5, the user is sent back to A26 and nothing is read', async () => {
    let app = await boot();
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalled());
    await app.screen.unmount();
    keepOpening({ withAddress: false });
    app = await boot();
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalled());
    expect(sent).toHaveLength(0);
  });

  it('a user whose selfie state could not load sees why and can try again', async () => {
    keepOpening();
    routes['GET /money/identity/selfie'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-selfie-error')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-retry-load'));
    expect(await app.screen.findByTestId('open-wallet-selfie')).toBeTruthy();
  });

  it('a build without a camera says so plainly, sends nothing, and goes back to A5', async () => {
    keepOpening();
    const app = await boot({ kind: 'unavailable' });
    expect(await app.screen.findByTestId('open-wallet-selfie-no-camera')).toBeTruthy();
    expect(app.screen.getByText("We can't open your camera")).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-back'));
    expect(app.onBack).toHaveBeenCalledTimes(1);
    expect(matches()).toHaveLength(0);
  });

  it('the X before anything was sent goes back to A5', async () => {
    keepOpening();
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-selfie')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-close'));
    expect(app.onBack).toHaveBeenCalledTimes(1);
  });

  it('a match that answers after the session ended moves nothing and opens nothing', async () => {
    keepOpening();
    let release!: () => void;
    routes['POST /money/identity/selfie'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok({ matchedAt: '2026-10-03T10:05:00.000Z', checksLeft: 2 }) as Reply }];
    const app = await boot();
    await take(app);
    await app.act(async () => {
      await (require('@/api/session') as typeof import('@/api/session')).signOut();
    });
    await app.act(async () => release());
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(openings()).toHaveLength(0);
    expect(app.screen.queryByTestId('open-wallet-matched')).toBeNull();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.kept.readAddress(OWNER)).toBeNull();
  });
});
