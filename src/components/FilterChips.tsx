import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { font, layout, radius, space, useWawu } from '@/theme';

import { focusRingGap, focusRingWidth, useFocusRing } from './focusRing';
import { Text } from './Text';

/** design/_gen/kit.js `Chip`: 36 high, 15 across, 14 semi-bold. */
export const chipMetrics = { height: 36, padH: 15, font: 14 } as const;

/** Room above and below the chips for the focus ring, which a scroller would otherwise clip. The scroller's margin takes it back, so the layout does not move. */
const ringRoom = Math.ceil(focusRingGap + focusRingWidth);

export type ChipItem<T extends string> = { value: T; label: string };

export type FilterChipsProps<T extends string> = {
  items: readonly ChipItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** What the group of chips filters, for a screen reader ("Filter transactions"). */
  label: string;
  /** Room at the start and end of the scroll. Defaults to the screen gutter; the row runs edge to edge. */
  inset?: number;
  testID?: string;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.textPrimary : 'transparent',
          borderColor: selected ? 'transparent' : colors.borderStrong,
          borderWidth: StyleSheet.hairlineWidth,
        },
        ring.style,
      ]}
    >
      <Text variant="body" tone={selected ? 'surfacePage' : 'textSecondary'} style={[font(600), styles.label]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A row of filters that scrolls sideways: exactly one is on. */
export function FilterChips<T extends string>({ items, value, onChange, label, inset = layout.gutter, testID }: FilterChipsProps<T>) {
  return (
    <ScrollView
      testID={testID}
      horizontal
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
    >
      {items.map((item) => (
        <Chip key={item.value} label={item.label} selected={item.value === value} onPress={() => onChange(item.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { marginVertical: -ringRoom, flexGrow: 0 },
  row: { gap: space.sm, alignItems: 'center', paddingVertical: ringRoom },
  chip: {
    height: chipMetrics.height,
    paddingHorizontal: chipMetrics.padH,
    borderRadius: radius.chip,
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: { fontSize: chipMetrics.font },
});
