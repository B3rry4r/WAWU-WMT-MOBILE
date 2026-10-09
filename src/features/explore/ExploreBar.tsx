import { Pressable, StyleSheet, View } from 'react-native';

import { APP_NAME, BrandMark } from '@/components/BrandMark';
import { IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { layout, radius, space, useWawu } from '@/theme';

/**
 * design/_gen/explore.js `topBar` and `srch`: the bar pads 6 above, 20 at the sides and 14 below, its row 10 apart: the
 * 34 wide mark, a search pill that takes the rest (44 high, a 1 hairline, a 18 magnifier 10 before a 15 muted line, 16
 * in at the sides) and a 44 round bell. The bell's unread dot is 8 across, 10 down and 11 in from the corner, ringed
 * in the card colour 2 wide.
 */
export const barMetrics = {
  top: 6,
  bottom: 14,
  between: 10,
  mark: 34,
  row: layout.tapMin,
  searchPadX: space.lg,
  searchGap: 10,
  searchIcon: 18,
  searchText: 15,
  bell: layout.tapMin,
  dot: 8,
  dotTop: 10,
  dotRight: 11,
  dotRing: 2,
} as const;

/** The search pill. Search (X5) is EXPLORE-02's: until it is built, the pill is drawn and opens nothing. */
function SearchPill() {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="explore-search"
      accessibilityRole="button"
      accessibilityLabel={`Search ${APP_NAME}`}
      onPress={unbuilt('EXPLORE-02')}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.search,
        {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <Icon name="Search" size={barMetrics.searchIcon} color={colors.textMuted} />
      <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.searchText}>
        {`Search ${APP_NAME}`}
      </Text>
    </Pressable>
  );
}

/** The bell, with the accent dot when something is unread. Notifications (M31) are ME-14's: until then the bell opens nothing. */
function Bell({ unread }: { unread: number }) {
  const { colors } = useWawu();
  return (
    <View style={styles.bell}>
      <IconButton
        testID="explore-bell"
        icon="Bell"
        size={barMetrics.bell}
        label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        onPress={unbuilt('ME-14')}
      />
      {unread > 0 ? (
        <View
          testID="explore-bell-dot"
          pointerEvents="none"
          style={[
            styles.dot,
            {
              backgroundColor: colors.accent,
              boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: barMetrics.dotRing, color: colors.surfaceCard }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/**
 * X1 and X14's bar: the mark, the search pill and the bell. The mark is the tab's heading for a screen reader (X1 draws
 * no title). `unread` is how many notifications are waiting; the dot shows only when there are some.
 */
export function ExploreBar({ unread }: { unread: number }) {
  return (
    <View style={styles.bar}>
      <View accessible accessibilityRole="header" accessibilityLabel="Explore">
        <BrandMark width={barMetrics.mark} decorative testID="explore-mark" />
      </View>
      <SearchPill />
      <Bell unread={unread} />
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
    gap: barMetrics.between,
  },
  search: {
    flex: 1,
    minWidth: 0,
    height: barMetrics.row,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: barMetrics.searchGap,
    paddingHorizontal: barMetrics.searchPadX,
  },
  searchText: { flex: 1, fontSize: barMetrics.searchText },
  bell: { width: barMetrics.bell, height: barMetrics.bell },
  dot: {
    position: 'absolute',
    top: barMetrics.dotTop,
    right: barMetrics.dotRight,
    width: barMetrics.dot,
    height: barMetrics.dot,
    borderRadius: barMetrics.dot / 2,
  },
});
