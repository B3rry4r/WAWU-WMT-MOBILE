import { useMemo, useState } from 'react';
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
 * The smallest the figure is ever drawn, in px, not as a share of its size: the count never goes below 11 and the word never below
 * 10, so a balance stays readable in a narrow place. A size already under a floor keeps its own size.
 */
export const pointsReadableFloor = { count: 11, word: 10 } as const;

/**
 * Room kept back when the figure has to shrink, in px. The count, the word and the room are read to a pixel or to the engine's layout
 * grid (a whole pixel on the web, up to a whole pixel at 1x on a phone), and a text drawn smaller is rounded up to that grid again;
 * this covers both, so a figure that was shrunk to fit is never a pixel wider than its room.
 */
export const pointsFitAllowance = 2;

/** The width the star and the gaps take: they keep their size when the figure shrinks, only the count and the word scale. */
export function pointsFixedWidth(size: PointsFigureSize, showWord: boolean, showIcon: boolean): number {
  const m = pointsFigureMetrics[size];
  const parts = 1 + (showWord ? 1 : 0) + (showIcon ? 1 : 0);
  return (showIcon ? m.icon : 0) + (parts - 1) * m.iconToNumber;
}

/** How the figure is drawn in a room: the font size of the count and of the word, and how the pieces sit. */
export type PointsFit = {
  countSize: number;
  wordSize: number;
  /** The word sits under the count instead of beside it (one line did not fit at the floor). */
  stacked: boolean;
  /** The count itself is wider than its room at the floor, so it breaks between its digit groups (see `pointsCountGroups`). */
  broken: boolean;
};

export type PointsFitInput = {
  size: PointsFigureSize;
  showWord: boolean;
  showIcon: boolean;
  /** The room the figure is given, in px. */
  room?: number;
  /** The width of the count, and of the word, at the board's size. */
  count?: number;
  word?: number;
};

/** The largest share of full size (at most 1) at which texts of these lengths, each held at its floor, fit `avail`. 0: all sit at their floor. */
function shareFor(avail: number, texts: { len: number; floor: number }[]): number {
  const live = texts.filter((t) => t.len > 0).sort((a, b) => b.floor - a.floor);
  let pinned = 0;
  let free = live.reduce((sum, t) => sum + t.len, 0);
  for (const t of live) {
    const share = (avail - pinned) / free;
    if (share >= t.floor) return Math.min(1, share);
    pinned += t.len * t.floor;
    free -= t.len;
  }
  return live.length === 0 ? 1 : 0;
}

/**
 * How the figure is drawn, worked out once from three numbers that never depend on how it is drawn: the room, and the width of the
 * count and of the word at the board's size. There is no loop: the same three numbers always give the same answer.
 *
 * 1. They fit on one line at full size (the star, the count and the word, with the allowance): full size.
 * 2. Else one line at the largest share of full size that fits, the count held at 11 px and the word at 10 px at the least.
 * 3. Else the word moves under the count (the star stays beside it) and the count takes the room beside the star, again at 11 px at
 *    the least. A figure with no word to move (the Studio chip, the Points tile) goes straight to the step below.
 * 4. Else the count is wider than its room even at 11 px: it is drawn at 11 px and breaks only between its digit groups, never inside a
 *    group and never with an ellipsis.
 *
 * Until all three are known the figure is drawn at full size (the figure itself stays hidden until they are, see `PointsFigure`).
 */
