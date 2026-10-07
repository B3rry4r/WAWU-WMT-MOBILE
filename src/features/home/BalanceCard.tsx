import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/Button';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { Money } from '@/components/Money';
import { layout, radius, useWawu } from '@/theme';

import { CardGlows } from './CardGlows';
import { cardInk, todayMetrics as m, todayWords } from './look';
import type { BalanceView } from './model';

export type BalanceCardProps = {
  view: BalanceView;
  /** The figure hidden behind dots (the eye). */
  masked: boolean;
  onToggleMask: () => void;
  /** Opens Open your wallet (A26) for a person with no wallet yet. */
  onOpenWallet: () => void;
  /** Asks for the balance again. */
  onRetry: () => void;
  retrying: boolean;
};

/** The eye: the figure shown or hidden. A bare icon on the card, with the tap area of a button. */
function EyeToggle({ masked, onPress }: { masked: boolean; onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="today-balance-eye"
      accessibilityRole="button"
      accessibilityLabel={masked ? 'Show balance' : 'Hide balance'}
      onPress={onPress}
      hitSlop={(layout.tapMin - m.eye) / 2}
      {...ring.handlers}
      style={ring.style}
    >
      <Icon name={masked ? 'EyeOff' : 'Eye'} size={m.eye} color={cardInk.ink} strokeWidth={1.8} />
    </Pressable>
  );
}

/**
 * The Naira balance card (H1): the Naira chip and the eye, then Fintava's figure. A person with
 * no wallet yet sees, in the figure's place, why there is none and a way to open one (A26).
 *
 * Send, Add and Bills are added by WALLET-02, WALLET-05 and BILLS-01 with their screens, and
 * Scan by WALLET-20 after launch (R-27, R-41); the chip's currency switch comes with the Dollar
 * and Crypto accounts (WALLET-21), so the chip is a label until then.
 */
export function BalanceCard({ view, masked, onToggleMask, onOpenWallet, onRetry, retrying }: BalanceCardProps) {
  const { dark, colors, gradients } = useWawu();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };
  const ground = gradients.surfaceMoney;
  const ends = gradientEnds(ground.angle);
  const glow = m.moneyGlow;

  let body;
  if (view.kind === 'figure' || view.kind === 'loading') {
    body = (
      <View style={styles.figure}>
        <Money
          testID="today-balance"
          minorUnits={view.kind === 'figure' ? view.kobo : 0}
          loading={view.kind === 'loading'}
          masked={masked}
          size={m.figure}
          tone="textOnAccent"
        />
      </View>
    );
  } else {
    const action =
      view.kind === 'no_wallet' ? (
        <Button testID="today-open-wallet" label="Open your wallet" size="md" icon="Wallet" onPress={onOpenWallet} />
      ) : view.kind === 'unreachable' || view.kind === 'error' || view.kind === 'opening' ? (
        <Button
          testID="today-balance-retry"
          label={view.kind === 'opening' ? 'Check again' : 'Try again'}
          variant="glass"
          size="md"
          icon="RotateCw"
          loading={retrying}
          onPress={onRetry}
        />
      ) : null;
    body = (
      <View style={styles.notice} testID={`today-balance-${view.kind}`}>
        {view.kind === 'unreachable' ? (
          <Text accessibilityRole="header" style={[todayWords.notice, { color: cardInk.ink }]}>
            {"We couldn't reach your account"}
          </Text>
        ) : null}
        <Text
          accessibilityRole={view.kind === 'error' || view.kind === 'unreachable' ? 'alert' : undefined}
          style={[view.kind === 'unreachable' ? todayWords.noticeBody : todayWords.notice, { color: cardInk.ink }]}
        >
          {view.message}
        </Text>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    );
  }

  return (
    <View
      testID="today-balance-card"
      onLayout={onLayout}
      style={[
        styles.card,
        dark
          ? { borderWidth: m.moneyEdge, borderColor: colors.borderHairline }
          : { boxShadow: [{ offsetX: 0, offsetY: m.moneyShadow.y, blurRadius: m.moneyShadow.blur, spreadDistance: m.moneyShadow.spread, color: cardInk.moneyShadow }] },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={ground.colors as unknown as readonly [string, string, ...string[]]}
        locations={ground.locations as unknown as readonly [number, number, ...number[]]}
        start={ends.start}
        end={ends.end}
        style={StyleSheet.absoluteFill}
      />
      <CardGlows
        id="moneyGlow"
        width={size.width}
        height={size.height}
        spots={[{ x: size.width + glow.right - glow.size / 2, y: glow.size / 2 - glow.top, size: glow.size, color: cardInk.accent, strength: glow.strength }]}
      />
      <View style={styles.top}>
        <View style={[styles.chip, { backgroundColor: cardInk.chip }]}>
          <CurrencyFlag currency="NGN" size={m.flag} />
          <Text style={[todayWords.chip, { color: cardInk.ink }]}>Naira</Text>
        </View>
        {view.kind === 'figure' ? <EyeToggle masked={masked} onPress={onToggleMask} /> : null}
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.money,
    overflow: 'hidden',
    paddingTop: m.moneyPadTop,
    paddingHorizontal: m.moneyPadX,
    paddingBottom: m.moneyPadBottom,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    height: m.chipHeight,
    borderRadius: radius.chip,
    paddingLeft: m.chipPadLeft,
    paddingRight: m.chipPadRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.chipGap,
  },
  figure: { marginTop: m.figureTop },
  notice: { marginTop: m.noticeTop, alignItems: 'flex-start' },
  action: { marginTop: m.noticeGap },
});
