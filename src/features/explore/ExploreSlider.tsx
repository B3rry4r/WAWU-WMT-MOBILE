import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

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
  // Until the frame has been measured the slide is the screen less the body's two gutters, which is what it will be.
  const width = measured ?? window.width - layout.gutter * 2;
  const count = slides.length;
  const current = Math.min(index, Math.max(count - 1, 0));
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
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex((was) => (was === next ? was : Math.max(0, next)));
    },
    [width],
  );

  if (!active) return null;
  return (
    <View testID="explore-hero" onLayout={onLayout} style={styles.frame}>
      <ScrollView
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
                  reports.tap();
                  onOpenEvent(slide.ad.ctaDestinationId);
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
