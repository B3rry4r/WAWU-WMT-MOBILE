import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Share, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, rowMetrics } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { transferQuery, type Transfer } from '@/features/send/api';
import { dropIntentOfTransfer } from '@/features/send/intent';
import { Reference } from '@/features/send/parts';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { POLL_MS, receiptHeading, receiptTo, timelineSteps, withdrawReceiptRows, withdrawShareText, type Step } from './model';

/** The board's mark is 88, the heading's figure 36 (W12's own), a step's chip 26 with a 10 dot. */
const LOOK = { mark: 88, figure: 36, headGap: 12, headTop: 20, chip: 26, dot: 10, partMoney: 14.5 } as const;

export type WithdrawReceiptScreenProps = {
  id: string;
  onDone: () => void;
  /** The bank did not take it: W14 says what came back. */
  onFailed: (transferId: string) => void;
};

/**
 * W19 · Withdraw · on its way (WALLET-05): "₦50,000 on its way", where it goes, a timeline of Requested, Sent to the bank and In
 * your bank account, then the reference, the fee as its parts and Total paid (BRIEF W19, R-10, R-53). Every line is a field of the
 * withdrawal the Hub holds (`GET /money/transfers/{id}`): it is read again until the bank has decided, so the steps fill in as the
 * Hub stamps them, and the heading says "sent" once the bank account has it. A withdrawal the bank did not take, or one reversed,
 * leaves for W14, which says what came back. Share receipt opens the phone's share sheet (R-33); Done goes back to the wallet.
 */