export function pointsFit({ size, showWord, showIcon, room, count, word }: PointsFitInput): PointsFit {
  const m = pointsFigureMetrics[size];
  const full: PointsFit = { countSize: m.number, wordSize: m.word, stacked: false, broken: false };
  if (room === undefined || count === undefined || !(room >= 0) || !(count > 0)) return full;
  if (showWord && (word === undefined || !(word > 0))) return full;
  const wordLen = showWord ? (word ?? 0) : 0;
  const fixed = pointsFixedWidth(size, showWord, showIcon);
  if (fixed + count + wordLen + pointsFitAllowance <= room) return full;

  const countFloor = Math.min(1, pointsReadableFloor.count / m.number);
  const wordFloor = showWord ? Math.min(1, pointsReadableFloor.word / m.word) : 0;
  const sized = (share: number, stacked: boolean, broken: boolean): PointsFit => ({
    countSize: m.number * Math.max(share, countFloor),
    wordSize: showWord ? m.word * Math.max(share, wordFloor) : m.word,
    stacked,
    broken,
  });

  const line = room - fixed - pointsFitAllowance;
  if (count * countFloor + wordLen * wordFloor <= line) {
    return sized(shareFor(line, [{ len: count, floor: countFloor }, { len: wordLen, floor: wordFloor }]), false, false);
  }
  if (!showWord) return sized(shareFor(line, [{ len: count, floor: countFloor }]), false, count * countFloor > line);

  const column = room - (showIcon ? m.icon + m.iconToNumber : 0) - pointsFitAllowance;
  const share = Math.min(1, column / count, column / wordLen);
  return sized(share, true, count * Math.max(share, countFloor) > column);
}

/** The digit groups of a count, each with the comma that follows it: "1,250,000" is "1,", "250,", "000". A broken count breaks between these. */
export function pointsCountGroups(text: string): string[] {
  return text.match(/[^,]+,?/g) ?? [text];
}

/** The text styles of a size at a font size: the board's line height and tracking, scaled with it (full size is the board's own). */
function figureStyles(size: PointsFigureSize, fit: PointsFit) {
  const m = pointsFigureMetrics[size];
  return {
    number: {
      fontSize: fit.countSize,
      lineHeight: Math.round(fit.countSize * boardLeading),
      letterSpacing: m.tracking * fit.countSize,
    } satisfies TextStyle,
    word: { fontSize: fit.wordSize, lineHeight: Math.round(fit.wordSize * boardLeading) } satisfies TextStyle,
    gap: { gap: m.iconToNumber },
  };
}

/** A measured width: it counts only for the text and size it was measured for. */
type Natural = { key: string; width: number };

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
 * It fits its place without a loop, the same way on a phone and on the web. Three widths are read, and none of them depends on how the
 * figure is drawn: the ROOM, the width of the box the figure sits in (as wide as its parent gives, whatever is drawn inside it), and the
 * NATURAL width of the count and of the word at the board's size, read once per text and size from a copy that is out of the layout, clipped
 * to nothing, invisible and hidden from screen readers. `pointsFit` turns those three into the sizes. They change only when the room, the
 * count or the size does, so the figure settles in one render after they are known.
 *
 * Nothing shows before all three are known (the figure is drawn at full size, invisible, so it keeps its height). Give it a parent that has
 * a width (a column, or a row item that may shrink); it fills that width and draws from the start edge.
 */
