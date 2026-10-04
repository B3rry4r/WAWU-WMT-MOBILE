/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightColors } from '@/theme/tokens.generated';

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

type Reply = { status: number; body: unknown };
type Answer = Reply | 'offline' | 'hold' | { gate: Promise<void>; then: Reply };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000f1';
const ACCOUNT = { accountNumber: '8123456789', accountName: 'Ada Eze', bankName: 'Loma Bank', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };
const pinState = (isSet: boolean) => ({ isSet, changedAt: isSet ? '2026-10-04T09:01:00.000Z' : null, triesLeft: 5, lockedUntil: null });
/** The server's own sentence for `pin_mismatch` (wawu-backend `transaction-pin.service.ts`). */
const MISMATCH = 'The two PINs do not match. Enter the same PIN twice.';

let sent: Sent[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown, status = 200): Reply => ({ status, body: { statusCode: status, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
const view = (over: Record<string, unknown> = {}) =>
  ok({ state: 'open', account: ACCOUNT, limits: null, pin: pinState(false), bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0, ...over });

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
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

async function boot(given?: QueryClient) {
  const { CreatePinScreen } = require('../CreatePinScreen') as typeof import('../CreatePinScreen');
  const props = { onBack: jest.fn(), onDone: jest.fn(), onNotOpen: jest.fn(), onLeave: jest.fn() };
  const client = given ?? new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const invalidated: unknown[] = [];
  const invalidate = client.invalidateQueries.bind(client);
  client.invalidateQueries = ((filters?: { queryKey?: unknown }) => {
    invalidated.push(filters?.queryKey);
    return invalidate(filters as never);
  }) as typeof client.invalidateQueries;
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <CreatePinScreen {...props} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { ...rtl, ...props, invalidated };
}

type App = Awaited<ReturnType<typeof boot>>;

async function type(app: App, pin: string) {
  for (const d of pin) await app.fireEvent.press(app.screen.getByRole('button', { name: d }));
}

const pinPosts = () => sent.filter((s) => s.method === 'POST' && s.path.endsWith('/money/pin'));
const allText = (app: App) => JSON.stringify(app.screen.toJSON());
const dotStyles = (app: App) => app.screen.getByTestId('open-wallet-pin-dots').props.children.map((dot: { props: { style: unknown } }) => StyleSheet.flatten(dot.props.style));

beforeEach(() => {
  sent = [];
  routes = {};
  mockStored.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/wallet': view(), 'POST /money/pin': ok(pinState(true), 201) };
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A9 · Create PIN', () => {
  it('a user sees step 1 of 2 and the line written from the PIN’s length, then can enter 4 digits', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-pin-create')).toBeTruthy();
    expect(app.screen.getByText('Create your transaction PIN')).toBeTruthy();
    expect(app.screen.getByText('1 of 2')).toBeTruthy();
    expect(app.screen.getByText('Four digits. It approves every payment and transfer.')).toBeTruthy();
    await app.waitFor(() => expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    await type(app, '27');
    expect(app.screen.getByLabelText('2 of 4 digits entered')).toBeTruthy();
    await type(app, '49');
    // Four digits move to A10; nothing is sent before the second entry.
    expect(await app.screen.findByTestId('open-wallet-pin-confirm')).toBeTruthy();
    expect(app.screen.getByText('Enter it again')).toBeTruthy();
    expect(app.screen.getByText('2 of 2')).toBeTruthy();
    expect(app.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    expect(pinPosts()).toHaveLength(0);
  });

  it('Delete takes back a digit, and Back from A9 goes to A8', async () => {
    const app = await boot();
    await app.waitFor(() => expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    await type(app, '27');
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Delete' }));
    expect(app.screen.getByLabelText('1 of 4 digits entered')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-pin-back'));
    expect(app.onBack).toHaveBeenCalledTimes(1);
  });
});

describe('A10 · Confirm PIN', () => {
  async function ready() {
    const app = await boot();
    await app.waitFor(() => expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    return app;
  }

  it('a user who re-enters the same 4 digits sets the PIN once, in the body only, and goes back to where the flow started', async () => {
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts()).toHaveLength(1);
    expect(JSON.parse(pinPosts()[0].body)).toEqual({ pin: '2749', pinConfirmation: '2749' });
    expect(pinPosts()[0].path).toBe('/api/hub/money/pin');
    // Money reads are asked again, so the pay sheet or the Wallet tab sees the open wallet.
    expect(app.invalidated).toContainEqual(['money']);
    // The PIN is never kept: not in storage, not on screen.
    expect(mockStored).toEqual([]);
    expect(allText(app)).not.toContain('2749');
  });

  it('a mismatch shows the server’s sentence in the PIN sheet’s wrong-PIN look, and the user starts again at A9', async () => {
    routes['POST /money/pin'] = [refusal(400, 'pin_mismatch', MISMATCH)];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2750');
    expect(await app.screen.findByTestId('open-wallet-pin-line')).toBeTruthy();
    expect(app.screen.getByText(MISMATCH)).toBeTruthy();
    expect(app.screen.getByRole('alert')).toBeTruthy();
    // W11's look: the empty dots ringed in danger while nothing is typed.
    expect(dotStyles(app).every((s: { borderColor?: string }) => s.borderColor === lightColors.danger)).toBe(true);
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    expect(app.screen.getByText('1 of 2')).toBeTruthy();
    expect(app.onDone).not.toHaveBeenCalled();
    // Typing again clears the ring; the two new entries are what is sent.
    await type(app, '1');
    expect(dotStyles(app).slice(1).every((s: { borderColor?: string }) => s.borderColor === lightColors.borderStrong)).toBe(true);
    await type(app, '357');
    await type(app, '1357');
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts().map((p) => JSON.parse(p.body))).toEqual([
      { pin: '2749', pinConfirmation: '2750' },
      { pin: '1357', pinConfirmation: '1357' },
    ]);
  });

  it('Back from A10 goes to A9 and drops the first entry', async () => {
    const app = await ready();
    await type(app, '2749');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-pin-back'));
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    expect(app.onBack).not.toHaveBeenCalled();
    await type(app, '1357');
    await type(app, '1357');
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(JSON.parse(pinPosts()[0].body)).toEqual({ pin: '1357', pinConfirmation: '1357' });
  });

  it('while the PIN is being set the keys are off: a fifth tap sends nothing more', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(pinState(true), 201) }];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-setting')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByRole('button', { name: '1' }));
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-pin-back'));
    expect(app.onBack).not.toHaveBeenCalled();
    await app.act(async () => release());
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts()).toHaveLength(1);
  });

  it('a PIN the server already held, unknown to this screen, is never shown as set: the earlier PIN stands', async () => {
    routes['POST /money/pin'] = [refusal(409, 'pin_already_set', 'You already have a transaction PIN.')];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    expect(app.screen.getByText('You already have a transaction PIN')).toBeTruthy();
    expect(app.screen.getByText(/the one you just entered was not saved\. Your earlier PIN is the one that approves payments\./)).toBeTruthy();
    expect(app.onDone).not.toHaveBeenCalled();
    expect(allText(app)).not.toContain('\u2014');
    await app.fireEvent.press(app.screen.getByText('Done'));
    expect(app.onDone).toHaveBeenCalledTimes(1);
  });

  it('P4: two different entries while the server already holds a PIN end on the earlier PIN, never as set', async () => {
    routes['POST /money/pin'] = [refusal(409, 'pin_already_set', 'You already have a transaction PIN.')];
    const app = await ready();
    await type(app, '1111');
    await type(app, '2222');
    expect(await app.screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    expect(app.onDone).not.toHaveBeenCalled();
    expect(JSON.parse(pinPosts()[0].body)).toEqual({ pin: '1111', pinConfirmation: '2222' });
  });

  it('P3: no answer to the set and none to the wallet read: A10 stays with Try again, never a new entry, and no second PIN is sent', async () => {
    routes['POST /money/pin'] = ['offline', refusal(409, 'pin_already_set', 'You already have a transaction PIN.')];
    routes['GET /money/wallet'] = [view(), 'offline', 'offline', view({ pin: pinState(true) })];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-check-again')).toBeTruthy();
    expect(app.screen.getByText("We couldn't check whether your PIN was set. No connection. Check your internet and try again.")).toBeTruthy();
    // Still A10, keys off: no new PIN can be chosen while the first may be set.
    expect(app.screen.getByTestId('open-wallet-pin-confirm')).toBeTruthy();
    expect(app.screen.getByText('2 of 2')).toBeTruthy();
    expect(app.screen.getByRole('button', { name: '5' }).props.accessibilityState?.disabled).toBe(true);
    await type(app, '5555');
    await type(app, '5555');
    expect(pinPosts()).toHaveLength(1);
    expect(app.onDone).not.toHaveBeenCalled();
    // Try again repeats only the read: still no answer, then the answer says the PIN is set.
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-pin-check-again'));
    expect(await app.screen.findByTestId('open-wallet-pin-check-again')).toBeTruthy();
    expect(app.onDone).not.toHaveBeenCalled();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-pin-check-again'));
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts()).toHaveLength(1);
    expect(sent.filter((x) => x.method === 'GET' && x.path.endsWith('/money/wallet')).length).toBeGreaterThanOrEqual(4);
  });

  it('Back while it is not known whether the PIN was set goes to A8 (which reads the wallet), not to A9', async () => {
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'offline'];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-check-again')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-pin-back'));
    expect(app.onBack).toHaveBeenCalledTimes(1);
    expect(app.screen.queryByTestId('open-wallet-pin-create')).toBeNull();
  });

  it('a user who arrives with a PIN already set skips A9 and A10', async () => {
    fallback['GET /money/wallet'] = view({ pin: pinState(true) });
    const app = await boot();
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts()).toHaveLength(0);
  });

  it('no answer: the wallet read says whether the PIN was set; not set, the user is told and starts again', async () => {
    routes['POST /money/pin'] = ['offline', 'offline'];
    routes['GET /money/wallet'] = [view(), view({ pin: pinState(false) }), view({ pin: pinState(true) })];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    // Not the wrong-PIN look: nothing was wrong with what was typed.
    expect(dotStyles(app).every((s: { borderColor?: string }) => s.borderColor === lightColors.borderStrong)).toBe(true);
    expect(app.onDone).not.toHaveBeenCalled();
    // The second time the answer is lost too, but the read shows it was set: that PIN, typed twice, is the one.
    await type(app, '2749');
    await type(app, '2749');
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
  });

  it('another refusal (the wallet frozen) shows the server’s sentence and starts again at A9', async () => {
    routes['POST /money/pin'] = [refusal(423, 'wallet_frozen', 'Your wallet is frozen. Contact support.')];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByText('Your wallet is frozen. Contact support.')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    expect(app.onDone).not.toHaveBeenCalled();
  });

  it('an answer that lands after the session ended moves nothing', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(pinState(true), 201) }];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-setting')).toBeTruthy();
    await app.act(async () => {
      await (require('@/api/session') as typeof import('@/api/session')).signOut();
    });
    await app.act(async () => release());
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.onDone).not.toHaveBeenCalled();
    expect(app.invalidated).not.toContainEqual(['money']);
  });

  it('an answer that lands after the screen closed moves nothing', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(pinState(true), 201) }];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-setting')).toBeTruthy();
    await app.screen.unmount();
    await rtl.act(async () => release());
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.onDone).not.toHaveBeenCalled();
  });
});

