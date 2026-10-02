import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { font, layout, radius, space, useWawu } from '@/theme';

import { focusRingGap, focusRingWidth, useFocusRing } from './focusRing';
import { Text } from './Text';

/** design/_gen/kit.js line 19, `Chip`: 36 high, 15 across, 14 semi-bold. */
export const chipMetrics = { height: 36, padH: 15, font: 14 } as const;

/**
 * design/_gen/events.js line 28, `optChip`, the choices in a filter sheet: 38 high, 14 across, 14 semi-bold, wrapping onto new lines.
 * The kit draws the 1 px outline as an inset shadow, which takes no room, so the 14 across counts the border: padding is 14 less the border.
 */
export const optionChipMetrics = { height: 38, padH: 14, font: 14, border: 1 } as const;

export type ChipVariant = 'row' | 'option';

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
  /** `row` scrolls sideways under a screen's header (the kit's `Chip`, kit.js line 19). `option` wraps inside a sheet (the kit's `optChip`, events.js line 28). */
  variant?: ChipVariant;
  testID?: string;
};

function Chip({ label, selected, onPress, variant }: { label: string; selected: boolean; onPress: () => void; variant: ChipVariant }) {
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
        variant === 'option' && styles.optionChip,
        {
          backgroundColor: selected ? colors.textPrimary : 'transparent',
          borderColor: selected ? 'transparent' : colors.borderStrong,
          borderWidth: variant === 'option' ? optionChipMetrics.border : StyleSheet.hairlineWidth,
        },
        ring.style,
      ]}
    >
      <Text variant="body" tone={selected ? 'surfacePage' : variant === 'option' ? 'textPrimary' : 'textSecondary'} style={[font(600), styles.label]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A row of filters that scrolls sideways: exactly one is on. */
export function FilterChips<T extends string>({ items, value, onChange, label, inset = layout.gutter, variant = 'row', testID }: FilterChipsProps<T>) {
  const chips = items.map((item) => (
    <Chip key={item.value} label={item.label} selected={item.value === value} variant={variant} onPress={() => onChange(item.value)} />
  ));
  if (variant === 'option') {
    return (
      <View testID={testID} accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.wrap}>
        {chips}
      </View>
    );
  }
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
      {chips}
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
  optionChip: { height: optionChipMetrics.height, paddingHorizontal: optionChipMetrics.padH - optionChipMetrics.border },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  label: { fontSize: chipMetrics.font },
});
