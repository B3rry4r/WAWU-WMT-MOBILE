/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { ExploreScreenProps } from '../ExploreScreen';

let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
let bodies: Record<string, unknown[]> = {};

const ok = (data: unknown, status = 200): Answer => ({ status, body: { statusCode: status, message: 'OK', data } });
const refused = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, error: 'Bad Request' } });
const eventsPage = (items: unknown[]): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: items, pagination: { currentPage: 1, nextPage: null, perPage: 20, total: items.length } },
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  sent.push(`${key}${url.search}`);
  if (request.method === 'POST') (bodies[key] ??= []).push(await request.clone().json().catch(() => null));
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { ExploreScreen } = require('../ExploreScreen') as typeof import('../ExploreScreen');
const { sliderSlides } = require('../slider') as typeof import('../slider');
const { dotsWidth } = require('../ExploreSlider') as typeof import('../ExploreSlider');
const { tgifDayLabel } = require('@/features/home/model') as typeof import('@/features/home/model');
const { localDay } = require('@/features/tgif/model') as typeof import('@/features/tgif/model');

const FEATURED_EVENTS = 'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon&featured=true';
const UPCOMING = 'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon';
const ADS = 'GET /ads?placement=explore_slider';
const ME = 'me-1';

const ad = (id: string, headline: string, over: Record<string, unknown> = {}) => ({
  id,
  advertiser: 'Advertiser',
  headline,
  subline: `${headline} line`,
  ctaLabel: 'Get tickets',
  ctaDestination: 'event',
  ctaDestinationId: `dest-${id}`,
  artworkUrl: `https://img.example.test/${id}.jpg`,
  ...over,
});
const ev = (id: string, name: string) => ({
  id, hostWawuId: 'h', hostVerification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
  name, description: '', hostOrg: 'Hosts', hostOrgBio: null, format: 'in_person', type: 'summit', startsAt: '2026-11-02T09:00:00.000Z', endsAt: null,
  timeLabel: null, timezone: null, location: 'Lagos', address: null, venueName: 'Eko Convention Centre', externalUrl: null, bannerUrl: null,
  category: 'conference', contactEmail: null, contactPhone: null, cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null,
  recapText: null, featured: true, status: 'published', goingCount: 0, userGoing: false, userSaved: false, ticketed: false, priceFromNaira: null,
  speakers: [], createdAt: '2026-10-01T00:00:00.000Z', lastDecisionReason: null,
});

const day = { date: localDay(), series: 'Sons, not slaves', seriesTheme: 'Sonship', verse: 'v', verseReference: 'Galatians 4:7', reality: 'r', remember: 'm', prayer: 'p', takeaway: 't', shareLink: null };
const stats = (readers: number) => ({ date: localDay(), cards: [], readers, shares: 0, readByMe: false, sharedByMe: false });

function entries(over: Partial<ExploreScreenProps> = {}): ExploreScreenProps {
  return { onOpenCategory: jest.fn(), onOpenEvent: jest.fn(), onSeeAllEvents: jest.fn(), onFindProfessional: jest.fn(), onFindSchool: jest.fn(), onListServices: jest.fn(), onOpenTgif: jest.fn(), ...over };
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const realSetTimeout = setTimeout;
const settle = () => rtl.act(async () => {
  await new Promise((resolve) => realSetTimeout(resolve, 50));
  jest.advanceTimersByTime(50);
  await new Promise((resolve) => realSetTimeout(resolve, 0));
});

const flat = (node: { props: Record<string, unknown> }) => Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
const hidden = { includeHiddenElements: true };
const slideIds = () => rtl.screen.queryAllByTestId(/^explore-slide-\d+$/).map((n) => rtl.within(n).queryAllByTestId(/^explore-(ad|featured-event)-[a-z0-9]+$/)[0]?.props.testID);
/** The frame is measured at 350 wide (390 less the body's two gutters), as a phone does. */
const measure = () => rtl.act(async () => {
  rtl.fireEvent(rtl.screen.getByTestId('explore-hero'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 196 } } });
});
const reportsFor = (id: string) => (bodies[`POST /ads/${id}/events`] ?? []).map((b) => (b as { type: string }).type);

