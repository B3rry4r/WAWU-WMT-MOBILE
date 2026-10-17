import { StyleSheet, View, type TextStyle } from 'react-native';

import { font, useWawu } from '@/theme';

import { Icon } from './icon';
import { Text } from './Text';

/** "1 point", "1,240 points". Points are a count: never a naira value (R-65: they are their own balance, beside WAWU Credits). */
export function formatPoints(count: number): string {
  return `${formatPointsCount(count)} ${wordFor(count)}`;
}

const whole = (count: number): number => Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
const wordFor = (count: number): string => (whole(count) === 1 ? 'point' : 'points');

/** The number alone, with thousands commas: "1,240". */
export function formatPointsCount(count: number): string {
  return String(whole(count)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * The sizes the boards draw. design/_gen/points.js line 83, `pts(n, s)`, sets the star at 0.9 of the number's size and the word at
 * 0.8, 5 apart: `hero` is s 22 (PT5's balance), `row` s 17 (a pack, PT4), `line` s 14.5 (a lot in "When they end"). `chip` is the
 * count on M19's Studio card (13.5, star 14, 4 apart, no word); `tile` is W1's Points tile (18 with tracking -0.02em, no star, no word).
 * The first three set equal-width figures (`tnum`, as `pts` does); the chip and the tile do not.
 */
export const pointsFigureMetrics = {
  hero: { number: 22, icon: 20, word: 18, iconToNumber: 5, showWord: true, showIcon: true, tracking: 0, tabular: true },
  row: { number: 17, icon: 15, word: 14, iconToNumber: 5, showWord: true, showIcon: true, tracking: 0, tabular: true },
  line: { number: 14.5, icon: 13, word: 12, iconToNumber: 5, showWord: true, showIcon: true, tracking: 0, tabular: true },
  chip: { number: 13.5, icon: 14, word: 12, iconToNumber: 4, showWord: false, showIcon: true, tracking: 0, tabular: false },
  tile: { number: 18, icon: 15, word: 14, iconToNumber: 5, showWord: false, showIcon: false, tracking: -0.02, tabular: false },
} as const;

/** The star mark's stroke on every board that draws it. */
const iconStroke = 2.2;
/** Lining, equal-width figures, as the boards set (`font-feature-settings: 'tnum' 1`), so a column of balances lines up. */
const figures: TextStyle = { fontVariant: ['tabular-nums'] };

export type PointsFigureSize = keyof typeof pointsFigureMetrics;

export type PointsFigureProps = {
  /** How many points, as the Hub serves them (`points`, a lot's `remaining`). A whole number, never a naira amount. */
  count: number;
  size?: PointsFigureSize;
  /** Draw "points" after the number. Defaults to what the size's board draws. */
  word?: boolean;
  /** Draw the star mark before the number. Defaults to what the size's board draws. */
  icon?: boolean;
  testID?: string;
};

/** A number of points as the app writes it: the star, the count and the word "points". Read as "1,240 points" by a screen reader. */
export function PointsFigure({ count, size = 'row', word, icon, testID }: PointsFigureProps) {
  const { colors } = useWawu();
  const m = pointsFigureMetrics[size];
  const showWord = word ?? m.showWord;
  const showIcon = icon ?? m.showIcon;
  return (
    <View testID={testID} accessible accessibilityLabel={formatPoints(count)} style={[styles.row, { gap: m.iconToNumber }]}>
      {showIcon ? (
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="Sparkles" size={m.icon} color={colors.accentFg} strokeWidth={iconStroke} />
        </View>
      ) : null}
      <Text
        variant="body"
        style={[font(700), m.tabular ? figures : undefined, { fontSize: m.number, lineHeight: Math.round(m.number * 1.2), letterSpacing: m.tracking * m.number }]}
      >
        {formatPointsCount(count)}
      </Text>
      {showWord ? (
        <Text variant="body" tone="textMuted" style={[font(500), { fontSize: m.word, lineHeight: Math.round(m.word * 1.2) }]}>
          {wordFor(count)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
});
