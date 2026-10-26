/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockVault = new Map<string, string>();
const mockCopied: string[] = [];
const mockPushed: string[] = [];

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
// The tab is the screen in front, or covered by Open your wallet; a test moves that by hand.
let mockFocused = true;
const mockFocusListeners = new Set<() => void>();
const setFocused = (value: boolean) => {
  mockFocused = value;
  mockFocusListeners.forEach((listener) => listener());
};
jest.mock('expo-router', () => {
  const { useSyncExternalStore } = jest.requireActual('react') as typeof import('react');
  const router = { push: (path: string) => mockPushed.push(path) };
  return {
    useRouter: () => router,
    useIsFocused: () =>
      useSyncExternalStore(
        (listener: () => void) => {
          mockFocusListeners.add(listener);
          return () => mockFocusListeners.delete(listener);
        },
        () => mockFocused,
      ),
  };
});
jest.mock('@/features/open-wallet/copy', () => ({
  copyText: jest.fn(async (value: string) => {
    mockCopied.push(value);
    return true;
  }),
}));

type Reply = { status: number; body: unknown };
/** `late`: answered only once `after` settles, a read that is slow but does come back (a held one never does). */
type Late = { after: Promise<void>; reply: Reply };
type Answer = Reply | 'offline' | 'hold' | Late;

const OWNER = '00000000-0000-4000-8000-0000000000f1';
/** Made-up account details in the server's shape (MONEY-12), none of them the canvas's samples, so a screen that drew the canvas's figures would fail. Never a real account. */
const ACCOUNT = { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };
const pin = { isSet: true, changedAt: '2026-10-04T09:01:00.000Z', triesLeft: 5, lockedUntil: null };
const UNREACHABLE = 'We could not reach your account. Your money is safe. Try again in a moment.';

let sent: { method: string; path: string; query: string }[] = [];
let routes: Record<string, Answer[]> = {};
let fallback: Record<string, Answer> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, data: null, reason: { code, message } } });
const wallet = (state: string, account: unknown = ACCOUNT) =>
  ok({ state, account, limits: null, pin, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 });
const balance = (availableKobo: number) => ok({ availableKobo, asOf: '2026-10-07T09:00:00.000Z' });
const page = (items: unknown[]) => ok({ items, nextCursor: null });
/** The Hub's points for the person: 1,240, of which 400 end on 12 Jan (this year: the year is written only when it is not this one). */
const THIS_YEAR = new Date().getUTCFullYear();
const POINTS = { balance: 1240, nextExpiry: { points: 400, expiresAt: `${THIS_YEAR}-01-12T00:00:00.000Z` }, lots: [], lotCount: 0, movements: [] };

