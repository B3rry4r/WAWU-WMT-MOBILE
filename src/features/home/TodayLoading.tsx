import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius } from '@/theme';

import { servicesMetrics, servicesPresent } from './Services';
import { gutter, todayMetrics as m } from './look';

/** How many card shapes the rail shows while loading: three, the last running off the edge (H11). */
const RAIL_CARDS = 3;

/** design/_gen/home.js `todayLoading`: a tile is a 60 square over a 46 by 10 label bar at corner 5, 10 apart. */
const tileShape = { labelAbove: 10, labelWidth: 46, labelHeight: 10, labelCorner: 5 } as const;

/**
 * H11, Today while it loads: quiet shapes where the parts will be, each the size of the part it
 * stands in for: the money card (with its four actions), the slot under it (TGIF's card, or the sponsored card when TGIF
 * is off: the same height, so nothing moves when the switch is read), the services row's heading bar and a tile shape
 * (60 square at corner 19.2 over a 46 by 10 label bar) for each of its four tiles, and three creator cards.
 * The bar and Create above and over it are the screen's own, drawn while this loads.
 */
export function TodayLoading() {
  return (
    <LoadingView testID="today-loading" label="Loading Today">
      <View style={styles.stack}>
        <Skeleton height={m.skeletonMoney} radius={radius.money} />
        <Skeleton height={m.tgifHeight} radius={radius.card} />
        <Skeleton width="70%" height={m.skeletonHeading} radius={m.skeletonHeadingCorner} />
        <View style={styles.tiles}>
          {Array.from({ length: servicesPresent }, (_, i) => (
            <View key={i} style={styles.tile}>
              <Skeleton width={servicesMetrics.tile} height={servicesMetrics.tile} radius={servicesMetrics.corner} />
              <Skeleton width={tileShape.labelWidth} height={tileShape.labelHeight} radius={tileShape.labelCorner} />
            </View>
          ))}
        </View>
        <View style={styles.rail}>
          {Array.from({ length: RAIL_CARDS }, (_, i) => (
            <Skeleton key={i} width={m.cardWidth} height={m.cardHeight} radius={radius.media} />
          ))}
        </View>
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  stack: { gap: m.between },
  tiles: { flexDirection: 'row' },
  tile: { width: '25%', alignItems: 'center', gap: tileShape.labelAbove },
  rail: { flexDirection: 'row', gap: m.cardsApart, marginRight: -gutter, overflow: 'hidden' },
});
