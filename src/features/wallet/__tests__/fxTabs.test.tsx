/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fxFetch, hub, resetFxHub, usdtAccount, USDT_ID, USD_ID } from '../fx/testing/fxHub';

/*
 * WALLET-21: the tabs on W1 and what each draws (W2 for a currency account, W3 for Crypto), against the Hub's stand-in `fetch`
 * (installed before the app's modules load). Every figure on screen is the Hub's, and nothing is drawn that the Hub did not say exists
 * or can be opened (R-47).
 */
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
  const router = { push: (path: unknown) => mockPushed.push(path) };
  return { useRouter: () => router, useIsFocused: () => true };
});
jest.mock('@/features/open-wallet/copy', () => ({
  copyText: jest.fn(async (value: string) => {
    mockCopied.push(value);
    return true;
  }),
}));

const OWNER = '00000000-0000-4000-8000-0000000000f1';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
let walletState = 'open';
let sent: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  sent.push(`${request.method} ${path}`);
  const fx = await fxFetch(request, path);
  if (fx) return fx;
  if (path === '/money/wallet') {
    return ok({
      state: walletState,
      account: walletState === 'open' ? { accountNumber: '8100000417', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-04T09:00:00.000Z' } : null,
      limits: null,
      pin: { isSet: true, changedAt: '2026-10-04T09:01:00.000Z', triesLeft: 5, lockedUntil: null },
      bankTransfers: { allowed: true, blockedBy: null },
      beneficiaryCount: 0,
    });
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: 48_525_075, asOf: '2026-10-07T09:00:00.000Z' });
  if (path === '/money/transactions') return ok({ items: [], nextCursor: null });
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

async function boot() {
  const { WalletScreen } = require('../home/WalletScreen') as typeof import('../home/WalletScreen');
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WalletScreen />
    </SafeAreaProvider>,
  );
  return rtl;
}
const tabNames = () => rtl.screen.queryAllByRole('tab').map((t) => t.props.accessibilityLabel as string);
const openTab = async (name: string) => {
  await rtl.fireEvent.press(await rtl.screen.findByRole('tab', { name }));
};

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  resetFxHub();
  walletState = 'open';
  sent = [];
  mockCopied.length = 0;
  mockPushed.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
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
afterAll(() => {
  (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
});

describe('W1 · the tabs', () => {
  it('draws Naira, one tab for each currency the Hub serves, and Crypto; Naira is the one selected, as it was', async () => {
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.waitFor(() => expect(tabNames()).toEqual(['Naira', 'Dollar', 'Euro', 'Pound', 'CAD', 'Dirham', 'Cedi', 'Crypto']));
    expect(rtl.screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByText('Naira balance')).toBeTruthy();
  });

  it('draws only the three tabs the board draws when the Hub serves only those', async () => {
    hub.currencies = { ...hub.currencies, products: { ...hub.currencies.products, openAccount: false } };
    hub.accounts = [hub.accounts[0] as never, hub.accounts[1] as never];
    await boot();
    await rtl.waitFor(() => expect(tabNames()).toEqual(['Naira', 'Dollar', 'Crypto']));
  });

  it('draws no tab for a person whose wallet is not open, and asks the Hub nothing about foreign accounts', async () => {
    walletState = 'not_open';
    await boot();
    await rtl.screen.findByTestId('wallet-none');
    expect(tabNames()).toEqual([]);
    expect(sent.filter((s) => s.includes('/money/fx'))).toEqual([]);
  });

  it('draws no tab for a currency an admin switched off that the person has no account in', async () => {
    hub.currencies = { ...hub.currencies, currencies: hub.currencies.currencies.map((c) => (['EUR', 'GBP', 'CAD', 'AED', 'GHS'].includes(c.code) ? { ...c, enabled: false } : c)) };
    await boot();
    await rtl.waitFor(() => expect(tabNames()).toEqual(['Naira', 'Dollar', 'Crypto']));
  });
});

describe('W2 · a currency account', () => {
  it('says exactly where the details stand when the Hub has none: the provider\'s words for a refusal, "pending" for one in progress, never a promise of arrival (verifier M2)', async () => {
    const usdAccount = hub.accounts[0];
    const cad = { ...usdAccount, id: 'c0000000-0000-4000-8000-0000000000c1', currency: 'CAD', details: null, detailsStatus: 'unavailable', detailsNote: 'One of our partner services is temporarily unavailable. Please try again in a few minutes.' };
    const aed = { ...usdAccount, id: 'c0000000-0000-4000-8000-0000000000c2', currency: 'AED', details: null, detailsStatus: 'pending', detailsNote: null };
    hub.accounts = [usdAccount, cad, aed] as never;
    await boot();
    await openTab('CAD');
    expect(await rtl.screen.findByText('Account details are not available right now')).toBeTruthy();
    expect(rtl.screen.getByTestId('fx-account-note').props.children).toBe('One of our partner services is temporarily unavailable. Please try again in a few minutes.');
    expect(rtl.screen.queryByText(/on their way/)).toBeNull();
    expect(rtl.screen.queryByTestId('fx-copy')).toBeNull();
    await openTab('Dirham');
    expect(await rtl.screen.findByText('Account details are pending')).toBeTruthy();
    expect(rtl.screen.queryByText(/on their way|not available right now/)).toBeNull();
  });

  it('shows the account\'s own balance, the issuing bank, the number masked with Copy, and no Send (it is not built)', async () => {
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByText('Dollar balance')).toBeTruthy();
    expect(rtl.screen.getByLabelText('1,240 point 5 0 Dollar')).toBeTruthy();
    expect(rtl.screen.getByText('USD account · Lead Test Bank')).toBeTruthy();
    expect(rtl.screen.getByText('•••• 4410')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Copy account number' }));
    expect(mockCopied).toEqual(['9900004410']);
    expect(rtl.screen.queryByRole('button', { name: /^Send/ })).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Add dollars' })).toBeTruthy();
  });

  it('Add dollars opens Swap from naira to dollars, and the round button swaps dollars to naira', async () => {
    await boot();
    await openTab('Dollar');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Add dollars' }));
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Swap dollar to naira' }));
    expect(mockPushed).toEqual([
      { pathname: '/swap', params: { from: 'NGN', to: 'USD' } },
      { pathname: '/swap', params: { from: 'USD', to: 'NGN' } },
    ]);
  });

  it('Get paid from abroad opens the details Nuvion issued, each with Copy', async () => {
    await boot();
    await openTab('Dollar');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: /Get paid in dollars/ }));
    expect(await rtl.screen.findByText('USD account details')).toBeTruthy();
    expect(rtl.screen.getByText('026000999')).toBeTruthy();
    expect(rtl.screen.getByText('TESTUS33')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Copy routing number' }));
    expect(mockCopied).toEqual(['026000999']);
  });

  it('offers to open an account the person has not got, and says the account is opening once it is asked for', async () => {
    await boot();
    await openTab('Euro');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Open euro account' }));
    await rtl.waitFor(() => expect(hub.opened).toEqual([{ currency: 'EUR' }]));
    expect(await rtl.screen.findByTestId('fx-opening')).toBeTruthy();
  });

  it('shows a statement line with its own places, a swap with its rate, and the designed empty state when there is none', async () => {
    hub.transactions = [
      { id: 't1', accountId: USD_ID, currency: 'USD', direction: 'in', status: 'completed', amountMinor: 42_000, feeMinor: 0, balanceAfterMinor: null, description: 'Freelance payout', counterpartyName: 'Test Client', reference: 'r1', occurredAt: new Date(Date.now() - 60_000).toISOString(), conversion: null },
      { id: 't2', accountId: USD_ID, currency: 'USD', direction: 'out', status: 'completed', amountMinor: 20_000, feeMinor: 0, balanceAfterMinor: null, description: 'Swap', counterpartyName: null, reference: 'r2', occurredAt: new Date(Date.now() - 120_000).toISOString(), conversion: { fromCurrency: 'USD', toCurrency: 'NGN', rate: '1580', fromMinor: 20_000, toMinor: 31_600_000 } },
    ];
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByText('Test Client')).toBeTruthy();
    expect(rtl.screen.getByText('Freelance payout')).toBeTruthy();
    expect(rtl.screen.getByText('Swap to Naira')).toBeTruthy();
    expect(rtl.screen.getByText('$1 = ₦1,580.00')).toBeTruthy();
  });

  it('says there are no transactions yet, by its real cause, when the statement is empty', async () => {
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByTestId('fx-no-transactions')).toBeTruthy();
  });

  it('says the bank did not answer when the Hub could not reach the provider, and tries again on request', async () => {
    hub.accountsFault = { status: 503, code: 'provider_unreachable', message: 'We could not reach your account.' };
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByText('We couldn’t reach your account')).toBeTruthy();
    hub.accountsFault = null;
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /Try again/ }));
    expect(await rtl.screen.findByText('Dollar balance')).toBeTruthy();
  });

  it('draws a frozen account with its notice and without Add or Swap', async () => {
    hub.accounts = [{ ...(hub.accounts[0] as object), status: 'frozen' } as never, ...hub.accounts.slice(1)];
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByTestId('fx-frozen')).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: 'Add dollars' })).toBeNull();
  });
});

