import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { space, useWawu, type ColorToken } from '@/theme';

const RADIO = { size: 22, dot: 10 } as const;
/** The offer's square (kit `check`). */
const CHECK = { box: 22, corner: 6 } as const;

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
  check: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
  box: { width: CHECK.box, height: CHECK.box, borderRadius: CHECK.corner, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
