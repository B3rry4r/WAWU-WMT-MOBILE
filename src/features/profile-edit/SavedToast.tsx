import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

/** design/_gen/me.js line 39 (M10): 48 high, 16 corner, 10 between the tick and the words, 14.5 at 600, 60 from the top, 20 in from each side. */
const toastMetrics = { height: 48, top: 60, icon: 18, between: 10, fontSize: 14.5 } as const;

/** M10's "Profile saved": a dark pill over the top of the screen, announced to a screen reader when it appears. */
export function SavedToast({ message }: { message: string }) {
  const { colors } = useWawu();
  return (
    <View
      testID="profile-saved"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: colors.textPrimary }]}
    >
      <Icon name="CircleCheck" size={toastMetrics.icon} color={colors.positive} strokeWidth={2.2} />
      <Text variant="body" style={[font(600), { fontSize: toastMetrics.fontSize, color: colors.surfacePage }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: toastMetrics.top,
    left: space.xl,
    right: space.xl,
    height: toastMetrics.height,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: toastMetrics.between,
    paddingHorizontal: space.lg,
  },
});
