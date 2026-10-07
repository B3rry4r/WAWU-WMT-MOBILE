import { StyleSheet, type TextStyle } from 'react-native';

import { blackAt } from '@/components/shadow';
import { font, space } from '@/theme';
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
  /** `balanceCard`: `padding:18px 18px 16px`, the figure 14 under the chip row. */
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
  /** The eye: 19, white at 70%. */
  eye: 19,
  eyeFaint: 0.7,
  /** A wallet answer in place of the figure: words 15, then the button 14 under them. */
  noticeTop: 12,
  noticeGap: 14,
  /** The glow: a 220 circle 60 past the right edge and 80 above the top, clear at 70% of its far corner. */
  moneyGlow: { right: 60, top: 80, size: 220, strength: 0.55 },
  /** `--shadow-money`: dark, a 1 px edge of white at 8% (the hairline token); light, 0 24 40 -22 under the card. */
  moneyEdge: 1,
  moneyShadow: { y: 24, blur: 40, spread: -22 },
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
  /** The two glows: purple 200 at 40 past the right and 70 above; orange 160 at 30 past the left and 80 below. */
  tgifGlow: { right: 40, top: 70, size: 200, strength: 0.85 },
  tgifWarm: { left: 30, bottom: 80, size: 160, strength: 0.35 },
  /** `creators`: the heading, 12 to the rail; cards 146 by 196, 10 apart, the rail running off the right edge. */
  railGap: 12,
  cardWidth: 146,
  cardHeight: 196,
  cardsApart: 10,
  /** `cCard`: the words 10 in from the sides and bottom, 8 between the name and the button. */
  cardInset: 10,
  cardStack: 8,
  cardName: 14.5,
  cardLine: 12,
  cardLineFaint: 0.8,
  cardLineTop: 2,
  cardTick: 13,
  nameGap: 4,
  follow: 32,
  followWords: 13,
  /** A card with no photo: the person's initials in the middle of the picture. */
  cardAvatar: 64,
  /**
   * `todayLoading` (H11): the heading 70% by 20 at 8, the cards 146 by 196. Its money card (203)
   * and TGIF bar (64) are drawn for a card with Send, Add, Bills and Scan and a shorter TGIF row;
   * "skeletons match the real layout" (H11's note), so here they take the built cards' heights.
   */
  skeletonHeading: 20,
  skeletonHeadingCorner: 8,
} as const;

export const todayMetrics = {
  ...metricsBase,
  /** The built money card's height with a figure: its padding, the chip row and the figure. */
  skeletonMoney: metricsBase.moneyPadTop + metricsBase.chipHeight + metricsBase.figureTop + metricsBase.figure + metricsBase.moneyPadBottom,
} as const;

/** White at a strength: the canvas's chip (12%) and the Following button (20%) over a dark card. */
const whiteAt = (alpha: number) => darkColors.surfaceGlass.replace(/[\d.]+\)$/, `${alpha})`);

/**
 * Colours on the two dark cards, which are dark in both themes (H1 light and dark draw them
 * alike). White words, glass, the TGIF ground and its glows.
 */
export const cardInk = {
  ink: darkColors.textOnAccent,
  chip: whiteAt(0.12),
  following: whiteAt(0.2),
  /** The light theme's money card sits on the page with `--shadow-money` (0 24 40 -22, the card's ink at 60%). */
  moneyShadow: blackAt(0.6),
  /** The TGIF card's ground is the verse card's: the debit card's ink (HOME-09 #1). */
  tgifGround: darkColors.surfaceCardInk,
  /** The small capitals (the canvas's pale lilac): the accent's light ink is the nearest token (HOME-01 #1). */
  tgifLabel: darkColors.accentFg,
  tgifGlow: darkColors.accent,
  /** The warm glow (the canvas's orange at 35%): the warning orange is the nearest token. */
  tgifWarm: darkColors.warning,
  /** The play mark on the white disc: the card's ground, as the canvas draws it. */
  playMark: darkColors.surfaceCardInk,
  accent: darkColors.accent,
} as const;

const type = (size: number, weight: 400 | 600 | 700, extra: TextStyle = {}): TextStyle => ({ ...font(weight), fontSize: size, ...extra });

export const todayWords = StyleSheet.create({
  chip: type(todayMetrics.chipWords, 600),
  notice: type(15, 600, { lineHeight: 15 * 1.4 }),
  noticeBody: type(13.5, 400, { lineHeight: 13.5 * 1.45, opacity: 0.8 }),
  tgifLabel: type(todayMetrics.tgifLabel, 700, { letterSpacing: todayMetrics.tgifLabel * todayMetrics.tgifLabelTracking }),
  tgifTitle: type(todayMetrics.tgifTitle, 700, { letterSpacing: todayMetrics.tgifTitle * todayMetrics.tgifTitleTracking }),
  tgifMeta: type(todayMetrics.tgifMeta, 400, { opacity: todayMetrics.tgifMetaFaint }),
  cardName: type(todayMetrics.cardName, 700),
  cardLine: type(todayMetrics.cardLine, 400, { opacity: todayMetrics.cardLineFaint }),
  follow: type(todayMetrics.followWords, 700),
});

/** The page's side gutter, as every body on the canvas has it. */
export const gutter = space.xl;
