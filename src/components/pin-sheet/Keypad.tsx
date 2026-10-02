import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ICON_STROKE, Icon } from '@/components/icon';
import { font, layout, radius, space, type, useWawu } from '@/theme';

/** One key row on W11 is 58 high plus a 2 gap: one control height plus space.md. */
const KEY_PITCH = layout.controlH + space.md;
/** The keypad's glyphs as the kit draws them (design/_gen/kit.js `keypad`). */
const FACE_ICON = { name: 'ScanFace', size: 26, stroke: ICON_STROKE.default } as const;
const DELETE_ICON = { name: 'Delete', size: 24, stroke: ICON_STROKE.default } as const;
const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

type KeypadProps = {
  /** Keys can't be pressed (submitting, locked, approved). */
  inactive: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  /** Shown bottom left when Face ID is set up; empty otherwise. */
  biometricLabel?: string;
  onBiometric?: () => void;
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

export function Keypad({ inactive, onDigit, onDelete, onClear, biometricLabel, onBiometric }: KeypadProps) {
  const { colors } = useWawu();
  const ink = inactive ? colors.textDisabled : colors.textPrimary;
  const digit = (d: string) => (
    <Key key={d} label={d} inactive={inactive} onPress={() => onDigit(d)}>
      <Text style={[styles.digit, { color: ink }]}>{d}</Text>
    </Key>
  );

  return (
    <View>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map(digit)}
        </View>
      ))}
      <View style={styles.row}>
        {biometricLabel && onBiometric ? (
          <Key label={`Use ${biometricLabel}`} inactive={inactive} onPress={onBiometric}>
            <Icon name={FACE_ICON.name} size={FACE_ICON.size} strokeWidth={FACE_ICON.stroke} color={ink} />
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
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: KEY_PITCH, alignItems: 'center', justifyContent: 'center' },
  face: {
    width: KEY_PITCH,
    height: KEY_PITCH,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    ...font(500),
    fontSize: type.size.h1,
    letterSpacing: type.tracking.heading * type.size.h1,
    fontVariant: ['tabular-nums'],
  },
});
