import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { formatMoney, Money } from '@/components/Money';
import { LoadingView, Skeleton, SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TransactionRow } from '@/components/TransactionRow';
import { SectionHeading } from '@/features/explore/parts';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { ProsNav } from '@/features/professionals/parts';
import { font, layout, radius, space, useWawu } from '@/theme';

import { FittedBalance, MoneyGround } from '../home/BalanceCard';
import { serverSentence } from '../home/model';
import { earningsQuery, piecesQuery, type EarningPiece } from './api';
import { monthWords, pieceIcon, rowsOfTiles, salesWords, showsKobo, tilesOf, waitingWords, type Tile } from './model';

/**
 * design/_gen/wallet.js line 154 (`earnBody`, W39): the body's parts are 20 apart; the hero is a 26 corner, 20 in, its lines 10
 * apart, the label 14 at 70%, the figure 40, the all-time line 13 at 65% with the figure 13 / 500 and 4 between; the tiles are
 * three to a row, 8 apart, each an 18 corner padded 12 by 14, the label 12.5, the figure 16 six below it; the pieces are 16 apart.
 */
const EARN = {
  partGap: 20,
  heroPad: 20,
  heroGap: 10,
  labelSize: 14,
  labelOpacity: 0.7,
  figure: 40,
  allTimeSize: 13,
  allTimeOpacity: 0.65,
  allTimeGap: 4,
  tileGap: 8,
  tilePadV: 12,
  tilePadH: 14,
  tileLabel: 12.5,
  tileFigureTop: 6,
  tileFigure: 16,
  pieceGap: 16,
  headGap: 16,
  bottom: 40,
  skeletonRows: 3,
  heroHeight: 190,
  tileHeight: 70,
} as const;

export type EarningsScreenProps = {
  onBack: () => void;
  /** Open your wallet (A31), for a creator whose earnings wait because there is no wallet yet. */
  onOpenWallet: () => void;
};

/**
 * W39 · Earnings. What a creator has earned: this month, big, with all time under it; the month split by Unlocks, Tips and Paid
 * DMs (and any other stream the Hub lists); and the month piece by piece. Earnings land in the wallet by themselves (R-11), so
 * there is no balance to move and no button for it. Every figure is the Hub's (`GET /money/earnings` and `/content`), the
 * 85% share of each sale (R-5), never a total made here.
 *
 * What it says about the money still on its way (the Hub's `waiting`): with no wallet it waits for one and lands the moment it
 * is opened, with a link to Open your wallet; with a wallet, it reaches it once a day (R-55).
 *
 * Not drawn, because no board draws what they open (R-47, BACKEND_GAPS G-WALLET-13-1): the calendar button in the bar, which
 * would choose another month. The pieces' pictures and the format line ("Video") are not served either (G-WALLET-13-2).
 */
