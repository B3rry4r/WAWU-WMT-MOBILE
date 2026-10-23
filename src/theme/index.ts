import { useColorScheme } from 'react-native';

import { isDarkFor, useThemePick } from './override';
import type { TextStyle } from 'react-native';

import {
  darkColors,
  darkGradients,
  darkShadows,
  layout,
  lightColors,
  lightGradients,
  lightShadows,
  motion,
  radius,
  space,
  type,
} from './tokens.generated';

export { layout, motion, radius, space, type };
export type { ColorToken, GradientToken, ShadowToken } from './tokens.generated';

/**
 * Alan Sans, cut into static weights (assets/fonts, OFL). React Native picks a
 * custom font by family name, not by fontWeight, so each weight is its own
 * family. Use `font(600)`, never `fontWeight` on its own.
 *
 * Alan Sans has no Naira sign (U+20A6): the platform font draws "₦".
 * Open question D15 in DECISIONS.md.
 */
export const fontFiles = {
  'AlanSans-Light': require('../../assets/fonts/AlanSans-Light.ttf'),
  'AlanSans-Regular': require('../../assets/fonts/AlanSans-Regular.ttf'),
  'AlanSans-Medium': require('../../assets/fonts/AlanSans-Medium.ttf'),
  'AlanSans-SemiBold': require('../../assets/fonts/AlanSans-SemiBold.ttf'),
  'AlanSans-Bold': require('../../assets/fonts/AlanSans-Bold.ttf'),
  'AlanSans-ExtraBold': require('../../assets/fonts/AlanSans-ExtraBold.ttf'),
  'AlanSans-Black': require('../../assets/fonts/AlanSans-Black.ttf'),
} as const;

const families = {
  300: 'AlanSans-Light',
  400: 'AlanSans-Regular',
  500: 'AlanSans-Medium',
  600: 'AlanSans-SemiBold',
  700: 'AlanSans-Bold',
  800: 'AlanSans-ExtraBold',
  900: 'AlanSans-Black',
} as const;

export type Weight = keyof typeof families;

export const font = (weight: Weight): TextStyle => ({ fontFamily: families[weight] });

/**
 * A text class: the line height is size × leading exactly, as the kit's CSS
 * computes it (`line-height: 1.45` on 13.5 px is 19.575 px, not 20). Rounding
 * here made every multi-line block taller than the canvas (H18 by 1 px).
 * Lead, 2 Oct 2026 (MONEY-03).
 */
const style = (size: number, weight: Weight, trackingEm = 0, leading: number = type.leading.body): TextStyle => ({
  ...font(weight),
  fontSize: size,
  letterSpacing: trackingEm * size,
  lineHeight: size * leading,
});

/** Alan Sans's ascent and descent per em (hhea 990 and -310 per 1000, line gap 0). */
const alanAscent = 0.99;
const alanDescent = 0.31;

/**
 * The line height the canvas gets where the kit sets none (`line-height: normal`):
 * the font's ascent and descent, each rounded to a whole pixel, so 17 at 13 and
 * 13.5, 18 at 14 and 14.5, 20 at 15 (measured in Chromium, which drew the canvas).
 * Every kit variant on `normal` takes this on every platform (Lead, 2 Oct 2026,
 * MONEY-03), so a screen never overrides a variant's line height.
 */
export const canvasNormalLineHeight = (size: number): number => Math.round(size * alanAscent) + Math.round(size * alanDescent);

/** A kit text class on `line-height: normal`: `style()` with the canvas's normal line. */
const normalStyle = (size: number, weight: Weight, trackingEm = 0): TextStyle => ({
  ...style(size, weight, trackingEm),
  lineHeight: canvasNormalLineHeight(size),
});

/** design/_gen/kit.js line 41, `h1`: 700, `letter-spacing:-0.03em`, `line-height:1.15`. */
const kitHeadingTracking = -0.03;
const kitHeadingLeading = 1.15;

