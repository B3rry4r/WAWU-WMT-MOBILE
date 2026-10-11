/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import type { QueryClient } from '@tanstack/react-query';
import type { ComponentType } from 'react';

import { localDay } from '@/features/tgif/model';

/*
 * The bills screens on the real Expo Router stack and tabs (BILLS-01): a signed-in user walks Wallet or Home to Pay a bill
 * (S2), Electricity (S3), a company and the meter (S4), and Back walks the same way home. The Hub answers through a
 * stand-in `fetch`, installed before the app's modules load: the API client keeps the `fetch` it finds when it is made.
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

const ME = '00000000-0000-4000-8000-0000000000f3';
const ACCOUNT = { accountNumber: '8100000528', accountName: 'Ada Eze', bankName: 'Loma Bank', bankCode: '090620', licenceLine: null, depositInsuranceLine: null, openedAt: '2026-10-07T09:00:00.000Z' };
const ok = (data: unknown, pagination?: unknown) =>
  new Response(JSON.stringify({ statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) }), { status: 200, headers: { 'content-type': 'application/json' } });
const IKEJA = { code: 'Ikeja_Electric_Bill_Payment', name: 'Ikeja Electric', plan: 'prepaid', minimumKobo: 50000, maximumKobo: 50000000, presets: [{ amountKobo: 200000 }, { amountKobo: 500000 }] };
const DAY = localDay();
const asked: string[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  asked.push(`${request.method} ${path}`);
  if (path === '/money/wallet') {
    return ok({ state: 'open', account: ACCOUNT, limits: null, pin: { isSet: true, changedAt: null, triesLeft: 5, lockedUntil: null }, bankTransfers: { allowed: true, blockedBy: null }, beneficiaryCount: 0 });
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: 48525075, asOf: '2026-10-07T09:00:00.000Z' });
  if (path === '/money/transactions') return ok({ items: [], nextCursor: null });
  if (path === '/bills/electricity/billers') return ok({ available: true, billers: [IKEJA] });
  if (path === '/bills/electricity/meter-preview') {
    return ok({ meterNumber: '04123456789', code: IKEJA.code, plan: 'prepaid', name: 'Chidinma Okoro', address: '14 Admiralty Way' });
  }
  if (path === '/settings/tgif') return ok({ show: true });
  if (path === `/tgif/${DAY}`) {
    return ok({ date: DAY, series: 'A series', seriesTheme: 'Theme', verse: 'v', verseReference: 'r', reality: 'x', remember: 'y', prayer: 'z', takeaway: 't', shareLink: null });
  }
  if (path === `/tgif/${DAY}/stats`) return ok({ date: DAY, cards: [], readers: 3, shares: 0, readByMe: false, sharedByMe: false });
  if (path === '/creators') return ok([], { currentPage: 1, nextPage: null, perPage: 12, total: 0 });
  if (path === '/users/me') return ok({ wawuUserId: ME });
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not here' }), { status: 404 });
}) as typeof fetch;

let queryClient: QueryClient;
const page = (path: string) => (require(path) as { default: ComponentType }).default;
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
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    '(tabs)/_layout': page('@/app/(tabs)/_layout'),
    '(tabs)/index': page('@/app/(tabs)/index'),
    '(tabs)/explore': page('@/app/(tabs)/explore'),
    '(tabs)/inbox': page('@/app/(tabs)/inbox'),
    '(tabs)/wallet': page('@/app/(tabs)/wallet'),
    '(tabs)/me': page('@/app/(tabs)/me'),
    'bills/index': page('@/app/bills/index'),
    'bills/electricity/index': page('@/app/bills/electricity/index'),
    'bills/electricity/[code]': page('@/app/bills/electricity/[code]'),
  };
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  asked.length = 0;
  queryClient.clear();
  // No cache timer outliving a test.
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(ME));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('bills, on the real router', () => {
  it('a user on the Wallet tab taps a bills tile and lands on Pay a bill (S2), then Electricity, a company and the meter (S4), and Back walks home', async () => {
    await renderRouter(routes);
    await fireEvent.press(screen.getByRole('tab', { name: 'Wallet' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Power' }));
    await waitFor(() => expect(pathname()).toBe('/bills'));
    expect(await screen.findByText('What are you paying for?')).toBeTruthy();

    await fireEvent.press(await screen.findByRole('button', { name: 'Electricity' }));
    await waitFor(() => expect(pathname()).toBe('/bills/electricity'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ikeja Electric, Prepaid' }));
    await waitFor(() => expect(pathname()).toBe('/bills/electricity/Ikeja_Electric_Bill_Payment'));
    expect(await screen.findByText('Ikeja Electric · Prepaid')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('meter-number'), '0412 3456 789');
    expect(await screen.findByText('Chidinma Okoro · 14 Admiralty Way', undefined, { timeout: 4000 })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '₦5,000' }));
    expect(screen.getByTestId('amount').props.value).toBe('5,000');
    expect(asked.filter((a) => a === 'POST /bills/electricity/meter-preview')).toHaveLength(1);

    // Back walks S4, S3, S2 and the Wallet tab again.
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/bills/electricity'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/bills'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it('the X on "Paying for" on S4 goes to S2, and the X on "Biller" goes to S3', async () => {
    await renderRouter(routes, { initialUrl: '/bills' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Electricity' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ikeja Electric, Prepaid' }));
    await screen.findByText('Ikeja Electric · Prepaid');
    await fireEvent.press(screen.getByRole('button', { name: 'Change the company' }));
    await waitFor(() => expect(pathname()).toBe('/bills/electricity'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Ikeja Electric, Prepaid' }));
    await screen.findByText('Ikeja Electric · Prepaid');
    await fireEvent.press(screen.getByRole('button', { name: 'Change what you are paying for' }));
    await waitFor(() => expect(pathname()).toBe('/bills'));
    expect(await screen.findByText('What are you paying for?')).toBeTruthy();
  });

  it('a user on Home taps Pay bills, or Bills on the balance card, and lands on Pay a bill (S2)', async () => {
    await renderRouter(routes);
    await fireEvent.press(await screen.findByRole('button', { name: 'Pay bills' }));
    await waitFor(() => expect(pathname()).toBe('/bills'));
    expect(await screen.findByText('What are you paying for?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(pathname()).toBe('/'));
    await fireEvent.press(await screen.findByTestId('today-action-bills'));
    await waitFor(() => expect(pathname()).toBe('/bills'));
    expect(await screen.findByText('What are you paying for?')).toBeTruthy();
  });

  it('the bills screens open straight from their address, as a person who follows a link does', async () => {
    await renderRouter(routes, { initialUrl: '/bills/electricity/Ikeja_Electric_Bill_Payment' });
    expect(await screen.findByText('Ikeja Electric · Prepaid')).toBeTruthy();
    expect(screen.getByTestId('meter-number')).toBeTruthy();
  });
});
