import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { buyLabel } from '@/features/store/model';
import { SaidBanner, StoreUnready } from '@/features/store/StoreParts';
import { useStoreBuyer, useStoreCatalog } from '@/features/store/useStore';
import { font, radius, space } from '@/theme';

import { plansQuery } from './purchaseApi';
import { nextTiers, packOffered } from './purchaseModel';

const HEAD = { title: 24, tracking: -0.03 } as const;
const MARK = 72;

export type ProductsFullSheetProps = {
  onClose: () => void;
  /** "Upgrade instead": VF5 (VF5b). Drawn only while the Hub lists a tier above the one held that leaves room. */
  onUpgrade: () => void;
  /** The way to take something down: My content (M28). Not drawn without it. */
  onOpenLibrary?: () => void;
};

/**
 * VF13 · You have used N of N. At the limit of a tier's products the sheet says so with the Hub's own count (`GET /me/tier`), and offers the
 * ways on: "Add 5 more products", "Upgrade instead" to a tier above the one held (the tiers the Hub lists in `GET /plans` that cost more and
 * leave room, none for the top tier) and the way to take something down (My content). It is worded from the tier and the Hub's limits, and
 * never tells a person who holds a tier to "Get verified" (RELEASE-02 second pass, M-3, L-p2-12).
 *
 * "Add 5 more products" (IAP-03, R-65) is an in-app digital unlock, so it is bought in the store sheet with the same parts as points and
 * credits (`useStoreCatalog`, `useStoreBuyer`, R-86): the Hub's upload-pack product (`kind: extra_products`, the count it adds), the store's own
 * price in the person's own currency, and the Hub checks the purchase with the store before it adds the products. While the store is
 * loading there is no price, never a wrong one; a store that is not open, or has no such pack, draws no offer (R-47). The offer is drawn
 * only when the Hub would sell it (`packOffered`: a running tier, and the pack lifts the limit), never to a person with only a tick or no tier,
 * whom the Hub refuses after the store has taken the payment (F1). The wallet is not used and no naira figure is drawn. The dollar offer
 * (VF13a) is not built at launch (R-16).
 */
export function ProductsFullSheet({ onClose, onUpgrade, onOpenLibrary }: ProductsFullSheetProps) {
  const owner = useSessionAccount(undefined);
  const mine = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const plans = useQuery(plansQuery(owner), queryClient);
  const store = useStoreCatalog(['extra_products']);
  const buyer = useStoreBuyer(store.catalog);
  const used = mine.data?.productsUsed ?? null;
  const allowed = mine.data?.productsAllowed ?? null;
  // What the person could publish when the store sheet opened, so the result never says a count from before the grant.
  const [before, setBefore] = useState<number | null>(null);
  const pack = store.state.kind === 'ready' ? (store.state.items[0] ?? null) : null;

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
  } else if (buyer.granted) {
    const added = buyer.granted.grant.extraProducts ?? 0;
    const now = allowed !== null && before !== null && allowed >= before + added ? allowed : null;
    body = (
      <View testID="full-added" style={styles.result}>
        <IconTile icon="Plus" tone="accent" size={MARK} strokeWidth={2.2} />
        <Text variant="display" accessibilityRole="header" testID="full-added-title" style={[styles.centre, { fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }]}>
          {added > 0 ? `${added} more products added` : 'More products added'}
        </Text>
        {now !== null ? (
          <Text variant="body" tone="textSecondary" testID="full-added-line" style={styles.centre}>
            {`You can publish up to ${now} products now.`}
          </Text>
        ) : null}
        <Button testID="full-done" label="Done" full onPress={onClose} />
      </View>
    );
  } else if (!mine.data || !plans.data || used === null || allowed === null) {
    body = (
      <View testID="full-loading" style={styles.stack}>
        <Skeleton height={32} width="60%" radius={radius.tile} />
        <Skeleton height={72} radius={radius.card} />
        <Skeleton height={54} radius={radius.chip} />
      </View>
    );
  } else {
    const count = pack?.product.grants.extraProducts ?? 0;
    const running = mine.data.state === 'active' || mine.data.state === 'ending';
    // The pack only where the Hub would sell it; `offer` is the product when it is drawn.
    const offer = pack !== null && count > 0 && packOffered(mine.data, count) ? pack : null;
    const up = nextTiers(plans.data.tiers, mine.data.tier?.id ?? null, mine.data.extraProducts, used).length > 0;
    body = (
      <>
        <View>
          <Text variant="display" accessibilityRole="header" testID="full-title" style={{ fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }}>
            {`You have used ${used} of ${allowed}`}
          </Text>
          <Text variant="body" tone="textSecondary" testID="full-line" style={styles.blurb}>
            {offer ? (up ? 'Add more products, or move up a tier.' : 'Add more products, or take something down.') : up ? 'Move up a tier, or take something down.' : 'Take something down to make room for a new one.'}
          </Text>
        </View>
        {running && store.state.kind === 'loading' ? <Skeleton testID="full-offer-loading" height={72} radius={radius.card} /> : null}
        {offer ? (
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
              <Text variant="body" testID="full-offer-price" style={font(700)}>
                {offer.price}
              </Text>
            </View>
          </Card>
        ) : null}
        {running && store.state.kind !== 'loading' && store.state.kind !== 'ready' ? <StoreUnready state={store.state} onRetry={store.refetch} testID="full-store" /> : null}
        <SaidBanner said={buyer.said} testID="full-said" />
        {offer ? (
          <Button
            testID="full-add"
            label={buyer.busy ? 'Buying...' : buyLabel(offer, `Add ${count}`)}
            full
            loading={buyer.busy}
            disabled={buyer.busy}
            onPress={() => {
              setBefore(allowed);
              void buyer.buy(offer);
            }}
          />
        ) : null}
        {up ? <Button testID="full-upgrade" label="Upgrade instead" variant="outline" full disabled={buyer.busy} onPress={onUpgrade} /> : null}
        {onOpenLibrary ? <Button testID="full-library" label="Open library" variant="outline" full disabled={buyer.busy} onPress={onOpenLibrary} /> : null}
      </>
    );
  }

  return (
    <BottomSheet visible onClose={onClose} label="All products used" dismissible={!buyer.busy}>
      {body}
    </BottomSheet>
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
