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

/** The design system's text classes (design/_ds/wawu/tokens/base.css, .wb-*). */
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