export function PointsFigure({ count, size = 'row', word, icon, testID }: PointsFigureProps) {
  const { colors } = useWawu();
  const m = pointsFigureMetrics[size];
  const showWord = word ?? m.showWord;
  const showIcon = icon ?? m.showIcon;
  const countText = formatPointsCount(count);
  const wordText = wordFor(count);
  const countKey = `${size}|${countText}`;
  const wordKey = `${size}|${wordText}`;

  const [room, setRoom] = useState<number>();
  const [countNatural, setCountNatural] = useState<Natural>();
  const [wordNatural, setWordNatural] = useState<Natural>();
  const countWidth = countNatural?.key === countKey ? countNatural.width : undefined;
  const wordWidth = wordNatural?.key === wordKey ? wordNatural.width : undefined;
  const ready = room !== undefined && countWidth !== undefined && (!showWord || wordWidth !== undefined);

  const fit = useMemo(
    () => (ready ? pointsFit({ size, showWord, showIcon, room, count: countWidth, word: wordWidth }) : pointsFit({ size, showWord, showIcon })),
    [ready, size, showWord, showIcon, room, countWidth, wordWidth],
  );
  const look = useMemo(() => figureStyles(size, fit), [size, fit]);
  const apart = fit.stacked || fit.broken;

  const onRoom = (e: LayoutChangeEvent) => setRoom(e.nativeEvent.layout.width);
  const readNatural = (key: string, set: (next: (was: Natural | undefined) => Natural | undefined) => void) => (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    set((was) => (was?.key === key && was.width === width ? was : { key, width }));
  };

  const star = showIcon ? (
    <View
      style={[styles.fixed, apart ? { height: look.number.lineHeight, justifyContent: 'center' } : undefined]}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon name="Sparkles" size={m.icon} color={colors.accentFg} strokeWidth={iconStroke} />
    </View>
  ) : null;
  const numberStyle = [font(700), m.tabular ? figures : undefined, look.number];
  const number = fit.broken ? (
    <View testID={testID ? `${testID}-groups` : undefined} style={styles.groups}>
      {pointsCountGroups(countText).map((group, at) => (
        <Text key={at} variant="body" numberOfLines={1} style={[numberStyle, styles.natural]}>
          {group}
        </Text>
      ))}
    </View>
  ) : (
    <Text variant="body" numberOfLines={1} style={[numberStyle, styles.natural]}>
      {countText}
    </Text>
  );
  const unit = showWord ? (
    <Text variant="body" tone="textMuted" numberOfLines={1} style={[font(500), look.word, styles.natural]}>
      {wordText}
    </Text>
  ) : null;

  /** The copies the natural widths are read from: the board's size, never scaled, so drawing the figure never changes them. */
  const probe = figureStyles(size, pointsFit({ size, showWord, showIcon }));
  const copies = (
    <View style={styles.probe} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text
        key={countKey}
        testID={testID ? `${testID}-measure-count` : undefined}
        variant="body"
        onLayout={readNatural(countKey, setCountNatural)}
        style={[font(700), m.tabular ? figures : undefined, probe.number, styles.copy]}
      >
        {countText}
      </Text>
      {showWord ? (
        <Text
          key={wordKey}
          testID={testID ? `${testID}-measure-word` : undefined}
          variant="body"
          onLayout={readNatural(wordKey, setWordNatural)}
          style={[font(500), probe.word, styles.copy]}
        >
          {wordText}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View testID={testID} accessible accessibilityLabel={formatPoints(count)} onLayout={onRoom} style={styles.room}>
      <View
        testID={testID ? `${testID}-row` : undefined}
        style={[styles.row, look.gap, apart ? styles.top : undefined, ready ? undefined : styles.pending]}
      >
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
      {copies}
    </View>
  );
}

const styles = StyleSheet.create({
  /** The room: as wide as the parent gives (down to what a row leaves it), whatever the figure inside it draws. */
  room: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', flexShrink: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 },
  /** Before the room and the natural widths are known: drawn (so the height is kept) but not seen. */
  pending: { opacity: 0 },
  /** The word under the count: the star sits beside the count's first line, not the middle of both. */
  top: { alignItems: 'flex-start' },
  stack: { alignItems: 'flex-start', flexShrink: 1, minWidth: 0 },
  /** A count that breaks between its digit groups: whole groups only, as many to a line as fit. */
  groups: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', flexShrink: 1, minWidth: 0 },
  fixed: { flexShrink: 0 },
  /** The count and the word keep their own width: they are never squeezed, the fit chooses their size. */
  natural: { flexShrink: 0 },
  /**
   * The copies sit in a row box of no size that clips them, so they take their natural width (an absolute child of a column box is offered
   * the box's width, which would cut the count), add nothing to the page's scroll, and cannot be seen or touched. They carry no
   * `numberOfLines`: on the web that caps a text at the width of its box, which here is nothing. A count or a word has no place to wrap, so
   * it still stays on one line.
   */
  probe: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', flexDirection: 'row', opacity: 0 },
  copy: { position: 'absolute', top: 0, left: 0, flexShrink: 0 },
});
