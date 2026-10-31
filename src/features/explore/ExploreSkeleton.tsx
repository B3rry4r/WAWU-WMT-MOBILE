import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { layout, radius, space } from '@/theme';

import { exploreEventMetrics } from '@/features/events/ExploreEvents';

import { adSlideHeight } from './AdSlide';
import { creatorCardMetrics } from './CreatorCard';

/**
 * X14 (design/_gen/explore.js `loading`): four 80 square tiles at corner 18, a heading bar half the width, 20 high at
 * corner 8, and three 150 by 200 cards at corner 20, 20 apart, under the block where the slider will be (EVENTS-01). The bar above
 * it is the screen's, drawn in this state too. The block is the advert banner's shape (R-116, 27 by 8, at the width the slider will
 * have: the screen less the body's two gutters), because the slider's first slide is an advert whenever there is one, so the page
 * does not jump when it arrives. The board draws it 196 high, the height of a featured event.
 */
export const exploreSkeletonMetrics = { tile: 80, tiles: 4, heading: 20, headingRadius: 8, cards: 3 } as const;

export function ExploreSkeleton() {
  const window = useWindowDimensions();
  return (
    <LoadingView testID="explore-loading" label="Loading Explore">
      <View style={styles.stack}>
        <Skeleton testID="explore-loading-slider" height={adSlideHeight(window.width - layout.gutter * 2)} radius={exploreEventMetrics.heroCorner} />
        <View style={styles.row}>
          {Array.from({ length: exploreSkeletonMetrics.tiles }, (_, i) => (
            <Skeleton key={i} width={exploreSkeletonMetrics.tile} height={exploreSkeletonMetrics.tile} radius={radius.tile} />
          ))}
        </View>
        <Skeleton width="50%" height={exploreSkeletonMetrics.heading} radius={exploreSkeletonMetrics.headingRadius} />
        <View style={styles.cards}>
          {Array.from({ length: exploreSkeletonMetrics.cards }, (_, i) => (
            <Skeleton key={i} width={creatorCardMetrics.railWidth} height={creatorCardMetrics.railHeight} radius={radius.media} />
          ))}
        </View>
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.xl },
  row: { flexDirection: 'row', gap: space.sm },
  /** The cards run off the right edge, as the rail they stand in for does. */
  cards: { flexDirection: 'row', gap: creatorCardMetrics.between, marginRight: -layout.gutter, overflow: 'hidden' },
});
