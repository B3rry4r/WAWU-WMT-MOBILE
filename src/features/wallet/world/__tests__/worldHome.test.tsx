/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

import { currenciesBody, usdtAccount } from '../../fx/testing/fxHub';

/*
 * R2-MONEY D-01 (see worldSendAbroad.test.tsx for the scaffold): a person outside Nigeria sees, for each open foreign account, a balance card
 * with the provider's own figure and the controls built for them. WALLET-42: a person who opened a wallet outside Nigeria sees "Send abroad" on a foreign account (WALLET-41's Wallet tab). It opens
 * the Send abroad flow with that account already chosen, and is drawn only while the Hub says sending abroad is on and lists an
 * account to send from in that currency (R-47). The Hub is a stand-in `fetch` installed before the app's modules load.
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

const DETAILS = { status: 'active', beneficiaryName: 'Ada Eze', accountNumber: '12345678', sortCode: '04-00-04', iban: null, routingNumber: null, swiftCode: null, bankName: 'Clear Bank', bankAddress: null };
const ACCOUNTS = [
  { id: 'a1', currency: 'GBP', status: 'open', decimals: 2, balance: { availableMinor: 729 }, details: DETAILS, detailsStatus: 'ready', detailsNote: null },
  { id: 'a2', currency: 'EUR', status: 'open', decimals: 2, balance: { availableMinor: 100 }, details: null, detailsStatus: 'pending', detailsNote: null },
  { id: 'a3', currency: 'USD', status: 'open', decimals: 2, balance: null, details: null, detailsStatus: 'pending', detailsNote: null },
];
const SOURCES = [{ currency: 'GBP', name: 'British pound account', decimals: 2, availableMinor: 729 }];
const RECIPIENT = {
  id: '11111111-1111-4111-8111-111111111111',
  country: 'GH',
  countryName: 'Ghana',
  currency: 'GHS',
  method: 'mobile_money',
  scheme: 'mtn',
  holderName: 'Ama Mensah',
  bankName: null,
  last4: '4567',
  summary: 'Ghana, MTN, ending 4567',
  createdAt: '2026-10-24T10:00:00.000Z',
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown, status = 200) => json(status, { statusCode: status, message: 'OK', data });
const FROZEN = ACCOUNTS.map((a) => ({ ...a, status: 'frozen' }));
const MOVEMENT = {
  id: 'tx-1',
  accountId: 'a1',
  currency: 'GBP',
  direction: 'in',
  status: 'completed',
  amountMinor: 2500,
  feeMinor: 0,
  balanceAfterMinor: 2500,
  description: 'Payment received',
  counterpartyName: 'Kofi Mensah',
  reference: 'ref-1',
  occurredAt: '2026-10-20T10:00:00.000Z',
  conversion: null,
};
const hub = { enabled: true, swap: true, listed: [] as { code: string; name: string; kind: string; decimals: number; chains: string[]; enabled: boolean }[], quotes: [] as { fromCurrency: string; amountMinor: number }[], accounts: ACCOUNTS as readonly object[], movements: [] as object[] };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/fx/accounts') return ok({ accounts: hub.accounts });
  if (path === '/money/fx/currencies') return ok({ currencies: hub.listed, products: { openAccount: hub.listed.length > 0, swap: hub.swap, cryptoSend: true } });
  if (path.startsWith('/money/fx/accounts/') && path.endsWith('/transactions')) return ok({ items: path.includes('/a1/') ? hub.movements : [], nextCursor: null });
  if (path === '/money/abroad/corridors') return ok({ enabled: hub.enabled, minReceiveMinor: 100, wawuFeeKobo: 0, countries: [] });
  if (path === '/money/abroad/sources') return ok({ sources: SOURCES });
  if (path === '/money/abroad/recipients') return ok({ items: [RECIPIENT] });
  if (path === '/money/abroad/quotes') {
    const body = (await request.json()) as { fromCurrency: string; amountMinor: number };
    hub.quotes.push(body);
    return ok(
      {
        id: '33333333-3333-4333-8333-333333333333',
        recipientId: RECIPIENT.id,
        fromCurrency: body.fromCurrency,
        toCurrency: 'GHS',
        fromDecimals: 2,
        toDecimals: 2,
        amountFromMinor: body.amountMinor,
        amountToMinor: body.amountMinor * 13,
        converted: true,
        rate: '13.4',
        providerFeeMinor: 112,
        wawuFeeKobo: 0,
        wawuFeeMinor: 0,
        speed: 'Instant',
        expiresAt: new Date(Date.now() + 179_000).toISOString(),
        validForSeconds: 179,
      },
      201,
    );
  }
  return json(404, { statusCode: 404, message: `Not here: ${request.method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;
const OWNER = '00000000-0000-4000-8000-0000000000f4';
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

function WalletStandIn() {
  const { WorldHome } = require('@/features/wallet/world/WorldHome') as typeof import('@/features/wallet/world/WorldHome');
  return (
    <View>
      <Text accessibilityRole="header">Wallet tab</Text>
      <WorldHome owner={OWNER} />
    </View>
  );
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
    welcome: () => <Text accessibilityRole="header">Welcome</Text>,
    swap: () => <Text accessibilityRole="header">Swap screen</Text>,
    'crypto-receive': () => <Text accessibilityRole="header">Crypto receive screen</Text>,
    'send/abroad/index': page('@/app/send/abroad/index'),
    'send/abroad/new': page('@/app/send/abroad/new'),
    'send/abroad/amount': page('@/app/send/abroad/amount'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  hub.enabled = true;
  hub.swap = true;
  hub.listed = [];
  hub.quotes = [];
  hub.accounts = ACCOUNTS;
  hub.movements = [];
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('the world Wallet tab offers coins as the naira wallet does (FX-POLISH P2, R-87)', () => {
  const listed = () => currenciesBody().currencies.filter((c) => ['CAD', 'USDT', 'USDC', 'RLUSD'].includes(c.code));

  it('lists the coins the Hub offers beside the currencies it offers, in its words, and a coin leads to the network picker', async () => {
    hub.listed = listed();
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a currency' }));
    expect(await screen.findByText('Canadian dollar')).toBeTruthy();
    expect(screen.getByText('Tether (USDT)')).toBeTruthy();
    expect(screen.getByText('USD Coin (USDC)')).toBeTruthy();
    // The Hub has Ripple USD switched off: it is not offered, and no list of ours puts it back.
    expect(screen.queryByText(/Ripple/)).toBeNull();
    await fireEvent.press(screen.getByTestId('wallet-world-add-USDT'));
    expect(await screen.findByRole('header', { name: 'Crypto receive screen' })).toBeTruthy();
  });

  it('says once, after a wallet opens, which currencies and coins can be added, in what the Hub offers, and never again once put away (D2)', async () => {
    hub.accounts = [{ ...ACCOUNTS[0], balance: { availableMinor: 729, bookedMinor: 729 } }];
    hub.listed = listed();
    await renderRouter(routes, { initialUrl: '/wallet' });
    expect((await screen.findByTestId('currency-note-line')).props.children).toBe('You can also hold Canadian dollars and crypto.');
    await fireEvent.press(screen.getByTestId('currency-note-dismiss'));
    expect(screen.queryByTestId('currency-note')).toBeNull();
    // Its Add a currency is the sheet of this tab.
    expect(await screen.findByRole('button', { name: 'Add a currency' })).toBeTruthy();
  });

  it('offers no coin, and no way in, when the Hub lists none', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await screen.findByTestId('wallet-world-GBP-card');
    await waitFor(() => expect(queryClient.getQueryData(['money', 'fx', 'currencies', OWNER])).toBeDefined());
    expect(screen.queryByRole('button', { name: 'Add a currency' })).toBeNull();
  });

  it('draws a coin they hold as the Crypto tab does: its holding, and Receive, not a card for each network', async () => {
    // The Hub's accounts carry the booked figure beside the available one (the world stand-in above leaves it out); the coin holdings read the same list.
    hub.accounts = [...ACCOUNTS.map((a) => (a.balance ? { ...a, balance: { ...a.balance, bookedMinor: a.balance.availableMinor } } : a)), usdtAccount];
    hub.listed = listed();
    await renderRouter(routes, { initialUrl: '/wallet' });
    expect(await screen.findByTestId('fx-holding-USDT')).toBeTruthy();
    expect(screen.getByTestId('fx-receive')).toBeTruthy();
    expect(screen.queryByTestId('wallet-world-USDT-card')).toBeNull();
    // Held, so it is not offered to add again.
    await fireEvent.press(await screen.findByRole('button', { name: 'Add a currency' }));
    expect(screen.queryByText('Tether (USDT)')).toBeNull();
    expect(screen.getByText('USD Coin (USDC)')).toBeTruthy();
  });
});

describe('the world Wallet tab (R2-MONEY D-01)', () => {
  it('draws a balance card for each open account with the bank\'s own figure, and never a naira figure or a sum', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await screen.findByTestId('wallet-world-GBP-card');
    expect(screen.getByText('Pound balance')).toBeTruthy();
    expect(screen.getByText('Euro balance')).toBeTruthy();
    expect(screen.getAllByTestId('fx-balance')).toHaveLength(2);
    expect(screen.getByText('£7.29')).toBeTruthy();
    expect(screen.getByText('€1.00')).toBeTruthy();
    // The dollar account's balance could not be read: it says so and offers to try again, never a 0 the Hub did not say.
    expect(screen.getByTestId('wallet-world-USD-card')).toBeTruthy();
    expect(screen.getAllByTestId('fx-balance-retry')).toHaveLength(1);
    expect(JSON.stringify(screen.toJSON())).not.toContain('₦');
  });

  it('offers Swap on an open account while the Hub has swaps on and there is a second account of their own, and it opens the swap from that account', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByTestId('wallet-world-EUR-swap'));
    expect(await screen.findByRole('header', { name: 'Swap screen' })).toBeTruthy();
  });

  it('draws no Swap while the Hub has swaps off', async () => {
    hub.swap = false;
    await renderRouter(routes, { initialUrl: '/wallet' });
    await screen.findByTestId('wallet-world-GBP-card');
    await waitFor(() => expect(queryClient.getQueryData(['money', 'fx', 'currencies', OWNER])).toBeDefined());
    expect(screen.queryByTestId('wallet-world-GBP-swap')).toBeNull();
  });

  it('keeps Transactions when every account is frozen, so the history stays readable (R2-MONEY round 1)', async () => {
    hub.accounts = FROZEN;
    await renderRouter(routes, { initialUrl: '/wallet' });
    await screen.findByTestId('wallet-world-GBP-frozen');
    expect(await screen.findByTestId('fx-no-transactions')).toBeTruthy();
    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('lists the movements of a frozen account', async () => {
    hub.accounts = FROZEN;
    hub.movements = [MOVEMENT];
    await renderRouter(routes, { initialUrl: '/wallet' });
    await screen.findByTestId('wallet-world-GBP-frozen');
    expect(await screen.findByTestId('fx-transactions')).toBeTruthy();
    expect(screen.getByTestId('fx-row-tx-1')).toBeTruthy();
    expect(screen.queryByTestId('wallet-world-GBP-send')).toBeNull();
  });

  it('opens the details payers use from Get paid from abroad, only for an account whose details were issued', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await screen.findByTestId('wallet-world-GBP-card');
    expect(screen.getAllByTestId('fx-abroad')).toHaveLength(1);
    expect(screen.getByTestId('fx-account-number').props.children).toBe('•••• 5678');
    await fireEvent.press(screen.getByTestId('fx-abroad'));
    expect(await screen.findByTestId('fx-details-sheet')).toBeTruthy();
    expect(screen.getByText('Clear Bank')).toBeTruthy();
  });
});
