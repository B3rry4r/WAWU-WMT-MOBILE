import { StyleSheet, View } from 'react-native';

import { font, radius, type, useWawu, type ColorToken } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './Text';

/** design/_gen/kit.js line 57, `pill`: 26 high, 10 across, 5 between icon and label, 12.5 bold, icon 13 at stroke 2.4. */
export const pillMetrics = { height: 26, padH: 10, iconGap: 5, font: 12.5, icon: 13, iconStroke: 2.4 } as const;

export type PillTone = 'positive' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';

/** kit.js line 57: the kit tints the pill in the tone's tint and writes in the tone itself; neutral is the sunken surface and secondary text. */
const tones: Record<PillTone, { background: ColorToken; ink: ColorToken }> = {
  positive: { background: 'positiveTint', ink: 'positive' },
  warning: { background: 'warningTint', ink: 'warning' },
  danger: { background: 'dangerTint', ink: 'danger' },
  info: { background: 'infoTint', ink: 'info' },
  accent: { background: 'accentTint', ink: 'accent' },
  neutral: { background: 'surfaceSunken', ink: 'textSecondary' },
};

export type StatusPillProps = {
  label: string;
  tone?: PillTone;
  /** A Lucide name from the icon set: Check, Clock, X, Snowflake. The label says the same thing, so the icon is hidden from screen readers. */
  icon?: IconName;
  testID?: string;
};

/** A status or tag the user reads and cannot press ("Completed", "In review", "WAWU pick"). The tone is never the only signal: the label always says it. */
export function StatusPill({ label, tone = 'positive', icon, testID }: StatusPillProps) {
  const { colors } = useWawu();
  const { background, ink } = tones[tone];
  return (
    <View
      testID={testID}
      accessible
      style={[styles.pill, { backgroundColor: colors[background] }]}
    >
      {icon ? (
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name={icon} size={pillMetrics.icon} color={colors[ink]} strokeWidth={pillMetrics.iconStroke} />
        </View>
      ) : null}
      <Text variant="body" tone={ink} style={[font(700), styles.label]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    height: pillMetrics.height,
    paddingHorizontal: pillMetrics.padH,
    gap: pillMetrics.iconGap,
    borderRadius: radius.chip,
    flexShrink: 0,
  },
  label: { fontSize: pillMetrics.font, lineHeight: Math.round(pillMetrics.font * type.leading.snug) },
});
