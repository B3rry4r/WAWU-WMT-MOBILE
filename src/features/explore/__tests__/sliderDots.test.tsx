/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { AccessibilityInfo, AppState, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * WALK1031-FIX, F1 and F3 (R-116) · on Explore's adverts nothing of ours sits on the picture but the SPONSORED chip: the owner's banners
 * paint their own call to action at the bottom right, where the pager dots used to sit. The dots now stand in a row under the card,
 * centred, in the page's colours (the current dot the accent, the rest muted), and the slider is that row taller only while an advert
 * is the slide on show (it grows and shrinks with the swipe, as the frame already does between an event and a banner). An event keeps
 * its white dots on the card, as drawn. One slide has no dots and no row. The chip's words are the app's smallest type token (11), not 9.
 * Run on Android and on iOS (Platform.OS set, the pager's own scroll handler, fake timers for the slider's own autoplay).
 */
globalThis.fetch = jest.fn(async () =>
  new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: { accepted: true } }), { status: 200, headers: { 'content-type': 'application/json' } }),
) as typeof fetch;

const { drawable } = require('@/features/ads/api') as typeof import('@/features/ads/api');
const { ExploreSlider, sliderDotsRowHeight, sliderRowHeight, sliderFrameHeight } = require('../ExploreSlider') as typeof import('../ExploreSlider');
const { adSlideHeight, adSlideMetrics } = require('../AdSlide') as typeof import('../AdSlide');
const { sliderSlides } = require('../slider') as typeof import('../slider');
const { sliderAutoMetrics } = require('../useSliderAutoplay') as typeof import('../useSliderAutoplay');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query') as typeof import('@tanstack/react-query');
const { darkColors, lightColors, type } = require('@/theme/tokens.generated') as typeof import('@/theme/tokens.generated');
const { setThemePick } = require('@/theme/override') as typeof import('@/theme/override');

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
const flat = (node: { props: Record<string, unknown> }) => StyleSheet.flatten(node.props.style as never) as Record<string, number | string | undefined>;
const hidden = { includeHiddenElements: true };
const banner = (350 * 8) / 27;
const ROW = sliderDotsRowHeight;

let scrollTo: jest.SpyInstance;
const appState = AppState as unknown as { currentState: unknown };
const originalState = appState.currentState;

