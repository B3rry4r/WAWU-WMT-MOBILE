import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { ACCT, BalanceEye, MoneyGround } from '@/features/wallet/home/BalanceCard';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { formatMinor, type QuoteCode } from './amount';
import { FxAmount, figureSize } from './parts';

const COPY = { height: 32, padX: 12, icon: 14, label: 13, iconGap: 6, fill: 0.12 } as const;
const COPIED_MS = 2000;

export type FxBalanceCardProps = {
  /** "Dollar balance". */
  label: string;
  /** The provider's balance; null when the provider could not be asked. Never a 0 the Hub did not say. */
  availableMinor: number | null;
  code: QuoteCode;
  decimals: number;
  hidden: boolean;
  onToggleHidden: () => void;
  /** "USD account · Lead Bank": what the account is and who issued it, from the Hub. */
  line: string;
  /** The line under it, already masked ("•••• 4410"), or null while the details are not issued. */
  maskedNumber: string | null;
  /** What Copy puts on the clipboard: the number as the Hub sent it. */
  copyValue: string | null;
  /** The words under the figure when the balance could not be read, with its retry. */
  onRetry?: () => void;
  testID?: string;
};

/** W2's balance card for any currency account: the card of W1 (same ground, glow, eye and Copy) holding that account's own figure and line. */
export function FxBalanceCard(props: FxBalanceCardProps) {
  const { colors, shadows } = useWawu();
  const { availableMinor, code, decimals, hidden } = props;
  const text = availableMinor === null ? '' : formatMinor(availableMinor, code, decimals);
  return (
    <View testID={props.testID ?? 'fx-balance-card'} style={[styles.card, { boxShadow: shadows.money }]}>
      <MoneyGround corner={ACCT.radius} glowId={`fx-glow-${code}`} />
      <View style={styles.head}>
        <Text variant="body" tone="textOnAccent" style={styles.label}>
          {props.label}
        </Text>
        <BalanceEye hidden={hidden} onPress={props.onToggleHidden} testID="fx-balance-eye" />
      </View>
      <View style={styles.figure}>
        {availableMinor === null ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Try reading the balance again" onPress={props.onRetry} testID="fx-balance-retry">
            <Text variant="body" tone="textOnAccent" style={[font(600), styles.unread]}>
              We couldn’t read this balance. Tap to try again.
            </Text>
          </Pressable>
        ) : (
          <FxAmount testID="fx-balance" minor={availableMinor} code={code} decimals={decimals} size={figureSize(text, ACCT.figure)} tone="textOnAccent" masked={hidden} weight={700} />
        )}
      </View>
      <View style={styles.foot}>
        <View style={[styles.line, { backgroundColor: colors.textOnAccent }]} />
        <View style={styles.account}>
          <Text variant="body" tone="textOnAccent" numberOfLines={1} style={styles.bank} testID="fx-account-line">
            {props.line}
          </Text>
          {props.maskedNumber ? (
            <Text variant="body" tone="textOnAccent" numberOfLines={1} style={[font(600), styles.number]} testID="fx-account-number">
              {props.maskedNumber}
            </Text>
          ) : (
            <Text variant="body" tone="textOnAccent" numberOfLines={1} style={[styles.bank, styles.pending]} testID="fx-account-pending">
              Account details are on their way
            </Text>
          )}
        </View>
        {props.copyValue ? <CopyPill value={props.copyValue} /> : null}
      </View>
    </View>
  );
}

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
    <Pressable testID="fx-copy" accessibilityRole="button" accessibilityLabel={copied ? 'Copied' : 'Copy account number'} onPress={() => void copy()} hitSlop={space.sm} style={styles.copy}>
      {({ pressed }) => (
        <>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.copyFill, { backgroundColor: colors.textOnAccent, opacity: pressed ? 2 * COPY.fill : COPY.fill }]} />
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
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: ACCT.labelSize, lineHeight: canvasNormalLineHeight(ACCT.labelSize), opacity: ACCT.labelOpacity },
  figure: { marginTop: ACCT.figureTop, alignSelf: 'stretch', minHeight: ACCT.figure },
  unread: { fontSize: 16, lineHeight: 22, opacity: 0.85 },
  foot: { marginTop: ACCT.footTop, paddingTop: ACCT.footPadTop, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  line: { position: 'absolute', top: 0, left: 0, right: 0, height: ACCT.line, opacity: ACCT.lineOpacity },
  account: { flex: 1, minWidth: 0 },
  bank: { fontSize: ACCT.bankSize, lineHeight: canvasNormalLineHeight(ACCT.bankSize), opacity: ACCT.bankOpacity },
  pending: { marginTop: ACCT.numberTop },
  number: { fontSize: ACCT.numberSize, lineHeight: canvasNormalLineHeight(ACCT.numberSize), letterSpacing: ACCT.numberTracking * ACCT.numberSize, marginTop: ACCT.numberTop },
  copy: { height: COPY.height, paddingHorizontal: COPY.padX, borderRadius: radius.chip, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: COPY.iconGap, flexShrink: 0 },
  copyFill: { borderRadius: radius.chip },
  copyLabel: { fontSize: COPY.label, lineHeight: canvasNormalLineHeight(COPY.label) },
});
