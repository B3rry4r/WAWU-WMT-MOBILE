import { StyleSheet, type TextStyle } from 'react-native';

import { blackAt } from '@/components/shadow';
import { font } from '@/theme';
import { darkColors, darkGradients } from '@/theme/tokens.generated';

/**
 * The feed's look. A post is drawn over its own picture, so H2 to H6 draw it the same in
 * the light and the dark theme (each artboard's two phones are identical): white words,
 * glass and ink over the media. The colours are the theme's own tokens; where the canvas
 * uses one of them at another strength, the strength is the canvas's (the theme has no
 * token for those overlays, SHARED-CHANGES HOME-02 #1).
 */

/** A token colour written with an alpha channel, given another strength. */
const atStrength = (rgba: string, alpha: number) => rgba.replace(/[\d.]+\)$/, `${alpha})`);

/** The page ink (11, 10, 13), as the canvas's pills and veils use it. */
const inkAt = (alpha: number) => atStrength(darkColors.lockedVeil, alpha);
/** White at a strength, as the canvas's tracks, dots and the Tip circle use it. */
const whiteAt = (alpha: number) => atStrength(darkColors.surfaceGlass, alpha);

export const media = {
  /** White on every artboard: the words and icons over a post. */
  ink: darkColors.textOnAccent,
  /** The ink on the white price button. */
  inkOnLight: darkColors.textOnLight,
  /** Black, under the picture. */
  black: blackAt(1),
  /** The page ink at 55%: the pill and the frame counter. */
  pill: inkAt(0.55),
  /** The page ink at 38%: the veil over a blurred backdrop (H4, H5, H6). */
  veil: inkAt(0.38),
  /** White at 14% with a 1 px edge at 16%: the offer bar and H5's lock circle. */
  glass: darkColors.surfaceGlass,
  glassEdge: darkColors.borderGlass,
  /** White at 25%: an unplayed track (H2, H4). */
  track: whiteAt(0.25),
  /** White at 45%: a photo-set dot that is not the current frame (H3). */
  dot: whiteAt(0.45),
  /** White at 35%: a waveform bar not yet played (H6). */
  waveRest: whiteAt(0.35),
  /** White at 60%: the tabs that are not selected. */
  tabIdle: whiteAt(0.6),
  /** H4's book: the cover (the canvas's deep purple) and the pale page behind it. */
  cover: darkColors.accentDeep,
  page: darkColors.textPrimary,
  /** Black at 25%: the spine on the cover. */
  spine: blackAt(0.25),
  /** `--shadow-cover`, black at 70%: under H4's book and H6's square. */
  coverShadow: blackAt(0.7),
  accent: darkColors.accent,
  /** Under a post that has no picture of its own (a PDF, an audio file): the sunken ink. */
  backdrop: darkColors.surfaceSunken,
  scrim: darkGradients.scrimFeed,
} as const;

