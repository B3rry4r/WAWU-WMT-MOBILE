import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { openAd } from '@/features/ads/api';
import { useAdReports } from '@/features/ads/useAd';
import { ExploreFeaturedEvent, exploreEventMetrics as ev } from '@/features/events/ExploreEvents';
import { layout, space, useWawu } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import { AdSlide, adSlideHeight } from './AdSlide';
import type { Slide } from './slider';
import { useSliderAutoplay } from './useSliderAutoplay';

/**
 * The slider's pager dots (design/_gen/explore.js `sdots`): 6 high, 5 apart, the current one 16 wide and white, the others 6
 * wide and white at 45%. They sit 16 in from the right and 18 up on an event (the event slide's own dots, `hero`). On an advert
 * (R-116, the walk's F1: the owner's banners paint their own call to action at the bottom right, so nothing of ours sits on the
 * picture but the SPONSORED chip) they leave the picture: a row under the card, centred, in the page's colours (the current dot the
 * accent, the rest the muted text colour). The slider is that row taller only while an advert is the slide on show.
 */
export const sliderDotsMetrics = {
  dot: 6,
  active: 16,
  between: 5,
  right: 16,
  bottomEvent: 18,
  dim: 0.45,
  /** Under an advert: the gap between the card and the dots. The row is this and a dot high. */
  rowGap: space.sm,
  /** The gap between an event's words and the dots at their right. */
  dotsGap: 10,
} as const;

const d = sliderDotsMetrics;

/** How wide `count` dots are, with one of them long. */
export const dotsWidth = (count: number) => d.active + (count - 1) * (d.dot + d.between);

/**
 * How tall the slider's frame is at a place along the pager (R-116): an advert is the banner's shape at the width, an event is
 * the event card's 196. Between two slides of different heights it is the blend of the two by how far the swipe has gone, so the
 * frame grows or shrinks with the finger and never jumps. `page` is the scroll position in slides (0 is the first slide).
 */
export function sliderFrameHeight(slides: readonly Slide[], page: number, width: number): number {
  const heightOf = (slide: Slide | undefined) => (slide?.kind === 'ad' ? adSlideHeight(width) : ev.heroHeight);
  if (slides.length === 0) return ev.heroHeight;
  return blendAlong(slides, page, heightOf);
}

/** A number per slide, blended by how far along the pager the swipe is: `page` is the scroll position in slides (0 is the first). */
function blendAlong(slides: readonly Slide[], page: number, valueOf: (slide: Slide | undefined) => number): number {
  const at = Math.min(Math.max(page, 0), slides.length - 1);
  const from = Math.floor(at);
  const to = Math.min(from + 1, slides.length - 1);
  return valueOf(slides[from]) + (valueOf(slides[to]) - valueOf(slides[from])) * (at - from);
}

/** The height of the dots' row under the card: an advert has one, an event has its dots on the card. */
export const sliderDotsRowHeight = d.rowGap + d.dot;

/**
 * How tall the dots' row under the card is at a place along the pager (R-116, F1): the full row on an advert, none on an event,
 * and between the two the blend by how far the swipe has gone, so the slider grows and shrinks with the finger and never jumps.
 * A pager of one slide has no dots and so no row.
 */
export function sliderRowHeight(slides: readonly Slide[], page: number): number {
  if (slides.length < 2) return 0;
  return blendAlong(slides, page, (slide) => (slide?.kind === 'ad' ? sliderDotsRowHeight : 0));
}

export type ExploreSliderProps = {
  slides: readonly Slide[];
  /** Whether Explore is the tab on screen: an advert is counted as viewed only then (ADS-05). */
  showing: boolean;
  /** An event slide, or an advert's button, opens this event (E2). */
  onOpenEvent: (id: string) => void;
};

/**
 * X1, X16 and X17's slider: one card at a time, the slides taking turns (an advert, an event, an advert, and so on),
 * paged by a swipe, with a dot for each slide. An advert is reported to the Hub as viewed when its slide is the one on
 * screen and as tapped when it is pressed, each once for the advert (ADS-05; the Hub keeps one of each a day per person).
 * An advert is the owner's banner shape (R-116) and an event is 196 high, so the frame follows the swipe (`sliderFrameHeight`).
 * With one slide it is not a pager: no dots, nothing to swipe. With none it is not drawn, which is the caller's call.
 * With two or more it also moves by itself (R-116: every 5 seconds, the swipe's own animation, back to the first after the last),
 * only while Explore is on show and the app is in front, never with the phone's reduce-motion setting on, and a touch pauses it.
 */
