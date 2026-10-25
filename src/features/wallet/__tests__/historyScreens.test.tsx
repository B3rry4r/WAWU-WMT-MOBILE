/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions, Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockVault = new Map<string, string>();
const mockCopied: string[] = [];
const mockPushed: unknown[] = [];

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
  const router = { push: (to: unknown) => mockPushed.push(to) };
  return { useRouter: () => router, router };
});
jest.mock('@/features/open-wallet/copy', () => ({
  copyText: jest.fn(async (value: string) => {
    mockCopied.push(value);
    return true;
  }),
}));

/*
 * W26, W27 and W28 against a stand-in Hub that answers in the contract's shape (MONEY-15): every row is made up here, none of
 * the canvas's samples, so a screen that drew the canvas's figures or a figure of its own would fail.
 */
type Reply = { status: number; body: unknown } | 'offline' | 'hold';
type Ask = { method: string; path: string; query: URLSearchParams; body?: unknown };

const OWNER = '00000000-0000-4000-8000-0000000000e4';
const SUPPORT_CHAT = '00000000-0000-4000-8000-0000000000c9';
let asks: Ask[] = [];
let answer: (ask: Ask) => Reply = () => ({ status: 404, body: {} });

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
const pageOf = (items: unknown[], nextCursor: string | null = null) => ok({ items, nextCursor });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const ask: Ask = {
    method: request.method,
    path: url.pathname.replace(/^\/api\/hub/, ''),
    query: url.searchParams,
    body: request.method === 'POST' ? ((await request.clone().json().catch(() => undefined)) as unknown) : undefined,
  };
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

/** Lagos is UTC+1 all year: midnight today there, as a UTC time, so "today" and "yesterday" never depend on when the test runs. */
const HOUR = 3_600_000;
const lagosMidnight = Math.floor((Date.now() + HOUR) / (24 * HOUR)) * 24 * HOUR - HOUR;
const TODAY = new Date(lagosMidnight + 1_000).toISOString();
const YESTERDAY = new Date(lagosMidnight - 12 * HOUR).toISOString();
const TWO_DAYS_AGO = new Date(lagosMidnight - 36 * HOUR).toISOString();
const MONTH_NAME = new Date().toLocaleString('en-GB', { month: 'long', timeZone: 'Africa/Lagos' });
const MONTH_KEY = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }).slice(0, 7);

const fee = (provider: number, wawu: number) => ({ providerFeeKobo: provider, wawuFeeKobo: wawu, totalFeeKobo: provider + wawu });
const base = { link: null, note: null, transferId: null, paymentId: null, group: null, status: 'completed' };
const TIP = {
  ...base,
  id: 'tip-1',
  direction: 'in',
  category: 'earning',
  amountKobo: 310_000,
  fee: fee(0, 0),
  totalKobo: 310_000,
  description: 'Tip · Framing a night shot',
  counterparty: { kind: 'wawu_user', name: 'Bayo Test', avatarUrl: null, wawuUserId: 'u-bayo', bankName: null, accountNumberLast4: null },
  link: { kind: 'tip', targetId: 'c-1', title: 'Framing a night shot' },
  note: 'Thanks for the lesson',
  reference: 'REF-TIP-1',
  createdAt: TODAY,
};
const SEND = {
  ...base,
  id: 'send-1',
  direction: 'out',
  category: 'transfer',
  amountKobo: 1_700_000,
  fee: fee(5_300, 3_100),
  totalKobo: 1_708_400,
  description: 'Transfer · Test Bank',
  counterparty: { kind: 'bank_account', name: 'Ngozi Test', avatarUrl: null, wawuUserId: null, bankName: 'Test Bank', accountNumberLast4: '5521' },
  reference: 'REF-SEND-1',
  createdAt: YESTERDAY,
};
const BILL = {
  ...base,
  id: 'bill-1',
  direction: 'out',
  category: 'bill',
  amountKobo: 450_000,
  fee: fee(0, 0),
  totalKobo: 450_000,
  description: 'Bill · Test Power',
  counterparty: { kind: 'biller', name: 'Test Power', avatarUrl: null, wawuUserId: null, bankName: null, accountNumberLast4: null },
  link: { kind: 'bill', targetId: 'b-1', title: 'Test Power' },
  reference: 'REF-BILL-1',
  createdAt: TWO_DAYS_AGO,
};
const UNLOCKS = {
  ...base,
  id: 'unlock-9',
  direction: 'in',
  category: 'earning',
  amountKobo: 750_000,
  fee: fee(0, 0),
  totalKobo: 750_000,
  description: 'Unlock · Test lighting guide · 3 buyers',
  counterparty: null,
  link: { kind: 'content_unlock', targetId: 'c-9', title: 'Test lighting guide' },
  group: { key: 'g2.test-key', count: 3, firstAt: TODAY, lastAt: TODAY },
  reference: 'REF-UNLOCK-9',
  createdAt: TODAY,
};
const SUMMARY = { month: MONTH_KEY, inKobo: 98_700_050, outKobo: 41_250_025 };

