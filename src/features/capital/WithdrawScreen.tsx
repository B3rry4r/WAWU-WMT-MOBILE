import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

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

import { orderQuery, previewQuery, withdrawOrder, type CapitalOrder } from './api';
import { payoutLine, WORDS } from './model';
import { GAP, ResultBlock, settleOutcome } from './parts';

export type WithdrawScreenProps = {
  orderId: string;
  onBack: () => void;
  onDone: () => void;
  onForgotPin: () => void;
  onSetPin: () => void;
};

/**
 * Withdraw a fixed return: what leaving now pays, as the provider works it out (the interest so far, the share taken for leaving
 * early, the deductions, the payout), then the PIN. Starting a payout is safe to repeat, and the key stays across a retry. The payout
 * lands in the wallet when the provider settles it; until then the investment says "Paying out".
 */
export function WithdrawScreen({ orderId, onBack, onDone, onForgotPin, onSetPin }: WithdrawScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const order = useQuery({ ...orderQuery(owner, orderId) }, queryClient);
  const preview = useQuery({ ...previewQuery(owner, orderId) }, queryClient);
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [final, setFinal] = useState<CapitalOrder | null>(null);
  const key = useRef(newRequestKey());
  const sent = useRef(false);
  const inFlight = useRef<Promise<Settled> | null>(null);

  if (final) {
    return (
      <ScreenFrame title="Withdraw" gap={GAP} idPrefix="capital-withdraw" testID="capital-withdraw-screen">
        <ResultBlock
          icon="Banknote"
          tone="in"
          title="Your payout is on its way"
          line="It lands in your wallet when the provider settles it. Your investment shows where it stands."
          testID="capital-withdraw-result"
        />
        <Button testID="capital-withdraw-done" label={WORDS.done} onPress={onDone} size="lg" full />
      </ScreenFrame>
    );
  }
  if (preview.isPending || order.isPending) {
    return (
      <ScreenFrame title="Withdraw" onBack={onBack} gap={GAP} idPrefix="capital-withdraw" testID="capital-withdraw-screen">
        <LoadingView label="Working out your payout" testID="capital-withdraw-loading">
          <Skeleton height={200} radius={radius.card} />
        </LoadingView>
      </ScreenFrame>
    );
  }
  if (!preview.data || !order.data) {
    const error = preview.error ?? order.error;
    const unavailable = isApiError(error) && error.code === 'withdrawal_not_available';
    return (
      <ScreenFrame title="Withdraw" onBack={onBack} gap={GAP} idPrefix="capital-withdraw" testID="capital-withdraw-screen">
        <ErrorState
          testID="capital-withdraw-error"
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title={unavailable ? 'This cannot be withdrawn right now' : 'We could not work out your payout'}
          message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
          onRetry={unavailable ? undefined : () => void preview.refetch()}
        />
      </ScreenFrame>
    );
  }

  const p = preview.data;
  const o = order.data;
  const submit = async (credential: Credential): Promise<Settled> => {
    const earlierTry = sent.current;
    sent.current = true;
    const outcome = await withdrawOrder({ id: o.id, key: key.current, ...credential });
    return settleOutcome(outcome, {
      earlierTry,
      nothingMoved: () => {
        sent.current = earlierTry;
      },
      done: (after) => {
        setPinOpen(false);
        setFinal(after);
        void queryClient.invalidateQueries({ queryKey: ['capital'] });
        void queryClient.invalidateQueries({ queryKey: ['money'] });
      },
      expired: () => setPinOpen(false),
      short: () => setPinOpen(false),
      refused: (message) => {
        setPinOpen(false);
        setProblem(message || 'We could not start this payout. Nothing was changed.');
      },
      setLocked: setLockedUntil,
      noPin: () => {
        setPinOpen(false);
        onSetPin();
      },
      noWallet: () => {
        setPinOpen(false);
        entry.open();
      },
    });
  };
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
      <ScreenFrame title="Withdraw" onBack={onBack} gap={GAP} idPrefix="capital-withdraw" testID="capital-withdraw-screen">
        <Text variant="title" testID="capital-withdraw-name">
          {o.productName}
        </Text>
        <GroupedList testID="capital-withdraw-figures">
          <KeyValueRow label="You invested" value={formatMoney(o.amountKobo)} />
          <KeyValueRow label="Interest so far" value={formatMoney(p.grossInterestKobo)} />
          {p.penaltyKobo > 0 ? <KeyValueRow label="Share taken for leaving early" value={`−${formatMoney(p.penaltyKobo)}`} /> : null}
          {p.deductionsKobo > 0 ? <KeyValueRow label="Deductions" value={`−${formatMoney(p.deductionsKobo)}`} /> : null}
          <KeyValueRow label="You get" value={formatMoney(p.netPayoutKobo)} />
        </GroupedList>
        <Text variant="secondary" tone="textMuted" testID="capital-withdraw-line">
          {payoutLine(p.penaltyRate > 0)}
        </Text>
        {problem ? <Banner testID="capital-withdraw-problem" tone="danger" title="We could not start this payout" body={problem} /> : null}
        <Button testID="capital-withdraw-confirm" label={`Withdraw ${formatMoney(p.netPayoutKobo)}`} onPress={() => setPinOpen(true)} size="lg" full />
      </ScreenFrame>
      <PayPinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={{ purpose: `Withdraw from ${o.productName}` }}
        run={run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setPinOpen(false);
          onForgotPin();
        }}
        lockedUntil={lockedUntil}
      />
    </>
  );
}
