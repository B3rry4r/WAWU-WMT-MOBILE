import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Share, StyleSheet, View } from 'react-native';

import { ApiError, isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
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
import { Reference } from '@/features/send/parts';
import { longDateTime } from '@/features/wallet/history/lagosTime';
import { radius, space } from '@/theme';

import { applyStatus, billsKeys, fetchMine, fetchStatus, recordKey, type BillRecord } from './api';
import { billDraft } from './draft';
import { kindOfRecord, type BillKind } from './kinds';
import { groupMeter, groupPhone } from './model';
import { TokenCard } from './TokenCard';

const RECEIPT = { mark: 88, headGap: 12, headTop: 20, figure: 36, title: 28, titleTracking: -0.035, partMoney: 14.5, poll: 15000 } as const;

/**
 * BILLS-09: while the Hub holds a bill as `processing`, S7 reads `GET /bills/{id}/status` at once and then every 10 seconds, for up to 3
 * minutes. The Hub asks the provider at most once in 20 seconds for it and never buys, so the reads are cheap. After 3 minutes the
 * "on its way" state stays, with Done, and the receipt is read again whenever it is opened.
 */
export const STATUS_READ = { everyMs: 10_000, forMs: 180_000 } as const;

/** What the receipt says; the Hub wrote none of these, so they say only what the bill's status says. */
export const RECEIPT_WORDS = {
  paid: 'paid',
  onItsWay: 'Payment received, on its way',
  onItsWayLine: 'Your payment went through and this usually lands within a few minutes. You do not need to pay again.',
  /** The payment went through and the biller could not deliver: a refund is owed (the Hub's own sentence is used when this session has it). */
  failedTitle: "We couldn't deliver your bill",
  refundedTitle: 'Your payment was refunded',
  refundOnItsWay: 'Refund on its way',
  refunded: 'Refunded',
  failedBody: (biller: string) => `Your payment went through but ${biller} could not deliver it, so nothing was bought. You will be refunded in full.`,
  refundedBody: (biller: string) => `${biller} could not deliver this bill, so your payment was refunded.`,
  chaseBelow: 'Quote the reference below if you need to chase it.',
  /** A delivered electricity bill the provider has not yet given a token for (the Hub keeps asking for 24 hours). */
  tokenMissing: "Your token isn't here yet. We'll keep checking. If it doesn't show soon, contact support with the reference below.",
  tokenMissingNoReference: "Your token isn't here yet. We'll keep checking. If it doesn't show soon, contact support.",
  /** A bill the Hub holds as `pending`: no payment has been confirmed for it, and it is never shown as paid. */
  unpaidTitle: 'Payment not confirmed yet',
  unpaidLine: 'If you finished paying, your bill still goes through and shows in Recent.',
  notFound: "We couldn't find that bill",
} as const;

export type ReceiptScreenProps = {
  id: string;
  /** Done: back to the kinds of bill (S2). */
  onDone: () => void;
  /** Try again: the review of the same bill when it is still being put together, else the kinds of bill. */
  onTryAgain: () => void;
};

/** A bill's own record, read from what the person has paid for. A bill the list does not hold is `not_found`. */
async function readBill(id: string): Promise<BillRecord> {
  const found = (await fetchMine()).find((b) => b.id === id);
  if (!found) throw new ApiError('not_found', 404, 'We could not find that bill.');
  return found;
}

/** `paid` and `pending` are read from the list again every 15 seconds, for as long as `processing` is read (3 minutes); `processing` has its own status read. */
const listPolled = (status: BillRecord['status']) => status === 'paid' || status === 'pending';

/** A delivered electricity bill the provider has not given a token for yet: S7 says so and keeps reading its status. */
const awaitsToken = (bill: BillRecord) => bill.status === 'delivered' && kindOfRecord(bill.category) === 'electricity' && !bill.token;

/** The reference the Hub quotes in its own sentence for a bill it could not deliver ("Quote wawu-bill-... if you need to chase it."). */
export function quotedReference(sentence: string): string | null {
  const found = /\bQuote\s+(\S{4,64})\s+if you need to chase it/.exec(sentence);
  return found ? found[1] : null;
}

export function receiptNumber(kind: BillKind | null, ref: string): { label: string; value: string } {
  if (kind === 'electricity') return { label: 'Meter', value: groupMeter(ref.replace(/\D/g, '')) };
  if (kind === 'cable') return { label: 'Smartcard', value: groupMeter(ref.replace(/\D/g, '')) };
  return { label: 'Phone', value: groupPhone(ref.replace(/\D/g, '')) };
}

/** The text the phone's share sheet gets (R-33): what was paid, to whom, the reference and the date. */
export function shareText(bill: BillRecord): string {
  const number = receiptNumber(kindOfRecord(bill.category), bill.customerRef);
  const lines = [`₦${bill.amount.toLocaleString('en-NG')} to ${bill.billerName}`, `${number.label}: ${number.value}`];
  if (bill.providerReference) lines.push(`Reference: ${bill.providerReference}`);
  lines.push(`Date: ${longDateTime(bill.createdAt)}`);
  return lines.join('\n');
}

/**
 * S7 · the receipt, and S12 when the bill was not delivered, from one record (`GET /bills/mine`, or the answer `verify` just gave).
 * Delivered: "₦10,000 paid", the number, the reference and the date, with Share receipt (the phone's share sheet, R-33) and Done.
 * The provider confirms delivery on its own time, so a paid bill usually reads "Payment received, on its way" first and is read again
 * until it settles (the status read above). When the Hub gives a prepaid token, the card of S7 shows it with Copy token and the units. Failed: the Hub's own sentence when this session has it, else the plain fact, the amount, the reference when
 * there is one and Try again. "Refunded" shows only when the Hub has recorded a refund; the app never says money is back on its own.
 */
export function ReceiptScreen({ id, onDone, onTryAgain }: ReceiptScreenProps) {
  const listStarted = useRef<number | null>(null);
  const read = useQuery(
    {
      queryKey: recordKey(id),
      queryFn: () => readBill(id),
      refetchInterval: (query) => {
        const held = query.state.data;
        if (!held || !listPolled(held.status)) return false;
        listStarted.current ??= Date.now();
        return Date.now() - listStarted.current >= STATUS_READ.forMs ? false : RECEIPT.poll;
      },
    },
    queryClient,
  );
  const bill = read.data;
  // The status read of a `processing` bill, and of a delivered electricity bill with no token yet. Its answer goes into the record above
  // (`applyStatus`); an answer that cannot be had is not drawn: the state stays and the next read tries again.
  const statusStarted = useRef<number | null>(null);
  useQuery(
    {
      queryKey: billsKeys.status(id),
      queryFn: async () => {
        statusStarted.current ??= Date.now();
        const answer = await fetchStatus(id);
        applyStatus(answer);
        return answer;
      },
      enabled: bill !== undefined && (bill.status === 'processing' || awaitsToken(bill)),
      refetchInterval: () => (statusStarted.current !== null && Date.now() - statusStarted.current >= STATUS_READ.forMs ? false : STATUS_READ.everyMs),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
      gcTime: 0,
      retry: false,
    },
    queryClient,
  );
  const [notice, setNotice] = useState<string | null>(null);

  const share = async () => {
    if (!bill) return;
    setNotice(null);
    try {
      await Share.share({ message: shareText(bill) });
    } catch {
      setNotice('Sharing isn’t available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  const failed = bill?.status === 'failed' || bill?.status === 'refunded';
  let body;
  if (bill && bill.status === 'pending') {
    // No payment is confirmed for this bill, so it is never drawn as paid or "on its way".
    body = <EmptyState testID="receipt-unpaid" icon="Clock" title={RECEIPT_WORDS.unpaidTitle} message={RECEIPT_WORDS.unpaidLine} />;
  } else if (bill) {
    body = failed ? <Failed bill={bill} /> : <Receipt bill={bill} />;
  } else if (read.isError && isApiError(read.error) && read.error.kind === 'not_found') {
    body = <EmptyState testID="receipt-missing" icon="Receipt" title={RECEIPT_WORDS.notFound} message="It may belong to another account." />;
  } else if (read.isError) {
    body = (
      <ErrorState
        testID="receipt-error"
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
      testID="bill-receipt"
      bare
      footer={
        <View style={styles.footer}>
          {notice ? (
            <Text variant="errorLine" testID="receipt-notice" accessibilityRole="alert">
              {notice}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            {bill && bill.status === 'delivered' ? (
              <View style={styles.half}>
                <Button testID="receipt-share" label="Share receipt" icon="Share" variant="secondary" full onPress={() => void share()} />
              </View>
            ) : null}
            {failed ? (
              <View style={styles.half}>
                <Button
                  testID="receipt-done"
                  label="Done"
                  variant="secondary"
                  full
                  onPress={() => {
                    billDraft.clear();
                    onDone();
                  }}
                />
              </View>
            ) : null}
            <View style={styles.half}>
              {failed ? (
                <Button testID="receipt-retry" label="Try again" icon="RotateCw" full onPress={onTryAgain} />
              ) : (
                <Button
                  testID="receipt-done"
                  label="Done"
                  full
                  onPress={() => {
                    billDraft.clear();
                    onDone();
                  }}
                />
              )}
            </View>
          </View>
        </View>
      }
    >
      <View style={styles.body}>{body}</View>
    </AuthFrame>
  );
}

function Receipt({ bill }: { bill: BillRecord }) {
  const done = bill.status === 'delivered';
  const number = receiptNumber(kindOfRecord(bill.category), bill.customerRef);
  return (
    <>
      <View testID="receipt-head" style={styles.head}>
        <IconTile icon={done ? 'Check' : 'Clock'} tone={done ? 'in' : 'warn'} size={RECEIPT.mark} strokeWidth={2.4} />
        {done ? (
          <View style={styles.paid}>
            <Money testID="receipt-amount" minorUnits={bill.amount * 100} size={RECEIPT.figure} weight={700} decimals={false} />
            <Text variant="title" style={styles.paidWord}>
              {RECEIPT_WORDS.paid}
            </Text>
          </View>
        ) : (
          <Text variant="display" accessibilityRole="header" testID="receipt-title" style={[styles.centre, styles.title]}>
            {RECEIPT_WORDS.onItsWay}
          </Text>
        )}
        <Text variant="secondary" tone="textSecondary" testID="receipt-to" style={styles.centre}>
          {done ? bill.billerName : `₦${bill.amount.toLocaleString('en-NG')} to ${bill.billerName}`}
        </Text>
        {done ? null : (
          <Text variant="muted" testID="receipt-confirming" style={styles.centre}>
            {RECEIPT_WORDS.onItsWayLine}
          </Text>
        )}
        {awaitsToken(bill) ? (
          <Text variant="muted" testID="receipt-token-missing" style={styles.centre}>
            {bill.providerReference ? RECEIPT_WORDS.tokenMissing : RECEIPT_WORDS.tokenMissingNoReference}
          </Text>
        ) : null}
      </View>
      {bill.token ? <TokenCard token={bill.token} units={bill.units ?? null} /> : null}
      <GroupedList testID="receipt-card">
        <KeyValueRow testID="receipt-number" label={number.label} value={number.value} />
        {bill.providerReference ? <KeyValueRow testID="receipt-reference" label="Reference" value={<Reference value={bill.providerReference} />} /> : null}
        <KeyValueRow testID="receipt-date" label="Date" value={longDateTime(bill.createdAt)} />
        <KeyValueRow testID="receipt-total" label="Total paid" value={<Money minorUnits={bill.amount * 100} size={RECEIPT.partMoney} weight={700} decimals={false} />} />
      </GroupedList>
    </>
  );
}

/**
 * S12, for a bill the Hub holds as `failed` or `refunded`. A bill is only ever `failed` after the payment was taken (the Hub checks the
 * charge before it calls the biller), so this is never "Payment didn't go through": the payment went through and a refund is owed, which
 * is what the Hub says in its own sentence (kept for this session) and what the record says after a reload. "Refund on its way" is the
 * board's refund pill without a wallet; "Refunded" shows only when the Hub has recorded the refund.
 */
function Failed({ bill }: { bill: BillRecord }) {
  const refunded = bill.status === 'refunded';
  const hubSentence = billDraft.failureFor(bill.id);
  const reference = bill.providerReference ?? (hubSentence ? quotedReference(hubSentence) : null);
  const sentence = refunded
    ? RECEIPT_WORDS.refundedBody(bill.billerName)
    : (hubSentence ?? `${RECEIPT_WORDS.failedBody(bill.billerName)}${reference ? ` ${RECEIPT_WORDS.chaseBelow}` : ''}`);
  const number = receiptNumber(kindOfRecord(bill.category), bill.customerRef);
  return (
    <>
      <View testID="failed-head" style={styles.head}>
        <IconTile icon="X" tone="danger" size={RECEIPT.mark} strokeWidth={2.4} />
        <Text variant="display" accessibilityRole="header" testID="failed-title" style={[styles.centre, styles.title]}>
          {refunded ? RECEIPT_WORDS.refundedTitle : RECEIPT_WORDS.failedTitle}
        </Text>
        <Text variant="secondary" tone="textSecondary" testID="failed-reason" style={styles.centre}>
          {sentence}
        </Text>
        <View>
          <StatusPill testID="failed-status" label={refunded ? RECEIPT_WORDS.refunded : RECEIPT_WORDS.refundOnItsWay} tone="positive" icon="RotateCcw" />
        </View>
      </View>
      <GroupedList testID="failed-card">
        <KeyValueRow testID="failed-biller" label="Biller" value={bill.billerName} />
        <KeyValueRow testID="failed-number" label={number.label} value={number.value} />
        <KeyValueRow testID="failed-amount" label="Amount" value={<Money minorUnits={bill.amount * 100} size={RECEIPT.partMoney} weight={600} decimals={false} />} />
        {reference ? <KeyValueRow testID="failed-reference" label="Reference" value={<Reference value={reference} />} /> : null}
        {bill.refundReference ? <KeyValueRow testID="failed-refund" label="Refund reference" value={<Reference value={bill.refundReference} />} /> : null}
      </GroupedList>
    </>
  );
}

function ReceiptSkeleton() {
  return (
    <LoadingView label="Loading your receipt" testID="receipt-loading">
      <View style={styles.body}>
        <View style={styles.head}>
          <Skeleton width={RECEIPT.mark} height={RECEIPT.mark} radius={RECEIPT.mark / 2} />
          <Skeleton width="55%" height={RECEIPT.figure} radius={radius.tile} />
          <Skeleton width="45%" height={16} />
        </View>
        <Skeleton height={rowMetrics.pairMinHeight * 3} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: RECEIPT.headGap, paddingTop: RECEIPT.headTop },
  paid: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  paidWord: { fontSize: RECEIPT.figure * 0.9 },
  title: { fontSize: RECEIPT.title, letterSpacing: RECEIPT.titleTracking * RECEIPT.title },
  centre: { textAlign: 'center' },
  footer: { gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
});