/** A Hub with these rows: the list, the month's totals and each row by id. */
function hubWith(rows: unknown[], over: { list?: (ask: Ask) => Reply; summary?: Reply; support?: Reply } = {}) {
  answer = (ask) => {
    if (ask.path === '/support/thread') {
      return over.support ?? ok({ chatId: SUPPORT_CHAT, reference: (ask.body as { reference?: unknown } | undefined)?.reference ?? null, messageId: 'message-1' });
    }
    if (ask.path === '/money/transactions') return (over.list ?? (() => pageOf(rows)))(ask);
    if (ask.path === '/money/transactions/summary') return over.summary ?? ok(SUMMARY);
    const one = ask.path.match(/^\/money\/transactions\/(.+)$/);
    if (one) {
      const found = (rows as { id: string }[]).find((r) => r.id === one[1]);
      return found ? ok(found) : refusal(404, 'not_found', 'We could not find that transaction.');
    }
    return { status: 404, body: { statusCode: 404, message: 'Not here' } };
  };
}

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const handlers = { onBack: jest.fn(), onOpenTransaction: jest.fn(), onOpenGroup: jest.fn() };

async function history(props: { group?: string; onOpenStatements?: () => void } = {}) {
  const { HistoryScreen } = require('../history/HistoryScreen') as typeof import('../history/HistoryScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={frame}>
      <HistoryScreen {...handlers} {...props} />
    </SafeAreaProvider>,
  );
  return rtl;
}

async function detail(id: string) {
  const { DetailScreen } = require('../history/DetailScreen') as typeof import('../history/DetailScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={frame}>
      <DetailScreen id={id} onBack={handlers.onBack} />
    </SafeAreaProvider>,
  );
  return rtl;
}

/** Everything drawn, as text. */
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

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  asks = [];
  mockCopied.length = 0;
  mockPushed.length = 0;
  Object.values(handlers).forEach((fn) => fn.mockClear());
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  hubWith([TIP, SEND, BILL]);
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

