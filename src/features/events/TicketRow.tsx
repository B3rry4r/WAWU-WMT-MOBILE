import { StyleSheet, View } from 'react-native';

import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import type { TicketType } from './api';
import { toKobo, type TierStatus } from './format';

/** design/_gen/events.js `tType`: 12 above and below, 12 between, the amount 14.5. The control each side of the count is `TicketStepper`'s. */
export const tierMetrics = {
  padV: space.md,
  gap: space.md,
  name: 15,
  line: 12.5,
  amount: 14.5,
  sunk: 0.5,
  lineSpace: 2,
} as const;

export type TicketRowProps = {
  tier: TicketType;
  status: TierStatus;
};

/**
 * One ticket tier: its name and what is left, its price, and for a tier that cannot be bought a pill that says why.
 * The quantity stepper is not drawn: there is no buy button for it to lead to until EVENTS-06 (R-47). `TicketStepper`
 * is built and waits for that task.
 */
export function TicketRow({ tier, status }: TicketRowProps) {
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
        free ? (
          <Text variant="body" style={[font(600), { fontSize: tierMetrics.amount }]}>
            Free
          </Text>
        ) : (
          <Money minorUnits={toKobo(tier.priceNaira)} size={tierMetrics.amount} decimals={false} />
        )
      ) : (
        <StatusPill label={status.soldOut ? 'Sold out' : status.ended ? 'Ended' : 'Soon'} tone={status.soldOut ? 'danger' : 'neutral'} />
      )}
    </View>
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
});
