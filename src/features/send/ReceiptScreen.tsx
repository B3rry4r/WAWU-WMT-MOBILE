import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Share, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
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
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { SwitchRow } from '@/components/SwitchRow';
import { radius, space } from '@/theme';

import { fetchBeneficiaries, removeBeneficiary, savedBankRowFor, saveBankBeneficiary, transferQuery, type Beneficiary, type Transfer } from './api';
import { dropIntentOfTransfer } from './intent';
import { CONFIRMING_LINE, failureLine, firstName, receiptRows, shareText, toLine } from './model';
import { Reference } from './parts';

const RECEIPT = { mark: 88, headGap: 12, headTop: 20, figure: 36, partMoney: 14.5, copy: 14, copyMs: 1600, poll: 4000 } as const;

export type ReceiptScreenProps = {
  id: string;
  onDone: () => void;
};

/**
 * W12 · Send · success receipt: "₦25,000 sent" to a person, Completed, then the reference (it can be copied), the date (Lagos time),
 * where it came from, the note, Bank charge, WAWU's fee, Fees and Total paid (BRIEF W12, R-10). Every line is a field of the
 * send the Hub holds (`GET /money/transfers/{id}`). Share receipt opens the phone's share sheet with the receipt's text and
 * reference (R-33); Done goes back to the wallet, where the new row is on top.
 *
 * "Save as a beneficiary" is a switch that starts on, as the canvas draws it, and saves the bank account (lead ruling, 16 Oct 2026). It is
 * offered after a bank send only: W8's Saved list draws saved bank accounts, and no screen draws a saved WAWU user, so a send to a WAWU
 * user offers nothing to save (SWEEP-R2, R-47). A send the provider has not confirmed shows "Pending" and the still-confirming line, and is read again
 * until it is decided (G-710); one that failed says so in the Hub's words, with Done only.
 */
