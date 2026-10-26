import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { openAd } from '@/features/ads/api';
import { useAdReports } from '@/features/ads/useAd';
import { ExploreFeaturedEvent, exploreEventMetrics as ev } from '@/features/events/ExploreEvents';
import { layout } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import { AdSlide, adSlideMetrics } from './AdSlide';
import type { Slide } from './slider';

/**
 * The slider's pager dots (design/_gen/explore.js `sdots`): 6 high, 5 apart, the current one 16 wide and white, the others 6
 * wide and white at 45%. They sit 16 in from the right; 14 up on an advert (level with the foot of its words) and 18 up on
 * an event (the event slide's own dots, `hero`).
 */
export const sliderDotsMetrics = {
  dot: 6,
  active: 16,
  between: 5,
  right: 16,
  bottomAd: adSlideMetrics.wordsBottom,
  bottomEvent: 18,
  dim: 0.45,
} as const;

const d = sliderDotsMetrics;

/** How wide `count` dots are, with one of them long. */
export const dotsWidth = (count: number) => d.active + (count - 1) * (d.dot + d.between);

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
 * With one slide it is not a pager: no dots, nothing to swipe. With none it is not drawn, which is the caller's call.
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
  const reports = useAdReports(active?.kind === 'ad' ? active.ad : null, showing);
  const paged = count > 1;
  const reserve = paged ? dotsWidth(count) + adSlideMetrics.dotsGap : 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (next > 0) setMeasured((was) => (was === next ? was : next));
  }, []);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width));
      setIndex((was) => (was === next ? was : next));
      setPlaceKey(slides[next]?.key ?? null);
    },
    [width, slides],
  );
  // The slides changed under the person: the pager goes to where their slide now is (its scroll event then brings `index` along).
  useEffect(() => {
    if (keyed < 0 || keyed === index) return;
    scroller.current?.scrollTo({ x: keyed * width, animated: false });
  }, [keyed, index, width]);

  if (!active) return null;
  return (
    <View testID="explore-hero" onLayout={onLayout} style={styles.frame}>
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
        accessibilityLabel={paged ? `Slide ${current + 1} of ${count}` : undefined}
      >
        {slides.map((slide, i) => (
          <View key={slide.key} testID={`explore-slide-${i}`} style={{ width }}>
            {slide.kind === 'ad' ? (
              <AdSlide
                testID={`explore-ad-${slide.ad.id}`}
                ad={slide.ad}
                reserveRight={reserve}
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
      {paged ? <SliderDots count={count} active={current} bottom={active.kind === 'ad' ? d.bottomAd : d.bottomEvent} /> : null}
    </View>
  );
}

/** One dot a slide, the current one long. Decorative: the slider says which slide it is on in its own label. */
function SliderDots({ count, active, bottom }: { count: number; active: number; bottom: number }) {
  return (
    <View
      testID="explore-hero-dots"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.dots, { bottom }]}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          testID={`explore-hero-dot-${i}`}
          style={[styles.dot, { width: i === active ? d.active : d.dot, opacity: i === active ? 1 : d.dim }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: ev.heroHeight, borderRadius: ev.heroCorner, overflow: 'hidden' },
  dots: { position: 'absolute', right: d.right, flexDirection: 'row', gap: d.between },
  dot: { height: d.dot, borderRadius: d.dot / 2, backgroundColor: darkColors.textOnAccent },
});
