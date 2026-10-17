/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cardOrder } from '../model';

/**
 * HOME-16: the reader opened by the morning notice reads the day the notice was made for. The Hub is the
 * fetch in this file; the reader is the real one.
 */
type Answer = { status: number; body: unknown };
let answers: Record<string, Answer> = {};
let sent: string[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  sent.push(key);
  const answer = answers[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { TgifReader } = require('../TgifReader') as typeof import('../TgifReader');

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

/** A Friday. */
const opened = new Date(2025, 8, 26, 9, 41);

const dayOf = (date: string) => ({
  date,
  series: 'SONS, NOT SLAVES',
  seriesTheme: 'Who you are',
  verse: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
  verseReference: 'Psalm 118:24 (KJV)',
  reality: 'Today is not a leftover from yesterday.',
  remember: "I don't have to earn today. I get to live it.",
  prayer: 'Lord, thank you for this day.',
  takeaway: "Write down one thing you're glad for.",
  shareLink: 'wawu/tgif',
});
const statsOf = (date: string) => ({
  date,
  cards: cardOrder.map((card) => ({ card, amen: 0, amenByMe: false })),
  readers: 0,
  shares: 0,
  readByMe: false,
  sharedByMe: false,
});
const serve = (date: string) => {
  answers = {
    [`GET /tgif/${date}`]: ok(dayOf(date)),
    [`GET /tgif/${date}/stats`]: ok(statsOf(date)),
    [`POST /tgif/${date}/read`]: ok({ readers: 1, counted: true }),
  };
};

beforeAll(async () => {
  const warm = await rtl.render(<></>);
  warm.unmount();
}, 120_000);

beforeEach(() => {
  sent = [];
});

afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

describe('the reader opened by the morning notice (HOME-16)', () => {
  it('reads the day the notice names when it is yesterday, today or tomorrow', async () => {
    serve('2025-09-25');
    await render(<TgifReader onClose={jest.fn()} now={opened} date="2025-09-25" />);
    expect(await rtl.screen.findByTestId('tgif-text', {}, { timeout: 20_000 })).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-header-line').props.children).toBe('Thursday 25 September · SONS, NOT SLAVES');
    expect(sent.filter((k) => k === 'GET /tgif/2025-09-25')).toHaveLength(1);
    expect(sent.filter((k) => k.includes('2025-09-26'))).toEqual([]);
  }, 60_000);

  it('reads today when the notice is older than the Hub takes a read for', async () => {
    serve('2025-09-26');
    await render(<TgifReader onClose={jest.fn()} now={opened} date="2025-09-20" />);
    expect(await rtl.screen.findByTestId('tgif-text', {}, { timeout: 20_000 })).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-header-line').props.children).toBe('Friday 26 September · SONS, NOT SLAVES');
    expect(sent.filter((k) => k.includes('2025-09-20'))).toEqual([]);
  }, 60_000);

  it('reads today when it is opened with no day', async () => {
    serve('2025-09-26');
    await render(<TgifReader onClose={jest.fn()} now={opened} />);
    expect(await rtl.screen.findByTestId('tgif-text', {}, { timeout: 20_000 })).toBeTruthy();
    expect(sent.filter((k) => k === 'GET /tgif/2025-09-26')).toHaveLength(1);
  }, 60_000);
});
