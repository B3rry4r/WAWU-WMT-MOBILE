/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
type Sent = { method: string; path: string; body: unknown; query?: string };
let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined, ...(url.search ? { query: url.search } : {}) });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, message: string, extra: object = {}): Answer => ({ status, body: { statusCode: status, message, data: null, ...extra } });

const SETTINGS = '/api/hub/paid-dm/settings';
const EARN = '/api/hub/paid-dm/settings/earn';
const PRICES = '/api/hub/prices';
const LIST = [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10_000];
const prices = (list: readonly number[] = LIST): Answer => ok({ prices: list.map((n) => ({ priceNaira: n, priceKobo: n * 100 })), tips: [{ priceNaira: 200, priceKobo: 20_000 }] });

const standing = (over: Record<string, unknown> = {}) => ({
  state: 'ok',
  acceptingPaidMessages: true,
  unansweredPct: 4,
  unanswered: 1,
  questions: 25,
  warnAtPct: 20,
  pauseAtPct: 30,
  windowDays: 30,
  pauseDays: 7,
  pausedUntil: null,
  ...over,
});
const settings = (over: Record<string, unknown> = {}) => ({
  enabled: true,
  priceKobo: 150_000,
  responseHours: 24,
  creatorSharePct: 85,
  earnPerMessageKobo: 127_500,
  raiseToKobo: 250_000,
  options: { minPriceKobo: 5_000, maxPriceKobo: 1_000_000_000, pricePresets: [{ priceKobo: 10_000 }, { priceKobo: 50_000 }, { priceKobo: 100_000 }, { priceKobo: 250_000 }], responseWindowHours: [24, 48, 72, 168] },
  standing: standing(),
  ...over,
});
const warned = () => settings({ standing: standing({ state: 'warning', unansweredPct: 22.22, unanswered: 4, questions: 18 }) });
const locked = () =>
  settings({ standing: standing({ state: 'paused', acceptingPaidMessages: false, unansweredPct: 34, unanswered: null, questions: null, pausedUntil: '2026-10-03T09:00:00.000Z' }) });

const { PaidMessagesScreen, NOTICE_MS } = require('../PaidMessagesScreen') as typeof import('../PaidMessagesScreen');

let client: QueryClient;
const onBack = jest.fn();

function open() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <PaidMessagesScreen onBack={onBack} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

/** The price now on the strip, in naira. */
const chosen = () => screen.getAllByTestId(/^price-stop-\d+$/).filter((n) => n.props.accessibilityState?.selected).map((n) => Number(String(n.props.testID).replace('price-stop-', '')));
/** A user picks a list price from the strip, once the list has loaded. */
const pick = async (naira: number) => fireEvent.press(await screen.findByTestId(`price-stop-${naira}`));
const saveButton = () => screen.getByTestId('paid-save');
const isDisabled = (node: { props: { accessibilityState?: { disabled?: boolean }; disabled?: boolean } }) => Boolean(node.props.accessibilityState?.disabled ?? node.props.disabled);
const puts = () => sent.filter((s) => s.method === 'PUT');
const earnLine = () => screen.getByTestId('paid-price-earn').props.accessibilityLabel as string;

beforeEach(() => {
  answers = { [`GET ${PRICES}`]: prices() };
  sent = [];
  onBack.mockClear();
});
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  cleanup();
  client?.clear();
});

