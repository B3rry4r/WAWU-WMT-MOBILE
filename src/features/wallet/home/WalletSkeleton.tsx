import { StyleSheet, View } from 'react-native';

import { rowMetrics } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius, space } from '@/theme';

import { RECENT_ROWS } from '../api/home';
import { BILL_TILE, billTileSize } from './BillTiles';
import { ACCT } from './BalanceCard';
import { useRowRoom } from './useRowRoom';

/**
 * design/_gen/wallet.js line 65, W4: the real layout in quiet blocks. The account tabs are a 42 pill; the balance
 * card is a 196 block with a 28 corner; the actions are two 54 pills that share the row and a 54 circle, 8 apart;
 * the five bills tiles are a 54 square at the tile corner with a 44 by 10 bar under it (corner 5), 10 apart, spread
 * edge to edge; each row is a 44 circle, two lines (150 x 13 and 96 x 11, corner 6, 8 apart) and a 64 x 13 figure,
 * 13 between the parts and 18 between rows. The scan and settings buttons are the screen's own bar, drawn live.
 */
const W4 = {
  tabs: 42,
  card: 196,
  action: 54,
  tileBar: 44,
  tileBarH: 10,
  tileBarRadius: 5,
  tileGap: 10,
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
const TILES = BILL_TILE.count;

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
  // The tiles are the size the real ones will be (54 on a 390 screen, less on a narrower phone), so nothing jumps when the wallet loads.
  const tile = billTileSize(useRowRoom());
  return (
    <LoadingView label="Loading your wallet" testID="wallet-loading">
      <View style={styles.body}>
        <Skeleton testID="wallet-loading-tabs" height={W4.tabs} radius={radius.chip} />
        <Skeleton testID="wallet-loading-card" height={W4.card} radius={ACCT.radius} />
        <View testID="wallet-loading-actions" style={styles.actions}>
          <Skeleton height={W4.action} radius={radius.chip} style={styles.grow} />
          <Skeleton height={W4.action} radius={radius.chip} style={styles.grow} />
          <Skeleton width={W4.action} height={W4.action} radius={radius.chip} />
        </View>
        <View testID="wallet-loading-bills" style={styles.tiles}>
          {Array.from({ length: TILES }, (_, i) => (
            <View key={i} style={styles.tile}>
              <Skeleton width={tile} height={tile} radius={radius.tile} />
              <Skeleton width={Math.min(W4.tileBar, tile)} height={W4.tileBarH} radius={W4.tileBarRadius} />
            </View>
          ))}
        </View>
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  tiles: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { alignItems: 'center', gap: W4.tileGap },
  rows: { gap: W4.rowsGap },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  lines: { flex: 1, gap: W4.lineGap },
});
