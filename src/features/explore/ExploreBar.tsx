import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { IconButton } from '@/components/Button';
import { layout, useWawu } from '@/theme';

/**
 * design/_gen/explore.js `topBar`: the bar pads 6 above, 20 at the sides and 14 below around a 44 high row, and the 34
 * wide mark leads it. The canvas also draws a search pill and a notifications bell in the row; each is drawn by the task
 * that builds where it leads. The bell is ME-14's (M31): a 44 round button at the end of the row with an 8 accent dot 10 from its top
 * and 11 from its right while the Hub says something is unread. The search pill is EXPLORE-02's (it fills the room between the mark
 * and the bell), so until then the bar is the mark and the bell (R-47). The row keeps its 44, so the body below sits where it will.
 */
export const barMetrics = {
  top: 6,
  bottom: 14,
  mark: 34,
  row: layout.tapMin,
  bell: 44,
  dot: 8,
  dotTop: 10,
  dotRight: 11,
  dotRing: 2,
} as const;

export type ExploreBarProps = {
  /** The bell opens Notifications (M31). Drawn only when given (R-47). */
  onOpenNotifications?: () => void;
  /** How many notifications are unread, from the Hub (`GET /me/counts`): the dot shows while it is above nothing. */
  unread?: number;
};

/**
 * X1 and X14's bar: the mark, and the bell when Notifications can be opened. The mark is the tab's heading for a screen reader (X1 draws no title).
 */
export function ExploreBar({ onOpenNotifications, unread = 0 }: ExploreBarProps) {
  const { colors } = useWawu();
  return (
    <View testID="explore-bar" style={styles.bar}>
      <View accessible accessibilityRole="header" accessibilityLabel="Explore">
        <BrandMark width={barMetrics.mark} decorative testID="explore-mark" />
      </View>
      {onOpenNotifications ? (
        <View style={styles.bell}>
          <IconButton icon="Bell" label={unread > 0 ? 'Notifications, new ones waiting' : 'Notifications'} size={barMetrics.bell} onPress={onOpenNotifications} testID="explore-bell" />
          {unread > 0 ? (
            <View
              testID="explore-bell-dot"
              pointerEvents="none"
              style={[styles.dot, { backgroundColor: colors.accent, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: barMetrics.dotRing, color: colors.surfaceCard }] }]}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: barMetrics.top,
    paddingBottom: barMetrics.bottom,
    paddingHorizontal: layout.gutter,
    minHeight: barMetrics.top + barMetrics.row + barMetrics.bottom,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bell: { marginLeft: 'auto', width: barMetrics.bell, height: barMetrics.bell },
  dot: { position: 'absolute', top: barMetrics.dotTop, right: barMetrics.dotRight, width: barMetrics.dot, height: barMetrics.dot, borderRadius: barMetrics.dot / 2 },
});
