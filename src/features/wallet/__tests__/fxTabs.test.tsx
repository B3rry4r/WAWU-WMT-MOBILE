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
/** The bank does not answer the naira balance: `503 provider_unreachable`, in the provider's own flavour of words. */
let balanceDown = false;
let sent: string[] = [];
/** What GET /about answers (the provider's bank name); null leaves it unanswered, as before. A held answer is released by `releaseAbout`. */
let aboutBank: string | null = null;
let aboutHeld: Promise<void> | null = null;

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
  if (path === '/money/wallet/balance') {
    if (balanceDown) return json(503, { statusCode: 503, message: 'API endpoint does not exist', data: null, reason: { code: 'provider_unreachable', message: 'API endpoint does not exist' } });
    return ok({ availableKobo: 48_525_075, asOf: '2026-10-07T09:00:00.000Z' });
  }
  if (path === '/money/transactions') return ok({ items: [], nextCursor: null });
  if (path === '/about' && aboutBank !== null) {
    if (aboutHeld) await aboutHeld;
    return ok({ bankName: aboutBank, licenceLine: null, supportEmail: null });
  }
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
  balanceDown = false;
  sent = [];
  aboutBank = null;
  aboutHeld = null;
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

describe('W6 · can\u2019t reach your account keeps the tab strip (R2-MONEY round 1, M-04)', () => {
  it('draws the tabs, the board\u2019s line and Try again when the naira balance answers 503 provider_unreachable, never the provider\u2019s words', async () => {
    balanceDown = true;
    await boot();
    expect(await rtl.screen.findByTestId('wallet-unreachable')).toBeTruthy();
    await rtl.waitFor(() => expect(tabNames()).toEqual(['Naira', 'Dollar', 'Crypto']));
    expect(rtl.screen.getByText("We couldn't reach your account")).toBeTruthy();
    expect(rtl.screen.getByText('Your money is safe. This is a connection problem between us and the bank.')).toBeTruthy();
    expect(rtl.screen.queryByText(/API endpoint/)).toBeNull();
    expect(rtl.screen.queryByTestId('wallet-balance-card')).toBeNull();
    // The bank not answering is not told to the other tabs: a Dollar account is read for itself and still opens.
    await openTab('Dollar');
    expect(await rtl.screen.findByTestId('fx-balance')).toBeTruthy();
    await openTab('Naira');
    balanceDown = false;
    await rtl.fireEvent.press(await rtl.screen.findByText('Try again'));
    expect(await rtl.screen.findByTestId('wallet-balance-card')).toBeTruthy();
  });
});