afterEach(async () => {
  jest.useRealTimers();
  mockFocused = true;
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  queryClient.getMutationCache().getAll().forEach((mutation) => mutation.destroy());
  queryClient.clear();
});

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
  answers = {
    'GET /explore/categories': [ok({ items: [{ id: 'music_audio', label: 'Music & Audio' }] })],
    'GET /explore/featured-creators?limit=10': [ok({ items: [] })],
    // R2-SOCIAL (c): nobody featured reads All creators' first page for the rail; these tests are about the slider, so it is empty.
    'GET /explore/creators?page=1&perPage=24': [{ status: 200, body: { statusCode: 200, message: 'OK', data: [], pagination: { currentPage: 1, nextPage: null, perPage: 24, total: 0 } } }],
    'GET /users/me': [ok({ wawuUserId: ME })],
    [FEATURED_EVENTS]: [eventsPage([])],
    [UPCOMING]: [eventsPage([])],
    [ADS]: [ok([])],
    [`GET /tgif/${localDay()}`]: [ok(day)],
    [`GET /tgif/${localDay()}/stats`]: [ok(stats(12400))],
    'GET /me/counts': [ok({ purchases: 0, saved: 0, unreadNotifications: 0 })],
    'POST /ads/a1/events': [ok({ counted: true })],
    'POST /ads/a2/events': [ok({ counted: true })],
    'POST /ads/a3/events': [ok({ counted: true })],
  };
  sent = [];
  bodies = {};
  queryClient.clear();
});

