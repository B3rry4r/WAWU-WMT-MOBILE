import { useColorScheme } from 'react-native';
import type { TextStyle } from 'react-native';

import {
  darkColors,
  darkGradients,
  layout,
  lightColors,
  lightGradients,
  motion,
  radius,
  space,
  type,
} from './tokens.generated';

export { layout, motion, radius, space, type };
export type { ColorToken, GradientToken } from './tokens.generated';

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

const style = (size: number, weight: Weight, trackingEm = 0, leading: number = type.leading.body): TextStyle => ({
  ...font(weight),
  fontSize: size,
  letterSpacing: trackingEm * size,
  lineHeight: Math.round(size * leading),
});

/**
 * The board kit sets no line-height on most copy, so it renders at Alan Sans's
 * `normal`: (typo ascender 990 + descender 310) / 1000 units = 1.3, which is
 * `type.leading.snug`.
 */
const kitNormalLeading = type.leading.snug;

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
  kvLabel: style(14, 400, 0, kitNormalLeading),
  /** kit.js line 44, `kv` value: `font-size:14.5px;font-weight:600`; also line 58, the `banner` title. */
  kvValue: style(14.5, 600, 0, kitNormalLeading),
  /** kit.js line 69, the `fromWallet` line, and line 55, the `tx` sub line: `font-size:13px`, 400, text-muted. */
  meta: style(13, 400, 0, kitNormalLeading),
  /** kit.js line 58, the `banner` body: `font-size:13px;color:var(--text-secondary);line-height:1.45`, 400. */
  bannerBody: style(13, 400, 0, type.leading.body),
  /** kit.js line 42, `muted`: `size: 13.5`, text-secondary, `lh: 1.45`. Not `secondary`, whose line height is 1.4. */
  muted: style(type.size.sec, 400, 0, type.leading.body),
  /** kit.js line 69, the `fromWallet` title: `font-size:15px;font-weight:600`. */
  cardTitle: style(type.size.body, 600, 0, kitNormalLeading),
  /** kit.js line 41, `h1(..., { size: 22 })`: a result or step title (auth.js line 28, home.js line 156). */
  sheetTitle: style(22, 700, kitHeadingTracking, kitHeadingLeading),
  /** kit.js line 41, `h1(..., { size: 21 })`: the title inside `sheet()` (line 64), as on the PIN sheet (home.js line 57). */
  sheetTitleSm: style(21, 700, kitHeadingTracking, kitHeadingLeading),
  /**
   * auth.js line 14 (and line 55), the inline error under a code entry:
   * `font-size:13px;font-weight:600;color:var(--danger)`, no tracking, no
   * line height (the font default). Drawn beside a CircleAlert 15 at 2.2.
   */
  errorLine: style(13, 600, 0, kitNormalLeading),
  /**
   * wallet.js line 81, W11's "Forgot PIN?":
   * `font-size:14px;font-weight:600;color:var(--accent-fg)`, no tracking, no
   * line height (the font default).
   */
  linkStrong: style(14, 600, 0, kitNormalLeading),
} satisfies Record<string, TextStyle>;

/**
 * The current theme's tokens. Dark is the design's default theme, so an unknown
 * system preference resolves to dark. Screens read every colour from here;
 * a colour literal in a screen fails the gates.
 */
export function useWawu() {
  const dark = useColorScheme() !== 'light';
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    gradients: dark ? darkGradients : lightGradients,
  };
}
