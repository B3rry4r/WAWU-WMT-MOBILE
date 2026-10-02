import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { radius, space, useWawu } from '@/theme';

/** design/_gen/kit.js line 58, `banner`: 18 radius, 14 by 16 padding, a 19 px icon, 12 gap, 3 between title and text. */
const bannerMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, iconNudge: 1 } as const;

export type BannerProps = {
  tone: 'danger' | 'warning';
  title: string;
  body: string;
  testID?: string;
};

/** The tinted note above a form: what went wrong and what to do. Read out as an alert the moment it appears. */
export function Banner({ tone, title, body, testID }: BannerProps) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, { backgroundColor: tone === 'danger' ? colors.dangerTint : colors.warningTint }]}
    >
      <View style={styles.icon}>
        <Icon name="CircleAlert" size={bannerMetrics.icon} color={tone === 'danger' ? colors.danger : colors.warning} strokeWidth={2.2} />
      </View>
      <View style={styles.text}>
        <Text variant="kvValue">{title}</Text>
        <Text variant="bannerBody">{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bannerMetrics.iconToText,
    borderRadius: radius.tile,
    paddingVertical: bannerMetrics.padV,
    paddingHorizontal: space.lg,
  },
  icon: { paddingTop: bannerMetrics.iconNudge },
  text: { flex: 1, gap: bannerMetrics.inner },
});
