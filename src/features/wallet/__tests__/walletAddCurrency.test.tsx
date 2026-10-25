/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType } from 'react';

import { fxFetch, hub, resetFxHub, usdAccount } from '../fx/testing/fxHub';

/*
 * RELEASE-02 fix round 1 (CHECK-3 D-1, verifier finding 2): "Add a dollar account" on /tiers leads to the Wallet tab with `add=USD`.
 * With no wallet the tab opens Open your wallet with that first account (`/open-wallet?currency=USD`, R-87); with a Naira wallet it
 * puts the Dollar tab in front; with a wallet opened from outside Nigeria it opens the add-a-currency sheet. The real tabs on the
 * real router, the Hub a stand-in `fetch` installed before the app's modules load.
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

const OWNER = '00000000-0000-4000-8000-0000000000f7';
const ACCOUNT = { accountNumber: '8100000528', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-07T09:00:00.000Z' };
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
let wallet: 'none' | 'naira' | 'world' = 'none';
let sent: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  sent.push(`${request.method} ${path}`);
  if (path === '/money/wallet') {
    return ok({
      state: wallet === 'none' ? 'not_open' : 'open',
      account: wallet === 'naira' ? ACCOUNT : null,
      world: wallet === 'world' ? { country: 'GH', firstCurrency: 'GHS', state: 'open' } : undefined,
      limits: null,
      pin: { isSet: wallet !== 'none', changedAt: null, triesLeft: 5, lockedUntil: null },
      bankTransfers: { allowed: wallet === 'naira', blockedBy: null },
      beneficiaryCount: 0,
    });
  }
  const fx = await fxFetch(request, path);
  if (fx) return fx;
  if (path === '/money/wallet/balance') return ok({ availableKobo: 0, asOf: '2026-10-07T09:00:00.000Z' });
  if (path === '/money/transactions') return ok({ items: [], nextCursor: null });
  if (path === '/money/abroad/corridors') return ok({ enabled: false, minReceiveMinor: 100, wawuFeeKobo: 0, countries: [] });
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
}) as typeof fetch;

let queryClient: QueryClient;
const page = (path: string) => (require(path) as { default: ComponentType }).default;
/** Open your wallet's first step, as a stand-in that shows the currency it was opened with. */
function A26() {
  const { currency } = useLocalSearchParams<{ currency?: string }>();
  return (
    <View>
      <Text accessibilityRole="header">A26</Text>
      <Text testID="a26-currency">{currency ?? 'none'}</Text>
    </View>
  );
}
let routes: Record<string, ComponentType>;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

beforeAll(async () => {
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    '(tabs)/_layout': page('@/app/(tabs)/_layout'),
    '(tabs)/index': page('@/app/(tabs)/index'),
    '(tabs)/explore': page('@/app/(tabs)/explore'),
    '(tabs)/inbox': page('@/app/(tabs)/inbox'),
    '(tabs)/wallet': page('@/app/(tabs)/wallet'),
    '(tabs)/me': page('@/app/(tabs)/me'),
    'open-wallet': A26,
  };
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  wallet = 'none';
  sent = [];
  resetFxHub();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('"Add a dollar account" arriving at the Wallet tab with add=USD', () => {
  it('a person with no wallet is taken to Open your wallet with US dollar as the first account asked for', async () => {
    await renderRouter(routes, { initialUrl: '/wallet?add=USD' });
    expect(await screen.findByRole('header', { name: 'A26' })).toBeTruthy();
    expect(pathname()).toBe('/open-wallet');
    expect(screen.getByTestId('a26-currency')).toHaveTextContent('USD');
  });

  it('the same tab without add opens Open your wallet with no currency asked for', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    expect(await screen.findByRole('header', { name: 'A26' })).toBeTruthy();
    expect(screen.getByTestId('a26-currency')).toHaveTextContent('none');
  });

  it('a code the app does not know is not passed on', async () => {
    await renderRouter(routes, { initialUrl: '/wallet?add=XYZ' });
    expect(await screen.findByRole('header', { name: 'A26' })).toBeTruthy();
    expect(screen.getByTestId('a26-currency')).toHaveTextContent('none');
  });

  it('a person with a Naira wallet lands on the Dollar tab', async () => {
    wallet = 'naira';
    hub.accounts = [usdAccount] as never;
    await renderRouter(routes, { initialUrl: '/wallet?add=USD' });
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Dollar' }).props.accessibilityState.selected).toBe(true));
    expect(screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(false);
  });

  it('a person with a Naira wallet and no add stays on the Naira tab', async () => {
    wallet = 'naira';
    hub.accounts = [usdAccount] as never;
    await renderRouter(routes, { initialUrl: '/wallet' });
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Dollar' })).toBeTruthy());
    expect(screen.getByRole('tab', { name: 'Naira' }).props.accessibilityState.selected).toBe(true);
  });

  it('a person whose wallet was opened from outside Nigeria (cedi account) is shown the add-a-currency sheet with US dollar in it, and adding it opens that account', async () => {
    wallet = 'world';
    hub.accounts = [{ ...usdAccount, id: 'a0000000-0000-4000-8000-0000000000a9', currency: 'GHS' }] as never;
    await renderRouter(routes, { initialUrl: '/wallet?add=USD' });
    const dollar = await screen.findByText('US dollar');
    await fireEvent.press(dollar);
    await waitFor(() => expect(sent).toContain('POST /money/fx/accounts'));
  });

  it('a person who already holds the dollar account is shown no sheet', async () => {
    wallet = 'world';
    hub.accounts = [usdAccount] as never;
    await renderRouter(routes, { initialUrl: '/wallet?add=USD' });
    await screen.findByTestId('wallet-world-USD');
    expect(screen.queryByText('US dollar')).toBeNull();
  });
});