describe('the slides take turns (R-59)', () => {
  const a1 = ad('a1', 'Gospel Night Live');
  const a2 = ad('a2', 'Harvest Praise Night');
  const a3 = ad('a3', 'Worship Under the Stars');

  it('an advert comes first, then an event, then an advert, as the Hub returns them', () => {
    const slides = sliderSlides([a1, a2, a3] as never, [ev('e1', 'One'), ev('e2', 'Two')] as never);
    expect(slides.map((s) => s.key)).toEqual(['ad-a1', 'event-e1', 'ad-a2', 'event-e2', 'ad-a3']);
  });

  it('with no event only adverts show, with no advert only events, and with neither nothing', () => {
    expect(sliderSlides([a1, a2] as never, []).map((s) => s.kind)).toEqual(['ad', 'ad']);
    expect(sliderSlides([], [ev('e1', 'One')] as never).map((s) => s.kind)).toEqual(['event']);
    expect(sliderSlides([], [])).toEqual([]);
  });

  it('a user sees an advert, then an event, then an advert, with a dot for each and the first long', async () => {
    answers[ADS] = [ok([a1, a2])];
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    answers[UPCOMING] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    expect(slideIds()).toEqual(['explore-ad-a1', 'explore-featured-event-e1', 'explore-ad-a2']);
    // Changed assertions (R-116): the advert's headline and line were drawn text (getByText('Gospel Night Live') and its line); the owner's banner
    // carries its own words painted in, so the app draws only the picture and the chip, and the words are the card's label.
    expect(rtl.screen.queryByText('Gospel Night Live')).toBeNull();
    expect(rtl.screen.queryByText('Gospel Night Live line')).toBeNull();
    expect(rtl.screen.getByTestId('explore-ad-a1').props.accessibilityLabel).toBe('Sponsored. Gospel Night Live. Gospel Night Live line. Get tickets');
    expect(rtl.screen.getAllByText('SPONSORED').length).toBe(2);
    expect(rtl.screen.getByText('FEATURED EVENT')).toBeTruthy();
    const dots = [0, 1, 2].map((i) => flat(rtl.screen.getByTestId(`explore-hero-dot-${i}`, hidden)));
    expect(dots.map((d) => d.width)).toEqual([16, 6, 6]);
    expect(dots.every((d) => d.height === 6 && d.borderRadius === 3)).toBe(true);
    // Changed assertions (WALK1031-FIX F1, R-116): on an advert the dots were white at 100% and 45% (opacity [1, 0.45, 0.45]) and sat 8 in and 8 up on a
    // small pill ON the picture, on the banner's painted call to action. They now stand in a row under the card in the page's colours (the current dot
    // the accent, the rest the muted text colour, no opacity), centred, not placed on a corner. The new file `sliderDots.test.tsx` pins the colours,
    // the row and the heights on Android and on iOS.
    expect(dots.map((d) => d.opacity)).toEqual([undefined, undefined, undefined]);
    expect(dots[0].backgroundColor).not.toBe(dots[1].backgroundColor);
    expect(flat(rtl.screen.getByTestId('explore-hero-dots', hidden))).toMatchObject({ gap: 5 });
    expect(flat(rtl.screen.getByTestId('explore-hero-dots', hidden)).position).toBeUndefined();
    expect(rtl.within(rtl.screen.getByTestId('explore-hero')).queryByTestId('explore-hero-dots', hidden)).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('explore-hero-dots-row', hidden)).getByTestId('explore-hero-dots', hidden)).toBeTruthy();
    expect(rtl.screen.getByTestId('explore-ad-a1-artwork', hidden).props.source).toEqual([{ uri: 'https://img.example.test/a1.jpg' }]);
    expect(rtl.screen.getByTestId('explore-ad-a1-artwork', hidden).props.contentFit).toBe('contain');
  });

  it('a swipe moves the long dot, and an event slide puts the dots 18 up (X16)', async () => {
    answers[ADS] = [ok([a1, a2])];
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    await measure();
    const pager = rtl.screen.getByTestId('explore-slider');
    await rtl.act(async () => {
      rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x: 350, y: 0 }, contentSize: { width: 1050, height: 196 }, layoutMeasurement: { width: 350, height: 196 } } });
    });
    const dots = [0, 1, 2].map((i) => flat(rtl.screen.getByTestId(`explore-hero-dot-${i}`, hidden)));
    expect(dots.map((d) => d.width)).toEqual([6, 16, 6]);
    expect(flat(rtl.screen.getByTestId('explore-hero-dots', hidden))).toMatchObject({ right: 16, bottom: 18 });
    expect(pager.props.accessibilityLabel).toBe('Slide 2 of 3');
  });

  // SWEEP-APP EXPLORE-07 L3: the place was kept by position, so a refetch that put a slide in front moved the person to another slide.
  it('keeps the person on their slide when a refetch puts a slide in front of it', async () => {
    const { ExploreSlider } = require('../ExploreSlider') as typeof import('../ExploreSlider');
    const props = { showing: true, onOpenEvent: jest.fn() };
    const before = sliderSlides([a1, a2] as never, [ev('e1', 'Creators Summit')] as never);
    expect(before.map((s) => s.key)).toEqual(['ad-a1', 'event-e1', 'ad-a2']);
    await rtl.render(wrap(<ExploreSlider slides={before} {...props} />));
    await measure();
    const pager = rtl.screen.getByTestId('explore-slider');
    await rtl.act(async () => {
      rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x: 700, y: 0 }, contentSize: { width: 1050, height: 196 }, layoutMeasurement: { width: 350, height: 196 } } });
    });
    expect(pager.props.accessibilityLabel).toBe('Slide 3 of 3');
    const after = sliderSlides([a3, a1, a2] as never, [ev('e1', 'Creators Summit')] as never);
    expect(after.map((s) => s.key)).toEqual(['ad-a3', 'event-e1', 'ad-a1', 'ad-a2']);
    await rtl.act(async () => {
      rtl.screen.rerender(wrap(<ExploreSlider slides={after} {...props} />));
    });
    // Still the advert a2, which is now the fourth slide.
    expect(rtl.screen.getByTestId('explore-slider').props.accessibilityLabel).toBe('Slide 4 of 4');
  });

  // SWEEP-APP-3 row 98: the place was kept by its key only after the first swipe, so a person who had not swiped was moved by a reorder.
  it('keeps a person who has not swiped on the first slide they saw when a refetch puts slides in front of it', async () => {
    const { ExploreSlider } = require('../ExploreSlider') as typeof import('../ExploreSlider');
    const props = { showing: true, onOpenEvent: jest.fn() };
    const before = sliderSlides([a1, a2] as never, [ev('e1', 'Creators Summit')] as never);
    await rtl.render(wrap(<ExploreSlider slides={before} {...props} />));
    await measure();
    expect(rtl.screen.getByTestId('explore-slider').props.accessibilityLabel).toBe('Slide 1 of 3');
    const after = sliderSlides([a3, a1, a2] as never, [ev('e1', 'Creators Summit')] as never);
    expect(after.map((s) => s.key)).toEqual(['ad-a3', 'event-e1', 'ad-a1', 'ad-a2']);
    await rtl.act(async () => {
      rtl.screen.rerender(wrap(<ExploreSlider slides={after} {...props} />));
    });
    // Still the advert a1, which is now the third slide; the new first slide was never on screen, so its advert is not viewed.
    expect(rtl.screen.getByTestId('explore-slider').props.accessibilityLabel).toBe('Slide 3 of 4');
    await rtl.act(async () => {
      await Promise.resolve();
    });
    expect(reportsFor('a3')).toEqual([]);
  });

  it('with no featured event a user sees adverts only, and Upcoming events stays where it was (X17)', async () => {
    answers[ADS] = [ok([a1, a2])];
    answers[UPCOMING] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    expect(slideIds()).toEqual(['explore-ad-a1', 'explore-ad-a2']);
    expect(rtl.screen.queryByText('FEATURED EVENT')).toBeNull();
    expect(rtl.screen.getByText('Upcoming events')).toBeTruthy();
    expect(rtl.screen.queryByText('Sponsored')).toBeNull();
    const dots = [0, 1].map((i) => flat(rtl.screen.getByTestId(`explore-hero-dot-${i}`, hidden)).width);
    expect(dots).toEqual([16, 6]);
  });

  it('with one advert and no event the slider is that card alone, with no dots', async () => {
    answers[ADS] = [ok([a1])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    expect(slideIds()).toEqual(['explore-ad-a1']);
    expect(rtl.screen.queryByTestId('explore-hero-dots', hidden)).toBeNull();
    // With no event the Upcoming events row is not drawn (FIX-68 F-6).
    expect(rtl.screen.queryByText('Upcoming events')).toBeNull();
    expect(rtl.screen.getByTestId('explore-slider').props.scrollEnabled).toBe(false);
  });

  it('with no advert and no event the slider is not drawn', async () => {
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.screen.queryByTestId('explore-hero')).toBeNull();
  });

  it('with an event and no advert the slider is that event', async () => {
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    expect(slideIds()).toEqual(['explore-featured-event-e1']);
  });

  it('an advert the Hub could not draw (no picture, an unknown button) is not a slide', async () => {
    answers[ADS] = [ok([ad('a1', 'No picture', { artworkUrl: null }), ad('a2', 'Odd button', { ctaDestination: 'shop' }), a3])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    expect(slideIds()).toEqual(['explore-ad-a3']);
  });

  it('a refused advert read is no adverts, not an error on the screen', async () => {
    answers[ADS] = [refused(500, 'Down')];
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    expect(slideIds()).toEqual(['explore-featured-event-e1']);
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  });

  it('holds X14 until the adverts have answered, so nothing moves after the first picture', async () => {
    answers[ADS] = ['hold'];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await settle();
    expect(rtl.screen.getByTestId('explore-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-tiles')).toBeNull();
  });

  // R-116: the advert is the banner's shape (27 by 8) at the slide's full width and an event is 196 high, so the frame follows the swipe.
  it('the frame is the banner shape on an advert, 196 on an event, and grows and shrinks with the finger between them', async () => {
    answers[ADS] = [ok([a1, a2])];
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    await measure();
    const banner = (350 * 8) / 27;
    const pager = rtl.screen.getByTestId('explore-slider');
    const frame = () => flat(rtl.screen.getByTestId('explore-hero')).height as number;
    const to = (x: number) => rtl.act(async () => {
      rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x, y: 0 }, contentSize: { width: 1050, height: 196 }, layoutMeasurement: { width: 350, height: 196 } } });
    });
    expect(frame()).toBeCloseTo(banner, 5);
    expect(banner).toBeCloseTo(103.7, 1);
    await to(175);
    expect(frame()).toBeCloseTo((banner + 196) / 2, 5);
    await to(350);
    expect(frame()).toBe(196);
    await to(525);
    expect(frame()).toBeCloseTo((banner + 196) / 2, 5);
    await to(700);
    expect(frame()).toBeCloseTo(banner, 5);
    // The advert card inside is the banner's shape, never a height of its own.
    expect(flat(rtl.screen.getByTestId('explore-ad-a2')).aspectRatio).toBe(27 / 8);
    expect(flat(rtl.screen.getByTestId('explore-ad-a2')).height).toBeUndefined();
  });

  it('a pager of adverts only keeps one height from the first slide to the last', async () => {
    answers[ADS] = [ok([a1, a2])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    await measure();
    const pager = rtl.screen.getByTestId('explore-slider');
    const first = flat(rtl.screen.getByTestId('explore-hero')).height;
    await rtl.act(async () => {
      rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x: 175, y: 0 }, contentSize: { width: 700, height: 104 }, layoutMeasurement: { width: 350, height: 104 } } });
    });
    expect(flat(rtl.screen.getByTestId('explore-hero')).height).toBe(first);
    await rtl.act(async () => {
      rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x: 350, y: 0 }, contentSize: { width: 700, height: 104 }, layoutMeasurement: { width: 350, height: 104 } } });
    });
    expect(flat(rtl.screen.getByTestId('explore-hero')).height).toBe(first);
    expect(pager.props.accessibilityLabel).toBe('Slide 2 of 2');
  });

  it('the dots take room from a long headline so the two never meet', () => {
    expect(dotsWidth(3)).toBe(16 + 2 * 11);
  });
});

