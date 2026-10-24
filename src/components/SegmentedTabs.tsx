import { Pressable, StyleSheet, View } from 'react-native';

import { font, radius, space, useWawu } from '@/theme';

import { useFocusRing } from './focusRing';
import { Text } from './Text';

/** design/_gen/kit.js `Seg`: 4 round the track, 2 between segments, 14 semi-bold, the selected one lifted by `0 1px 3px` at 8% black in both themes. */
export const segmentMetrics = { height: 42, trackPad: space.xs, between: 2, font: 14 } as const;

export type SegmentItem<T extends string> = { value: T; label: string };

export type SegmentedTabsProps<T extends string> = {
  items: readonly SegmentItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** What the tabs switch between, for a screen reader. */
  label: string;
  /** Let a segment's words wrap to two lines instead of being cut to one (Flix movies' "Most watched", MV7). Left out, a label is one line as before. */
  wrapLabels?: boolean;
  testID?: string;
};

function Segment({ label, selected, onPress, lines }: { label: string; selected: boolean; onPress: () => void; lines: number }) {
  const { colors, shadows } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-selected={selected}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.segment,
        {
          backgroundColor: selected ? colors.surfaceCard : 'transparent',
          borderColor: selected ? colors.borderHairline : 'transparent',
          borderWidth: StyleSheet.hairlineWidth,
        },
        ring.style,
      ]}
    >
      {selected ? <View testID="segment-lift" pointerEvents="none" style={[styles.lift, { boxShadow: shadows.lift }]} /> : null}
      <Text variant="body" tone={selected ? 'textPrimary' : 'textSecondary'} numberOfLines={lines} style={[font(600), styles.label]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Two to four views of the same thing, side by side in one track (not the app's bottom tab bar). */
export function SegmentedTabs<T extends string>({ items, value, onChange, label, wrapLabels = false, testID }: SegmentedTabsProps<T>) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: colors.surfaceSunken }]}
    >
      {items.map((item) => (
        <Segment key={item.value} label={item.label} selected={item.value === value} onPress={() => onChange(item.value)} lines={wrapLabels ? 2 : 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: segmentMetrics.trackPad,
    gap: segmentMetrics.between,
    borderRadius: radius.chip,
    alignSelf: 'stretch',
  },
  segment: {
    flex: 1,
    height: segmentMetrics.height - 2 * segmentMetrics.trackPad,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: segmentMetrics.font },
  /** The kit's lift sits on its own layer so the keyboard focus ring (the segment's own shadow) can show with it. */
  lift: {
    ...(StyleSheet.absoluteFill as object),
    borderRadius: radius.chip,
  },
});
