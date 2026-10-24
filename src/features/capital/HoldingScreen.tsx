import { useQuery } from '@tanstack/react-query';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { formatMoney } from '@/components/Money';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { radius } from '@/theme';

import { orderQuery, transactionsQuery } from './api';
import { dayText, eventText, ORDER_STATUS, WORDS, withdrawBlockLine } from './model';
import { GAP, HoldingFigures } from './parts';

export type HoldingScreenProps = {
  orderId: string;
  onBack: () => void;
  onWithdraw: (id: string) => void;
  /** A reservation still held: its review. */
  onReview: (id: string) => void;
};

/**
 * One investment: where it stands, the provider's figures for it, its own movements, and Withdraw when the provider allows it.
 * The figures are read from the provider each time the screen opens; "expected at the end" is the provider's projection and the
 * screen says it is not a promise. A holding an admin has put on hold says so and offers nothing.
 */
export function HoldingScreen({ orderId, onBack, onWithdraw, onReview }: HoldingScreenProps) {
  const owner = useSessionAccount(undefined);
  const order = useQuery({ ...orderQuery(owner, orderId) }, queryClient);
  const moves = useQuery({ ...transactionsQuery(owner, orderId), enabled: Boolean(owner) && order.data?.status !== 'reserved' && order.isSuccess }, queryClient);

  if (order.isPending) {
    return (
      <ScreenFrame title="Investment" onBack={onBack} gap={GAP} idPrefix="capital-holding" testID="capital-holding-screen">
        <LoadingView label="Loading your investment" testID="capital-holding-loading">
          <Skeleton height={96} radius={radius.card} />
          <Skeleton height={220} radius={radius.card} />
        </LoadingView>
      </ScreenFrame>
    );
  }
  if (!order.data) {
    const error = order.error;
    return (
      <ScreenFrame title="Investment" onBack={onBack} gap={GAP} idPrefix="capital-holding" testID="capital-holding-screen">
        <ErrorState
          testID="capital-holding-error"
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title="We could not load this investment"
          message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
          onRetry={() => void order.refetch()}
        />
      </ScreenFrame>
    );
  }
  const o = order.data;
  const status = ORDER_STATUS[o.status];
  const blocked = withdrawBlockLine(o.withdrawBlockedBy);
  const open = o.status === 'invested' || o.status === 'matured';

  return (
    <ScreenFrame title={o.productName} titleLines={2} onBack={onBack} gap={GAP} idPrefix="capital-holding" testID="capital-holding-screen">
      <StatusPill label={status.label} tone={status.tone} testID="capital-holding-status" />
      {o.frozen ? <Banner testID="capital-holding-frozen" tone="warning" title="On hold" body="This investment is on hold. Contact support to continue." /> : null}
      <GroupedList testID="capital-holding-top">
        <KeyValueRow label="You invested" value={formatMoney(o.amountKobo)} />
        {o.feeKobo > 0 ? <KeyValueRow label="Our fee" value={formatMoney(o.feeKobo)} /> : null}
        {o.confirmedAt ? <KeyValueRow label="On" value={dayText(o.confirmedAt)} /> : null}
      </GroupedList>
      <HoldingFigures order={o} />
      {open && o.kind === 'fixed_return' ? (
        <Text variant="secondary" tone="textMuted" testID="capital-holding-note">
          {WORDS.notAPromise}
        </Text>
      ) : null}
      {moves.data && moves.data.items.length > 0 ? (
        <GroupedList testID="capital-moves">
          {moves.data.items.map((t) => (
            <KeyValueRow key={t.id} label={`${eventText(t.event)}${t.occurredAt ? ` · ${dayText(t.occurredAt)}` : ''}`} value={formatMoney(t.amountKobo)} />
          ))}
        </GroupedList>
      ) : null}
      {o.status === 'reserved' ? <Button testID="capital-continue" label="Continue" onPress={() => onReview(o.id)} size="lg" full /> : null}
      {o.canWithdraw ? <Button testID="capital-withdraw" label={WORDS.withdraw} onPress={() => onWithdraw(o.id)} size="lg" full /> : null}
      {!o.canWithdraw && open && blocked ? (
        <Text variant="secondary" tone="textMuted" testID="capital-withdraw-blocked">
          {blocked}
        </Text>
      ) : null}
    </ScreenFrame>
  );
}
