/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

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
const hub = { enabled: true, swap: true, quotes: [] as { fromCurrency: string; amountMinor: number }[] };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/fx/accounts') return ok({ accounts: ACCOUNTS });
  if (path === '/money/fx/currencies') return ok({ currencies: [], products: { openAccount: false, swap: hub.swap } });
  if (path.startsWith('/money/fx/accounts/') && path.endsWith('/transactions')) return ok({ items: [], nextCursor: null });
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
  hub.quotes = [];
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
