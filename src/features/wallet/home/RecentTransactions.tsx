import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { rowMetrics } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { TransactionRow } from '@/components/TransactionRow';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { unbuilt } from '@/lib/unbuilt';
import { space } from '@/theme';

import type { WalletTransaction } from '../api/home';
import { fundingLine, recentRow } from './model';
import { RowsSkeleton } from './WalletSkeleton';

/**
 * design/_gen/wallet.js line 44 (W1): the heading with See all at its far end (kit `SH`: 13.5 / 600 in the accent,
 * bottom-aligned), then the rows, 16 apart. Line 66 (W5): the empty card is padded 14 by 16 and its two lines sit 3
 * apart at 1.4.
 */
const RECENT = { emptyPadV: 14, emptyPadH: 16, emptyLineTop: 3, emptyLeading: 1.4, emptyLine: 13, seeAll: 13.5, headGap: 10 } as const;

export type RecentTransactionsProps = {
  rows: WalletTransaction[] | undefined;
  pending: boolean;
  failed: boolean;
  onRetry: () => void;
  accountNumber: string;
  now: Date;
};

/**
 * W1's recent transactions and W5's "No transactions yet". See all (W26, the history) and a row (W27, its
 * detail) are WALLET-04's: both are drawn and do nothing until that task wires them (R-46). W5 draws the
 * empty card alone, with no heading and no See all.
 */
export function RecentTransactions({ rows, pending, failed, onRetry, accountNumber, now }: RecentTransactionsProps) {
  if (rows && rows.length === 0) {
    return (
      <Card testID="wallet-no-transactions" style={styles.empty}>
        <View style={styles.emptyRow}>
          <IconTile icon="ArrowLeftRight" />
          <View style={styles.emptyWords}>
            <Text variant="cardTitle">
              No transactions yet
            </Text>
            <Text variant="meta" tone="textMuted" style={styles.emptyLine}>
              {fundingLine(groupedAccountNumber(accountNumber))}
            </Text>
          </View>
        </View>
      </Card>
    );
  }
  return (
    <View style={styles.section} testID="wallet-transactions">
      <View style={styles.head}>
        <Text variant="h2" accessibilityRole="header">
          Transactions
        </Text>
        <SeeAll />
      </View>
      {rows ? (
        rows.map((row) => {
          const shown = recentRow(row, now);
          return (
            <TransactionRow
              key={shown.id}
              testID={`wallet-row-${shown.id}`}
              title={shown.title}
              subtitle={shown.subtitle}
              amountMinor={shown.amountKobo}
              time={shown.meta}
              onPress={unbuilt('WALLET-04')}
              lead={
                shown.lead.kind === 'avatar' ? (
                  <Avatar name={shown.lead.name} hue={shown.lead.hue} source={shown.lead.source} decorative />
                ) : undefined
              }
              icon={shown.lead.kind === 'icon' ? shown.lead.icon : undefined}
              tone={shown.lead.kind === 'icon' ? shown.lead.tone : undefined}
            />
          );
        })
      ) : failed && !pending ? (
        <View style={styles.failed} testID="wallet-transactions-error">
          <Text variant="secondary" tone="textSecondary" accessibilityRole="alert">
            Couldn’t load your transactions.
          </Text>
          <Button label="Try again" icon="RotateCw" variant="secondary" size="sm" onPress={onRetry} testID="wallet-transactions-retry" />
        </View>
      ) : (
        <RowsSkeleton testID="wallet-transactions-loading" />
      )}
    </View>
  );
}

/** "See all" beside the heading: the whole history (W26). */
function SeeAll() {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="wallet-see-all"
      accessibilityRole="button"
      accessibilityLabel="See all transactions"
      hitSlop={space.md}
      onPress={unbuilt('WALLET-04')}
      {...ring.handlers}
      style={[styles.seeAll, ring.style]}
    >
      <Text variant="linkStrong" style={styles.seeAllText}>
        See all
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.lg },
  head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: RECENT.headGap },
  seeAll: { flexShrink: 0 },
  seeAllText: { fontSize: RECENT.seeAll },
  empty: { paddingVertical: RECENT.emptyPadV, paddingHorizontal: RECENT.emptyPadH },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  emptyWords: { flex: 1, minWidth: 0 },
  emptyLine: { marginTop: RECENT.emptyLineTop, lineHeight: RECENT.emptyLine * RECENT.emptyLeading },
  failed: { alignItems: 'flex-start', gap: space.sm },
});
