/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightColors } from '@/theme/tokens.generated';

import { ALREADY_SET } from '../pin';

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

/**
 * What the screen's React state holds that looks like a PIN. `useState` is watched for the calls that come from CreatePinScreen.tsx itself,
 * and the values the latest render got back (one per hook) are what the screen holds now. Call `watchState()` before `boot()`.
 */
let stateSpy: jest.SpyInstance | null = null;
const stateCalls: unknown[] = [];
function watchState() {
  const React = require('react') as typeof import('react');
  const real = React.useState;
  stateCalls.length = 0;
  stateSpy = jest.spyOn(React, 'useState').mockImplementation(((initial: unknown) => {
    const result = real(initial as never);
    // The first frame that is neither this wrapper nor jest's own is the caller of useState.
    const caller = (new Error().stack ?? '').split('\n').slice(1).find((frame) => !frame.includes('CreatePinScreen.test') && !frame.includes('jest-mock'));
    if (caller?.includes('CreatePinScreen.tsx')) stateCalls.push(result[0]);
    return result;
  }) as unknown as typeof real);
}
/** The rendered tree under the element with this testID. */
function subtreeOf(app: App, testID: string): unknown {
  type Node = { props?: { testID?: string }; children?: unknown[] };
  const find = (node: unknown): Node | null => {
    if (typeof node !== 'object' || node === null) return null;
    const n = node as Node;
    if (n.props?.testID === testID) return n;
    for (const child of n.children ?? []) {
      const hit = find(child);
      if (hit) return hit;
    }
    return null;
  };
  const tree = app.screen.toJSON();
  return find(Array.isArray(tree) ? { children: tree } : tree);
}
function heldInState(): string[] {
  const source = (require('fs') as typeof import('fs')).readFileSync(require.resolve('../CreatePinScreen'), 'utf8');
  const hooks = (source.match(/= useState[<(]/g) ?? []).length;
  expect(hooks).toBeGreaterThan(0);
  return stateCalls.slice(-hooks).filter((value): value is string => typeof value === 'string' && /^\d{4}$/.test(value));
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
  stateSpy?.mockRestore();
  stateSpy = null;
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

  it('a 409 pin_already_set ends on a sentence that is true whether this person’s own set landed first or a PIN was set before: never "not saved", never "your PIN is set"', async () => {
    routes['POST /money/pin'] = [refusal(409, 'pin_already_set', 'You already have a transaction PIN.')];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    expect(app.screen.getByText('You already have a transaction PIN')).toBeTruthy();
    // The exact words (BRIEF section 12, A10, round 3).
    expect(app.screen.getByText('Your account has a transaction PIN. If you just set it, it is the one you typed. If you set one before, that earlier PIN still approves payments.')).toBeTruthy();
    expect(ALREADY_SET.message).toBe('Your account has a transaction PIN. If you just set it, it is the one you typed. If you set one before, that earlier PIN still approves payments.');
    // It says nothing false in case (a), the typed PIN is the stored one, and nothing false in case (b), an earlier PIN stands.
    const text = allText(app);
    expect(text).not.toMatch(/not saved|was not|wasn.t saved|did not save|not stored/i);
    expect(text).not.toContain('2749');
    expect(app.onDone).not.toHaveBeenCalled();
    expect(text).not.toContain('\u2014');
    // The money reads are asked again on this end too, so the pay sheet or the Wallet tab sees the PIN.
    expect(app.invalidated).toContainEqual(['money']);
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

  it('Finding 3: Back while "Checking your PIN" looks and acts disabled, with the shared button’s own disabled prop', async () => {
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'hold'];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-checking')).toBeTruthy();
    const back = app.screen.getByTestId('open-wallet-pin-back');
    expect(back.props.accessibilityState?.disabled).toBe(true);
    expect(back.props.accessible).not.toBe(false);
    // Looks disabled: the glyph is drawn in the disabled text colour, as in "Setting your PIN".
    expect(JSON.stringify(subtreeOf(app, 'open-wallet-pin-back'))).toContain(lightColors.textDisabled);
    await app.fireEvent.press(back);
    expect(app.onBack).not.toHaveBeenCalled();
    expect(app.screen.getByTestId('open-wallet-pin-checking')).toBeTruthy();
  });

  it('Finding 3: Back is enabled again once the check has answered (unknown state) and in plain entry', async () => {
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'offline'];
    const app = await ready();
    expect(app.screen.getByTestId('open-wallet-pin-back').props.accessibilityState?.disabled).toBeFalsy();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-check-again')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-pin-back').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('Finding 4: the unknown-state line keeps its icon beside its text: a row whose text shrinks and is not centred inside a full-width box', async () => {
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'offline'];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    const line = await app.screen.findByTestId('open-wallet-pin-line');
    const row = StyleSheet.flatten(line.props.style);
    expect(row).toMatchObject({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' });
    // The same row W11's wrong-PIN line is. Its text shrinks to fit and does not centre itself inside a box as wide as the row,
    // which is what drew the icon at the far edge once the sentence wrapped to two lines.
    const text = app.screen.getByText(/We couldn.t check whether your PIN was set\./);
    const style = StyleSheet.flatten(text.props.style);
    expect(style.flexShrink).toBe(1);
    expect(style.textAlign).not.toBe('center');
  });

  it('Finding 5: the second entry leaves React state as soon as the request has answered, in every end state', async () => {
    watchState();
    const held = (_app: App) => heldInState();
    // Unknown: no answer to the set, none to the read.
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'offline'];
    let app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-check-again')).toBeTruthy();
    expect(held(app)).toEqual([]);
    await app.screen.unmount();

    // Already set.
    routes['POST /money/pin'] = [refusal(409, 'pin_already_set', 'You already have a transaction PIN.')];
    app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-already-set')).toBeTruthy();
    expect(held(app)).toEqual([]);
    await app.screen.unmount();

    // Done (the screen is still drawn until the route leaves it; the app's onDone is a mock here).
    app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(held(app)).toEqual([]);
  });

  it('Finding 5: while the request is out the second entry is held (the control for the check above)', async () => {
    watchState();
    let release!: () => void;
    routes['POST /money/pin'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(pinState(true), 201) }];
    const app = await ready();
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-setting')).toBeTruthy();
    expect(heldInState()).toEqual(['2749']);
    await app.act(async () => release());
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(heldInState()).toEqual([]);
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
    // Signed out: the route sends the visitor to the welcome screen itself, the screen does not also leave the flow.
    expect(app.onLeave).not.toHaveBeenCalled();
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

describe('A9 and A10, round 3: sessions that end with a request or a read out, and a cached wallet', () => {
  const B = '00000000-0000-4000-8000-0000000000b2';
  const pair = (sub: string, n: string) => ok({ accessToken: tokenFor(sub), refreshToken: `refresh-${n}` });
  const session = () => require('@/api/session') as typeof import('@/api/session');
  const realClient = () => (require('@/api/query') as typeof import('@/api/query')).createQueryClient();
  const settle = (app: App, ms = 30) =>
    app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  const keysLive = (app: App) => app.screen.getByRole('button', { name: '1' }).props.accessibilityState?.disabled !== true;
  async function readyWith(client: QueryClient) {
    const app = await boot(client);
    await app.waitFor(() => expect(keysLive(app)).toBe(true));
    return app;
  }
  const switchToB = (app: App) =>
    app.act(async () => {
      routes['POST /auth/refresh'] = [pair(B, 'b')];
      await session().refreshAccessToken((await session().getAccessToken()) as string);
    });

  it('M4: a session end while A’s set is out frees the screen for B: B’s own two entries are sent, and A’s late answer moves nothing', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(pinState(true), 201) }];
    const app = await readyWith(realClient());
    await type(app, '2749');
    await type(app, '2749');
    expect(await app.screen.findByTestId('open-wallet-pin-setting')).toBeTruthy();
    await switchToB(app);
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    await app.waitFor(() => expect(keysLive(app)).toBe(true));
    // Were the screen still drawn, B types and sends: the in-flight mark of A's request must not hold B back.
    await type(app, '6060');
    await type(app, '6060');
    await app.waitFor(() => expect(pinPosts()).toHaveLength(2));
    expect(JSON.parse(pinPosts()[1].body)).toEqual({ pin: '6060', pinConfirmation: '6060' });
    await app.act(async () => release());
    await settle(app, 40);
    // A's late 201 changed nothing of B's visit, and B's own 201 ended it once.
    expect(app.onDone).toHaveBeenCalledTimes(1);
    expect(pinPosts()).toHaveLength(2);
  });

  it('M6: a wallet read of an earlier visit that says "set" acts on nothing: the screen is A9 for B, no Done, no money invalidation', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'offline', { gate: new Promise<void>((resolve) => (release = resolve)), then: view({ pin: pinState(true) }) }];
    const app = await readyWith(realClient());
    await type(app, '2749');
    await type(app, '2749');
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-pin-check-again'));
    expect(await app.screen.findByTestId('open-wallet-pin-checking')).toBeTruthy();
    routes['POST /auth/login'] = [pair(B, 'b')];
    await app.act(async () => {
      await session().signIn('b@example.test', 'pw-123456');
    });
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    const before = app.invalidated.length;
    await app.act(async () => release());
    await settle(app, 40);
    expect(app.onDone).not.toHaveBeenCalled();
    expect(app.invalidated.length).toBe(before);
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-pin-checking')).toBeNull();
  });

  it('M5: a session end clears A’s sentence: B does not see the line A was shown', async () => {
    routes['POST /money/pin'] = [refusal(400, 'pin_mismatch', MISMATCH)];
    const app = await readyWith(realClient());
    await type(app, '2749');
    await type(app, '2750');
    expect(await app.screen.findByTestId('open-wallet-pin-line')).toBeTruthy();
    await switchToB(app);
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    expect(app.screen.queryByTestId('open-wallet-pin-line')).toBeNull();
    expect(app.screen.queryByText(MISMATCH)).toBeNull();
  });

  it('M7: a wallet read of an earlier visit that fails draws nothing for B: no line, no Try again', async () => {
    let release!: () => void;
    routes['POST /money/pin'] = ['offline'];
    routes['GET /money/wallet'] = [view(), 'offline', { gate: new Promise<void>((resolve) => (release = resolve)), then: refusal(500, 'server_error', 'Something went wrong.') }];
    const app = await readyWith(realClient());
    await type(app, '2749');
    await type(app, '2749');
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-pin-check-again'));
    expect(await app.screen.findByTestId('open-wallet-pin-checking')).toBeTruthy();
    routes['POST /auth/login'] = [pair(B, 'b')];
    await app.act(async () => {
      await session().signIn('b@example.test', 'pw-123456');
    });
    await app.waitFor(() => expect(app.onLeave).toHaveBeenCalledTimes(1));
    await app.act(async () => release());
    await settle(app, 40);
    expect(app.screen.queryByTestId('open-wallet-pin-check-again')).toBeNull();
    expect(app.screen.queryByText(/couldn.t check whether your PIN was set/)).toBeNull();
  });

  it('Finding 2: A9 never opens with live keys on a cached wallet whose PIN state is unknown: the cached read is not trusted while it is read again', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const { openedWalletQuery } = require('../api/wallet') as typeof import('../api/wallet');
    // What A8 left in the cache: an open wallet with no PIN yet, from before A9 opened.
    client.setQueryData(openedWalletQuery(OWNER).queryKey, { state: 'open', account: { accountNumber: '8123456789', accountName: 'Ada Eze', bankName: 'Loma Bank' }, limits: null, pinIsSet: false });
    let release!: () => void;
    routes['GET /money/wallet'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: view({ pin: pinState(true) }) }];
    const app = await boot(client);
    expect(await app.screen.findByTestId('open-wallet-pin-loading')).toBeTruthy();
    expect(keysLive(app)).toBe(false);
    await type(app, '2749');
    await type(app, '2749');
    expect(pinPosts()).toHaveLength(0);
    expect(app.screen.getByLabelText('0 of 4 digits entered')).toBeTruthy();
    // The read says a PIN is set: the flow ends, no set is ever sent.
    await app.act(async () => release());
    await app.waitFor(() => expect(app.onDone).toHaveBeenCalledTimes(1));
    expect(pinPosts()).toHaveLength(0);
  });

  it('Finding 2: when the read behind a cached wallet says no PIN yet, the keys come on only then; when it fails, the keys stay off with Try again', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const { openedWalletQuery } = require('../api/wallet') as typeof import('../api/wallet');
    const cached = { state: 'open', account: { accountNumber: '8123456789', accountName: 'Ada Eze', bankName: 'Loma Bank' }, limits: null, pinIsSet: false };
    client.setQueryData(openedWalletQuery(OWNER).queryKey, cached);
    routes['GET /money/wallet'] = ['offline', view()];
    const app = await boot(client);
    expect(await app.screen.findByTestId('open-wallet-pin-error')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-pin-dots')).toBeNull();
    await app.fireEvent.press(app.screen.getByText('Try again'));
    await app.waitFor(() => expect(keysLive(app)).toBe(true));
    expect(app.screen.getByTestId('open-wallet-pin-create')).toBeTruthy();
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