describe('Paid messages (I21)', () => {
  it('a user sees the switch with the price on the strip, the reply times the Hub offers, and what they earn (85%)', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    expect(await screen.findByText('Take paid messages')).toBeTruthy();
    expect(screen.getByText('On · ₦1,500 a message')).toBeTruthy();
    expect(await screen.findByTestId('price-stop-1500')).toBeTruthy();
    expect(chosen()).toEqual([1500]);
    expect(screen.getByText('Price per question')).toBeTruthy();
    expect(earnLine()).toBe('You earn 1,275 naira when you answer');
    // Nothing is typed, and the old presets and the Hub's own earn rows are gone.
    expect(screen.queryByPlaceholderText('₦0')).toBeNull();
    expect(screen.queryByTestId('paid-preset-100000')).toBeNull();
    expect(screen.queryByTestId('paid-share')).toBeNull();
    expect(screen.getByRole('tab', { name: '24 hours' }).props.accessibilityState.selected).toBe(true);
    for (const label of ['2 days', '3 days', '1 week']) expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    expect(screen.getByText('Unanswered, last 30 days')).toBeTruthy();
    expect(screen.getByTestId('paid-unanswered').props.children).toBe('4%');
    expect(screen.queryByTestId('paid-warning')).toBeNull();
    expect(screen.queryByTestId('paid-locked')).toBeNull();
  });

  it('shows only the reply times the Hub sends, and the strip holds the Hub\'s list', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ options: { minPriceKobo: 5_000, maxPriceKobo: 1_000_000_000, pricePresets: [], responseWindowHours: [12, 36] } }));
    answers[`GET ${PRICES}`] = prices([500, 1500, 3000]);
    await open();
    await screen.findByText('Take paid messages');
    expect(screen.getByRole('tab', { name: '12 hours' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '36 hours' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: '1 week' })).toBeNull();
    await screen.findByTestId('price-stop-3000');
    expect(screen.getAllByTestId(/^price-stop-\d+$/)).toHaveLength(3);
  });

  it('a user can pick a price from the strip or a popular one, and see what they would earn, with no earn read to the Hub', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    await screen.findByText('Take paid messages');
    await pick(2000);
    expect(screen.getByText('On · ₦2,000 a message')).toBeTruthy();
    expect(earnLine()).toBe('You earn 1,700 naira when you answer');
    await fireEvent.press(screen.getByTestId('price-popular-5000'));
    expect(screen.getByText('On · ₦5,000 a message')).toBeTruthy();
    expect(chosen()).toEqual([5000]);
    expect(earnLine()).toBe('You earn 4,250 naira when you answer');
    expect(sent.some((s) => s.path === EARN)).toBe(false);
  });

  it('INBOX-12 finding 4: a reply time saved off the list (36 hours, set on the web) shows as a selected tab among the offered ones', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ responseHours: 36 }));
    await open();
    expect(await screen.findByText('Take paid messages')).toBeTruthy();
    const labels = ['24 hours', '36 hours', '2 days', '3 days', '1 week'];
    for (const label of labels) expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '36 hours' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: '24 hours' }).props.accessibilityState.selected).toBe(false);
  });

  it('SWEEP-INBOX W4b L1: the saved off-list reply time (36 hours) stays a tab after another is tapped, so the person can go back to it', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ responseHours: 36 }));
    await open();
    expect(await screen.findByText('Take paid messages')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: '2 days' }));
    expect(screen.getByRole('tab', { name: '2 days' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: '36 hours' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: '36 hours' }));
    expect(screen.getByRole('tab', { name: '36 hours' }).props.accessibilityState.selected).toBe(true);
  });

  it('names each stop on the strip by its price', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    await screen.findByText('Take paid messages');
    expect(await screen.findByLabelText('₦500')).toBeTruthy();
    expect(screen.getByLabelText('₦2,500')).toBeTruthy();
  });

  it('a user can switch off, pick a reply time and save, and the Hub gets exactly that in kobo', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`PUT ${SETTINGS}`] = ok(settings({ enabled: false, priceKobo: 200_000, responseHours: 72 }));
    await open();
    await screen.findByText('Take paid messages');
    await pick(2000);
    await fireEvent.press(screen.getByRole('tab', { name: '3 days' }));
    await fireEvent.press(screen.getByTestId('paid-switch'));
    expect(screen.getByText('Off')).toBeTruthy();
    await fireEvent.press(saveButton());
    expect(await screen.findByText('Saved')).toBeTruthy();
    expect(puts()).toEqual([{ method: 'PUT', path: SETTINGS, body: { enabled: false, priceKobo: 200_000, responseHours: 72 } }]);
    expect(screen.getByText('Off')).toBeTruthy();
    // The notice leaves by itself.
    await waitFor(() => expect(screen.queryByText('Saved')).toBeNull(), { timeout: NOTICE_MS + 1500 });
  });

  it('a creator who never set anything sees the switch off and no price chosen, and cannot turn on without picking one', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ enabled: false, priceKobo: null, earnPerMessageKobo: null, raiseToKobo: null }));
    answers[`PUT ${SETTINGS}`] = ok(settings({ enabled: true, priceKobo: 250_000 }));
    await open();
    await screen.findByText('Take paid messages');
    expect(screen.getByText('Off')).toBeTruthy();
    await screen.findByTestId('price-stop-2500');
    expect(chosen()).toEqual([]);
    await fireEvent.press(screen.getByTestId('paid-switch'));
    expect(screen.getByText('On')).toBeTruthy();
    expect(isDisabled(saveButton())).toBe(true);
    await pick(2500);
    expect(screen.getByText('On · ₦2,500 a message')).toBeTruthy();
    expect(isDisabled(saveButton())).toBe(false);
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 250_000, responseHours: 24 });
  });

  it('a saved price off the list keeps Save off while only the reply time changes, so no off-list price is sent', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ priceKobo: 120_000 }));
    answers[`PUT ${SETTINGS}`] = ok(settings({ priceKobo: 100_000, responseHours: 72 }));
    await open();
    await screen.findByText('Take paid messages');
    await screen.findByTestId('price-stop-1000');
    expect(screen.getByText('Pick a price from the list.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: '3 days' }));
    expect(isDisabled(saveButton())).toBe(true);
    await fireEvent.press(saveButton());
    expect(puts()).toHaveLength(0);
    // Picking a list price turns Save on, and that price is what is sent.
    await pick(1000);
    expect(isDisabled(saveButton())).toBe(false);
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 100_000, responseHours: 72 });
  });

  it('a creator with an old off-list price can still switch paid messages off: Save sends enabled false and no price', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ priceKobo: 120_000 }));
    answers[`PUT ${SETTINGS}`] = ok(settings({ enabled: false, priceKobo: 120_000 }));
    await open();
    await screen.findByText('Take paid messages');
    await screen.findByTestId('price-stop-1000');
    expect(screen.getByText('Pick a price from the list.')).toBeTruthy();
    expect(isDisabled(saveButton())).toBe(true);
    await fireEvent.press(screen.getByTestId('paid-switch'));
    expect(screen.getByText('Off')).toBeTruthy();
    expect(isDisabled(saveButton())).toBe(false);
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    // The Hub keeps the saved price when none is sent, and does not judge a price it is not sent.
    expect(puts()[0].body).toEqual({ enabled: false, responseHours: 24 });
  });

  it('with the switch off, a list price the person picked is still saved', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ priceKobo: 120_000 }));
    answers[`PUT ${SETTINGS}`] = ok(settings({ enabled: false, priceKobo: 200_000 }));
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.press(screen.getByTestId('paid-switch'));
    await pick(2000);
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: false, priceKobo: 200_000, responseHours: 24 });
  });

  it('an unchanged price that is on the list is sent as before, and Save waits for the list to load', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`GET ${PRICES}`] = 'offline';
    answers[`PUT ${SETTINGS}`] = ok(settings({ responseHours: 72 }));
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.press(screen.getByRole('tab', { name: '3 days' }));
    // The list is not known, so nothing proves 1,500 is on it: Save stays off.
    expect(isDisabled(saveButton())).toBe(true);
    answers[`GET ${PRICES}`] = prices();
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['prices'] });
    });
    await waitFor(() => expect(isDisabled(saveButton())).toBe(false));
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 150_000, responseHours: 72 });
  });

  it('a price under the lowest the Hub allows is named and cannot be saved', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ options: { minPriceKobo: 150_000, maxPriceKobo: 1_000_000_000, pricePresets: [], responseWindowHours: [24, 48, 72, 168] } }));
    await open();
    await screen.findByText('Take paid messages');
    await pick(1000);
    expect(screen.getByTestId('paid-price-problem').props.children).toBe('The lowest price is ₦1,500.');
    expect(isDisabled(saveButton())).toBe(true);
    await pick(1500);
    expect(screen.queryByTestId('paid-price-problem')).toBeNull();
    expect(isDisabled(saveButton())).toBe(false);
  });

  it('a refused save says why and keeps the price picked', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`PUT ${SETTINGS}`] = refusal(400, 'Pick one of the reply times on offer.');
    await open();
    await screen.findByText('Take paid messages');
    await pick(2000);
    await fireEvent.press(saveButton());
    expect(await screen.findByText('Pick one of the reply times on offer.')).toBeTruthy();
    expect(chosen()).toEqual([2000]);
  });

  it('a 400 price_not_on_list (an admin changed the list meanwhile) reads the list again and shows the Hub\'s sentence', async () => {
    const sentence = 'That price is not on the price list. The nearest are ₦1,500 and ₦2,000.';
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`PUT ${SETTINGS}`] = refusal(400, sentence, { reason: { code: 'price_not_on_list', message: sentence, nearestLowerNaira: 1500, nearestHigherNaira: 2000 } });
    await open();
    await screen.findByText('Take paid messages');
    await pick(3000);
    const reads = () => sent.filter((s) => s.method === 'GET' && s.path === PRICES).length;
    const before = reads();
    await fireEvent.press(saveButton());
    expect(await screen.findByText(sentence)).toBeTruthy();
    await waitFor(() => expect(reads()).toBeGreaterThan(before));
  });

  it('a saved price that is off the list shows the nearest list price selected and says to pick one, and sends no off-list price', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ priceKobo: 120_000 }));
    answers[`PUT ${SETTINGS}`] = ok(settings({ priceKobo: 100_000 }));
    await open();
    await screen.findByText('Take paid messages');
    await screen.findByTestId('price-stop-1000');
    expect(chosen()).toEqual([1000]);
    expect(screen.getByText('Pick a price from the list.')).toBeTruthy();
    await pick(1000);
    expect(screen.queryByText('Pick a price from the list.')).toBeNull();
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 100_000, responseHours: 24 });
  });
});

