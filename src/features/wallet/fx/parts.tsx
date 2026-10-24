import { Pressable, ScrollView, StyleSheet, Text as NativeText, View, type StyleProp, type TextStyle } from 'react-native';

import { CurrencyFlag } from '@/components/CurrencyFlag';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { rowMetrics } from '@/components/ListRow';
import { SegmentedTabs, segmentMetrics } from '@/components/SegmentedTabs';
import { Text } from '@/components/Text';
import { clockTime, rowTime } from '@/features/wallet/history/lagosTime';
import { font, radius, space, type, useWawu, type ColorToken } from '@/theme';

import { formatMinor, holdClock, isCoin, rateLine, signOf, splitMinor, spokenMinor, SHORT_NAME, type QuoteCode } from './amount';
import type { FxTransaction } from './api';

/** The platform font draws the signs Alan Sans does not have (₦ ₮ € £ ₵), as `Money` does for the naira sign (D15). */
const platformFont = 'System';
const inAlanSans = ['$'];
/** Money's own figures: the minor part at 72% and half strength, tracked -0.025em (design/_gen/kit.js `Amt`). */
const MINOR_SCALE = 0.72;
const MINOR_OPACITY = 0.5;
const TRACKING = -0.025;
const MASK = '•'.repeat(6);

export type FxAmountProps = {
  minor: number;
  code: QuoteCode;
  decimals: number;
  size?: number;
  weight?: 400 | 500 | 600 | 700 | 800;
  /** + on a credit (in green) and the minus sign on a debit. */
  signed?: boolean;
  /** Drop the places, as on an amount being typed. */
  places?: boolean;
  masked?: boolean;
  tone?: ColorToken;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * A figure in any currency the Hub serves, drawn as `Money` draws naira and dollars: tabular figures, the places smaller and fainter.
 * `Money` takes naira and dollars at two places only; these accounts have their own `decimals` (a stablecoin's are the Hub's to say), so
 * this component takes the places as a prop and never assumes two. A stablecoin is its figure and its code after it ("320.00 USDT").
 */
export function FxAmount({ minor, code, decimals, size = type.size.h3, weight = 600, signed, places = true, masked, tone, style, testID }: FxAmountProps) {
  const { colors } = useWawu();
  const color = colors[tone ?? (signed && minor > 0 ? 'positive' : 'textPrimary')];
  const base: TextStyle = {
    ...font(weight),
    fontSize: size,
    letterSpacing: TRACKING * size,
    lineHeight: size,
    fontVariant: ['tabular-nums', 'lining-nums'],
    color,
  };
  const sign = signOf(code);
  const signFace: TextStyle | null = sign && !inAlanSans.includes(sign) ? { fontFamily: platformFont, fontWeight: String(weight) as TextStyle['fontWeight'] } : null;
  const p = splitMinor(minor, decimals);
  const lead = p.negative ? '−' : signed && minor > 0 ? '+' : '';
  const dim: TextStyle = { fontSize: size * MINOR_SCALE, opacity: MINOR_OPACITY };
  if (masked) {
    return (
      <NativeText testID={testID} accessibilityLabel="Balance hidden" style={[base, style]}>
        <NativeText style={signFace}>{sign}</NativeText>
        {MASK}
      </NativeText>
    );
  }
  return (
    <NativeText testID={testID} accessibilityLabel={spokenMinor(minor, code, decimals)} numberOfLines={1} style={[base, style]}>
      {lead}
      <NativeText style={signFace}>{sign}</NativeText>
      {p.whole}
      {places && p.fraction ? <NativeText style={dim}>.{p.fraction}</NativeText> : null}
      {isCoin(code) ? <NativeText style={dim}> {code}</NativeText> : null}
    </NativeText>
  );
}

/** The coin for a currency: the shared flags for naira, dollar and Tether, and the same round coin with its own sign for the rest. */
const COIN: Partial<Record<QuoteCode, { sign: string; bg: ColorToken }>> = {
  EUR: { sign: '€', bg: 'curUsd' },
  GBP: { sign: '£', bg: 'curUsd' },
  CAD: { sign: '$', bg: 'curUsd' },
  AED: { sign: 'د.إ', bg: 'curUsd' },
  GHS: { sign: '₵', bg: 'curUsd' },
  USDC: { sign: '$', bg: 'curUsd' },
  RLUSD: { sign: 'R', bg: 'curUsd' },
};

export function FxFlag({ currency, size = 36, testID }: { currency: QuoteCode; size?: number; testID?: string }) {
  const { colors } = useWawu();
  if (currency === 'NGN' || currency === 'USD' || currency === 'USDT') return <CurrencyFlag currency={currency} size={size} testID={testID} />;
  const coin = COIN[currency] ?? { sign: '$', bg: 'curUsd' as ColorToken };
  const face = coin.sign === '$' ? font(700) : { fontFamily: platformFont, fontWeight: '700' as const };
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={SHORT_NAME[currency]}
      style={[styles.coin, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[coin.bg] }]}
    >
      <NativeText style={[face, { fontSize: size * (coin.sign.length > 1 ? 0.3 : 0.46), color: colors.textOnAccent }]}>{coin.sign}</NativeText>
    </View>
  );
}

