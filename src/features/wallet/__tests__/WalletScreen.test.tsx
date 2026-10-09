/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
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
type Answer = Reply | 'offline' | 'hold';

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
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

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
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /money/wallet': wallet('open'),
    'GET /money/wallet/balance': balance(48_525_075),
    'GET /money/transactions': page(ROWS),
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
  it('a user sees the bank’s balance with its kobo, "WAWU · " and the bank the server names, and their account number', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(app.screen.getByText('Naira balance')).toBeTruthy();
    expect(app.screen.getByLabelText('485,250 naira 75 kobo')).toBeTruthy();
    expect(app.screen.getByText('WAWU · Ekiti Trial MFB')).toBeTruthy();
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

  it('draws every element W1 draws, in the canvas order: the bar, the tabs, the card, the actions, the bills, the WAWU card row, Transactions with See all', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(app.screen.getByRole('header', { name: 'Wallet' })).toBeTruthy();
    for (const name of ['Scan to pay', 'Wallet settings', 'Send', 'Add money', 'Swap', 'Airtime', 'Data', 'Power', 'TV', 'More', 'WAWU card', 'See all transactions']) {
      expect(app.screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(app.screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual(['Naira', 'Dollar', 'Crypto']);
    expect(app.screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(true);
    expect(app.screen.getByTestId('wallet-card-picture')).toBeTruthy();
    expect(app.screen.getByText('Transactions')).toBeTruthy();
    const stands = ['wallet-bar', 'wallet-tabs', 'wallet-balance-card', 'wallet-actions', 'wallet-bills', 'wallet-card-row', 'wallet-transactions', 'wallet-see-all', 'wallet-row-r1'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    // The canvas's one person's card details are not invented for anyone else: no digits, no status, no brand.
    expect(app.screen.queryByText(/4821|Physical|Active|Verve|LENNOX/)).toBeNull();
  });

  it('a user can tap every entry whose screen is not built (scan, settings, Dollar, Crypto, Send, Add money, Swap, each bill, the card row, See all, a row) and nothing opens, changes or is asked', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    const asks = sent.length;
    const before = allText(app);
    const entries: [string, string][] = [
      ['button', 'Scan to pay'],
      ['button', 'Wallet settings'],
      ['tab', 'Dollar'],
      ['tab', 'Crypto'],
      ['tab', 'Naira'],
      ['button', 'Send'],
      ['button', 'Add money'],
      ['button', 'Swap'],
      ['button', 'Airtime'],
      ['button', 'Data'],
      ['button', 'Power'],
      ['button', 'TV'],
      ['button', 'More'],
      ['button', 'WAWU card'],
      ['button', 'See all transactions'],
    ];
    for (const [role, name] of entries) {
      await app.fireEvent.press(app.screen.getByRole(role, { name }));
    }
    for (const row of ROWS) await app.fireEvent.press(app.screen.getByTestId(`wallet-row-${row.id}`));
    expect(mockPushed).toEqual([]);
    expect(sent.length).toBe(asks);
    expect(sent.every((s) => s.method === 'GET')).toBe(true);
    expect(app.screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(true);
    expect(app.screen.getByRole('tab', { name: 'Dollar' }).props.accessibilityState.selected).toBe(false);
    expect(app.screen.getByRole('tab', { name: 'Crypto' }).props.accessibilityState.selected).toBe(false);
    expect(allText(app)).toBe(before);
    expect(allText(app)).not.toMatch(/soon|not available|not built/i);
  });

  it('a transaction row is a button that says who, what, how much and when, and its detail is not built yet', async () => {
    const app = await boot();
    const row = await app.screen.findByTestId('wallet-row-r2');
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toContain('Chidinma Okoro');
    expect(row.props.accessibilityLabel).toContain('−₦25,065.00');
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

  it('draws the whole of W4: the live bar, then the shapes of the tabs, the card, the actions, five bills tiles and three rows', async () => {
    routes['GET /money/wallet/balance'] = ['hold'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-loading')).toBeTruthy();
    expect(app.screen.getByRole('header', { name: 'Wallet' })).toBeTruthy();
    expect(app.screen.getByRole('button', { name: 'Scan to pay' })).toBeTruthy();
    expect(app.screen.getByRole('button', { name: 'Wallet settings' })).toBeTruthy();
    for (const id of ['wallet-loading-tabs', 'wallet-loading-card', 'wallet-loading-actions', 'wallet-loading-bills', 'wallet-loading-rows']) {
      expect(app.screen.getByTestId(id)).toBeTruthy();
    }
    expect(app.screen.getByTestId('wallet-loading-actions').children).toHaveLength(3);
    expect(app.screen.getByTestId('wallet-loading-bills').children).toHaveLength(5);
    expect(app.screen.getByTestId('wallet-loading-rows').children).toHaveLength(3);
    // Quiet shapes, not the real entries: nothing to tap but the bar, and no word of the account.
    expect(app.screen.queryByText('Send')).toBeNull();
    expect(app.screen.queryByText('Airtime')).toBeNull();
    expect(app.screen.queryByText('Naira')).toBeNull();
    // The bar's buttons are live (drawn, inert): pressing one opens nothing.
    await app.fireEvent.press(app.screen.getByRole('button', { name: 'Wallet settings' }));
    expect(mockPushed).toEqual([]);
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

  it('draws every element W5 draws: the bar, the tabs, the card, Send, Add money, Swap and the bills, then the empty card, and no card row or See all', async () => {
    fallback['GET /money/wallet/balance'] = balance(0);
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    for (const name of ['Scan to pay', 'Wallet settings', 'Send', 'Add money', 'Swap', 'Airtime', 'Data', 'Power', 'TV', 'More']) {
      expect(app.screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(app.screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual(['Naira', 'Dollar', 'Crypto']);
    expect(app.screen.queryByRole('button', { name: 'WAWU card' })).toBeNull();
    expect(app.screen.queryByRole('button', { name: 'See all transactions' })).toBeNull();
    const stands = ['wallet-bar', 'wallet-tabs', 'wallet-balance-card', 'wallet-actions', 'wallet-bills', 'wallet-no-transactions'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
  });

  it('a new account’s Send, Add money and Swap open nothing and ask nothing', async () => {
    fallback['GET /money/wallet/balance'] = balance(0);
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    const asks = sent.length;
    for (const name of ['Send', 'Add money', 'Swap']) await app.fireEvent.press(app.screen.getByRole('button', { name }));
    expect(mockPushed).toEqual([]);
    expect(sent.length).toBe(asks);
  });
});

describe('W6 · Wallet · can’t reach account', () => {
  it('shows no balance and no number when the bank does not answer, with the server’s sentence, and Try again asks again', async () => {
    routes['GET /money/wallet/balance'] = [refusal(503, 'provider_unreachable', UNREACHABLE)];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-unreachable')).toBeTruthy();
    expect(app.screen.getByText("We couldn't reach your account")).toBeTruthy();
    expect(app.screen.getByText(UNREACHABLE)).toBeTruthy();
    expect(app.screen.queryByTestId('wallet-balance-card')).toBeNull();
    expect(app.screen.queryByText('810 000 0417')).toBeNull();
    expect(allText(app)).not.toContain('₦');
    // The bank's refusal is not retried behind the person's back: one ask, until they tap Try again.
    expect(asked('/money/wallet/balance')).toBe(1);
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(asked('/money/wallet/balance')).toBe(2);
  });

  it('draws every element W6 draws: the bar, the tabs, the card with its words and Try again, and the bills, but no balance, Send or Add money', async () => {
    routes['GET /money/wallet/balance'] = [refusal(503, 'provider_unreachable', UNREACHABLE)];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-unreachable')).toBeTruthy();
    for (const name of ['Scan to pay', 'Wallet settings', 'Airtime', 'Data', 'Power', 'TV', 'More', 'Try again']) {
      expect(app.screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(app.screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual(['Naira', 'Dollar', 'Crypto']);
    for (const name of ['Send', 'Add money', 'Swap', 'WAWU card', 'See all transactions']) {
      expect(app.screen.queryByRole('button', { name })).toBeNull();
    }
    const stands = ['wallet-bar', 'wallet-tabs', 'wallet-unreachable', 'wallet-bills'];
    expect(inOrder(idsInOrder(app), stands)).toEqual(stands);
    // The bills and the tabs are drawn and inert here too.
    for (const name of ['Airtime', 'More']) await app.fireEvent.press(app.screen.getByRole('button', { name }));
    await app.fireEvent.press(app.screen.getByRole('tab', { name: 'Crypto' }));
    expect(mockPushed).toEqual([]);
    expect(app.screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(true);
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

describe('every state without a balance still draws the bar, the tabs and the bills (R-46)', () => {
  const drawn = (app: Awaited<ReturnType<typeof boot>>) => {
    for (const name of ['Scan to pay', 'Wallet settings', 'Airtime', 'More']) expect(app.screen.getByRole('button', { name })).toBeTruthy();
    expect(app.screen.getAllByRole('tab')).toHaveLength(3);
  };

  it('no wallet', async () => {
    fallback['GET /money/wallet'] = wallet('not_open', null);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-none')).toBeTruthy();
    drawn(app);
  });

  it('the account is opening', async () => {
    fallback['GET /money/wallet'] = wallet('opening', null);
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-opening')).toBeTruthy();
    drawn(app);
  });

  it('the wallet is frozen', async () => {
    fallback['GET /money/wallet/balance'] = refusal(423, 'wallet_frozen', 'Your wallet is frozen. Contact support.');
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-frozen')).toBeTruthy();
    drawn(app);
  });

  it('the wallet read fails', async () => {
    routes['GET /money/wallet'] = ['offline'];
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-error')).toBeTruthy();
    drawn(app);
  });

  it('the balance cannot be read', async () => {
    fallback['GET /money/wallet/balance'] = ok({ asOf: '2026-10-07T09:00:00.000Z' });
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-error')).toBeTruthy();
    drawn(app);
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
