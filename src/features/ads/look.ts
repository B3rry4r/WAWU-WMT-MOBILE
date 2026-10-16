import { StyleSheet, type TextStyle } from 'react-native';

import { font } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/**
 * The sponsored card's sizes, from design/_gen/home.js: `tgifAd` (H33, the card in the TGIF reader) and `adSlot` (H36,
 * TGIF's place on Today). Colours are the theme's tokens; where the canvas paints a colour the tokens only have at
 * another strength (white at 18%, the page colour at 20 to 92%), the token's own colour is used at that strength.
 */
export const adMetrics = {
  /** `tgifAd`: `padding:0 24px 60px`, `gap:12px`, the words at the bottom of the card. */
  stepPadX: 24,
  stepPadBottom: 60,
  stepGap: 12,
  /** The SPONSORED chip: 26 high, `padding:0 10px`, 11.5 at 700, 0.08em apart. */
  chipHeight: 26,
  chipPadX: 10,
  chipWords: 11.5,
  chipTracking: 0.08,
  chipFill: 0.18,
  /** The headline 30 at 700, -0.03em, 1.1 apart; the line under it 14.5 at 80%. */
  headline: 30,
  headlineTracking: -0.03,
  headlineLeading: 1.1,
  subline: 14.5,
  sublineFaint: 0.8,
  /** The row under the button: Skip is 13 at 700. */
  skip: 13,
  /** `tgifAd`'s shade over the picture: the page colour at 55%, 20% a third of the way down and 92% three quarters down. */
  shade: { colors: [0.55, 0.2, 0.92], locations: [0, 0.35, 0.75] },
  /** `adSlot`: 104 high, the picture 104 wide, `padding:12px 14px`, `gap:4px`; words 11, 15.5 and 12.5; the button word 13.5. */
  slotHeight: 104,
  slotPadY: 12,
  slotPadX: 14,
  slotGap: 4,
  slotLabel: 11,
  slotLabelTracking: 0.08,
  slotHeadline: 15.5,
  slotSubline: 12.5,
  slotAction: 13.5,
  slotActionRight: 14,
} as const;

/** White text and controls over the picture, whatever the theme: the card is dark in both, as the reader's cards are. */
export const adInk = darkColors.textOnAccent;

/** The page colour (`lockedVeil` is that colour at 35%) at another strength, for the shade over a picture. */
export const shadeAt = (alpha: number) => darkColors.lockedVeil.replace(/[\d.]+\)$/, `${alpha})`);

/** White at a strength: the chip's fill over the picture (`surfaceGlass` is white at 14%). */
export const chipFill = darkColors.surfaceGlass.replace(/[\d.]+\)$/, `${adMetrics.chipFill})`);

const type = (size: number, weight: 400 | 600 | 700, extra: TextStyle = {}): TextStyle => ({ ...font(weight), fontSize: size, ...extra });

export const adWords = StyleSheet.create({
  chip: type(adMetrics.chipWords, 700, { letterSpacing: adMetrics.chipWords * adMetrics.chipTracking, color: adInk }),
  headline: type(adMetrics.headline, 700, {
    letterSpacing: adMetrics.headline * adMetrics.headlineTracking,
    lineHeight: adMetrics.headline * adMetrics.headlineLeading,
    color: adInk,
  }),
  subline: type(adMetrics.subline, 400, { color: adInk, opacity: adMetrics.sublineFaint }),
  skip: type(adMetrics.skip, 700, { color: adInk }),
  slotLabel: type(adMetrics.slotLabel, 700, { letterSpacing: adMetrics.slotLabel * adMetrics.slotLabelTracking }),
  slotHeadline: type(adMetrics.slotHeadline, 700),
  slotSubline: type(adMetrics.slotSubline, 400),
  slotAction: type(adMetrics.slotAction, 700),
});
