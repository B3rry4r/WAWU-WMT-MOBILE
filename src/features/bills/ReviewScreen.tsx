import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError, isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { fetchMe, settingsKeys } from '@/features/settings/api/hub';
import { formatNaira } from '@/components/pay-sheet';
import { space, type } from '@/theme';

import { cacheRecord, fetchMine, initBill, verifyBill, type InitiatedBill } from './api';
import { billDraft, useBillDraft, type BillDraft } from './draft';
import { CheckoutModal } from './CheckoutModal';
import type { CheckoutEvent } from './checkoutPage';
import { kindInfo } from './kinds';
import { groupMeter, groupPhone } from './model';

const HEAD = { mark: 60, gap: space.md - 2, top: space.sm } as const;

export type ReviewScreenProps = {
  onBack: () => void;
  /** Nothing was started (a screen opened on its own): the kinds of bill (S2). */
  onMissing: () => void;
  /** The Hub has the bill (delivered, on its way, or failed after the charge): its receipt (S7, S12). */
  onSettled: (id: string) => void;
};

/** What the review says for each thing that can go wrong. The Hub's own sentence is used wherever it wrote one. */
export const REVIEW_WORDS = {
  noEmail: 'We need an email on your account before you can pay.',
  unavailable: "We couldn't open the payment window. Check your connection and try again.",
  notConfirmed: "Your payment wasn't confirmed, so nothing was bought. Check your bank before you try again.",
  confirming: "Your payment went through. We're getting your bill ready, so please don't pay again.",
  couldNotConfirm: "We couldn't confirm your payment yet. It went through, so please don't pay again. Try again.",
  /** The window was closed with no completed charge. A bank transfer or USSD may still land, so nothing is said about what was charged. */
  closed: 'You closed the payment window. If you finished paying, your bill still goes through and shows in Recent.',
} as const;

/** The number as the review draws it: a meter or smartcard in groups of four, a phone as "0803 123 4412". */
export function numberWords(draft: Pick<BillDraft, 'kind' | 'customer'>): string {
  const digits = draft.customer ?? '';
  return draft.kind === 'airtime' || draft.kind === 'data' ? groupPhone(digits) : groupMeter(digits);
}

type Phase =
  | { kind: 'idle' }
  /** `init` is out. */
  | { kind: 'starting' }
  /** The payment window is open. */
  | { kind: 'checkout'; bill: InitiatedBill }
  /** Paid; the Hub is checking the payment and delivering the bill. */
  | { kind: 'confirming'; bill: InitiatedBill; transactionId: string; problem: string | null; running: boolean };

/**
 * S5 · Review, for every kind of bill (R-102). Everything on it is what the person picked and the Hub confirmed (the name on the
 * number, from `validate`); the total is the amount, because the Hub charges the amount and adds no fee of its own, so no fee row is drawn
 * (BRIEF rule 4: "No fee" is never drawn as a fact). Pay asks the Hub to record the bill (`init`), opens Flutterwave's payment window with the Hub's
 * parameters, and when the window reports a completed charge asks the Hub to check it and deliver the bill (`verify`). Closing the window
 * without a completed charge comes back here and says so, with no claim about what was charged (a bank transfer or USSD may still land).
 *
 * A charge the Hub could not yet confirm is not called failed: the review says it went through, keeps the transaction id and offers Try
 * again, which sends the same check (safe to repeat: the Hub never delivers twice). A bill the biller could not deliver goes to S12 with the
 * Hub's own sentence.
 */
