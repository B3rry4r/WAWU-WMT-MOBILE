/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { currenciesBody, fxFetch, hub, resetFxHub, USD_ID, usdAccount, usdtAccount } from '../fx/testing/fxHub';

/*
 * FX-POLISH P1: the strip of tabs on W1 reaches every currency: it scrolls with a cue, and its last item is a plain "+ Add" (the tabs of WALLET-21: what each draws (W2 for a currency account, W3 for Crypto), against the Hub's stand-in `fetch`
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
/** While set, the Hub holds the answer to "open an account" until it is released (the real call takes about ten seconds). */
let gate: Promise<void> | null = null;
/** When set, the Hub refuses "open an account" with this status. */
let refuseOpen: number | null = null;

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  sent.push(`${request.method} ${path}`);
  if (request.method === 'POST' && path === '/money/fx/accounts') {
    if (gate) await gate;
    if (refuseOpen) return json(refuseOpen, { statusCode: refuseOpen, message: 'The provider declined', data: null, reason: { code: 'provider_declined', message: 'Nuvion declined on dev.' } });
  }
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

beforeEach(() => {
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  Dimensions.set({ window: { width: 390, height: 844, scale: 2, fontScale: 1 } });
  resetFxHub();
  (require('../fx/opening') as typeof import('../fx/opening')).resetOpening();
  walletState = 'open';
  balanceDown = false;
  sent = [];
  gate = null;
  refuseOpen = null;
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

describe('the tab strip reaches every currency (FX-POLISH P1)', () => {
  it('ends in a plain + Add, which is not a tab, and the tabs before it are the accounts the person has added (R-106)', async () => {
    await boot();
    const add = await rtl.screen.findByTestId('wallet-tab-add');
    expect(add.props.accessibilityRole).toBe('button');
    expect(add.props.accessibilityLabel).toBe('Add a currency');
    expect(tabNames()).toEqual(['Naira', 'Dollar', 'Crypto']);
  });

  it('a Naira-only person sees exactly Naira and + Add, and no currency they have not added (R-106)', async () => {
    hub.accounts = [];
    await boot();
    await rtl.screen.findByTestId('wallet-tab-add');
    expect(tabNames()).toEqual(['Naira']);
    for (const name of ['Dollar', 'Euro', 'Pound', 'CAD', 'Dirham', 'Cedi', 'Crypto']) expect(rtl.screen.queryByRole('tab', { name })).toBeNull();
    expect(rtl.screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(true);
  });

  it('a Naira-only person whose Hub offers nothing to add sees no strip at all (nothing that does nothing, R-47)', async () => {
    hub.accounts = [];
    hub.currencies = { ...hub.currencies, products: { ...hub.currencies.products, openAccount: false } };
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(rtl.screen.queryByTestId('wallet-tabs')).toBeNull();
    expect(rtl.screen.queryByTestId('wallet-tab-add')).toBeNull();
  });

  it('with two accounts, the strip is exactly those two and + Add (R-106)', async () => {
    hub.accounts = [usdAccount];
    await boot();
    await rtl.screen.findByTestId('wallet-tab-add');
    expect(tabNames()).toEqual(['Naira', 'Dollar']);
  });

  it('+ Add on a Naira-only strip opens the choice, and the currency picked there gets its pill, opening and then opened (R-106)', async () => {
    hub.accounts = [];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    expect(await rtl.screen.findByTestId('add-currency-EUR')).toBeTruthy();
    expect(tabNames()).toEqual(['Naira']);
    await rtl.fireEvent.press(rtl.screen.getByTestId('add-currency-EUR'));
    await rtl.waitFor(() => expect(hub.opened).toEqual([{ currency: 'EUR' }]));
    await rtl.waitFor(() => expect(tabNames()).toEqual(['Naira', 'Euro']));
    await rtl.waitFor(() => expect(rtl.screen.getByRole('tab', { name: 'Euro' }).props.accessibilityState.selected).toBe(true));
  });

  it('opens the add-a-currency choice with what the Hub offers and the person does not hold, coins in its words', async () => {
    hub.accounts = [usdAccount, usdtAccount];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    expect(await rtl.screen.findByTestId('add-currency-EUR')).toBeTruthy();
    expect(rtl.screen.getByText('British pound')).toBeTruthy();
    expect(rtl.screen.getByText('Ghana cedi')).toBeTruthy();
    // They hold a dollar account and Tether: neither is offered again. USD Coin is not held and is offered; Ripple USD is off at the Hub.
    expect(rtl.screen.queryByTestId('add-currency-USD')).toBeNull();
    expect(rtl.screen.queryByTestId('add-currency-USDT')).toBeNull();
    expect(rtl.screen.getByText('USD Coin (USDC)')).toBeTruthy();
    expect(rtl.screen.queryByText(/Ripple/)).toBeNull();
  });

  it('opens the account for a currency picked there, and puts its tab in front', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('add-currency-GBP'));
    await rtl.waitFor(() => expect(hub.opened).toEqual([{ currency: 'GBP' }]));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('wallet-tab-GBP').props.accessibilityState.selected).toBe(true));
  });

  it('leads a coin picked there to the network picker, and opens nothing itself', async () => {
    hub.accounts = [usdAccount, usdtAccount];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('add-currency-USDC'));
    expect(mockPushed).toEqual([{ pathname: '/crypto-receive', params: { coin: 'USDC' } }]);
    expect(hub.opened).toEqual([]);
  });

  it('shows the pick is opening at once: the tab in front says so, and the same currency is not offered or opened twice (L1)', async () => {
    hub.accounts = [usdAccount];
    let release: () => void = () => undefined;
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    const pound = await rtl.screen.findByTestId('add-currency-GBP');
    // A double tap: both presses reach the handler the sheet drew, before anything is drawn again.
    await rtl.act(async () => {
      await rtl.fireEvent.press(pound);
      await rtl.fireEvent.press(pound);
    });
    // The call is still out, and already the pound tab is in front and says it is opening.
    expect(rtl.screen.getByTestId('wallet-tab-GBP').props.accessibilityState.selected).toBe(true);
    expect(await rtl.screen.findByTestId('fx-opening')).toBeTruthy();
    expect(rtl.screen.getByText('Your pound account is opening')).toBeTruthy();
    expect(rtl.screen.queryByTestId('fx-none')).toBeNull();
    expect(sent.filter((s) => s === 'POST /money/fx/accounts')).toHaveLength(1);
    // Asking for the choice again does not offer it.
    await rtl.fireEvent.press(rtl.screen.getByTestId('wallet-tab-add'));
    expect(await rtl.screen.findByTestId('add-currency-EUR')).toBeTruthy();
    expect(rtl.screen.queryByTestId('add-currency-GBP')).toBeNull();
    await rtl.act(async () => {
      release();
    });
    await rtl.waitFor(() => expect(hub.opened).toEqual([{ currency: 'GBP' }]));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('fx-opening')).toBeTruthy());
    expect(sent.filter((s) => s === 'POST /money/fx/accounts')).toHaveLength(1);
  });

  it('puts the opening cue away and offers the currency again when the Hub could not open it (L1)', async () => {
    hub.accounts = [usdAccount];
    refuseOpen = 409;
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('wallet-tab-add'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('add-currency-GBP'));
    expect(await rtl.screen.findByTestId('add-currency-problem')).toBeTruthy();
    expect(rtl.screen.queryByTestId('fx-opening')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('wallet-tab-add'));
    expect(await rtl.screen.findByTestId('add-currency-GBP')).toBeTruthy();
  });

  it('draws no + Add when there is nothing the person can add (the Hub has opening accounts off)', async () => {
    hub.currencies = currenciesBody({ openAccount: false });
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.waitFor(() => expect(sent).toContain('GET /money/fx/accounts'));
    expect(rtl.screen.queryByTestId('wallet-tab-add')).toBeNull();
  });

  it('draws the scroll cue only while tabs are hidden past the edge, and reveals the chosen tab', async () => {
    await boot();
    const scroller = await rtl.screen.findByTestId('wallet-tabs-scroll');
    await rtl.act(async () => {
      scroller.props.onLayout({ nativeEvent: { layout: { width: 358, height: 40 } } });
      scroller.props.onContentSizeChange(640, 40);
    });
    expect(rtl.screen.getByTestId('wallet-tabs-fade-right')).toBeTruthy();
    expect(rtl.screen.queryByTestId('wallet-tabs-fade-left')).toBeNull();
    await rtl.act(async () => {
      scroller.props.onScroll({ nativeEvent: { contentOffset: { x: 290, y: 0 } } });
    });
    expect(rtl.screen.queryByTestId('wallet-tabs-fade-right')).toBeNull();
    expect(rtl.screen.getByTestId('wallet-tabs-fade-left')).toBeTruthy();
  });
});

