/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
jest.mock('expo-router', () => {
  const router = { push: jest.fn() };
  return { useRouter: () => router };
});

/*
 * W39 against a stand-in Hub that answers in the contract's shape (WALLET-16): every figure and title is made up here, none of
 * the canvas's samples, so a screen that drew the canvas's figures, or a total of its own, would fail.
 */
type Reply = { status: number; body: unknown } | 'offline' | 'hold';
type Ask = { method: string; path: string; query: URLSearchParams };

const OWNER = '00000000-0000-4000-8000-0000000000e9';
let asks: Ask[] = [];
let answer: (ask: Ask) => Reply = () => ({ status: 404, body: {} });

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const ask = { method: request.method, path: url.pathname.replace(/^\/api\/hub/, ''), query: url.searchParams };
  asks.push(ask);
  const reply = answer(ask);
  if (reply === 'offline') throw new TypeError('Network request failed');
  if (reply === 'hold') {
    return new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  }
  return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const asked = (path: string) => asks.filter((a) => a.path === path);

const MONTH = '2026-10';
const period = (streams: { kind: string; earnedKobo: number; sales: number }[]) => ({
  earnedKobo: streams.reduce((n, s) => n + s.earnedKobo, 0),
  sales: streams.reduce((n, s) => n + s.sales, 0),
  streams,
});
const STREAMS = [
  { kind: 'content_unlock', earnedKobo: 7_650_000, sales: 18 },
  { kind: 'tip', earnedKobo: 1_700_050, sales: 6 },
];
const EARNED = {
  month: MONTH,
  walletOpen: true,
  allTime: { earnedKobo: 31_280_075, sales: 90, streams: [{ kind: 'content_unlock', earnedKobo: 31_280_075, sales: 90 }] },
  thisMonth: period(STREAMS),
  waiting: { count: 0, amountKobo: 0 },
  held: { count: 0, amountKobo: 0 },
};
const PIECES = [
  { kind: 'content_unlock', targetId: 'c-1', title: 'Test lighting guide', earnedKobo: 7_650_000, sales: 18, lastAt: '2026-10-16T09:00:00.000Z' },
  { kind: 'tip', targetId: 'u-1', title: 'Tip for Ada Test', earnedKobo: 1_700_050, sales: 6, lastAt: '2026-10-15T09:00:00.000Z' },
];

function hubWith(over: { summary?: Reply; pieces?: (ask: Ask) => Reply } = {}, summary: unknown = EARNED) {
  answer = (ask) => {
    if (ask.path === '/money/earnings') return over.summary ?? ok(summary);
    if (ask.path === '/money/earnings/content') return (over.pieces ?? (() => ok({ month: MONTH, items: PIECES, nextCursor: null })))(ask);
    return { status: 404, body: { statusCode: 404, message: 'Not here' } };
  };
}

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const handlers = { onBack: jest.fn(), onOpenWallet: jest.fn() };

async function earnings() {
  const { EarningsScreen } = require('../earnings/EarningsScreen') as typeof import('../earnings/EarningsScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={frame}>
      <EarningsScreen {...handlers} />
    </SafeAreaProvider>,
  );
  return rtl;
}

const allText = (app: typeof rtl) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(app.screen.toJSON(), (_key, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  });
};
const buttonNames = (app: typeof rtl) => app.screen.queryAllByRole('button').map((b) => b.props.accessibilityLabel as string);
const labelOf = (app: typeof rtl, testID: string) => app.screen.getByTestId(testID).props.accessibilityLabel as string;

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  asks = [];
  Object.values(handlers).forEach((fn) => fn.mockClear());
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  hubWith();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
  jest.restoreAllMocks();
});

