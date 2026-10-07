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
/** Made-up account details in the server's shape (MONEY-12). Never a real account. */
const ACCOUNT = { accountNumber: '8123456789', accountName: 'Ada Eze', bankName: 'Loma Bank', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' };
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
  if (answer === 'hold') return new Promise<Response>(() => undefined);
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
const asked = (path: string) => sent.filter((s) => s.path === `/api/hub${path}`).length;

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });
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
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
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
    expect(app.screen.getByText('WAWU · Loma Bank')).toBeTruthy();
    expect(app.screen.getByText('812 345 6789')).toBeTruthy();
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

  it('shows no entry whose screen is not built yet: no Send, Add money, Swap, tabs, scan, settings, bills, card row or See all (R-41)', async () => {
    const app = await boot();
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    const text = allText(app);
    for (const word of ['Send', 'Add money', 'Dollar', 'Crypto', 'Airtime', 'Data', 'Power', 'More', 'WAWU card', 'See all']) {
      expect(text).not.toContain(`"${word}"`);
    }
    expect(app.screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Hide balance', 'Copy account number']);
  });

  it('a user can copy the account number: its digits as sent go on the clipboard', async () => {
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByTestId('wallet-copy'));
    expect(mockCopied).toEqual(['8123456789']);
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
    expect(app.screen.queryByText('812 345 6789')).toBeNull();
    expect(app.screen.queryByTestId('wallet-balance-card')).toBeNull();
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
    expect(app.screen.getByText('Send to 812 345 6789 from any Nigerian bank.')).toBeTruthy();
    expect(app.screen.queryByText('Transactions')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('wallet-copy'));
    expect(mockCopied).toEqual(['8123456789']);
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
    expect(app.screen.queryByText('812 345 6789')).toBeNull();
    expect(allText(app)).not.toContain('₦');
    // The bank's refusal is not retried behind the person's back: one ask, until they tap Try again.
    expect(asked('/money/wallet/balance')).toBe(1);
    await app.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByTestId('wallet-balance-card')).toBeTruthy();
    expect(asked('/money/wallet/balance')).toBe(2);
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

describe('the wallet read and the recent rows fail on their own', () => {
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

  it('after the account opens (A10), the tab shows the new account: W5', async () => {
    routes['GET /money/wallet'] = [wallet('not_open', null)];
    fallback['GET /money/wallet/balance'] = balance(0);
    fallback['GET /money/transactions'] = page([]);
    const app = await boot();
    await app.waitFor(() => expect(mockPushed).toHaveLength(1));
    await app.act(async () => setFocused(false));
    await app.act(async () => setFocused(true));
    expect(await app.screen.findByTestId('wallet-no-transactions')).toBeTruthy();
    expect(app.screen.getByText('Send to 812 345 6789 from any Nigerian bank.')).toBeTruthy();
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
