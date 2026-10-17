import { useState } from 'react';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';

import { APP_NAME, BrandMark } from '@/components/BrandMark';
import { IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { font, layout, radius, useWawu } from '@/theme';

/**
 * design/_gen/explore.js `topBar`: the bar pads 6 above, 20 at the sides and 14 below around a 44 high row, 10 between
 * its parts, and the 34 wide mark leads it. The search pill (`srch`: 44 high, a full pill on the card colour with a 1 hairline
 * ring, an 18 glyph, 10 to the 15 words) follows the mark and takes the rest of the row; it opens Search (X5, EXPLORE-02) and is
 * drawn only when the screen is given `onSearch`. The notifications bell is ME-14's (M31): a 44 round button at the end of the
 * row with an 8 accent dot 10 from its top and 11 from its right while the Hub says something is unread; it is drawn only when
 * the screen is given `onOpenNotifications` (R-47). The row keeps its 44, so the body below sits where it will.
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
  bell: 44,
  dot: 8,
  dotTop: 10,
  dotRight: 11,
  dotRing: 2,
} as const;

/** What the pill says and what a screen reader hears: the app's name with its question mark (R-69). */
const searchWords = `Search ${APP_NAME}`;

export type ExploreBarProps = {
  /** The search pill was pressed (X5). The pill is not drawn without it. */
  onSearch?: () => void;
  /** The bell opens Notifications (M31). Drawn only when given (R-47). */
  onOpenNotifications?: () => void;
  /** How many notifications are unread, from the Hub (`GET /me/counts`): the dot shows while it is above nothing. */
  unread?: number;
};

/**
 * X1 and X14's bar: the mark, the search pill and the bell. The mark is the tab's heading for a screen reader (X1 draws no title).
 * The pill is a button that says what it opens, "Search Who Made This?" (R-37, R-69); typing happens on Search itself.
 */
export function ExploreBar({ onSearch, onOpenNotifications, unread = 0 }: ExploreBarProps = {}) {
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
    gap: barMetrics.between,
  },
  pill: { flex: 1, height: barMetrics.row, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: barMetrics.iconGap, paddingHorizontal: barMetrics.padH },
  pillText: { flex: 1, fontSize: barMetrics.text },
  bell: { marginLeft: 'auto', width: barMetrics.bell, height: barMetrics.bell },
  dot: { position: 'absolute', top: barMetrics.dotTop, right: barMetrics.dotRight, width: barMetrics.dot, height: barMetrics.dot, borderRadius: barMetrics.dot / 2 },
});
