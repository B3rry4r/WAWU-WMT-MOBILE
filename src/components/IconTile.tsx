import { StyleSheet, View } from 'react-native';

import { useWawu, type ColorToken } from '@/theme';

import { Icon, type IconName } from './icon';

export type IconTileTone = 'neutral' | 'in' | 'accent' | 'danger' | 'warn';

const tones: Record<IconTileTone, { bg: ColorToken; fg: ColorToken }> = {
  neutral: { bg: 'surfaceSunken', fg: 'textPrimary' },
  in: { bg: 'positiveTint', fg: 'positive' },
  accent: { bg: 'accentTint', fg: 'accentFg' },
  danger: { bg: 'dangerTint', fg: 'danger' },
  warn: { bg: 'warningTint', fg: 'warning' },
};

/** The glyph is 45% of the circle (design/_gen/kit.js `txIcon`). */
const glyphScale = 0.45;
const glyphStroke = 2;

export type IconTileProps = {
  icon: IconName;
  tone?: IconTileTone;
  size?: number;
  /** The glyph's stroke. Default 2 (kit `txIcon`); H18's status mark passes 2.4. */
  strokeWidth?: number;
  /** `circle` (default), or `square`: the rounded square a promo row leads with (the explore doors' tile, 12 round at 40 across; R-110). */
  shape?: 'circle' | 'square';
};

/** A square tile's corner as a share of its side: 12 on 40, the explore doors' `tileRadius`. */
const squareCorner = 0.3;

/** A round tinted icon: the lead of a transaction row, the top of an empty view. Decorative, so a row's own words speak for it. */
export function IconTile({ icon, tone = 'neutral', size = 44, strokeWidth = glyphStroke, shape = 'circle' }: IconTileProps) {
  const { colors } = useWawu();
  const look = tones[tone];
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: size, height: size, borderRadius: shape === 'square' ? Math.round(size * squareCorner) : size / 2, backgroundColor: colors[look.bg] }]}
    >
      <Icon name={icon} size={Math.round(size * glyphScale)} color={colors[look.fg]} strokeWidth={strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
