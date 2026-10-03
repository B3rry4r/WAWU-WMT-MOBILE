/* eslint-disable @typescript-eslint/no-require-imports */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Slot } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Pressable, Text, View } from 'react-native';

/**
 * FIX-04: one person's cached answers are never shown to the next person.
 * These tests render the app's real root (`src/app/_layout.tsx`), so they use
 * the one query cache the app uses, kept across every session change, the way
 * one app process keeps it.
 */

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));

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

/** A token shaped like WAWU ID's: a JWT whose `sub` is the account. */
const jwtFor = (sub: string, n: number) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ sub, n })}.signature`;
};

type Person = 'A' | 'B';
const people: Record<Person, { email: string; account: string }> = {
  A: { email: 'a@test.wawu.dev', account: '0111111111' },
  B: { email: 'b@test.wawu.dev', account: '0222222222' },
};

/** Every token handed out, and whose it is. */
const owners = new Map<string, Person>();
let issued = 0;
function pairFor(person: Person) {
  issued += 1;
  const accessToken = jwtFor(`account-${person}`, issued);
  const refreshToken = `refresh-${person}-${issued}`;
  owners.set(accessToken, person);
  owners.set(refreshToken, person);
  return { accessToken, refreshToken };
}

/** Tokens the Hub now answers 401, and refresh tokens WAWU ID now refuses. */
const expired = new Set<string>();
/** What WAWU ID's refresh answers with, when a test wants another account's token back. */
let refreshAnswersAs: Person | null = null;
/** Answers held until a test releases them, keyed `METHOD path person`. */
const holds = new Map<string, Promise<void>>();

function hold(key: string) {
  let release: () => void = () => undefined;
  holds.set(
    key,
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return () => {
    holds.delete(key);
    release();
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function payoutOf(person: Person) {
  return {
    bankCode: '000014',
    bankName: 'ACCESS BANK',
    accountNumber: people[person].account,
    accountName: `PERSON ${person}`,
    matchesBvnName: true,
    updatedAt: '2026-10-03T15:00:00.000Z',
  };
}

/** The fake servers. Installed before the app's modules load, because the API client keeps the `fetch` it finds then. */
function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    const body = request.method === 'GET' ? {} : JSON.parse((await request.clone().text()) || '{}');
    if (path.endsWith('/auth/login')) {
      const person = (Object.keys(people) as Person[]).find((p) => people[p].email === body.identifier);
      return person ? json(200, { data: pairFor(person) }) : json(401, { statusCode: 401, message: 'Invalid credentials' });
    }
    if (path.endsWith('/auth/refresh')) {
      const person = owners.get(body.refreshToken);
      if (!person || expired.has(body.refreshToken)) return json(401, { statusCode: 401, message: 'Invalid refresh token' });
      return json(200, { data: pairFor(refreshAnswersAs ?? person) });
    }
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ?? '';
    const person = owners.get(token);
    const held = person ? holds.get(`${request.method} ${path} ${person}`) : undefined;
    if (held) await held;
    if (!person || expired.has(token)) return json(401, { statusCode: 401, message: 'Unauthorized', data: null });
    if (path === '/api/hub/users/me') return json(200, { statusCode: 200, message: 'ok', data: { name: person } });
    if (path === '/api/hub/money/payout-account') return json(200, { statusCode: 200, message: 'ok', data: payoutOf(person) });
    return json(404, { statusCode: 404, message: 'Not found', data: null });
  }) as typeof fetch;
}

installFetch();
const { api, unwrap } = require('@/api/client') as typeof import('@/api/client');
const { resetSessionForTests, signIn, signOut } = require('@/api/session') as typeof import('@/api/session');
const RootLayout = (require('@/app/_layout') as typeof import('@/app/_layout')).default;
const PayoutAccountRoute = (require('@/app/payout-account') as typeof import('@/app/payout-account')).default;

/** Every value the probe drew, in order: an account's name, "loading" or "error". */
const frames: string[] = [];

/** A signed-in screen that reads who is signed in, and can save (a mutation that writes its answer into the cache). */
function Probe() {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['probe', 'me'],
    queryFn: () => unwrap(api.GET('/api/hub/users/me')) as Promise<unknown> as Promise<{ data: { name: string } }>,
    retry: false,
    staleTime: 0,
  });
  const save = useMutation({
    mutationFn: () =>
      unwrap(api.POST('/api/hub/users/me' as never)) as Promise<unknown> as Promise<{ data: { name: string } }>,
    onSuccess: (answer) => queryClient.setQueryData(['probe', 'me'], answer),
  });
  const shown = me.data?.data.name ?? (me.isError ? 'error' : 'loading');
  frames.push(shown);
  return (
    <View>
      <Text testID="probe-name">{shown}</Text>
      <Pressable testID="probe-reload" onPress={() => void me.refetch()} />
      <Pressable testID="probe-save" onPress={() => save.mutate()} />
    </View>
  );
}

const Stub = () => <Text>signed out</Text>;
const routes = {
  _layout: RootLayout,
  welcome: Stub,
  'account-type': Stub,
  'sign-in': Stub,
  'forgot-password': Stub,
  '(tabs)/_layout': () => <Slot />,
  '(tabs)/index': Probe,
  'payout-account': PayoutAccountRoute,
};

async function signInAs(person: Person) {
  await act(async () => {
    await signIn(people[person].email, 'pass');
  });
}

async function signOutNow() {
  await act(async () => {
    await signOut();
  });
  await waitFor(() => expect(screen.getByText('signed out')).toBeTruthy());
}

/** Signs A in and waits for the probe to show A: A's answer is now cached. */
async function aIsCached() {
  await renderRouter(routes);
  await waitFor(() => expect(screen.getByText('signed out')).toBeTruthy());
  await signInAs('A');
  await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('A'));
}

/** Lets every answer already sent arrive and every render it causes run (`renderRouter` turns on fake timers). */
const settled = () => jest.advanceTimersByTimeAsync(50);

/** A tap, and everything it sets off. */
async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
    await settled();
  });
}

/** Everything the probe drew from `mark` on. */
const drawnSince = (mark: number) => frames.slice(mark);

beforeEach(async () => {
  await act(async () => {
    await signOut();
  });
  resetSessionForTests();
  mockVault.clear();
  owners.clear();
  expired.clear();
  holds.clear();
  refreshAnswersAs = null;
  frames.length = 0;
});

describe("one account's cached answers are never drawn for the next (FIX-04)", () => {
  it('after A signs out and B signs in, B never sees A, not even on the first frame', async () => {
    await aIsCached();
    await signOutNow();

    const mark = frames.length;
    await signInAs('B');
    await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('B'));
    expect(drawnSince(mark)[0]).toBe('loading');
    expect(drawnSince(mark)).not.toContain('A');
  });

  it("after A's session is refused (expired and not renewed), B never sees A", async () => {
    await aIsCached();
    owners.forEach((_, token) => expired.add(token));
    await press('probe-reload');
    await waitFor(() => expect(screen.getByText('signed out')).toBeTruthy());

    const mark = frames.length;
    await signInAs('B');
    await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('B'));
    expect(drawnSince(mark)).not.toContain('A');
  });

  it('a sign-in as B over A, with A still on screen, replaces A at once and never draws A again', async () => {
    await aIsCached();

    const mark = frames.length;
    await signInAs('B');
    await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('B'));
    expect(drawnSince(mark)).not.toContain('A');
  });

  it("a refresh that answers with another account's token is a new session too: none of A's answers are drawn after it", async () => {
    await aIsCached();
    await act(async () => router.push('/payout-account'));
    await waitFor(() => expect(screen.getByDisplayValue(people.A.account)).toBeTruthy());
    await act(async () => router.back());
    const aToken = [...owners.keys()].find((t) => t.includes('.'));
    expired.add(aToken ?? '');
    refreshAnswersAs = 'B';

    const mark = frames.length;
    await press('probe-reload');
    await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('B'));
    expect(drawnSince(mark)).not.toContain('A');

    const releaseB = hold('GET /api/hub/money/payout-account B');
    await act(async () => router.push('/payout-account'));
    expect(screen.queryByDisplayValue(people.A.account)).toBeNull();
    expect(screen.getByTestId('payout-loading')).toBeTruthy();
    await act(async () => releaseB());
    await waitFor(() => expect(screen.getByDisplayValue(people.B.account)).toBeTruthy());
  });

  it("A's read still in flight when B signs in never lands: B sees only B, before and after A's answer arrives", async () => {
    await aIsCached();
    const releaseA = hold('GET /api/hub/users/me A');
    await press('probe-reload');
    await signOutNow();

    const mark = frames.length;
    await signInAs('B');
    await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('B'));
    await act(async () => releaseA());
    await act(settled);
    expect(screen.getByTestId('probe-name').props.children).toBe('B');
    expect(drawnSince(mark)).not.toContain('A');
  });

  it("A's save still in flight when B signs in never writes A's answer into B's cache", async () => {
    await aIsCached();
    const releaseA = hold('POST /api/hub/users/me A');
    await press('probe-save');
    await signOutNow();

    const mark = frames.length;
    await signInAs('B');
    await waitFor(() => expect(screen.getByTestId('probe-name').props.children).toBe('B'));
    await act(async () => releaseA());
    await act(settled);
    expect(screen.getByTestId('probe-name').props.children).toBe('B');
    expect(drawnSince(mark)).not.toContain('A');
  });

  it("A21 (payout account): after A signs out and B signs in, B's screen waits for B's answer and never shows A's account", async () => {
    await aIsCached();
    await act(async () => router.push('/payout-account'));
    await waitFor(() => expect(screen.getByDisplayValue(people.A.account)).toBeTruthy());
    await signOutNow();

    await signInAs('B');
    const releaseB = hold('GET /api/hub/money/payout-account B');
    await act(async () => router.push('/payout-account'));
    expect(screen.queryByDisplayValue(people.A.account)).toBeNull();
    expect(screen.queryByText('PERSON A')).toBeNull();
    expect(screen.getByTestId('payout-loading')).toBeTruthy();

    await act(async () => releaseB());
    await waitFor(() => expect(screen.getByDisplayValue(people.B.account)).toBeTruthy());
    expect(screen.queryByDisplayValue(people.A.account)).toBeNull();
  });
});