const fee = (provider: number, wawu: number) => ({ providerFeeKobo: provider, wawuFeeKobo: wawu, totalFeeKobo: provider + wawu });
const base = { link: null, note: null, transferId: null, paymentId: null, group: null, status: 'completed' };
const ROWS = [
  {
    ...base,
    id: 'r1',
    direction: 'in',
    category: 'earning',
    amountKobo: 200_000,
    fee: fee(0, 0),
    totalKobo: 200_000,
    description: 'Tip on your video',
    counterparty: { kind: 'wawu_user', name: 'Amaka Nwosu', avatarUrl: null, wawuUserId: 'u-7', bankName: null, accountNumberLast4: null },
    reference: 'WAW-T-1',
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    ...base,
    id: 'r2',
    direction: 'out',
    category: 'transfer',
    amountKobo: 2_500_000,
    fee: fee(4_000, 2_500),
    totalKobo: 2_506_500,
    description: 'Transfer · GTBank',
    counterparty: { kind: 'bank_account', name: 'Chidinma Okoro', avatarUrl: null, wawuUserId: null, bankName: 'GTBank', accountNumberLast4: '6789' },
    reference: 'WAW-T-2',
    createdAt: new Date(Date.now() - 120_000).toISOString(),
  },
];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  sent.push({ method: request.method, path: url.pathname, query: url.search });
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  // Held until the test ends: the cache's cancel aborts it, so nothing is left in flight.
  if (answer === 'hold')
    return new Promise<Response>((_resolve, reject) => {
      if (request.signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
      request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  const reply = 'after' in answer ? (await answer.after, answer.reply) : answer;
  return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

/** A read that answers when `release` is called. */
function later(reply: Reply) {
  let release!: () => void;
  const after = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { answer: { after, reply } satisfies Late, release };
}

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

async function boot() {
  const { WalletScreen } = require('../home/WalletScreen') as typeof import('../home/WalletScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WalletScreen />
    </SafeAreaProvider>,
  );
  return rtl;
}

/** Everything drawn, as text: the tree without its circular parts (the glow's SVG holds some). */
const allText = (app: Awaited<ReturnType<typeof boot>>) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(app.screen.toJSON(), (_key, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  });
};
/** The test ids drawn, in the order they stand on screen (the tree's order). */
const idsInOrder = (app: Awaited<ReturnType<typeof boot>>) => {
  const found: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as { props?: { testID?: unknown }; children?: unknown[] | null };
    if (typeof n.props?.testID === 'string') found.push(n.props.testID);
    n.children?.forEach(walk);
  };
  walk(app.screen.toJSON());
  return found;
};
const inOrder = (ids: string[], expected: string[]) => ids.filter((id) => expected.includes(id));
/** What the canvas draws for screens that are not built (R-47): none of it is drawn, whatever state the tab is in. The settings icon is built since WALLET-06 (W35) and is drawn in every state. */
const NOT_BUILT_BUTTONS = ['Scan to pay', 'Swap', 'WAWU card', 'Bills', 'Power', 'More', 'Airtime', 'Data', 'TV'];
/**
 * The actions that are built (DV2-02, the 16 Oct board): Add money and Withdraw (WALLET-05), Send (WALLET-02), Buy points (POINTS-06) and
 * To cash (POINTS-05), drawn when the wallet is open, in the board's order: all five columns.
 * There are no bills anywhere on the tab (R-52).
 */
const ACTION_TILES = ['Add money', 'Send', 'Withdraw', 'Buy points', 'To cash'];
const ACTION_KEYS = ['add-money', 'send', 'withdraw', 'buy-points', 'to-cash'];
/** The Points card, as a button: the Hub's own balance and the day the soonest points end (`POINTS` below). */
const POINTS_BUTTON = 'Points, 1,240 points, 400 end 12 Jan';
/** The Passes card is always drawn beside Points (owner, 26 Oct 2026, R-97); this suite gives it no pass, so it is the empty card. */
const PASSES_BUTTON = 'Passes, No event pass yet, Comes with Founding Maker';
const NOT_BUILT_IDS = [
  'wallet-scan', 'wallet-tabs', 'wallet-send', 'wallet-add-money', 'wallet-swap', 'wallet-card-row',
  'wallet-loading-bills', 'wallet-bills',
  'wallet-bill-power', 'wallet-bill-more', 'wallet-bill-airtime', 'wallet-bill-data', 'wallet-bill-tv',
];
/**
 * Fails when anything the Wallet tab has no screen for is drawn: a button, a tab, a tile or a row of them. See all and a row's
 * detail are built since WALLET-04 (W26 and W27), so they are drawn with the heading, which stands only when there are rows
 * (`rows`); W4, W5 and the states without a balance draw neither.
 */
const expectNothingUnbuilt = (app: Awaited<ReturnType<typeof boot>>, { rows = false }: { rows?: boolean } = {}) => {
  for (const name of NOT_BUILT_BUTTONS) expect(app.screen.queryByRole('button', { name })).toBeNull();
  for (const id of NOT_BUILT_IDS) expect(app.screen.queryByTestId(id)).toBeNull();
  expect(app.screen.queryAllByRole('tab')).toHaveLength(0);
  if (!rows) {
    expect(app.screen.queryByText('See all')).toBeNull();
    expect(app.screen.queryByTestId('wallet-see-all')).toBeNull();
  }
  expect(app.screen.queryByText(/Dollar|Crypto|Swap/)).toBeNull();
};
/** The names of every button on screen: what a person can press. */
const buttonNames = (app: Awaited<ReturnType<typeof boot>>) => app.screen.queryAllByRole('button').map((b) => b.props.accessibilityLabel as string);
/** A recent row is a button too (WALLET-04): its name is the row read aloud, so the lists below leave the two seeded rows out and count them apart. */
const ROW_BUTTON = /Amaka Nwosu|Chidinma Okoro/;
const apartFromRows = (names: string[]) => names.filter((name) => !ROW_BUTTON.test(name));
const rowButtons = (names: string[]) => names.filter((name) => ROW_BUTTON.test(name));
const asked = (path: string) => sent.filter((s) => s.path === `/api/hub${path}`).length;

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  // No retries, and no cache timer outliving a test (the app's 5 minute default kept jest alive, round 1 D3).
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  mockFocused = true;
  sent = [];
  routes = {};
  mockCopied.length = 0;
  mockPushed.length = 0;
  // A 390 phone, the canvas's width: the rows below size themselves from the window, and jest's own is 750.
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/wallet': wallet('open'),
    'GET /money/wallet/balance': balance(48_525_075),
    'GET /money/transactions': page(ROWS),
    'GET /me/points': ok(POINTS),
  };
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
});