export function EarningsScreen({ onBack, onOpenWallet }: EarningsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useWawu();
  const owner = useSessionAccount(undefined);
  const summary = useQuery(earningsQuery(owner), queryClient);
  // Someone who has earned nothing ever has no pieces to ask for.
  const month = summary.data && summary.data.allTime.sales > 0 ? summary.data.month : undefined;
  const pieces = useInfiniteQuery(piecesQuery(owner, month), queryClient);
  const [pulled, setPulled] = useState(false);

  const { refetch: refetchSummary } = summary;
  const { refetch: refetchPieces } = pieces;
  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refetchSummary();
      await refetchPieces();
    } finally {
      setPulled(false);
    }
  }, [refetchSummary, refetchPieces]);

  const data = summary.data;
  const items = useMemo(() => pieces.data?.pages.flatMap((page) => page.items) ?? [], [pieces.data]);
  const nothingEver = data !== undefined && data.allTime.sales === 0;

  let body;
  if (summary.isPending) {
    body = (
      <LoadingView label="Loading earnings" testID="earnings-loading">
        <View style={styles.parts}>
          <Skeleton height={EARN.heroHeight} radius={radius.money} />
          <View style={styles.tiles}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.tile}>
                <Skeleton height={EARN.tileHeight} radius={radius.tile} />
              </View>
            ))}
          </View>
          <SkeletonRows count={EARN.skeletonRows} />
        </View>
      </LoadingView>
    );
  } else if (!data) {
    const offline = isApiError(summary.error) && summary.error.kind === 'network';
    body = (
      <ErrorState
        testID="earnings-error"
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        title="Couldn’t load your earnings"
        message={offline ? 'No connection. Check your internet and try again.' : serverSentence(summary.error, 'Something went wrong. Try again.')}
        onRetry={() => void refetchSummary()}
      />
    );
  } else if (nothingEver) {
    body = (
      <Card testID="earnings-empty">
        <EmptyState icon="Coins" title="Nothing earned yet" message="Unlocks, tips and paid messages show here as they come in." />
      </Card>
    );
  } else {
    const label = monthWords(data.month);
    const waiting = waitingWords(data.walletOpen, data.waiting.amountKobo, (kobo) => formatMoney(kobo, { decimals: showsKobo(kobo) }));
    body = (
      <View style={styles.parts}>
        <View testID="earnings-hero" style={[styles.hero, { boxShadow: shadows.money }]}>
          <MoneyGround corner={radius.money} glowId="earnings-hero-glow" />
          <View style={styles.heroBody}>
            <Text variant="body" tone="textOnAccent" style={styles.heroLabel}>
              {label ? `Earned in ${label}` : 'Earned this month'}
            </Text>
            <FittedBalance availableKobo={data.thisMonth.earnedKobo} hidden={false} base={EARN.figure} testID="earnings-month-figure" />
            <View style={styles.allTime} testID="earnings-all-time">
              <Money minorUnits={data.allTime.earnedKobo} size={EARN.allTimeSize} weight={500} decimals={showsKobo(data.allTime.earnedKobo)} tone="textOnAccent" />
              <Text variant="body" tone="textOnAccent" style={styles.allTimeLabel}>
                earned all time
              </Text>
            </View>
          </View>
        </View>
        {waiting ? (
          <Card padded testID="earnings-waiting">
            <View style={waiting.action ? [styles.waiting, styles.waitingAbove] : styles.waiting}>
              <IconTile icon={waiting.action ? 'Wallet' : 'Clock'} tone="accent" size={40} />
              <View style={styles.waitingWords}>
                <Text variant="body" style={font(600)}>
                  {waiting.title}
                </Text>
                <Text variant="secondary" tone="textMuted">
                  {waiting.body}
                </Text>
              </View>
            </View>
            {waiting.action ? <Button label="Open your wallet" onPress={onOpenWallet} size="md" testID="earnings-open-wallet" /> : null}
          </Card>
        ) : null}
        <View testID="earnings-tiles" style={styles.tileRows}>
          {rowsOfTiles(tilesOf(data.thisMonth.streams)).map((row, r) => (
            <View key={r} style={styles.tiles}>
              {row.map((tile) => (
                <StreamTile key={tile.kind} tile={tile} />
              ))}
              {Array.from({ length: 3 - row.length }, (_, i) => (
                <View key={`blank-${i}`} style={styles.tile} />
              ))}
            </View>
          ))}
        </View>
        <View testID="earnings-pieces" style={styles.pieces}>
          <SectionHeading
            title="By content"
            action={
              <Text variant="secondary" tone="textMuted">
                This month
              </Text>
            }
          />
          <Pieces
            items={items}
            loading={pieces.isPending}
            failed={pieces.isError && items.length === 0}
            hasMore={Boolean(pieces.hasNextPage)}
            loadingMore={pieces.isFetchingNextPage}
            moreFailed={pieces.isFetchNextPageError}
            onRetry={() => void refetchPieces()}
            onMore={() => void pieces.fetchNextPage()}
          />
        </View>
      </View>
    );
  }

  return (
    <View testID="earnings-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ProsNav title="Earnings" onBack={onBack} />
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + EARN.bottom }]}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      >
        {body}
      </ScrollView>
    </View>
  );
}

