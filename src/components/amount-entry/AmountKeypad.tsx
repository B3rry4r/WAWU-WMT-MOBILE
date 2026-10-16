import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { KEYPAD } from '@/components/pin-sheet/kit';
import { font, radius, useWawu } from '@/theme';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

export type AmountKeypadProps = {
  /** Keys can't be pressed (a request is running). */
  inactive?: boolean;
  /** A digit or ".". */
  onKey: (key: string) => void;
  onDelete: () => void;
  /** Holding Delete clears everything typed. */
  onClear: () => void;
};

type KeyProps = { label: string; inactive: boolean; onPress: () => void; onLongPress?: () => void; testID?: string; children: React.ReactNode };

function Key({ label, inactive, onPress, onLongPress, testID, children }: KeyProps) {
  const { colors } = useWawu();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={inactive}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.cell}
    >
      {({ pressed }) => <View style={[styles.face, pressed && { backgroundColor: colors.surfaceSunken }]}>{children}</View>}
    </Pressable>
  );
}

/**
 * The amount keypad (W9): the PIN keypad's own digits and sizes (kit.js `keypad()`), with "." where the PIN sheet has its
 * biometric key. Shared so the send in chat (INBOX-19) types an amount the same way. It holds no text: the screen keeps
 * what was typed (`amount.ts`) and the keypad only reports keys.
 */
export function AmountKeypad({ inactive = false, onKey, onDelete, onClear }: AmountKeypadProps) {
  const { colors } = useWawu();
  const ink = inactive ? colors.textDisabled : colors.textPrimary;
  const digit = (d: string) => (
    <Key key={d} testID={`amount-key-${d}`} label={d} inactive={inactive} onPress={() => onKey(d)}>
      <Text style={[styles.digit, { color: ink }]}>{d}</Text>
    </Key>
  );
  return (
    <View testID="amount-keypad" style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map(digit)}
        </View>
      ))}
      <View style={styles.row}>
        <Key testID="amount-key-point" label="Decimal point" inactive={inactive} onPress={() => onKey('.')}>
          <Text style={[styles.digit, { color: ink }]}>.</Text>
        </Key>
        {digit('0')}
        <Key testID="amount-key-delete" label="Delete" inactive={inactive} onPress={onDelete} onLongPress={onClear}>
          <Icon name={KEYPAD.delete.name} size={KEYPAD.delete.size} strokeWidth={KEYPAD.delete.stroke} color={ink} />
        </Key>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { rowGap: KEYPAD.rowApart },
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: KEYPAD.keyH, alignItems: 'center', justifyContent: 'center' },
  face: { width: KEYPAD.keyH, height: KEYPAD.keyH, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  digit: {
    ...font(500),
    fontSize: KEYPAD.digitSize,
    letterSpacing: KEYPAD.digitTracking * KEYPAD.digitSize,
    fontVariant: ['tabular-nums'],
  },
});
