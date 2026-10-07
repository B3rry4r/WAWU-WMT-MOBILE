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
import { canvasNormalLineHeight, font, radius, space, stopOf, useWawu } from '@/theme';

import { bankLine, fitFigureSize } from './model';

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
/**
 * A balance is never cut off (lead ruling, WALLET-01 round 2): when the figure is wider than the card it
 * drops from 42 in steps of 2 until it fits, never below 18, the wallet flow's other figure on a card
 * (wallet.js line 118, W26's month totals, `Amt(..., { size: 18 })`). `measure` is wide enough that the
 * hidden copy used to measure the figure never wraps.
 */
const FIT = { floor: 18, step: 2, measure: 2000 } as const;
const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6, fill: 0.12 } as const;
/**
 * kit.js line 22: a 220 circle 60 past the right edge and 80 above the top, fading out by 70% of its radius. Its
 * colour and strength are the `--glow-money` token (the accent at 55%); the card's shadow is `--shadow-money`.
 */
const GLOW = { size: 220, right: -60, top: -80, fadeAt: 0.7 } as const;
/** How long Copy reads "Copied" before it reads "Copy" again (A8 does the same). Default (agent), owner may override. */
const COPIED_MS = 2000;

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
  const { gradients, colors, shadows } = useWawu();
  const ink = colors.textOnAccent;
  const ends = gradientEnds(gradients.surfaceMoney.angle);
  const glow = stopOf(colors.glowMoney);
  return (
    <View testID="wallet-balance-card" style={[styles.card, { boxShadow: shadows.money }]}>
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
              <Stop offset="0" stopColor={glow.color} stopOpacity={glow.opacity} />
              <Stop offset={GLOW.fadeAt} stopColor={glow.color} stopOpacity={0} />
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
      <FittedBalance availableKobo={availableKobo} hidden={hidden} />
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

/**
 * The figure at the largest size that shows all of it, kobo included, on one line: a hidden copy at the
 * design's size gives its natural width, the row gives the width there is, and `fitFigureSize` picks the
 * size. A figure is painted only once the hidden copy has measured that same figure (its text and whether
 * it is hidden): a new balance, or Show after Hide, stays invisible until then, so no frame ever paints a
 * figure cut at the size of the one before (round 2, D5). The hidden copy is remounted for each figure, so
 * its layout is always reported, even when the new figure is as wide as the old.
 */
function FittedBalance({ availableKobo, hidden }: { availableKobo: number; hidden: boolean }) {
  const figure = hidden ? 'hidden' : String(availableKobo);
  const [natural, setNatural] = useState<{ figure: string; width: number }>({ figure: '', width: 0 });
  const [room, setRoom] = useState(0);
  const width = natural.figure === figure ? natural.width : 0;
  const size = fitFigureSize(width, room, ACCT.figure, FIT.floor, FIT.step);
  const measured = width > 0 && room > 0;
  return (
    <View style={styles.figure} onLayout={(e) => setRoom(e.nativeEvent.layout.width)}>
      <View
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.measureClip}
      >
        <View style={styles.measureBox}>
          <View key={figure} onLayout={(e) => setNatural({ figure, width: e.nativeEvent.layout.width })}>
            <Money minorUnits={availableKobo} size={ACCT.figure} tone="textOnAccent" masked={hidden} />
          </View>
        </View>
      </View>
      <View testID="wallet-balance-fit" style={measured ? null : styles.unmeasured}>
        <Money testID="wallet-balance" minorUnits={availableKobo} size={size} tone="textOnAccent" masked={hidden} />
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
  figure: { marginTop: ACCT.figureTop, alignSelf: 'stretch' },
  /** A box of no size that hides what it holds: the measuring copy lays out at full width without widening the page. */
  measureClip: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden' },
  measureBox: { width: FIT.measure, flexDirection: 'row', alignItems: 'flex-start', opacity: 0 },
  unmeasured: { opacity: 0 },
  foot: { marginTop: ACCT.footTop, paddingTop: ACCT.footPadTop, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  line: { position: 'absolute', top: 0, left: 0, right: 0, height: ACCT.line, opacity: ACCT.lineOpacity },
  account: { flex: 1, minWidth: 0 },
  bank: { fontSize: ACCT.bankSize, lineHeight: canvasNormalLineHeight(ACCT.bankSize), opacity: ACCT.bankOpacity },
  number: { fontSize: ACCT.numberSize, lineHeight: canvasNormalLineHeight(ACCT.numberSize), letterSpacing: ACCT.numberTracking * ACCT.numberSize, marginTop: ACCT.numberTop },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyFill: { borderRadius: radius.chip },
  copyLabel: { fontSize: COPY.label, lineHeight: canvasNormalLineHeight(COPY.label) },
});
