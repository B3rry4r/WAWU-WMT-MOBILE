import { StyleSheet, View } from 'react-native';

import { font, radius, type, useWawu, type ColorToken } from '@/theme';

import { Icon } from './icon';
import { Text } from './Text';

/**
 * design/_gen/me.js line 16, `tierBadge` (the one the M1, VF14 and VF7a boards all call): a 26 high pill, 10 across, 5 between
 * the badge mark and the name, the name 12 at 700, the mark 13 at stroke 2.4.
 */
export const tierBadgeMetrics = { height: 26, padH: 10, iconToName: 5, font: 12, icon: 13, iconStroke: 2.4 } as const;

/**
 * The kit draws a tier with no number in the accent tint with the accent ink (M1's name row, VF14's tier card, every tier list),
 * and a numbered one as a dark pill with white writing (VF7a's "Founding Maker #128"). The canvas hard-codes #2A0C3E for the dark
 * pill in both themes; `surfaceCardInk` is the nearest token (a step lighter in dark, darker in light).
 */
const looks = {
  soft: { background: 'accentTint', ink: 'accentFg' },
  solid: { background: 'surfaceCardInk', ink: 'textOnAccent' },
} as const satisfies Record<string, { background: ColorToken; ink: ColorToken }>;

export type TierBadgeProps = {
  /** The tier's name as the Hub serves it ("Verify", "Verify Plus", "Founding Maker"). Never typed into a screen (R-65). */
  name: string;
  /** A numbered tier's number as the Hub serves it (`badge.number`, Founding Maker #128). Null or missing: the name alone, in the soft look. */
  number?: number | null;
  testID?: string;
};

/** "Founding Maker #128", or just "Verify" when the tier carries no number. */
export function tierBadgeLabel(name: string, number?: number | null): string {
  return number === null || number === undefined ? name : `${name} #${number}`;
}

/** The tier a person holds, as a small pill by their name or on their tier card. It is read, never pressed. */
export function TierBadge({ name, number, testID }: TierBadgeProps) {
  const { colors } = useWawu();
  const look = looks[number === null || number === undefined ? 'soft' : 'solid'];
  const label = tierBadgeLabel(name, number);
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={number === null || number === undefined ? `${name} tier` : `${name} tier, number ${number}`}
      style={[styles.pill, { backgroundColor: colors[look.background] }]}
    >
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name="BadgeCheck" size={tierBadgeMetrics.icon} color={colors[look.ink]} strokeWidth={tierBadgeMetrics.iconStroke} />
      </View>
      <Text variant="body" tone={look.ink} style={[font(700), styles.label]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: tierBadgeMetrics.height,
    paddingHorizontal: tierBadgeMetrics.padH,
    gap: tierBadgeMetrics.iconToName,
    borderRadius: radius.chip,
  },
  label: { fontSize: tierBadgeMetrics.font, lineHeight: Math.round(tierBadgeMetrics.font * type.leading.snug), flexShrink: 1 },
});
