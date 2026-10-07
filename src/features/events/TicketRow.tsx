import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import type { TicketType } from './api';
import { toKobo, type TierStatus } from './format';

/** design/_gen/events.js `tType`: 12 above and below, 12 between, the amount 14.5, a 30 round control each side of a 14 wide count. */
export const tierMetrics = {
  padV: space.md,
  gap: space.md,
  name: 15,
  line: 12.5,
  amount: 14.5,
  control: 30,
  controlIcon: 14,
  count: 14,
  between: 10,
  stepGap: space.sm,
  sunk: 0.5,
  lineSpace: 2,
} as const;

export type TicketRowProps = {
  tier: TicketType;
  status: TierStatus;
  quantity: number;
  /** The most that can be taken of this tier. */
  max: number;
  onChange: (quantity: number) => void;
};

/** One ticket tier: its name and what is left, its price, and a stepper; a tier that cannot be bought says why in a pill. */
export function TicketRow({ tier, status, quantity, max, onChange }: TicketRowProps) {
  const { colors } = useWawu();
  const free = tier.priceNaira === 0;
  return (
    <View
      testID={`tier-${tier.id}`}
      style={[styles.row, { borderBottomColor: colors.borderHairline }, !status.open && { opacity: tierMetrics.sunk }]}
    >
      <View style={styles.words}>
        <Text
          variant="body"
          numberOfLines={1}
          style={[font(600), { fontSize: tierMetrics.name, lineHeight: canvasNormalLineHeight(tierMetrics.name) }]}
        >
          {tier.name}
        </Text>
        {status.line ? (
          <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.line}>
            {status.line}
          </Text>
        ) : null}
      </View>
      {status.open ? (
        <View style={styles.buy}>
          {free ? (
            <Text variant="body" style={[font(600), { fontSize: tierMetrics.amount }]}>
              Free
            </Text>
          ) : (
            <Money minorUnits={toKobo(tier.priceNaira)} size={tierMetrics.amount} decimals={false} />
          )}
          <View style={styles.stepper}>
            <StepButton kind="minus" label={`Fewer ${tier.name} tickets`} disabled={quantity <= 0} onPress={() => onChange(quantity - 1)} />
            <Text
              variant="body"
              accessibilityLabel={`${quantity} ${tier.name} tickets`}
              testID={`tier-${tier.id}-count`}
              style={[font(700), styles.count]}
            >
              {quantity}
            </Text>
            <StepButton kind="plus" label={`More ${tier.name} tickets`} disabled={quantity >= max} onPress={() => onChange(quantity + 1)} />
          </View>
        </View>
      ) : (
        <StatusPill label={status.soldOut ? 'Sold out' : status.ended ? 'Ended' : 'Soon'} tone={status.soldOut ? 'danger' : 'neutral'} />
      )}
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
        size={tierMetrics.controlIcon}
        color={plus ? (disabled ? colors.textDisabled : colors.textOnAccent) : disabled ? colors.textDisabled : colors.textPrimary}
        strokeWidth={plus ? 2.4 : 1.8}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tierMetrics.gap,
    paddingVertical: tierMetrics.padV,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  words: { flex: 1, minWidth: 0, gap: tierMetrics.lineSpace },
  line: { fontSize: tierMetrics.line, lineHeight: canvasNormalLineHeight(tierMetrics.line) },
  buy: { flexDirection: 'row', alignItems: 'center', gap: tierMetrics.between },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: tierMetrics.stepGap },
  count: { width: tierMetrics.count, textAlign: 'center' },
  control: {
    width: tierMetrics.control,
    height: tierMetrics.control,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
