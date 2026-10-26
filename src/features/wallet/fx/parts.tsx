import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text as NativeText, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type TextStyle } from 'react-native';

import { CurrencyFlag } from '@/components/CurrencyFlag';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
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

export type WalletTabsProps = {
  tabs: readonly WalletTab[];
  value: string;
  onChange: (key: string) => void;
  /** The last item, a plain "+ Add" that opens the add-a-currency choice. Left out, there is nothing to add and none is drawn (R-47). */
  onAdd?: () => void;
};

/**
 * Up to four tabs and nothing to add are the board's own track. More than that, or a "+ Add" at the end, is the same track scrolled
 * sideways: it fades out at the edge while more is hidden past it, and the tab in front is brought into view (FX-POLISH P1).
 */
export function WalletTabs({ tabs, value, onChange, onAdd }: WalletTabsProps) {
  if (tabs.length <= 4 && !onAdd) {
    return <SegmentedTabs testID="wallet-tabs" label="Accounts" items={tabs.map((t) => ({ value: t.key, label: t.label }))} value={value} onChange={onChange} />;
  }
  return <ScrollTabs tabs={tabs} value={value} onChange={onChange} onAdd={onAdd} />;
}

/** How far from the end the strip must be before the fade is gone, and how much of the tab before it is left showing when one is brought into view. */
const FADE_WIDTH = 36;
const END_SLACK = 4;
const REVEAL_LEAD = 24;

function ScrollTabs({ tabs, value, onChange, onAdd }: WalletTabsProps) {
  const { colors } = useWawu();
  const scroller = useRef<ScrollView>(null);
  const spots = useRef<Record<string, { x: number; width: number }>>({});
  const [view, setView] = useState({ width: 0, content: 0, x: 0 });
  const hiddenRight = view.content - view.width - view.x > END_SLACK;
  const hiddenLeft = view.x > END_SLACK;

  // What the layout callbacks need to know, read when they fire (a tab's own layout can arrive after the render that chose it).
  const latest = useRef({ value, view });
  useLayoutEffect(() => {
    latest.current = { value, view };
  });

  const reveal = (key: string) => {
    const spot = spots.current[key];
    const now = latest.current.view;
    if (!spot || now.width === 0) return;
    if (spot.x < now.x || spot.x + spot.width > now.x + now.width) scroller.current?.scrollTo({ x: Math.max(0, spot.x - REVEAL_LEAD), animated: true });
  };
  useEffect(() => {
    reveal(value);
    // The tab in front is brought into view when it changes or the strip is first measured, never while the person is scrolling it.
  }, [value, view.width, view.content]);

  // A tab that is new (the one just added from "+ Add") has no place when it is chosen, and its layout can arrive after the strip's
  // own size did: so its arrival is the moment to bring it into view when it is the one in front (SWEEP-1026 row 5).
  const note = (key: string) => (e: LayoutChangeEvent) => {
    const before = spots.current[key];
    spots.current[key] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
    if (key === latest.current.value && (!before || before.x !== e.nativeEvent.layout.x || before.width !== e.nativeEvent.layout.width)) reveal(key);
  };
  return (
    <View testID="wallet-tabs" accessibilityRole="tablist" accessibilityLabel="Accounts" style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
      <ScrollView
        testID="wallet-tabs-scroll"
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trackRow}
        scrollEventThrottle={16}
        onLayout={(e) => setView((v) => ({ ...v, width: e.nativeEvent.layout.width }))}
        onContentSizeChange={(width) => setView((v) => ({ ...v, content: width }))}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setView((v) => ({ ...v, x: e.nativeEvent.contentOffset.x }))}
      >
        {tabs.map((tab) => (
          <ScrollTab key={tab.key} tab={tab} selected={tab.key === value} onPress={() => onChange(tab.key)} onLayout={note(tab.key)} />
        ))}
        {onAdd ? <AddTab onPress={onAdd} /> : null}
      </ScrollView>
      {hiddenLeft ? <Fade side="left" color={colors.surfaceSunken} testID="wallet-tabs-fade-left" /> : null}
      {hiddenRight ? <Fade side="right" color={colors.surfaceSunken} testID="wallet-tabs-fade-right" /> : null}
    </View>
  );
}

/** The track's own colour fading out over the tabs at an edge: more is past it. The colour is the token's, with its alpha taken to nothing. */
function Fade({ side, color, testID }: { side: 'left' | 'right'; color: string; testID: string }) {
  const clear = `${color}00`;
  return (
    <LinearGradient
      testID={testID}
      pointerEvents="none"
      colors={side === 'right' ? [clear, color] : [color, clear]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.fade, side === 'right' ? styles.fadeRight : styles.fadeLeft]}
    />
  );
}

function ScrollTab({ tab, selected, onPress, onLayout }: { tab: WalletTab; selected: boolean; onPress: () => void; onLayout: (e: LayoutChangeEvent) => void }) {
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
      onLayout={onLayout}
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

/** The last item of the strip: not a tab, so it is never selected and has no raised pill. */
function AddTab({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="wallet-tab-add"
      accessibilityRole="button"
      accessibilityLabel="Add a currency"
      onPress={onPress}
      {...ring.handlers}
      style={[styles.tab, styles.add, ring.style]}
    >
      <Icon name="Plus" size={segmentMetrics.font + 2} color={colors.accent} />
      <Text variant="body" numberOfLines={1} style={[font(600), styles.tabLabel, { color: colors.accent }]}>
        Add
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
  track: { padding: segmentMetrics.trackPad, borderRadius: radius.chip, alignSelf: 'stretch', overflow: 'hidden' },
  trackRow: { gap: segmentMetrics.between },
  tab: {
    height: segmentMetrics.height - 2 * segmentMetrics.trackPad,
    paddingHorizontal: space.lg,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: { flexDirection: 'row', gap: space.xs },
  fade: { position: 'absolute', top: 0, bottom: 0, width: FADE_WIDTH },
  fadeRight: { right: 0 },
  fadeLeft: { left: 0 },
  tabLabel: { fontSize: segmentMetrics.font },
  lift: { ...(StyleSheet.absoluteFill as object), borderRadius: radius.chip },
});
