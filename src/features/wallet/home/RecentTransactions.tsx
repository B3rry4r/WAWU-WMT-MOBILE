import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { rowMetrics } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { groupedAccountNumber } from '@/features/open-wallet/pin';
import { space } from '@/theme';

import type { WalletTransaction } from '../api/home';
import { TxRow } from '../history/TxRow';
import { fundingLine, recentRow, recentView } from './model';
import { RowsSkeleton } from './WalletSkeleton';

/**
 * design/_gen/wallet.js line 44 (W1): the heading, then the rows, 16 apart. See all (kit `SH`: 13.5 / 600 in the accent) stands at
 * the heading's far end, its bottom edge level with the heading's, and opens the history (W26).
 * Line 66 (W5): the empty card is padded 14 by 16 and its two lines sit 3 apart at 1.4.
 */
const RECENT = { emptyPadV: 14, emptyPadH: 16, emptyLineTop: 3, emptyLeading: 1.4, emptyLine: 13, seeAll: 13.5 } as const;

export type RecentTransactionsProps = {
  rows: WalletTransaction[] | undefined;
  pending: boolean;
  failed: boolean;
  onRetry: () => void;
  accountNumber: string;
  now: Date;
  /** See all: the history (W26). */
  onSeeAll: () => void;
  /** A row: that movement's detail (W27). */
  onOpen: (id: string) => void;
  /** A grouped row: the movements it stands for (W26 with `?group=`), as the history opens the same row. */
  onOpenGroup: (key: string) => void;
};

/**
 * W1's recent transactions, W4's row shapes while the read is out, and W5's "No transactions yet". A row opens that
 * transaction's detail (W27), a grouped row opens the list it stands for (W26 with the group, as the history does), and See all opens the history (W26). W4 and W5 draw no heading: the shapes, or the empty card,
 * alone, so there is no See all with nothing to see.
 */
export function RecentTransactions({ rows, pending, failed, onRetry, accountNumber, now, onSeeAll, onOpen, onOpenGroup }: RecentTransactionsProps) {
  const view = recentView({ rows, pending, failed });
  // Until the read answers nobody knows whether there are rows: W4's shapes, not a heading over nothing.
  if (view === 'loading') return <RowsSkeleton testID="wallet-transactions-loading" />;
  if (view === 'none') {
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
        <SeeAll onPress={onSeeAll} />
      </View>
      {rows ? (
        rows.map((row) => {
          const shown = recentRow(row, now);
          return (
            <TxRow
              key={shown.id}
              testID={`wallet-row-${shown.id}`}
              title={shown.title}
              subtitle={shown.subtitle}
              amountKobo={shown.amountKobo}
              meta={shown.meta}
              lead={shown.lead}
              onPress={() => (shown.groupKey ? onOpenGroup(shown.groupKey) : onOpen(shown.id))}
            />
          );
        })
      ) : (
        <View style={styles.failed} testID="wallet-transactions-error">
          <Text variant="secondary" tone="textSecondary" accessibilityRole="alert">
            Couldn’t load your transactions.
          </Text>
          <Button label="Try again" icon="RotateCw" variant="secondary" size="sm" onPress={onRetry} testID="wallet-transactions-retry" />
        </View>
      )}
    </View>
  );
}

/** The heading's action: the history. */
function SeeAll({ onPress }: { onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="wallet-see-all"
      accessibilityRole="button"
      accessibilityLabel="See all transactions"
      hitSlop={space.md}
      onPress={onPress}
      {...ring.handlers}
      style={ring.style}
    >
      <Text variant="linkStrong" style={{ fontSize: RECENT.seeAll }}>
        See all
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.lg },
  head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
  empty: { paddingVertical: RECENT.emptyPadV, paddingHorizontal: RECENT.emptyPadH },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  emptyWords: { flex: 1, minWidth: 0 },
  emptyLine: { marginTop: RECENT.emptyLineTop, lineHeight: RECENT.emptyLine * RECENT.emptyLeading },
  failed: { alignItems: 'flex-start', gap: space.sm },
});
