import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, useWawu } from '@/theme';

import { DOTS } from './kit';

export type PinDotsProps = {
  /** How many digits are in. */
  filled: number;
  /** How many dots to draw (the PIN's length). */
  length: number;
  /** Ring the empty dots in danger: only a refused PIN does (kit.js `dots` with the wrong-PIN ring). */
  missed?: boolean;
  /** The PIN is locked: filled dots go disabled grey and the empty ones hairline. */
  locked?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** kit.js line 52, `dots`: 16 across, 18 apart, the empty ones a 1.5 ring. One row for the PIN sheet and every PIN screen. */
export function PinDots({ filled, length, missed, locked, style, testID }: PinDotsProps) {
  const { colors } = useWawu();
  const ring = locked ? colors.borderHairline : missed ? colors.danger : colors.borderStrong;
  return (
    <View style={[styles.dots, style]} accessible accessibilityLabel={`${filled} of ${length} digits entered`} testID={testID}>
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i < filled ? { backgroundColor: locked ? colors.textDisabled : colors.textPrimary } : { borderColor: ring, borderWidth: DOTS.ring }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: DOTS.apart },
  dot: { width: DOTS.size, height: DOTS.size, borderRadius: radius.chip },
});
