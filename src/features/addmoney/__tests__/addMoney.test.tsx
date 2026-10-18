/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Share, StyleSheet, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Add money (WALLET-05: W15, W45, W46) on the real Expo Router stack, with the Wallet tab's own Add money button, the shared pay
 * sheet's "Add" button and the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the Hub's
 * shapes: the wallet with its account, the bank's balance (one that the test moves, as a transfer landing would) and the ledger.
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
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
const Clipboard = jest.mocked(require('expo-clipboard') as typeof import('expo-clipboard'));

const ACCOUNT = { accountNumber: '8123456789', accountName: 'Lennox Emmanuel', bankName: 'Nuvion', bankCode: '000013', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-08T09:00:00.000Z' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

type Row = Record<string, unknown>;
const row = (id: string, over: Row = {}): Row => ({
  id,
  direction: 'in',
  category: 'top_up',
  status: 'completed',
  amountKobo: 5_000_000,
  fee: { providerFeeKobo: 0, wawuFeeKobo: 0, totalFeeKobo: 0 },
  totalKobo: 5_000_000,
  description: 'Bank transfer',
  counterparty: { kind: 'bank_account', name: 'Some Sender', avatarUrl: null, wawuUserId: null, bankName: 'GTBank', accountNumberLast4: '0921' },
  link: null,
  note: null,
  reference: 'NUV-82KQ-1Z7A',
  transferId: null,
  paymentId: null,
  group: null,
  createdAt: '2026-10-16T10:30:00.000Z',
  ...over,
});

const hub = {
  wallet: { state: 'open', account: ACCOUNT as typeof ACCOUNT | null } as Record<string, unknown>,
  walletStatus: 200,
  balanceKobo: 48_525_075,
  rows: [] as Row[],
  balanceReads: 0,
  ledgerReads: 0,
  ledgerFails: 0,
  /** Runs once at the start of the next ledger read: a transfer that lands between the balance read and the ledger read. */
  onLedger: null as (() => void) | null,
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/wallet') return hub.walletStatus === 200 ? ok(hub.wallet) : json(hub.walletStatus, { statusCode: hub.walletStatus, message: 'Something went wrong' });
  if (path === '/money/wallet/balance') {
    hub.balanceReads += 1;
    return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-16T10:00:00.000Z' });
  }
  if (path === '/money/transactions') {
    hub.ledgerReads += 1;
    const during = hub.onLedger;
    hub.onLedger = null;
    during?.();
    if (hub.ledgerFails > 0) {
      hub.ledgerFails -= 1;
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    return ok({ items: hub.rows, nextCursor: null });
  }
  return json(404, { statusCode: 404, message: `Not here: ${request.method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
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
/** The Wallet tab's own tile, built from the same list the tab builds, and a pay sheet's short "Add" that carries a shortfall. */
function WalletStandIn() {
  const router = useRouter();
  const { WalletActions } = require('@/features/wallet/home/WalletActions') as typeof import('@/features/wallet/home/WalletActions');
  const { addMoneyHref } = require('../entry') as typeof import('../entry');
  return (
    <View>
      <Text accessibilityRole="header">Wallet tab</Text>
      <WalletActions actions={[{ key: 'add-money', icon: 'Plus', label: 'Add money', onPress: () => router.push('/add-money'), accent: true }]} />
      <Text accessibilityRole="button" onPress={() => router.push(addMoneyHref(252_500))}>
        Add ₦2,525
      </Text>
    </View>
  );
}
function QuickAddMoney() {
  const { AddMoneyScreen } = require('../AddMoneyScreen') as typeof import('../AddMoneyScreen');
  const { shortfallOf } = require('../model') as typeof import('../model');
  const router = useRouter();
  const { short } = useLocalSearchParams<{ short?: string }>();
  return <AddMoneyScreen shortfallKobo={shortfallOf(short)} pollMs={20} onBack={() => router.back()} onDone={() => router.back()} />;
}

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    wallet: WalletStandIn,
    welcome: stub('Welcome'),
    'open-wallet': stub('Open your wallet'),
    'add-money': QuickAddMoney,
    'add-money-route': page('@/app/add-money'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { wallet: { state: 'open', account: ACCOUNT }, walletStatus: 200, balanceKobo: 48_525_075, rows: [], balanceReads: 0, ledgerReads: 0, ledgerFails: 0, onLedger: null });
  Clipboard.setStringAsync.mockClear();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f5'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
  jest.restoreAllMocks();
});
afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

async function toAddMoney() {
  await renderRouter(routes, { initialUrl: '/wallet' });
  await fireEvent.press(await screen.findByRole('button', { name: 'Add money' }));
  await screen.findByTestId('add-money-card');
}
/** Lets the polling timers run: the router test library fakes the clock, so time moves only when the test moves it. */
const tick = async (ms: number) => {
  for (let spent = 0; spent < ms; spent += 20) {
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
  }
};

describe('Add money (W15)', () => {
  it('a user taps Add money on the Wallet tab and sees their own account name, number and bank, each with Copy, and no fee claim', async () => {
    await toAddMoney();
    expect(pathname()).toBe('/add-money');
    expect(screen.getByTestId('add-money-name-value').props.children).toBe('Lennox Emmanuel');
    expect(screen.getByTestId('add-money-number-value').props.children).toBe('812 345 6789');
    expect(screen.getByTestId('add-money-bank-value').props.children).toBe('Nuvion');
    // The Hub serves no inflow fee and no arrival time, so the board's "Free" and "arrives in a few minutes" are not drawn (G-WALLET-05-5, -3).
    expect(screen.queryByText(/free/i)).toBeNull();
    expect(screen.queryByText(/few minutes/i)).toBeNull();
    expect(screen.queryByTestId('add-money-free')).toBeNull();
    expect(screen.queryByTestId('add-money-arrives')).toBeNull();
    for (const name of ['Copy account name', 'Copy account number', 'Copy bank name', 'Share details']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.getByText('Send money here from any Nigerian bank app.')).toBeTruthy();
  });

  it('draws nothing the board leaves out: no card, USSD, Dollar or bill entry, and no amount to type (R-42, R-16, R-52)', async () => {
    await toAddMoney();
    for (const name of [/card/i, /ussd/i, /dollar/i, /bill/i]) expect(screen.queryByText(name)).toBeNull();
    expect(screen.queryByRole('button', { name: /Add from/ })).toBeNull();
  });

  it('copies the number as the bank gave it, digits only, and starts waiting for the transfer (W45)', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('8123456789');
    expect(await screen.findByTestId('add-money-waiting')).toBeTruthy();
    expect(screen.getByText('Waiting for your transfer')).toBeTruthy();
    expect(screen.queryByText(/few minutes/i)).toBeNull();
    expect(screen.queryByText(/usually/i)).toBeNull();
  });

  it('shares the details through the phone’s share sheet (R-33) and waits; a dismissed sheet does not start the wait', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValueOnce({ action: Share.dismissedAction }).mockResolvedValueOnce({ action: Share.sharedAction });
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Share details' }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0]?.[0]?.message).toContain('Account number: 8123456789');
    expect(share.mock.calls[0]?.[0]?.message).toContain('Account name: Lennox Emmanuel');
    expect(screen.queryByTestId('add-money-waiting')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Share details' }));
    expect(await screen.findByTestId('add-money-waiting')).toBeTruthy();
  });

  it('says so when the share sheet is not there, and waits for nothing', async () => {
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('no sheet'));
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Share details' }));
    expect(await screen.findByText('Sharing isn’t available on this device.')).toBeTruthy();
    expect(screen.queryByTestId('add-money-waiting')).toBeNull();
  });

  it('names the shortfall a pay sheet carried here, in the sheet’s own words', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Add ₦2,525' }));
    expect(pathname()).toBe('/add-money');
    expect(await screen.findByTestId('add-money-short')).toBeTruthy();
    expect(screen.getByText('Top up at least ₦2,525')).toBeTruthy();
  });
});

describe('a transfer lands (W45 to W46)', () => {
  it('shows the amount, the sender, the new balance and the reference once, after the balance rises with a transfer on the ledger', async () => {
    await toAddMoney();
    hub.rows = [row('old', { amountKobo: 100_000, reference: 'OLD-1', createdAt: '2026-10-01T10:00:00.000Z' })];
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    // Nothing has moved: no landing, however long it waits.
    await tick(120);
    expect(screen.queryByTestId('add-money-received')).toBeNull();
    // The transfer lands: the bank's balance rises and the ledger has the row.
    hub.balanceKobo = 53_525_075;
    hub.rows = [row('new'), ...hub.rows];
    expect(await screen.findByTestId('add-money-received', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('received')).toBeTruthy();
    expect(screen.getByTestId('add-money-from').props.children).toBe('From GTBank ••0921');
    // SWEEP-APP-4 row 142: W46's head starts 120 under the status bar (the board's padding); the frame adds 8, so the body adds 112 (it added 20, about 90 too high).
    expect(StyleSheet.flatten(screen.getByTestId('add-money-received-body').props.style).paddingTop).toBe(112);
    expect(screen.getByText('NUV-82KQ-1Z7A')).toBeTruthy();
    expect(screen.getByText('New balance')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain('535,250');
    // It is said once: the wait is over, so the balance is not asked for again.
    const reads = hub.balanceReads;
    await tick(120);
    expect(hub.balanceReads).toBe(reads);
  });

  it('says how many landed and lists each, when two came close together, with no total of ours (L2)', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    // Two transfers land before the next read: the bank's balance holds both, and so does the ledger.
    hub.balanceKobo = 48_525_075 + 3_300_000;
    hub.rows = [
      row('b', { amountKobo: 2_200_000, totalKobo: 2_200_000, reference: 'NUV-BBBB', counterparty: { kind: 'bank_account', name: 'Ada', avatarUrl: null, wawuUserId: null, bankName: 'Access Bank', accountNumberLast4: '1122' } }),
      row('a', { amountKobo: 1_100_000, totalKobo: 1_100_000, reference: 'NUV-AAAA' }),
    ];
    expect(await screen.findByTestId('add-money-received', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('2 transfers received')).toBeTruthy();
    expect(screen.queryByTestId('add-money-amount')).toBeNull();
    expect(screen.queryByTestId('add-money-reference')).toBeNull();
    // Each row, newest first, with its own sender, amount and reference.
    expect(screen.getByText('From Access Bank ••1122')).toBeTruthy();
    expect(screen.getByText('From GTBank ••0921')).toBeTruthy();
    expect(screen.getByText('NUV-BBBB')).toBeTruthy();
    expect(screen.getByText('NUV-AAAA')).toBeTruthy();
    const drawn = JSON.stringify(screen.toJSON());
    expect(drawn).toContain('22,000');
    expect(drawn).toContain('11,000');
    // The new balance is the bank's; the two amounts are never added into a figure of ours.
    expect(drawn).toContain('518,250');
    expect(drawn).not.toContain('33,000');
  });

  it('a single landing is drawn as before: the amount, the sender and the reference, with no count', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    hub.balanceKobo = 53_525_075;
    hub.rows = [row('new')];
    await screen.findByTestId('add-money-received', undefined, { timeout: 4000 });
    expect(screen.queryByTestId('add-money-count')).toBeNull();
    expect(screen.queryByTestId('add-money-credits')).toBeNull();
    expect(screen.getByTestId('add-money-reference')).toBeTruthy();
  });

  it('shows a balance that holds every transfer it names, when a second lands between the balance read and the ledger read', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    hub.balanceKobo = 48_525_075 + 1_100_000;
    hub.rows = [row('a', { amountKobo: 1_100_000, totalKobo: 1_100_000, reference: 'NUV-AAAA' })];
    hub.onLedger = () => {
      hub.balanceKobo = 48_525_075 + 3_300_000;
      hub.rows = [row('b', { amountKobo: 2_200_000, totalKobo: 2_200_000, reference: 'NUV-BBBB' }), ...hub.rows];
    };
    expect(await screen.findByTestId('add-money-received', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('2 transfers received')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain('518,250');
  });

  it('does not call a rise with no transfer in on the ledger a landing (an earning), and keeps waiting for the real one', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    hub.balanceKobo = 48_625_075;
    hub.rows = [row('earn', { category: 'earning', description: 'Tip' })];
    await tick(150);
    expect(screen.queryByTestId('add-money-received')).toBeNull();
    hub.balanceKobo = 53_625_075;
    hub.rows = [row('top', { amountKobo: 5_000_000 }), ...hub.rows];
    expect(await screen.findByTestId('add-money-received', undefined, { timeout: 4000 })).toBeTruthy();
  });

  it('lands when the bank’s balance moves first and the Hub’s ledger row comes a little later, as it does in life', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    // The balance rises at once; the ledger has nothing yet, so it is not a landing.
    hub.balanceKobo = 53_525_075;
    await tick(200);
    expect(screen.queryByTestId('add-money-received')).toBeNull();
    // The Hub then writes the row, though the balance has not moved again: the landing is shown.
    hub.rows = [row('late')];
    expect(await screen.findByTestId('add-money-received', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('NUV-82KQ-1Z7A')).toBeTruthy();
  });

  it('does not take a top-up that was already on the ledger when the wait began for the one that lands', async () => {
    hub.rows = [row('had', { reference: 'HAD-1' })];
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    hub.balanceKobo = 49_525_075;
    await tick(150);
    expect(screen.queryByTestId('add-money-received')).toBeNull();
  });

  it('asks the ledger again when it could not be read, and does not lose the landing', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    hub.balanceKobo = 53_525_075;
    hub.rows = [row('new')];
    hub.ledgerFails = 2;
    expect(await screen.findByTestId('add-money-received', undefined, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('NUV-82KQ-1Z7A')).toBeTruthy();
  });

  it('Done goes back to where the person came from', async () => {
    await toAddMoney();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy account number' }));
    await screen.findByTestId('add-money-waiting');
    hub.balanceKobo = 53_525_075;
    hub.rows = [row('new')];
    await screen.findByTestId('add-money-received', undefined, { timeout: 4000 });
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });
});

describe('the states W15 stands in', () => {
  it('leads a person with no wallet to Open your wallet (R-6)', async () => {
    hub.wallet = { state: 'not_open', account: null };
    await renderRouter(routes, { initialUrl: '/add-money' });
    await waitFor(() => expect(pathname()).toBe('/open-wallet'));
  });

  it('says the account is being set up while the wallet is opening, with a way to check again', async () => {
    hub.wallet = { state: 'opening', account: null };
    await renderRouter(routes, { initialUrl: '/add-money' });
    expect(await screen.findByTestId('add-money-opening')).toBeTruthy();
    expect(screen.queryByTestId('add-money-card')).toBeNull();
    hub.wallet = { state: 'open', account: ACCOUNT };
    await fireEvent.press(screen.getByRole('button', { name: 'Check again' }));
    expect(await screen.findByTestId('add-money-card')).toBeTruthy();
  });

  it('shows an error with Try again when the account details cannot be read, and the card when they can', async () => {
    hub.walletStatus = 500;
    await renderRouter(routes, { initialUrl: '/add-money' });
    expect(await screen.findByTestId('add-money-error')).toBeTruthy();
    hub.walletStatus = 200;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('add-money-card')).toBeTruthy();
  });

  it('shows the loading shape while the account is read', async () => {
    await renderRouter(routes, { initialUrl: '/add-money' });
    expect(screen.queryByTestId('add-money-card')).toBeNull();
    expect(screen.getByTestId('add-money-loading')).toBeTruthy();
    expect(await screen.findByTestId('add-money-card')).toBeTruthy();
  });

  it('is behind sign-in: a signed-out visit goes to Welcome', async () => {
    mockVault.clear();
    session.resetSessionForTests();
    await renderRouter(routes, { initialUrl: '/add-money-route' });
    await waitFor(() => expect(pathname()).toBe('/welcome'));
  });
});
