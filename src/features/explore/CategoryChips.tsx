import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { chipMetrics } from '@/components/FilterChips';
import { focusRingGap, focusRingWidth, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

/**
 * design/_gen/explore.js `chipRow`: the kit's 36 high chip, but 14 at the end and 11 at the start, with a 15 icon
 * (stroke 2) 6 before the label. The shared `FilterChips` has no icon yet (SHARED-CHANGES EXPLORE-01 #1); this row
 * is the same control with the icon, and goes when that lands.
 */
export const categoryChipMetrics = { padStart: 11, padEnd: 14, icon: 15, iconStroke: 2, iconGap: 6 } as const;

/** Room above and below for the focus ring, which the scroller would otherwise clip (as `FilterChips` does). */
const ringRoom = Math.ceil(focusRingGap + focusRingWidth);

export type CategoryChip<T extends string> = { value: T; label: string; icon?: IconName };

function Chip({ label, icon, selected, onPress, onLayout, testID }: { label: string; icon?: IconName; selected: boolean; onPress: () => void; onLayout: (e: LayoutChangeEvent) => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const fg = selected ? colors.surfacePage : colors.textSecondary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      onLayout={onLayout}
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
      {icon ? <Icon name={icon} size={categoryChipMetrics.icon} color={fg} strokeWidth={categoryChipMetrics.iconStroke} /> : null}
      <Text variant="body" tone={selected ? 'surfacePage' : 'textSecondary'} style={[font(600), styles.label]}>
        {label}
      </Text>
    </Pressable>
  );
}

export type CategoryChipsProps<T extends string> = {
  items: readonly CategoryChip<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  testID?: string;
};

/**
 * X2's chips: exactly one on, and the row scrolls sideways. The chip that is on when the screen opens is scrolled
 * into view once when it starts out of view (X13 opens on a chip far down the row); after that the chips stay in place (X3), so switching is one tap.
 */
export function CategoryChips<T extends string>({ items, value, onChange, label, testID }: CategoryChipsProps<T>) {
  const scroller = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();
  const opening = useRef(value);
  const revealed = useRef(false);

  return (
    <ScrollView
      ref={scroller}
      testID={testID}
      horizontal
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <Chip
          key={item.value}
          testID={`${testID ?? 'chip'}-${item.value}`}
          label={item.label}
          icon={item.icon}
          selected={item.value === value}
          onPress={() => onChange(item.value)}
          onLayout={(e) => {
            if (revealed.current || item.value !== opening.current) return;
            revealed.current = true;
            const { x, width } = e.nativeEvent.layout;
            // Already in full view (X3's Photography near the start): leave the row where it is.
            if (x + width <= screenWidth - layout.gutter) return;
            scroller.current?.scrollTo({ x: x - layout.gutter, animated: false });
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { marginVertical: -ringRoom, flexGrow: 0, marginHorizontal: -layout.gutter },
  row: { gap: space.sm, alignItems: 'center', paddingVertical: ringRoom, paddingHorizontal: layout.gutter },
  chip: {
    height: chipMetrics.height,
    paddingLeft: categoryChipMetrics.padStart,
    paddingRight: categoryChipMetrics.padEnd,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: categoryChipMetrics.iconGap,
    flexShrink: 0,
  },
  label: { fontSize: chipMetrics.font },
});