describe('what the Hub is told about an advert (ADS-05)', () => {
  const a1 = ad('a1', 'Gospel Night Live');
  const a2 = ad('a2', 'Harvest Praise Night');

  it('counts one view when the advert is on screen, a second advert’s view when its slide comes up, and each only once', async () => {
    answers[ADS] = [ok([a1, a2])];
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-hero');
    await settle();
    await measure();
    expect(reportsFor('a1')).toEqual(['view']);
    expect(reportsFor('a2')).toEqual([]);
    const pager = rtl.screen.getByTestId('explore-slider');
    const to = (x: number) => rtl.act(async () => {
      rtl.fireEvent.scroll(pager, { nativeEvent: { contentOffset: { x, y: 0 }, contentSize: { width: 1050, height: 196 }, layoutMeasurement: { width: 350, height: 196 } } });
    });
    await to(350);
    await settle();
    expect(reportsFor('a1')).toEqual(['view']);
    expect(reportsFor('a2')).toEqual([]);
    await to(700);
    await settle();
    expect(reportsFor('a2')).toEqual(['view']);
    await to(0);
    await to(700);
    await settle();
    expect(reportsFor('a1')).toEqual(['view']);
    expect(reportsFor('a2')).toEqual(['view']);
  });

  it('counts a tap once however many times it is pressed, and opens the advert’s event', async () => {
    answers[ADS] = [ok([a1])];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByTestId('explore-hero');
    await settle();
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-ad-a1'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-ad-a1'));
    await settle();
    expect(spies.onOpenEvent).toHaveBeenCalledWith('dest-a1');
    expect(reportsFor('a1')).toEqual(['view', 'tap']);
  });

  it('counts a tap for the advert that was pressed, not the one on screen, when a press lands on the slide beside it (EXPLORE-07 L1)', async () => {
    answers[ADS] = [ok([a1, a2])];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByTestId('explore-hero');
    await settle();
    // a1 is the slide on screen; a2's slide is pressed while the strip is between two slides
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-ad-a2'));
    await settle();
    expect(spies.onOpenEvent).toHaveBeenCalledWith('dest-a2');
    expect(reportsFor('a2')).toEqual(['tap']);
    expect(reportsFor('a1')).toEqual(['view']);
  });

  it('counts no view while Explore is not the tab on screen, and the view when it is', async () => {
    mockFocused = false;
    answers[ADS] = [ok([a1])];
    const screen = () => wrap(<ExploreScreen {...entries()} />);
    await rtl.render(screen());
    await rtl.screen.findByTestId('explore-hero');
    await settle();
    expect(reportsFor('a1')).toEqual([]);
    mockFocused = true;
    await rtl.act(async () => rtl.screen.rerender(screen()));
    await settle();
    expect(reportsFor('a1')).toEqual(['view']);
  });

  it('reports nothing for an event slide', async () => {
    answers[FEATURED_EVENTS] = [eventsPage([ev('e1', 'Creators Summit')])];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByTestId('explore-hero');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-event-e1'));
    await settle();
    expect(spies.onOpenEvent).toHaveBeenCalledWith('e1');
    expect(sent.filter((s) => s.startsWith('POST /ads'))).toEqual([]);
  });
});

