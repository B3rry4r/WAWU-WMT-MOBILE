import { StyleSheet, Text as NativeText, View, type StyleProp, type TextStyle } from 'react-native';

import { font, radius, type, useWawu, type ColorToken } from '@/theme';

export type Currency = 'NGN' | 'USD';

/**
 * Alan Sans has no Naira sign (U+20A6), so the platform font draws it from the
 * same Text run. D15 in DECISIONS.md keeps that until the designer rules.
 */
const platformFont = 'System';
const weightName = { 400: '400', 500: '500', 600: '600', 700: '700', 800: '800' } as const;
const glyphs: Record<Currency, string> = { NGN: '₦', USD: '$' };
const names: Record<Currency, { major: string; minor: string }> = {
  NGN: { major: 'naira', minor: 'kobo' },
  USD: { major: 'dollars', minor: 'cents' },
};

/** A minus sign (U+2212), the one the design draws on a debit. */
const minus = '−';
const minorPerMajor = 100;
/** The kobo part is drawn at 72% size and half strength (design/_gen/kit.js line 13, `Amt`: `font-size:0.72em;opacity:0.5`). */
const minorScale = 0.72;
const minorOpacity = 0.5;
/**
 * Tracking in em, from design/_gen/kit.js line 13 (`Amt`: `letter-spacing:-0.025em`).
 * The design token `--tracking-money` says -0.03em; R-22 makes the kit win, so
 * this constant replaces `type.tracking.money` here and the token is left unused.
 */
export const amountTracking = -0.025;
const maskDots = '•'.repeat(6);

type Parts = { sign: string; glyph: string; whole: string; minor: string };

/** Splits an amount held in kobo (or cents) into what is drawn. The API sends whole minor units; never pass a float of naira. */
export function moneyParts(minorUnits: number, currency: Currency = 'NGN', showSign = false): Parts {
  const total = Math.round(Math.abs(minorUnits));
  const whole = Math.floor(total / minorPerMajor);
  const minor = String(total % minorPerMajor).padStart(2, '0');
  const sign = minorUnits < 0 ? minus : showSign && minorUnits > 0 ? '+' : '';
  return { sign, glyph: glyphs[currency], whole: String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ','), minor };
}

/** "₦485,250.75", "+₦2,000.00", "−₦10,600.00". For places that need a plain string. */
export function formatMoney(
  minorUnits: number,
  { currency = 'NGN', sign = false, decimals = true }: { currency?: Currency; sign?: boolean; decimals?: boolean } = {},
): string {
  const p = moneyParts(minorUnits, currency, sign);
  return `${p.sign}${p.glyph}${p.whole}${decimals ? `.${p.minor}` : ''}`;
}

/** What a screen reader says: "485,250 naira 75 kobo", "minus 25,065 naira", and "plus 2,000 naira" when the figure is signed. */
function spoken(minorUnits: number, currency: Currency, decimals: boolean, signed: boolean): string {
  const p = moneyParts(minorUnits, currency);
  const direction = minorUnits < 0 ? 'minus ' : signed && minorUnits > 0 ? 'plus ' : '';
  const kobo = decimals && p.minor !== '00' ? ` ${Number(p.minor)} ${names[currency].minor}` : '';
  return `${direction}${p.whole} ${names[currency].major}${kobo}`;
}

export type MoneyProps = {
  /** Amount in kobo (or cents) as the API sends it: 48525075 is ₦485,250.75. */
  minorUnits: number;
  currency?: Currency;
  size?: number;
  weight?: 400 | 500 | 600 | 700 | 800;
  /** Show + on credits (in green) and the minus sign on debits. */
  signed?: boolean;
  /** Drop the kobo part, as on the amount being typed. */
  decimals?: boolean;
  /** Balance hidden: dots instead of the figure. */
  masked?: boolean;
  /** The figure has not arrived yet: a bar the size of the amount, never a zero. */
  loading?: boolean;
  tone?: ColorToken;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/** Every naira (and dollar) figure in the app. Tabular figures, so columns of amounts line up. */
export function Money({
  minorUnits,
  currency = 'NGN',
  size = type.size.h3,
  weight = 600,
  signed,
  decimals = true,
  masked,
  loading,
  tone,
  style,
  testID,
}: MoneyProps) {
  const { colors } = useWawu();
  const color = colors[tone ?? (signed && minorUnits > 0 ? 'positive' : 'textPrimary')];

  if (loading) {
    return (
      <View
        testID={testID}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading amount"
        style={[styles.skeleton, { height: size, width: size * 7, backgroundColor: colors.surfaceSunken }]}
      />
    );
  }

  const base: TextStyle = {
    ...font(weight),
    fontSize: size,
    letterSpacing: amountTracking * size,
    /** The kit's `line-height:1`: a figure at size 40 is 40 px tall. */
    lineHeight: size,
    fontVariant: ['tabular-nums', 'lining-nums'],
    color,
  };

  // The runs inside the figure (the sign in the platform font, the smaller kobo)
  // get a line height of their own, kobo-sized. Left to inherit the figure's
  // absolute one, each is centred on its own font's metrics and pushes the line
  // box past `size` on the web: 44 px at 40 from the kobo (measured on W10), and
  // 41 from the platform-font sign. Line height never moves a glyph off the
  // baseline, so nothing shifts; the figure is `size` tall, like the kit's
  // `line-height:1`.
  const runLineHeight = size * minorScale;
  const signStyle: TextStyle = {
    lineHeight: runLineHeight,
    ...(currency === 'NGN' ? { fontFamily: platformFont, fontWeight: weightName[weight] } : null),
  };

  if (masked) {
    return (
      <NativeText testID={testID} accessibilityLabel="Balance hidden" style={[base, style]}>
        <NativeText style={signStyle}>{glyphs[currency]}</NativeText>
        {maskDots}
      </NativeText>
    );
  }

  const p = moneyParts(minorUnits, currency, signed);
  return (
    <NativeText
      testID={testID}
      accessibilityLabel={spoken(minorUnits, currency, decimals, Boolean(signed))}
      numberOfLines={1}
      style={[base, style]}
    >
      {p.sign}
      <NativeText style={signStyle}>{p.glyph}</NativeText>
      {p.whole}
      {decimals ? (
        <NativeText style={{ fontSize: size * minorScale, lineHeight: runLineHeight, opacity: minorOpacity }}>.{p.minor}</NativeText>
      ) : null}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  skeleton: { borderRadius: radius.chip },
});