describe('Paid messages, warned (I22)', () => {
  it('a user sees how many they missed, the Hub\'s line, a price to raise to, and the share in warning colour', async () => {
    answers[`GET ${SETTINGS}`] = ok(warned());
    await open();
    expect(await screen.findByText('You missed 4 of your last 18')).toBeTruthy();
    expect(screen.getByText('Past 30% and paid messages switch off for 7 days. Raise your price for fewer, more serious questions.')).toBeTruthy();
    expect(await screen.findByText('Raise to ₦2,500')).toBeTruthy();
    expect(screen.getByTestId('paid-unanswered').props.children).toBe('22%');
    expect(isDisabled(saveButton())).toBe(false);
  });

  it('a user can raise the price and save it', async () => {
    answers[`GET ${SETTINGS}`] = ok(warned());
    answers[`PUT ${SETTINGS}`] = ok({ ...warned(), priceKobo: 250_000, raiseToKobo: null });
    await open();
    await fireEvent.press(await screen.findByTestId('paid-raise'));
    expect(chosen()).toEqual([2500]);
    expect(earnLine()).toBe('You earn 2,125 naira when you answer');
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 250_000, responseHours: 24 });
    // The Hub now has nothing higher to offer: the button and the sentence about it go.
    await waitFor(() => expect(screen.queryByTestId('paid-raise')).toBeNull());
    expect(screen.getByText('Past 30% and paid messages switch off for 7 days.')).toBeTruthy();
  });

  it('lifts a raise to the lowest list price at or above the Hub\'s figure, so no price off the list is sent', async () => {
    answers[`GET ${SETTINGS}`] = ok({ ...warned(), raiseToKobo: 220_000 });
    answers[`PUT ${SETTINGS}`] = ok({ ...warned(), priceKobo: 250_000, raiseToKobo: null });
    await open();
    expect(await screen.findByText('Raise to ₦2,500')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('paid-raise'));
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 250_000, responseHours: 24 });
  });

  it('draws no Raise button when the Hub has no higher price to offer', async () => {
    answers[`GET ${SETTINGS}`] = ok({ ...warned(), raiseToKobo: null });
    await open();
    await screen.findByText('You missed 4 of your last 18');
    expect(screen.queryByTestId('paid-raise')).toBeNull();
    expect(screen.queryByText(/Raise your price/)).toBeNull();
  });
});

