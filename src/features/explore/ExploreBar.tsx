import { useState } from 'react';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';

import { APP_NAME, BrandMark } from '@/components/BrandMark';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { font, layout, radius, useWawu } from '@/theme';

/**
 * design/_gen/explore.js `topBar`: the bar pads 6 above, 20 at the sides and 14 below around a 44 high row, 10 between
 * its parts, and the 34 wide mark leads it. The search pill (`srch`: 44 high, a full pill on the card colour with a 1 hairline
 * ring, an 18 glyph, 10 to the 15 words) follows the mark and takes the rest of the row; it opens Search (X5, EXPLORE-02) and is
 * drawn only when the screen is given `onSearch`. The canvas's notifications bell is drawn by the task that builds where it leads
 * (ME-14), so until then the pill runs to the edge (R-47). The row keeps its 44, so the body below sits where it will once the bell is added.
 */
export const barMetrics = {
  top: 6,
  bottom: 14,
  mark: 34,
  row: layout.tapMin,
  between: 10,
  icon: 18,
  iconGap: 10,
  padH: 16,
  text: 15,
} as const;

/** What the pill says and what a screen reader hears: the app's name with its question mark (R-69). */
const searchWords = `Search ${APP_NAME}`;

export type ExploreBarProps = {
  /** The search pill was pressed (X5). The pill is not drawn without it. */
  onSearch?: () => void;
};

/**
 * X1 and X14's bar: the mark and the search pill. The mark is the tab's heading for a screen reader (X1 draws no title).
 * The pill is a button that says what it opens, "Search Who Made This?" (R-37, R-69); typing happens on Search itself.
 */
export function ExploreBar({ onSearch }: ExploreBarProps = {}) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [pressed, setPressed] = useState(false);
  return (
    <View testID="explore-bar" style={styles.bar}>
      <View accessible accessibilityRole="header" accessibilityLabel="Explore">
        <BrandMark width={barMetrics.mark} decorative testID="explore-mark" />
      </View>
      {onSearch ? (
        <Pressable
          testID="explore-search"
          accessibilityRole="search"
          accessibilityLabel={searchWords}
          onPress={onSearch}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          {...ring.handlers}
          style={[
            styles.pill,
            {
              backgroundColor: colors.surfaceCard,
              opacity: pressed ? 0.9 : 1,
              boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
            },
            ring.style,
          ]}
        >
          <Icon name="Search" size={barMetrics.icon} color={colors.textMuted} />
          <NativeText numberOfLines={1} style={[font(400), styles.pillText, { color: colors.textMuted }]}>
            {searchWords}
          </NativeText>
        </Pressable>
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
    gap: barMetrics.between,
  },
  pill: { flex: 1, height: barMetrics.row, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: barMetrics.iconGap, paddingHorizontal: barMetrics.padH },
  pillText: { flex: 1, fontSize: barMetrics.text },
});