export function WithdrawReceiptScreen({ id, onDone, onFailed }: WithdrawReceiptScreenProps) {
  const owner = useSessionAccount(undefined);
  const read = useQuery(
    {
      ...transferQuery(owner, id),
      refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_MS : false),
    },
    queryClient,
  );
  const transfer = read.data;
  const [notice, setNotice] = useState<string | null>(null);

  // A withdrawal the Hub has decided needs no attempt kept for it: the phone lets it go when the receipt shows the answer.
  const decidedId = transfer && transfer.status !== 'pending' ? transfer.id : null;
  useEffect(() => {
    if (owner && decidedId) void dropIntentOfTransfer(owner, decidedId);
  }, [owner, decidedId]);

  // A failed or reversed withdrawal is W14's to say: once, and never from a receipt that never showed it pending or done.
  const left = useRef<string | null>(null);
  const gone = transfer && (transfer.status === 'failed' || transfer.status === 'reversed') ? transfer.id : null;
  useEffect(() => {
    if (gone && left.current !== gone) {
      left.current = gone;
      onFailed(gone);
    }
  }, [gone, onFailed]);

  const share = async () => {
    if (!transfer) return;
    setNotice(null);
    try {
      await Share.share({ message: withdrawShareText(transfer) });
    } catch {
      setNotice('Sharing isn’t available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  let body;
  if (transfer) {
    body = <Receipt transfer={transfer} />;
  } else if (read.isError && isApiError(read.error) && read.error.kind === 'not_found') {
    body = <EmptyState testID="withdraw-receipt-missing" icon="Receipt" title="We couldn’t find that withdrawal" message="It may belong to another account." />;
  } else if (read.isError) {
    body = (
      <ErrorState
        testID="withdraw-receipt-error"
        icon={isApiError(read.error) && read.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your receipt"
        message={isApiError(read.error) && read.error.message ? read.error.message : 'Check your connection and try again.'}
        onRetry={() => void read.refetch()}
      />
    );
  } else {
    body = <ReceiptSkeleton />;
  }

  return (
    <AuthFrame
      testID="withdraw-receipt-screen"
      bare
      footer={
        <View style={styles.footer}>
          {notice ? (
            <Text variant="errorLine" testID="withdraw-receipt-notice" accessibilityRole="alert">
              {notice}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            {transfer ? (
              <View style={styles.half}>
                <Button testID="withdraw-receipt-share" label="Share receipt" icon="Share" variant="secondary" full onPress={() => void share()} />
              </View>
            ) : null}
            <View style={styles.half}>
              <Button testID="withdraw-receipt-done" label="Done" full onPress={onDone} />
            </View>
          </View>
        </View>
      }
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

function Receipt({ transfer }: { transfer: Transfer }) {
  const done = transfer.status === 'completed';
  return (
    <>
      <View testID="withdraw-receipt-head" style={styles.head}>
        <IconTile icon={done ? 'Check' : 'Clock'} tone={done ? 'in' : 'warn'} size={LOOK.mark} strokeWidth={2.4} />
        <View style={styles.heading}>
          <Money testID="withdraw-receipt-amount" minorUnits={transfer.amountKobo} size={LOOK.figure} weight={700} decimals={transfer.amountKobo % 100 !== 0} />
          <Text variant="title" testID="withdraw-receipt-word" style={styles.word}>
            {receiptHeading(transfer)}
          </Text>
        </View>
        <Text variant="secondary" tone="textSecondary" testID="withdraw-receipt-to" style={styles.centre}>
          {receiptTo(transfer)}
        </Text>
      </View>
      <Card testID="withdraw-receipt-steps" padded style={styles.steps}>
        {timelineSteps(transfer).map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </Card>
      <GroupedList testID="withdraw-receipt-card">
        {withdrawReceiptRows(transfer).map((row) => (
          <KeyValueRow
            key={row.key}
            testID={`withdraw-receipt-${row.key}`}
            label={row.label}
            value={
              row.money !== undefined ? (
                <Money minorUnits={row.money} size={LOOK.partMoney} weight={row.strong ? 700 : 600} />
              ) : row.copy ? (
                <Reference value={row.value ?? ''} />
              ) : (
                (row.value ?? '')
              )
            }
          />
        ))}
      </GroupedList>
    </>
  );
}

/** One step: a chip (a check once done, an amber dot while it is the one in progress, a quiet dot while it waits), its words and its time. */
function StepRow({ step }: { step: Step }) {
  const { colors } = useWawu();
  const done = step.state === 'done';
  const state = done ? 'done' : step.state === 'current' ? 'in progress' : 'waiting';
  return (
    <View testID={`withdraw-step-${step.key}`} accessible accessibilityLabel={`${step.label}, ${state}${step.time ? `, ${step.time}` : ''}`} style={styles.step}>
      <View style={[styles.chip, { backgroundColor: done ? colors.positiveTint : colors.surfaceSunken }]}>
        {done ? (
          <Icon name="Check" size={14} color={colors.positive} strokeWidth={2.6} />
        ) : (
          <View style={[styles.dot, { backgroundColor: step.state === 'current' ? colors.warning : colors.textMuted }]} />
        )}
      </View>
      <View style={styles.stepText}>
        <Text variant="body" style={font(700)}>
          {step.label}
        </Text>
        {step.time ? (
          <Text variant="secondary" tone="textMuted" testID={`withdraw-step-${step.key}-time`}>
            {step.time}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ReceiptSkeleton() {
  return (
    <LoadingView label="Loading your receipt" testID="withdraw-receipt-loading">
      <View style={styles.skeleton}>
        <View style={styles.head}>
          <Skeleton width={LOOK.mark} height={LOOK.mark} radius={LOOK.mark / 2} />
          <Skeleton width="55%" height={LOOK.figure} radius={radius.tile} />
          <Skeleton width="45%" height={16} />
        </View>
        <Skeleton height={rowMetrics.pairMinHeight * 3} radius={radius.card} />
        <Skeleton height={rowMetrics.pairMinHeight * 4} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: LOOK.headGap, paddingTop: LOOK.headTop },
  heading: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  word: { fontSize: LOOK.figure * 0.9, lineHeight: canvasNormalLineHeight(LOOK.figure * 0.9) },
  centre: { textAlign: 'center' },
  steps: { gap: space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chip: { width: LOOK.chip, height: LOOK.chip, borderRadius: LOOK.chip / 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: LOOK.dot, height: LOOK.dot, borderRadius: LOOK.dot / 2 },
  stepText: { flex: 1, minWidth: 0 },
  footer: { gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  skeleton: { gap: space.lg },
});