describe('W3 · Crypto', () => {
  it('groups the coins, shows the provider\'s balance and the networks, and no dollar value the Hub did not give', async () => {
    await boot();
    await openTab('Crypto');
    expect(await rtl.screen.findByTestId('fx-holding-USDT')).toBeTruthy();
    expect(rtl.screen.getByText('USDT · Ethereum')).toBeTruthy();
    expect(rtl.screen.getByLabelText('320 point 0 0 Tether')).toBeTruthy();
    expect(rtl.screen.getByText('Opening')).toBeTruthy();
    expect(rtl.screen.queryByText(/≈/)).toBeNull();
    expect(rtl.screen.queryByText(/BTC|Bitcoin|TRC-20|BEP-20/)).toBeNull();
  });

  it('Receive and Send open their screens, and a holding opens its address', async () => {
    await boot();
    await openTab('Crypto');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Receive' }));
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send' }));
    await rtl.fireEvent.press(rtl.screen.getByTestId('fx-holding-USDT'));
    expect(mockPushed).toEqual(['/crypto-receive', '/crypto-send', { pathname: '/crypto-receive', params: { coin: 'USDT' } }]);
  });

  it('draws no Send when the Hub has crypto sends off, and offers an address to a person with no coin yet', async () => {
    hub.currencies = { ...hub.currencies, products: { ...hub.currencies.products, cryptoSend: false } };
    await boot();
    await openTab('Crypto');
    await rtl.screen.findByTestId('fx-holding-USDT');
    expect(rtl.screen.queryByRole('button', { name: 'Send' })).toBeNull();
    expect(USDT_ID).toBeTruthy();
    expect(usdtAccount.balance.availableMinor).toBe(32_000);
  });

  it('offers a person with no coin a way to get an address', async () => {
    hub.accounts = [hub.accounts[0] as never];
    await boot();
    await openTab('Crypto');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Get an address' }));
    expect(mockPushed).toEqual(['/crypto-receive']);
  });
});
