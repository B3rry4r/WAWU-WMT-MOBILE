/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * AD-BANNER (R-116) · the banner card on an Android phone (Platform.OS android, the real handlers): a swipe on the Explore slider
 * pages between an advert and an event and the frame follows, a tap on a link card opens the advertiser's address in the phone's
 * browser (expo-linking, never window.open), a tap on a card that does nothing opens nothing, and Today's card is the same card.
 * What only a real phone can show (the thumb's feel on the paging, the browser handing back to the app) is on the task's PHONE CHECK.
 */
const mockOpenURL = jest.fn(async (_url: string) => true);
jest.mock('expo-linking', () => ({ openURL: (url: string) => mockOpenURL(url) }));

let sent: { key: string; body: unknown }[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.clone().text();
  sent.push({ key: `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`, body: text ? JSON.parse(text) : undefined });
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { accepted: true } }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { drawable, openAd } = require('../api') as typeof import('../api');
const { SponsoredSlot } = require('../SponsoredSlot') as typeof import('../SponsoredSlot');
const { ExploreSlider } = require('@/features/explore/ExploreSlider') as typeof import('@/features/explore/ExploreSlider');
const { sliderSlides } = require('@/features/explore/slider') as typeof import('@/features/explore/slider');

const LINK_URL = 'https://example.com/register';
const wire = (id: string, over: Record<string, unknown>) => ({
  id,
  advertiser: 'WAWU',
  headline: `Win ${id}`,
  subline: 'Enter today',
  artworkUrl: `https://cdn.example.test/${id}.png`,
  ...over,
});
const card = (id: string, over: Record<string, unknown>) => {
  const drawn = drawable(wire(id, over));
  if (!drawn) throw new Error('should be drawable');
  return drawn;
};
const link = card('11111111-1111-4111-8111-111111111111', { ctaDestination: 'link', ctaLabel: 'Register now', ctaUrl: LINK_URL });
const none = card('22222222-2222-4222-8222-222222222222', { ctaDestination: 'none' });
const event = {
  id: 'e1', hostWawuId: 'h', hostVerification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
  name: 'Creators Summit', description: '', hostOrg: 'Hosts', hostOrgBio: null, format: 'in_person', type: 'summit', startsAt: '2026-11-02T09:00:00.000Z', endsAt: null,
  timeLabel: null, timezone: null, location: 'Lagos', address: null, venueName: 'Eko Convention Centre', externalUrl: null, bannerUrl: null,
  category: 'conference', contactEmail: null, contactPhone: null, cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null,
  recapText: null, featured: true, status: 'published', goingCount: 0, userGoing: false, userSaved: false, ticketed: false, priceFromNaira: null,
  speakers: [], createdAt: '2026-10-01T00:00:00.000Z', lastDecisionReason: null,
};

const { QueryClient, QueryClientProvider } = require('@tanstack/react-query') as typeof import('@tanstack/react-query');
const safe = (node: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
  </QueryClientProvider>
);
const flat = (node: { props: Record<string, unknown> }) => StyleSheet.flatten(node.props.style as never) as Record<string, number | undefined>;
const kinds = (id: string) => sent.filter((s) => s.key === `POST /ads/${id}/events`).map((s) => (s.body as { type: string }).type);

let restore: (() => void) | undefined;
beforeEach(() => {
  mockOpenURL.mockClear();
  sent = [];
  const spy = jest.replaceProperty(Platform, 'OS', 'android');
  restore = () => spy.restore();
});
afterEach(() => {
  restore?.();
  rtl.cleanup();
});

describe('the Explore slider on Android', () => {
  const slides = () => sliderSlides([link, none], [event] as never);

  it('is a pager the thumb can swipe inside a scrolling page, and a swipe pages and resizes the frame', async () => {
    const screen = await rtl.render(safe(<ExploreSlider slides={slides()} showing onOpenEvent={jest.fn()} />));
    await rtl.act(async () => {
      rtl.fireEvent(screen.getByTestId('explore-hero'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 104 } } });
    });
    const pager = screen.getByTestId('explore-slider');
    // The page behind it scrolls the other way: Android needs the nested scroll said, and paging on.
    expect(pager.props.nestedScrollEnabled).toBe(true);
    expect(pager.props.pagingEnabled).toBe(true);
    expect(pager.props.horizontal).toBe(true);
    expect(pager.props.scrollEnabled).toBe(true);
    expect(pager.props.accessibilityLabel).toBe('Slide 1 of 3');
    const banner = (350 * 8) / 27;
    expect(flat(screen.getByTestId('explore-hero')).height).toBeCloseTo(banner, 5);
    const swipeTo = (x: number) =>
      rtl.act(async () => {
        rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x, y: 0 }, contentSize: { width: 1050, height: 196 }, layoutMeasurement: { width: 350, height: 196 } } });
      });
    await swipeTo(350);
    expect(pager.props.accessibilityLabel).toBe('Slide 2 of 3');
    expect(flat(screen.getByTestId('explore-hero')).height).toBe(196);
    await swipeTo(700);
    expect(pager.props.accessibilityLabel).toBe('Slide 3 of 3');
    expect(flat(screen.getByTestId('explore-hero')).height).toBeCloseTo(banner, 5);
    await swipeTo(0);
    expect(pager.props.accessibilityLabel).toBe('Slide 1 of 3');
    expect(screen.getByTestId('explore-hero-dot-0', { includeHiddenElements: true }).props.style).toBeTruthy();
  });

  it('a tap on a link card opens the address in the phone’s browser and counts one tap; the painted button is the call, so no pill is drawn', async () => {
    const onOpenEvent = jest.fn();
    const screen = await rtl.render(safe(<ExploreSlider slides={slides()} showing onOpenEvent={onOpenEvent} />));
    expect(screen.queryByText('Register now')).toBeNull();
    await rtl.fireEvent.press(screen.getByTestId(`explore-ad-${link.id}`));
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
    expect(onOpenEvent).not.toHaveBeenCalled();
    await rtl.waitFor(() => expect(kinds(link.id)).toEqual(['view', 'tap']));
  });

  it('a tap on a card that does nothing opens nothing and counts no tap', async () => {
    const screen = await rtl.render(safe(<ExploreSlider slides={[{ kind: 'ad', key: `ad-${none.id}`, ad: none }]} showing onOpenEvent={jest.fn()} />));
    const card = screen.getByTestId(`explore-ad-${none.id}`);
    expect(card.props.accessibilityRole).toBeUndefined();
    await rtl.fireEvent.press(card);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(mockOpenURL).not.toHaveBeenCalled();
    expect(kinds(none.id)).toEqual(['view']);
  });
});

describe('Today’s card on Android', () => {
  it('is the same banner card; a tap on a link card opens the address, a card that does nothing is not pressable', async () => {
    const onOpen = jest.fn(() => openAd(link, jest.fn()));
    const screen = await rtl.render(<SponsoredSlot ad={link} onOpen={onOpen} />);
    expect(flat(screen.getByTestId('today-sponsored')).aspectRatio).toBe(27 / 8);
    await rtl.fireEvent.press(screen.getByTestId('today-sponsored'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
    mockOpenURL.mockClear();
    const quiet = jest.fn();
    const still = await rtl.render(<SponsoredSlot ad={none} onOpen={quiet} />);
    await rtl.fireEvent.press(still.getAllByTestId('today-sponsored').at(-1)!);
    expect(quiet).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
