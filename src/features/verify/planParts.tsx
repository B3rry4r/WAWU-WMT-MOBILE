import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { BANK_CHARGE, WAWU_FEE } from '@/features/money-attempt/refusal';
import { copyText } from '@/features/open-wallet/copy';
import { font, radius, space, useWawu, type ColorToken } from '@/theme';

import type { PurchaseQuote, PurchaseTransfer } from './purchaseApi';
import { TIER_WORDS } from './purchaseModel';

const RADIO = { size: 22, dot: 10 } as const;
const ROW_VALUE = 14.5;
/** The offer's square (kit `check`) and the Copy chip (kit.js `copyBtn`: 32 high, 12 at the sides, 6 between the glyph and the word). */
const CHECK = { box: 22, corner: 6 } as const;
const COPY = { height: 32, padH: 12, glyphToWord: 6, corner: 16 } as const;
/** A way to pay is a card of its own (VF6): a 2 px accent ring on the chosen one, a 1 px hairline on the other, as the pack rows draw it (PT4). */
const METHOD = { ringOn: 2, ringOff: 1 } as const;

/**
 * The fee as its parts then the total (BRIEF rules 3 and 4): the price, the Bank charge, WAWU's fee and the Total, each from the purchase's
 * quote, every part drawn even at ₦0, and "No fee" never. The tier checkout (VF6) and the five-more-products sheet (VF13) both draw it;
 * `prefix` names the rows' test ids (`<prefix>-fees`, `-price`, `-bank-charge`, `-wawu-fee`, `-total`).
 */
export function QuoteBreakdown({ quote, prefix }: { quote: Pick<PurchaseQuote, 'priceKobo' | 'providerFeeKobo' | 'wawuFeeKobo' | 'totalKobo'>; prefix: string }) {
  const money = (kobo: number, weight?: 700) => <Money minorUnits={kobo} size={ROW_VALUE} weight={weight} decimals={kobo % 100 !== 0} />;
  return (
    <GroupedList testID={`${prefix}-fees`}>
      <KeyValueRow testID={`${prefix}-price`} label={TIER_WORDS.price} value={money(quote.priceKobo)} />
      <KeyValueRow testID={`${prefix}-bank-charge`} label={BANK_CHARGE} value={money(quote.providerFeeKobo)} />
      <KeyValueRow testID={`${prefix}-wawu-fee`} label={WAWU_FEE} value={money(quote.wawuFeeKobo)} />
      <KeyValueRow testID={`${prefix}-total`} label={TIER_WORDS.total} value={money(quote.totalKobo, 700)} />
    </GroupedList>
  );
}

/** The round choice mark of the tier cards, the payment methods and the offer (kit `radio`): the accent when on, a strong edge when off. */
export function Radio({ on }: { on: boolean }) {
  const { colors } = useWawu();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.radio, { borderColor: on ? colors.accent : colors.borderStrong, backgroundColor: on ? colors.accent : 'transparent' }]}
    >
      {on ? <View style={[styles.dot, { backgroundColor: colors.textOnAccent }]} /> : null}
    </View>
  );
}

/** One way to pay (VF6): the wallet or a bank transfer, each its own card; the chosen one has the accent ring and tint. */
export function MethodRow({ testID, icon, tone, title, subtitle, on, disabled, onPress }: { testID: string; icon: 'Wallet' | 'Landmark'; tone: 'accent' | 'neutral'; title: string; subtitle?: string; on: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.method,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? METHOD.ringOn : METHOD.ringOff, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <IconTile icon={icon} tone={tone} size={44} />
      <View style={styles.methodWords}>
        <Text variant="body" style={font(600)}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" tone="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Radio on={on} />
    </Pressable>
  );
}

/** The offer's tick (VF6): a square the accent fills when on, with its words beside it. */
export function CheckRow({ testID, label, on, disabled, onPress }: { testID: string; label: string; on: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on, disabled }}
      // The web export drops `accessibilityState.checked` from the DOM: a screen reader there needs `aria-checked` (SWEEP-APP-3 row 159).
      aria-checked={on}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.check, ring.style]}
    >
      <View style={[styles.box, { borderColor: on ? colors.accent : colors.borderStrong, backgroundColor: on ? colors.accent : 'transparent' }]}>
        {on ? <Icon name="Check" size={14} color={colors.textOnAccent} strokeWidth={3} /> : null}
      </View>
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

/** How long the button says "Copied" before it reads "Copy" again. Default (agent), owner may override. */
const COPIED_MS = 2000;

/** VF6b's Copy: the value onto the phone's clipboard; it reads "Copied" for a moment after, and only when the phone took it. */
export function CopyChip({ value, label, testID }: { value: string; label: string; testID?: string }) {
  const { colors } = useWawu();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const press = () => {
    void copyText(value).then((ok) => {
      if (!ok) return;
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    });
  };
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={copied ? 'Copied' : `Copy ${label}`} onPress={press} style={[styles.copy, { backgroundColor: colors.surfaceSunken }]}>
      <Icon name={copied ? 'Check' : 'Copy'} size={14} color={colors.textPrimary} />
      <Text variant="meta" style={font(600)}>
        {copied ? 'Copied' : 'Copy'}
      </Text>
    </Pressable>
  );
}

