/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { localDay } from '@/features/tgif/model';

/**
 * FIX-P5 (CHECK-3 fifth pass, L3, R-92: "the home today's strip should be increased to the explore card size"; R-116 then made both the banner shape) · the ad card on Today and
 * the advert slide on Explore are one card (`AdSlide`) and the same size at 360 and at 390: the same banner shape (R-116, 27 by 8), the same corner, and the same
 * width, which is the window less the screen's two gutters. What made them differ was a scrollbar: Explore's body showed a vertical scrollbar on
 * the web build (15 px of the slide's width gone, 335 against Today's 350) while Today's body hides it. Neither body draws one now.
 * Jest has no layout engine, so the width is what each screen's own styles give: the body's padding, no scrollbar, no width of the card's own.
 */
let mockWidth = 390;
const mockPush = jest.fn();
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 844, scale: 2, fontScale: 1 }),
}));
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => '00000000-0000-4000-8000-0000000000aa' }));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
}));

const ok = (data: unknown, pagination?: unknown) => ({ statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) });
const page = (items: unknown[]) => ok(items, { currentPage: 1, nextPage: null, perPage: 20, total: items.length });
const AD = {
  id: '11111111-1111-4111-8111-111111111111',
  advertiser: 'Acme',
  headline: 'Acme sale this week',
  subline: 'Everything for creators',
  ctaLabel: 'Visit Acme',
  ctaDestination: 'link',
  ctaUrl: 'https://example.com/acme',
  artworkUrl: 'https://cdn.example.test/acme.jpg',
};
const DAY = localDay();
const answers: Record<string, unknown> = {
  'GET /explore/categories': ok({ items: [] }),
  'GET /explore/featured-creators?limit=10': ok({ items: [] }),
  'GET /explore/creators?page=1&perPage=24': page([]),
  'GET /users/me': ok({ wawuUserId: 'me-1' }),
  'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon&featured=true': page([]),
  'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon': page([]),
  'GET /ads?placement=explore_slider': ok([AD]),
  'GET /ads?placement=today_slot': ok(AD),
  [`GET /tgif/${DAY}`]: ok({ date: DAY, series: 'S', seriesTheme: 'T', verse: 'v', verseReference: 'Galatians 4:7', reality: 'r', remember: 'm', prayer: 'p', takeaway: 't', shareLink: null }),
  [`GET /tgif/${DAY}/stats`]: ok({ date: DAY, cards: [], readers: 5, shares: 0, readByMe: false, sharedByMe: false }),
  'GET /me/counts': ok({ purchases: 0, saved: 0, unreadNotifications: 0 }),
  'GET /money/wallet': ok({ state: 'open', account: { accountNumber: '1154079370', accountName: 'Ada Sandbox', bankName: 'Loma Bank' } }),
  'GET /money/wallet/balance': ok({ availableKobo: 48525075, asOf: '2026-10-07T10:00:00Z' }),
  'GET /settings/tgif': ok({ show: false }),
  'GET /creators': page([]),
  [`POST /ads/${AD.id}/events`]: ok({ accepted: true }),
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const body = answers[`${key}${url.search}`] ?? answers[key];
  if (!body) throw new TypeError('Network request failed');
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { ExploreScreen } = require('@/features/explore/ExploreScreen') as typeof import('@/features/explore/ExploreScreen');
const { TodayScreen } = require('@/features/home/TodayScreen') as typeof import('@/features/home/TodayScreen');
const { layout } = require('@/theme') as typeof import('@/theme');

const flat = (node: { props: Record<string, unknown> }, prop = 'style') => Object.assign({}, ...[node.props[prop]].flat(Infinity).filter(Boolean));
const hidden = { includeHiddenElements: true };

const clients: QueryClient[] = [];
function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: mockWidth, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
afterEach(async () => {
  rtl.cleanup();
  clients.splice(0).forEach((c) => c.clear());
});

/** What the screen's own styles give the card: the window less the body's two paddings, with no scrollbar taking any of it. */
function room(scroll: { props: Record<string, unknown> }) {
  expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
  const { paddingHorizontal } = flat(scroll, 'contentContainerStyle');
  expect(paddingHorizontal).toBe(layout.gutter);
  return mockWidth - 2 * paddingHorizontal;
}

describe.each([360, 390])('the ad card on Today and the advert slide on Explore at %i wide', (width) => {
  it('are the same width and the same shape', async () => {
    mockWidth = width;

    const explore = await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} onOpenEvent={jest.fn()} onSeeAllEvents={jest.fn()} onFindProfessional={jest.fn()} onFindSchool={jest.fn()} onListServices={jest.fn()} onOpenTgif={jest.fn()} />));
    const slide = await explore.findByTestId(`explore-ad-${AD.id}`, hidden, { timeout: 30_000 });
    const exploreRoom = room(explore.getByTestId('explore-scroll'));
    // The slide is as wide as the frame it sits in: the window less the gutters (a measured frame says the same).
    expect(flat(explore.getByTestId('explore-slide-0'))).toMatchObject({ width: exploreRoom });
    await rtl.act(async () => {
      rtl.fireEvent(explore.getByTestId('explore-hero'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: exploreRoom, height: 196 } } });
    });
    expect(flat(explore.getByTestId('explore-slide-0'))).toMatchObject({ width: exploreRoom });
    const exploreCard = flat(slide);
    await explore.unmount();

    const today = await rtl.render(wrap(<TodayScreen onView={() => undefined} masked={false} onToggleMask={() => undefined} />));
    const card = await today.findByTestId('today-sponsored', hidden, { timeout: 60_000 });
    const todayRoom = room(today.getByTestId('today-scroll'));
    const todayCard = flat(card);

    expect(todayRoom).toBe(exploreRoom);
    expect(todayRoom).toBe(width - 40);
    // Neither card sets a width, a margin or an inset of its own: both fill what the body gives them.
    for (const style of [exploreCard, todayCard]) {
      expect(style.width).toBeUndefined();
      expect(style.marginHorizontal).toBeUndefined();
      expect(style.marginLeft).toBeUndefined();
      expect(style.marginRight).toBeUndefined();
    }
    // Changed assertions (R-116): the card was 196 high (`height` 196) at both places; it is now the owner's banner shape, 27 by 8, whose height is
    // the width over 3.375 (a layout engine does that sum, jest has none), so what is pinned is the shape and that neither place sets a height.
    expect(todayCard.aspectRatio).toBe(27 / 8);
    expect(todayCard.aspectRatio).toBe(exploreCard.aspectRatio);
    expect(todayCard.height).toBeUndefined();
    expect(exploreCard.height).toBeUndefined();
    expect(todayCard.borderRadius).toBe(exploreCard.borderRadius);
  }, 120_000);
});