describe('W1 · the tabs', () => {
  it('draws Naira, one tab for each currency the person has added, and Crypto when they hold a coin; Naira is the one selected, as it was (R-106)', async () => {
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.waitFor(() => expect(tabNames()).toEqual(['Naira', 'Dollar', 'Crypto']));
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

  it('offers an account the person has not got only through + Add, and says the account is opening once it is asked for (R-106)', async () => {
    await boot();
    await rtl.screen.findByTestId('wallet-tab-add');
    expect(rtl.screen.queryByRole('tab', { name: 'Euro' })).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('wallet-tab-add'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('add-currency-EUR'));
    await rtl.waitFor(() => expect(hub.opened).toEqual([{ currency: 'EUR' }]));
    await openTab('Euro');
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

  // FIX-P6 round 3: a payment keeps the provider's rate block, and a line WAWU made is not a swap the person made. The Hub names such a line
  // "Who Made This" with what it was for; the app draws that, with the rate as a detail line, and only the person's own conversion is "Swap to Naira".
  const RATE = { fromCurrency: 'USD', toCurrency: 'NGN', rate: '1315.44', fromMinor: 23, toMinor: 30_000 };
  const line = (id: string, over: Record<string, unknown>) => ({
    id,
    accountId: USD_ID,
    currency: 'USD',
    direction: 'out',
    status: 'completed',
    amountMinor: 23,
    feeMinor: 0,
    balanceAfterMinor: null,
    description: '',
    counterpartyName: null,
    reference: id,
    occurredAt: new Date(Date.now() - 60_000).toISOString(),
    conversion: RATE,
    ...over,
  });

  it('draws a payment that carries a rate block as the Hub names it, with the rate as detail, never as "Swap to Naira"', async () => {
    hub.transactions = [
      line('p1', { description: 'Unlock · Lighting night shoots', counterpartyName: 'Who Made This' }),
      line('p2', { description: 'Tip · Tip to Cleo Okafor', counterpartyName: 'Who Made This' }),
      line('p3', { description: 'Paid question · Question for Cleo Okafor', counterpartyName: 'Who Made This' }),
      line('p4', { description: 'Event ticket · Lagos Photo Walk', counterpartyName: 'Who Made This' }),
      line('p5', { direction: 'in', description: 'Refund · Question for Cleo Okafor', counterpartyName: 'Who Made This' }),
    ];
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByText('Unlock · Lighting night shoots')).toBeTruthy();
    for (const words of ['Tip · Tip to Cleo Okafor', 'Paid question · Question for Cleo Okafor', 'Event ticket · Lagos Photo Walk', 'Refund · Question for Cleo Okafor']) {
      expect(rtl.screen.getByText(words)).toBeTruthy();
    }
    expect(rtl.screen.getAllByText('Who Made This')).toHaveLength(5);
    expect(rtl.screen.queryByText(/Swap to|Swap from/)).toBeNull();
    // the rate is still there, as a line under the words
    expect(rtl.screen.getAllByText('$1 = ₦1,315.44')).toHaveLength(5);
  });

  it("still draws the person's own conversion as \"Swap to Naira\", with its rate", async () => {
    hub.transactions = [
      line('s1', { description: 'WAWU swap', counterpartyName: 'Own account' }),
      line('s2', { direction: 'in', description: 'Swap', counterpartyName: null, conversion: { fromCurrency: 'NGN', toCurrency: 'USD', rate: '0.000741', fromMinor: 31_040, toMinor: 23 } }),
    ];
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByText('Swap to Naira')).toBeTruthy();
    expect(rtl.screen.getByText('Swap from Naira')).toBeTruthy();
    expect(rtl.screen.getByText('$1 = ₦1,315.44')).toBeTruthy();
    expect(rtl.screen.queryByText('Who Made This')).toBeNull();
  });

  // FIX-P6 L2: a payment from a Dollar account reads as the naira row does, what it paid for under the app's own name; the Hub sends both
  // (a line WAWU made is never named by WAWU's internal account), and the app draws them as they come and invents no label of its own.
  it('draws a payment from a Dollar account as the Hub names it: the app\'s name, then what was paid for', async () => {
    hub.transactions = [
      { id: 't3', accountId: USD_ID, currency: 'USD', direction: 'out', status: 'completed', amountMinor: 23, feeMinor: 0, balanceAfterMinor: null, description: 'Unlock · Lighting night shoots', counterpartyName: 'Who Made This', reference: 'wawu-pay-1', occurredAt: new Date(Date.now() - 60_000).toISOString(), conversion: null },
      { id: 't4', accountId: USD_ID, currency: 'USD', direction: 'in', status: 'completed', amountMinor: 23, feeMinor: 0, balanceAfterMinor: null, description: 'Refund · Question for Cleo Okafor', counterpartyName: 'Who Made This', reference: 'wawu-ref-1', occurredAt: new Date(Date.now() - 120_000).toISOString(), conversion: null },
    ];
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByText('Unlock · Lighting night shoots')).toBeTruthy();
    expect(rtl.screen.getByText('Refund · Question for Cleo Okafor')).toBeTruthy();
    expect(rtl.screen.getAllByText('Who Made This').length).toBeGreaterThanOrEqual(2);
    expect(rtl.screen.queryByText(/operational|held money/i)).toBeNull();
  });

  it('says there are no transactions yet, by its real cause, when the statement is empty', async () => {
    await boot();
    await openTab('Dollar');
    expect(await rtl.screen.findByTestId('fx-no-transactions')).toBeTruthy();
  });

  it('draws no tab it cannot back when the Hub could not reach the provider, and the tabs come once it can be read again (R-106)', async () => {
    hub.accountsFault = { status: 503, code: 'provider_unreachable', message: 'We could not reach your account.' };
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(tabNames()).toEqual([]);
    expect(rtl.screen.queryByTestId('wallet-tab-add')).toBeNull();
    hub.accountsFault = null;
    const { queryClient } = require('@/api/query') as typeof import('@/api/query');
    await rtl.act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['money', 'fx'] });
    });
    await openTab('Dollar');
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

  it('gives a person with no coin no Crypto tab, and a way to get an address through + Add (R-106)', async () => {
    hub.accounts = [hub.accounts[0] as never];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    expect(rtl.screen.queryByRole('tab', { name: 'Crypto' })).toBeNull();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('add-currency-USDT'));
    expect(mockPushed).toEqual([{ pathname: '/crypto-receive', params: { coin: 'USDT' } }]);
  });
});

