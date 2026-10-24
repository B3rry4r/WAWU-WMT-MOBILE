import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { formatMoney } from '@/components/Money';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { PayPinSheet, type Credential, type Settled } from '@/features/device-approval';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { radius } from '@/theme';

import { confirmOrder, orderQuery, type CapitalOrder } from './api';
import { countdownText, dayText, deductibleText, rateText, reservationRanOut, termText, WORDS } from './model';
import { GAP, ResultBlock, settleOutcome } from './parts';

/** How often an order the provider has not finished is read again. Default (agent), owner may override. */
const POLL_MS = 4000;

export type ReviewScreenProps = {
  orderId: string;
  onBack: () => void;
  /** Leave for the product (a reservation that ran out) or the wallet. */
  onStartAgain: (productId: string) => void;
  onDone: () => void;
  onOpenOrder: (id: string) => void;
  onForgotPin: () => void;
  onSetPin: () => void;
};

/**
 * The review of a reservation (the wallet's review sheet, R-29) with the PIN sheet over it. Every figure is the provider's quote,
 * held for a few minutes: the rate it locked, the term, what leaving early costs, the deductions, WAWU's fee when there is one (R-10,
 * from config, 0 by default) and the total that leaves the wallet. Invest asks the PIN (or the phone's fingerprint, FIX-112) and
 * confirms once: one Idempotency-Key per review, sent again unchanged after a lost answer, so the money leaves once.
 * The answers: invested; confirming (the provider has not finished: the order is read until it has, never sent again); the
 * reservation ran out (nothing was taken, start again); short of money; or the Hub's own sentence.
 */