describe('a tab added from + Add is brought into view (SWEEP-1026 row 5)', () => {
  const { WalletTabs } = require('../fx/parts') as typeof import('../fx/parts');
  const { ScrollView } = require('react-native') as typeof import('react-native');
  const tabs = (n: number) => Array.from({ length: n }, (_, i) => ({ key: `t${i}`, label: `Tab ${i}` }));

  it('scrolls to the new tab when its own place arrives after the strip\u2019s new size did', async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: (o: { x: number }) => void }, 'scrollTo').mockImplementation(() => undefined);
    const tree = (n: number, value: string) => <WalletTabs tabs={tabs(n)} value={value} onChange={() => undefined} onAdd={() => undefined} />;
    const view = await rtl.render(tree(6, 't0'));
    const scroller = view.getByTestId('wallet-tabs-scroll');
    await rtl.act(async () => {
      scroller.props.onLayout({ nativeEvent: { layout: { width: 358, height: 40 } } });
      scroller.props.onContentSizeChange(600, 40);
    });
    // The strip was scrolled to its end (where + Add is), then a seventh tab is added and put in front.
    await rtl.act(async () => {
      scroller.props.onScroll({ nativeEvent: { contentOffset: { x: 242, y: 0 } } });
    });
    scrollTo.mockClear();
    await view.rerender(tree(7, 't6'));
    // The strip's size is known first, the tab's own place after it (the order a phone or a browser may give them).
    await rtl.act(async () => {
      scroller.props.onContentSizeChange(690, 40);
    });
    expect(scrollTo).not.toHaveBeenCalled();
    await rtl.act(async () => {
      view.getByTestId('wallet-tab-t6').props.onLayout({ nativeEvent: { layout: { x: 560, y: 0, width: 80, height: 34 } } });
    });
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ x: 536 }));
    scrollTo.mockRestore();
  });
});

