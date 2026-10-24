import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TierBadge } from '@/components/TierBadge';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { PointsFrame } from '@/features/points/PointsFrame';
import { heldSubscription } from '@/features/store/buy';
import { RestoreRow, SaidBanner, StoreUnready } from '@/features/store/StoreParts';
import { buyLabel } from '@/features/store/model';
import { useStoreBuyer, useStoreCatalog } from '@/features/store/useStore';
import { font, radius, space } from '@/theme';

import { plansQuery } from './purchaseApi';
import { tierLine, TIER_WORDS } from './purchaseModel';

const BODY_GAP = 12;

export type CheckoutScreenProps = {
  kind: 'tier' | 'renew' | 'upgrade';
  tierId: string;
  onBack: () => void;
  /** The store took the payment and the Hub granted the tier: VF7 opens on the tier. */
  onPaid: (tierId: string) => void;
};

/**
 * VF6 · Checkout. A tier is bought in the store sheet (R-86): this screen names the tier, what it gives and the store's own price, and Buy
 * opens the sheet. The Hub checks the purchase with the store before it grants the tier, and the store transaction is finished only after
 * that. The store renews the tier until the person cancels there, and an upgrade is worked out by the store, so no sum is made here. There
 * is no PIN, no wallet and no bank charge on this screen. Restore purchases brings back a tier already bought on this store account.
 */
export function CheckoutScreen({ kind, tierId, onBack, onPaid }: CheckoutScreenProps) {
  const owner = useSessionAccount(undefined);
  const plans = useQuery({ ...plansQuery(owner), retry: false }, queryClient);
  const tier = plans.data?.tiers.find((t) => t.id === tierId) ?? null;
  const store = useStoreCatalog(['tier']);
  const buyer = useStoreBuyer(store.catalog);
  const item = store.state.kind === 'ready' ? (store.state.items.find((i) => i.product.grants.tierId === tierId) ?? null) : null;

  // The Hub granted it: VF7.
  const grantedTier = buyer.granted ? (buyer.granted.grant.tierId ?? tierId) : null;
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  });
  useEffect(() => {
    if (grantedTier) onPaidRef.current(grantedTier);
  }, [grantedTier]);
  // A tier bought earlier and brought back by Restore purchases also lands on VF7.
  const restoredTier = buyer.recovered.find((p) => p.kind === 'tier')?.grant.tierId ?? null;
  useEffect(() => {
    if (restoredTier) onPaidRef.current(restoredTier);
  }, [restoredTier]);

  const buy = async () => {
    if (!item) return;
    // An upgrade replaces the tier held: Google Play needs that subscription's token to change it rather than add another.
    const tierIds = (store.catalog?.products ?? []).filter((p) => p.kind === 'tier').map((p) => p.storeProductId);
    const replace = kind === 'upgrade' ? await heldSubscription(tierIds.filter((id) => id !== item.product.storeProductId)) : null;
    await buyer.buy(item, { replace });
  };

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
  } else if (!plans.data || store.state.kind === 'loading') {
    body = <CheckoutLoading />;
  } else if (!tier) {
    body = <ErrorState testID="checkout-none" icon="TriangleAlert" title="That tier is not on sale" message="Choose a tier again." onRetry={onBack} />;
  } else if (store.state.kind !== 'ready') {
    body = <StoreUnready state={store.state} onRetry={store.refetch} testID="checkout" />;
  } else if (!item) {
    body = <ErrorState testID="checkout-none" icon="TriangleAlert" title="That tier is not on sale" message="Your store does not have it right now. Choose a tier again." onRetry={onBack} />;
  } else {
    body = (
      <>
        <Card padded testID="checkout-summary">
          <View style={styles.summary}>
            <TierBadge name={tier.name} />
            <Text variant="secondary" tone="textMuted" testID="checkout-line" style={styles.summaryLine}>
              {tierLine(tier)}
            </Text>
            <Text variant="body" testID="checkout-price" style={[font(700), styles.price]}>
              {item.price}
            </Text>
          </View>
        </Card>
        <Text variant="meta" tone="textMuted" testID="checkout-renews" style={styles.centre}>
          {kind === 'upgrade' ? 'The store works out what moving up costs, and renews this tier until you cancel there.' : 'The store renews this tier until you cancel there.'}
        </Text>
        <SaidBanner said={buyer.said} testID="checkout-said" />
        <RestoreRow buyer={buyer} testID="checkout-restore" />
      </>
    );
  }

  const verb = kind === 'renew' ? 'Renew' : kind === 'upgrade' ? 'Upgrade' : 'Buy';
  const foot = item ? (
    <Button testID="checkout-pay" label={buyer.busy ? 'Buying...' : buyLabel(item, verb)} full loading={buyer.busy} disabled={buyer.busy} onPress={() => void buy()} />
  ) : undefined;

  return (
    <PointsFrame title={TIER_WORDS.checkout} onBack={onBack} gap={BODY_GAP} foot={foot} testID="checkout-screen">
      {body}
    </PointsFrame>
  );
}

function CheckoutLoading() {
  return (
    <View testID="checkout-loading" accessibilityLabel="Loading the checkout" style={styles.loading}>
      <Skeleton height={64} radius={radius.card} />
      <Skeleton height={20} width="60%" />
      <Skeleton height={56} radius={radius.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  summaryLine: { flex: 1 },
  price: { fontSize: 16 },
  centre: { textAlign: 'center' },
  loading: { gap: BODY_GAP },
});