// The app's one cache holds a timer per query until it is emptied; empty it so jest can exit.
afterAll(() => {
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('W1 · Wallet · Naira', () => {
  it('a user sees the bank’s balance with its kobo, "Who Made This? · " and the bank the Hub names, and their account number', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(app.screen.getByText('Naira balance')).toBeTruthy();
    expect(app.screen.getByLabelText('485,250 naira 75 kobo')).toBeTruthy();
    expect(app.screen.getByText('Who Made This? · Ekiti Trial MFB')).toBeTruthy();
    expect(app.screen.getByText('810 000 0417')).toBeTruthy();
    expect(allText(app)).not.toMatch(/Fintava|—/);
  });

  it('a user sees their recent transactions, a debit as the total that left the wallet', async () => {
    const app = await boot();
    expect(await app.screen.findByText('Transactions')).toBeTruthy();
    expect(app.screen.getByText('Amaka Nwosu')).toBeTruthy();
    expect(app.screen.getByText('Tip on your video')).toBeTruthy();
    expect(app.screen.getByLabelText('plus 2,000 naira')).toBeTruthy();
    expect(app.screen.getByLabelText('minus 25,065 naira')).toBeTruthy();
    expect(sent.find((s) => s.path.endsWith('/money/transactions'))?.query).toBe('?limit=3');
  });

  it('draws what is built on W1, in the board’s order: the bar, the card, Points, the actions, Transactions with its rows, and none of what has no screen yet (R-47)', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(app.screen.getByRole('header', { name: 'Wallet' })).toBeTruthy();
    expect(app.screen.getByText('Transactions')).toBeTruthy();
    const stands = ['wallet-bar', 'wallet-balance-card', 'wallet-info-row', 'wallet-points', 'wallet-actions', 'wallet-transactions', 'wallet-row-r1', 'wallet-row-r2'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    // Scan, the Dollar and Crypto tabs, Swap and the WAWU card row are not drawn; See all is, with the rows.
    expectNothingUnbuilt(app, { rows: true });
    expect(app.screen.getByText('See all')).toBeTruthy();
    // The canvas's one person's card details are not invented for anyone else: no digits, no status, no brand.
    expect(app.screen.queryByText(/4821|Physical|Active|Verve|LENNOX/)).toBeNull();
  });

  it('every button on W1 does something: the settings icon, the eye, Copy, the Points card, Add money, Send, Withdraw, Buy points, To cash, See all and the two rows, and each one works', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(await app.screen.findByText('Amaka Nwosu')).toBeTruthy();
    expect(apartFromRows(buttonNames(app)).sort()).toEqual([...ACTION_TILES, POINTS_BUTTON, PASSES_BUTTON, 'Copy account number', 'Hide balance', 'See all transactions', 'Wallet settings'].sort());
    expect(rowButtons(buttonNames(app))).toHaveLength(2);
    const asks = sent.length;
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Hide balance' }));
    expect(app.screen.getByLabelText('Balance hidden')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Show balance' }));
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Copy account number' }));
    expect(mockCopied).toEqual(['8100000417']);
    expect(mockPushed).toEqual([]);
    expect(sent.length).toBe(asks);
    // Add money (WALLET-05) opens W15, Send (WALLET-02) opens W7, Withdraw (WALLET-05) opens W17.
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Add money' }));
    expect(mockPushed).toEqual(['/add-money']);
    mockPushed.length = 0;
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Send' }));
    expect(mockPushed).toEqual(['/send']);
    mockPushed.length = 0;
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Withdraw' }));
    expect(mockPushed).toEqual(['/withdraw']);
    // Buy points (POINTS-06) opens PT4, To cash (POINTS-05) opens PT6, and the Points card opens Your points (PT5).
    mockPushed.length = 0;
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Buy points' }));
    expect(mockPushed).toEqual(['/points-buy']);
    mockPushed.length = 0;
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'To cash' }));
    expect(mockPushed).toEqual(['/points-convert']);
    mockPushed.length = 0;
    await app.fireEvent.press(app.screen.getByRole('button', { name: POINTS_BUTTON }));
    expect(mockPushed).toEqual(['/points']);
    expect(allText(app)).not.toMatch(/soon|not available|not built/i);
  });

  it('there are no bills anywhere on the tab: no Bills button, no bill tiles, no Bills word (R-52)', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    for (const name of ['Bills', 'Power', 'More', 'Airtime', 'Data', 'TV']) expect(app.screen.queryByRole('button', { name })).toBeNull();
    expect(app.screen.queryByTestId('wallet-bills')).toBeNull();
    expect(allText(app)).not.toMatch(/bill/i);
  });

  it('the actions sit in the board’s columns: packed from the left in its order, each column 16 wider than its square', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    const row = StyleSheet.flatten(app.screen.getByTestId('wallet-actions').props.style);
    expect(row.flexDirection).toBe('row');
    expect(row.justifyContent).toBe('flex-start');
    const ids = ACTION_KEYS.map((key) => `wallet-action-${key}`);
    expect(inOrder(idsInOrder(app), ids)).toEqual(ids);
    // On a 390 window the board's square is 54, so a column is 70 wide.
    for (const key of ACTION_KEYS) expect(StyleSheet.flatten(app.screen.getByTestId(`wallet-action-${key}`).props.style).width).toBe(70);
  });

  it('the five actions fill the row the way the board draws it, and none runs past the screen', async () => {
    Dimensions.set({ window: { width: 320, height: 740, scale: 2, fontScale: 1 } });
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    // 320 less the two gutters, over five columns, less 16: a 40 square in a 56 column (not 54 and 70).
    for (const key of ACTION_KEYS) expect(StyleSheet.flatten(app.screen.getByTestId(`wallet-action-${key}`).props.style).width).toBe(56);
  });

  it('the Points card shows the Hub’s balance as a count, with the soonest end, and never naira (W1)', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-points')).toBeTruthy();
    expect(app.screen.getByTestId('wallet-points-count')).toBeTruthy();
    expect(app.screen.getByText('1,240')).toBeTruthy();
    expect(app.screen.getByText('400 end 12 Jan')).toBeTruthy();
    expect(JSON.stringify(app.screen.getByTestId('wallet-points').props.accessibilityLabel)).not.toContain('₦');
  });

  it('a person with no points yet sees 0 and no end line, and a read that fails draws no Points card at all (never a 0 the Hub did not say)', async () => {
    fallback['GET /me/points'] = ok({ balance: 0, nextExpiry: null, lots: [], lotCount: 0, movements: [] });
    const first = await boot();
    expect(await first.screen.findByTestId('wallet-points')).toBeTruthy();
    expect(first.screen.getByText('0')).toBeTruthy();
    expect(first.screen.queryByTestId('wallet-points-ends')).toBeNull();
    await first.cleanup();
    fallback['GET /me/points'] = refusal(500, 'internal', 'Something went wrong.');
    const second = await boot();
    expect(await second.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await second.waitFor(() => expect(asked('/me/points')).toBeGreaterThan(0));
    expect(second.screen.queryByTestId('wallet-points')).toBeNull();
  });

  it('the Capital row is drawn only for a person who holds something, and opens Capital; Capital being on does not draw it (NUV-12, R-97)', async () => {
    const off = await boot();
    expect(await off.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await off.waitFor(() => expect(asked('/capital/availability')).toBeGreaterThan(0));
    expect(off.screen.queryByTestId('wallet-capital')).toBeNull();
    await off.cleanup();
    // Switched off and nothing held: no way in.
    fallback['GET /capital/availability'] = ok({ available: false, holding: false });
    const none = await boot();
    expect(await none.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await none.waitFor(() => expect(asked('/capital/availability')).toBeGreaterThan(1));
    expect(none.screen.queryByTestId('wallet-capital')).toBeNull();
    await none.cleanup();
    // The Hub takes orders (an admin switched Capital on) but the person holds nothing: still no row (R-97: WAWU offers no investments).
    fallback['GET /capital/availability'] = ok({ available: true, holding: false });
    const open = await boot();
    expect(await open.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await open.waitFor(() => expect(asked('/capital/availability')).toBeGreaterThan(2));
    expect(open.screen.queryByTestId('wallet-capital')).toBeNull();
    expect(open.screen.queryByTestId('wallet-capital-card')).toBeNull();
    expect(open.screen.queryByText(/Capital|fixed return|shares|invest/i)).toBeNull();
    expect(open.screen.queryByLabelText(/Capital|fixed return|shares|invest/i)).toBeNull();
    await open.cleanup();
    // Switched off but the person holds something: the way out stays, and it opens Capital.
    fallback['GET /capital/availability'] = ok({ available: false, holding: true });
    const holder = await boot();
    const row = await holder.screen.findByTestId('wallet-capital');
    expect(row).toBeTruthy();
    mockPushed.length = 0;
    rtl.fireEvent.press(row);
    expect(mockPushed).toEqual(['/capital']);
  });

  it('the Passes card sits in the one row with the Points card, the same size, whether or not the person has a pass (owner, 26 Oct 2026, R-97)', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-passes')).toBeTruthy();
    const row = app.screen.getByTestId('wallet-info-row');
    expect(rtl.within(row).getByTestId('wallet-points')).toBeTruthy();
    expect(rtl.within(row).getByTestId('wallet-passes')).toBeTruthy();
    expect(rtl.within(row).getByTestId('wallet-passes-name').props.children).toBe('No event pass yet');
    expect(rtl.within(row).getByTestId('wallet-passes-when').props.children).toBe('Comes with Founding Maker');
  });

  it('a transaction row says who, what, how much and when, and a user can tap it to open that transaction (W27)', async () => {
    const app = await boot();
    const row = await app.screen.findByTestId('wallet-row-r2');
    expect(row.props.accessibilityLabel).toContain('Chidinma Okoro');
    expect(row.props.accessibilityLabel).toContain('−₦25,065.00');
    for (const r of ROWS) {
      expect(app.screen.getByTestId(`wallet-row-${r.id}`).props.accessibilityRole).toBe('button');
    }
    await app.fireEvent.press(row);
    expect(mockPushed).toEqual([{ pathname: '/transactions/[id]', params: { id: 'r2' } }]);
  });

  it('a user can tap See all to open the history (W26), and it sits at the far end of the Transactions heading', async () => {
    const app = await boot();
    const seeAll = await app.screen.findByTestId('wallet-see-all');
    expect(seeAll.props.accessibilityLabel).toBe('See all transactions');
    expect(app.screen.getByRole('header', { name: 'Transactions' })).toBeTruthy();
    await app.fireEvent.press(seeAll);
    expect(mockPushed).toEqual(['/transactions']);
  });

  it('a user with no transactions yet sees no See all and no row to open (W5)', async () => {
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-see-all')).toBeNull();
    expect(app.screen.queryByRole('button', { name: 'See all transactions' })).toBeNull();
  });

  it('a user can copy the account number: its digits as sent go on the clipboard', async () => {
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('wallet-copy'));
    expect(mockCopied).toEqual(['8100000417']);
    expect(await app.screen.findByText('Copied')).toBeTruthy();
  });

  it('a user can hide the balance and show it again', async () => {
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('wallet-balance-eye'));
    expect(app.screen.getByLabelText('Balance hidden')).toBeTruthy();
    expect(app.screen.queryByLabelText('485,250 naira 75 kobo')).toBeNull();
    await app.fireEvent.press(app.screen.getByLabelText('Show balance'));
    expect(app.screen.getByLabelText('485,250 naira 75 kobo')).toBeTruthy();
  });

  it('asks the bank again each time the tab comes back into view', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    const before = asked('/money/wallet/balance');
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    await app.waitFor(() => expect(asked('/money/wallet/balance')).toBe(before + 1));
  });
});

