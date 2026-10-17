import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type TextStyle } from 'react-native';

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
 * How far the count and the word may shrink to fit a narrow place, as a share of their size. At the hero size that is 11 for the count.
 * Below it the word moves under the count (see `pointsFitLayout`), so a balance is never cut to fit.
 */
export const pointsFitMinScale = 0.5;

/**
 * The smallest the count goes once the word is out of its line (or when there is no word to move): it keeps every digit, so this is only a
 * guard against a place with no room at all, never a size a real column reaches (12 digits at hero fit 120 px at about 0.4).
 */
export const pointsStackMinScale = 0.25;

/** A row this much wider than its room (the engine's own rounding, 1/64 px) still counts as fitting. */
const fitSlack = 0.1;
/** A measured width that moves by less than this is the same width read again: it never re-scales the figure. */
const remeasureTolerance = 0.5;
/**
 * The most times one count in one room may take a new width before the figure stops listening and keeps what it has. A measured width
 * settles on its own (see `WidthEvent`); this cap is what makes it settle by construction, whatever the platform's rounding does.
 */
export const pointsRemeasureCap = 8;

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

/** How the figure is drawn in a room: the scale of the count and the word, and whether the word has moved under the count. */
export type PointsFit = { scale: number; stacked: boolean };

export type PointsFitInput = {
  size: PointsFigureSize;
  showWord: boolean;
  showIcon: boolean;
  /** The room the figure is given, in px. */
  available?: number;
  /** The width of the count, and of the word, at full size. */
  countFull?: number;
  wordFull?: number;
};

const share = (room: number, text: number): number => Math.floor((Math.max(0, room) / text) * 100) / 100;

/**
 * One line, the star then the count then the word, at the largest scale that fits (1 where it all fits, never below
 * `pointsFitMinScale`). Where it cannot fit on one line even at the minimum, the word moves under the count in the same style and the
 * count takes the room beside the star: it keeps every digit and is never cut with an ellipsis. With no word to move (the Studio chip,
 * the Points tile) the count alone goes below the floor, down to `pointsStackMinScale`. Nothing measured yet draws full size.
 */