export function ReceiptScreen({ id, onDone }: ReceiptScreenProps) {
  const owner = useSessionAccount(undefined);
  const read = useQuery(
    {
      ...transferQuery(owner, id),
      refetchInterval: (query) => (query.state.data?.status === 'pending' ? RECEIPT.poll : false),
    },
    queryClient,
  );
  const transfer = read.data;
  const [notice, setNotice] = useState<string | null>(null);

  // A send the Hub has decided needs no intent kept for it: the phone lets it go when a receipt shows the answer.
  const decidedId = transfer && transfer.status !== 'pending' ? transfer.id : null;
  useEffect(() => {
    if (owner && decidedId) void dropIntentOfTransfer(owner, decidedId);
  }, [owner, decidedId]);

  const share = async () => {
    if (!transfer) return;
    setNotice(null);
    try {
      await Share.share({ message: shareText(transfer) });
    } catch {
      setNotice('Sharing isn’t available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  let body;
  if (transfer) {
    body = <Receipt transfer={transfer} />;
  } else if (read.isError && isApiError(read.error) && read.error.kind === 'not_found') {
    body = <EmptyState testID="receipt-missing" icon="Receipt" title="We couldn’t find that send" message="It may belong to another account." />;
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

  const sent = transfer?.status === 'completed';
  return (
    <AuthFrame
      testID="send-receipt-screen"
      bare
      footer={
        <View style={styles.footer}>
          {notice ? (
            <Text variant="errorLine" testID="receipt-notice" accessibilityRole="alert">
              {notice}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            {transfer && sent ? (
              <View style={styles.half}>
                <Button testID="receipt-share" label="Share receipt" icon="Share" variant="secondary" full onPress={() => void share()} />
              </View>
            ) : null}
            <View style={styles.half}>
              <Button testID="receipt-done" label="Done" full onPress={onDone} />
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
  const pending = transfer.status === 'pending';
  return (
    <>
      <View testID="receipt-head" style={styles.head}>
        <IconTile icon={done ? 'Check' : pending ? 'Clock' : 'X'} tone={done ? 'in' : pending ? 'warn' : 'danger'} size={RECEIPT.mark} strokeWidth={2.4} />
        <View style={styles.sent}>
          <Money testID="receipt-amount" minorUnits={transfer.amountKobo} size={RECEIPT.figure} weight={700} decimals={transfer.amountKobo % 100 !== 0} />
          {done ? (
            <Text variant="title" style={styles.sentWord}>
              sent
            </Text>
          ) : null}
        </View>
        <Text variant="secondary" tone="textSecondary" testID="receipt-to" style={styles.centre}>
          {toLine(transfer)}
        </Text>
        <View>
          <StatusPill
            testID="receipt-status"
            label={done ? 'Completed' : pending ? 'Pending' : transfer.status === 'reversed' ? 'Reversed' : 'Failed'}
            tone={done ? 'positive' : pending ? 'warning' : transfer.status === 'reversed' ? 'neutral' : 'danger'}
            icon={done ? 'Check' : pending ? 'Clock' : 'X'}
          />
        </View>
        {pending ? (
          <Text variant="muted" testID="receipt-confirming" style={styles.centre}>
            {CONFIRMING_LINE}
          </Text>
        ) : null}
        {!done && !pending ? (
          <Text variant="muted" testID="receipt-failure" style={styles.centre}>
            {failureLine(transfer)}
          </Text>
        ) : null}
      </View>
      {done || pending ? (
        <GroupedList testID="receipt-card">
          {receiptRows(transfer).map((row) => (
            <KeyValueRow
              key={row.key}
              testID={`receipt-${row.key}`}
              label={row.label}
              value={
                row.money !== undefined ? (
                  <Money minorUnits={row.money} size={RECEIPT.partMoney} weight={row.strong ? 700 : 600} />
                ) : row.copy ? (
                  <Reference value={row.value} />
                ) : row.wrap ? (
                  <Text variant="kvValue" style={styles.wrapped}>
                    {row.value}
                  </Text>
                ) : (
                  row.value
                )
              }
            />
          ))}
        </GroupedList>
      ) : null}
      {done && transfer.toBankAccount ? (
        <SaveRow target={{ bankCode: transfer.toBankAccount.bankCode, accountNumber: transfer.toBankAccount.accountNumber, name: transfer.toBankAccount.accountName }} />
      ) : null}
    </>
  );
}

/**
 * W12's "Save <first name> as a beneficiary" after a bank send: the switch starts ON, as the canvas draws it, and the account is
 * saved when the receipt opens (an account already saved is left as is). Turning it off takes the account back out. A failed read
 * hides the row; a failed save leaves the switch off and says why, in the Hub's words.
 */
type SaveTarget = { bankCode: string; accountNumber: string; name: string };

function SaveRow({ target }: { target: SaveTarget }) {
  const owner = useSessionAccount(undefined);
  const list = useQuery(
    { queryKey: ['money', 'beneficiaries', owner ?? ''] as const, queryFn: fetchBeneficiaries, staleTime: 0, enabled: Boolean(owner) },
    queryClient,
  );
  const [busy, setBusy] = useState(false);
  const [want, setWant] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const asked = useRef(false);
  const rows = list.data;
  const find = useCallback((list: readonly Beneficiary[]) => savedBankRowFor(list, target.bankCode, target.accountNumber), [target]);
  const row = rows ? find(rows) : undefined;

  const change = useCallback(
    async (next: boolean, saved: Beneficiary | undefined) => {
      setWant(next);
      setBusy(true);
      setProblem(null);
      try {
        if (next) await saveBankBeneficiary(target.bankCode, target.accountNumber);
        else if (saved) await removeBeneficiary(saved.id);
        await list.refetch();
      } catch (error) {
        setProblem(isApiError(error) && error.message ? error.message : 'We couldn’t change that. Try again.');
      } finally {
        setBusy(false);
      }
    },
    [target, list],
  );

  // Once, when the saved people have been read: a person who is not saved yet is saved, because the switch is drawn on.
  useEffect(() => {
    if (!rows || asked.current) return;
    asked.current = true;
    if (!find(rows)) queueMicrotask(() => void change(true, undefined));
  }, [rows, find, change]);

  if (!rows) return null;
  const on = busy ? want : Boolean(row);

  return (
    <View style={styles.save}>
      <GroupedList testID="receipt-save">
        <SwitchRow testID="receipt-save-switch" title={`Save ${firstName(target.name)} as a beneficiary`} on={on} busy={busy} onChange={(next) => void change(next, row)} />
      </GroupedList>
      {problem ? (
        <Text variant="errorLine" testID="receipt-save-error" accessibilityRole="alert">
          {problem}
        </Text>
      ) : null}
    </View>
  );
}

function ReceiptSkeleton() {
  return (
    <LoadingView label="Loading your receipt" testID="receipt-loading">
      <View style={styles.skeleton}>
        <View style={styles.head}>
          <Skeleton width={RECEIPT.mark} height={RECEIPT.mark} radius={RECEIPT.mark / 2} />
          <Skeleton width="55%" height={RECEIPT.figure} radius={radius.tile} />
          <Skeleton width="45%" height={16} />
        </View>
        <Skeleton height={rowMetrics.pairMinHeight * 5} radius={radius.card} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  head: { alignItems: 'center', gap: RECEIPT.headGap, paddingTop: RECEIPT.headTop },
  sent: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  sentWord: { fontSize: RECEIPT.figure * 0.9 },
  centre: { textAlign: 'center' },
  wrapped: { flexShrink: 1, textAlign: 'right' },
  save: { gap: space.sm },
  footer: { gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
  skeleton: { gap: space.lg },
});
