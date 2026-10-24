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

const price = () => screen.getByTestId('paid-price');
const saveButton = () => screen.getByTestId('paid-save');
const isDisabled = (node: { props: { accessibilityState?: { disabled?: boolean }; disabled?: boolean } }) => Boolean(node.props.accessibilityState?.disabled ?? node.props.disabled);
const puts = () => sent.filter((s) => s.method === 'PUT');
const earnAsks = () => sent.filter((s) => s.path === EARN).map((s) => s.query);
/** The Hub's answer to the earn read. The figures are the test's own, so a screen that worked them out itself would show another. */
const earnIs = (priceKobo: number, earnPerMessageKobo: number) => ok({ priceKobo, creatorSharePct: 85, earnPerMessageKobo });

beforeEach(() => {
  answers = {};
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
  it('a user sees the switch with the price, the price field, the presets and reply times the Hub offers, and what they earn', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    expect(await screen.findByText('Take paid messages')).toBeTruthy();
    expect(screen.getByText('On · ₦1,500 a message')).toBeTruthy();
    expect(price().props.value).toBe('₦1,500');
    for (const kobo of [10_000, 50_000, 100_000, 250_000]) expect(screen.getByTestId(`paid-preset-${kobo}`)).toBeTruthy();
    expect(screen.getByRole('tab', { name: '24 hours' }).props.accessibilityState.selected).toBe(true);
    for (const label of ['2 days', '3 days', '1 week']) expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    expect(screen.getByLabelText('1,275 naira')).toBeTruthy();
    expect(screen.getByTestId('paid-share').props.children).toBe('85%');
    expect(screen.getByText('Unanswered, last 30 days')).toBeTruthy();
    expect(screen.getByTestId('paid-unanswered').props.children).toBe('4%');
    expect(screen.queryByTestId('paid-warning')).toBeNull();
    expect(screen.queryByTestId('paid-locked')).toBeNull();
  });

  it('shows only what the Hub sends: other presets, other reply times and another share', async () => {
    answers[`GET ${SETTINGS}`] = ok(
      settings({ creatorSharePct: 80, earnPerMessageKobo: 120_000, options: { minPriceKobo: 5_000, maxPriceKobo: 1_000_000_000, pricePresets: [{ priceKobo: 20_000 }, { priceKobo: 30_000 }], responseWindowHours: [12, 36] } }),
    );
    await open();
    await screen.findByText('Take paid messages');
    expect(screen.queryByTestId('paid-preset-10000')).toBeNull();
    expect(screen.getByTestId('paid-preset-20000')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '12 hours' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '36 hours' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: '1 week' })).toBeNull();
    expect(screen.getByLabelText('1,200 naira')).toBeTruthy();
    expect(screen.getByTestId('paid-share').props.children).toBe('80%');
  });

  it('a user can type a price and see what the Hub says they would earn, and pick a preset', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`GET ${EARN}`] = [earnIs(200_000, 199_000), earnIs(50_000, 49_000)];
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '₦2,000');
    expect(price().props.value).toBe('₦2,000');
    expect(screen.getByText('On · ₦2,000 a message')).toBeTruthy();
    // Nothing is shown for the typed price until the Hub has answered for it: the saved price's figure does not stay on.
    expect(screen.queryByTestId('paid-earn')).toBeNull();
    expect(await screen.findByLabelText('1,990 naira')).toBeTruthy();
    expect(earnAsks()).toEqual(['?priceKobo=200000']);
    await fireEvent.press(screen.getByTestId('paid-preset-50000'));
    expect(price().props.value).toBe('₦500');
    expect(screen.getByTestId('paid-preset-50000').props.accessibilityState.selected).toBe(true);
    expect(await screen.findByLabelText('490 naira')).toBeTruthy();
    expect(earnAsks()).toEqual(['?priceKobo=200000', '?priceKobo=50000']);
  });

  it('asks the Hub once when the typing rests, not once per digit', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`GET ${EARN}`] = earnIs(200_000, 199_000);
    await open();
    await screen.findByText('Take paid messages');
    for (const typed of ['2', '20', '200', '2000']) await fireEvent.changeText(price(), typed);
    expect(await screen.findByLabelText('1,990 naira')).toBeTruthy();
    expect(earnAsks()).toEqual(['?priceKobo=200000']);
  });

  it('shows the saved price\'s figure from the settings read without asking, and again when the person types it back', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`GET ${EARN}`] = earnIs(200_000, 199_000);
    await open();
    await screen.findByText('Take paid messages');
    expect(screen.getByLabelText('1,275 naira')).toBeTruthy();
    await fireEvent.changeText(price(), '2000');
    expect(await screen.findByLabelText('1,990 naira')).toBeTruthy();
    await fireEvent.changeText(price(), '1500');
    expect(screen.getByLabelText('1,275 naira')).toBeTruthy();
    expect(earnAsks()).toEqual(['?priceKobo=200000']);
  });

  it('shows a dash, not a guess, when the Hub cannot say what a typed price earns', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`GET ${EARN}`] = 'offline';
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '2000');
    await waitFor(() => expect(earnAsks().length).toBeGreaterThan(0), { timeout: 3000 });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('paid-earn')).toBeNull();
    expect(screen.getByText('-')).toBeTruthy();
    // The price is still saveable: what it earns is only shown, never needed.
    expect(isDisabled(saveButton())).toBe(false);
  });

  it('INBOX-12 R2-2: a refused earn read is asked once for a typed price, not twice', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`GET ${EARN}`] = 'offline';
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '2000');
    await waitFor(() => expect(earnAsks().length).toBeGreaterThan(0), { timeout: 3000 });
    // A second try would come after React Query's one-second retry delay.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1400));
    });
    expect(earnAsks()).toEqual(['?priceKobo=200000']);
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

  it('asks nothing for an empty price or one under the lowest, and shows a dash', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '49');
    await fireEvent.changeText(price(), '');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
    expect(earnAsks()).toEqual([]);
    expect(screen.queryByTestId('paid-earn')).toBeNull();
  });

  it('names a preset in the shared money words, whole naira', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    await screen.findByText('Take paid messages');
    expect(screen.getByLabelText('Set the price to ₦500')).toBeTruthy();
    expect(screen.getByLabelText('Set the price to ₦2,500')).toBeTruthy();
  });

  it('a user can switch off, pick a reply time and save, and the Hub gets exactly that in kobo', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`PUT ${SETTINGS}`] = ok(settings({ enabled: false, priceKobo: 200_000, responseHours: 72 }));
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '2000');
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

  it('a creator who never set anything sees the switch off and an empty price, and cannot turn on without one', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings({ enabled: false, priceKobo: null, earnPerMessageKobo: null, raiseToKobo: null }));
    await open();
    await screen.findByText('Take paid messages');
    expect(screen.getByText('Off')).toBeTruthy();
    expect(price().props.value).toBe('');
    await fireEvent.press(screen.getByTestId('paid-switch'));
    expect(screen.getByText('On')).toBeTruthy();
    expect(isDisabled(saveButton())).toBe(true);
    await fireEvent.changeText(price(), '1000');
    expect(isDisabled(saveButton())).toBe(false);
  });

  it('a price under the lowest the Hub allows is named and cannot be saved', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '49');
    expect(screen.getByTestId('paid-price-problem').props.children).toBe('The lowest price is ₦50.');
    expect(isDisabled(saveButton())).toBe(true);
    await fireEvent.changeText(price(), '50');
    expect(screen.queryByTestId('paid-price-problem')).toBeNull();
    expect(isDisabled(saveButton())).toBe(false);
  });

  it('a refused save says why and keeps what was typed', async () => {
    answers[`GET ${SETTINGS}`] = ok(settings());
    answers[`PUT ${SETTINGS}`] = refusal(400, 'Pick one of the reply times on offer.');
    await open();
    await screen.findByText('Take paid messages');
    await fireEvent.changeText(price(), '2000');
    await fireEvent.press(saveButton());
    expect(await screen.findByText('Pick one of the reply times on offer.')).toBeTruthy();
    expect(price().props.value).toBe('₦2,000');
  });
});

