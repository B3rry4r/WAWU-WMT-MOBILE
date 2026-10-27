/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Your points and Convert to cash (POINTS-05) on the real Expo Router stack: PT5 and PT6 as their real route files, and the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the
 * Hub's shapes with figures that are not the board's (a rate of 1,000 points for ₦400, a minimum of 500), so a screen that drew the
 * board's words or numbers fails. It signs each quote with a new token, records every conversion's headers and body, answers a key
 * it knows with the first conversion, and can answer as the Hub does when the PIN is wrong, the answer is lost, the cash moved, the
 * bank has not decided, or the person is billed in dollars.
 */
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

type Mode = 'ok' | 'pending' | 'lost' | 'changed' | 'failed';

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const LATER = '2030-11-14T10:00:00.000Z';
const SOONER = '2030-02-03T10:00:00.000Z';
const hub = {
  mode: 'ok' as Mode,
  balance: 2350,
  /** Earned and bonus points: the part of the balance that can be turned into cash (bought points never can). */
  cashable: null as number | null,
  rateKobo: 40_000,
  minimum: 500,
  dollars: false,
  noWallet: false,
  wrongFirst: false,
  pointsError: false,
  pointsEmpty: false,
  pollsLeftPending: 0,
  quoteCount: 0,
  quotesAsked: [] as (string | null)[],
  converts: [] as { pin: string | null; key: string | null; body: { points: number; quoteToken: string } }[],
  created: {} as Record<string, Made>,
  lastToken: '',
  rateAfterChange: 45_000,
};

function figures(points: number) {
  const rate = hub.rateKobo;
  let blockedBy: string | null = null;
  if (points < hub.minimum) blockedBy = 'below_minimum';
  else if (points > hub.balance) blockedBy = 'insufficient_points';
  else if (points > (hub.cashable ?? hub.balance)) blockedBy = 'not_cashable';
  return {
    currency: 'NGN',
    balancePoints: hub.balance,
    cashablePoints: hub.cashable ?? hub.balance,
    minimumPoints: hub.minimum,
    maximumPoints: null,
    rate: { points: 1000, kobo: rate },
    points,
    cashKobo: Math.floor((points * rate) / 1000),
    feeKobo: 0,
    wawuPaysProviderCharge: true,
    canConvert: blockedBy === null,
    blockedBy,
  };
}
function quote(points: number) {
  hub.quoteCount += 1;
  hub.lastToken = `token-${hub.quoteCount}`;
  return { ...figures(points), quoteToken: hub.lastToken, expiresAt: '2030-01-01T00:00:00.000Z' };
}
type Made = { id: string; status: string; points: number; [field: string]: unknown };
function conversion(id: string, status: 'pending' | 'completed' | 'failed', points: number): Made {
  return {
    id,
    status,
    currency: 'NGN',
    points,
    cashKobo: Math.floor((points * hub.rateKobo) / 1000),
    reference: `ref-${id}`,
    statusMessage: status === 'pending' ? "We're still confirming this. Your points are on hold." : null,
    failureReason: status === 'failed' ? 'The payment did not go through, so your points were given back.' : null,
    createdAt: '2026-10-16T09:42:00.000Z',
    completedAt: status === 'completed' ? '2026-10-16T09:42:05.000Z' : null,
  };
}
const myPoints = () => ({
  balance: hub.balance,
  cashablePoints: hub.cashable ?? hub.balance,
  nextExpiry: hub.pointsEmpty ? null : { points: 700, expiresAt: SOONER },
  lots: hub.pointsEmpty
    ? []
    : [
        { id: 'l1', points: 700, granted: 900, source: 'pack', label: 'Bought points', expiresAt: SOONER },
        { id: 'l2', points: 1650, granted: 1650, source: 'tier_bonus', label: 'Tier bonus', expiresAt: LATER },
      ],
  lotCount: hub.pointsEmpty ? 0 : 2,
  movements: hub.pointsEmpty
    ? []
    : [
        { id: 'm1', points: -300, label: 'Spent on Studio audio', reason: 'hold', pending: false, createdAt: new Date().toISOString() },
        { id: 'm2', points: 900, label: 'Bought points', reason: 'grant', pending: false, createdAt: '2026-09-02T08:00:00.000Z' },
        { id: 'm3', points: -120, label: 'Held for a caption job', reason: 'hold', pending: true, createdAt: new Date().toISOString() },
      ],
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  if (path === '/me/points') return hub.pointsError ? refuse(403, { code: 'forbidden', message: 'Something went wrong. Try again.' }) : ok(myPoints());
  if (path === '/points/convert/quote') {
    hub.quotesAsked.push(url.searchParams.get('points'));
    if (hub.dollars) return refuse(409, { code: 'currency_not_supported', message: 'Points cannot be converted to cash in dollars yet.' });
    if (hub.noWallet) return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    const asked = url.searchParams.get('points');
    return ok(quote(asked === null ? (hub.cashable ?? hub.balance) : Number(asked)));
  }
  if (path === '/points/convert' && request.method === 'POST') {
    const body = (await request.json()) as { points: number; quoteToken: string };
    const key = request.headers.get('idempotency-key');
    hub.converts.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    if (key && hub.created[key]) return json(201, { statusCode: 201, message: 'Created', data: hub.created[key] });
    if (hub.wrongFirst && hub.converts.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'changed') {
      hub.mode = 'ok';
      hub.rateKobo = hub.rateAfterChange;
      return refuse(409, { code: 'quote_changed', message: 'The cash for your points has changed since you saw it. Check the new amount and try again.', pointsQuote: quote(body.points) });
    }
    const made = conversion(`c${Object.keys(hub.created).length + 1}`, hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'completed', body.points);
    if (key) hub.created[key] = made;
    if (hub.mode === 'lost') {
      hub.mode = 'ok';
      throw new TypeError('Network request failed');
    }
    return json(201, { statusCode: 201, message: 'Created', data: made });
  }
  const read = /^\/points\/convert\/([^/]+)$/.exec(path);
  if (read) {
    const found = Object.values(hub.created).find((c) => c.id === read[1]);
    if (!found) return refuse(404, { code: 'not_found', message: 'Not found.' });
    if (found.status === 'pending' && hub.pollsLeftPending <= 0) return ok(conversion(found.id, 'completed', found.points));
    hub.pollsLeftPending -= 1;
    return ok(found);
  }
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
      </View>
    );
  }
  return Stub;
};
const page = (module: string): ComponentType => (require(module) as { default: ComponentType }).default;