export function ReviewScreen(props: ReviewScreenProps) {
  const { orderId } = props;
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [final, setFinal] = useState<CapitalOrder | null>(null);
  const [ranOut, setRanOut] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const key = useRef(newRequestKey());
  const sent = useRef(false);
  const inFlight = useRef<Promise<Settled> | null>(null);

  const order = useQuery(
    {
      ...orderQuery(owner, orderId),
      refetchInterval: (query) => (query.state.data?.status === 'confirming' ? POLL_MS : false),
    },
    queryClient,
  );
  const current = final ?? order.data ?? null;

  useEffect(() => {
    if (current?.status !== 'reserved') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [current?.status]);

  if (order.isPending && !final) {
    return (
      <ScreenFrame title="Review" onBack={props.onBack} gap={GAP} idPrefix="capital-review" testID="capital-review-screen">
        <LoadingView label="Loading your reservation" testID="capital-review-loading">
          <Skeleton height={220} radius={radius.card} />
        </LoadingView>
      </ScreenFrame>
    );
  }
  if (!current) {
    const error = order.error;
    return (
      <ScreenFrame title="Review" onBack={props.onBack} gap={GAP} idPrefix="capital-review" testID="capital-review-screen">
        <ErrorState
          testID="capital-review-error"
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title="We could not load this"
          message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
          onRetry={() => void order.refetch()}
        />
      </ScreenFrame>
    );
  }

  const q = current.quote;
  const expired = ranOut || current.status === 'expired' || (current.status === 'reserved' && reservationRanOut(current.expiresAt, now));

  if (current.status === 'invested' || current.status === 'matured') {
    return (
      <ScreenFrame title="Capital" gap={GAP} idPrefix="capital-review" testID="capital-review-screen">
        <ResultBlock icon="TrendingUp" tone="in" title={`${formatMoney(current.totalKobo)} invested`} line={current.productName} testID="capital-invested-result" />
        <Button testID="capital-view" label="View investment" onPress={() => props.onOpenOrder(current.id)} size="lg" full />
        <Button testID="capital-done" label={WORDS.done} variant="secondary" onPress={props.onDone} size="lg" full />
      </ScreenFrame>
    );
  }
  if (current.status === 'confirming' || current.status === 'review') {
    return (
      <ScreenFrame title="Capital" gap={GAP} idPrefix="capital-review" testID="capital-review-screen">
        <ResultBlock
          icon="Clock"
          tone="accent"
          title="Still confirming"
          line="We are waiting for the provider to finish. Your money is safe; you will not be charged twice."
          testID="capital-confirming"
        />
        <Button testID="capital-done" label={WORDS.done} onPress={props.onDone} size="lg" full />
      </ScreenFrame>
    );
  }
  if (expired || current.status === 'rejected' || current.status === 'cancelled' || current.status === 'failed') {
    return (
      <ScreenFrame title="Review" onBack={props.onBack} gap={GAP} idPrefix="capital-review" testID="capital-review-screen">
        <ResultBlock
          icon="Clock"
          tone="danger"
          title={expired ? 'This reservation ran out' : 'This was not taken'}
          line={problem ?? (expired ? 'Nothing was taken from your wallet. Start again to invest.' : (current.note ?? 'Nothing was taken from your wallet.'))}
          testID="capital-ended-result"
        />
        <Button testID="capital-again" label="Start again" onPress={() => props.onStartAgain(current.productId)} size="lg" full />
      </ScreenFrame>
    );
  }

  const submit = async (credential: Credential): Promise<Settled> => {
    const earlierTry = sent.current;
    sent.current = true;
    const outcome = await confirmOrder({ id: current.id, key: key.current, ...credential });
    return settleOutcome(outcome, {
      earlierTry,
      nothingMoved: () => {
        sent.current = earlierTry;
      },
      done: (o) => {
        setPinOpen(false);
        setFinal(o);
        void queryClient.invalidateQueries({ queryKey: ['capital'] });
        void queryClient.invalidateQueries({ queryKey: ['money'] });
      },
      expired: () => {
        setPinOpen(false);
        setRanOut(true);
      },
      short: (_k, message) => {
        setPinOpen(false);
        setProblem(message || 'You need more money in your wallet for this.');
      },
      refused: (message) => {
        setPinOpen(false);
        setProblem(message || 'We could not invest this. Nothing was taken.');
      },
      setLocked: setLockedUntil,
      noPin: () => {
        setPinOpen(false);
        props.onSetPin();
      },
      noWallet: () => {
        setPinOpen(false);
        entry.open();
      },
    });
  };
  // One request at a time: a second submit while one runs is that same request, never another.
  const run = (credential: Credential): Promise<Settled> => {
    if (inFlight.current) return inFlight.current;
    const running = submit(credential).finally(() => {
      inFlight.current = null;
    });
    inFlight.current = running;
    return running;
  };

  return (
    <>
      <ScreenFrame title="Review" onBack={props.onBack} gap={GAP} idPrefix="capital-review" testID="capital-review-screen">
        <Text variant="title" testID="capital-review-name">
          {current.productName}
        </Text>
        <Text variant="secondary" tone="textMuted" testID="capital-countdown" accessibilityLiveRegion="polite">
          {`Held for you for ${countdownText(current.expiresAt, now)}`}
        </Text>
        <GroupedList testID="capital-review-figures">
          <KeyValueRow label="You invest" value={formatMoney(current.amountKobo)} />
          {q?.lockedRate !== null && q?.lockedRate !== undefined ? <KeyValueRow label="Rate, locked" value={rateText(q.lockedRate)} /> : null}
          {q?.tenorDays !== null && q?.tenorDays !== undefined ? <KeyValueRow label="Term" value={termText(q.tenorDays)} /> : null}
          {q?.allocatedShares !== null && q?.allocatedShares !== undefined ? <KeyValueRow label="Shares" value={String(q.allocatedShares)} /> : null}
          {q?.offerPriceKobo !== null && q?.offerPriceKobo !== undefined ? <KeyValueRow label="Price a share" value={formatMoney(q.offerPriceKobo)} /> : null}
          {q?.unallocatedKobo ? <KeyValueRow label="Left over, not taken" value={formatMoney(q.unallocatedKobo)} /> : null}
          {q?.brokerageFeeKobo ? <KeyValueRow label="Brokerage fee" value={formatMoney(q.brokerageFeeKobo)} /> : null}
          {q?.crossDealFeeKobo ? <KeyValueRow label="Cross-deal fee" value={formatMoney(q.crossDealFeeKobo)} /> : null}
          {q?.deductibles.map((d) => <KeyValueRow key={d.name} label={d.name} value={deductibleText(d)} />)}
          {q?.penaltyRate ? <KeyValueRow label="If you leave early" value={`${String(Math.round(q.penaltyRate * 10_000) / 100)}% of interest`} /> : null}
          {current.holding?.maturesAt ? <KeyValueRow label="Ends" value={dayText(current.holding.maturesAt)} /> : null}
          {current.feeKobo > 0 ? <KeyValueRow label="WAWU's fee" value={formatMoney(current.feeKobo)} /> : null}
          <KeyValueRow label="From your wallet" value={formatMoney(current.totalKobo)} />
        </GroupedList>
        <Text variant="secondary" tone="textMuted" testID="capital-review-note">
          {WORDS.notAPromise}
        </Text>
        {problem ? <Banner testID="capital-review-problem" tone="danger" title="We could not invest this" body={problem} /> : null}
        <Button testID="capital-confirm" label={`Invest ${formatMoney(current.totalKobo)}`} onPress={() => setPinOpen(true)} size="lg" full />
      </ScreenFrame>
      <PayPinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={{ totalKobo: current.totalKobo, purpose: `investing in ${current.productName}` }}
        run={run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setPinOpen(false);
          props.onForgotPin();
        }}
        lockedUntil={lockedUntil}
      />
    </>
  );
}
