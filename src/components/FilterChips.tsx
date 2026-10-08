import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { font, layout, radius, space, useWawu } from '@/theme';

import { focusRingGap, focusRingWidth, useFocusRing } from './focusRing';
import { Icon, type IconName } from './icon';
import { Text } from './Text';

/** design/_gen/kit.js line 19, `Chip`: 36 high, 15 across, 14 semi-bold. */
export const chipMetrics = { height: 36, padH: 15, font: 14 } as const;

/**
 * design/_gen/events.js line 28, `optChip`, the choices in a filter sheet: 38 high, 14 across, 14 semi-bold, wrapping onto new lines.
 * The kit draws the 1 px outline as an inset shadow, which takes no room, so the 14 across counts the border: padding is 14 less the border.
 */
export const optionChipMetrics = { height: 38, padH: 14, font: 14, border: 1 } as const;

/**
 * design/_gen/explore.js `chipRow`, a row of chips with icons: every chip in it pads 11 at the start and 14 at the end
 * (the outline counted in, as above), the one without an icon too (X2, X3 and X13 draw All that way); a 15 icon,
 * stroke 2, in the label's colour, 6 before the label.
 */
export const chipIconMetrics = { padStart: 11, padEnd: 14, size: 15, stroke: 2, iconGap: 6 } as const;

export type ChipVariant = 'row' | 'option';

/** Room above and below the chips for the focus ring, which a scroller would otherwise clip. The scroller's margin takes it back, so the layout does not move. */
const ringRoom = Math.ceil(focusRingGap + focusRingWidth);

export type ChipItem<T extends string> = {
  value: T;
  label: string;
  /**
   * Drawn before the label (`chipRow`). When any chip in the row has one, every chip in the row takes `chipRow`'s
   * padding (11 at the start, 14 at the end), with or without an icon of its own.
   */
  icon?: IconName;
};

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
  /**
   * `row` only: when the chip that is on as the row first draws starts out of view, the row is scrolled once so it
   * shows (X13 opens Categories on a chip far down the row). After that the row stays where the person leaves it.
   */
  revealSelected?: boolean;
  /** Each chip is `<testID>-<value>`. */
  testID?: string;
};

type ChipProps = {
  label: string;
  icon?: IconName;
  /** A chip in a row where some chip has an icon: `chipRow`'s padding, whether or not this one has an icon. */
  iconRow: boolean;
  selected: boolean;
  onPress: () => void;
  variant: ChipVariant;
  onLayout?: (e: LayoutChangeEvent) => void;
  testID?: string;
};

function Chip({ label, icon, iconRow, selected, onPress, variant, onLayout, testID }: ChipProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const tone = selected ? 'surfacePage' : variant === 'option' ? 'textPrimary' : 'textSecondary';
  const border = variant === 'option' ? optionChipMetrics.border : 0;
  return (
    <Pressable
      testID={testID}
      onLayout={onLayout}
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
        iconRow ? { paddingLeft: chipIconMetrics.padStart - border, paddingRight: chipIconMetrics.padEnd - border } : null,
        icon ? styles.iconChip : null,
        ring.style,
      ]}
    >
      {icon ? <Icon name={icon} size={chipIconMetrics.size} color={colors[tone]} strokeWidth={chipIconMetrics.stroke} /> : null}
      <Text variant="body" tone={tone} style={[font(600), styles.label]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A row of filters that scrolls sideways: exactly one is on. */
export function FilterChips<T extends string>({
  items,
  value,
  onChange,
  label,
  inset = layout.gutter,
  variant = 'row',
  revealSelected,
  testID,
}: FilterChipsProps<T>) {
  const scroller = useRef<ScrollView>(null);
  // `revealSelected`: the chip on at the first draw, where it lies in the row, and how wide the row's window is.
  const opening = useRef(value);
  const revealed = useRef(false);
  const target = useRef<{ x: number; width: number } | null>(null);
  const windowWidth = useRef<number | null>(null);
  const reveal = () => {
    if (revealed.current || !target.current || windowWidth.current === null) return;
    revealed.current = true;
    const { x, width } = target.current;
    // Already in full view: leave the row where it is.
    if (x + width <= windowWidth.current - inset) return;
    scroller.current?.scrollTo({ x: x - inset, animated: false });
  };
  const watch = Boolean(revealSelected) && variant === 'row';
  const iconRow = items.some((item) => item.icon);

  const chips = items.map((item) => (
    <Chip
      key={item.value}
      testID={testID ? `${testID}-${item.value}` : undefined}
      label={item.label}
      icon={item.icon}
      iconRow={iconRow}
      selected={item.value === value}
      variant={variant}
      onPress={() => onChange(item.value)}
      onLayout={
        watch
          ? (e) => {
              if (item.value !== opening.current) return;
              target.current = e.nativeEvent.layout;
              reveal();
            }
          : undefined
      }
    />
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
      ref={scroller}
      testID={testID}
      horizontal
      onLayout={
        watch
          ? (e) => {
              windowWidth.current = e.nativeEvent.layout.width;
              reveal();
            }
          : undefined
      }
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
  iconChip: { flexDirection: 'row', alignItems: 'center', gap: chipIconMetrics.iconGap },
});