/** The figure's size: the board's 42, stepping down 2 for each character past nine, never below 18 (a balance is never cut off). */
export function figureSize(text: string, base = 42): number {
  return Math.max(18, base - Math.max(0, text.length - 9) * 2);
}

export type FxRowData = {
  id: string;
  title: string;
  subtitle: string;
  minor: number;
  code: QuoteCode;
  decimals: number;
  meta: string;
  icon: 'ArrowDownLeft' | 'ArrowUpRight' | 'ArrowLeftRight';
  tone: 'in' | 'neutral';
  failed: boolean;
};

/** One line of an account's statement, as W2 and W3 draw it: who or what, a line under it, the signed amount and the time. */
export function fxRowOf(t: FxTransaction, decimalsOf: (code: QuoteCode) => number, now: Date): FxRowData {
  const outgoing = t.direction === 'out';
  const conv = t.conversion;
  const code = t.currency as QuoteCode;
  const decimals = decimalsOf(code);
  const stateWord = t.status === 'pending' ? 'Pending' : t.status === 'failed' ? 'Failed' : t.status === 'reversed' ? 'Reversed' : '';
  const when = rowTime(t.occurredAt, now) || clockTime(t.occurredAt);
  let title = t.counterpartyName?.trim() || t.description.trim() || (outgoing ? 'Sent' : 'Received');
  let subtitle = t.counterpartyName?.trim() ? t.description.trim() : '';
  if (conv) {
    const from = conv.fromCurrency as QuoteCode;
    const to = conv.toCurrency as QuoteCode;
    title = outgoing ? `Swap to ${SHORT_NAME[to]}` : `Swap from ${SHORT_NAME[from]}`;
    subtitle =
      rateLine({ fromCurrency: from, toCurrency: to, fromDecimals: decimalsOf(from), toDecimals: decimalsOf(to), rate: conv.rate }) ?? '';
  }
  return {
    id: t.id,
    title,
    subtitle,
    minor: outgoing ? -t.amountMinor : t.amountMinor,
    code,
    decimals,
    meta: stateWord ? `${stateWord} · ${when}` : when,
    icon: conv ? 'ArrowLeftRight' : outgoing ? 'ArrowUpRight' : 'ArrowDownLeft',
    tone: !outgoing && !conv ? 'in' : 'neutral',
    failed: t.status === 'failed' || t.status === 'reversed',
  };
}

const AMOUNT = 15.5;
const META_GAP = 5;
const META = 12.5;

