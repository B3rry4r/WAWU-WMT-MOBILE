/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { localDay } from '@/features/tgif/model';

/**
 * H1 and H36 on Today (ADS-01, reworked by DV2-01 under R-59): the ad card is always in TGIF's old place, from
 * `GET /ads?placement=today_slot`, whatever the person's TGIF switch says, and opens its event. With no campaign, while it
 * loads and when it cannot be read, nothing is drawn.
 */
const mockPush = jest.fn();
let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused, useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => '00000000-0000-4000-8000-0000000000aa' }));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; query: string; body: unknown }[] = [];

const ok = (data: unknown, pagination?: unknown): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) },
});
const refused = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const text = request.method === 'GET' ? '' : await request.clone().text();
  sent.push({ key, query: url.search, body: text ? JSON.parse(text) : undefined });
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ME = '00000000-0000-4000-8000-0000000000aa';
const ADA = '00000000-0000-4000-8000-0000000000a1';
const DATE = localDay();
const AD_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';

const tick = (verified: boolean) => ({ verified, expiresAt: null });
const creator = {
  wawuId: ADA,
  name: 'Adaeze O.',
  handle: null,
  avatarUrl: null,
  field: 'Business strategist',
  pieceCount: 3,
  verification: { creator: tick(true), professional: tick(false) },
  following: false,
};
const day = {
  date: '2026-09-25',
  series: 'Sons, not slaves',
  seriesTheme: 'Identity',
  verse: 'The verse',
  verseReference: 'Galatians 4:7',
  reality: 'The reality',
  remember: 'Remember this',
  prayer: 'A prayer',
  takeaway: 'The takeaway',
  shareLink: null,
};

/** Words the Hub served: none of them is in the app. */
const AD = {
  id: AD_ID,
  advertiser: 'Night Live Ltd',
  headline: 'Harvest Praise Night',
  subline: 'Lagos · Sun 2 November · from ₦3,500',
  ctaLabel: 'Book a seat',
  ctaDestination: 'event',
  ctaDestinationId: EVENT_ID,
  artworkUrl: 'https://cdn.example.test/harvest.jpg',
};

const T = {
  wallet: 'GET /money/wallet',
  balance: 'GET /money/wallet/balance',
  tgif: 'GET /settings/tgif',
  day: `GET /tgif/${DATE}`,
  stats: `GET /tgif/${DATE}/stats`,
  creators: 'GET /creators',
  me: 'GET /users/me',
  ads: 'GET /ads',
  events: `POST /ads/${AD_ID}/events`,
};

function everyAnswer(): Record<string, Answer[]> {
  return {
    [T.wallet]: [ok({ state: 'open', account: { accountNumber: '1154079370', accountName: 'Ada Sandbox', bankName: 'Loma Bank' } })],
    [T.balance]: [ok({ availableKobo: 48525075, asOf: '2026-10-07T10:00:00Z' })],
    [T.tgif]: [ok({ show: false })],
    [T.day]: [ok(day)],
    [T.stats]: [ok({ date: DATE, cards: [], readers: 12400, shares: 0, readByMe: false, sharedByMe: false })],
    [T.creators]: [ok([creator], { currentPage: 1, nextPage: null, perPage: 12, total: 1 })],
    [T.me]: [ok({ wawuUserId: ME })],
    [T.ads]: [ok(AD)],
    [T.events]: [ok({ accepted: true })],
  };
}

const clients: QueryClient[] = [];

function tree(client: QueryClient) {
  const { TodayScreen } = require('@/features/home/TodayScreen') as typeof import('@/features/home/TodayScreen');
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <TodayScreen onView={() => undefined} masked={false} onToggleMask={() => undefined} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

async function boot() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const screen = await rtl.render(tree(client));
  return Object.assign(screen, { again: () => screen.rerender(tree(client)) });
}

const calls = (key: string) => sent.filter((s) => s.key === key);
const reported = () => calls(T.events).map((c) => (c.body as { type: string }).type);
const settle = (ms = 30) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
const hiddenOk = { includeHiddenElements: true };

beforeAll(async () => {
  // The first Today drawn pays for loading its modules and drawing the balance and the rail; it is drawn once here, under a budget of its own.
  answers = everyAnswer();
  const warm = await boot();
  await rtl.waitFor(() => expect(warm.getByTestId('today-balance')).toBeTruthy(), { timeout: 60_000 });
  await warm.unmount();
}, 120_000);

beforeEach(() => {
  answers = everyAnswer();
  sent = [];
  mockFocused = true;
  mockPush.mockClear();
});

afterEach(async () => {
  await settle(10);
  clients.splice(0).forEach((c) => c.clear());
});