describe('R-95 · Powered by Nuvion on a foreign account (SWEEP-1026 rows 6, 7 and 8)', () => {
  const lineCount = () => rtl.screen.queryAllByText('Powered by Nuvion').length;
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');

  it('draws the line once under a dollar account card, and not under it when the Hub names another bank', async () => {
    aboutBank = 'Nuvion';
    await boot();
    await openTab('Dollar');
    await rtl.screen.findByTestId('fx-body-USD');
    await rtl.waitFor(() => expect(lineCount()).toBe(1));
    await rtl.cleanup();
    queryClient.clear();
    aboutBank = 'Loma Bank';
    await boot();
    await openTab('Dollar');
    await rtl.screen.findByTestId('fx-body-USD');
    await rtl.waitFor(() => expect(sent.filter((s) => s === 'GET /about').length).toBe(2));
    expect(lineCount()).toBe(0);
    expect(rtl.screen.queryByTestId('powered-by-nuvion-room', { includeHiddenElements: true })).toBeNull();
  });

  it('a details sheet opened over the account shows the line once, not the page\u2019s and the sheet\u2019s (row 6)', async () => {
    aboutBank = 'Nuvion';
    await boot();
    await openTab('Dollar');
    await rtl.waitFor(() => expect(lineCount()).toBe(1));
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: /Get paid in dollars/ }));
    expect(await rtl.screen.findByText('USD account details')).toBeTruthy();
    await rtl.waitFor(() => expect(lineCount()).toBe(1));
    // The page keeps the line's room under the sheet, so nothing moves; shut, the page has its line again.
    expect(rtl.screen.getByTestId('powered-by-nuvion-room', { includeHiddenElements: true })).toBeTruthy();
  });

  it('keeps the line\u2019s room until GET /about answers, so the page does not jump when it is late (row 7)', async () => {
    const { StyleSheet } = require('react-native') as typeof import('react-native');
    const { text } = require('@/theme') as typeof import('@/theme');
    aboutBank = 'Nuvion';
    let release: () => void = () => undefined;
    aboutHeld = new Promise<void>((resolve) => {
      release = resolve;
    });
    await boot();
    await openTab('Dollar');
    const room = await rtl.screen.findByTestId('powered-by-nuvion-room', { includeHiddenElements: true });
    expect(lineCount()).toBe(0);
    expect((StyleSheet.flatten(room.props.style) as { height: number }).height).toBe(text.caption.lineHeight);
    await rtl.act(async () => {
      release();
    });
    const line = await rtl.screen.findByText('Powered by Nuvion');
    expect(rtl.screen.queryByTestId('powered-by-nuvion-room', { includeHiddenElements: true })).toBeNull();
    expect(line).toBeTruthy();
  });
});
