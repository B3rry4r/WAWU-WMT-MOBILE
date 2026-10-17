import { StyleSheet, type TextStyle } from 'react-native';

import { canvasNormalLineHeight, font, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/**
 * Today's sizes (design/_gen/home.js, `todayHead`, `balanceCard`, `tgifRow`, `creators`,
 * `todayLoading`), named so each cites where it comes from. Colours are the theme's tokens;
 * where the canvas paints with a colour the tokens do not have, the nearest token stands in
 * (SHARED-CHANGES HOME-01 #1).
 */
const metricsBase = {
  /** `todayHead`: `padding:6px 20px 14px`; the row is as tall as its 40 search and bell buttons. */
  headTop: 6,
  headBottom: 14,
  headRow: 40,
  /** `body(...)` on Today: 8 above the first card, 20 between parts, 20 at the sides. */
  bodyTop: 8,
  between: 20,
  bodyBottom: 32,
  /** `balanceCard`: `padding:18px 18px 16px`, the figure 14 under the chip row (the shared fitted figure keeps 10 of it itself). */
  moneyPadTop: 18,
  moneyPadX: 18,
  moneyPadBottom: 18,
  figureTop: 14,
  figure: 38,
  /** The Naira chip: 30 high, `padding:0 10px 0 4px`, `gap:6px`, the flag 22, the words 13 at 600. */
  chipHeight: 30,
  chipPadLeft: 4,
  chipPadRight: 10,
  chipGap: 6,
  flag: 22,
  chipWords: 13,
  /**
   * `balanceCard`'s action row (Send, Add, Scan): the figure's `margin:14px 0 18px` leaves 18 under it, then each
   * action is a 64 column holding a 48 circle (the glass colour; the first, Send, is the accent), a 20 icon at 2.2, 6, and
   * the word at 12 semi-bold at 85%. Only Send is built (no Bills: bills are off, R-52); the others are added by their tasks (R-41), and the
   * present actions pack from the left as the services row's tiles do (U-H1).
   */
  actionsTop: 18,
  actionWidth: 64,
  action: 48,
  actionIcon: 20,
  actionStroke: 2.2,
  actionGap: 6,
  actionWord: 12,
  actionWordFaint: 0.85,
  /** A wallet answer in place of the figure: words 15, then the button 14 under them. */
  noticeTop: 12,
  noticeGap: 14,
  /** `tgifRow`: 104 high, `padding:14px 16px`, `gap:14px`; words 11, 19 and 12.5; the play disc 48 with a 20 icon. */
  tgifHeight: 104,
  tgifPadY: 14,
  tgifPadX: 16,
  tgifGap: 14,
  tgifWordsGap: 4,
  tgifLabel: 11,
  tgifLabelTracking: 0.1,
  tgifTitle: 19,
  tgifTitleTracking: -0.02,
  tgifMeta: 12.5,
  tgifMetaFaint: 0.75,
  play: 48,
  playIcon: 20,
  playStroke: 2.4,
  /**
   * The two glows: the accent at 85% (H1's own strength; the reader's verse card has it at 70%), 200 at 40 past
   * the right and 70 above; `--tgif-warm-glow`, 160 at 30 past the left and 80 below.
   */
  tgifGlow: { right: 40, top: 70, size: 200, strength: 0.85 },
  tgifWarm: { left: 30, bottom: 80, size: 160 },
  /** `creators`: the heading, 12 to the rail; cards 146 by 196, 10 apart, the rail running off the right edge. */
  railGap: 12,
  cardWidth: 146,
  cardHeight: 196,
  cardsApart: 10,
  /** `cCard`'s tick after the name, 13. (Its Follow is MediaCard's shared `action`.) */
  cardTick: 13,
  /**
   * `todayLoading` (H11): the heading 70% by 20 at 8, the cards 146 by 196. Its money card (203)
   * is drawn for a card with Send, Add and Scan; "skeletons match the real layout" (H11's note), so here
   * it takes the built card's height. Today has no TGIF card (R-59, DV2-RM), so no TGIF bar is drawn.
   */
  skeletonHeading: 20,
  skeletonHeadingCorner: 8,
} as const;

export const todayMetrics = {
  ...metricsBase,
  /** The built money card's height with a figure: its padding, the chip row, the figure and the action row. */
  skeletonMoney:
    metricsBase.moneyPadTop +
    metricsBase.chipHeight +
    metricsBase.figureTop +
    metricsBase.figure +
    metricsBase.actionsTop +
    metricsBase.action +
    metricsBase.actionGap +
    canvasNormalLineHeight(metricsBase.actionWord) +
    metricsBase.moneyPadBottom,
} as const;

/** White at a strength: the canvas's Naira chip (12%) over the money card. */
const whiteAt = (alpha: number) => darkColors.surfaceGlass.replace(/[\d.]+\)$/, `${alpha})`);

/**
 * Colours on the two dark cards, which are dark in both themes (H1 light and dark draw them alike): white
 * words, the canvas's glass, and the TGIF tokens (HOME-01 #1, applied by SHARED-02).
 */
export const cardInk = {
  ink: darkColors.textOnAccent,
  chip: whiteAt(0.12),
  /** `tgifRow`'s ground and its play mark on the white disc. */
  tgifGround: darkColors.tgifVerseGround,
  tgifLabel: darkColors.tgifLabel,
  tgifGlow: darkColors.accent,
  tgifWarm: darkColors.tgifWarmGlow,
} as const;

const type = (size: number, weight: 400 | 600 | 700, extra: TextStyle = {}): TextStyle => ({ ...font(weight), fontSize: size, ...extra });

export const todayWords = StyleSheet.create({
  chip: type(todayMetrics.chipWords, 600),
  notice: type(15, 600, { lineHeight: 15 * 1.4 }),
  noticeBody: type(13.5, 400, { lineHeight: 13.5 * 1.45, opacity: 0.8 }),
  tgifLabel: type(todayMetrics.tgifLabel, 700, { letterSpacing: todayMetrics.tgifLabel * todayMetrics.tgifLabelTracking }),
  tgifTitle: type(todayMetrics.tgifTitle, 700, { letterSpacing: todayMetrics.tgifTitle * todayMetrics.tgifTitleTracking }),
  tgifMeta: type(todayMetrics.tgifMeta, 400, { opacity: todayMetrics.tgifMetaFaint }),
  tgifProblem: type(todayMetrics.tgifMeta, 600),
  action: type(todayMetrics.actionWord, 600, { lineHeight: canvasNormalLineHeight(todayMetrics.actionWord), opacity: todayMetrics.actionWordFaint }),
});

/** The page's side gutter, as every body on the canvas has it. */
export const gutter = space.xl;