afterAll(() => {
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('W39 · Earnings (WALLET-13)', () => {
  it('shows what the Hub says was earned this month and all time, by stream and by piece, and has no move button', async () => {
    const app = await earnings();
    await app.screen.findByTestId('earnings-hero');
    expect(allText(app)).toContain('Earned in October');
    expect(labelOf(app, 'earnings-month-figure')).toBe('93,500 naira 50 kobo');
    expect(rtl.within(app.screen.getByTestId('earnings-all-time')).getByLabelText('312,800 naira 75 kobo')).toBeTruthy();
    expect(allText(app)).toContain('earned all time');
    expect(rtl.within(app.screen.getByTestId('earnings-tile-content_unlock')).getByLabelText('76,500 naira')).toBeTruthy();
    expect(rtl.within(app.screen.getByTestId('earnings-tile-tip')).getByLabelText('17,000 naira 50 kobo')).toBeTruthy();
    expect(rtl.within(app.screen.getByTestId('earnings-tile-paid_dm')).getByLabelText('0 naira')).toBeTruthy();
    await app.screen.findByTestId('earnings-piece-content_unlock-c-1');
    // SWEEP-APP-4 row 144: a whole-naira piece draws +₦76,500 with no ".00" (the board), and one with kobo keeps them.
    expect(labelOf(app, 'earnings-piece-content_unlock-c-1')).toContain('+₦76,500');
    expect(labelOf(app, 'earnings-piece-content_unlock-c-1')).not.toContain('76,500.00');
    expect(labelOf(app, 'earnings-piece-tip-u-1')).toContain('+₦17,000.50');
    expect(allText(app)).toContain('Test lighting guide');
    expect(allText(app)).toContain('18 unlocks');
    expect(allText(app)).toContain('Tip for Ada Test');
    expect(allText(app)).toContain('6 tips');
    // R-11: nothing to move, nothing waiting, nothing to open.
    const text = allText(app);
    expect(text).not.toContain('Move to wallet');
    expect(text).not.toContain('Ready to move');
    expect(buttonNames(app)).not.toContain('Open your wallet');
    expect(app.screen.queryByTestId('earnings-waiting')).toBeNull();
    // The Hub names the month, and the pieces are asked for that month.
    expect(asked('/money/earnings')[0].query.get('month')).toBeNull();
    expect(asked('/money/earnings/content')[0].query.get('month')).toBe(MONTH);
  });

  it('tells a creator with no wallet the money is waiting and lets them open one', async () => {
    hubWith({}, { ...EARNED, walletOpen: false, waiting: { count: 3, amountKobo: 1_275_050 } });
    const app = await earnings();
    const note = await app.screen.findByTestId('earnings-waiting');
    expect(allText(app)).toContain('₦12,750.50 is waiting for you');
    expect(allText(app)).toContain('It lands in your wallet the moment you open one.');
    expect(note).toBeTruthy();
    await rtl.userEvent.setup().press(app.screen.getByTestId('earnings-open-wallet'));
    expect(handlers.onOpenWallet).toHaveBeenCalledTimes(1);
  });

  it('tells a creator with a wallet what is still on its way, with no link to open one', async () => {
    hubWith({}, { ...EARNED, waiting: { count: 1, amountKobo: 8_500 } });
    const app = await earnings();
    await app.screen.findByTestId('earnings-waiting');
    expect(allText(app)).toContain('₦85 is on its way to your wallet');
    expect(allText(app)).toContain('Earnings reach your wallet once a day.');
    expect(app.screen.queryByTestId('earnings-open-wallet')).toBeNull();
  });

  it('shows the empty state for someone who has earned nothing, with no figures drawn', async () => {
    hubWith({}, { ...EARNED, allTime: period([]), thisMonth: period([]) });
    const app = await earnings();
    await app.screen.findByTestId('earnings-empty');
    expect(allText(app)).toContain('Nothing earned yet');
    expect(app.screen.queryByTestId('earnings-hero')).toBeNull();
    expect(asked('/money/earnings/content')).toHaveLength(0);
  });

  it('shows a month with nothing in it as nothing, with the all-time figure kept', async () => {
    hubWith({ pieces: () => ok({ month: MONTH, items: [], nextCursor: null }) }, { ...EARNED, thisMonth: period([]) });
    const app = await earnings();
    await app.screen.findByTestId('earnings-pieces-empty');
    expect(labelOf(app, 'earnings-month-figure')).toBe('0 naira');
    expect(rtl.within(app.screen.getByTestId('earnings-all-time')).getByLabelText('312,800 naira 75 kobo')).toBeTruthy();
  });

  it('shows the loading state while the Hub has not answered', async () => {
    hubWith({ summary: 'hold' });
    const app = await earnings();
    expect(await app.screen.findByTestId('earnings-loading')).toBeTruthy();
    expect(app.screen.queryByTestId('earnings-hero')).toBeNull();
  });

  it('shows an error with Try again when the Hub fails, and the earnings once it answers', async () => {
    hubWith({ summary: { status: 500, body: { statusCode: 500, message: 'Something broke on our side.' } } });
    const app = await earnings();
    await app.screen.findByTestId('earnings-error');
    expect(allText(app)).toContain('Couldn’t load your earnings');
    expect(app.screen.queryByTestId('earnings-hero')).toBeNull();
    hubWith();
    await rtl.userEvent.setup().press(app.screen.getByRole('button', { name: 'Try again' }));
    await app.screen.findByTestId('earnings-hero');
    expect(app.screen.queryByTestId('earnings-error')).toBeNull();
  });

  it('says there is no connection when the phone is offline', async () => {
    hubWith({ summary: 'offline' });
    const app = await earnings();
    await app.screen.findByTestId('earnings-error');
    expect(allText(app)).toContain('No connection');
  });

  it('refuses a body that is not an earnings view instead of drawing zeros', async () => {
    hubWith({ summary: ok({ month: MONTH, allTime: period([]) }) });
    const app = await earnings();
    await app.screen.findByTestId('earnings-error');
    expect(app.screen.queryByTestId('earnings-hero')).toBeNull();
  });

  it('keeps the figures when only the pieces fail, and offers Try again for them', async () => {
    hubWith({ pieces: () => ({ status: 500, body: { statusCode: 500, message: 'No.' } }) });
    const app = await earnings();
    await app.screen.findByTestId('earnings-pieces-error');
    expect(app.screen.getByTestId('earnings-hero')).toBeTruthy();
    hubWith();
    await rtl.userEvent.setup().press(app.screen.getByTestId('earnings-pieces-retry'));
    await app.screen.findByTestId('earnings-piece-tip-u-1');
  });

  it('pages the pieces with the Hub cursor and never adds them up', async () => {
    hubWith({
      pieces: (ask) =>
        ask.query.get('cursor') === 'next-1'
          ? ok({ month: MONTH, items: [{ ...PIECES[1], targetId: 'u-2', title: 'Tip for Bo Test' }], nextCursor: null })
          : ok({ month: MONTH, items: [PIECES[0]], nextCursor: 'next-1' }),
    });
    const app = await earnings();
    await app.screen.findByTestId('earnings-piece-content_unlock-c-1');
    expect(allText(app)).not.toContain('Bo Test');
    await rtl.userEvent.setup().press(app.screen.getByTestId('earnings-more'));
    await app.screen.findByTestId('earnings-piece-tip-u-2');
    expect(asked('/money/earnings/content').map((a) => a.query.get('cursor'))).toEqual([null, 'next-1']);
    expect(app.screen.queryByTestId('earnings-more')).toBeNull();
    expect(labelOf(app, 'earnings-month-figure')).toBe('93,500 naira 50 kobo');
  });
});