export function pointsFitLayout({ size, showWord, showIcon, available, countFull, wordFull }: PointsFitInput): PointsFit {
  const full: PointsFit = { scale: 1, stacked: false };
  if (available === undefined || countFull === undefined || !(available >= 0)) return full;
  if (showWord && wordFull === undefined) return full;
  const word = showWord ? (wordFull ?? 0) : 0;
  const text = countFull + word;
  const fixed = pointsFixedWidth(size, showWord, showIcon);
  if (!(text > 0) || fixed + text <= available + fitSlack) return full;
  if ((available - fixed) / text >= pointsFitMinScale) return { scale: pointsFitScale(available, fixed + text, fixed), stacked: false };
  if (!showWord) return { scale: Math.max(pointsStackMinScale, share(available - fixed, text)), stacked: false };
  const m = pointsFigureMetrics[size];
  const beside = showIcon ? m.icon + m.iconToNumber : 0;
  return { scale: Math.min(1, Math.max(pointsStackMinScale, share(available - beside, Math.max(countFull, word)))), stacked: true };
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

/**
 * A width from a layout event, to a fraction of a pixel. React Native Web reports whole pixels (`offsetWidth`), and a whole-pixel
 * width divided by a scale is out by up to a pixel, enough to flip the scale back and forth. The event's element has the exact width.
 */
function eventWidth(e: LayoutChangeEvent): number {
  const target = (e.nativeEvent as { target?: unknown }).target as { nodeType?: number } | undefined;
  const read = (globalThis as { getComputedStyle?: (el: unknown) => { width: string } }).getComputedStyle;
  if (target?.nodeType === 1 && typeof read === 'function') {
    const exact = parseFloat(read(target).width);
    if (Number.isFinite(exact)) return exact;
  }
  return e.nativeEvent.layout.width;
}

/** What the figure has measured so far, and how many times it has taken a new width for this count in this room. */
type Gauge = { key: string; spent: number; given?: number; count?: number; word?: number };

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

/**
 * A number of points as the app writes it: the star, the count and the word "points". Read as "1,240 points" by a screen reader.
 *
 * The figure measures itself the same way on a phone and on the web. The count and the word are drawn at their natural width (they
 * never shrink on their own), their width at full size is read back from the width they were drawn at, and the room is the width the
 * parent gives the box. From those three numbers the scale and the layout follow (`pointsFitLayout`): there is no loop, because the
 * box is as wide as the figure at full size, whatever scale the texts are drawn at. A re-measure that moves a width by less than
 * `remeasureTolerance`, or comes after `pointsRemeasureCap` of them, is ignored.
 */
export function PointsFigure({ count, size = 'row', word, icon, testID }: PointsFigureProps) {
  const { colors } = useWawu();
  const m = pointsFigureMetrics[size];
  const showWord = word ?? m.showWord;
  const showIcon = icon ?? m.showIcon;
  const key = `${size}|${showWord}|${showIcon}|${count}`;
  const [given, setGiven] = useState<number>();
  const [countFull, setCountFull] = useState<number>();
  const [wordFull, setWordFull] = useState<number>();
  const fit = pointsFitLayout({ size, showWord, showIcon, available: given, countFull, wordFull });

  /**
   * The scale the texts were last drawn at, set in the commit that draws them (a layout effect runs before the browser reports the
   * new layout; a passive effect runs after, so a layout event was read against the scale before it).
   */
  const drawn = useRef(1);
  useLayoutEffect(() => {
    drawn.current = fit.scale;
  }, [fit.scale]);
  const gauge = useRef<Gauge>({ key, spent: 0 });
  useLayoutEffect(() => {
    if (gauge.current.key !== key) gauge.current = { ...gauge.current, key, spent: 0 };
  }, [key]);

  const take = (part: 'given' | 'count' | 'word', next: number) => {
    const g = gauge.current;
    const was = g[part];
    if (was !== undefined && Math.abs(was - next) < remeasureTolerance) return;
    if (part === 'given') g.spent = 0;
    else if (g.spent >= pointsRemeasureCap) return;
    else g.spent += 1;
    g[part] = next;
    if (part === 'given') setGiven(next);
    else if (part === 'count') setCountFull(next);
    else setWordFull(next);
  };
  const onBox = (e: LayoutChangeEvent) => take('given', eventWidth(e));
  const onCount = (e: LayoutChangeEvent) => take('count', pointsFullWidth(eventWidth(e), drawn.current, 0));
  const onWord = (e: LayoutChangeEvent) => take('word', pointsFullWidth(eventWidth(e), drawn.current, 0));

  const natural = countFull === undefined || (showWord && wordFull === undefined) ? undefined : pointsFixedWidth(size, showWord, showIcon) + countFull + (showWord ? (wordFull ?? 0) : 0);
  const boxWidth = useMemo(() => (natural === undefined ? undefined : { width: natural }), [natural]);
  const look = useMemo(() => figureStyles(size, fit.scale), [size, fit.scale]);

  const star = showIcon ? (
    <View
      style={[styles.fixed, fit.stacked ? { height: look.number.lineHeight, justifyContent: 'center' } : undefined]}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon name="Sparkles" size={m.icon} color={colors.accentFg} strokeWidth={iconStroke} />
    </View>
  ) : null;
  const number = (
    <Text variant="body" numberOfLines={1} onLayout={onCount} style={[font(700), m.tabular ? figures : undefined, look.number, styles.natural]}>
      {formatPointsCount(count)}
    </Text>
  );
  const unit = showWord ? (
    <Text variant="body" tone="textMuted" numberOfLines={1} onLayout={onWord} style={[font(500), look.word, styles.natural]}>
      {wordFor(count)}
    </Text>
  ) : null;

  return (
    <View testID={testID} accessible accessibilityLabel={formatPoints(count)} onLayout={onBox} style={[styles.box, boxWidth]}>
      <View testID={testID ? `${testID}-row` : undefined} style={[styles.row, look.gap, fit.stacked ? styles.top : undefined]}>
        {star}
        {fit.stacked ? (
          <View testID={testID ? `${testID}-stack` : undefined} style={styles.stack}>
            {number}
            {unit}
          </View>
        ) : (
          <>
            {number}
            {unit}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  /** The word under the count: the star sits beside the count's line, not the middle of both. */
  top: { alignItems: 'flex-start' },
  stack: { alignItems: 'flex-start' },
  fixed: { flexShrink: 0 },
  /** The count and the word keep their own width, so what is measured is what the text needs, never what it was squeezed to. */
  natural: { flexShrink: 0 },
  /** As wide as the figure is at full size, down to nothing, and no wider than the parent: its width is the room the figure has. */
  box: { alignSelf: 'flex-start', flexShrink: 1, minWidth: 0, maxWidth: '100%' },
});
