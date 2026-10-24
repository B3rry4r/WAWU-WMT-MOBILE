import { StyleSheet, View } from 'react-native';

import { radius, space, useWawu } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './Text';

/** design/_gen/kit.js line 58, `banner`: 18 radius, 14 by 16 padding, a 19 px icon, 12 gap, 3 between title and text. */
const bannerMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, iconNudge: 1 } as const;

export type BannerProps = {
  /** `info` is the kit's neutral note (S13): the info tint, and a Clock where the others have an alert mark. */
  tone: 'danger' | 'warning' | 'info';
  title: string;
  body: string;
  /** The mark in place of the tone's own (the pay sheet's shortfall note draws a Wallet). */
  icon?: IconName;
  testID?: string;
};

const looks = {
  danger: { tint: 'dangerTint', ink: 'danger', icon: 'CircleAlert' },
  warning: { tint: 'warningTint', ink: 'warning', icon: 'CircleAlert' },
  info: { tint: 'infoTint', ink: 'info', icon: 'Clock' },
} as const satisfies Record<BannerProps['tone'], { tint: 'dangerTint' | 'warningTint' | 'infoTint'; ink: 'danger' | 'warning' | 'info'; icon: IconName }>;

/** The tinted note above a form: what went wrong and what to do. Read out as an alert the moment it appears. */
export function Banner({ tone, title, body, icon, testID }: BannerProps) {
  const { colors } = useWawu();
  const look = looks[tone];
  return (
    <View testID={testID} accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.root, { backgroundColor: colors[look.tint] }]}>
      <View style={styles.icon}>
        <Icon name={icon ?? look.icon} size={bannerMetrics.icon} color={colors[look.ink]} strokeWidth={2.2} />
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