describe('W4 · Wallet · loading', () => {
  it('shows the skeleton, and not the account number, until the balance is in', async () => {
    routes['GET /money/wallet/balance'] = ['hold'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-loading')).toBeTruthy();
    await app.waitFor(() => expect(asked('/money/wallet/balance')).toBe(1));
    expect(app.screen.getByTestId('wallet-loading')).toBeTruthy();
    expect(app.screen.queryByText('810 000 0417')).toBeNull();
    expect(app.screen.queryByTestId('wallet-balance-card')).toBeNull();
  });

  it('draws W4 for what is built: the bar, then the tab-pill row (the tabs are built, WALLET-21), the shapes of the card, the Points card, the five actions and three rows, and no scan icon (R-47; round 1)', async () => {
    routes['GET /money/wallet/balance'] = ['hold'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-loading')).toBeTruthy();
    expect(app.screen.getByRole('header', { name: 'Wallet' })).toBeTruthy();
    for (const id of ['wallet-loading-tabs', 'wallet-loading-card', 'wallet-loading-points', 'wallet-loading-actions', 'wallet-loading-rows']) {
      expect(app.screen.getByTestId(id)).toBeTruthy();
    }
    expect(app.screen.getByTestId('wallet-loading-rows').children).toHaveLength(3);
    expect(app.screen.getByTestId('wallet-loading-actions').children).toHaveLength(5);
    const stands = ['wallet-bar', 'wallet-loading-tabs', 'wallet-loading-card', 'wallet-loading-points', 'wallet-loading-actions', 'wallet-loading-rows'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    expectNothingUnbuilt(app);
    // Quiet shapes, not the real entries: only the bar's settings icon to press, and no word of the account.
    expect(buttonNames(app)).toEqual(['Wallet settings']);
    expect(app.screen.queryByText('Naira')).toBeNull();
  });
});

describe('W5 · Wallet · new account', () => {
  it('a user with a new account sees ₦0.00, their number ready to share, and how to fund it', async () => {
    fallback['GET /money/wallet/balance'] = balance(0);
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    expect(app.screen.getByLabelText('0 naira')).toBeTruthy();
    expect(app.screen.getByText('No transactions yet')).toBeTruthy();
    expect(app.screen.getByText('Send to 810 000 0417 from any Nigerian bank.')).toBeTruthy();
    expect(app.screen.queryByText('Transactions')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('wallet-copy'));
    expect(mockCopied).toEqual(['8100000417']);
  });

  it('draws what is built on W5: the bar, the card, Points, the actions, then the empty card, and no tab, card row or See all (R-47)', async () => {
    fallback['GET /money/wallet/balance'] = balance(0);
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    const stands = ['wallet-bar', 'wallet-balance-card', 'wallet-points', 'wallet-actions', 'wallet-no-transactions'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    expectNothingUnbuilt(app);
    expect(buttonNames(app).sort()).toEqual([...ACTION_TILES, POINTS_BUTTON, PASSES_BUTTON, 'Copy account number', 'Hide balance', 'Wallet settings'].sort());
  });
});

describe('W6 · Wallet · can’t reach account', () => {
  it('shows no balance and no number when the bank does not answer, with the board’s line (never the server’s words), and Try again asks again', async () => {
    routes['GET /money/wallet/balance'] = [refusal(503, 'provider_unreachable', UNREACHABLE)];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-unreachable')).toBeTruthy();
    expect(app.screen.getByText("We couldn't reach your account")).toBeTruthy();
    expect(app.screen.getByText('Your money is safe. This is a connection problem between us and the bank.')).toBeTruthy();
    expect(app.screen.queryByText(UNREACHABLE)).toBeNull();
    expect(app.screen.queryByTestId('wallet-balance-card')).toBeNull();
    expect(app.screen.queryByText('810 000 0417')).toBeNull();
    expect(allText(app)).not.toContain('₦');
    // The bank's refusal is not retried behind the person's back: one ask, until they tap Try again.
    expect(asked('/money/wallet/balance')).toBe(1);
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(asked('/money/wallet/balance')).toBe(2);
  });

  it('draws what is built on W6: the bar, then the card with its words and Try again, and no balance, tab or bills (R-47)', async () => {
    routes['GET /money/wallet/balance'] = [refusal(503, 'provider_unreachable', UNREACHABLE)];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-unreachable')).toBeTruthy();
    const stands = ['wallet-bar', 'wallet-unreachable'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    expect(buttonNames(app)).toEqual(['Wallet settings', 'Try again']);
    expect(app.screen.queryByTestId('wallet-balance-card')).toBeNull();
    expectNothingUnbuilt(app);
  });

  it('a frozen wallet says so in the server’s words', async () => {
    fallback['GET /money/wallet/balance'] = refusal(423, 'wallet_frozen', 'Your wallet is frozen. Contact support.');
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-frozen')).toBeTruthy();
    expect(app.screen.getByText('Your wallet is frozen. Contact support.')).toBeTruthy();
  });

  it('a balance the app cannot read is an error with Try again, never a 0', async () => {
    fallback['GET /money/wallet/balance'] = ok({ asOf: '2026-10-07T09:00:00.000Z' });
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-error')).toBeTruthy();
    expect(allText(app)).not.toContain('₦0');
  });
});

describe('every state without a balance draws the bar and its card, and nothing that does nothing (R-47)', () => {
  const drawn = (app: Awaited<ReturnType<typeof boot>>, only: string[]) => {
    expect(app.screen.getByRole('header', { name: 'Wallet' })).toBeTruthy();
    expect(app.screen.getByTestId('wallet-bar')).toBeTruthy();
    expectNothingUnbuilt(app);
    // Every button is the bar's settings icon or the state's own (it asks again or opens Open your wallet).
    expect(buttonNames(app)).toEqual(['Wallet settings', ...only]);
  };

  it('no wallet', async () => {
    fallback['GET /money/wallet'] = wallet('not_open', null);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-none')).toBeTruthy();
    drawn(app, ['Open your wallet']);
  });

  it('the account is opening', async () => {
    fallback['GET /money/wallet'] = wallet('opening', null);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-opening')).toBeTruthy();
    drawn(app, ['Check again']);
  });

  it('the wallet is frozen', async () => {
    fallback['GET /money/wallet/balance'] = refusal(423, 'wallet_frozen', 'Your wallet is frozen. Contact support.');
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-frozen')).toBeTruthy();
    drawn(app, ['Try again']);
  });

  it('the wallet read fails', async () => {
    routes['GET /money/wallet'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-error')).toBeTruthy();
    drawn(app, ['Try again']);
  });

  it('the balance cannot be read', async () => {
    fallback['GET /money/wallet/balance'] = ok({ asOf: '2026-10-07T09:00:00.000Z' });
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-error')).toBeTruthy();
    drawn(app, ['Try again']);
  });
});

describe('the wallet read and the recent rows fail on their own', () => {
  it('an open wallet whose account comes without its bank name is an error, never half a card', async () => {
    fallback['GET /money/wallet'] = wallet('open', { ...ACCOUNT, bankName: '' });
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-error')).toBeTruthy();
    expect(app.screen.getByText('Your wallet could not be read. Try again.')).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-balance-card')).toBeNull();
    expect(app.screen.queryByText('810 000 0417')).toBeNull();
  });

  it('no connection on the wallet read: an error with Try again, which reads again', async () => {
    routes['GET /money/wallet'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-error')).toBeTruthy();
    expect(app.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
  });

  it('recent rows that fail keep the balance on screen, with their own Try again', async () => {
    routes['GET /money/transactions'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-transactions-error')).toBeTruthy();
    expect(app.screen.getByTestId('wallet-balance-card')).toBeTruthy();
    // A failed read does not say there are no rows: W1's layout stays and only the rows give way.
    expect(app.screen.getByText('Transactions')).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-transactions-loading')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('wallet-transactions-retry'));
    expect(await app.screen.findByText('Amaka Nwosu')).toBeTruthy();
  });
});

describe('no wallet yet (R-6)', () => {
  it('a user with no wallet who taps the Wallet tab lands in Open your wallet (A26), once', async () => {
    fallback['GET /money/wallet'] = wallet('not_open', null);
    const app = await boot();
    await app.waitFor(() => expect(mockPushed).toEqual(['/open-wallet']));
    expect(asked('/money/wallet/balance')).toBe(0);
    expect(asked('/money/transactions')).toBe(0);
  });

  it('coming back without opening one stays on the tab with the way in; the next visit opens A26 again', async () => {
    fallback['GET /money/wallet'] = wallet('not_open', null);
    const app = await boot();
    await app.waitFor(() => expect(mockPushed).toHaveLength(1));
    // A26 covers the tab, then its Back uncovers it.
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    expect(await app.screen.findByTestId('wallet-none')).toBeTruthy();
    expect(mockPushed).toHaveLength(1);
    await app.fireEvent.press(app.screen.getByText('Open your wallet'));
    expect(mockPushed).toEqual(['/open-wallet', '/open-wallet']);
    // Back again, then away to another tab and back: a new visit.
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    await app.waitFor(() => expect(mockPushed).toHaveLength(3));
  });

  it('a Back from the A26 the card’s Open your wallet opened lands on the tab, every time (round 1 D1)', async () => {
    fallback['GET /money/wallet'] = wallet('not_open', null);
    const app = await boot();
    await app.waitFor(() => expect(mockPushed).toHaveLength(1));
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    expect(await app.screen.findByTestId('wallet-none')).toBeTruthy();
    for (const opened of [2, 3]) {
      await app.fireEvent.press(app.screen.getByText('Open your wallet'));
      expect(mockPushed).toHaveLength(opened);
      // A26 covers the tab, then its Back uncovers it: only Back, nothing else.
      await app.act(async () => setFocused(false));
      await app.act(async () => setFocused(true));
      await app.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });
      expect(mockPushed).toHaveLength(opened);
      expect(app.screen.getByTestId('wallet-none')).toBeTruthy();
    }
  });

  it('after the account opens (A10), the tab shows the new account: W5', async () => {
    routes['GET /money/wallet'] = [wallet('not_open', null)];
    fallback['GET /money/wallet/balance'] = balance(0);
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    await app.waitFor(() => expect(mockPushed).toHaveLength(1));
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    expect(app.screen.getByText('Send to 810 000 0417 from any Nigerian bank.')).toBeTruthy();
    expect(mockPushed).toHaveLength(1);
  });

  it('while the bank is still making the account, the tab says so and can check again', async () => {
    routes['GET /money/wallet'] = [wallet('opening', null)];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-opening')).toBeTruthy();
    expect(app.screen.getByText('Your account is opening')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Check again'));
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(mockPushed).toEqual([]);
  });
});

describe('W1 · the recent rows while their read is out (round 2, defect 2)', () => {
  const during = (app: Awaited<ReturnType<typeof boot>>) => {
    // Everything the balance read decides is drawn ...
    for (const id of ['wallet-bar', 'wallet-balance-card']) expect(app.screen.getByTestId(id)).toBeTruthy();
    // ... and W4's shapes stand where the heading and the rows will, as if there were none of them.
    expect(app.screen.getByTestId('wallet-transactions-loading')).toBeTruthy();
    const shapes = app.screen.getByTestId('wallet-transactions-loading').children[0];
    expect(typeof shapes === 'string' ? [] : shapes.children).toHaveLength(3);
    expect(app.screen.queryByTestId('wallet-transactions')).toBeNull();
    expect(app.screen.queryByText('Transactions')).toBeNull();
    expect(app.screen.queryByTestId('wallet-no-transactions')).toBeNull();
    expectNothingUnbuilt(app);
  };

  it('a new account whose rows are slow sees W4’s shapes, then W5, and the heading never appears', async () => {
    fallback['GET /money/wallet/balance'] = balance(0);
    const slow = later(page([]));
    routes['GET /money/transactions'] = [slow.answer];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await app.waitFor(() => expect(asked('/money/transactions')).toBe(1));
    during(app);
    // Still out after the screen has had time to settle on its own.
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    during(app);
    await app.act(async () => slow.release());
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-transactions-loading')).toBeNull();
    expect(app.screen.queryByText('Transactions')).toBeNull();
  });

  it('an account with transactions and slow rows sees W4’s shapes, then W1 with the heading and the rows', async () => {
    const slow = later(page(ROWS));
    routes['GET /money/transactions'] = [slow.answer];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await app.waitFor(() => expect(asked('/money/transactions')).toBe(1));
    during(app);
    await app.act(async () => slow.release());
    expect(await app.screen.findByText('Amaka Nwosu')).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-transactions-loading')).toBeNull();
    const stands = ['wallet-balance-card', 'wallet-actions', 'wallet-transactions', 'wallet-row-r1'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    expectNothingUnbuilt(app, { rows: true });
  });

  it('a refresh keeps the rows on screen while it asks again, and never goes back to the shapes', async () => {
    const app = await boot();
    expect(await app.screen.findByText('Amaka Nwosu')).toBeTruthy();
    const slow = later(page(ROWS));
    routes['GET /money/transactions'] = [slow.answer];
    const before = asked('/money/transactions');
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    await app.waitFor(() => expect(asked('/money/transactions')).toBe(before + 1));
    expect(app.screen.getByText('Amaka Nwosu')).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-transactions-loading')).toBeNull();
    await app.act(async () => {
      slow.release();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.screen.getByText('Amaka Nwosu')).toBeTruthy();
  });
});

describe('a narrow phone: nothing on the tab runs past the screen between 320 and 430', () => {
  const narrow = (width: number) => Dimensions.set({ window: { width, height: 740, scale: 2, fontScale: 1 } });

  it.each([320, 360, 390, 430])('at %i the bar, the card, Points, the actions and the rows stand and no tab is drawn', async (width) => {
    narrow(width);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(await app.screen.findByText('Amaka Nwosu')).toBeTruthy();
    const stands = ['wallet-bar', 'wallet-balance-card', 'wallet-points', 'wallet-actions', 'wallet-transactions', 'wallet-row-r1', 'wallet-row-r2'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    expectNothingUnbuilt(app, { rows: true });
    // The settings icon, the card's own two buttons, the Points card, the two actions, See all and the two rows are the only ones pressable.
    expect(apartFromRows(buttonNames(app)).sort()).toEqual([...ACTION_TILES, POINTS_BUTTON, PASSES_BUTTON, 'Copy account number', 'Hide balance', 'See all transactions', 'Wallet settings'].sort());
    expect(rowButtons(buttonNames(app))).toHaveLength(2);
  });

  it('the loading shapes are the bar, the card, the Points card, five actions and three rows at 320, and nothing else', async () => {
    narrow(320);
    routes['GET /money/wallet/balance'] = ['hold'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-loading')).toBeTruthy();
    await app.waitFor(() => expect(asked('/money/wallet/balance')).toBe(1));
    // Let the other reads land too, inside act, so none answers after the test.
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(app.screen.getByTestId('wallet-loading-rows').children).toHaveLength(3);
    expect(app.screen.getByTestId('wallet-loading-actions').children).toHaveLength(5);
    expectNothingUnbuilt(app);
  });
});

// FIX-100 #7 (U3b): the account landed while the tab said "Your account is opening", W1 drew with no PIN set, and nothing asked for one.
describe('W1 · an open wallet with no PIN leads to Create your transaction PIN', () => {
  const noPin = (state = 'open') =>
    ok({ state, account: ACCOUNT, limits: null, pin: { ...pin, isSet: false, changedAt: null }, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 });

  it('the tab opens A8 (the open account, with "Create your transaction PIN") once, and Back from it stays on the tab', async () => {
    mockVault.set('wawu.session.access', tokenFor('pin-nudge-owner-1'));
    fallback['GET /money/wallet'] = noPin();
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await app.waitFor(() => expect(mockPushed).toEqual(['/open-wallet-account']));
    // Back from A8 (the tab goes out of view and comes back) does not lead there again.
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(mockPushed).toEqual(['/open-wallet-account']);
  });

  it('an account still opening is not led anywhere, and the PIN step comes when it lands', async () => {
    mockVault.set('wawu.session.access', tokenFor('pin-nudge-owner-2'));
    routes['GET /money/wallet'] = [wallet('opening', null), noPin()];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-opening')).toBeTruthy();
    expect(mockPushed).toEqual([]);
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Check again' }));
    await app.waitFor(() => expect(mockPushed).toEqual(['/open-wallet-account']));
  });

  it('a wallet with its PIN set is not led anywhere', async () => {
    mockVault.set('wawu.session.access', tokenFor('pin-nudge-owner-3'));
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    await app.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(mockPushed).toEqual([]);
  });
});