describe.each(['android', 'ios'] as const)('the Explore slider dots on an advert (%s)', (os) => {
  let restorePlatform: () => void;
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'] });
    restorePlatform = (() => {
      const spy = jest.replaceProperty(Platform, 'OS', os);
      return () => spy.restore();
    })();
    appState.currentState = 'active';
    jest.spyOn(AppState, 'addEventListener').mockImplementation((() => ({ remove: () => undefined })) as never);
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(false));
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((() => ({ remove: () => undefined })) as never);
    scrollTo = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: () => void }, 'scrollTo').mockImplementation(() => undefined) as jest.SpyInstance;
    scrollTo.mockClear();
  });
  afterEach(() => {
    rtl.cleanup();
    jest.restoreAllMocks();
    appState.currentState = originalState;
    setThemePick('system');
    restorePlatform();
    jest.useRealTimers();
  });

  const settle = () => rtl.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
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
  async function open(slides: ReturnType<typeof sliderSlides>) {
    await rtl.render(tree(<ExploreSlider slides={slides} showing onOpenEvent={jest.fn()} />));
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('explore-hero'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 104 } } });
    });
    await settle();
  }
  const frame = () => flat(rtl.screen.getByTestId('explore-hero')).height as number;
  const rowOrNull = () => rtl.screen.queryByTestId('explore-hero-dots-row', hidden);
  const rowHeight = () => (rowOrNull() ? (flat(rowOrNull()!).height as number) : 0);
  const total = () => frame() + rowHeight();
  const dotsOf = (count: number) => Array.from({ length: count }, (_, i) => rtl.screen.getByTestId(`explore-hero-dot-${i}`, hidden));
  const three = () => sliderSlides([card(1), card(2), card(3)], []);

  it('puts the dots in a row under the card, off the picture: the card holds the picture and the SPONSORED chip and nothing else', async () => {
    await open(three());
    const picture = rtl.screen.getByTestId('explore-hero');
    // Not on the picture: the frame the cards sit in holds no dots, and the row under it holds them.
    expect(rtl.within(picture).queryByTestId('explore-hero-dots', hidden)).toBeNull();
    const row = rtl.screen.getByTestId('explore-hero-dots-row', hidden);
    expect(rtl.within(row).getByTestId('explore-hero-dots', hidden)).toBeTruthy();
    // The row is after the frame, in the block both stand in.
    const block = rtl.screen.getByTestId('explore-slider-block');
    expect(rtl.within(block).getByTestId('explore-hero')).toBeTruthy();
    // Each card draws the picture and the chip only: its one drawn word is SPONSORED, and none of the pager's parts are on it.
    for (const n of [1, 2, 3]) {
      const one = rtl.screen.getByTestId(`explore-ad-${id(n)}`);
      expect(rtl.within(one).queryAllByText(/./, hidden).map((t) => t.props.children)).toEqual(['SPONSORED']);
      expect(rtl.within(one).queryByTestId('explore-hero-dots', hidden)).toBeNull();
      expect(rtl.within(one).queryByTestId(`explore-ad-${id(n)}-artwork`, hidden)).toBeTruthy();
    }
    // Centred in a row of its own, not placed on a corner.
    expect(flat(row)).toMatchObject({ alignItems: 'center', justifyContent: 'flex-end', height: ROW });
    const dots = rtl.screen.getByTestId('explore-hero-dots', hidden);
    expect(flat(dots).position).toBeUndefined();
    expect(flat(dots).right).toBeUndefined();
    expect(flat(dots).bottom).toBeUndefined();
    expect(flat(dots)).toMatchObject({ flexDirection: 'row', gap: 5 });
    // The row is for the eye only: it takes no touch and a screen reader skips it.
    expect(row.props.pointerEvents).toBe('none');
    expect(dots.props.accessibilityElementsHidden).toBe(true);
    expect(dots.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('draws the current dot in the accent and the rest muted, in both themes', async () => {
    await open(three());
    const colours = () => dotsOf(3).map((d) => flat(d).backgroundColor);
    expect(dotsOf(3).map((d) => flat(d).width)).toEqual([16, 6, 6]);
    expect(dotsOf(3).every((d) => flat(d).height === 6 && flat(d).borderRadius === 3)).toBe(true);
    await rtl.act(async () => setThemePick('dark'));
    expect(colours()).toEqual([darkColors.accent, darkColors.textMuted, darkColors.textMuted]);
    await rtl.act(async () => setThemePick('light'));
    expect(colours()).toEqual([lightColors.accent, lightColors.textMuted, lightColors.textMuted]);
    // Page colours, never the white of a dot on a picture.
    expect(colours().some((c) => c === darkColors.textOnAccent)).toBe(false);
    // One swipe on: the long dot and the accent are the second one's.
    await phoneScrolls(350);
    expect(dotsOf(3).map((d) => flat(d).width)).toEqual([6, 16, 6]);
    expect(colours()).toEqual([lightColors.textMuted, lightColors.accent, lightColors.textMuted]);
  });

  it('is as tall as the banner plus the row on an advert, and as the event alone on an event: it grows and shrinks with the finger, never a jump', async () => {
    await open(sliderSlides([card(1), card(2)], [event] as never));
    // slides: advert, event, advert.
    expect(frame()).toBeCloseTo(banner, 5);
    expect(rowHeight()).toBe(ROW);
    expect(total()).toBeCloseTo(banner + ROW, 5);
    // Half way to the event: both the frame and the row are half way, so the total is the straight line between the two.
    await phoneScrolls(175);
    expect(rowHeight()).toBeCloseTo(ROW / 2, 5);
    expect(total()).toBeCloseTo((banner + ROW + 196) / 2, 5);
    // On the event: 196, no row, as drawn (X16).
    await phoneScrolls(350);
    expect(frame()).toBe(196);
    expect(rowOrNull()).toBeNull();
    expect(total()).toBe(196);
    await phoneScrolls(525);
    expect(rowHeight()).toBeCloseTo(ROW / 2, 5);
    expect(total()).toBeCloseTo((banner + ROW + 196) / 2, 5);
    await phoneScrolls(700);
    expect(total()).toBeCloseTo(banner + ROW, 5);
    // Every step of a swipe changes the total by the same amount (a straight line from one height to the other: no jump).
    const along: number[] = [];
    for (let x = 0; x <= 350; x += 50) {
      await phoneScrolls(x);
      along.push(total());
    }
    const steps = along.slice(1).map((h, i) => h - along[i]);
    steps.forEach((s) => expect(s).toBeCloseTo(steps[0], 5));
    expect(along[0]).toBeCloseTo(banner + ROW, 5);
    expect(along[along.length - 1]).toBe(196);
  });

  it('keeps the same height along a pager of adverts only, with the row always there', async () => {
    await open(three());
    const first = total();
    expect(first).toBeCloseTo(banner + ROW, 5);
    for (const x of [100, 175, 350, 500, 700]) {
      await phoneScrolls(x);
      expect(total()).toBe(first);
      expect(rowHeight()).toBe(ROW);
    }
  });

  it('keeps the event slide\'s white dots on the card, at its bottom right, and takes them back to the row on the next advert', async () => {
    await open(sliderSlides([card(1), card(2)], [event] as never));
    expect(rtl.within(rtl.screen.getByTestId('explore-hero')).queryByTestId('explore-hero-dots', hidden)).toBeNull();
    await phoneScrolls(350);
    const dots = rtl.screen.getByTestId('explore-hero-dots', hidden);
    expect(rtl.within(rtl.screen.getByTestId('explore-hero')).getByTestId('explore-hero-dots', hidden)).toBe(dots);
    expect(flat(dots)).toMatchObject({ position: 'absolute', right: 16, bottom: 18, gap: 5 });
    expect(dotsOf(3).map((d) => flat(d).backgroundColor)).toEqual([darkColors.textOnAccent, darkColors.textOnAccent, darkColors.textOnAccent]);
    expect(dotsOf(3).map((d) => flat(d).opacity)).toEqual([0.45, 1, 0.45]);
    expect(dotsOf(3).map((d) => flat(d).width)).toEqual([6, 16, 6]);
    expect(rowOrNull()).toBeNull();
    await phoneScrolls(700);
    expect(rtl.within(rtl.screen.getByTestId('explore-hero-dots-row', hidden)).getByTestId('explore-hero-dots', hidden)).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('explore-hero')).queryByTestId('explore-hero-dots', hidden)).toBeNull();
    expect(dotsOf(3).map((d) => flat(d).width)).toEqual([6, 6, 16]);
  });

  it('follows the slider\'s own autoplay: the long dot moves in the row as each advert slides in, and back to the first', async () => {
    await open(three());
    const long = () => dotsOf(3).map((d) => flat(d).width === 16);
    expect(long()).toEqual([true, false, false]);
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 350, animated: true });
    await phoneScrolls(175);
    await phoneScrolls(350);
    expect(long()).toEqual([false, true, false]);
    expect(rtl.within(rtl.screen.getByTestId('explore-hero-dots-row', hidden)).getByTestId('explore-hero-dots', hidden)).toBeTruthy();
    await pass(EVERY);
    await phoneScrolls(700);
    expect(long()).toEqual([false, false, true]);
    await pass(EVERY);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: true });
    await phoneScrolls(350);
    await phoneScrolls(0);
    expect(long()).toEqual([true, false, false]);
    // The row is the same height all the way round: the page under it never moves.
    expect(rowHeight()).toBe(ROW);
  });

  it('has no dots and no row with one slide, and is the banner alone', async () => {
    await open(sliderSlides([card(1)], []));
    expect(rtl.screen.queryByTestId('explore-hero-dots', hidden)).toBeNull();
    expect(rowOrNull()).toBeNull();
    expect(frame()).toBeCloseTo(banner, 5);
    expect(total()).toBeCloseTo(banner, 5);
    expect(rtl.screen.getByTestId('explore-slider').props.scrollEnabled).toBe(false);
  });

  it('draws the SPONSORED chip in the app\'s smallest type token, in the top right corner', async () => {
    await open(three());
    const words = rtl.screen.getAllByText('SPONSORED', hidden)[0];
    expect(flat(words).fontSize).toBe(type.size.label);
    expect(flat(words).fontSize as number).toBeGreaterThanOrEqual(10);
    expect(type.size.label).toBe(Math.min(...Object.values(type.size)));
    expect(adSlideMetrics.chipWords).toBe(type.size.label);
    // Still a small chip in the corner the banners leave bare: top right, 18 high, 6 in.
    const chip = words.parent!;
    expect(flat(chip)).toMatchObject({ position: 'absolute', top: 6, right: 6, height: 18 });
    expect(flat(chip).left).toBeUndefined();
    expect(flat(chip).bottom).toBeUndefined();
  });
});

describe('the heights the slider takes (pure)', () => {
  it('has a row only on an advert and only with two or more slides', () => {
    const ads = sliderSlides([card(1), card(2)], [event] as never);
    expect(sliderRowHeight(ads, 0)).toBe(ROW);
    expect(sliderRowHeight(ads, 1)).toBe(0);
    expect(sliderRowHeight(ads, 2)).toBe(ROW);
    expect(sliderRowHeight(ads, 0.5)).toBe(ROW / 2);
    expect(sliderRowHeight(sliderSlides([card(1)], []), 0)).toBe(0);
    expect(sliderRowHeight([], 0)).toBe(0);
    expect(sliderFrameHeight(ads, 0, 350)).toBeCloseTo(adSlideHeight(350), 5);
    expect(ROW).toBe(14);
  });
});
