/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, usePathname } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * DV2-04 (M19, E21) through the real route files: the Create hub's Event tile, the host form's entry and See tiers, over a stand-in
 * `fetch` in the Hub's shapes (EVENTS-12: 403 tier_required; `GET /me/tier`; `GET /plans`).
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

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });

const hub = {
  tier: 'none' as 'none' | 'active' | 'ended',
  tick: false,
  posts: 0,
  refuseSend: false,
};

const tierView = () =>
  hub.tier === 'none'
    ? { state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null }
    : {
        state: hub.tier,
        tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } },
        activeFrom: '2026-10-01T00:00:00.000Z',
        activeUntil: '2026-11-26T12:00:00.000Z',
        productsAllowed: 3,
        productsUsed: 2,
        extraProducts: 0,
        pointsIncluded: 100,
        firstVoiceIntroIncluded: true,
        eventPass: null,
      };

const plansView = () => {
  const tier = (id: string, name: string, priceMinor: number) => ({ id, name, days: 30, products: 3, bonusPoints: 100, bonusPointsExpireDays: 365, priceMinor, eventPass: { id: 'p', name: 'Pass' }, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: false });
  return { currency: 'NGN', currencyFixed: false, tiers: [tier('verify', 'Verify', 100_000), tier('plus', 'Verify Plus', 300_000), tier('founding', 'Founding Maker', 500_000)], extraProducts: { count: 5, priceMinor: 150_000 }, packs: [], checkoutBump: { points: 1000, priceMinor: 80_000 }, actions: [], caps: {} };
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === '/users/me') return ok({ wawuUserId: '00000000-0000-4000-8000-0000000000b4', accountType: 'creator', firstName: 'Lennox', lastName: 'Emmanuel' });
  if (path === '/me/tier') return ok(tierView());
  if (path === '/plans') return ok(plansView());
  if (path === '/uploads/allowance') {
    const allowed = hub.tier === 'active' ? 3 : 0;
    return ok({ tickHeld: hub.tick, uploads: { used: hub.tier === 'active' ? 2 : 0, allowed, remaining: allowed ? 1 : 0 }, free: { uploads: 0 }, withTick: { uploads: 25 } });
  }
  if (path === '/verification/me') {
    const live = { verified: hub.tick, expiresAt: null };
    return ok({ verification: { creator: live, professional: { verified: false, expiresAt: null } }, pricing: { creator: 2000, professional: 2000, currency: 'NGN', termMonths: 12 }, eligibility: [] });
  }
  if (path === '/events/options') {
    return ok({ categories: [{ value: 'music', label: 'Music' }], formats: [{ value: 'online', label: 'Online' }], types: [{ value: 'workshop', label: 'Workshop' }], tickets: { hostSharePercent: 85, minPriceNaira: 0, maxPriceNaira: 10_000_000, minQuantity: 1, maxQuantity: 1_000_000, nameMinLength: 2, nameMaxLength: 60, maxTypes: 20 }, fields: { nameMax: 160, descriptionMax: 5000, hostOrgMax: 160, addressMax: 300 } });
  }
  if (path === '/product-drafts') return ok([]);
  if (path === '/events' && request.method === 'POST') {
    hub.posts += 1;
    return json(403, { statusCode: 403, message: 'Needs a tier. Pick a tier to host an event.', data: null, reason: { code: 'tier_required', message: 'Needs a tier. Pick a tier to host an event.', tierState: hub.tier === 'ended' ? 'ended' : 'none', currency: 'NGN', lowestTier: { id: 'verify', name: 'Verify', priceMinor: 100_000 } } });
  }
  return json(404, { statusCode: 404, message: `Not here: ${request.method} ${path}`, data: null });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
function Where() {
  const params = useLocalSearchParams();
  return <Text testID="where">{`${usePathname()}?${new URLSearchParams(params as Record<string, string>).toString()}`}</Text>;
}
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
        <Where />
      </View>
    );
  }
  return Stub;
};

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    welcome: stub('Welcome'),
    index: stub('Home'),
    create: page('@/app/create'),
    'create-format': stub('Pick a format'),
    'community/new': stub('New community'),
    shop: stub('Your shop'),
    library: stub('Library'),
    studio: stub('Studio'),
    tiers: stub('Tiers'),
    'events/index': stub('Events'),
    'events/host': page('@/app/events/host'),
    'events/mine': stub('My events'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/create' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { tier: 'none', tick: false, posts: 0, refuseSend: false });
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000b4'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});
afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('M19 to E21 · hosting needs a tier', () => {
  it('a person with no tier taps Event, sees Needs a tier with the Hub’s lowest price, and See tiers opens VF5', async () => {
    await renderRouter(routes, { initialUrl: '/create' });
    await fireEvent.press(await screen.findByTestId('create-tile-event'));
    expect(await screen.findByText('Hosting needs a tier')).toBeTruthy();
    expect(await screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect((await screen.findAllByText(/needs a tier/i)).length).toBeGreaterThan(0);
    // G-IAP-02-5: the Hub's plan price is never drawn; the store's own is (storePrices test), and none while the store has not answered.
    expect(screen.queryByText(/From/)).toBeNull();
    expect(screen.queryByTestId('host-name')).toBeNull();
    expect(hub.posts).toBe(0);
    await fireEvent.press(screen.getByTestId('host-see-tiers'));
    expect(await screen.findByTestId('where')).toHaveTextContent(/^\/tiers/);
  });

  it('a person whose tier ended, with no live tick, meets the same page', async () => {
    hub.tier = 'ended';
    await renderRouter(routes, { initialUrl: '/create' });
    await fireEvent.press(await screen.findByTestId('create-tile-event'));
    expect(await screen.findByText('Hosting needs a tier')).toBeTruthy();
    expect(await screen.findByTestId('host-see-tiers')).toBeTruthy();
    expect(screen.queryByTestId('host-name')).toBeNull();
  });

  it('a person with a tier sees the products meter on Create, and Event opens the form', async () => {
    hub.tier = 'active';
    await renderRouter(routes, { initialUrl: '/create' });
    expect(await screen.findByTestId('create-products')).toHaveAccessibleName('2 of 3 products. Verify · ends 26 Nov');
    await fireEvent.press(screen.getByTestId('create-tile-event'));
    expect(await screen.findByTestId('host-name')).toBeTruthy();
    expect(screen.queryByTestId('host-gate')).toBeNull();
  });

  it('a person with a live tick and no tier still gets the form: nothing live stops working', async () => {
    hub.tick = true;
    await renderRouter(routes, { initialUrl: '/events/host' });
    expect(await screen.findByTestId('host-name')).toBeTruthy();
    expect(screen.queryByTestId('host-gate')).toBeNull();
  });

  it('Back from the page returns to Create', async () => {
    await renderRouter(routes, { initialUrl: '/create' });
    await fireEvent.press(await screen.findByTestId('create-tile-event'));
    await screen.findByTestId('host-gate');
    await fireEvent.press(screen.getByTestId('host-back'));
    await waitFor(() => expect(screen.queryByTestId('host-gate')).toBeNull());
    expect(screen.getByTestId('create-screen')).toBeTruthy();
  });
});