describe('the one-time note after a wallet opens (D2)', () => {
  const noteKey = () => `wmt.note.currencies.${OWNER}`;

  it('names what the Hub offers this person, and is never drawn again once put away', async () => {
    hub.accounts = [];
    await boot();
    const line = await rtl.screen.findByTestId('currency-note-line');
    expect(line.props.children).toBe('You can also hold dollars, euros, pounds, Canadian dollars, dirhams, cedis and crypto.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('currency-note-dismiss'));
    expect(rtl.screen.queryByTestId('currency-note')).toBeNull();
    await rtl.waitFor(() => expect(mockVault.get(noteKey())).toBe('seen'));
    await rtl.cleanup();
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.waitFor(() => expect(sent.filter((s) => s === 'GET /money/fx/accounts').length).toBeGreaterThan(1));
    expect(rtl.screen.queryByTestId('currency-note')).toBeNull();
  });

  it('draws the currencies the Hub offers, not a fixed list: with euros and coins off it says only what is on', async () => {
    hub.accounts = [];
    hub.currencies = currenciesBody({ off: ['EUR', 'GBP', 'CAD', 'AED', 'GHS'] });
    await boot();
    expect((await rtl.screen.findByTestId('currency-note-line')).props.children).toBe('You can also hold dollars and crypto.');
  });

  it('its Add a currency opens the choice and puts the note away for good', async () => {
    hub.accounts = [];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('currency-note-add'));
    expect(await rtl.screen.findByTestId('add-currency-EUR')).toBeTruthy();
    expect(rtl.screen.queryByTestId('currency-note')).toBeNull();
    await rtl.waitFor(() => expect(mockVault.get(noteKey())).toBe('seen'));
  });

  it('is not drawn for a person who already holds another currency, nor when the Hub offers nothing', async () => {
    hub.accounts = [usdAccount];
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    await rtl.waitFor(() => expect(sent).toContain('GET /money/fx/accounts'));
    expect(rtl.screen.queryByTestId('currency-note')).toBeNull();
    await rtl.cleanup();
    hub.accounts = [];
    hub.currencies = currenciesBody({ openAccount: false });
    await boot();
    await rtl.screen.findByTestId('wallet-balance-card');
    expect(rtl.screen.queryByTestId('currency-note')).toBeNull();
  });
});