/**
 * The design system's text classes (design/_ds/wawu/tokens/base.css, .wb-*),
 * then the board kit's copy sizes (design/_gen/kit.js; R-22: the kit is the
 * source for sizes). Each kit variant cites the line it comes from.
 */
export const text = {
  display: style(type.size.display, 600, -0.045, 1),
  title: style(type.size.title, 700, type.tracking.title, type.leading.tight),
  h1: style(type.size.h1, 700, -0.03, type.leading.tight),
  h2: style(type.size.h2, 700, type.tracking.heading, type.leading.snug),
  h3: style(type.size.h3, 600, -0.015, type.leading.snug),
  body: style(type.size.body, 400),
  secondary: style(type.size.sec, 400, 0, 1.4),
  caption: style(type.size.caption, 400, 0, 1.35),
  label: { ...style(type.size.label, 700, 0.08), textTransform: 'uppercase' },
  /** kit.js line 44, `kv` key: `font-size:14px`, 400, text-secondary. */
  kvLabel: normalStyle(14, 400, 0),
  /** kit.js line 44, `kv` value: `font-size:14.5px;font-weight:600`; also line 58, the `banner` title. */
  kvValue: normalStyle(14.5, 600, 0),
  /** kit.js line 69, the `fromWallet` line, and line 55, the `tx` sub line: `font-size:13px`, 400, text-muted. */
  meta: normalStyle(13, 400, 0),
  /** kit.js line 58, the `banner` body: `font-size:13px;color:var(--text-secondary);line-height:1.45`, 400. */
  bannerBody: style(13, 400, 0, type.leading.body),
  /** kit.js line 42, `muted`: `size: 13.5`, text-secondary, `lh: 1.45`. Not `secondary`, whose line height is 1.4. */
  muted: style(type.size.sec, 400, 0, type.leading.body),
  /** kit.js line 69, the `fromWallet` title: `font-size:15px;font-weight:600`. */
  cardTitle: normalStyle(type.size.body, 600, 0),
  /** kit.js line 41, `h1(..., { size: 22 })`: a result or step title (auth.js line 28, home.js line 156). */
  sheetTitle: style(22, 700, kitHeadingTracking, kitHeadingLeading),
  /** kit.js line 41, `h1(..., { size: 21 })`: the title inside `sheet()` (line 64), as on the PIN sheet (home.js line 57). */
  sheetTitleSm: style(21, 700, kitHeadingTracking, kitHeadingLeading),
  /**
   * auth.js line 14 (and line 55), the inline error under a code entry:
   * `font-size:13px;font-weight:600;color:var(--danger)`, no tracking, no
   * line height (the font default). Drawn beside a CircleAlert 15 at 2.2.
   */
  errorLine: normalStyle(13, 600, 0),
  /**
   * wallet.js line 81, W11's "Forgot PIN?":
   * `font-size:14px;font-weight:600;color:var(--accent-fg)`, no tracking, no
   * line height (the font default).
   */
  linkStrong: normalStyle(14, 600, 0),
} satisfies Record<string, TextStyle>;

/**
 * The current theme's tokens: Settings' Theme when it pins one (Light or Dark, `override.ts`), the phone's scheme otherwise. Dark is the design's
 * default theme, so an unknown system preference resolves to dark. Screens read every colour from here;
 * a colour literal in a screen fails the gates.
 */
export function useWawu() {
  const dark = isDarkFor(useColorScheme(), useThemePick());
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    gradients: dark ? darkGradients : lightGradients,
    shadows: dark ? darkShadows : lightShadows,
  };
}

/**
 * A colour token as an SVG gradient stop takes it: the opaque colour and its strength apart. react-native-svg
 * replaces a stop colour's own alpha with `stopOpacity`, so a token written `rgba(r, g, b, a)` is split here;
 * a token with no alpha is at full strength.
 */
export function stopOf(token: string): { color: string; opacity: number } {
  const m = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(token);
  if (!m) return { color: token, opacity: 1 };
  return { color: `rgb(${m[1]}, ${m[2]}, ${m[3]})`, opacity: Number(m[4]) };
}
