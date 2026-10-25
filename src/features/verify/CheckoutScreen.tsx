import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { Money } from '@/components/Money';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { TierBadge } from '@/components/TierBadge';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { PointsFrame } from '@/features/points/PointsFrame';
import { font, radius, space, useWawu } from '@/theme';

import { CheckRow, MethodRow, QuoteBreakdown, TransferCard } from './planParts';
import { plansQuery } from './purchaseApi';
import { bumpLine, naira, payLabel, pinPurposeOf, shortLine, tierLine, TIER_WORDS } from './purchaseModel';
import { usePlanPurchase } from './usePlanPurchase';

const BODY_GAP = 12;

export type CheckoutScreenProps = {
  kind: 'tier' | 'renew' | 'upgrade';
  tierId: string;
  onBack: () => void;
  /** The Hub granted the tier: VF7 opens on the purchase. */
  onPaid: (purchaseId: string) => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back here. */
  onSetPin: () => void;
  /** Add money first (VF6a): opens W15 with what was missing, and returns here. */
  onAddMoney: (shortfallKobo: number) => void;
};

/**
 * VF6 · Checkout, with VF6a (wallet short), VF6b (bank transfer), VF6c (paying) and VF6d (payment failed). The tier, its price, its
 * length and products and the checkout offer are the Hub's (`GET /plans`); the figures under them (the price, the Bank charge, the
 * total, the wallet's balance) are the purchase's own quote, asked again at every Pay (V8), and Pay is the total the payer pays.
 * The payment is `usePlanPurchase`: one `Idempotency-Key` per attempt, the PIN through the shared PIN sheet, a lost answer sent again
 * as it was. Bank transfer is offered only when the wallet is short (POINTS-06's ruling, FIX-55; kept on the tier checkout by the lead on
 * 25 Oct 2026, because the Hub settles a transfer order from a covering wallet); the wallet's own account to send to is
 * the Hub's, given with the PIN. The fee is always drawn as its parts then the total (BRIEF rule 3; RELEASE-02 second pass M-1): the price, the
 * Bank charge, WAWU's fee and the Total, each from the quote, even when a part is 0. "No fee" is never drawn (rule 4). The board's Reference line is not drawn: the Hub serves none.
 */