describe('W26 · Transaction history', () => {
  it('a user sees the Hub’s transactions under their days, newest first, a debit as the total that left the wallet', async () => {
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    expect(app.screen.getByText('Today')).toBeTruthy();
    expect(app.screen.getByText('Yesterday')).toBeTruthy();
    expect(app.screen.getByText('Tip · Framing a night shot')).toBeTruthy();
    // ₦17,000.00 sent with ₦53.00 and ₦31.00 on top: the row says what left, ₦17,084.00.
    expect(app.screen.getByLabelText('minus 17,084 naira')).toBeTruthy();
    expect(app.screen.getByLabelText('plus 3,100 naira')).toBeTruthy();
    expect(app.screen.getByLabelText('minus 4,500 naira')).toBeTruthy();
    expect(app.screen.getByText('Ngozi Test')).toBeTruthy();
    expect(app.screen.getByText('Test Power')).toBeTruthy();
    // Nothing of the canvas's samples is drawn for anyone.
    expect(allText(app)).not.toMatch(/Amaka|Chidinma|Ikeja|212,400|96,820|WAW-T1P9/);
    const first = asked('/money/transactions')[0];
    expect(first.query.get('limit')).toBe('20');
    expect(first.query.get('filter')).toBe('all');
    expect(first.query.get('q')).toBeNull();
  });

  it('draws the screen as W26 does: the title, the search, the five chips, the summary, then the days, and none of what is not built (R-47)', async () => {
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    expect(app.screen.getByRole('header', { name: 'Transactions' })).toBeTruthy();
    expect(app.screen.getByLabelText('Search transactions')).toBeTruthy();
    expect(app.screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel)).toEqual(['All', 'Money in', 'Money out', 'Content']);
    // The export icon beside the title leads to statements (WALLET-35) when the route gives it somewhere to go (below), and Report a problem is SUPPORT-01's.
    expect(app.screen.queryByRole('button', { name: /statement|export|download|report/i })).toBeNull();
    // The only buttons are Back and the rows.
    expect(buttonNames(app).filter((n) => !/Bayo|Ngozi|Test Power/.test(n))).toEqual(['Back']);
  });

  it('a user sees this month’s In and Out as the Hub summed them, named for the month', async () => {
    const app = await history();
    expect(await app.screen.findByTestId('history-in')).toBeTruthy();
    expect(app.screen.getByText(`In · ${MONTH_NAME}`)).toBeTruthy();
    expect(app.screen.getByText(`Out · ${MONTH_NAME}`)).toBeTruthy();
    expect(app.screen.getByLabelText('987,000 naira 50 kobo')).toBeTruthy();
    expect(app.screen.getByLabelText('412,500 naira 25 kobo')).toBeTruthy();
    expect(asked('/money/transactions/summary')[0].query.get('month')).toBe(MONTH_KEY);
  });

  it('shows a figure that has not arrived as a bar, never as a zero', async () => {
    hubWith([TIP], { summary: 'hold' });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    expect(app.screen.getByTestId('history-in-loading')).toBeTruthy();
    expect(app.screen.getByTestId('history-out-loading')).toBeTruthy();
    expect(app.screen.queryByTestId('history-in')).toBeNull();
    expect(allText(app)).not.toContain('₦0');
  });

  it('says the totals could not be read, with Try again, while the rows still draw', async () => {
    hubWith([TIP], { summary: { status: 500, body: { statusCode: 500, message: 'Boom' } } });
    const app = await history();
    expect(await app.screen.findByTestId('history-summary-error')).toBeTruthy();
    expect(app.screen.getByText('Bayo Test')).toBeTruthy();
    expect(app.screen.queryByTestId('history-in')).toBeNull();
    const before = asked('/money/transactions/summary').length;
    hubWith([TIP]);
    await app.fireEvent.press(app.screen.getByTestId('history-summary-retry'));
    expect(await app.screen.findByTestId('history-in')).toBeTruthy();
    expect(asked('/money/transactions/summary').length).toBeGreaterThan(before);
  });

  it('a user can filter by Money in, Money out and Content, and each chip asks the Hub for it', async () => {
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    for (const [label, value] of [
      ['Money in', 'money_in'],
      ['Money out', 'money_out'],
      ['Content', 'content'],
      ['All', 'all'],
    ] as const) {
      await app.fireEvent.press(app.screen.getByRole('radio', { name: label }));
      await app.waitFor(() => expect(asked('/money/transactions').at(-1)?.query.get('filter')).toBe(value));
      expect(app.screen.getByRole('radio', { name: label }).props.accessibilityState.checked).toBe(true);
    }
  });

  it('shows what the Hub sent for a chip, not a filter of its own', async () => {
    hubWith([TIP, SEND], { list: (ask) => pageOf(ask.query.get('filter') === 'money_out' ? [SEND] : [TIP, SEND]) });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByRole('radio', { name: 'Money out' }));
    expect(await app.screen.findByText('Ngozi Test')).toBeTruthy();
    expect(app.screen.queryByText('Bayo Test')).toBeNull();
  });

  it('a user can search: nothing is asked for one character, then the Hub is asked once they pause, and what it finds is shown', async () => {
    hubWith([TIP, SEND], { list: (ask) => pageOf(ask.query.get('q') === 'Ngozi' ? [SEND] : [TIP, SEND]) });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    const box = app.screen.getByLabelText('Search transactions');
    const before = asked('/money/transactions').length;
    await app.fireEvent.changeText(box, 'N');
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
    });
    expect(asked('/money/transactions').length).toBe(before);
    await app.fireEvent.changeText(box, '  Ngozi ');
    // The pause is real (WALLET-04 D3, M13): typing alone has not asked yet 150 ms in.
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(asked('/money/transactions').at(-1)?.query.get('q')).not.toBe('Ngozi');
    await app.waitFor(() => expect(asked('/money/transactions').at(-1)?.query.get('q')).toBe('Ngozi'));
    expect(await app.screen.findByText('Ngozi Test')).toBeTruthy();
    expect(app.screen.queryByText('Bayo Test')).toBeNull();
  });

  it('the search key asks at once, without waiting for the pause', async () => {
    hubWith([TIP, SEND], { list: (ask) => pageOf(ask.query.get('q') === 'Bayo' ? [TIP] : [TIP, SEND]) });
    const app = await history();
    expect(await app.screen.findByText('Ngozi Test')).toBeTruthy();
    const box = app.screen.getByLabelText('Search transactions');
    await app.fireEvent.changeText(box, 'Bayo');
    await app.fireEvent(box, 'submitEditing');
    // Well inside the 350 ms pause (WALLET-04 D3, M14): the search key did not wait for it.
    await app.waitFor(() => expect(asked('/money/transactions').at(-1)?.query.get('q')).toBe('Bayo'), { timeout: 200 });
  });

  it('a search that finds nothing says so, with the words searched for and no Pay a bill', async () => {
    hubWith([TIP], { list: (ask) => pageOf(ask.query.get('q') ? [] : [TIP]) });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    await app.fireEvent.changeText(app.screen.getByLabelText('Search transactions'), 'zzz');
    expect(await app.screen.findByText('No results')).toBeTruthy();
    expect(app.screen.getByText(/zzz/)).toBeTruthy();
    expect(app.screen.queryByRole('button', { name: 'Pay a bill' })).toBeNull();
    expect(app.screen.queryByTestId('history-summary')).toBeNull();
  });

  it('a user can tap a row to open that transaction (W27)', async () => {
    const app = await history();
    await app.fireEvent.press(await app.screen.findByTestId('history-row-send-1'));
    expect(handlers.onOpenTransaction).toHaveBeenCalledWith('send-1');
    expect(handlers.onOpenGroup).not.toHaveBeenCalled();
  });

  it('a user taps the export icon beside the title and Statements opens (R2-MONEY D-10)', async () => {
    const onOpenStatements = jest.fn();
    const app = await history({ onOpenStatements });
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Statements' }));
    expect(onOpenStatements).toHaveBeenCalledTimes(1);
  });

  it('a grouped list has no export icon', async () => {
    await history({ group: 'unlock', onOpenStatements: jest.fn() });
    await rtl.screen.findByTestId('history-screen');
    expect(rtl.screen.queryByRole('button', { name: 'Statements' })).toBeNull();
  });

  it('a user can go back', async () => {
    const app = await history();
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Back' }));
    expect(handlers.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows several unlocks of one piece as one row, "Unlock · piece" over "3 buyers", and tapping it opens the unlocks it stands for, not a receipt', async () => {
    hubWith([UNLOCKS, TIP]);
    const app = await history();
    expect(await app.screen.findByText('Unlock · Test lighting guide')).toBeTruthy();
    expect(app.screen.getByText('3 buyers')).toBeTruthy();
    expect(app.screen.getByLabelText('plus 7,500 naira')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('history-row-unlock-9'));
    expect(handlers.onOpenGroup).toHaveBeenCalledWith('g2.test-key');
    expect(handlers.onOpenTransaction).not.toHaveBeenCalled();
  });

  it('opened on a grouped row, lists the unlocks the Hub says it stands for, with no search, chips or totals, and each opens its receipt', async () => {
    const buyer = { ...UNLOCKS, id: 'unlock-1', description: 'Unlock · Test lighting guide', group: null, amountKobo: 250_000, totalKobo: 250_000, counterparty: { kind: 'wawu_user', name: 'Tolu Test', avatarUrl: null, wawuUserId: 'u-tolu', bankName: null, accountNumberLast4: null } };
    hubWith([], { list: () => pageOf([buyer]) });
    const app = await history({ group: 'g2.test-key' });
    expect(await app.screen.findByText('Tolu Test')).toBeTruthy();
    const ask = asked('/money/transactions')[0];
    expect(ask.query.get('group')).toBe('g2.test-key');
    expect(ask.query.get('filter')).toBeNull();
    expect(ask.query.get('q')).toBeNull();
    expect(asked('/money/transactions/summary')).toHaveLength(0);
    expect(app.screen.queryByLabelText('Search transactions')).toBeNull();
    expect(app.screen.queryAllByRole('radio')).toHaveLength(0);
    expect(app.screen.queryByTestId('history-summary')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('history-row-unlock-1'));
    expect(handlers.onOpenTransaction).toHaveBeenCalledWith('unlock-1');
  });

  it('loads the next page when the end is reached, with the Hub’s cursor, and a day that carries on keeps its one label', async () => {
    const more = { ...TIP, id: 'tip-2', reference: 'REF-TIP-2', counterparty: { ...TIP.counterparty, name: 'Kemi Test' } };
    hubWith([], { list: (ask) => (ask.query.get('cursor') === 'c2.next' ? pageOf([more]) : pageOf([TIP], 'c2.next')) });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    await app.act(async () => {
      app.fireEvent(app.screen.getByTestId('history-list'), 'endReached');
    });
    expect(await app.screen.findByText('Kemi Test')).toBeTruthy();
    expect(asked('/money/transactions').at(-1)?.query.get('cursor')).toBe('c2.next');
    expect(app.screen.getAllByText('Today')).toHaveLength(1);
    expect(app.screen.getByText('Bayo Test')).toBeTruthy();
    // With no cursor left, reaching the end again asks for nothing.
    const total = asked('/money/transactions').length;
    await app.act(async () => {
      app.fireEvent(app.screen.getByTestId('history-list'), 'endReached');
    });
    expect(asked('/money/transactions').length).toBe(total);
  });

  it('keeps the rows and says so when a later page fails, and Try again asks for that page again', async () => {
    let fail = true;
    hubWith([], {
      list: (ask) => {
        if (ask.query.get('cursor') !== 'c2.next') return pageOf([TIP], 'c2.next');
        return fail ? { status: 500, body: { statusCode: 500, message: 'Boom' } } : pageOf([{ ...TIP, id: 'tip-2', counterparty: { ...TIP.counterparty, name: 'Kemi Test' } }]);
      },
    });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    await app.act(async () => {
      app.fireEvent(app.screen.getByTestId('history-list'), 'endReached');
    });
    expect(await app.screen.findByTestId('history-more-error')).toBeTruthy();
    expect(app.screen.getByText('Bayo Test')).toBeTruthy();
    fail = false;
    await app.fireEvent.press(app.screen.getByTestId('history-more-retry'));
    expect(await app.screen.findByText('Kemi Test')).toBeTruthy();
  });

  it('a user can pull the list down to ask the Hub again for the rows and the totals', async () => {
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    const lists = asked('/money/transactions').length;
    const totals = asked('/money/transactions/summary').length;
    hubWith([{ ...TIP, id: 'tip-9', counterparty: { ...TIP.counterparty, name: 'Newest Test' } }, TIP]);
    await app.act(async () => {
      await app.screen.getByTestId('history-list').props.refreshControl.props.onRefresh();
    });
    expect(await app.screen.findByText('Newest Test')).toBeTruthy();
    expect(asked('/money/transactions').length).toBeGreaterThan(lists);
    expect(asked('/money/transactions/summary').length).toBeGreaterThan(totals);
  });

  it('shows W4-style shapes while the Hub answers, with no heading made of nothing', async () => {
    hubWith([TIP], { list: () => 'hold' });
    const app = await history();
    expect(await app.screen.findByTestId('history-loading')).toBeTruthy();
    expect(app.screen.getByLabelText('Loading transactions')).toBeTruthy();
    expect(app.screen.queryByText('Today')).toBeNull();
    expect(app.screen.queryByTestId('history-empty')).toBeNull();
    expect(app.screen.queryByTestId('history-error')).toBeNull();
  });

  it('says so when the Hub cannot be reached, offers Try again, and never draws an empty list for a failure', async () => {
    hubWith([TIP], { list: () => 'offline' });
    const app = await history();
    expect(await app.screen.findByTestId('history-error')).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(app.screen.queryByTestId('history-empty')).toBeNull();
    hubWith([TIP]);
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
  });

  it('shows the server’s sentence for a failure it can say in words', async () => {
    hubWith([TIP], { list: () => ({ status: 500, body: { statusCode: 500, message: 'The ledger is busy. Try again in a minute.' } }) });
    const app = await history();
    expect(await app.screen.findByText('The ledger is busy. Try again in a minute.')).toBeTruthy();
    expect(app.screen.getByText('Couldn’t load your transactions')).toBeTruthy();
  });

  it('leads a user with no wallet to Open your wallet, in the Wallet tab’s own words', async () => {
    hubWith([], { list: () => refusal(409, 'wallet_not_open', 'Open your wallet first.') });
    const app = await history();
    expect(await app.screen.findByText("You don't have a wallet yet")).toBeTruthy();
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Open your wallet' }));
    expect(mockPushed).toEqual(['/open-wallet']);
  });

  it('refuses a row it cannot read instead of drawing it half empty', async () => {
    hubWith([], { list: () => pageOf([{ ...TIP, totalKobo: 'lots' }]) });
    const app = await history();
    expect(await app.screen.findByTestId('history-error')).toBeTruthy();
    expect(allText(app)).not.toContain('Bayo Test');
  });
});