function StreamTile({ tile }: { tile: Tile }) {
  return (
    <Card testID={`earnings-tile-${tile.kind}`} style={styles.tile}>
      <View style={styles.tileBody}>
        <Text variant="caption" numberOfLines={1} style={styles.tileLabel}>
          {tile.name}
        </Text>
        <View style={styles.tileFigure}>
          <Money minorUnits={tile.earnedKobo} size={EARN.tileFigure} decimals={showsKobo(tile.earnedKobo)} />
        </View>
      </View>
    </Card>
  );
}

type PiecesProps = {
  items: EarningPiece[];
  loading: boolean;
  failed: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  onRetry: () => void;
  onMore: () => void;
};

/** The month piece by piece, largest first as the Hub sends it. A month with nothing says so; a failed read has its own Try again. */
function Pieces({ items, loading, failed, hasMore, loadingMore, moreFailed, onRetry, onMore }: PiecesProps) {
  if (loading) return <SkeletonRows count={EARN.skeletonRows} testID="earnings-pieces-loading" />;
  if (failed) {
    return (
      <View testID="earnings-pieces-error" style={styles.inline}>
        <Text variant="secondary" accessibilityRole="alert">
          Couldn’t load what you earned by piece.
        </Text>
        <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={onRetry} testID="earnings-pieces-retry" />
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <Text variant="secondary" tone="textMuted" testID="earnings-pieces-empty">
        Nothing earned this month yet.
      </Text>
    );
  }
  return (
    <View style={styles.pieceRows}>
      {items.map((piece) => (
        <TransactionRow
          key={`${piece.kind}:${piece.targetId}`}
          testID={`earnings-piece-${piece.kind}-${piece.targetId}`}
          title={piece.title || salesWords(piece.kind, 1)}
          subtitle={salesWords(piece.kind, piece.sales)}
          amountMinor={piece.earnedKobo}
          // The board draws +₦42,000 with no ".00"; an amount with kobo keeps them (SWEEP-APP-4 row 144, SHARED-CHANGES SWEEP-APP-4 #1).
          decimals={piece.earnedKobo % 100 !== 0}
          icon={pieceIcon(piece.kind)}
          tone="in"
        />
      ))}
      {moreFailed ? (
        <View testID="earnings-more-error" style={styles.inline}>
          <Text variant="secondary" accessibilityRole="alert">
            Couldn’t load more.
          </Text>
          <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={onMore} testID="earnings-more-retry" />
        </View>
      ) : hasMore ? (
        <Button label="Show more" variant="secondary" size="md" onPress={onMore} disabled={loadingMore} loading={loadingMore} testID="earnings-more" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm },
  parts: { gap: EARN.partGap },
  hero: { borderRadius: radius.money },
  heroBody: { padding: EARN.heroPad, gap: EARN.heroGap },
  heroLabel: { fontSize: EARN.labelSize, opacity: EARN.labelOpacity },
  allTime: { flexDirection: 'row', alignItems: 'baseline', gap: EARN.allTimeGap },
  allTimeLabel: { fontSize: EARN.allTimeSize, opacity: EARN.allTimeOpacity },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  waitingAbove: { marginBottom: space.md },
  waitingWords: { flex: 1, gap: space.xs },
  tileRows: { gap: EARN.tileGap },
  tiles: { flexDirection: 'row', gap: EARN.tileGap },
  tile: { flex: 1, borderRadius: radius.tile, paddingVertical: EARN.tilePadV, paddingHorizontal: EARN.tilePadH },
  tileBody: { gap: 0 },
  tileLabel: { fontSize: EARN.tileLabel },
  tileFigure: { marginTop: EARN.tileFigureTop },
  pieces: { gap: EARN.headGap },
  pieceRows: { gap: EARN.pieceGap },
  inline: { gap: space.sm, alignItems: 'flex-start' },
});
