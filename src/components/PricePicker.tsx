import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { listOf, storePriceOf, usePrices } from '@/features/prices/api';
import { OFF_LIST_LINE, earnOf, isOnList, popularOf, stepOf, stopOf } from '@/features/prices/model';
import { font, layout, radius, space, useWawu, type ColorToken } from '@/theme';

import { useFocusRing } from './focusRing';
import { Icon } from './icon';
import { Money } from './Money';
import { Skeleton } from './Skeleton';
import { ErrorState } from './StateViews';
import { Text } from './Text';

/**
 * The approved picker (store-plan/price-picker.html, owner, 27 Oct 2026): a 52 price, "You earn" in the success colour, a strip of 76 wide
 * list prices 8 apart that snaps the chosen one to the middle (accent ring, a tick, fading edges), four popular shortcuts, a store note.
 */
const metrics = {
  big: 52,
  earn: 13.5,
  earnPadV: 6,
  earnPadH: 12,
  stop: 76,
  stopGap: 8,
  stopPadV: 9,
  stopRadius: 14,
  stopFont: 13.5,
  stopLift: 1.08,
  tick: { width: 2, height: 10, heightOn: 16 },
  notch: 6,
  fade: 0.22,
  quickFont: 12.5,
  quickPadV: 6,
  quickPadH: 12,
  noteRadius: 14,
  notePadV: 11,
  notePadH: 13,
  noteFont: 12.5,
  noteTile: 28,
  strip: 70,
} as const;

/** How long the strip rests before the price it stopped on is taken (the design's 60 ms). */
export const SETTLE_MS = 60;
/** How long the scroll events of a scroll the picker made itself are set aside: they are never a choice. A drag or touch lifts it at once. */
export const DRIVEN_MS = 900;

const KOBO = 100;
const stepWidth = metrics.stop + metrics.stopGap;

/** The page colour with no opacity (`#RRGGBB` and `00`): the colour a fade ends in, so a gradient to it keeps the hue (to plain "transparent" it greys on a phone). */
const clear = (color: string): string => (/^#[0-9a-f]{6}$/i.test(color) ? `${color}00` : color);

const offsetOf = (event: NativeSyntheticEvent<NativeScrollEvent>): number => event.nativeEvent.contentOffset.x;

export type PricePickerProps = {
  /** The price now, in whole naira. Null when none is chosen yet: the strip waits at its start with nothing selected and no price claimed (WALK-FIX M8). */
  value: number | null;
  /** The chosen list price, in whole naira. Called only for a person's own tap, scroll or shortcut (or a screen reader's adjust), never by the picker itself. */
  onChange: (naira: number) => void;
  /** The small caps line over the price: "Your price", "Price per question". */
  label: string;
  /** What follows "You earn ₦X": "a sale", "when you answer". */
  earnSuffix: string;
  /** Draw the store note when the Hub gives a store price for the chosen price. Left on, it still draws nothing until the Hub serves one. */
  storeNote?: boolean;
  /** Locked: the price shows and nothing changes it. */
  disabled?: boolean;
  /** How far the strip reaches past its container on each side, so it runs to the screen's edges: the screen's side padding (the gutter), or a card's. */
  bleed?: number;
  /** The colour the strip's edges fade into: what the picker sits on. The page by default; a card's own colour inside a card. */
  fadeInto?: ColorToken;
  testID?: string;
};

function Stop({ naira, selected, disabled, onPress }: { naira: number; selected: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`price-stop-${naira}`}
      accessibilityRole="button"
      accessibilityLabel={`₦${naira.toLocaleString('en-NG')}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.stop, ring.style]}
    >
      <View
        style={[
          styles.pill,
          selected
            ? { backgroundColor: colors.accentTint, borderColor: colors.accent, transform: [{ scale: metrics.stopLift }] }
            : { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline },
        ]}
      >
        <Money minorUnits={naira * KOBO} size={metrics.stopFont} weight={700} decimals={false} tone={selected ? 'textPrimary' : 'textSecondary'} />
      </View>
      <View
        style={[
          styles.tick,
          { backgroundColor: selected ? colors.accent : colors.borderStrong, height: selected ? metrics.tick.heightOn : metrics.tick.height },
        ]}
      />
    </Pressable>
  );
}

function Shortcut({ naira, selected, disabled, onPress }: { naira: number; selected: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`price-popular-${naira}`}
      accessibilityRole="button"
      accessibilityLabel={`Popular price ₦${naira.toLocaleString('en-NG')}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.quick, { borderColor: selected ? colors.accent : colors.borderStrong }, ring.style]}
    >
      <Money minorUnits={naira * KOBO} size={metrics.quickFont} weight={700} decimals={false} tone={selected ? 'accentFg' : 'textSecondary'} />
    </Pressable>
  );
}

