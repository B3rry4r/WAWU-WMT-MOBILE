import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import { bankLine } from './model';

/**
 * design/_gen/kit.js line 22, `Acct`: a 28 corner (the kit's, not `--radius-money`'s 26; R-22), 22 all
 * round, the label 14 at 70%, the figure 42 ten below it, then 22 down a line at 12% white, 16 under it
 * the bank line 12 at 60% and the number 15 / 600 tracked 0.04em three below it; Copy is a 32 pill, 12
 * at the sides, white at 12%, the glyph 14 and the word 13 / 600, 6 apart. The eye is 19 at 70%.
 */
export const ACCT = {
  radius: 28,
  pad: 22,
  labelSize: 14,
  labelOpacity: 0.7,
  figure: 42,
  figureTop: 10,
  footTop: 22,
  footPadTop: 16,
  lineOpacity: 0.12,
  bankSize: 12,
  bankOpacity: 0.6,
  numberSize: 15,
  numberTracking: 0.04,
  numberTop: 3,
  eye: 19,
  eyeOpacity: 0.7,
  /** The line over the bank line: `inset 0 1px 0`. */
  line: 1,
} as const;
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6, fill: 0.12 } as const;
/** kit.js line 22: a 220 circle 60 past the right edge and 80 above the top, the accent at 55% fading out by 70% of its radius. */
const GLOW = { size: 220, right: -60, top: -80, strength: 0.55, fadeAt: 0.7 } as const;
/**
 * elevation.css `--shadow-money`: light `0 24px 40px -22px` at 60% of the card's own ink (#16151B, the dark
 * card surface); dark an inset 1 px line of white at 8%. Not generated into the theme (its header lists it),
 * so the parts are kept here and the colours come from the tokens.
 */
const SHADOW = { y: 24, blur: 40, spread: -22, alpha: 0.6, insetAlpha: 0.08 } as const;
/** How long Copy reads "Copied" before it reads "Copy" again (A8 does the same). Default (agent), owner may override. */
const COPIED_MS = 2000;

/** A token colour (#RRGGBB) at a strength, written #RRGGBBAA. */
function tokenAt(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

export type BalanceCardProps = {
  /** Integer kobo, the bank's figure (`GET /money/wallet/balance`). */
  availableKobo: number;
  accountNumber: string;
  bankName: string;
  hidden: boolean;
  onToggleHidden: () => void;
};

/** W1's balance card: the Naira balance with its kobo, the bank line and the account number with Copy. Dark in both themes. */
export function BalanceCard({ availableKobo, accountNumber, bankName, hidden, onToggleHidden }: BalanceCardProps) {
  const { dark, gradients, colors } = useWawu();
  const ink = colors.textOnAccent;
  const ends = gradientEnds(gradients.surfaceMoney.angle);
  const shadow = dark
    ? { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: tokenAt(ink, SHADOW.insetAlpha), inset: true }
    : { offsetX: 0, offsetY: SHADOW.y, blurRadius: SHADOW.blur, spreadDistance: SHADOW.spread, color: tokenAt(darkColors.surfaceCard, SHADOW.alpha) };
  return (
    <View testID="wallet-balance-card" style={[styles.card, { boxShadow: [shadow] }]}>
      <View style={styles.clip}>
        <LinearGradient
          pointerEvents="none"
          colors={gradients.surfaceMoney.colors as unknown as readonly [string, string, ...string[]]}
          locations={gradients.surfaceMoney.locations as unknown as readonly [number, number, ...number[]]}
          start={ends.start}
          end={ends.end}
          style={StyleSheet.absoluteFill}
        />
        <Svg pointerEvents="none" width={GLOW.size} height={GLOW.size} style={styles.glow}>
          <Defs>
            <RadialGradient id="wallet-balance-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={GLOW.strength} />
              <Stop offset={GLOW.fadeAt} stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW.size / 2} cy={GLOW.size / 2} r={GLOW.size / 2} fill="url(#wallet-balance-glow)" />
        </Svg>
      </View>
      <View style={styles.head}>
        <Text variant="body" tone="textOnAccent" style={styles.label}>
          Naira balance
        </Text>
        <Pressable
          testID="wallet-balance-eye"
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
          onPress={onToggleHidden}
          hitSlop={space.md}
          style={styles.eye}
        >
          <Icon name={hidden ? 'EyeOff' : 'Eye'} size={ACCT.eye} color={ink} />
        </Pressable>
      </View>
      <View style={styles.figure}>
        <Money testID="wallet-balance" minorUnits={availableKobo} size={ACCT.figure} tone="textOnAccent" masked={hidden} />
      </View>
      <View style={styles.foot}>
        <View style={[styles.line, { backgroundColor: ink }]} />
        <View style={styles.account}>
          <Text variant="body" tone="textOnAccent" numberOfLines={1} style={styles.bank} testID="wallet-bank-line">
            {bankLine(bankName)}
          </Text>
          <Text variant="body" tone="textOnAccent" selectable numberOfLines={1} style={[font(600), styles.number]} testID="wallet-account-number">
            {groupedAccountNumber(accountNumber)}
          </Text>
        </View>
        <CopyPill value={accountNumber} />
      </View>
    </View>
  );
}

/** Copy on the card: the account number as sent, digits only, onto the clipboard; it reads "Copied" for a moment after. */
function CopyPill({ value }: { value: string }) {
  const { colors } = useWawu();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(value);
    AccessibilityInfo.announceForAccessibility(done ? 'Account number copied' : "Couldn't copy the account number");
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  return (
    <Pressable
      testID="wallet-copy"
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : 'Copy account number'}
      onPress={() => void copy()}
      hitSlop={space.sm}
      style={styles.copy}
    >
      {({ pressed }) => (
        <>
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.copyFill, { backgroundColor: colors.textOnAccent, opacity: pressed ? 2 * COPY.fill : COPY.fill }]}
          />
          <Icon name={copied ? 'Check' : 'Copy'} size={COPY.icon} color={colors.textOnAccent} />
          <Text variant="body" tone="textOnAccent" style={[font(600), styles.copyLabel]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: ACCT.radius, padding: ACCT.pad, flexShrink: 0 },
  clip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: ACCT.radius, overflow: 'hidden' },
  glow: { position: 'absolute', right: GLOW.right, top: GLOW.top },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: ACCT.labelSize, lineHeight: canvasNormalLineHeight(ACCT.labelSize), opacity: ACCT.labelOpacity },
  eye: { opacity: ACCT.eyeOpacity },
  figure: { marginTop: ACCT.figureTop },
  foot: { marginTop: ACCT.footTop, paddingTop: ACCT.footPadTop, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  line: { position: 'absolute', top: 0, left: 0, right: 0, height: ACCT.line, opacity: ACCT.lineOpacity },
  account: { flex: 1, minWidth: 0 },
  bank: { fontSize: ACCT.bankSize, lineHeight: canvasNormalLineHeight(ACCT.bankSize), opacity: ACCT.bankOpacity },
  number: { fontSize: ACCT.numberSize, lineHeight: canvasNormalLineHeight(ACCT.numberSize), letterSpacing: ACCT.numberTracking * ACCT.numberSize, marginTop: ACCT.numberTop },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyFill: { borderRadius: radius.chip },
  copyLabel: { fontSize: COPY.label, lineHeight: canvasNormalLineHeight(COPY.label) },
});
