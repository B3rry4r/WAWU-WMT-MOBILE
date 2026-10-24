import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import type { TicketType } from './api';
import { toKobo, type TierStatus } from './format';

/** design/_gen/events.js `tType`: 12 above and below, 12 between, the amount 14.5, 10 between the amount and the stepper. The control each side of the count is `TicketStepper`'s. */
export const tierMetrics = {
  padV: space.md,
  gap: space.md,
  name: 15,
  line: 12.5,
  amount: 14.5,
  between: 10,
  sunk: 0.5,
  lineSpace: 2,
} as const;

export type TicketRowProps = {
  tier: TicketType;
  status: TierStatus;
  /** The quantity stepper beside an open tier's price (E2). Left out where nothing can be bought from the screen (R-47). */
  stepper?: ReactNode;
};

/** One ticket tier: its name and what is left, its price, a stepper when tickets can be bought, and for a tier that cannot be bought a pill that says why. */
export function TicketRow({ tier, status, stepper }: TicketRowProps) {
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
          {stepper}
        </View>
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
  buy: { flexDirection: 'row', alignItems: 'center', gap: tierMetrics.between },
  line: { fontSize: tierMetrics.line, lineHeight: canvasNormalLineHeight(tierMetrics.line) },
});