describe('the TGIF card on Explore (X1, R-59)', () => {
  it('shows the day, the series and the Hub’s own count of readers, and opens today’s reader', async () => {
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByText('5 cards · 12.4K reading today');
    expect(rtl.screen.getByText(tgifDayLabel(localDay()))).toBeTruthy();
    expect(rtl.screen.getByText('Sons, not slaves')).toBeTruthy();
    await rtl.fireEvent.press(rtl.within(rtl.screen.getByTestId('explore-tgif')).getByRole('button'));
    expect(spies.onOpenTgif).toHaveBeenCalledTimes(1);
  });

  it('draws no reader count when the Hub has none or cannot say, never a figure of its own', async () => {
    answers[`GET /tgif/${localDay()}/stats`] = [ok(stats(0))];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByText('5 cards');
    await settle();
    expect(rtl.screen.queryByText(/reading today/)).toBeNull();
    expect(rtl.screen.queryByText(/12\.4K/)).toBeNull();
    expect(rtl.screen.queryByText(/2 min/)).toBeNull();
  });

  it('says so when the day cannot be read, in the card’s place, and Try again reads it again', async () => {
    answers[`GET /tgif/${localDay()}`] = [refused(500, 'Down'), ok(day)];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByTestId('today-tgif-error')).toBeTruthy();
    expect(rtl.screen.getByText('Today’s TGIF didn’t load.'.replace(/’/g, "'"))).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Sons, not slaves')).toBeTruthy();
    expect(rtl.screen.queryByTestId('today-tgif-error')).toBeNull();
  });

  it('holds the card’s place with a block the card’s height while the day is on its way, so the rows below do not move', async () => {
    answers[`GET /tgif/${localDay()}`] = ['hold'];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    const block = await rtl.screen.findByTestId('explore-tgif-loading');
    expect(flat(block).height).toBe(104);
    expect(rtl.screen.getByTestId('explore-tiles')).toBeTruthy();
  });

  it('sits under the slider and above the categories', async () => {
    answers[ADS] = [ok([ad('a1', 'Gospel Night Live')])];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tgif');
    const order = rtl.screen.getAllByTestId(/^explore-(hero|tgif|tiles)$/).map((n) => n.props.testID);
    expect(order).toEqual(['explore-hero', 'explore-tgif', 'explore-tiles']);
  });
});