describe('Accounts and currencies (D3)', () => {
  async function bootAccounts() {
    const { AccountsScreen } = require('../accounts/AccountsScreen') as typeof import('../accounts/AccountsScreen');
    await rtl.render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <AccountsScreen onBack={() => undefined} />
      </SafeAreaProvider>,
    );
  }

  it('lists the accounts the Hub lists, each with its own figure, and never one total', async () => {
    hub.accounts = [usdAccount, usdtAccount];
    await bootAccounts();
    expect(await rtl.screen.findByTestId('accounts-naira')).toBeTruthy();
    expect(rtl.screen.getByText('Ekiti Trial MFB · 810 000 0417')).toBeTruthy();
    expect(rtl.screen.getByText('Dollar account')).toBeTruthy();
    expect(rtl.screen.getByTestId(`accounts-${USD_ID}-balance`).props.children).toBe('$1,240.50');
    expect(rtl.screen.getByText('USDT on Ethereum')).toBeTruthy();
    expect(rtl.screen.getByText('320.00 USDT')).toBeTruthy();
  });

  it('shows the Naira wallet with the bank\'s own figure, as the other rows show theirs (L2)', async () => {
    hub.accounts = [usdAccount];
    await bootAccounts();
    expect((await rtl.screen.findByTestId('accounts-naira-balance')).props.children).toBe('₦485,250.75');
    expect(rtl.screen.getByTestId(`accounts-${USD_ID}-balance`).props.children).toBe('$1,240.50');
  });

  it('draws no Naira figure while the bank does not answer, and no 0 in its place (L2)', async () => {
    hub.accounts = [usdAccount];
    balanceDown = true;
    await bootAccounts();
    await rtl.screen.findByTestId('accounts-naira');
    await rtl.waitFor(() => expect(sent).toContain('GET /money/wallet/balance'));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(rtl.screen.queryByTestId('accounts-naira-balance')).toBeNull();
  });

  it('draws the pick as an Opening row at once, and offers it no more (L1)', async () => {
    hub.accounts = [usdAccount];
    let release: () => void = () => undefined;
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await bootAccounts();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('accounts-add'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('add-currency-GBP'));
    const row = await rtl.screen.findByTestId('accounts-opening-GBP');
    expect(rtl.within(row).getByText('Pound account')).toBeTruthy();
    expect(rtl.within(row).getByText('Opening')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('accounts-add'));
    expect(await rtl.screen.findByTestId('add-currency-EUR')).toBeTruthy();
    expect(rtl.screen.queryByTestId('add-currency-GBP')).toBeNull();
    await rtl.act(async () => {
      release();
    });
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('accounts-opening-GBP')).toBeNull());
    expect(rtl.within(rtl.screen.getByTestId(`accounts-a0000000-0000-4000-8000-00000000101`)).getByText('Opening')).toBeTruthy();
    expect(hub.opened).toEqual([{ currency: 'GBP' }]);
  });

  it('opens Add a currency from its button while the Hub offers one, and draws no button when it offers none', async () => {
    hub.accounts = [usdAccount];
    await bootAccounts();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('accounts-add'));
    expect(await rtl.screen.findByTestId('add-currency-GBP')).toBeTruthy();
    await rtl.cleanup();
    hub.currencies = currenciesBody({ openAccount: false });
    await bootAccounts();
    await rtl.screen.findByTestId('accounts-list');
    expect(rtl.screen.queryByTestId('accounts-add')).toBeNull();
  });
});
