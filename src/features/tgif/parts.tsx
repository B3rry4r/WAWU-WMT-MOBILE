import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, layout, radius } from '@/theme';

import { ink, inkOnLight, lift, liftStrong, veil } from './look';

/** design/_gen/home.js, H29 to H34: the controls drawn over a card. */
export const partMetrics = {
  segmentGap: 4,
  segmentHeight: 3,
  segmentRadius: 2,
  idleSegment: 0.3,
  close: 40,
  closeIcon: 18,
  pillHeight: 40,
  pillPadX: 14,
  pillGap: 6,
  pillFont: 13.5,
  pillIcon: 17,
  pillStroke: 2,
  count: 0.7,
  next: 44,
  nextIcon: 20,
  nextStroke: 2.2,
} as const;

export type ProgressProps = { steps: number; at: number };

/** One segment per step, white up to and including the step on screen, a third as bright after it. */
export function Progress({ steps, at }: ProgressProps) {
  return (
    <View
      testID="tgif-progress"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Card ${at + 1} of ${steps}`}
      accessibilityValue={{ min: 1, max: steps, now: at + 1 }}
      style={styles.progress}
    >
      {Array.from({ length: steps }, (_, i) => (
        <View
          key={i}
          testID={`tgif-segment-${i}`}
          style={[styles.segment, { backgroundColor: ink, opacity: i <= at ? 1 : partMetrics.idleSegment }]}
        />
      ))}
    </View>
  );
}

export type CloseButtonProps = { onPress: () => void };

/** The round close control at the top right of a card. */
export function CloseButton({ onPress }: CloseButtonProps) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="tgif-close"
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      hitSlop={(layout.tapMin - partMetrics.close) / 2}
      {...ring.handlers}
      style={[styles.close, { backgroundColor: veil }, ring.style]}
    >
      <Icon name="X" size={partMetrics.closeIcon} color={ink} />
    </Pressable>
  );
}

export type PillProps = {
  icon: IconName;
  label: string;
  /** Drawn after the label, a little fainter. Left out when there is nothing to count. */
  count?: string;
  /** The person has done this: the pill turns white, as the Done button is. */
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  testID: string;
};

/** A reaction or share control under the card's words: a glass pill with an icon, a label and a count. */
export function Pill({ icon, label, count, active = false, disabled, onPress, accessibilityLabel, testID }: PillProps) {
  const ring = useFocusRing();
  const fg = active ? inkOnLight : ink;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [label, count].filter(Boolean).join(' ')}
      accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.pill, { backgroundColor: active ? ink : lift }, ring.style]}
    >
      <Icon name={icon} size={partMetrics.pillIcon} color={fg} strokeWidth={partMetrics.pillStroke} />
      <Text variant="body" style={[font(600), styles.pillLabel, { color: fg }]}>
        {label}
      </Text>
      {count ? (
        <Text variant="body" style={[font(600), styles.pillLabel, { color: fg, opacity: partMetrics.count }]}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

export type NextButtonProps = { onPress: () => void };

/** The round arrow beside "Tap to continue". */
export function NextButton({ onPress }: NextButtonProps) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="tgif-next"
      accessibilityRole="button"
      accessibilityLabel="Next card"
      onPress={onPress}
      {...ring.handlers}
      style={[styles.next, { backgroundColor: liftStrong }, ring.style]}
    >
      <Icon name="ArrowRight" size={partMetrics.nextIcon} color={ink} strokeWidth={partMetrics.nextStroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: partMetrics.segmentGap },
  segment: { flex: 1, height: partMetrics.segmentHeight, borderRadius: partMetrics.segmentRadius },
  close: { width: partMetrics.close, height: partMetrics.close, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  pill: {
    height: partMetrics.pillHeight,
    paddingHorizontal: partMetrics.pillPadX,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: partMetrics.pillGap,
  },
  pillLabel: { fontSize: partMetrics.pillFont },
  next: { width: partMetrics.next, height: partMetrics.next, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});

