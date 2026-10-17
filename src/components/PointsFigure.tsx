import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent, type TextStyle } from 'react-native';

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

/** The board sets every one of these lines at 1.2 of its size (points.js `pts`: `line-height:1.2`). */
const boardLeading = 1.2;

/**
 * How far the count and the word may shrink to fit a narrow place, as a share of their size (the native `minimumFontScale`).
 * At the hero size that is 11 for the count: a seven or nine digit balance still fits a 150 px column at about 0.6.
 */
export const pointsFitMinScale = 0.5;

/** The width the star and the gaps take: they keep their size when the figure shrinks, only the count and the word scale. */
export function pointsFixedWidth(size: PointsFigureSize, showWord: boolean, showIcon: boolean): number {
  const m = pointsFigureMetrics[size];
  const parts = 1 + (showWord ? 1 : 0) + (showIcon ? 1 : 0);
  return (showIcon ? m.icon : 0) + (parts - 1) * m.iconToNumber;
}

/** The width the row would take at full size, from its width at the scale it was drawn at. */
export function pointsFullWidth(drawnWidth: number, drawnScale: number, fixed: number): number {
  return fixed + Math.max(0, drawnWidth - fixed) / (drawnScale > 0 ? drawnScale : 1);
}

/**
 * How much of full size the count and the word get so the row fits `available`: 1 where it already fits (or nothing is measured
 * yet), else the share that fits, rounded down so a pixel of rounding never pushes it over, and never below `pointsFitMinScale`.
 */
export function pointsFitScale(available: number | undefined, full: number | undefined, fixed: number): number {
  if (available === undefined || full === undefined || !(available >= 0)) return 1;
  const text = full - fixed;
  if (!(text > 0) || available >= full) return 1;
  return Math.max(pointsFitMinScale, Math.floor((Math.max(0, available - fixed) / text) * 100) / 100);
}

/** The text styles of a size at a scale: the board's size, line and tracking times the scale (1 where nothing shrinks). */
function figureStyles(size: PointsFigureSize, scale: number) {
  const m = pointsFigureMetrics[size];
  const number = m.number * scale;
  const word = m.word * scale;
  return {
    number: { fontSize: number, lineHeight: Math.round(number * boardLeading), letterSpacing: m.tracking * number } satisfies TextStyle,
    word: { fontSize: word, lineHeight: Math.round(word * boardLeading) } satisfies TextStyle,
    gap: { gap: m.iconToNumber },
  };
}

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

type Parts = { count: number; size: PointsFigureSize; showWord: boolean; showIcon: boolean };

/**
 * The star, the count and the word, at a scale. On a phone the system fits the two texts to the room the row is given
 * (`adjustsFontSizeToFit`, one line); on the web, which has no such prop, the caller passes the scale it measured.
 */
function FigureParts({ count, size, showWord, showIcon, scale, native }: Parts & { scale: number; native: boolean }) {
  const { colors } = useWawu();
  const m = pointsFigureMetrics[size];
  const look = useMemo(() => figureStyles(size, scale), [size, scale]);
  const fit = native ? ({ numberOfLines: 1, adjustsFontSizeToFit: true, minimumFontScale: pointsFitMinScale } as const) : ({ numberOfLines: 1 } as const);
  return (
    <>
      {showIcon ? (
        <View style={styles.fixed} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Icon name="Sparkles" size={m.icon} color={colors.accentFg} strokeWidth={iconStroke} />
        </View>
      ) : null}
      <Text variant="body" {...fit} style={[font(700), m.tabular ? figures : undefined, look.number, native ? styles.shrinks : undefined]}>
        {formatPointsCount(count)}
      </Text>
      {showWord ? (
        <Text variant="body" tone="textMuted" {...fit} style={[font(500), look.word, native ? styles.shrinks : undefined]}>
          {wordFor(count)}
        </Text>
      ) : null}
    </>
  );
}

/**
 * On the web the row measures itself: the box takes the width the layout gives it (never more than the parent, never more than the
 * row's full-size width) and the count and the word are scaled to fit it, so a long balance gets smaller instead of running past the edge.
 */
function WebFigure({ count, size, showWord, showIcon, testID }: Parts & { testID?: string }) {
  const fixed = pointsFixedWidth(size, showWord, showIcon);
  const [given, setGiven] = useState<number>();
  const [full, setFull] = useState<number>();
  const scale = pointsFitScale(given, full, fixed);
  /** The scale the row was last drawn at: a layout event is read against it, not against a scale that came after. */
  const drawn = useRef(1);
  useEffect(() => {
    drawn.current = scale;
  }, [scale]);
  const boxWidth = useMemo(() => (full === undefined ? undefined : { width: full }), [full]);
  const look = useMemo(() => figureStyles(size, 1), [size]);

  const onBox = (e: LayoutChangeEvent) => setGiven(e.nativeEvent.layout.width);
  const onRow = (e: LayoutChangeEvent) => {
    const next = pointsFullWidth(e.nativeEvent.layout.width, drawn.current, fixed);
    setFull((was) => (was !== undefined && Math.abs(was - next) < 0.5 ? was : next));
  };

  return (
    <View testID={testID} accessible accessibilityLabel={formatPoints(count)} onLayout={onBox} style={[styles.box, boxWidth]}>
      <View testID={testID ? `${testID}-row` : undefined} onLayout={onRow} style={[styles.row, look.gap]}>
        <FigureParts count={count} size={size} showWord={showWord} showIcon={showIcon} scale={scale} native={false} />
      </View>
    </View>
  );
}

/** A number of points as the app writes it: the star, the count and the word "points". Read as "1,240 points" by a screen reader. */
export function PointsFigure({ count, size = 'row', word, icon, testID }: PointsFigureProps) {
  const m = pointsFigureMetrics[size];
  const showWord = word ?? m.showWord;
  const showIcon = icon ?? m.showIcon;
  const look = useMemo(() => figureStyles(size, 1), [size]);
  if (Platform.OS === 'web') return <WebFigure count={count} size={size} showWord={showWord} showIcon={showIcon} testID={testID} />;
  return (
    <View testID={testID} accessible accessibilityLabel={formatPoints(count)} style={[styles.row, styles.shrinks, styles.capped, look.gap]}>
      <FigureParts count={count} size={size} showWord={showWord} showIcon={showIcon} scale={1} native />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  /** The row, and on a phone its texts, give way when the parent is narrower than the figure. */
  shrinks: { flexShrink: 1 },
  capped: { maxWidth: '100%' },
  fixed: { flexShrink: 0 },
  /** The web's measuring box: as wide as the layout allows, down to nothing, and no wider than the parent. */
  box: { alignSelf: 'flex-start', flexShrink: 1, minWidth: 0, maxWidth: '100%' },
});
