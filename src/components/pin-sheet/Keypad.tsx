import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { font, radius, useWawu } from '@/theme';

import { KEYPAD } from './kit';

const BIOMETRIC_ICON = KEYPAD.biometric;
const DELETE_ICON = KEYPAD.delete;
const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

/*
 * The keys are keypad cells, not buttons: kit.js `keypad()` draws bare digits
 * in a grid, never `Btn` or `IconBtn`, so the shared Button and IconButton
 * (pills and round chips) are not used here.
 */
type KeypadProps = {
  /** Keys can't be pressed (submitting, locked, approved). */
  inactive: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  /** The biometric key, bottom left, when the phone has one; empty otherwise. */
  biometric?: { icon: IconName; label: string; onPress: () => void };
};

type KeyProps = {
  label: string;
  inactive: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
};

function Key({ label, inactive, onPress, onLongPress, children }: KeyProps) {
  const { colors } = useWawu();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={inactive}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.cell}
    >
      {({ pressed }) => (
        <View style={[styles.face, pressed && { backgroundColor: colors.surfaceSunken }]}>{children}</View>
      )}
    </Pressable>
  );
}

export function Keypad({ inactive, onDigit, onDelete, onClear, biometric }: KeypadProps) {
  const { colors } = useWawu();
  const ink = inactive ? colors.textDisabled : colors.textPrimary;
  const digit = (d: string) => (
    <Key key={d} label={d} inactive={inactive} onPress={() => onDigit(d)}>
      <Text style={[styles.digit, { color: ink }]}>{d}</Text>
    </Key>
  );

  return (
    <View style={styles.grid}>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map(digit)}
        </View>
      ))}
      <View style={styles.row}>
        {biometric ? (
          <Key label={biometric.label} inactive={inactive} onPress={biometric.onPress}>
            <Icon name={biometric.icon} size={BIOMETRIC_ICON.size} strokeWidth={BIOMETRIC_ICON.stroke} color={ink} />
          </Key>
        ) : (
          <View style={styles.cell} />
        )}
        {digit('0')}
        <Key label="Delete" inactive={inactive} onPress={onDelete} onLongPress={onClear}>
          <Icon name={DELETE_ICON.name} size={DELETE_ICON.size} strokeWidth={DELETE_ICON.stroke} color={ink} />
        </Key>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { rowGap: KEYPAD.rowApart },
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: KEYPAD.keyH, alignItems: 'center', justifyContent: 'center' },
  face: {
    width: KEYPAD.keyH,
    height: KEYPAD.keyH,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    ...font(500),
    fontSize: KEYPAD.digitSize,
    letterSpacing: KEYPAD.digitTracking * KEYPAD.digitSize,
    fontVariant: ['tabular-nums'],
  },
});
