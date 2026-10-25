import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { Money } from '@/components/Money';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { font, radius, space } from '@/theme';

import { plansQuery } from './purchaseApi';
import { QuoteBreakdown } from './planParts';
import { naira, nextTiers, pinPurposeOf } from './purchaseModel';
import { usePlanPurchase } from './usePlanPurchase';

const HEAD = { title: 24, tracking: -0.03 } as const;
const MARK = 72;

export type ProductsFullSheetProps = {
  onClose: () => void;
  /** "Upgrade instead": VF5 (VF5b). Drawn only while the Hub lists a tier above the one held that leaves room. */
  onUpgrade: () => void;
  /** The way to take something down: My content (M28). Not drawn without it. */
  onOpenLibrary?: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** No PIN is set yet: A9 sets one and comes back. */
  onSetPin: () => void;
  /** Add ₦X (W15): opens Add money with what is missing. */
  onAddMoney: (shortfallKobo: number) => void;
};

/**
 * VF13 · You have used N of N. At the limit a person adds five more products for the Hub's price (`GET /plans` `extraProducts`, R-65)
 * or moves up a tier. "Add 5" is `POST /plans/purchases` `kind: extra_products` (TIER-04) through the same one-attempt payment as
 * the tier (`usePlanPurchase`): a fresh quote at every tap, the shared PIN sheet, one `Idempotency-Key`, so one tap pair is one debit.
 * A short wallet turns the button into "Add ₦X" (the pay sheets' own, WALLET-05), which opens Add money. The dollar offer (VF13a) is
 * not built at launch (R-16).
 *
 * RELEASE-02 second pass (M-3, L-p2-12): the sheet is worded from the tier and the Hub's limits and never tells a person who holds a tier to
 * "Get verified". "Upgrade instead" is drawn only while the Hub lists a higher tier that leaves room (none for the top tier), and "Open library"
 * is the way to take something down. The offer is a payment review, so it draws the fee as its parts and the total (BRIEF rules 3 to 5): the
 * price, the Bank charge, WAWU's fee and the Total from the quote, even at ₦0, with the button and the PIN sheet showing the total. The pack
 * keeps its wallet path until IAP-02 moves it and the tiers to the app stores (R-86; lead ruling, 25 Oct 2026).
 */
