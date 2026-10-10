import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { layout } from '@/theme';

/**
 * design/_gen/explore.js `topBar`: the bar pads 6 above, 20 at the sides and 14 below around a 44 high row, and the 34
 * wide mark leads it. The canvas also draws a search pill and a notifications bell in the row; each is drawn by the task
 * that builds where it leads (search, EXPLORE-02; notifications, ME-14), so until then the bar is the mark alone (R-47).
 * The row keeps its 44, so the body below sits where it will once they are added.
 */
export const barMetrics = {
  top: 6,
  bottom: 14,
  mark: 34,
  row: layout.tapMin,
} as const;

/**
 * X1 and X14's bar: the mark. The mark is the tab's heading for a screen reader (X1 draws no title).
 */
export function ExploreBar() {
  return (
    <View testID="explore-bar" style={styles.bar}>
      <View accessible accessibilityRole="header" accessibilityLabel="Explore">
        <BrandMark width={barMetrics.mark} decorative testID="explore-mark" />
      </View>
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
});
