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

type Reply = { status: number; body: unknown };
type Answer = Reply | 'offline' | 'hold' | { gate: Promise<void>; then: Reply };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000c1';

let sent: Sent[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Answer => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code, message } },
});

const identity = { bvn: { last4: '0111', verifiedAt: '2026-10-03T10:00:00.000Z' }, ninLast4: '0999', occupation: null, checksLeft: 2 };
type Prefill = import('@/api/walletIdentity').BvnPrefill;
const prefill: Prefill = { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' };

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
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}
installFetch();

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];

/** Seeds what A26 keeps when a check passes, as A26 does: under a ticket for the account. */
function keepPassedCheck(check = { identity, prefill }) {
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  kept.keepCheck(kept.ticketFor(OWNER), check);
  return kept;
}

async function boot() {
  const { ConfirmDetailsScreen } = require('../ConfirmDetailsScreen') as typeof import('../ConfirmDetailsScreen');
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  const props = { onBack: jest.fn(), onContinue: jest.fn(), onRestart: jest.fn(), onLeave: jest.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  const wrap = (child: ReactElement) => (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>
  );
  await rtl.render(wrap(<ConfirmDetailsScreen {...props} />));
  return { ...rtl, ...props, kept, client };
}

const occupationSaves = () => sent.filter((s) => s.method === 'PUT' && s.path.endsWith('/money/identity/occupation'));

async function fillIn(app: Awaited<ReturnType<typeof boot>>, values = { street: '14 Admiralty Way', city: 'Lekki', occupation: 'Filmmaker' }) {
  await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-street'), values.street);
  await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-city'), values.city);
  await app.fireEvent.press(app.screen.getByTestId('open-wallet-state'));
  await app.fireEvent.press(await app.screen.findByTestId('state-Lagos'));
  await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-occupation'), values.occupation);
  await app.fireEvent.press(app.screen.getByTestId('open-wallet-consent'));
}

beforeEach(() => {
  sent = [];
  routes = {};
  mockStored.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/identity': ok(identity),
    'PUT /money/identity/occupation': ok({ ...identity, occupation: 'Filmmaker' }),
  };
  (require('../keptCheck') as typeof import('../keptCheck')).forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A5 · Confirm your details', () => {
  it('a user sees a loading view, then the BVN’s name, date of birth and gender as drawn, and empty address fields', async () => {
    keepPassedCheck();
    routes['GET /money/identity'] = ['hold'];
    let app = await boot();
    expect(await app.screen.findByTestId('open-wallet-details-loading')).toBeTruthy();
    await app.screen.unmount();

    routes = {};
    app = await boot();
    expect(await app.screen.findByTestId('open-wallet-from-bvn')).toBeTruthy();
    expect(app.screen.getByText('From your BVN')).toBeTruthy();
    expect(app.screen.getByText('Ada B Eze')).toBeTruthy();
    expect(app.screen.getByText('4 Oct 1992')).toBeTruthy();
    expect(app.screen.getByText('Female')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-street').props.value).toBe('');
    expect(app.screen.getByTestId('open-wallet-city').props.value).toBe('');
    expect(app.screen.getByText('Choose')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-occupation').props.value).toBe('');
    expect(app.screen.getByTestId('open-wallet-consent').props.accessibilityState.checked).toBe(false);
    // The BVN card is read-only: none of its values is a field.
    expect(app.screen.queryByDisplayValue('Ada B Eze')).toBeNull();
  });

  it('a user can enter their home address and occupation, tick consent and Continue: the occupation is saved, the address kept for A7, and A6 opens', async () => {
    keepPassedCheck();
    const app = await boot();
    await fillIn(app);
    expect(app.screen.getByText('Lagos')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-consent').props.accessibilityState.checked).toBe(true);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));

    await app.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(occupationSaves()).toHaveLength(1);
    expect(JSON.parse(occupationSaves()[0].body)).toEqual({ occupation: 'Filmmaker' });
    expect(app.kept.readAddress(OWNER)).toEqual({ street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
    // Nothing of it goes to the phone's storage, and the address is never sent to the server here.
    expect(mockStored).toEqual([]);
    expect(sent.some((s) => s.body.includes('Admiralty'))).toBe(false);
  });

  it('a user who taps Continue with nothing filled in is told what is missing, and nothing is sent', async () => {
    keepPassedCheck();
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-details-continue'));
    expect(app.screen.getByText('Enter your street address.')).toBeTruthy();
    expect(app.screen.getByText('Enter your city or town.')).toBeTruthy();
    expect(app.screen.getByText('Choose your state.')).toBeTruthy();
    expect(app.screen.getByText('Enter your occupation.')).toBeTruthy();
    expect(app.screen.getByText('Tick the box to agree before you continue.')).toBeTruthy();
    expect(occupationSaves()).toHaveLength(0);
    expect(app.onContinue).not.toHaveBeenCalled();
  });

  it('a user who has not ticked consent cannot continue; ticking it clears the line', async () => {
    keepPassedCheck();
    const app = await boot();
    await fillIn(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-consent'));
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));
    expect(app.screen.getByTestId('open-wallet-consent-error')).toBeTruthy();
    expect(occupationSaves()).toHaveLength(0);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-consent'));
    expect(app.screen.queryByTestId('open-wallet-consent-error')).toBeNull();
  });

  it('a user sees the occupation the server already holds, and the address they typed before, on coming back', async () => {
    const kept = keepPassedCheck();
    kept.keepAddress(kept.ticketFor(OWNER), { street: '2 Allen Avenue', city: 'Ikeja', state: 'Lagos' });
    fallback['GET /money/identity'] = ok({ ...identity, occupation: 'Photographer' });
    const app = await boot();
    expect((await app.screen.findByTestId('open-wallet-occupation')).props.value).toBe('Photographer');
    expect(app.screen.getByTestId('open-wallet-street').props.value).toBe('2 Allen Avenue');
    expect(app.screen.getByTestId('open-wallet-city').props.value).toBe('Ikeja');
    expect(app.screen.getByText('Lagos')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('auth-back'));
    expect(app.onBack).toHaveBeenCalledTimes(1);
  });

  it('with no passed check kept for this account (a restarted app, another account), the user is sent back to A26', async () => {
    const app = await boot();
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalled());
    expect(sent.filter((s) => s.path.endsWith('/money/identity'))).toHaveLength(0);
  });

  it('when the server holds another check than the one kept (a newer one, elsewhere), the user is sent back to A26', async () => {
    keepPassedCheck();
    fallback['GET /money/identity'] = ok({ ...identity, bvn: { last4: '0222', verifiedAt: '2026-10-03T11:00:00.000Z' } });
    const app = await boot();
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalled());
    expect(app.screen.queryByTestId('open-wallet-details')).toBeNull();
  });

  it('a user whose details could not load sees why and can try again', async () => {
    keepPassedCheck();
    routes['GET /money/identity'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-details-error')).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('open-wallet-details')).toBeTruthy();
  });

  it('a user whose BVN gave no readable date of birth is told the account cannot open, before any selfie is charged', async () => {
    keepPassedCheck({ identity, prefill: { ...prefill, dateOfBirth: null } });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-details-unusable')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-details-continue')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onLeave).toHaveBeenCalledTimes(1);
  });

  it('a user without a gender on the BVN sees the card without that row', async () => {
    keepPassedCheck({ identity, prefill: { ...prefill, gender: null } });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-from-bvn')).toBeTruthy();
    expect(app.screen.queryByText('Gender')).toBeNull();
  });

  it('a refused save shows the server’s words where they belong: the occupation, a banner, or back to A26', async () => {
    keepPassedCheck();
    routes['PUT /money/identity/occupation'] = [
      { status: 400, body: { statusCode: 400, message: ['Occupation must be 2 to 80 characters with a letter.'], data: null } },
      'offline',
      refusal(409, 'bvn_not_checked', 'Check your BVN first.'),
    ];
    const app = await boot();
    await fillIn(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));
    expect(await app.screen.findByText('Occupation must be 2 to 80 characters with a letter.')).toBeTruthy();

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));
    expect(await app.screen.findByTestId('open-wallet-details-banner')).toBeTruthy();
    expect(app.screen.getByText('No connection')).toBeTruthy();

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));
    await app.waitFor(() => expect(app.onRestart).toHaveBeenCalled());
    expect(app.onContinue).not.toHaveBeenCalled();
    expect(app.kept.readAddress(OWNER)).toBeNull();
  });

  it('a second tap while saving sends nothing more', async () => {
    keepPassedCheck();
    let release!: () => void;
    routes['PUT /money/identity/occupation'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(identity) as Reply }];
    const app = await boot();
    await fillIn(app);
    const button = app.screen.getByTestId('open-wallet-details-continue');
    // Both taps in the same frame, through the press handler the platform calls:
    // the button has not re-rendered as busy yet, so only the in-flight guard can stop the second.
    await app.act(async () => {
      button.props.onClick({ nativeEvent: {} });
      button.props.onClick({ nativeEvent: {} });
    });
    expect(occupationSaves()).toHaveLength(1);
    await app.act(async () => release());
    await app.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
  });

  it('a save that answers after the session ended keeps nothing and goes nowhere', async () => {
    keepPassedCheck();
    let release!: () => void;
    routes['PUT /money/identity/occupation'] = [{ gate: new Promise<void>((resolve) => (release = resolve)), then: ok(identity) as Reply }];
    const app = await boot();
    await fillIn(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));
    await app.act(async () => {
      await (require('@/api/session') as typeof import('@/api/session')).signOut();
    });
    await app.act(async () => release());
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.onContinue).not.toHaveBeenCalled();
    expect(app.kept.readKeptCheck(OWNER)).toBeNull();
    expect(app.kept.readAddress(OWNER)).toBeNull();
  });
});
