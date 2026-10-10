import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

/** design/_gen/events.js `tType`: a 30 round control each side of a 14 wide count, 8 between. */
export const stepperMetrics = {
  control: 30,
  controlIcon: 14,
  count: 14,
  gap: space.sm,
} as const;

export type TicketStepperProps = {
  /** The tier's name, in what a screen reader says. */
  name: string;
  /** Used as `tier-<id>-count` for the count. */
  tierId: string;
  quantity: number;
  /** The most that can be taken of this tier. */
  max: number;
  onChange: (quantity: number) => void;
};

/**
 * The minus, the count and the plus beside an open tier's price (E2). Built by EVENTS-01 and not drawn anywhere
 * since FIX-30: a quantity with no Get tickets button leads nowhere (R-47). EVENTS-06 draws it again, beside
 * the running total and its button, in the same change.
 */
export function TicketStepper({ name, tierId, quantity, max, onChange }: TicketStepperProps) {
  return (
    <View style={styles.stepper}>
      <StepButton kind="minus" label={`Fewer ${name} tickets`} disabled={quantity <= 0} onPress={() => onChange(quantity - 1)} />
      <Text variant="body" accessibilityLabel={`${quantity} ${name} tickets`} testID={`tier-${tierId}-count`} style={[font(700), styles.count]}>
        {quantity}
      </Text>
      <StepButton kind="plus" label={`More ${name} tickets`} disabled={quantity >= max} onPress={() => onChange(quantity + 1)} />
    </View>
  );
}

function StepButton({ kind, label, disabled, onPress }: { kind: 'minus' | 'plus'; label: string; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const plus = kind === 'plus';
  return (
    <Pressable
      testID={`step-${kind}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={space.sm}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.control,
        plus
          ? { backgroundColor: disabled ? colors.surfaceSunken : colors.accent }
          : { borderColor: colors.borderStrong, borderWidth: StyleSheet.hairlineWidth },
        ring.style,
      ]}
    >
      <Icon
        name={plus ? 'Plus' : 'Minus'}
        size={stepperMetrics.controlIcon}
        color={plus ? (disabled ? colors.textDisabled : colors.textOnAccent) : disabled ? colors.textDisabled : colors.textPrimary}
        strokeWidth={plus ? 2.4 : 1.8}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: stepperMetrics.gap },
  count: { width: stepperMetrics.count, textAlign: 'center' },
  control: {
    width: stepperMetrics.control,
    height: stepperMetrics.control,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