let routes: Record<string, ComponentType>;

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    wallet: stub('Wallet tab'),
    welcome: stub('Welcome'),
    send: stub('Send'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    points: page('@/app/points'),
    'points-convert': page('@/app/points-convert'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, {
    mode: 'ok',
    balance: 2350,
    cashable: null,
    rateKobo: 40_000,
    minimum: 500,
    dollars: false,
    noWallet: false,
    wrongFirst: false,
    pointsError: false,
    pointsEmpty: false,
    pollsLeftPending: 0,
    quoteCount: 0,
    quotesAsked: [],
    converts: [],
    created: {},
    lastToken: '',
  });
  try {
    (require('../intent') as { forgetIntentInMemory: () => void }).forgetIntentInMemory();
  } catch {
    // The intent store does not exist on the build under test.
  }
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f5'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

/** The router test library fakes the clock once it has rendered: time passes by being moved on. */
const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
/** Types the points, lets the person pause, and waits for the Hub's answer for them to be on screen (`says`). */
const typePoints = async (text: string, says: string) => {
  await fireEvent.changeText(await screen.findByTestId('convert-points'), text);
  await sleep(500);
  await screen.findByText(says);
};

/** PT6 with the whole balance quoted. */
async function toConvert() {
  await renderRouter(routes, { initialUrl: '/points-convert' });
  await screen.findByTestId('convert-screen');
  await screen.findByText(/^You get ₦/);
}

describe('PT5 · your points', () => {
  it('a person whose points are all bought has no Convert button and is told why; with cashable points the button is there', async () => {
    hub.cashable = 0;
    await renderRouter(routes, { initialUrl: '/points' });
    await screen.findByTestId('points-lots');
    expect(screen.queryByTestId('points-convert')).toBeNull();
    expect(screen.getByTestId('points-bought-note')).toHaveTextContent("Points you bought can't be turned into cash.");
  });

  it('a person with cashable points sees the Convert button and no note', async () => {
    await renderRouter(routes, { initialUrl: '/points' });
    await screen.findByTestId('points-lots');
    expect(screen.getByTestId('points-convert')).toBeTruthy();
    expect(screen.queryByTestId('points-bought-note')).toBeNull();
  });

  it('a user sees their balance, when each lot ends (the soonest marked) and the last movements in the Hub\'s words', async () => {
    await renderRouter(routes, { initialUrl: '/points' });
    await screen.findByTestId('points-lots');
    expect(screen.getByTestId('points-balance')).toHaveTextContent('2,350', { exact: false });
    const lots = screen.getAllByTestId('points-lot');
    expect(lots).toHaveLength(2);
    expect(lots[0]).toHaveTextContent('700', { exact: false });
    expect(lots[0]).toHaveTextContent('ends 3 Feb 2030', { exact: false });
    expect(lots[1]).toHaveTextContent('1,650', { exact: false });
    expect(lots[1]).toHaveTextContent('ends 14 Nov 2030', { exact: false });
    expect(screen.getByText('The soonest-ending points are spent first, then the ones you bought.')).toBeTruthy();
    const moves = screen.getAllByTestId('points-movement');
    expect(moves).toHaveLength(3);
    expect(moves[0]).toHaveTextContent('Spent on Studio audio', { exact: false });
    expect(moves[0]).toHaveTextContent('today', { exact: false });
    expect(moves[0]).toHaveTextContent('−300', { exact: false });
    expect(moves[1]).toHaveTextContent('+900', { exact: false });
    expect(moves[1]).toHaveTextContent('2 Sep', { exact: false });
    expect(moves[2]).toHaveTextContent('Pending · today', { exact: false });
    expect(screen.getByText('Last 3')).toBeTruthy();
    // Points are a count: nothing here is a naira value. Buy points is the secondary pill beside the balance (POINTS-06).
    expect(screen.queryByText(/₦/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Buy points' })).toBeTruthy();
    expect(screen.queryByText(/Example values/)).toBeNull();
  });

  it('a user with no points yet sees the empty view, not the lots or the movements (PT5a)', async () => {
    hub.pointsEmpty = true;
    hub.balance = 0;
    await renderRouter(routes, { initialUrl: '/points' });
    await screen.findByTestId('points-empty');
    expect(screen.getByText('No points yet')).toBeTruthy();
    // Buying is built (POINTS-06): PT5a says "Buy a pack, or" first, and Buy points is the button beside the balance.
    expect(screen.getByText('Buy a pack, or get them with a tier or by inviting people.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Buy points' })).toBeTruthy();
    expect(screen.getByTestId('points-balance')).toHaveTextContent('0', { exact: false });
    expect(screen.queryByTestId('points-lots')).toBeNull();
    expect(screen.queryByTestId('points-movements')).toBeNull();
  });

  it('a read that fails is the error view, and Try again reads it again', async () => {
    hub.pointsError = true;
    await renderRouter(routes, { initialUrl: '/points' });
    await screen.findByTestId('points-error');
    hub.pointsError = false;
    await fireEvent.press(screen.getByRole('button', { name: /Try again/ }));
    await screen.findByTestId('points-lots');
  });

  it('the round button on the bar opens Convert to cash; Back returns', async () => {
    await renderRouter(routes, { initialUrl: '/points' });
    await screen.findByTestId('points-lots');
    await press('Convert to cash');
    await screen.findByTestId('convert-screen');
    expect(pathname()).toBe('/points-convert');
    await press('Back');
    await waitFor(() => expect(pathname()).toBe('/points'));
  });
});

describe('PT6 · convert to cash', () => {
  it('bought points are not offered: the card and the field show only the cashable points, and the note is said once', async () => {
    hub.cashable = 1000;
    await toConvert();
    expect(screen.getByTestId('convert-points').props.value).toBe('1,000');
    expect(screen.getByTestId('convert-balance')).toHaveTextContent('1,000', { exact: false });
    expect(screen.getByTestId('convert-balance')).not.toHaveTextContent('2,350', { exact: false });
    expect(screen.getAllByText("Points you bought can't be turned into cash.")).toHaveLength(1);
    await typePoints('1200', 'You can convert 1,000 points.');
    expect(hub.converts).toHaveLength(0);
  });

  it('a person with no bought points sees no note', async () => {
    await toConvert();
    expect(screen.queryByText("Points you bought can't be turned into cash.")).toBeNull();
  });

  it('a user opens Convert to cash and sees the whole balance quoted at the Hub\'s rate, with no line the Hub gives no figure for', async () => {
    await toConvert();
    expect(pathname()).toBe('/points-convert');
    expect(screen.getByTestId('convert-points').props.value).toBe('2,350');
    expect(screen.getByTestId('convert-points-message')).toHaveTextContent('You get ₦940', { exact: false });
    expect(screen.getByTestId('convert-figures')).toHaveTextContent('1,000 points = ₦400', { exact: false });
    expect(screen.getByTestId('convert-balance')).toHaveTextContent('2,350', { exact: false });
    expect(screen.queryByText(/go further than cash/)).toBeNull();
    expect(screen.queryByText(/Example values/)).toBeNull();
    // PT6 draws Buy beside the balance (POINTS-06).
    expect(screen.getByRole('button', { name: 'Buy' })).toBeTruthy();
    // The first quote asks for no points: the Hub quotes the whole balance.
    expect(hub.quotesAsked[0]).toBeNull();
  });

  it('a user converts 1,000 points: the quote shows the cash first, a fresh quote opens the PIN sheet, and the wallet gets it once', async () => {
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    const shownToken = hub.lastToken;
    await press('Convert');
    await screen.findByText('₦400 for converting 1,000 points to cash');
    // A new quote was asked for the attempt, and the conversion carries that token, not the one first shown.
    expect(hub.lastToken).not.toBe(shownToken);
    const attemptToken = hub.lastToken;
    await tap('1234');
    await screen.findByTestId('convert-result');
    expect(screen.getByText('₦400 added to your wallet')).toBeTruthy();
    expect(screen.getByText('1,000 points converted')).toBeTruthy();
    expect(hub.converts).toHaveLength(1);
    expect(hub.converts[0].pin).toBe('1234');
    expect(hub.converts[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(hub.converts[0].body).toEqual({ points: 1000, quoteToken: attemptToken });
    await press('Done');
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a user below the minimum is told the Hub\'s minimum and Convert stays off (PT6a)', async () => {
    await toConvert();
    await typePoints('300', 'The minimum is 500 points.');
    expect(screen.getByTestId('convert-figures')).toHaveTextContent('₦0', { exact: false });
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled();
    expect(hub.converts).toHaveLength(0);
  });

  // SWEEP-APP-3 row 123: zero, an emptied field and a count past what the Hub reads left Convert off with nothing said.
  it('a field with nothing, zero or too many points says why Convert is off, and a count the Hub can quote clears the line', async () => {
    await toConvert();
    const asked = hub.quotesAsked.length;
    await typePoints('', 'Type the points to convert.');
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled();
    await typePoints('0', 'The minimum is 500 points.');
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled();
    await typePoints('99999999999', 'That is more than one conversion can carry.');
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled();
    // None of the three was asked of the Hub.
    expect(hub.quotesAsked).toHaveLength(asked);
    await typePoints('1000', 'You get ₦400');
    expect(screen.queryByText('That is more than one conversion can carry.')).toBeNull();
    expect(hub.converts).toHaveLength(0);
  });

  // SWEEP-APP-3 row 124: the points ended between the look and the tap; the field said what is left but nothing said the balance moved.
  it('when the points end between the look and the tap, the field says what is left and a notice says the balance changed', async () => {
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    hub.balance = 300;
    await press('Convert');
    expect(await screen.findByText('Your points changed while you looked. Check your balance before you convert.')).toBeTruthy();
    expect(await screen.findByText('You have 300 points.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Convert' })).toBeDisabled();
    expect(hub.converts).toHaveLength(0);
  });

  it('a user with more than their balance is told what they have, and a wrong PIN then the right one sends the same key and converts once', async () => {
    hub.wrongFirst = true;
    await toConvert();
    await typePoints('9000', 'You have 2,350 points.');
    await typePoints('1000', 'You get ₦400');
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    await tap('9999');
    await screen.findByText(/4 tries left/);
    await tap('1234');
    await screen.findByTestId('convert-result');
    expect(hub.converts.map((c) => c.pin)).toEqual(['9999', '1234']);
    expect(hub.converts[0].key).toBe(hub.converts[1].key);
    expect(hub.converts[0].body).toEqual(hub.converts[1].body);
    expect(Object.keys(hub.created)).toHaveLength(1);
  });

  it('a conversion whose answer is lost is sent again as it was, never as a new one: the Hub converts once (V8)', async () => {
    hub.mode = 'lost';
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    await tap('1234');
    // The request got no answer: the sheet asks again and the same request goes with the next PIN.
    await waitFor(() => expect(hub.converts).toHaveLength(1));
    await tap('1234');
    await screen.findByTestId('convert-result');
    expect(hub.converts).toHaveLength(2);
    expect(hub.converts[1].key).toBe(hub.converts[0].key);
    expect(hub.converts[1].body).toEqual(hub.converts[0].body);
    expect(Object.keys(hub.created)).toHaveLength(1);
    // Only one quote was asked for the attempt: the retry did not ask for another.
    expect(hub.quoteCount).toBe(3);
  });

  it('a conversion with no answer survives the app being closed: the next visit sends the same request, and the Hub converts once', async () => {
    hub.mode = 'lost';
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    await tap('1234');
    await waitFor(() => expect(hub.converts).toHaveLength(1));
    // The app is closed and opened again: what the phone wrote stays, what the run held in memory does not.
    screen.unmount();
    (require('../intent') as { forgetIntentInMemory: () => void }).forgetIntentInMemory();
    await queryClient.cancelQueries();
    queryClient.clear();
    session.resetSessionForTests();
    await renderRouter(routes, { initialUrl: '/points-convert' });
    await screen.findByTestId('convert-resend');
    expect(screen.getByTestId('convert-points').props.value).toBe('1,000');
    const quotesBefore = hub.quoteCount;
    await screen.findByText(/^You get ₦/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Convert' })).toBeEnabled());
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    // The same request goes again: no new quote was asked for the attempt.
    expect(hub.quoteCount).toBe(quotesBefore);
    await tap('1234');
    await screen.findByTestId('convert-result');
    expect(hub.converts).toHaveLength(2);
    expect(hub.converts[1].key).toBe(hub.converts[0].key);
    expect(hub.converts[1].body).toEqual(hub.converts[0].body);
    expect(Object.keys(hub.created)).toHaveLength(1);
  });

  it('when the cash changed while the person looked, the new quote is shown and the next attempt is a new one (409 quote_changed)', async () => {
    hub.mode = 'changed';
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    await tap('1234');
    await screen.findByText(/The cash for your points has changed/);
    await waitFor(() => expect(screen.getByTestId('convert-points-message')).toHaveTextContent('You get ₦450', { exact: false }));
    expect(screen.queryByTestId('convert-result')).toBeNull();
    expect(Object.keys(hub.created)).toHaveLength(0);
    // The next Convert is a new attempt: a new key, and the token of the quote the Hub gave.
    await press('Convert');
    await screen.findByText(/^₦450 for converting/);
    await tap('1234');
    await screen.findByTestId('convert-result');
    expect(hub.converts).toHaveLength(2);
    expect(hub.converts[1].key).not.toBe(hub.converts[0].key);
    expect(hub.converts[1].body.quoteToken).not.toBe(hub.converts[0].body.quoteToken);
    expect(screen.getByText('₦450 added to your wallet')).toBeTruthy();
  });

  it('a conversion the bank has not confirmed says so in the Hub\'s words, is read by its id, and is never sent again', async () => {
    hub.mode = 'pending';
    hub.pollsLeftPending = 1;
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    await tap('1234');
    await screen.findByTestId('convert-pending');
    expect(screen.getByText('Still confirming')).toBeTruthy();
    expect(screen.getByText("We're still confirming this. Your points are on hold.")).toBeTruthy();
    await sleep(4000);
    await sleep(4000);
    await screen.findByTestId('convert-result');
    expect(screen.getByText('₦400 added to your wallet')).toBeTruthy();
    expect(hub.converts).toHaveLength(1);
  });

  it('a conversion the bank turned down says why in the Hub\'s words and the person can try again with a fresh quote', async () => {
    hub.mode = 'failed';
    await toConvert();
    await typePoints('1000', 'You get ₦400');
    await press('Convert');
    await screen.findByText(/^₦400 for converting/);
    await tap('1234');
    await screen.findByTestId('convert-failed');
    expect(screen.getByText('The payment did not go through, so your points were given back.')).toBeTruthy();
    expect(screen.queryByTestId('convert-result')).toBeNull();
  });

  it('a person billed in dollars is told why in plain words and is given no Convert button (G-741)', async () => {
    hub.dollars = true;
    await renderRouter(routes, { initialUrl: '/points-convert' });
    await screen.findByTestId('convert-unavailable');
    expect(screen.getByText('Points cannot be converted to cash in dollars yet.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Convert' })).toBeNull();
    expect(screen.queryByTestId('convert-points')).toBeNull();
  });

  it('a person with no wallet is offered Open your wallet, not a form', async () => {
    hub.noWallet = true;
    await renderRouter(routes, { initialUrl: '/points-convert' });
    await screen.findByTestId('convert-no-wallet');
    await press('Open your wallet');
    await waitFor(() => expect(pathname()).toBe('/open-wallet'));
  });
});
