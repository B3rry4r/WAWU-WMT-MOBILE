/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { AccessibilityInfo, AppState, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * AD-SLIDE (R-116, owner, 31 Oct 2026: "Ads should be sliding automatically") · the Explore slider moves by itself, on Android and on
 * iOS (Platform.OS set, the pager's own touch and scroll handlers, fake timers). It moves to the next slide every 5 seconds with the
 * swipe's own animated scroll, goes back to the first after the last, and only while there are two or more slides, Explore is on
 * show, the app is in front and the phone's reduce-motion setting is off. A touch or a drag pauses it and it starts again 5 seconds
 * after the finger lifts. It never moves the screen reader's focus and never counts a tap. What only a real phone can show (how the
 * animated scroll looks and feels, whether a thumb on a card reaches the pager's touch events) is on the task's PHONE CHECK.
 */
let sent: { key: string; body: unknown }[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.clone().text();
  sent.push({ key: `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`, body: text ? JSON.parse(text) : undefined });
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { accepted: true } }), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { drawable } = require('@/features/ads/api') as typeof import('@/features/ads/api');
const { ExploreSlider } = require('../ExploreSlider') as typeof import('../ExploreSlider');
const { sliderSlides } = require('../slider') as typeof import('../slider');
const { sliderAutoMetrics } = require('../useSliderAutoplay') as typeof import('../useSliderAutoplay');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query') as typeof import('@tanstack/react-query');

const EVERY = sliderAutoMetrics.everyMs;
const id = (n: number) => `${n}${n}${n}${n}${n}${n}${n}${n}-${n}${n}${n}${n}-4${n}${n}${n}-8${n}${n}${n}-${String(n).repeat(12)}`;
const card = (n: number) => {
  const drawn = drawable({ id: id(n), advertiser: 'WAWU', headline: `Win ${n}`, subline: 'Enter today', artworkUrl: `https://cdn.example.test/${n}.png`, ctaDestination: 'link', ctaLabel: 'Register', ctaUrl: 'https://example.com/r' });
  if (!drawn) throw new Error('should be drawable');
  return drawn;
};
const event = {
  id: 'e1', hostWawuId: 'h', hostVerification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
  name: 'Creators Summit', description: '', hostOrg: 'Hosts', hostOrgBio: null, format: 'in_person', type: 'summit', startsAt: '2026-11-02T09:00:00.000Z', endsAt: null,
  timeLabel: null, timezone: null, location: 'Lagos', address: null, venueName: 'Eko Convention Centre', externalUrl: null, bannerUrl: null,
  category: 'conference', contactEmail: null, contactPhone: null, cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null,
  recapText: null, featured: true, status: 'published', goingCount: 0, userGoing: false, userSaved: false, ticketed: false, priceFromNaira: null,
  speakers: [], createdAt: '2026-10-01T00:00:00.000Z', lastDecisionReason: null,
};

const client = new QueryClient();
const tree = (node: React.ReactNode) => (
  <QueryClientProvider client={client}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{node}</SafeAreaProvider>
  </QueryClientProvider>
);
const flat = (node: { props: Record<string, unknown> }) => StyleSheet.flatten(node.props.style as never) as Record<string, number | undefined>;
const kinds = (n: number) => sent.filter((s) => s.key === `POST /ads/${id(n)}/events`).map((s) => (s.body as { type: string }).type);
const hidden = { includeHiddenElements: true };

/** What the phone's AppState and accessibility settings would tell the slider: the handlers it registered. */
let appStateHandlers: Set<(state: string) => void>;
let reduceMotionHandlers: Set<(on: boolean) => void>;
let reduceMotion: Promise<boolean>;
let scrollTo: jest.SpyInstance;
// The test renderer's AppState holds a mock function where the phone holds 'active' | 'background' | 'inactive'.
const appState = AppState as unknown as { currentState: unknown };
const originalState = appState.currentState;

describe.each(['android', 'ios'] as const)('the Explore slider moves by itself (%s)', (os) => {
  let restorePlatform: () => void;
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
    sent = [];
    restorePlatform = (() => {
      const spy = jest.replaceProperty(Platform, 'OS', os);
      return () => spy.restore();
    })();
    appStateHandlers = new Set();
    reduceMotionHandlers = new Set();
    reduceMotion = Promise.resolve(false);
    appState.currentState = 'active';
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((type: string, handler: (state: string) => void) => {
      if (type === 'change') appStateHandlers.add(handler);
      return { remove: () => appStateHandlers.delete(handler) };
    }) as never);
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => reduceMotion);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((type: string, handler: (on: boolean) => void) => {
      if (type === 'reduceMotionChanged') reduceMotionHandlers.add(handler);
      return { remove: () => reduceMotionHandlers.delete(handler) };
    }) as never);
    scrollTo = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: () => void }, 'scrollTo').mockImplementation(() => undefined) as jest.SpyInstance;
    // The pager's `scrollTo` is one mock function shared by every test (and spying on a mock hands the same one back).
    scrollTo.mockClear();
    (AccessibilityInfo.setAccessibilityFocus as jest.Mock).mockClear();
    (AccessibilityInfo.sendAccessibilityEvent as jest.Mock).mockClear();
    (AccessibilityInfo.announceForAccessibility as jest.Mock).mockClear();
    (AccessibilityInfo.announceForAccessibilityWithOptions as jest.Mock).mockClear();
  });
  afterEach(() => {
    rtl.cleanup();
    jest.restoreAllMocks();
    appState.currentState = originalState;
    restorePlatform();
    jest.useRealTimers();
  });

  const settle = () => rtl.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  /** Time passes the way it does on a phone: the timers run, then React draws what they changed. */
  const pass = async (ms: number) => {
    await rtl.act(async () => {
      jest.advanceTimersByTime(ms);
    });
    await settle();
  };
  const phoneScrolls = (x: number) =>
    rtl.act(async () => {
      rtl.fireEvent.scroll(rtl.screen.getByTestId('explore-slider'), { nativeEvent: { contentOffset: { x, y: 0 }, contentSize: { width: 1400, height: 104 }, layoutMeasurement: { width: 350, height: 104 } } });
    });
  const pager = () => rtl.screen.getByTestId('explore-slider');
  const label = () => pager().props.accessibilityLabel as string;
  const activeDot = (count: number) => Array.from({ length: count }, (_, i) => i).filter((i) => flat(rtl.screen.getByTestId(`explore-hero-dot-${i}`, hidden)).width === 16);

  async function open(slides: ReturnType<typeof sliderSlides>, showing = true) {
    const view = await rtl.render(tree(<ExploreSlider slides={slides} showing={showing} onOpenEvent={jest.fn()} />));
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('explore-hero'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 104 } } });
    });
    await settle();
    return view;
  }
  const four = () => sliderSlides([card(1), card(2), card(3), card(4)], []);
  const three = () => sliderSlides([card(1), card(2), card(3)], []);

  it('moves to the next slide after 5 seconds with the swipe\'s animated scroll, and the dots follow', async () => {
    await open(three());
    expect(label()).toBe('Slide 1 of 3');
    await pass(EVERY - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    await pass(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 350, animated: true });
    // The phone's scroll events carry the pager there; the label and the dots follow them.
    await phoneScrolls(175);
    await phoneScrolls(350);
    expect(label()).toBe('Slide 2 of 3');
    expect(activeDot(3)).toEqual([1]);
    // And 5 seconds after that, the next one.
    await pass(EVERY - 1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    await pass(1);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 700, animated: true });
    await phoneScrolls(700);
    expect(label()).toBe('Slide 3 of 3');
    expect(activeDot(3)).toEqual([2]);
  });

  it('goes back to the first slide after the last, then carries on', async () => {
    await open(three());
    await phoneScrolls(700);
    expect(label()).toBe('Slide 3 of 3');
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: true });
    await phoneScrolls(400);
    await phoneScrolls(0);
    expect(label()).toBe('Slide 1 of 3');
    expect(activeDot(3)).toEqual([0]);
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 350, animated: true });
  });

  it('takes an advert, an event and an advert in turn, a banner then a featured event then a banner', async () => {
    await open(sliderSlides([card(1), card(2)], [event] as never));
    expect(label()).toBe('Slide 1 of 3');
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 350, animated: true });
    await phoneScrolls(350);
    expect(flat(rtl.screen.getByTestId('explore-hero')).height).toBe(196);
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 700, animated: true });
    await phoneScrolls(700);
    expect(flat(rtl.screen.getByTestId('explore-hero')).height).toBeCloseTo((350 * 8) / 27, 5);
  });

  it('does not count a view for an advert it passes on the slide back to the first, only for those it lands on', async () => {
    await open(four());
    await settle();
    expect(kinds(1)).toEqual(['view']);
    // The person flicks straight to the last advert (a scroll event can skip slides), so adverts 2 and 3 were never on screen.
    await phoneScrolls(1050);
    await settle();
    expect(kinds(4)).toEqual(['view']);
    expect(kinds(2)).toEqual([]);
    expect(kinds(3)).toEqual([]);
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: true });
    // The animated scroll goes back across adverts 3 and 2; the phone reports each place on the way.
    await phoneScrolls(800);
    await phoneScrolls(700);
    await phoneScrolls(350);
    await phoneScrolls(100);
    await settle();
    expect(kinds(2)).toEqual([]);
    expect(kinds(3)).toEqual([]);
    await phoneScrolls(0);
    await settle();
    expect(label()).toBe('Slide 1 of 4');
    expect(kinds(1)).toEqual(['view']);
    expect(kinds(2)).toEqual([]);
    expect(kinds(3)).toEqual([]);
    // A person who swipes to advert 2 afterwards is counted for it.
    await phoneScrolls(350);
    await settle();
    expect(kinds(2)).toEqual(['view']);
  });

  it('releases the held views after a second even if the landing is never seen', async () => {
    await open(four());
    await phoneScrolls(1050);
    await pass(EVERY);
    await phoneScrolls(700);
    await settle();
    expect(kinds(3)).toEqual([]);
    await pass(sliderAutoMetrics.rewindMs);
    await settle();
    expect(kinds(3)).toEqual(['view']);
  });

  it('counts a view once per advert and never a tap, however many times it moves', async () => {
    await open(three());
    for (let lap = 0; lap < 2; lap += 1) {
      for (const x of [350, 700, 0]) {
        await pass(EVERY);
        await phoneScrolls(x);
      }
    }
    await settle();
    expect([kinds(1), kinds(2), kinds(3)]).toEqual([['view'], ['view'], ['view']]);
    expect(sent.some((s) => (s.body as { type?: string } | undefined)?.type === 'tap')).toBe(false);
  });

  it('pauses while a finger is on it and starts again 5 seconds after the finger lifts', async () => {
    await open(three());
    const slider = pager();
    await pass(3000);
    await rtl.act(async () => {
      rtl.fireEvent(slider, 'touchStart');
    });
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
    await rtl.act(async () => {
      rtl.fireEvent(slider, 'touchEnd');
    });
    await pass(EVERY - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    await pass(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 350, animated: true });
  });

  it('pauses for the whole of a swipe, even when the touch is cancelled once the pager takes the drag, and resumes 5 seconds after it ends', async () => {
    await open(three());
    const slider = pager();
    await rtl.act(async () => {
      rtl.fireEvent(slider, 'touchStart');
      rtl.fireEvent(slider, 'scrollBeginDrag');
      // The phone cancels the touch events when the pager's own drag starts; the drag is still going.
      rtl.fireEvent(slider, 'touchCancel');
    });
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
    await phoneScrolls(200);
    await rtl.act(async () => {
      rtl.fireEvent(slider, 'scrollEndDrag');
    });
    await phoneScrolls(350);
    await pass(EVERY - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    await pass(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    // The person is on slide 2, so the next is slide 3.
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 700, animated: true });
  });

  it('a tap that is cancelled also lets it start again 5 seconds later', async () => {
    await open(three());
    await rtl.act(async () => {
      rtl.fireEvent(pager(), 'touchStart');
    });
    await rtl.act(async () => {
      rtl.fireEvent(pager(), 'touchCancel');
    });
    await pass(EVERY);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('does not move while Explore is not the screen on show, and starts 5 seconds after it comes back', async () => {
    const view = await open(three(), false);
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
    await view.rerender(tree(<ExploreSlider slides={three()} showing onOpenEvent={jest.fn()} />));
    await settle();
    await pass(EVERY - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    await pass(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    // Leaving again stops it at once.
    await view.rerender(tree(<ExploreSlider slides={three()} showing={false} onOpenEvent={jest.fn()} />));
    await settle();
    await pass(60000);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('does not move while the app is in the background or inactive, and starts 5 seconds after it comes to the front', async () => {
    await open(three());
    expect(appStateHandlers.size).toBe(1);
    await pass(2000);
    await rtl.act(async () => {
      appStateHandlers.forEach((h) => h('background'));
    });
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
    await rtl.act(async () => {
      appStateHandlers.forEach((h) => h('active'));
    });
    await pass(EVERY - 1);
    expect(scrollTo).not.toHaveBeenCalled();
    await pass(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    await rtl.act(async () => {
      appStateHandlers.forEach((h) => h('inactive'));
    });
    await pass(60000);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('does not start when the app opens in the background', async () => {
    appState.currentState = 'background';
    await open(three());
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('does nothing with one slide: no timer, no scroll, no dots', async () => {
    await open(sliderSlides([card(1)], []));
    expect(jest.getTimerCount()).toBe(0);
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(rtl.screen.queryByTestId('explore-hero-dots', hidden)).toBeNull();
  });

  it('does not move by itself with the phone\'s reduce-motion setting on, and stops when it is turned on', async () => {
    reduceMotion = Promise.resolve(true);
    await open(three());
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
    // A swipe still pages it by hand: the pager is not disabled.
    expect(pager().props.scrollEnabled).toBe(true);
  });

  it('stops when reduce motion is turned on while it runs, and carries on when it is turned off', async () => {
    await open(three());
    await pass(EVERY);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(reduceMotionHandlers.size).toBe(1);
    await rtl.act(async () => {
      reduceMotionHandlers.forEach((h) => h(true));
    });
    await pass(60000);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    await rtl.act(async () => {
      reduceMotionHandlers.forEach((h) => h(false));
    });
    await pass(EVERY);
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });

  it('does not move until the phone has said reduce motion is off', async () => {
    reduceMotion = new Promise<boolean>(() => undefined);
    await open(three());
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('never moves the screen reader\'s focus or says anything when it moves', async () => {
    await open(three());
    for (const x of [350, 700, 0]) {
      await pass(EVERY);
      await phoneScrolls(x);
    }
    expect(scrollTo).toHaveBeenCalledTimes(3);
    expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    expect(AccessibilityInfo.sendAccessibilityEvent).not.toHaveBeenCalled();
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    expect(AccessibilityInfo.announceForAccessibilityWithOptions).not.toHaveBeenCalled();
  });

  it('clears every timer and listener when the screen goes away', async () => {
    const view = await open(three());
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    expect(appStateHandlers.size).toBe(1);
    expect(reduceMotionHandlers.size).toBe(1);
    await view.unmount();
    expect(jest.getTimerCount()).toBe(0);
    expect(appStateHandlers.size).toBe(0);
    expect(reduceMotionHandlers.size).toBe(0);
    await pass(60000);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('clears the held-views timer too when it goes away in the middle of the slide back', async () => {
    const view = await open(four());
    await phoneScrolls(1050);
    await pass(EVERY);
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    await view.unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
