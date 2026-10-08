import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius } from '@/theme';

import { gutter, todayMetrics as m } from './look';

/** How many card shapes the rail shows while loading: three, the last running off the edge (H11). */
const RAIL_CARDS = 3;

/**
 * H11, Today while it loads: quiet shapes where the parts will be, each the size of the part it
 * stands in for. The four service tiles are not drawn on Today until their screens are built (R-41), so
 * their shapes are left out with them.
 */
export function TodayLoading({ withTgif }: { withTgif: boolean }) {
  return (
    <LoadingView testID="today-loading" label="Loading Today">
      <View style={styles.stack}>
        <Skeleton height={m.skeletonMoney} radius={radius.money} />
        {withTgif ? <Skeleton height={m.tgifHeight} radius={radius.card} /> : null}
        <Skeleton width="70%" height={m.skeletonHeading} radius={m.skeletonHeadingCorner} />
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
  rail: { flexDirection: 'row', gap: m.cardsApart, marginRight: -gutter, overflow: 'hidden' },
});