export function FxTxRow({ row, testID }: { row: FxRowData; testID?: string }) {
  const label = [row.title, row.subtitle, formatMinor(row.minor, row.code, row.decimals, { sign: true }), row.meta].filter(Boolean).join(', ');
  return (
    <View testID={testID} accessible accessibilityLabel={label} style={styles.row}>
      <IconTile icon={row.icon} tone={row.tone} size={44} />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.rowTitle]}>
          {row.title}
        </Text>
        {row.subtitle ? (
          <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.rowSub}>
            {row.subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.end}>
        <FxAmount minor={row.minor} code={row.code} decimals={row.decimals} signed size={AMOUNT} tone={row.failed ? 'textMuted' : undefined} />
        <Text variant="caption" style={{ fontSize: META }}>
          {row.meta}
        </Text>
      </View>
    </View>
  );
}

/** "Holds 0:28": the seconds left of the provider's own hold, in the warning tone as the board draws it. */
export function HoldPill({ left }: { left: number }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.hold, { backgroundColor: colors.warningTint }]} accessible accessibilityLabel={`Rate held for ${holdClock(left)}`} testID="swap-hold">
      <Text variant="body" style={[font(700), styles.holdLabel, { color: colors.warning }]}>
        Holds {holdClock(left)}
      </Text>
    </View>
  );
}

export type WalletTab = { key: string; label: string };

/** Up to four tabs are the board's own track; more than that (one per currency) is the same track, scrolled sideways. */
export function WalletTabs({ tabs, value, onChange }: { tabs: readonly WalletTab[]; value: string; onChange: (key: string) => void }) {
  if (tabs.length <= 4) {
    return <SegmentedTabs testID="wallet-tabs" label="Accounts" items={tabs.map((t) => ({ value: t.key, label: t.label }))} value={value} onChange={onChange} />;
  }
  return <ScrollTabs tabs={tabs} value={value} onChange={onChange} />;
}

function ScrollTabs({ tabs, value, onChange }: { tabs: readonly WalletTab[]; value: string; onChange: (key: string) => void }) {
  const { colors } = useWawu();
  return (
    <View testID="wallet-tabs" accessibilityRole="tablist" accessibilityLabel="Accounts" style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackRow}>
        {tabs.map((tab) => (
          <ScrollTab key={tab.key} tab={tab} selected={tab.key === value} onPress={() => onChange(tab.key)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ScrollTab({ tab, selected, onPress }: { tab: WalletTab; selected: boolean; onPress: () => void }) {
  const { colors, shadows } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`wallet-tab-${tab.key}`}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
      aria-selected={selected}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.tab,
        { backgroundColor: selected ? colors.surfaceCard : 'transparent', borderColor: selected ? colors.borderHairline : 'transparent', borderWidth: StyleSheet.hairlineWidth },
        ring.style,
      ]}
    >
      {selected ? <View pointerEvents="none" style={[styles.lift, { boxShadow: shadows.lift }]} /> : null}
      <Text variant="body" tone={selected ? 'textPrimary' : 'textSecondary'} numberOfLines={1} style={[font(600), styles.tabLabel]}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  coin: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  hold: { height: 34, borderRadius: radius.chip, paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center' },
  holdLabel: { fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  words: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: rowMetrics.title, letterSpacing: rowMetrics.titleTracking * rowMetrics.title },
  rowSub: { fontSize: rowMetrics.subtitle, marginTop: rowMetrics.subtitleGap },
  end: { alignItems: 'flex-end', gap: META_GAP },
  track: { padding: segmentMetrics.trackPad, borderRadius: radius.chip, alignSelf: 'stretch' },
  trackRow: { gap: segmentMetrics.between },
  tab: {
    height: segmentMetrics.height - 2 * segmentMetrics.trackPad,
    paddingHorizontal: space.xl,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: segmentMetrics.font },
  lift: { ...(StyleSheet.absoluteFill as object), borderRadius: radius.chip },
});
