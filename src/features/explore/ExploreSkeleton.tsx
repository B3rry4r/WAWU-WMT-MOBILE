import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { layout, radius, space } from '@/theme';

import { ExploreFeaturedEventSkeleton } from '@/features/events/ExploreEvents';

import { creatorCardMetrics } from './CreatorCard';

/**
 * X14 (design/_gen/explore.js `loading`): four 80 square tiles at corner 18, a heading bar half the width, 20 high at
 * corner 8, and three 150 by 200 cards at corner 20, 20 apart, under the 196 high block for the featured event
 * (EVENTS-01, R-41).
 */
export const exploreSkeletonMetrics = { tile: 80, tiles: 4, heading: 20, headingRadius: 8, cards: 3 } as const;

export function ExploreSkeleton() {
  return (
    <LoadingView testID="explore-loading" label="Loading Explore">
      <View style={styles.stack}>
        <ExploreFeaturedEventSkeleton />
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