export function ReviewScreen({ onBack, onMissing, onSettled }: ReviewScreenProps) {
  const draft = useBillDraft();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [closedNote, setClosedNote] = useState(false);
  /** One `init` at a time: a second tap before the first answer would record a second bill. */
  const starting = useRef(false);
  const me = useQuery({ queryKey: settingsKeys.me, queryFn: fetchMe }, queryClient);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const complete = Boolean(draft && draft.biller && draft.item && draft.customer && draft.amount);
  useEffect(() => {
    if (!complete && phase.kind === 'idle') onMissing();
  }, [complete, phase.kind, onMissing]);

  const confirm = useCallback(
    async (bill: InitiatedBill, transactionId: string) => {
      setPhase({ kind: 'confirming', bill, transactionId, problem: null, running: true });
      try {
        const record = await verifyBill(bill.billPaymentId, transactionId);
        // A bill the Hub has taken and is delivering is finished with here: the bill being put together goes, so Back cannot pay it twice.
        if (record.status !== 'failed' && record.status !== 'refunded') billDraft.clear();
        if (live.current) onSettled(record.id);
        return;
      } catch (e) {
        const message = e instanceof ApiError ? e.message : '';
        // A delivery the biller refused is `400` with the Hub's sentence and the bill marked failed: S12 says it. Any other `400` (a
        // payment the provider did not confirm) leaves the bill pending, so the Hub's record is what decides.
        if (e instanceof ApiError && e.status === 400) {
          const mine = await fetchMine().catch(() => []);
          const stood = mine.find((b) => b.id === bill.billPaymentId);
          if (stood && (stood.status === 'failed' || stood.status === 'refunded')) {
            billDraft.rememberFailure(stood.id, message);
            cacheRecord(stood);
            if (live.current) onSettled(stood.id);
            return;
          }
        }
        if (live.current) {
          const hubSaid = isApiError(e) && e.kind !== 'network' && e.status >= 400 && e.status < 500 && message !== '';
          setPhase({ kind: 'confirming', bill, transactionId, problem: hubSaid ? message : REVIEW_WORDS.couldNotConfirm, running: false });
        }
      }
    },
    [onSettled],
  );

  if (!draft || !complete) return null;
  const info = kindInfo(draft.kind);
  const amount = draft.amount as number;
  const email = me.data?.email ?? null;
  const name = [me.data?.firstName, me.data?.lastName].filter(Boolean).join(' ');

  const pay = async () => {
    if (!draft.biller || !draft.item || !draft.customer) return;
    if (starting.current || phase.kind !== 'idle') return;
    if (!email) {
      setError(REVIEW_WORDS.noEmail);
      return;
    }
    starting.current = true;
    setError(null);
    setClosedNote(false);
    setPhase({ kind: 'starting' });
    try {
      const bill = await initBill({
        category: draft.categoryName,
        billerCode: draft.biller.code,
        itemCode: draft.item.code,
        billerName: draft.biller.name,
        customerRef: draft.customer,
        amount,
      });
      if (live.current) setPhase({ kind: 'checkout', bill });
    } catch (e) {
      // Nothing was charged: `init` only records the intent. The Hub's sentence is shown as it wrote it.
      if (!live.current) return;
      setPhase({ kind: 'idle' });
      setError(e instanceof Error && e.message !== '' ? e.message : REVIEW_WORDS.unavailable);
    } finally {
      starting.current = false;
    }
  };

  const onEvent = (event: CheckoutEvent) => {
    if (phase.kind !== 'checkout') return;
    if (event.kind === 'paid') {
      void confirm(phase.bill, event.transactionId);
    } else if (event.kind === 'notConfirmed') {
      setPhase({ kind: 'idle' });
      setError(REVIEW_WORDS.notConfirmed);
    } else if (event.kind === 'unavailable') {
      setPhase({ kind: 'idle' });
      setError(REVIEW_WORDS.unavailable);
    } else {
      setPhase({ kind: 'idle' });
      setClosedNote(true);
    }
  };

  const busy = phase.kind === 'starting';
  const confirming = phase.kind === 'confirming' ? phase : null;
  const title = draft.item && draft.kind !== 'airtime' && draft.item.name !== draft.biller?.name ? `${draft.biller?.name} · ${draft.item.name}` : (draft.biller?.name ?? '');

  return (
    <AuthFrame
      testID="bill-review"
      navTitle="Review"
      onBack={confirming ? undefined : onBack}
      footer={
        confirming ? (
          confirming.running ? null : (
            <Button testID="review-confirm-again" label="Try again" full onPress={() => void confirm(confirming.bill, confirming.transactionId)} />
          )
        ) : (
          <View style={styles.footer}>
            {error ? (
              <Text variant="errorLine" testID="review-error" accessibilityRole="alert" style={styles.centre}>
                {error}
              </Text>
            ) : null}
            {closedNote && !error ? (
              <Text variant="muted" testID="review-closed" style={styles.centre}>
                {REVIEW_WORDS.closed}
              </Text>
            ) : null}
            <Button testID="review-pay" label={`Pay ${formatNaira(amount * 100)}`} full loading={busy} disabled={busy} onPress={() => void pay()} />
          </View>
        )
      }
    >
      <View style={styles.body}>
        <View testID="review-head" style={styles.head}>
          <IconTile icon={info.icon} tone="accent" size={HEAD.mark} />
          <Text variant="secondary" tone="textMuted" style={styles.centre}>
            {title}
          </Text>
          <Money testID="review-amount" minorUnits={amount * 100} size={type.size.display} />
        </View>
        <GroupedList testID="review-card">
          <KeyValueRow testID="review-number" label={info.numberLabel.replace(' number', '')} value={numberWords(draft)} />
          {draft.customerName ? <KeyValueRow testID="review-name" label="Name" value={draft.customerName} /> : null}
          {draft.item && draft.kind !== 'airtime' && draft.kind !== 'electricity' ? <KeyValueRow testID="review-item" label="Package" value={draft.item.name} /> : null}
          <KeyValueRow testID="review-total" label="Total" value={<Money minorUnits={amount * 100} size={14.5} weight={700} decimals={false} />} />
        </GroupedList>
        <Card padded style={styles.payWith}>
          <IconTile icon="CreditCard" tone="neutral" size={40} />
          <View style={styles.payWords}>
            <Text variant="cardTitle">Pay online</Text>
            <Text variant="meta" tone="textMuted">
              Card, bank transfer or USSD, on the next screen
            </Text>
          </View>
        </Card>
        {confirming ? (
          <View testID="review-confirming" style={styles.confirming}>
            <IconTile icon={confirming.problem ? 'TriangleAlert' : 'Clock'} tone="warn" size={HEAD.mark} />
            <Text variant="sheetTitle" style={styles.centre}>
              {confirming.problem ? 'Still confirming' : 'Confirming your payment'}
            </Text>
            <Text variant="muted" testID="review-confirming-line" style={styles.centre} accessibilityRole={confirming.problem ? 'alert' : undefined}>
              {confirming.problem ?? REVIEW_WORDS.confirming}
            </Text>
          </View>
        ) : null}
      </View>
      <CheckoutModal
        visible={phase.kind === 'checkout'}
        config={phase.kind === 'checkout' ? phase.bill.config : null}
        customer={{ email: email ?? '', name: name || undefined, phone: me.data?.phone }}
        labels={{ title: draft.biller?.name ?? 'Pay a bill', description: `${draft.item?.name ?? info.label} for ${draft.customer}` }}
        onEvent={onEvent}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingBottom: space.lg },
  head: { alignItems: 'center', gap: HEAD.gap, paddingTop: HEAD.top },
  centre: { textAlign: 'center' },
  footer: { gap: space.sm },
  payWith: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  payWords: { flex: 1 },
  confirming: { alignItems: 'center', gap: space.sm, paddingTop: space.md },
});