/**
 * VF6b's card: the wallet's own account to send to, from the Hub's purchase (`awaiting_transfer`): what to send, where, and whose
 * account it is. The purchase is paid from the wallet the moment the money lands. The board's Reference line is not drawn: the
 * Hub serves none (BACKEND_GAPS G-ME-12-1).
 */
export function TransferCard({ transfer }: { transfer: PurchaseTransfer }) {
  // A wallet that was short when the person chose Transfer may have been topped up since: the Hub then needs 0 from the transfer, and
  // "Send exactly ₦0.00" reads as a fault, so that case shows the whole total.
  const send = transfer.amountNeededKobo !== null && transfer.amountNeededKobo > 0 ? transfer.amountNeededKobo : transfer.totalKobo;
  return (
    <View testID="checkout-transfer" style={styles.transfer}>
      <GroupedList>
        <KeyValueRow testID="transfer-amount" label="Send exactly" value={<Money minorUnits={send} size={14.5} weight={700} />} />
        <KeyValueRow
          testID="transfer-number"
          label="Account number"
          value={
            <View style={styles.valueWithCopy}>
              <Text variant="body" style={font(700)}>
                {transfer.accountNumber}
              </Text>
              <CopyChip value={transfer.accountNumber} label="account number" testID="transfer-copy" />
            </View>
          }
        />
        <KeyValueRow testID="transfer-bank" label="Bank" value={transfer.bankName} />
        <KeyValueRow testID="transfer-name" label="Account name" value={transfer.accountName} />
      </GroupedList>
    </View>
  );
}

/** The pieces of VF7's confetti: where each starts (a share of the width and of the height), its turn, size and the token it is coloured by. */
const PIECES: readonly { x: number; y: number; turn: number; w: number; h: number; colour: ColorToken }[] = [
  { x: 0.04, y: 0.02, turn: 20, w: 8, h: 18, colour: 'accentFg' },
  { x: 0.12, y: 0.1, turn: -35, w: 9, h: 20, colour: 'accentFg' },
  { x: 0.2, y: 0.2, turn: 50, w: 12, h: 12, colour: 'warning' },
  { x: 0.32, y: 0.16, turn: -20, w: 8, h: 18, colour: 'positive' },
  { x: 0.44, y: 0.04, turn: 30, w: 9, h: 22, colour: 'accentFg' },
  { x: 0.56, y: 0.12, turn: -40, w: 12, h: 12, colour: 'info' },
  { x: 0.68, y: 0.22, turn: 60, w: 8, h: 18, colour: 'warning' },
  { x: 0.8, y: 0.05, turn: -25, w: 9, h: 20, colour: 'accentFg' },
  { x: 0.9, y: 0.18, turn: 45, w: 12, h: 12, colour: 'info' },
  { x: 0.94, y: 0.32, turn: -50, w: 8, h: 18, colour: 'positive' },
  { x: 0.08, y: 0.34, turn: 40, w: 12, h: 12, colour: 'positive' },
  { x: 0.72, y: 0.38, turn: 15, w: 9, h: 20, colour: 'accentFg' },
];

/** How long the pieces take to settle, once. Default (agent), owner may override. */
const FALL_MS = 1400;
/** A piece's corner: the board's pieces are cut square with a hairline round. */
const PIECE_CORNER = 2;

/**
 * VF7's confetti: pieces that drift into place once, then stay. A person who asked the phone for less motion sees them already in
 * place. The colours are tokens (SHARED-CHANGES ME-12 #1 asks for the board's own amber and blue).
 */
export function Confetti() {
  const { colors } = useWawu();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let live = true;
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.()).then((reduce) => {
      if (!live) return;
      if (reduce) progress.setValue(1);
      else Animated.timing(progress, { toValue: 1, duration: FALL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
    return () => {
      live = false;
    };
  }, [progress]);
  return (
    <View testID="official-confetti" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {PIECES.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: p.w,
            height: p.h,
            borderRadius: PIECE_CORNER,
            backgroundColor: colors[p.colour],
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }, { rotate: `${p.turn}deg` }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  radio: { width: RADIO.size, height: RADIO.size, borderRadius: RADIO.size / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: RADIO.dot, height: RADIO.dot, borderRadius: RADIO.dot / 2 },
  method: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radius.card },
  methodWords: { flex: 1 },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
  box: { width: CHECK.box, height: CHECK.box, borderRadius: CHECK.corner, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  copy: { flexDirection: 'row', alignItems: 'center', gap: COPY.glyphToWord, height: COPY.height, paddingHorizontal: COPY.padH, borderRadius: COPY.corner },
  transfer: { gap: space.sm },
  valueWithCopy: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