describe('A9 and A10 when the session changes while signed in (KYC-04 round 2)', () => {
  const B = '00000000-0000-4000-8000-0000000000b2';
  const pair = (sub: string, n: string) => ok({ accessToken: tokenFor(sub), refreshToken: `refresh-${n}` });
  const session = () => require('@/api/session') as typeof import('@/api/session');
  const realClient = () => (require('@/api/query') as typeof import('@/api/query')).createQueryClient();
  async function readyWith(client: QueryClient) {
    const app = await boot(client);
    await app.waitFor(() => expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    return app;
  }

  it('P1: a refresh that answers another account mid-A9 drops what was typed and leaves the flow; nothing of A reaches B’s PIN', async () => {
    const app = await readyWith(realClient());
    await type(app, '27');
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    await app.act(async () => {
      await session().refreshAccessToken((await session().getAccessToken()) as string);
    });
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    expect(app.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    // Were the screen still drawn, B starts from nothing and a set ends normally.
    await app.waitFor(() => expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    await type(app, '1358');
    await type(app, '1358');
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts().map((x) => JSON.parse(x.body))).toEqual([{ pin: '1358', pinConfirmation: '1358' }]);
  });

  it('P6: a sign-in as another account on A10 drops A9’s entry: back on A9, and four digits send nothing', async () => {
    const app = await readyWith(realClient());
    await type(app, '2749');
    expect(app.screen.getByTestId('open-wallet-pin-confirm')).toBeTruthy();
    routes['POST /auth/login'] = [pair(B, 'b')];
    await app.act(async () => {
      await session().signIn('b@example.test', 'pw-123456');
    });
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    expect(app.screen.getByText('1 of 2')).toBeTruthy();
    await app.waitFor(() => expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBeFalsy());
    await type(app, '2749');
    expect(pinPosts()).toHaveLength(0);
    expect(app.screen.getByTestId('open-wallet-pin-confirm')).toBeTruthy();
  });

  it('a session change while A’s PIN is being set never leaves the screen on "Setting your PIN", and A’s late answer moves nothing', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(pinState(true), 201) }];
    const app = await readyWith(realClient());
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-setting')).toBeTruthy();
    routes['POST /auth/refresh'] = [pair(B, 'b')];
    await app.act(async () => {
      await session().refreshAccessToken((await session().getAccessToken()) as string);
    });
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    expect(app.screen.queryByTestId('open-wallet-pin-setting')).toBeNull();
    expect(app.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    await app.act(async () => release());
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.onDone).not.toHaveBeenCalled();
    expect(pinPosts()).toHaveLength(1);
  });
});

describe('A9 and A10: loading, error and no wallet', () => {
  it('a user waits with the keys off until the wallet is read', async () => {
    routes['GET /money/wallet'] = ['hold'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-pin-loading')).toBeTruthy();
    expect(app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled).toBe(true);
    await type(app, '2749');
    expect(app.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
  });

  it('a read that never answered shows why, and Try again reads it again', async () => {
    routes['GET /money/wallet'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-pin-error')).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('open-wallet-pin-dots')).toBeTruthy();
  });

  it('no open wallet (a link, a reload): A8 says where it stands', async () => {
    fallback['GET /money/wallet'] = view({ state: 'not_open', account: null });
    const app = await boot();
    await app.waitFor(() => expect(app.onNotOpen).toHaveBeenCalledTimes(1));
    expect(pinPosts()).toHaveLength(0);
  });
});
