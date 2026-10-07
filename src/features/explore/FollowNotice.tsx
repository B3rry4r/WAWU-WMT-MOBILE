import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

/**
 * Not drawn on the canvas (no refusal state for Follow). Default (agent), owner may override: the shape of M10's
 * "Profile saved" (design/_gen/me.js line 39: 48 high, 16 corner, 20 in from each side, 10 between the icon and
 * 14.5 words at 600), with an alert icon, held above the bottom of the screen so it never covers the header.
 */
const noticeMetrics = { minHeight: 48, bottom: 24, icon: 18, iconStroke: 2.2, between: 10, fontSize: 14.5 } as const;

/** Above `bottom` (24 by default; a screen without the tab bar adds its safe area). "Couldn't follow @handle. Try again later.": a dark pill, announced to a screen reader when it appears. */
export function FollowNotice({ message, bottom = noticeMetrics.bottom }: { message: string | null; bottom?: number }) {
  const { colors } = useWawu();
  if (!message) return null;
  return (
    <View
      testID="follow-notice"
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: colors.textPrimary, bottom }]}
    >
      <Icon name="CircleAlert" size={noticeMetrics.icon} color={colors.danger} strokeWidth={noticeMetrics.iconStroke} />
      <Text variant="body" numberOfLines={2} style={[font(600), styles.words, { color: colors.surfacePage }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    minHeight: noticeMetrics.minHeight,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: noticeMetrics.between,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  words: { flex: 1, fontSize: noticeMetrics.fontSize },
});
