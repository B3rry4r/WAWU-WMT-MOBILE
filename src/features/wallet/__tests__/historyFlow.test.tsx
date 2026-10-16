/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType } from 'react';

/*
 * The Wallet tab, the history (W26) and the receipt (W27) on the real Expo Router stack and tabs, answered by a stand-in Hub:
 * See all from the tab lands on W26, a row on W26 or on the tab lands on W27, a grouped row lands on the movements it stands
 * for, W28's Pay a bill lands on Pay a bill (S2), and Back walks the way it came. The stand-in `fetch` is installed before the
 * app's modules load: the API client keeps the `fetch` it finds when it is made.
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

const ACCOUNT = { accountNumber: '8100000731', accountName: 'Ada Eze', bankName: 'Ekiti Trial MFB', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-07T09:00:00.000Z' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

const HOUR = 3_600_000;
const lagosMidnight = Math.floor((Date.now() + HOUR) / (24 * HOUR)) * 24 * HOUR - HOUR;
const fee = (provider: number, wawu: number) => ({ providerFeeKobo: provider, wawuFeeKobo: wawu, totalFeeKobo: provider + wawu });
const base = { link: null, note: null, transferId: null, paymentId: null, group: null, status: 'completed' };
const SEND = {
  ...base,
  id: 'send-1',
  direction: 'out',
  category: 'transfer',
  amountKobo: 1_700_000,
  fee: fee(5_300, 3_100),
  totalKobo: 1_708_400,
  description: 'Transfer · Test Bank',
  counterparty: { kind: 'bank_account', name: 'Ngozi Test', avatarUrl: null, wawuUserId: null, bankName: 'Test Bank', accountNumberLast4: '5521' },
  reference: 'REF-SEND-1',
  createdAt: new Date(lagosMidnight + 2_000).toISOString(),
};
const UNLOCKS = {
  ...base,
  id: 'unlock-9',
  direction: 'in',
  category: 'earning',
  amountKobo: 750_000,
  fee: fee(0, 0),
  totalKobo: 750_000,
  description: 'Unlock · Test lighting guide · 3 buyers',
  counterparty: null,
  link: { kind: 'content_unlock', targetId: 'c-9', title: 'Test lighting guide' },
  group: { key: 'g2.test-key', count: 3, firstAt: SEND.createdAt, lastAt: SEND.createdAt },
  reference: 'REF-UNLOCK-9',
  createdAt: new Date(lagosMidnight + 1_000).toISOString(),
};
const BUYER = {
  ...UNLOCKS,
  id: 'unlock-1',
  description: 'Unlock · Test lighting guide',
  group: null,
  amountKobo: 250_000,
  totalKobo: 250_000,
  counterparty: { kind: 'wawu_user', name: 'Tolu Test', avatarUrl: null, wawuUserId: 'u-tolu', bankName: null, accountNumberLast4: null },
  reference: 'REF-UNLOCK-1',
};
let rows: unknown[] = [SEND, UNLOCKS];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  if (path === '/money/wallet') {
    return ok({ state: 'open', account: ACCOUNT, limits: null, pin: { isSet: true, changedAt: null, triesLeft: 5, lockedUntil: null }, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 });
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: 5_000_000, asOf: '2026-10-07T09:00:00.000Z' });
  if (path === '/money/transactions/summary') return ok({ month: url.searchParams.get('month'), inKobo: 1_000_000, outKobo: 2_000_000 });
  if (path === '/money/transactions') {
    if (url.searchParams.get('group') === 'g2.test-key') return ok({ items: [BUYER], nextCursor: null });
    if (url.searchParams.get('filter') === 'bills') return ok({ items: [], nextCursor: null });
    return ok({ items: rows, nextCursor: null });
  }
  const one = path.match(/^\/money\/transactions\/(.+)$/);
  if (one) {
    const found = [SEND, UNLOCKS, BUYER].find((r) => r.id === one[1]);
    return found ? ok(found) : json(404, { statusCode: 404, message: 'We could not find that transaction.', data: null, reason: { code: 'not_found', message: 'We could not find that transaction.' } });
  }
  return json(404, { statusCode: 404, message: 'Not here' });
}) as typeof fetch;

let queryClient: QueryClient;
let routes: Record<string, ComponentType>;
const page = (path: string) => (require(path) as { default: ComponentType }).default;
const Stub = ({ name }: { name: string }) => (
  <View>
    <Text accessibilityRole="header">{name}</Text>
  </View>
);

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

beforeAll(async () => {
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    '(tabs)/_layout': page('@/app/(tabs)/_layout'),
    '(tabs)/index': () => <Stub name="Home" />,
    '(tabs)/explore': () => <Stub name="Explore" />,
    '(tabs)/inbox': () => <Stub name="Inbox" />,
    '(tabs)/wallet': page('@/app/(tabs)/wallet'),
    '(tabs)/me': () => <Stub name="Me" />,
    'transactions/index': page('@/app/transactions/index'),
    'transactions/[id]': page('@/app/transactions/[id]'),
    'bills/index': () => <Stub name="S2 Pay a bill" />,
    welcome: () => <Stub name="Welcome" />,
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  rows = [SEND, UNLOCKS];
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f7'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('From the Wallet tab to the history and a receipt, on the real router', () => {
  it('a user on the Wallet tab taps See all and lands on W26, then a row and lands on W27, and Back walks the way it came', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByRole('button', { name: 'See all transactions' }));
    await waitFor(() => expect(pathname()).toBe('/transactions'));
    expect(await screen.findByLabelText('Search transactions')).toBeTruthy();
    expect(await screen.findByText('Ngozi Test')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('history-row-send-1'));
    await waitFor(() => expect(pathname()).toBe('/transactions/send-1'));
    expect(await screen.findByText('Transfer to Ngozi Test')).toBeTruthy();
    expect(screen.getByText('Reference')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Share receipt' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/transactions'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
    expect(await screen.findByText('See all')).toBeTruthy();
  });

  it('a user on the Wallet tab taps a recent row and lands on W27, and Back returns to the tab', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByTestId('wallet-row-send-1'));
    await waitFor(() => expect(pathname()).toBe('/transactions/send-1'));
    expect(await screen.findByText('Transfer to Ngozi Test')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a user on the Wallet tab taps a grouped row and sees the unlocks it stands for, not one unlock\u2019s receipt, and Back returns to the tab', async () => {
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByTestId('wallet-row-unlock-9'));
    expect(await screen.findByText('Tolu Test')).toBeTruthy();
    expect(pathname()).toBe('/transactions');
    expect(screen.queryByLabelText('Search transactions')).toBeNull();
    expect(screen.queryByText('Reference')).toBeNull();
    await fireEvent.press(screen.getByTestId('history-row-unlock-1'));
    await waitFor(() => expect(pathname()).toBe('/transactions/unlock-1'));
    expect(await screen.findByText('Unlock from Tolu Test')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a user taps a grouped row and sees the unlocks it stands for, then one of them as a receipt', async () => {
    await renderRouter(routes, { initialUrl: '/transactions' });
    await fireEvent.press(await screen.findByTestId('history-row-unlock-9'));
    expect(await screen.findByText('Tolu Test')).toBeTruthy();
    expect(screen.queryByLabelText('Search transactions')).toBeNull();
    await fireEvent.press(screen.getByTestId('history-row-unlock-1'));
    await waitFor(() => expect(pathname()).toBe('/transactions/unlock-1'));
    expect(await screen.findByText('Unlock from Tolu Test')).toBeTruthy();
  });

  it('a user who filters to Bills with none can tap Pay a bill and lands on Pay a bill (S2)', async () => {
    await renderRouter(routes, { initialUrl: '/transactions' });
    await fireEvent.press(await screen.findByRole('radio', { name: 'Bills' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Pay a bill' }));
    await waitFor(() => expect(pathname()).toBe('/bills'));
    expect(await screen.findByRole('header', { name: 'S2 Pay a bill' })).toBeTruthy();
  });

  it('the history opened on its own (no tab under it) goes Back to the Wallet tab', async () => {
    await renderRouter(routes, { initialUrl: '/transactions' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('a signed-out visit to either screen is sent to the welcome screen, and nothing is asked of the Hub', async () => {
    mockVault.clear();
    (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
    const before = (globalThis.fetch as jest.Mock).mock.calls.length;
    await renderRouter(routes, { initialUrl: '/transactions/send-1' });
    expect(await screen.findByRole('header', { name: 'Welcome' })).toBeTruthy();
    expect(
      (globalThis.fetch as jest.Mock).mock.calls.slice(before).filter(([input]) => String((input as Request).url ?? input).includes('/money/transactions')),
    ).toHaveLength(0);
  });
});