export function CheckoutScreen({ kind, tierId, onBack, onPaid, onForgotPin, onSetPin, onAddMoney }: CheckoutScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const plans = useQuery(plansQuery(owner), queryClient);
  const tier = plans.data?.tiers.find((t) => t.id === tierId) ?? null;
  // An offer that adds to the amount paid starts unticked (lead ruling, S7 round 2): the person opts in, and Pay shows the tier's own
  // total until they do. The quote and the purchase carry whichever it is.
  const [bump, setBump] = useState(false);
  const offer = plans.data?.checkoutBump ?? null;
  const target = { kind, tierId, bump: bump && offer !== null && offer.priceMinor > 0 } as const;
  const purchase = usePlanPurchase(target, {
    onSetPin,
    onAdopt: (adopted) => {
      if ('bump' in adopted) setBump(adopted.bump);
    },
  });
  const { quote, waiting, done } = purchase;

  // The person comes back from Add money: what the wallet holds now is asked for again.
  const focused = useIsFocused();
  const wasFocused = useRef(focused);
  const { retryQuote } = purchase;
  useEffect(() => {
    if (focused && !wasFocused.current) retryQuote();
    wasFocused.current = focused;
  }, [focused, retryQuote]);

  // The Hub granted it: VF7.
  const { id: paidId } = done ?? { id: null };
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  });
  useEffect(() => {
    if (paidId) onPaidRef.current(paidId);
  }, [paidId]);

  const locked = purchase.paying || purchase.resend;
  const awaiting = waiting?.status === 'awaiting_transfer';

  let body;
  if (plans.isError && !plans.data) {
    body = (
      <ErrorState
        testID="checkout-error"
        icon={isApiError(plans.error) && plans.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load the tier"
        message={isApiError(plans.error) && plans.error.message ? plans.error.message : 'Check your connection and try again.'}
        onRetry={() => void plans.refetch()}
      />
    );
  } else if (!plans.data || !purchase.looked) {
    body = <CheckoutLoading />;
  } else if (!tier) {
    body = <ErrorState testID="checkout-none" icon="TriangleAlert" title="That tier is not on sale" message="Choose a tier again." onRetry={onBack} />;
  } else {
    body = (
      <>
        <Card padded testID="checkout-summary">
          <View style={styles.summary}>
            <TierBadge name={tier.name} />
            <Text variant="secondary" tone="textMuted" testID="checkout-line" style={styles.summaryLine}>
              {tierLine(tier)}
            </Text>
            {quote ? <Money minorUnits={quote.planKobo} size={16} weight={700} decimals={quote.planKobo % 100 !== 0} /> : <Skeleton width={64} height={18} />}
          </View>
        </Card>
        <View style={styles.group}>
          <Text variant="label" accessibilityRole="header">
            {TIER_WORDS.payWith.toUpperCase()}
          </Text>
          <View testID="checkout-methods" style={styles.methods}>
            <MethodRow
              testID="checkout-method-wallet"
              icon="Wallet"
              tone="accent"
              title={TIER_WORDS.wallet}
              subtitle={quote && quote.balanceKobo !== null ? `Balance ${naira(quote.balanceKobo)}` : undefined}
              on={purchase.method === 'wallet'}
              disabled={locked}
              onPress={() => purchase.setMethod('wallet')}
            />
            {purchase.transferOffered ? (
              <MethodRow
                testID="checkout-method-transfer"
                icon="Landmark"
                tone="neutral"
                title={TIER_WORDS.transfer}
                subtitle={TIER_WORDS.transferSub}
                on={purchase.method === 'transfer'}
                disabled={locked}
                onPress={() => purchase.setMethod('transfer')}
              />
            ) : null}
          </View>
        </View>
        {purchase.short && quote ? (
          <View testID="checkout-short" accessibilityLiveRegion="polite" style={[styles.note, { backgroundColor: colors.warningTint }]}>
            <Icon name="Wallet" size={22} color={colors.warning} />
            <View style={styles.noteWords}>
              <Text variant="body" style={font(700)}>
                Add money first
              </Text>
              <Text variant="secondary" tone="textSecondary">
                {shortLine(quote)}
              </Text>
              <View style={styles.noteButton}>
                <Button testID="checkout-add-money" label="Add money" size="card" onPress={() => onAddMoney(quote.shortfallKobo ?? 0)} />
              </View>
            </View>
          </View>
        ) : null}
        {offer && offer.priceMinor > 0 ? <CheckRow testID="checkout-bump" label={bumpLine(offer)} on={bump} disabled={locked} onPress={() => setBump((on) => !on)} /> : null}
        {purchase.failure ? (
          <View testID="checkout-failed" accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.note, { backgroundColor: colors.dangerTint }]}>
            <Icon name="CircleX" size={22} color={colors.danger} />
            <View style={styles.noteWords}>
              <Text variant="body" style={font(700)}>
                {"Payment didn't go through"}
              </Text>
              <Text variant="secondary" tone="textSecondary" testID="checkout-failed-line">
                {purchase.failure}
              </Text>
            </View>
          </View>
        ) : null}
        {purchase.resend ? (
          <Text variant="meta" tone="textMuted" testID="checkout-resend" style={styles.centre}>
            Your last try got no answer. Paying again checks it first, so you are not charged twice.
          </Text>
        ) : null}
        {quote ? (
          <QuoteBreakdown quote={quote} prefix="checkout" />
        ) : purchase.quoteError ? (
          <ErrorState
            testID="checkout-quote-error"
            icon="TriangleAlert"
            title="We couldn't work out the price"
            message={isApiError(purchase.quoteError) && purchase.quoteError.message ? purchase.quoteError.message : 'Check your connection and try again.'}
            onRetry={purchase.retryQuote}
          />
        ) : (
          <Skeleton testID="checkout-quote-loading" height={56} radius={radius.card} />
        )}
        {awaiting && waiting?.transfer ? (
          <>
            <TransferCard transfer={waiting.transfer} />
            <Text variant="meta" tone="textMuted" style={styles.centre}>
              Your tier starts when the money lands.
            </Text>
          </>
        ) : waiting ? (
          <Text variant="meta" tone="textMuted" testID="checkout-confirming" style={styles.centre}>
            {"We are confirming your payment. Don't pay again."}
          </Text>
        ) : null}
      </>
    );
  }

  const ready = plans.data !== undefined && purchase.looked && tier !== null;
  const foot = ready ? (
    awaiting ? (
      <Button testID="checkout-sent" label="I've sent it" full loading={purchase.checking} onPress={purchase.checkNow} />
    ) : (
      <Button
        testID="checkout-pay"
        label={purchase.paying ? TIER_WORDS.paying : quote ? payLabel(quote.totalKobo) : 'Pay'}
        full
        disabled={purchase.paying || quote === null || purchase.short}
        loading={purchase.busy}
        onPress={purchase.pay}
      />
    )
  ) : undefined;

  return (
    <>
      <PointsFrame title={TIER_WORDS.checkout} onBack={onBack} gap={BODY_GAP} foot={foot} testID="checkout-screen">
        {body}
      </PointsFrame>
      {quote && tier ? (
        <PayPinSheet
          visible={purchase.pinOpen}
          onClose={purchase.closePin}
          approval={{ totalKobo: quote.totalKobo, purpose: pinPurposeOf(target, tier.name, null) }}
          run={purchase.run}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            purchase.closePin();
            onForgotPin();
          }}
          lockedUntil={purchase.lockedUntil}
        />
      ) : null}
      {purchase.notice ? <Toast message={purchase.notice} tone="alert" placement="top" lines={2} onHide={purchase.clearNotice} testID="checkout-notice" /> : null}
    </>
  );
}

function CheckoutLoading() {
  return (
    <View testID="checkout-loading" accessibilityLabel="Loading the checkout" style={styles.loading}>
      <Skeleton height={64} radius={radius.card} />
      <Skeleton height={20} width="30%" />
      <Skeleton height={140} radius={radius.card} />
      <Skeleton height={56} radius={radius.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  summaryLine: { flex: 1 },
  group: { gap: space.sm },
  methods: { gap: space.sm },
  note: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card },
  noteWords: { flex: 1, gap: space.xs },
  noteButton: { alignSelf: 'flex-start', marginTop: space.sm },
  centre: { textAlign: 'center' },
  loading: { gap: BODY_GAP },
});
