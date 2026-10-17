/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';

/*
 * M29 and M30 as their real route files, on the real Expo Router stack: each kind of purchase opens the screen it bought, a saved
 * piece opens its own page, and Back returns to the list. The Hub is a stand-in `fetch` installed before the app's modules load.
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

let answers: Record<string, unknown> = {};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const data = answers[url.pathname];
  if (data === undefined) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const Purchases = (require('@/app/purchases') as typeof import('@/app/purchases')).default;
const Saved = (require('@/app/saved') as typeof import('@/app/saved')).default;
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { ACCESS_KEY, REFRESH_KEY } = require('@/api/tokenStore') as typeof import('@/api/tokenStore');

/** A destination: the screen's name and the id it was opened with. */
const stub = (name: string) =>
  function Stub() {
    const params = useLocalSearchParams<{ id?: string; orderId?: string }>();
    return <Text testID="landed">{[name, params.id ?? params.orderId].filter(Boolean).join(' ')}</Text>;
  };

const routes = {
  _layout: () => (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  ),
  index: stub('home'),
  welcome: stub('welcome'),
  purchases: Purchases,
  saved: Saved,
  'content/[id]': stub('piece'),
  'events/[id]': stub('event'),
  'events/orders/[orderId]': stub('ticket'),
  'schools/mine': stub('courses'),
  'community/[id]': stub('room'),
};

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const goBack = () => (jest.requireActual('expo-router') as typeof import('expo-router')).router.back();

const person = { wawuId: 'w-chidi', displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } };
const bought = (id: string, kind: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  kind,
  title,
  amountKobo: 500000,
  totalKobo: 506500,
  purchasedAt: '2026-09-26T09:00:00.000Z',
  status: 'paid',
  openId: `open-${id}`,
  content: null,
  lessons: null,
  credits: null,
  ...over,
});
const piece = (id: string, contentType: string) =>
  bought(`p-${id}`, 'content_unlock', `Piece ${id}`, { openId: id, content: { id, title: `Piece ${id}`, contentType, thumbnailUrl: null, creator: person }, lessons: contentType === 'course' ? { total: 12, done: 3 } : null });

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes, { initialUrl: '/purchases' });
  await unmount();
}, 60_000);

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0, retry: false } });
  mockVault.clear();
  mockVault.set(ACCESS_KEY, tokenFor('u1'));
  mockVault.set(REFRESH_KEY, 'refresh-1');
  resetSessionForTests();
  answers = {
    '/api/hub/me/purchases/all': {
      items: [
        piece('v1', 'video'),
        bought('t1', 'event_ticket', 'Lagos Nights'),
        bought('s1', 'school_fee', 'Brand Design Cohort 4'),
        bought('m1', 'community_pass', 'Creators Lagos'),
        bought('k1', 'credit_pack', '40 WAWU Credits', { openId: null, credits: 40 }),
      ],
      nextCursor: null,
    },
    '/api/hub/me/saved': {
      items: [
        { id: 's-w6', kind: 'content', savedAt: '2026-10-01T10:00:00.000Z', content: { id: 'w6', title: 'Agency breakdown', contentType: 'video', accessType: 'paid', priceKobo: 250000, thumbnailUrl: null, bought: false, creator: person }, event: null, creator: null },
        { id: 's-m1', kind: 'creator', savedAt: '2026-10-01T08:00:00.000Z', content: null, event: null, creator: person },
      ],
      nextCursor: null,
    },
  };
});

async function openList() {
  await renderRouter(routes, { initialUrl: '/purchases' });
  await screen.findByText('Lagos Nights');
}

describe('M29 · each purchase opens what it bought', () => {
  it.each([
    ['purchase-open-t1', 'ticket open-t1', '/events/orders/open-t1'],
    ['purchase-open-s1', 'courses', '/schools/mine'],
    ['purchase-open-m1', 'room open-m1', '/community/open-m1'],
    ['purchase-open-p-v1', 'piece v1', '/content/v1'],
  ])('%s opens %s, and Back is the list again', async (testID, landed, path) => {
    await openList();
    await fireEvent.press(screen.getByTestId(testID));
    await waitFor(() => expect(pathname()).toBe(path));
    expect((await screen.findByTestId('landed')).props.children).toBe(landed);
    goBack();
    await waitFor(() => expect(pathname()).toBe('/purchases'));
    expect(await screen.findByText('Lagos Nights')).toBeTruthy();
  });

  it('the Watch button on a video opens the piece, and a credit pack opens nothing', async () => {
    await openList();
    expect(screen.queryByTestId('purchase-open-k1')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Watch' }));
    await waitFor(() => expect(pathname()).toBe('/content/v1'));
  });
});

describe('M30 · a saved piece opens its own page', () => {
  it('a saved piece opens /content/<id>, a saved creator opens nothing, and Back is Saved again', async () => {
    await renderRouter(routes, { initialUrl: '/saved' });
    await screen.findByText('Agency breakdown');
    expect(screen.queryByTestId('saved-open-s-m1')).toBeNull();
    await fireEvent.press(screen.getByTestId('saved-open-s-w6'));
    await waitFor(() => expect(pathname()).toBe('/content/w6'));
    expect((await screen.findByTestId('landed')).props.children).toBe('piece w6');
    goBack();
    await waitFor(() => expect(pathname()).toBe('/saved'));
    expect(await screen.findByText('Agency breakdown')).toBeTruthy();
  });
});