describe('H1 and H36 · the ad card on Today', () => {
  it("asks the Hub for Today's placement and draws the card in TGIF's place, with the advertiser's words and the button word the Hub served", async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    expect(calls(T.ads)).toHaveLength(1);
    expect(calls(T.ads)[0].query).toBe('?placement=today_slot');
    expect(screen.getByText('AD')).toBeTruthy();
    expect(screen.queryByText('SPONSORED')).toBeNull();
    expect(screen.getByTestId('today-sponsored-headline')).toHaveTextContent('Harvest Praise Night');
    expect(screen.getByTestId('today-sponsored-subline')).toHaveTextContent('Lagos · Sun 2 November · from ₦3,500');
    expect(screen.getByTestId('today-sponsored-cta')).toHaveTextContent('Book a seat');
    expect(screen.getByTestId('today-sponsored-button')).toBeTruthy();
    expect(screen.getByTestId('today-sponsored-artwork', hiddenOk).props.source).toEqual([{ uri: AD.artworkUrl }]);
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(calls(T.day)).toHaveLength(0);
    expect(screen.queryByText(/keep TGIF free|sold from the/i)).toBeNull();
  });

  it('sits right after the money card and before the services', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    const ids = (JSON.stringify(screen.toJSON()).match(/"testID":"[^"]+"/g) ?? []).map((m) => m.slice(10, -1));
    const at = (id: string) => ids.indexOf(id);
    expect(at('today-balance-card')).toBeGreaterThanOrEqual(0);
    expect(at('today-sponsored')).toBeGreaterThan(at('today-balance-card'));
    expect(at('today-sponsored')).toBeLessThan(at('today-creator-' + ADA));
  });

  it('counts a view once when it is on screen', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
    await settle();
    expect(reported()).toEqual(['view']);
  });

  it('does not count a view while Today is not the tab in front, and counts it when it is', async () => {
    mockFocused = false;
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    await settle();
    expect(reported()).toEqual([]);
    mockFocused = true;
    await screen.again();
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
  });

  it('opens the event (E2) from the card, and counts the tap once however often it is pressed', async () => {
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    await rtl.fireEvent.press(screen.getByTestId('today-sponsored'));
    await rtl.fireEvent.press(screen.getByTestId('today-sponsored'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/events/[id]', params: { id: EVENT_ID } });
    await rtl.waitFor(() => expect(reported().filter((t) => t === 'tap')).toHaveLength(1));
    expect(reported().filter((t) => t === 'view')).toHaveLength(1);
  });

  it('draws a card with no line under the headline without that line, and always with its picture', async () => {
    answers[T.ads] = [ok({ ...AD, subline: null })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    expect(screen.queryByTestId('today-sponsored-subline')).toBeNull();
    expect(screen.getByTestId('today-sponsored-artwork', hiddenOk).props.source).toEqual([{ uri: AD.artworkUrl }]);
    expect(screen.getByTestId('today-sponsored-headline')).toHaveTextContent('Harvest Praise Night');
  });
});

describe('Today has no TGIF card: the ad card holds its old place alone (R-59, DV2-RM)', () => {
  it('the ad card is asked for and drawn, and Today asks for no TGIF switch and no TGIF day, whatever the Hub would have said', async () => {
    answers[T.tgif] = [ok({ show: true })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-sponsored')).toBeTruthy());
    expect(calls(T.ads)).toHaveLength(1);
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(screen.queryByTestId('today-tgif-error')).toBeNull();
    expect(calls(T.tgif)).toHaveLength(0);
    expect(calls(T.day)).toHaveLength(0);
    expect(calls(T.stats)).toHaveLength(0);
    const ids = (JSON.stringify(screen.toJSON()).match(/"testID":"[^"]+"/g) ?? []).map((m) => m.slice(10, -1));
    expect(ids.indexOf('today-sponsored')).toBeGreaterThan(ids.indexOf('today-balance-card'));
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
  });

  it('with no live campaign, neither a TGIF card nor an ad frame is drawn', async () => {
    answers[T.ads] = [ok(null)];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.waitFor(() => expect(calls(T.ads)).toHaveLength(1));
    await settle();
    expect(screen.queryByTestId('today-tgif')).toBeNull();
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(screen.queryByText('AD')).toBeNull();
  });
});

describe('Today with nothing sponsored to show', () => {
  it('with no live campaign (data: null), Today shows without a frame or a gap, and nothing is reported', async () => {
    answers[T.ads] = [ok(null)];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.waitFor(() => expect(calls(T.ads)).toHaveLength(1));
    await settle();
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(screen.queryByText('AD')).toBeNull();
    expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy();
    expect(calls(T.events)).toHaveLength(0);
  });

  it.each([
    ['the Hub answers with an error', refused(500, 'Server error')],
    ['there is no connection', 'offline' as const],
    ['the card is for a destination this build cannot open', ok({ ...AD, ctaDestination: 'link' })],
    ['the card has no picture (R-59)', ok({ ...AD, artworkUrl: null })],
    ['the picture is not a web address', ok({ ...AD, artworkUrl: 'javascript:alert(1)' })],
  ])('when %s, Today shows as it would with none: no frame, no message, no report', async (_why, answer) => {
    answers[T.ads] = [answer];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.waitFor(() => expect(calls(T.ads)).toHaveLength(1));
    await settle();
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(screen.queryByTestId('today-error')).toBeNull();
    expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy();
    expect(calls(T.events)).toHaveLength(0);
  });

  it('while the card is on its way Today is drawn without it and does not wait for it', async () => {
    answers[T.ads] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-balance')).toBeTruthy());
    await rtl.waitFor(() => expect(screen.getByTestId(`today-creator-${ADA}`)).toBeTruthy());
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(screen.queryByTestId('today-loading')).toBeNull();
  });

  it('while Today itself is loading, the card is not drawn and no view is reported', async () => {
    // Today no longer reads the TGIF switch (R-59, DV2-RM): the creators read is held to keep it loading.
    answers[T.creators] = ['hold'];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('today-loading')).toBeTruthy());
    await settle();
    expect(screen.queryByTestId('today-sponsored')).toBeNull();
    expect(reported()).toEqual([]);
  });
});