describe('Paid messages, off for 7 days (I23)', () => {
  it('a user sees the lock with the day it ends, the switch off and locked, and no shop', async () => {
    answers[`GET ${SETTINGS}`] = ok(locked());
    await open();
    expect(await screen.findByText('Paid messages are off for 7 days')).toBeTruthy();
    expect(screen.getByText('Back on 3 October. Publishing, communities and tips all keep working.')).toBeTruthy();
    expect(screen.getByText('Locked until 3 October')).toBeTruthy();
    expect(screen.queryByText(/shop/i)).toBeNull();
    expect(screen.getByTestId('paid-unanswered').props.children).toBe('34%');
  });

  it('nothing can be changed or saved while it is locked', async () => {
    answers[`GET ${SETTINGS}`] = ok(locked());
    await open();
    await screen.findByText('Paid messages are off for 7 days');
    expect(isDisabled(screen.getByTestId('paid-switch'))).toBe(true);
    expect(isDisabled(await screen.findByTestId('price-stop-5000'))).toBe(true);
    expect(isDisabled(screen.getByTestId('price-popular-1000'))).toBe(true);
    await fireEvent.press(screen.getByTestId('paid-switch'));
    await fireEvent.press(screen.getByTestId('price-stop-5000'));
    await fireEvent.press(screen.getByTestId('price-popular-1000'));
    await fireEvent.press(screen.getByRole('tab', { name: '3 days' }));
    expect(screen.getByRole('tab', { name: '24 hours' }).props.accessibilityState.selected).toBe(true);
    expect(chosen()).toEqual([1500]);
    expect(isDisabled(saveButton())).toBe(true);
    await fireEvent.press(saveButton());
    expect(puts()).toHaveLength(0);
  });

  it('when paid messages are switched off while the screen is open, the refusal locks it', async () => {
    answers[`GET ${SETTINGS}`] = [ok(settings()), ok(locked())];
    answers[`PUT ${SETTINGS}`] = refusal(403, 'Paid messages are switched off for now.', {
      reason: { code: 'paid_messages_paused', message: 'Paid messages are switched off for now.', pausedUntil: '2026-10-03T09:00:00.000Z' },
    });
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.press(saveButton());
    expect(await screen.findByText('Paid messages are off for 7 days')).toBeTruthy();
    expect(screen.getByText('Locked until 3 October')).toBeTruthy();
  });
});

describe('Paid messages, loading, failing and not a creator', () => {
  it('shows a loading list while the Hub is read', async () => {
    answers[`GET ${SETTINGS}`] = 'hang';
    await open();
    expect(await screen.findByTestId('paid-loading')).toBeTruthy();
    expect(screen.queryByText('Take paid messages')).toBeNull();
  });

  it('says it could not load, and Try again reads it again', async () => {
    answers[`GET ${SETTINGS}`] = ['offline' as Answer, ok(settings())];
    await open();
    expect(await screen.findByTestId('paid-error')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('Take paid messages')).toBeTruthy();
  });

  it('a plain account is told it needs a creator account', async () => {
    answers[`GET ${SETTINGS}`] = refusal(403, 'This account has no creator state.');
    await open();
    expect(await screen.findByText('This needs a creator account')).toBeTruthy();
    expect(screen.queryByText('Take paid messages')).toBeNull();
  });

  it('Back leaves the screen', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