describe('W28 · History, no results', () => {
  it('a user who filters to Content with none sees W28: "No content sales" and what shows here, with the chips and the search kept', async () => {
    hubWith([TIP], { list: (ask) => pageOf(ask.query.get('filter') === 'content' ? [] : [TIP]) });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByRole('radio', { name: 'Content' }));
    expect(await app.screen.findByText('No content sales yet')).toBeTruthy();
    expect(app.screen.getByText('Sales and unlocks of your work show here.')).toBeTruthy();
    // The search and the chips stay, the summary and the rows go, and Content is the chip that is on.
    expect(app.screen.getByLabelText('Search transactions')).toBeTruthy();
    expect(app.screen.getByRole('radio', { name: 'Content' }).props.accessibilityState.checked).toBe(true);
    expect(app.screen.queryByTestId('history-summary')).toBeNull();
    expect(app.screen.queryByText('Bayo Test')).toBeNull();
    // Bills are off (R-52): no chip, no bill words, no Pay a bill.
    expect(app.screen.queryByRole('radio', { name: 'Bills' })).toBeNull();
    expect(app.screen.queryByRole('button', { name: 'Pay a bill' })).toBeNull();
  });

  it('gives the other chips their own words', async () => {
    hubWith([TIP], { list: (ask) => pageOf(ask.query.get('filter') === 'all' ? [TIP] : []) });
    const app = await history();
    expect(await app.screen.findByText('Bayo Test')).toBeTruthy();
    for (const [chip, title] of [
      ['Money in', 'No money in yet'],
      ['Money out', 'No money out yet'],
      ['Content', 'No content sales yet'],
    ] as const) {
      await app.fireEvent.press(app.screen.getByRole('radio', { name: chip }));
      expect(await app.screen.findByText(title)).toBeTruthy();
      expect(app.screen.queryByRole('button', { name: 'Pay a bill' })).toBeNull();
    }
  });

  it('shows a wallet with no transactions at all as the first-use words, not W28', async () => {
    hubWith([], { list: () => pageOf([]) });
    const app = await history();
    expect(await app.screen.findByText('No transactions yet')).toBeTruthy();
    expect(app.screen.queryByRole('button', { name: 'Pay a bill' })).toBeNull();
  });
});