/**
 * Every price a person sets in the app is picked here, from the Hub's list (`GET /prices`, R-101): the big price, what the creator keeps
 * of it (85%, R-5), the strip of list prices and the four popular ones. It returns the chosen list price in whole naira and never anything
 * else: the strip holds list prices only. A saved price that is off the list shows the nearest list price selected, with one line saying
 * to pick one; it is not sent unless the person picks (the screens send what `onChange` gave them). The store note ("Fans there pay ₦X")
 * is drawn only for a price the Hub gives a store price for.
 */
export function PricePicker({ value, onChange, label, earnSuffix, storeNote = true, disabled = false, bleed = layout.gutter, fadeInto = 'surfacePage', testID = 'price-picker' }: PricePickerProps) {
  const { colors } = useWawu();
  const prices = usePrices();
  const list = useMemo(() => listOf(prices.data), [prices.data]);
  const selected = stopOf(list, value);
  const offList = value !== null && list.length > 0 && !isOnList(list, value);
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placed = useRef<number | null>(null);

  // The strip follows the price: the first placement is at once, later ones glide. A scroll the picker makes itself is set aside (`ours`):
  // only a person's own scroll, tap or shortcut may choose a price, so an off-list price is not quietly replaced.
  const driven = useRef(false);
  const drivenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lift = useCallback(() => {
    driven.current = false;
    if (drivenTimer.current) clearTimeout(drivenTimer.current);
  }, []);
  const glideTo = useCallback(
    (x: number, animated: boolean) => {
      lift();
      driven.current = true;
      drivenTimer.current = setTimeout(() => void (driven.current = false), DRIVEN_MS);
      scroller.current?.scrollTo({ x, y: 0, animated });
    },
    [lift],
  );
  const at = selected === null ? -1 : list.indexOf(selected);
  useEffect(() => {
    // WALK-FIX M8: with no price chosen the strip stays at its start (the first price) and does not scroll itself to the design's stop,
    // which left the first chips (₦100 to ₦1,500) off the left edge on opening.
    if (value === null || at < 0 || width === 0 || placed.current === at) return;
    glideTo(at * stepWidth, placed.current !== null);
    placed.current = at;
  }, [value, at, width, glideTo]);
  // WALK-FIX M8: the first placement above runs before the strip has the padding that centres its first stop, and a phone clamps a scroll
  // to the content it has laid out, so a chosen price far along the strip opened at the start. Once the content is laid out at the measured
  // width, the chosen price is placed again, at once.
  const laidOut = useRef(false);
  const onContentSizeChange = () => {
    if (laidOut.current || width === 0) return;
    laidOut.current = true;
    if (value !== null && at >= 0) glideTo(at * stepWidth, false);
  };
  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
      if (drivenTimer.current) clearTimeout(drivenTimer.current);
    },
    [],
  );

  const choose = useCallback(
    (naira: number) => {
      if (disabled) return;
      placed.current = null;
      onChange(naira);
    },
    [disabled, onChange],
  );

  // The strip stopped: the price in the middle is the one chosen.
  const takeOffset = useCallback(
    (x: number) => {
      if (disabled || list.length === 0) return;
      const index = Math.min(list.length - 1, Math.max(0, Math.round(x / stepWidth)));
      const naira = list[index];
      if (naira === undefined) return;
      placed.current = index;
      if (naira !== value || offList) onChange(naira);
      // Land on the stop exactly (a drag that ended between two).
      if (Math.abs(x - index * stepWidth) > 1) glideTo(index * stepWidth, true);
    },
    [disabled, list, offList, onChange, value, glideTo],
  );
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (driven.current) return;
    const x = offsetOf(event);
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => takeOffset(x), SETTLE_MS);
  };
  const onEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (driven.current) return;
    if (settle.current) clearTimeout(settle.current);
    takeOffset(offsetOf(event));
  };

  if (prices.isPending) {
    return (
      <View testID={`${testID}-loading`} style={styles.loading} accessibilityLabel="Loading prices">
        <Skeleton height={metrics.big} radius={radius.input} />
        <Skeleton height={metrics.strip} radius={radius.input} />
      </View>
    );
  }
  if (list.length === 0 || selected === null) {
    return (
      <ErrorState
        testID={`${testID}-error`}
        title="Prices did not load"
        message="Check your connection and try again."
        icon="WifiOff"
        onRetry={() => void prices.refetch()}
      />
    );
  }

  // What is claimed: nothing before a price is chosen; the nearest list price (with the line) for one that is off the list.
  const shown = value === null ? null : offList ? selected : value;
  const store = storeNote ? storePriceOf(prices.data, shown) : null;
  const into = colors[fadeInto];
  const edge = clear(into);
  const spoken = shown === null ? 'No price chosen' : `₦${shown.toLocaleString('en-NG')}`;
  // Adjusting with no price chosen yet chooses the design's stop (`selected`), and the strip then moves to it; until a price is chosen the strip
  // waits at its start (WALK-FIX M8). Otherwise one list step.
  const bump = (direction: 1 | -1) => choose(shown === null ? selected : stepOf(list, shown, direction));

  return (
    <View testID={testID} style={styles.root}>
      <View style={styles.hero}>
        <Text variant="label" tone="textMuted" style={styles.label}>
          {label}
        </Text>
        <View testID={`${testID}-price`} accessibilityLiveRegion="polite" accessibilityLabel={`${label} ${spoken}`} style={styles.big}>
          {shown === null ? (
            <Text variant="h3" tone="textMuted" style={[font(700), styles.unpicked]}>
              Pick a price
            </Text>
          ) : (
            <Money minorUnits={shown * KOBO} size={metrics.big} weight={700} decimals={false} testID={`${testID}-big`} />
          )}
        </View>
        {shown === null ? null : (
          <View
            testID={`${testID}-earn`}
            accessible
            accessibilityLabel={`You earn ${earnOf(shown).toLocaleString('en-NG')} naira ${earnSuffix}`}
            style={[styles.earn, { backgroundColor: colors.successTint }]}
          >
            <Text variant="caption" tone="success" importantForAccessibility="no" style={[font(700), styles.earnText]}>
              You earn
            </Text>
            <Money minorUnits={earnOf(shown) * KOBO} size={metrics.earn} weight={700} decimals={false} tone="success" />
            <Text variant="caption" tone="success" importantForAccessibility="no" style={[font(700), styles.earnText]}>
              {earnSuffix}
            </Text>
          </View>
        )}
        {offList ? (
          <Text variant="caption" tone="textSecondary" testID={`${testID}-off-list`} accessibilityRole="alert" style={styles.offList}>
            {OFF_LIST_LINE}
          </Text>
        ) : null}
      </View>

      <View
        testID={`${testID}-strip`}
        style={[styles.strip, { marginHorizontal: -bleed }]}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        // One adjustable control for a screen reader (increment and decrement move one list step); the stops inside stay labelled buttons.
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: spoken }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => bump(event.nativeEvent.actionName === 'decrement' ? -1 : 1)}
      >
        <ScrollView
          ref={scroller}
          testID={`${testID}-scroll`}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!disabled}
          snapToInterval={stepWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          onContentSizeChange={onContentSizeChange}
          onScrollBeginDrag={lift}
          onTouchStart={lift}
          onMomentumScrollEnd={onEnd}
          onScrollEndDrag={onEnd}
          contentContainerStyle={[styles.row, { paddingHorizontal: Math.max(0, (width - metrics.stop) / 2) }]}
        >
          {list.map((naira) => (
            <Stop key={naira} naira={naira} selected={shown !== null && naira === selected} disabled={disabled} onPress={() => choose(naira)} />
          ))}
        </ScrollView>
        <LinearGradient pointerEvents="none" colors={[into, edge]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fade, styles.fadeLeft]} />
        <LinearGradient pointerEvents="none" colors={[edge, into]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fade, styles.fadeRight]} />
        <View pointerEvents="none" style={[styles.notch, { borderBottomColor: colors.accent }]} />
      </View>

      <View testID={`${testID}-popular`} style={styles.popular}>
        {popularOf(list).map((naira) => (
          <Shortcut key={naira} naira={naira} selected={!offList && naira === shown} disabled={disabled} onPress={() => choose(naira)} />
        ))}
      </View>

      {store !== null ? (
        <View testID={`${testID}-store`} style={[styles.note, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <View style={[styles.noteTile, { backgroundColor: colors.surfaceSunken }]}>
            <Icon name="ShoppingBag" size={space.lg} color={colors.textPrimary} />
          </View>
          <Text variant="caption" tone="textSecondary" style={styles.noteText}>
            {'In the app, Apple and Google add their fee. Fans there pay '}
            <Money minorUnits={store * KOBO} size={metrics.noteFont} weight={700} decimals={false} />
            {'.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: space.md },
  loading: { alignSelf: 'stretch', gap: space.md },
  hero: { alignItems: 'center', gap: space.xs + space.xs / 2, paddingTop: space.xs },
  unpicked: { fontSize: metrics.big / 2 },
  big: { minHeight: metrics.big, justifyContent: 'center', alignItems: 'center' },
  label: { textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  earn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + space.xs / 2,
    marginTop: space.sm,
    paddingVertical: metrics.earnPadV,
    paddingHorizontal: metrics.earnPadH,
    borderRadius: radius.chip,
  },
  earnText: { fontSize: metrics.earn },
  offList: { marginTop: space.xs },
  strip: { alignSelf: 'stretch', height: metrics.strip, justifyContent: 'center' },
  row: { alignItems: 'flex-start', gap: metrics.stopGap, paddingVertical: space.sm },
  stop: { width: metrics.stop, alignItems: 'center', gap: space.sm },
  pill: { width: metrics.stop, paddingVertical: metrics.stopPadV, borderRadius: metrics.stopRadius, borderWidth: 1, alignItems: 'center' },
  tick: { width: metrics.tick.width, borderRadius: metrics.tick.width / 2 },
  fade: { position: 'absolute', top: 0, bottom: 0, width: `${metrics.fade * 100}%` },
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  notch: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: metrics.notch,
    borderRightWidth: metrics.notch,
    borderBottomWidth: metrics.notch + 1,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  popular: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  quick: { borderWidth: 1, borderRadius: radius.chip, paddingVertical: metrics.quickPadV, paddingHorizontal: metrics.quickPadH },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.md - 2, borderWidth: 1, borderRadius: metrics.noteRadius, paddingVertical: metrics.notePadV, paddingHorizontal: metrics.notePadH },
  noteTile: { width: metrics.noteTile, height: metrics.noteTile, borderRadius: space.sm, alignItems: 'center', justifyContent: 'center' },
  noteText: { flex: 1, minWidth: 0, fontSize: metrics.noteFont },
});
