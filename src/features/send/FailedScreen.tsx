import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { radius, space } from '@/theme';

import { transferQuery, type Transfer } from './api';
import { dropIntentOfTransfer } from './intent';
import { failedRows, failedView } from './model';
import { Reference } from './parts';

/** W14's mark is the receipt's 88, and the headline is the board's 28 bold. */
const FAILED = { mark: 88, head: 12, headTop: 20, title: 28, partMoney: 14.5, poll: 4000 } as const;

export type FailedScreenProps = {
  id: string;
  /** Done: back to the wallet. */
  onDone: () => void;
  /** Try again: the same account again from W8, then W9 (a new name check, a new quote, a new key). */
  onTryAgain: (transfer: Transfer) => void;
  /** The send is not failed after all (completed, or still with the bank): its receipt (W12) tells it. */
  onReceipt: (id: string) => void;
};

/**
 * W14 · Send · failed: a transfer to a bank account the bank did not take, with what the Hub has on record about the money (BRIEF W14,
 * rule 6). "Reversed to your wallet" and "Returned to your wallet" are the Hub's reversal and its `returnedKobo`; a charge that was
 * kept is its own row, never "full" or "nothing was taken". The reason under the headline is the Hub's own sentence. A failure with no
 * reversal on record yet says nothing about the money beyond where to look, and is read again until the Hub has one.
 */
export function FailedScreen({ id, onDone, onTryAgain, onReceipt }: FailedScreenProps) {
  const owner = useSessionAccount(undefined);
  const read = useQuery(
    {
      ...transferQuery(owner, id),
      refetchInterval: (query) => {
        const t = query.state.data;
        return t && t.status === 'failed' && t.reversal === null ? FAILED.poll : false;
      },
    },
    queryClient,
  );
  const transfer = read.data;
  const stands = transfer && (transfer.status === 'failed' || transfer.status === 'reversed');

  // A send the Hub has decided needs no intent kept for it.
  useEffect(() => {
    if (owner && stands && transfer) void dropIntentOfTransfer(owner, transfer.id);
  }, [owner, stands, transfer]);
  // Not failed after all: the receipt says what it is.
  useEffect(() => {
    if (transfer && !stands) onReceipt(transfer.id);
  }, [transfer, stands, onReceipt]);

  let body;
  if (transfer && stands) {
    body = <Failed transfer={transfer} />;
  } else if (read.isError && isApiError(read.error) && read.error.kind === 'not_found') {
    body = <EmptyState testID="failed-missing" icon="Receipt" title="We couldn’t find that transfer" message="It may belong to another account." />;
  } else if (read.isError) {
    body = (
      <ErrorState
        testID="failed-error"
        icon={isApiError(read.error) && read.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load this transfer"
        message={isApiError(read.error) && read.error.message ? read.error.message : 'Check your connection and try again.'}
        onRetry={() => void read.refetch()}
      />
    );
  } else {
    body = <FailedSkeleton />;
  }

  return (
    <AuthFrame
      testID="send-failed-screen"
      bare
      footer={
        <View style={styles.buttons}>
          <View style={styles.half}>
            <Button testID="failed-done" label="Done" variant="secondary" full onPress={onDone} />
          </View>
          {transfer && stands ? (
            <View style={styles.half}>
              <Button testID="failed-retry" label="Try again" icon="RotateCw" full onPress={() => onTryAgain(transfer)} />
            </View>
          ) : null}
        </View>
      }
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

function Failed({ transfer }: { transfer: Transfer }) {
  const view = failedView(transfer);
  return (
    <>
      <View testID="failed-head" style={styles.head}>
        <IconTile icon="X" tone="danger" size={FAILED.mark} strokeWidth={2.4} />
        <Text variant="display" accessibilityRole="header" testID="failed-title" style={styles.centre}>
          {view.title}
        </Text>
        <Text variant="secondary" tone="textSecondary" testID="failed-reason" style={styles.centre}>
          {view.reason}
        </Text>
        <View>
          {view.stands === 'reversed' ? (
            <StatusPill testID="failed-status" label="Reversed to your wallet" tone="positive" icon="RotateCcw" />
          ) : (
            <StatusPill testID="failed-status" label="Failed" tone="danger" icon="X" />
          )}
        </View>
      </View>
      <GroupedList testID="failed-card">
        {failedRows(transfer).map((row) => (
          <KeyValueRow
            key={row.key}
            testID={`failed-${row.key}`}
            label={row.label}
            value={row.money !== undefined ? <Money minorUnits={row.money} size={FAILED.partMoney} weight={600} /> : row.copy ? <Reference value={row.value} /> : row.value}
          />
        ))}
      </GroupedList>
      <Banner testID="failed-note" tone="info" icon="Info" title={view.note.title} body={view.note.body} />
    </>
  );
}

function FailedSkeleton() {
  return (
    <LoadingView label="Loading this transfer" testID="failed-loading">
      <View style={styles.body}>
        <View style={styles.head}>
          <Skeleton width={FAILED.mark} height={FAILED.mark} radius={FAILED.mark / 2} />
          <Skeleton width="70%" height={FAILED.title} radius={radius.tile} />
          <Skeleton width="45%" height={16} />
        </View>
        <Skeleton height={rowMetrics.pairMinHeight * 3} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: FAILED.head, paddingTop: FAILED.headTop },
  centre: { textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
});
