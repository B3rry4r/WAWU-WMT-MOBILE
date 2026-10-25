import { StyleSheet, View } from 'react-native';

import { rowMetrics } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius } from '@/theme';

import { RECENT_ROWS } from '../api/home';
import { ACTION_TILE, actionTileSize } from './WalletActions';
import { ACCT } from './BalanceCard';
import { useRowRoom } from './useRowRoom';

/**
 * design/_gen/wallet.js line 65, W4: the real layout in quiet blocks. The balance card is a 196 block with a 28 corner;
 * each row is a 44 circle, two lines (150 x 13 and 96 x 11, corner 6, 8 apart) and a 64 x 13 figure, 13 between the
 * parts and 18 between rows. The action tiles are a 54 square at the tile corner with a 44 by 10 bar under it (corner 5),
 * in the board's five columns: only the built ones have shapes (R-47), packed from the left. The tab-pill row above the card (42 high, a pill) is drawn: the tabs are built
 * (WALLET-21; round 1 of R2-MONEY). The board's scan icon is not: it has no screen (WALLET-20, R-47). The Points card is one half-width block (the Passes
 * card has no shape: it is drawn only when the person has a pass). The title bar is the screen's own, drawn live.
 */
const W4 = {
  card: 196,
  tabs: 42,
  tileBar: 44,
  mini: 86,
  tileBarH: 10,
  tileBarRadius: 5,
  miniRadius: 20,
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
export function WalletSkeleton({ tiles = 0 }: { tiles?: number }) {
  // The tiles are the size the real ones will be (54 on a 390 screen, less on a narrower phone), so nothing jumps when the wallet loads.
  const room = useRowRoom();
  const tile = actionTileSize(room);
  return (
    <LoadingView label="Loading your wallet" testID="wallet-loading">
      <View style={styles.body}>
        <Skeleton testID="wallet-loading-tabs" height={W4.tabs} radius={W4.tabs / 2} />
        <Skeleton testID="wallet-loading-card" height={W4.card} radius={ACCT.radius} />
        <Skeleton testID="wallet-loading-points" width={(room - W4.tileGap) / 2} height={W4.mini} radius={W4.miniRadius} />
        <View testID="wallet-loading-actions" style={styles.tiles}>
          {Array.from({ length: tiles }, (_, i) => (
            <View key={i} style={[styles.tile, { width: tile + ACTION_TILE.extra }]}>
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
  tiles: { flexDirection: 'row', justifyContent: 'flex-start' },
  tile: { alignItems: 'center', gap: W4.tileGap },
  rows: { gap: W4.rowsGap },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  lines: { flex: 1, gap: W4.lineGap },
});
