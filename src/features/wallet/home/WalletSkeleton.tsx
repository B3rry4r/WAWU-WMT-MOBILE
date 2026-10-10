import { StyleSheet, View } from 'react-native';

import { rowMetrics } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius } from '@/theme';

import { RECENT_ROWS } from '../api/home';
import { ACCT } from './BalanceCard';

/**
 * design/_gen/wallet.js line 65, W4: the real layout in quiet blocks. The balance card is a 196 block with a 28 corner;
 * each row is a 44 circle, two lines (150 x 13 and 96 x 11, corner 6, 8 apart) and a 64 x 13 figure, 13 between the
 * parts and 18 between rows. The canvas also draws shapes for the account tabs, the actions and the five bills tiles; they
 * stand for parts that are not built (R-47), so they are not drawn. The title bar is the screen's own, drawn live.
 */
const W4 = {
  card: 196,
  lead: 44,
  line1: 150,
  line2: 96,
  lineH1: 13,
  lineH2: 11,
  lineRadius: 6,
  lineGap: 8,
  figure: 64,
  rowsGap: 18,
} as const;

/** One recent row's stand-in. */
export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={W4.lead} height={W4.lead} radius={radius.chip} />
      <View style={styles.lines}>
        <Skeleton width={W4.line1} height={W4.lineH1} radius={W4.lineRadius} />
        <Skeleton width={W4.line2} height={W4.lineH2} radius={W4.lineRadius} />
      </View>
      <Skeleton width={W4.figure} height={W4.lineH1} radius={W4.lineRadius} />
    </View>
  );
}

/** The recent rows while they load (W4's three). */
export function RowsSkeleton({ testID }: { testID?: string }) {
  return (
    <LoadingView label="Loading your transactions" testID={testID}>
      <View style={styles.rows}>
        {Array.from({ length: RECENT_ROWS }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </View>
    </LoadingView>
  );
}

/** W4: the real layout in quiet blocks. Nothing of the account, not even its number, shows until the balance is in. */
export function WalletSkeleton() {
  return (
    <LoadingView label="Loading your wallet" testID="wallet-loading">
      <View style={styles.body}>
        <Skeleton testID="wallet-loading-card" height={W4.card} radius={ACCT.radius} />
        <View testID="wallet-loading-rows" style={styles.rows}>
          {Array.from({ length: RECENT_ROWS }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </View>
      </View>
    </LoadingView>
  );
}

/** wallet.js line 65: the body leaves 20 between its blocks. */
export const BODY_GAP = 20;

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  rows: { gap: W4.rowsGap },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  lines: { flex: 1, gap: W4.lineGap },
});