export function ProductsFullSheet({ onClose, onUpgrade, onOpenLibrary, onForgotPin, onSetPin, onAddMoney }: ProductsFullSheetProps) {
  const owner = useSessionAccount(undefined);
  const mine = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const plans = useQuery(plansQuery(owner), queryClient);
  const purchase = usePlanPurchase({ kind: 'extra_products' }, { onSetPin });
  const { quote, done } = purchase;
  const extra = plans.data?.extraProducts ?? null;
  const used = mine.data?.productsUsed ?? null;
  const allowed = mine.data?.productsAllowed ?? null;

  let body;
  if ((mine.isError && !mine.data) || (plans.isError && !plans.data)) {
    const error = mine.error ?? plans.error;
    body = (
      <ErrorState
        testID="full-error"
        icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your products"
        message={isApiError(error) && error.message ? error.message : 'Check your connection and try again.'}
        onRetry={() => {
          void mine.refetch();
          void plans.refetch();
        }}
      />
    );
  } else if (done) {
    const now = done.productsAllowed ?? quote?.productsAllowedAfter ?? null;
    body = (
      <View testID="full-added" style={styles.result}>
        <IconTile icon="Plus" tone="accent" size={MARK} strokeWidth={2.2} />
        <Text variant="display" accessibilityRole="header" testID="full-added-title" style={[styles.centre, { fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }]}>
          {`${done.products ?? extra?.count ?? 0} more products added`}
        </Text>
        {now !== null ? (
          <Text variant="body" tone="textSecondary" testID="full-added-line" style={styles.centre}>
            {`You can publish up to ${now} products now.`}
          </Text>
        ) : null}
        <Button testID="full-done" label="Done" full onPress={onClose} />
      </View>
    );
  } else if (used === null || allowed === null || !extra || !purchase.looked) {
    body = (
      <View testID="full-loading" style={styles.stack}>
        <Skeleton height={32} width="60%" radius={radius.tile} />
        <Skeleton height={72} radius={radius.card} />
        <Skeleton height={54} radius={radius.chip} />
      </View>
    );
  } else {
    const count = extra.count;
    const total = quote?.totalKobo ?? null;
    const up = nextTiers(plans.data?.tiers ?? [], mine.data?.tier?.id ?? null, mine.data?.extraProducts ?? 0, used).length > 0;
    body = (
      <>
        <View>
          <Text variant="display" accessibilityRole="header" testID="full-title" style={{ fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }}>
            {`You have used ${used} of ${allowed}`}
          </Text>
          <Text variant="body" tone="textSecondary" testID="full-line" style={styles.blurb}>
            {up ? 'Add more products, or move up a tier.' : 'Add more products, or take something down.'}
          </Text>
        </View>
        <Card padded testID="full-offer">
          <View style={styles.offer}>
            <IconTile icon="Plus" tone="accent" size={44} />
            <View style={styles.offerWords}>
              <Text variant="body" style={font(700)}>
                {`Add ${count} more products`}
              </Text>
              <Text variant="secondary" tone="textMuted">
                Until your tier ends
              </Text>
            </View>
            <Money minorUnits={extra.priceMinor} currency={plans.data?.currency ?? 'NGN'} size={16} weight={700} decimals={extra.priceMinor % 100 !== 0} />
          </View>
        </Card>
        {quote ? <QuoteBreakdown quote={quote} prefix="full" /> : null}
        {purchase.short && quote ? (
          <Text variant="meta" tone="danger" testID="full-short" accessibilityLiveRegion="polite" style={styles.centre}>
            {`You need ${naira(quote.shortfallKobo ?? 0)} more in your wallet.`}
          </Text>
        ) : null}
        {purchase.failure ? (
          <Text variant="meta" tone="danger" testID="full-failure" accessibilityLiveRegion="polite" style={styles.centre}>
            {purchase.failure}
          </Text>
        ) : null}
        {purchase.resend ? (
          <Text variant="meta" tone="textMuted" testID="full-resend" style={styles.centre}>
            Your last try got no answer. Paying again checks it first, so you are not charged twice.
          </Text>
        ) : null}
        {purchase.short && quote ? (
          <Button testID="full-add-money" label={`Add ${naira(quote.shortfallKobo ?? 0)}`} full onPress={() => onAddMoney(quote.shortfallKobo ?? 0)} />
        ) : (
          <Button
            testID="full-add"
            label={purchase.paying ? 'Paying...' : total !== null ? `Add ${count} for ${naira(total)}` : `Add ${count}`}
            full
            disabled={purchase.paying || quote === null}
            loading={purchase.busy}
            onPress={purchase.pay}
          />
        )}
        {up ? <Button testID="full-upgrade" label="Upgrade instead" variant="outline" full disabled={purchase.paying} onPress={onUpgrade} /> : null}
        {onOpenLibrary ? <Button testID="full-library" label="Open library" variant="outline" full disabled={purchase.paying} onPress={onOpenLibrary} /> : null}
        {purchase.quoteError ? (
          <Text variant="meta" tone="danger" testID="full-quote-error" style={styles.centre}>
            {isApiError(purchase.quoteError) && purchase.quoteError.message ? purchase.quoteError.message : 'We could not work out the price. Try again.'}
          </Text>
        ) : null}
      </>
    );
  }

  return (
    <>
      <BottomSheet visible onClose={onClose} label="All products used" dismissible={!purchase.paying}>
        {body}
      </BottomSheet>
      {quote ? (
        <PayPinSheet
          visible={purchase.pinOpen}
          onClose={purchase.closePin}
          approval={{ totalKobo: quote.totalKobo, purpose: pinPurposeOf({ kind: 'extra_products' }, null, quote.products) }}
          run={purchase.run}
          unansweredLine={PAYMENT_UNANSWERED_LINE}
          onForgotPin={() => {
            purchase.closePin();
            onForgotPin();
          }}
          lockedUntil={purchase.lockedUntil}
        />
      ) : null}
      {purchase.notice ? <Toast message={purchase.notice} tone="alert" placement="top" lines={2} onHide={purchase.clearNotice} testID="full-notice" /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  blurb: { marginTop: space.xs },
  offer: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  offerWords: { flex: 1 },
  centre: { textAlign: 'center' },
  result: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
});