describe('W27 · Transaction detail', () => {
  it('a user sees a tip received: who, what it was on, to the Naira wallet, the date, the reference, Completed, and no charges', async () => {
    const app = await detail('tip-1');
    expect(await app.screen.findByTestId('detail-head')).toBeTruthy();
    expect(app.screen.getByText('Tip from Bayo Test')).toBeTruthy();
    expect(app.screen.getByLabelText('plus 3,100 naira')).toBeTruthy();
    expect(app.screen.getByText('Completed')).toBeTruthy();
    for (const [label, value] of [
      ['Type', 'Tip'],
      ['On', 'Framing a night shot'],
      ['From', 'Bayo Test'],
      ['To', 'Naira wallet'],
      ['Note', 'Thanks for the lesson'],
      ['Reference', 'REF-TIP-1'],
    ] as const) {
      expect(app.screen.getByText(label)).toBeTruthy();
      expect(app.screen.getByText(value)).toBeTruthy();
    }
    expect(app.screen.getByText('Date')).toBeTruthy();
    expect(app.screen.queryByTestId('detail-cost')).toBeNull();
    expect(app.screen.queryByText(/charge|fee/i)).toBeNull();
    expect(asked('/money/transactions/tip-1')).toHaveLength(1);
    // The canvas's own reference and names are never invented.
    expect(allText(app)).not.toMatch(/WAW-T1P9|Amaka|@amaka/);
  });

  it('a user sees a debit’s parts: the amount, the provider’s charge, WAWU’s fee and the total that left (BRIEF W27, R-10)', async () => {
    const app = await detail('send-1');
    expect(await app.screen.findByTestId('detail-cost')).toBeTruthy();
    expect(app.screen.getByText('Transfer to Ngozi Test')).toBeTruthy();
    expect(app.screen.getByLabelText('minus 17,084 naira')).toBeTruthy();
    const part = (key: string, label: string, spoken: string) => {
      const line = rtl.within(app.screen.getByTestId(`detail-cost-${key}`));
      expect(line.getByText(label)).toBeTruthy();
      expect(line.getByLabelText(spoken)).toBeTruthy();
    };
    part('amount', 'Amount', '17,000 naira');
    part('provider', "Bank charge", '53 naira');
    part('wawu', "WAWU's fee", '31 naira');
    part('total', 'Total', '17,084 naira');
    expect(app.screen.getByText('Test Bank ••5521')).toBeTruthy();
    expect(app.screen.getByText('From')).toBeTruthy();
    expect(app.screen.getByText('Naira wallet')).toBeTruthy();
  });

  it('leaves WAWU’s fee out when there is none, but keeps the provider’s charge at ₦0', async () => {
    const app = await detail('bill-1');
    expect(await app.screen.findByTestId('detail-cost')).toBeTruthy();
    expect(app.screen.queryByTestId('detail-cost-wawu')).toBeNull();
    expect(rtl.within(app.screen.getByTestId('detail-cost-provider')).getByText("Bank charge")).toBeTruthy();
    expect(rtl.within(app.screen.getByTestId('detail-cost-provider')).getByLabelText('0 naira')).toBeTruthy();
    expect(rtl.within(app.screen.getByTestId('detail-cost-total')).getByLabelText('4,500 naira')).toBeTruthy();
  });

  it('a user can copy the reference', async () => {
    const app = await detail('tip-1');
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Copy reference' }));
    expect(mockCopied).toEqual(['REF-TIP-1']);
    expect(await app.screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('a user can Share receipt: the phone’s share sheet is given the receipt’s text with its reference', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    const app = await detail('send-1');
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Share receipt' }));
    expect(share).toHaveBeenCalledTimes(1);
    const message = (share.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('Transfer to Ngozi Test');
    expect(message).toContain('Reference: REF-SEND-1');
    expect(message).toContain('Total: ₦17,084.00');
    expect(message).not.toContain('—');
    expect(app.screen.queryByTestId('detail-notice')).toBeNull();
  });

  it('says so, and stays put, when this phone cannot share', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no share sheet'));
    const app = await detail('tip-1');
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Share receipt' }));
    expect(await app.screen.findByTestId('detail-notice')).toBeTruthy();
    expect(app.screen.getByText('Sharing isn’t available on this device.')).toBeTruthy();
    expect(app.screen.getByText('Tip from Bayo Test')).toBeTruthy();
  });

  it('draws what is built: Back, Copy reference, Share receipt and Report a problem (SUPPORT-01 adds the last, as drawn)', async () => {
    const app = await detail('tip-1');
    expect(await app.screen.findByTestId('detail-head')).toBeTruthy();
    expect(buttonNames(app).sort()).toEqual(['Back', 'Copy reference', 'Report a problem', 'Share receipt']);
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Back' }));
    expect(handlers.onBack).toHaveBeenCalledTimes(1);
  });

  it('Report a problem opens the support chat with this transaction already attached (SUPPORT-01)', async () => {
    const app = await detail('tip-1');
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Report a problem' }));
    await app.waitFor(() => expect(mockPushed).toHaveLength(1));
    const asked = asks.filter((a) => a.method === 'POST' && a.path === '/support/thread');
    expect(asked).toHaveLength(1);
    expect(asked[0].body).toEqual({ reference: { kind: 'transaction', id: 'tip-1' } });
    expect(mockPushed).toEqual([{ pathname: '/chat/[id]', params: { id: SUPPORT_CHAT } }]);
  });

  it('a support chat the Hub refuses says so in its words, and the receipt stays (SUPPORT-01)', async () => {
    hubWith([TIP], { support: refusal(404, 'not_found', 'We could not find that payment.') });
    const app = await detail('tip-1');
    await app.fireEvent.press(await app.screen.findByRole('button', { name: 'Report a problem' }));
    expect(await app.screen.findByTestId('detail-notice')).toBeTruthy();
    expect(app.screen.getByText('We could not find that payment.')).toBeTruthy();
    expect(mockPushed).toEqual([]);
    expect(app.screen.getByText('Tip from Bayo Test')).toBeTruthy();
  });

  it('shows the status in words for a transaction that is not done', async () => {
    hubWith([{ ...SEND, status: 'pending' }]);
    const app = await detail('send-1');
    expect(await app.screen.findByText('Pending')).toBeTruthy();
    expect(app.screen.queryByText('Completed')).toBeNull();
  });

  it('a user can pull the receipt down to read it again, and sees what the bank has settled since', async () => {
    hubWith([{ ...SEND, status: 'pending' }]);
    const app = await detail('send-1');
    expect(await app.screen.findByText('Pending')).toBeTruthy();
    hubWith([SEND]);
    await app.act(async () => {
      await app.screen.getByTestId('detail-screen-scroll').props.refreshControl.props.onRefresh();
    });
    expect(await app.screen.findByText('Completed')).toBeTruthy();
    expect(app.screen.queryByText('Pending')).toBeNull();
    expect(asked('/money/transactions/send-1').length).toBeGreaterThanOrEqual(2);
  });

  it('says a transaction was not found in the server’s words, with nothing to share', async () => {
    const app = await detail('someone-elses');
    expect(await app.screen.findByTestId('detail-missing')).toBeTruthy();
    expect(app.screen.getByText('We couldn’t find that transaction')).toBeTruthy();
    expect(app.screen.getByText('We could not find that transaction.')).toBeTruthy();
    expect(app.screen.queryByRole('button', { name: 'Share receipt' })).toBeNull();
  });

  it('shows shapes while the Hub answers, and an error with Try again when it cannot be reached', async () => {
    answer = () => 'hold';
    const held = await detail('tip-1');
    expect(await held.screen.findByTestId('detail-loading')).toBeTruthy();
    expect(held.screen.queryByRole('button', { name: 'Share receipt' })).toBeNull();
    await held.cleanup();
    await (require('@/api/query') as typeof import('@/api/query')).queryClient.cancelQueries();
    (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();

    hubWith([TIP, SEND, BILL]);
    answer = ((inner) => (ask: Ask) => (ask.path.startsWith('/money/transactions/') ? 'offline' : inner(ask)))(answer);
    const app = await detail('tip-1');
    expect(await app.screen.findByTestId('detail-error')).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
  });

  it('refuses a transaction whose figures it cannot read, instead of drawing a zero', async () => {
    hubWith([{ ...SEND, fee: { providerFeeKobo: 'x', wawuFeeKobo: 1, totalFeeKobo: 1 } }]);
    const app = await detail('send-1');
    expect(await app.screen.findByTestId('detail-error')).toBeTruthy();
    expect(allText(app)).not.toContain('₦0');
  });

  it('leads a user with no wallet to Open your wallet', async () => {
    answer = () => refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const app = await detail('tip-1');
    expect(await app.screen.findByText("You don't have a wallet yet")).toBeTruthy();
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Open your wallet' }));
    expect(mockPushed).toEqual(['/open-wallet']);
  });
});
