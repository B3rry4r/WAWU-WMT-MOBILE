import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { radius } from '@/theme';

import { myPointsQuery, type MyPoints } from './api';
import { WORDS } from './model';
import { PointsFrame } from './PointsFrame';
import { BalanceCard, LotsCard, MovementRow } from './parts';

/** points.js line 98, `pt5`: the parts stand 14 apart. */
const BODY_GAP = 14;
/** The loading view's stand-ins: the balance card, the lots card and a few rows, in the sizes they are drawn at. */
const SKELETON = { balance: 92, lots: 156, rows: 3, row: 60 } as const;

export type PointsScreenProps = {
  onBack: () => void;
  /** The round button on the bar: PT6. */
  onConvert: () => void;
};

/**
 * PT5 · Your points, with PT5a (nothing yet). Read from `GET /me/points`: the balance, a row for each live lot with the day it
 * ends (the soonest in the warning tone), and the last movements in the Hub's own words. Every figure is the Hub's and a count of
 * points, never naira. The Buy points button on the board is POINTS-06's; the Points card on Wallet that opens this screen is
 * DV2-02's (R-47).
 *
 * A person who has never had points sees the designed empty view; a read that fails is the error view with Try again.
 */
export function PointsScreen({ onBack, onConvert }: PointsScreenProps) {
  const owner = useSessionAccount(undefined);
  const points = useQuery(myPointsQuery(owner), queryClient);
  const action = { icon: 'Banknote', label: 'Convert to cash', onPress: onConvert, testID: 'points-convert' } as const;

  if (points.data === undefined && points.isError) {
    return (
      <PointsFrame title="Your points" onBack={onBack} action={action} gap={BODY_GAP} centered testID="points-screen">
        <ErrorState
          testID="points-error"
          icon={isApiError(points.error) && points.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title="We couldn't load your points"
          message={isApiError(points.error) ? points.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void points.refetch()}
        />
      </PointsFrame>
    );
  }
  if (points.data === undefined) {
    return (
      <PointsFrame title="Your points" onBack={onBack} action={action} gap={BODY_GAP} testID="points-screen">
        <Loading />
      </PointsFrame>
    );
  }
  const empty = points.data.balance === 0 && points.data.lots.length === 0 && points.data.movements.length === 0;
  return (
    <PointsFrame title="Your points" onBack={onBack} action={action} gap={BODY_GAP} testID="points-screen">
      <BalanceCard points={points.data.balance} />
      {empty ? (
        <View style={styles.empty}>
          <EmptyState testID="points-empty" icon="Sparkles" title={WORDS.emptyTitle} message={WORDS.emptyBody} />
        </View>
      ) : (
        <Points view={points.data} />
      )}
    </PointsFrame>
  );
}

function Points({ view }: { view: MyPoints }) {
  const now = new Date();
  const moves = view.movements.length;
  return (
    <>
      {view.lots.length > 0 ? <LotsCard lots={view.lots} nextExpiry={view.nextExpiry} now={now} /> : null}
      {moves > 0 ? (
        <View testID="points-movements">
          <Text variant="label" accessibilityRole="header">
            {moves === 1 ? 'Last movement' : `Last ${moves}`}
          </Text>
          <View>
            {view.movements.map((row) => (
              <MovementRow key={row.id} row={row} now={now} />
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

/** The page before the Hub has answered: the shape of the cards and rows, never a figure. */
function Loading() {
  return (
    <LoadingView label="Loading your points" testID="points-loading">
      <View style={styles.loading}>
        <Skeleton height={SKELETON.balance} radius={radius.card} />
        <Skeleton height={SKELETON.lots} radius={radius.card} />
        {Array.from({ length: SKELETON.rows }, (_, i) => (
          <Skeleton key={i} height={SKELETON.row} radius={radius.tile} />
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center' },
  loading: { gap: BODY_GAP },
});