describe('Paid messages, warned (I22)', () => {
  it('a user sees how many they missed, the Hub\'s line, a price to raise to, and the share in warning colour', async () => {
    answers[`GET ${SETTINGS}`] = ok(warned());
    await open();
    expect(await screen.findByText('You missed 4 of your last 18')).toBeTruthy();
    expect(screen.getByText('Past 30% and paid messages switch off for 7 days. Raise your price for fewer, more serious questions.')).toBeTruthy();
    expect(screen.getByText('Raise to ₦2,500')).toBeTruthy();
    expect(screen.getByTestId('paid-unanswered').props.children).toBe('22%');
    expect(isDisabled(saveButton())).toBe(false);
  });

  it('a user can raise the price and save it', async () => {
    answers[`GET ${SETTINGS}`] = ok(warned());
    answers[`GET ${EARN}`] = earnIs(250_000, 212_500);
    answers[`PUT ${SETTINGS}`] = ok({ ...warned(), priceKobo: 250_000, raiseToKobo: null });
    await open();
    await fireEvent.press(await screen.findByTestId('paid-raise'));
    expect(price().props.value).toBe('₦2,500');
    expect(await screen.findByLabelText('2,125 naira')).toBeTruthy();
    await fireEvent.press(saveButton());
    await waitFor(() => expect(puts()).toHaveLength(1));
    expect(puts()[0].body).toEqual({ enabled: true, priceKobo: 250_000, responseHours: 24 });
    // The Hub now has nothing higher to offer: the button and the sentence about it go.
    await waitFor(() => expect(screen.queryByTestId('paid-raise')).toBeNull());
    expect(screen.getByText('Past 30% and paid messages switch off for 7 days.')).toBeTruthy();
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
    expect(price().props.editable).toBe(false);
    expect(isDisabled(screen.getByTestId('paid-preset-100000'))).toBe(true);
    await fireEvent.press(screen.getByTestId('paid-switch'));
    await fireEvent.press(screen.getByTestId('paid-preset-100000'));
    await fireEvent.press(screen.getByRole('tab', { name: '3 days' }));
    expect(screen.getByRole('tab', { name: '24 hours' }).props.accessibilityState.selected).toBe(true);
    expect(price().props.value).toBe('₦1,500');
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
