import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { text, useWawu, type ColorToken } from '@/theme';

export type TextVariant = keyof typeof text;

/** The colour each text class carries in the design system (base.css, .wb-*) or the board kit (design/_gen/kit.js). */
const defaultTone: Record<TextVariant, ColorToken> = {
  display: 'textPrimary',
  title: 'textPrimary',
  h1: 'textPrimary',
  h2: 'textPrimary',
  h3: 'textPrimary',
  body: 'textPrimary',
  secondary: 'textSecondary',
  caption: 'textMuted',
  label: 'textMuted',
  kvLabel: 'textSecondary',
  kvValue: 'textPrimary',
  meta: 'textMuted',
  bannerBody: 'textSecondary',
  muted: 'textSecondary',
  cardTitle: 'textPrimary',
  sheetTitle: 'textPrimary',
  sheetTitleSm: 'textPrimary',
};

/** Headings announce themselves to screen readers, so a screen never has to say so. */
const headings: readonly TextVariant[] = ['display', 'title', 'h1', 'h2', 'sheetTitle', 'sheetTitleSm'];

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  /** A colour token name. Defaults to the variant's own colour. */
  tone?: ColorToken;
};

/** Every piece of copy in the app is one of these. A new look is a new variant here, never a style on a screen. */
export function Text({ variant = 'body', tone, style, accessibilityRole, ...rest }: TextProps) {
  const { colors } = useWawu();
  return (
    <NativeText
      accessibilityRole={accessibilityRole ?? (headings.includes(variant) ? 'header' : undefined)}
      style={[text[variant], { color: colors[tone ?? defaultTone[variant]] }, style]}
      {...rest}
    />
  );
}