/** The canvas's sizes for the feed (Home Flow, H2 to H6), named so each cites its source. */
export const metrics = {
  /** The phone's status bar: the tabs sit at 56, six below it. */
  statusBar: 50,
  tabsGap: 6,
  tabsSide: 20,
  tabsSpacing: 20,
  tabUnderline: 2.5,
  tabUnderlinePad: 6,
  /** The bottom bar is 90 tall (`--tabbar-h`); the canvas measures the post from the phone's bottom. */
  tabbar: 90,
  /** Rail: right 14, bottom 196 from the phone's bottom, 18 between items. */
  railRight: 14,
  railBottom: 196,
  railGap: 18,
  railCountGap: 4,
  railIcon: 28,
  /**
   * The ₦ Tip button's place at the foot of the rail (42 circle, 4, the 16 label, 18 gap). HOME-13 draws
   * the button there (H26); until then the place is kept, so the rail sits where H2 to H6 draw it.
   */
  tipSlot: 80,
  avatar: 46,
  avatarRing: 2,
  followBadge: 20,
  followBadgeLeft: 13,
  followBadgeDrop: 9,
  followIcon: 13,
  /** Caption block: 16 in from each side, 104 above the phone's bottom, 12 between rows. */
  side: 16,
  captionBottom: 104,
  stack: 12,
  captionRight: 76,
  barRight: 70,
  pillH: 26,
  /** The loading pill's width: about a "Video · 1:50" pill. */
  loadingPill: 96,
  pillPad: 10,
  pillGap: 5,
  pillIcon: 13,
  pillBelow: 10,
  nameGap: 6,
  tick: 16,
  captionTop: 6,
  /** Scrubber: a 4 tall track, 10 to the time. */
  track: 4,
  trackRadius: 2,
  trackGap: 10,
  /** The touch area around the 4 px track. */
  trackHit: 24,
  /** Offer bar: 56 tall, 18 corners, 12 between parts, 14 in on the left and 8 on the right. */
  offerH: 56,
  offerPadV: 8,
  /**
   * Under this width (a 320 or 340 phone) the bar gives the words more room: a smaller icon,
   * tighter gaps and a narrower price button, so "Pay from wallet" still fits on one line.
   */
  compactBelow: 360,
  offerGapCompact: 6,
  offerLeftCompact: 10,
  offerRightCompact: 6,
  offerIconCompact: 18,
  pricePadCompact: 8,
  priceTextCompact: 13,
  offerRadius: 18,
  offerGap: 12,
  offerLeft: 14,
  offerRight: 8,
  offerIcon: 24,
  priceH: 40,
  priceText: 14,
  pricePad: 14,
  priceRadius: 13,
  /** H3: the frame counter (top 100, right 16) and the next frame peeking in. */
  counterTop: 100,
  counterH: 28,
  counterPad: 11,
  counterGap: 6,
  counterIcon: 15,
  peekRight: -40,
  peekTop: 150,
  peekW: 64,
  peekH: 380,
  peekRadius: 18,
  dotH: 6,
  dotOn: 18,
  dotGap: 5,
  /** The middle of a post (the book, the preview-ended message) starts under the tabs and ends this far above the words. */
  middleTop: 100,
  middleGap: 12,
  /** H4: the book, 128 from the top. */
  bookTop: 128,
  bookW: 200,
  bookH: 280,
  bookRadius: 6,
  bookPadV: 24,
  bookPadH: 20,
  pageLeft: 16,
  pageTop: 10,
  /**
   * What the book takes up beyond its own box: the back page sticks out 16 to the right and
   * its 4 degree tilt adds about 10 each way (the canvas's `rotate(4deg)`), so the whole is
   * 300 tall (310 with the 10 it sits off the box's middle), and its right edge is 126 from the book's middle.
   */
  bookExtentH: 310,
  bookReachRight: 126,
  /** The rail's width on its left side (right 14 + the 46 avatar) and a gap, so the book never runs under it. */
  railClear: 68,
  spine: 6,
  /** H4 to H6: the backdrop is blurred past the phone's edge. */
  backdropBleed: -30,
  backdropBlur: 22,
  /** H5: the lock circle and words, 150 from the top, 24 in from each side. */
  endedTop: 150,
  endedSide: 24,
  endedGap: 12,
  endedCircle: 64,
  endedIcon: 28,
  endedWidth: 260,
  /** The lock circle, its title and two lines of words: 64 + 12 + 27 + 12 + 2 x 21, rounded up. */
  endedH: 162,
  /** The message's words stop this far from the phone's middle short of the rail (right 14 + the 46 avatar + 4). */
  endedRailClear: 64,
  /** The frame counter steps left of the rail (when the rail rises to it) by this gap. */
  counterRailGap: 8,
  /** H6: the art, the waveform and the controls. */
  artSize: 220,
  artRadius: 24,
  audioGap: 22,
  waveH: 60,
  waveBar: 3,
  waveGap: 2.5,
  waveMin: 0.1,
  controlsGap: 26,
  playSize: 62,
  playIcon: 26,
  controlIcon: 24,
  /** The play mark in the middle of a paused video. */
  pausedIcon: 64,
} as const;

/** The canvas's type for the feed, each from the artboard's own CSS. */
const type = (size: number, weight: 400 | 600 | 700, extra: TextStyle = {}): TextStyle => ({
  ...font(weight),
  fontSize: size,
  ...extra,
});

export const words = StyleSheet.create({
  tab: type(16.5, 700),
  count: type(12.5, 600),
  pill: type(12, 600),
  name: type(16, 700),
  following: type(12, 600, { opacity: 0.75 }),
  caption: type(14.5, 400, { lineHeight: 14.5 * 1.4, opacity: 0.92 }),
  time: type(12.5, 600, { opacity: 0.85 }),
  offerTitle: type(14, 600),
  offerSub: type(12, 400, { opacity: 0.7 }),
  price: type(14, 700),
  counter: type(13, 700),
  bookBy: type(10, 700, { letterSpacing: 10 * 0.14, opacity: 0.7, textTransform: 'uppercase' }),
  bookTitle: type(26, 700, { lineHeight: 26 * 1.05, letterSpacing: 26 * -0.03 }),
  bookPages: type(11, 400, { opacity: 0.7 }),
  endedTitle: type(22, 700, { letterSpacing: 22 * -0.025 }),
  endedBody: type(14.5, 400, { lineHeight: 14.5 * 1.45, opacity: 0.85, textAlign: 'center' }),
});
