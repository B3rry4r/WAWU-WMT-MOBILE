import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { radius, space } from '@/theme';

import { plansQuery } from './purchaseApi';
import { nextTiers } from './purchaseModel';

const HEAD = { title: 24, tracking: -0.03 } as const;

export type ProductsFullSheetProps = {
  onClose: () => void;
  /** "Upgrade instead": VF5 (VF5b). Drawn only while the Hub lists a tier above the one held that leaves room. */
  onUpgrade: () => void;
  /** The way to take something down: My content (M28). Not drawn without it. */
  onOpenLibrary?: () => void;
};

/**
 * VF13 · You have used N of N. At the limit of a tier's products the sheet says so with the Hub's own count (`GET /me/tier`), and offers the
 * two ways on: "Upgrade instead" to a tier above the one held (the tiers the Hub lists in `GET /plans` that cost more and leave room, none
 * for the top tier) and the way to take something down (My content). It is worded from the tier and the Hub's limits, and never tells a
 * person who holds a tier to "Get verified" (RELEASE-02 second pass, M-3, L-p2-12).
 *
 * The board's "Add 5 more products" is not drawn. It is an in-app digital unlock, so it follows R-86 (the app stores, IAP-02) and the
 * app draws no wallet path for it (Default (lead), owner may override, 25 Oct 2026). The dollar offer (VF13a) is not built at launch (R-16).
 */
export function ProductsFullSheet({ onClose, onUpgrade, onOpenLibrary }: ProductsFullSheetProps) {
  const owner = useSessionAccount(undefined);
  const mine = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const plans = useQuery(plansQuery(owner), queryClient);
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
  } else if (!mine.data || !plans.data || used === null || allowed === null) {
    body = (
      <View testID="full-loading" style={styles.stack}>
        <Skeleton height={32} width="60%" radius={radius.tile} />
        <Skeleton height={20} width="80%" radius={radius.chip} />
        <Skeleton height={54} radius={radius.chip} />
      </View>
    );
  } else {
    const up = nextTiers(plans.data.tiers, mine.data.tier?.id ?? null, mine.data.extraProducts, used).length > 0;
    body = (
      <>
        <View>
          <Text variant="display" accessibilityRole="header" testID="full-title" style={{ fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }}>
            {`You have used ${used} of ${allowed}`}
          </Text>
          <Text variant="body" tone="textSecondary" testID="full-line" style={styles.blurb}>
            {up ? 'Move up a tier, or take something down.' : 'Take something down to make room for a new one.'}
          </Text>
        </View>
        {up ? <Button testID="full-upgrade" label="Upgrade instead" full onPress={onUpgrade} /> : null}
        {onOpenLibrary ? <Button testID="full-library" label="Open library" variant="outline" full onPress={onOpenLibrary} /> : null}
      </>
    );
  }

  return (
    <BottomSheet visible onClose={onClose} label="All products used">
      {body}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  blurb: { marginTop: space.xs },
});