export function ExploreSlider({ slides, showing, onOpenEvent }: ExploreSliderProps) {
  const window = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  // The slide the person is on, by its key: a refetch that inserts or reorders slides keeps them on the same one
  // (SWEEP-APP row EXPLORE-07 L3), and the advert that is reported as viewed is that slide's.
  const [placeKey, setPlaceKey] = useState<string | null>(slides[0]?.key ?? null);
  // Slides that arrive after the first draw: the person is on the first from the start, not only after a first swipe (SWEEP-APP-3 row 98).
  if (placeKey === null && slides.length > 0) setPlaceKey(slides[0].key);
  const scroller = useRef<ScrollView>(null);
  // Until the frame has been measured the slide is the screen less the body's two gutters, which is what it will be.
  const width = measured ?? window.width - layout.gutter * 2;
  const count = slides.length;
  const keyed = placeKey === null ? -1 : slides.findIndex((slide) => slide.key === placeKey);
  const current = keyed >= 0 ? keyed : Math.min(index, Math.max(count - 1, 0));
  const active = slides[current];
  // R-116: the slider moves by itself (`useSliderAutoplay`). An advert passed on the slide back to the first is not an advert seen.
  const auto = useSliderAutoplay({ count, showing, current, width, scroller });
  const reports = useAdReports(active?.kind === 'ad' ? active.ad : null, showing && !auto.travelling);
  const paged = count > 1;
  // Only an event's words need room for the dots: an advert is a picture with a chip, and its dots sit on their own pill.
  const reserve = paged ? dotsWidth(count) + d.dotsGap : 0;
  // How far along the pager the finger has taken it, in slides: the frame's height follows it (a banner is shorter than an event).
  const [page, setPage] = useState(0);
  const frameHeight = sliderFrameHeight(slides, page, width);
  // The dots' row under an advert's card, as tall as the swipe has made it (nothing on an event, the full row on an advert).
  const rowHeight = sliderRowHeight(slides, page);
  const banner = active?.kind === 'ad';

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next > 0) setMeasured((was) => (was === next ? was : next));
  }, []);
  const { scrolledTo } = auto;
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrolledTo(e.nativeEvent.contentOffset.x);
      const next = Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width));
      setIndex((was) => (was === next ? was : next));
      setPlaceKey(slides[next]?.key ?? null);
      // Held only while it changes the frame's height, so a pager of one kind of slide does not draw again on every frame of a swipe.
      const along = e.nativeEvent.contentOffset.x / width;
      setPage((was) =>
        sliderFrameHeight(slides, was, width) === sliderFrameHeight(slides, along, width) && sliderRowHeight(slides, was) === sliderRowHeight(slides, along)
          ? was
          : along,
      );
    },
    [width, slides, scrolledTo],
  );
  // The slides changed under the person: the pager goes to where their slide now is (its scroll event then brings `index` along).
  useEffect(() => {
    if (keyed < 0 || keyed === index) return;
    scroller.current?.scrollTo({ x: keyed * width, animated: false });
  }, [keyed, index, width]);

  if (!active) return null;
  return (
    <View testID="explore-slider-block">
      <View testID="explore-hero" onLayout={onLayout} style={[styles.frame, { height: frameHeight }]}>
        <ScrollView
          ref={scroller}
          testID="explore-slider"
          horizontal
          pagingEnabled
          nestedScrollEnabled
          scrollEnabled={paged}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          {...auto.touch}
          accessibilityLabel={paged ? `Slide ${current + 1} of ${count}` : undefined}
        >
          {slides.map((slide, i) => (
            <View key={slide.key} testID={`explore-slide-${i}`} style={{ width }}>
              {slide.kind === 'ad' ? (
                <AdSlide
                  testID={`explore-ad-${slide.ad.id}`}
                  ad={slide.ad}
                  onOpen={() => {
                    reports.tapOf(slide.ad);
                    openAd(slide.ad, onOpenEvent);
                  }}
                />
              ) : (
                <ExploreFeaturedEvent
                  testID={`explore-featured-event-${slide.event.id}`}
                  event={slide.event}
                  reserveRight={reserve}
                  onOpen={() => onOpenEvent(slide.event.id)}
                />
              )}
            </View>
          ))}
        </ScrollView>
        {paged && !banner ? <SliderDots count={count} active={current} place="card" /> : null}
      </View>
      {paged && rowHeight > 0 ? (
        <View testID="explore-hero-dots-row" pointerEvents="none" style={[styles.row, { height: rowHeight, opacity: rowHeight / sliderDotsRowHeight }]}>
          {banner ? <SliderDots count={count} active={current} place="row" /> : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * One dot a slide, the current one long. Decorative: the slider says which slide it is on in its own label. On an event they are
 * white on the card, at its bottom right; on an advert they are in a row under the card, in the page's colours (R-116, F1).
 */
function SliderDots({ count, active, place }: { count: number; active: number; place: 'card' | 'row' }) {
  const { colors } = useWawu();
  const onCard = place === 'card';
  return (
    <View
      testID="explore-hero-dots"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.dots, onCard ? { position: 'absolute', right: d.right, bottom: d.bottomEvent } : null]}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          testID={`explore-hero-dot-${i}`}
          style={[
            styles.dot,
            { width: i === active ? d.active : d.dot },
            onCard
              ? { backgroundColor: darkColors.textOnAccent, opacity: i === active ? 1 : d.dim }
              : { backgroundColor: i === active ? colors.accent : colors.textMuted },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // The height is the slider's own, set from where the pager is (`sliderFrameHeight`).
  frame: { borderRadius: ev.heroCorner, overflow: 'hidden' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: d.between },
  // Under the card: the dots sit at the foot of a row that is as tall as the swipe has made it, so they never move as it grows.
  row: { alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  dot: { height: d.dot, borderRadius: d.dot / 2 },
});
