/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack, useRouter } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Pressable, Text, View } from 'react-native';

import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType } from 'react';

/*
 * The real Wallet tab on the real Expo Router stack and tabs, with Open your wallet's steps as stand-ins
 * that move the way the real routes do (KYC-04's flowReturn test does the same): a push to the next
 * step, `useOpenWalletWay().opened` at A7, and at A10 what CreatePinScreen does once the PIN is set
 * (every `['money']` read asked again, then `leave`). The Hub answers through a stand-in `fetch`,
 * installed before the app's modules load: the API client keeps the `fetch` it finds when it is made.
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

/** Made-up account details in the server's shape (MONEY-12). */
const ACCOUNT = { accountNumber: '8100000528', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-07T09:00:00.000Z' };
let opened = false;
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/wallet') {
    return ok({
      state: opened ? 'open' : 'not_open',
      account: opened ? ACCOUNT : null,
      limits: null,
      pin: { isSet: opened, changedAt: null, triesLeft: 5, lockedUntil: null },
      bankTransfers: { allowed: opened, blockedBy: null },
      beneficiaryCount: 0,
    });
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: 0, asOf: '2026-10-07T09:00:00.000Z' });
  if (path === '/money/transactions') return ok({ items: [], nextCursor: null });
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
}) as typeof fetch;

type Loaded = {
  queryClient: QueryClient;
  useOpenWalletWay: typeof import('@/features/open-wallet/leave').useOpenWalletWay;
  entry: typeof import('@/features/open-wallet/entry');
};
let app: Loaded;
const page = (path: string) => (require(path) as { default: ComponentType }).default;

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  );
}
function A26() {
  const router = useRouter();
  return (
    <View>
      <Text accessibilityRole="header">A26</Text>
      <Button label="A26 Back" onPress={() => router.back()} />
      <Button label="A26 Continue" onPress={() => router.push(app.entry.OPEN_WALLET_DETAILS_PATH)} />
    </View>
  );
}
function A5() {
  const way = app.useOpenWalletWay();
  return (
    <Button
      label="A5 to A7, account open"
      onPress={() => {
        opened = true;
        way.opened();
      }}
    />
  );
}
function A8() {
  const router = useRouter();
  return <Button label="Create your transaction PIN" onPress={() => router.push(app.entry.OPEN_WALLET_PIN_PATH)} />;
}
function A10() {
  const way = app.useOpenWalletWay();
  return (
    <Button
      label="A10 PIN set"
      onPress={() => {
        void app.queryClient.invalidateQueries({ queryKey: ['money'] });
        way.leave();
      }}
    />
  );
}

let routes: Record<string, ComponentType>;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

beforeAll(async () => {
  app = {
    queryClient: (require('@/api/query') as typeof import('@/api/query')).queryClient,
    useOpenWalletWay: (require('@/features/open-wallet/leave') as typeof import('@/features/open-wallet/leave')).useOpenWalletWay,
    entry: require('@/features/open-wallet/entry') as typeof import('@/features/open-wallet/entry'),
  };
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    '(tabs)/_layout': page('@/app/(tabs)/_layout'),
    '(tabs)/index': page('@/app/(tabs)/index'),
    '(tabs)/explore': page('@/app/(tabs)/explore'),
    '(tabs)/inbox': page('@/app/(tabs)/inbox'),
    '(tabs)/wallet': page('@/app/(tabs)/wallet'),
    '(tabs)/me': page('@/app/(tabs)/me'),
    'open-wallet': A26,
    'open-wallet-details': A5,
    'open-wallet-account': A8,
    'open-wallet-pin': A10,
  };
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  opened = false;
  app.queryClient.clear();
  // No cache timer outliving a test (round 1 D3).
  app.queryClient.setDefaultOptions({ queries: { ...app.queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f2'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

// The app's one cache holds a timer per query until it is emptied; empty it so jest can exit.
afterAll(async () => {
  await app.queryClient.cancelQueries();
  app.queryClient.clear();
});

describe('the Wallet tab with no wallet yet, on the real router', () => {
  it('a signed-in user with no wallet who taps the Wallet tab lands in Open your wallet (A26); Back leaves them on the tab, with the way in', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByRole('tab', { name: 'Wallet' }));
    expect(await screen.findByRole('header', { name: 'A26' })).toBeTruthy();
    expect(pathname()).toBe('/open-wallet');
    await fireEvent.press(screen.getByRole('button', { name: 'A26 Back' }));
    expect(await screen.findByText("You don't have a wallet yet")).toBeTruthy();
    expect(pathname()).toBe('/wallet');
    // Coming back never opens A26 again by itself.
    expect(screen.queryByRole('header', { name: 'A26' })).toBeNull();
  });

  it('after A10, the user lands back on the Wallet tab and sees the new account (W5)', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByRole('tab', { name: 'Wallet' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'A26 Continue' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'A5 to A7, account open' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Create your transaction PIN' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'A10 PIN set' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
    expect(await screen.findByText('No transactions yet')).toBeTruthy();
    expect(screen.getByText('Send to 810 000 0528 from any Nigerian bank.')).toBeTruthy();
    expect(screen.getByText('Who Made This? · Ekiti Trial MFB')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Wallet' }).props.accessibilityState.selected).toBe(true);
  });
});

describe('the Wallet tab with a wallet, on the real router', () => {
  it('a user sees no scan, Dollar, Crypto, Add money, Withdraw or Swap entry (their screens are not built, R-47) and no bills (R-52), the settings icon and the Send, Buy points and To cash actions, and the tab stays on /wallet', async () => {
    opened = true;
    await renderRouter(routes);
    await fireEvent.press(screen.getByRole('tab', { name: 'Wallet' }));
    expect(await screen.findByText('No transactions yet')).toBeTruthy();
    await waitFor(() => expect(pathname()).toBe('/wallet'));
    for (const name of ['Scan to pay', 'Add money', 'Withdraw', 'Swap', 'WAWU card', 'See all transactions']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
    for (const name of ['Naira', 'Dollar', 'Crypto']) expect(screen.queryByRole('tab', { name })).toBeNull();
    // The buttons on the tab are the settings icon (W35, WALLET-06), the card's own two (hide the balance, copy the number) and the three built actions, Send, Buy points and To cash; the rest of the bar is the tab bar.
    expect(screen.getByRole('button', { name: 'Wallet settings' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hide balance' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy account number' })).toBeTruthy();
    for (const name of ['Send', 'Buy points', 'To cash']) expect(screen.getByRole('button', { name })).toBeTruthy();
    for (const name of ['Bills', 'Power', 'More', 'Airtime', 'Data', 'TV']) expect(screen.queryByRole('button', { name })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Wallet' }).props.accessibilityState.selected).toBe(true);
    expect(pathname()).toBe('/wallet');
    expect(screen.queryByRole('header', { name: 'A26' })).toBeNull();
  });
});
