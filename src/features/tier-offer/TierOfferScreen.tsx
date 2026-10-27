import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { tierItemOf } from '@/features/store/model';
import { StoreUnready } from '@/features/store/StoreParts';
import { useStoreCatalog } from '@/features/store/useStore';
import { TierCard } from '@/features/verify/TiersScreen';
import { plansQuery } from '@/features/verify/purchaseApi';
import { TIER_WORDS } from '@/features/verify/purchaseModel';
import { font, layout, radius, space, useWawu } from '@/theme';

import { settleTierOffer } from './offerStep';

const HEAD = { title: 26, tracking: -0.03, leading: 1.15 } as const;
const BAR = { height: 56 } as const;
const CLOSE = 44;

export type TierOfferScreenProps = {
  /** The admin setting "Show the close button on the tier offer": true draws the X (top right), false a "Not now" button at the bottom. One of the two is always there. */
  closeButton: boolean;
  /** The X, or Not now: on to Home. */
  onClose: () => void;
  /** A tier's Subscribe: the store checkout (VF6) with that tier, where Buy opens the store sheet (R-86). The same for everyone, whatever currency they are billed in. */
  onSubscribe: (tierId: string) => void;
};

/**
 * The tier offer (TIER-OFFER, R-94): right after sign-up, before Home, the three tiers as VF5 draws them (the same card), each with what it gives
 * and its own Subscribe. In this build every tier is bought in the store sheet (R-86): the tiers on offer are the ones the Hub sells in this phone's
 * store (`GET /store/products`) joined to what each gives (`GET /plans`: its length, products and points), and the price on each is the store's own,
 * in the person's own currency; none is written here, and the Hub's naira figure is never drawn. Subscribe opens the store checkout (VF6) with that
 * tier, the one the tiers sheet opens, where Buy opens the store sheet. There is no wallet, PIN or bank charge on the way. It always has a way out and
 * it is never hidden or faint: the close X at the top right (a 44 round button, the full-contrast icon, "Close" to a screen reader), or, when an admin
 * switched the X off, a "Not now" button at the foot. The way out stays through loading, an error and a store that is not open, so no state of this
 * screen is a dead end.
 */
export function TierOfferScreen({ closeButton, onClose, onSubscribe }: TierOfferScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const owner = useSessionAccount(undefined);
  const plans = useQuery(plansQuery(owner), queryClient);
  const store = useStoreCatalog(['tier']);
  // Drawn once is enough: the Hub is told as it appears, so closing the app on this screen never brings it back.
  useEffect(() => {
    settleTierOffer();
  }, []);

  // A tier is on offer only when the store sells it; its price is the store's.
  const offers = (plans.data?.tiers ?? []).flatMap((tier) => {
    const item = tierItemOf(store.state, tier.id);
    return item ? [{ tier, item }] : [];
  });
  const side = {
    paddingLeft: layout.gutter + insets.left,
    paddingRight: layout.gutter + insets.right,
  };

  let body;
  if (plans.isError && !plans.data) {
    body = (
      <ErrorState
        testID="tier-offer-error"
        icon="TriangleAlert"
        title="We couldn't load the tiers"
        message={isApiError(plans.error) && plans.error.message ? plans.error.message : 'Check your connection and try again.'}
        onRetry={() => void plans.refetch()}
      />
    );
  } else if (!plans.data || store.state.kind === 'loading') {
    body = (
      <View testID="tier-offer-loading" style={styles.list}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={150} radius={radius.card} />
        ))}
      </View>
    );
  } else if (store.state.kind !== 'ready') {
    body = <StoreUnready state={store.state} onRetry={store.refetch} testID="tier-offer" />;
  } else if (offers.length === 0) {
    body = (
      <ErrorState
        testID="tier-offer-none"
        icon="TriangleAlert"
        title="No tiers on sale"
        message="There are no tiers on sale right now. Try again later."
        onRetry={() => {
          void plans.refetch();
          store.refetch();
        }}
      />
    );
  } else {
    body = (
      <View testID="tier-offer-list" style={styles.list}>
        {offers.map(({ tier, item }) => (
          <View key={tier.id} style={styles.offer}>
            <TierCard tier={tier} price={item.price} mark={tier.preselected ? 'best' : undefined} />
            <Button
              testID={`tier-offer-subscribe-${tier.id}`}
              label={`Subscribe to ${tier.name}`}
              variant={tier.preselected ? 'primary' : 'secondary'}
              full
              onPress={() => onSubscribe(tier.id)}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View testID="tier-offer-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={[styles.bar, side]}>
        {closeButton ? <IconButton testID="tier-offer-close" icon="X" label="Close" size={CLOSE} onPress={onClose} /> : null}
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, side]}>
        <View style={styles.head}>
          <Text
            variant="display"
            accessibilityRole="header"
            testID="tier-offer-title"
            style={{
              fontSize: HEAD.title,
              lineHeight: HEAD.title * HEAD.leading,
              letterSpacing: HEAD.tracking * HEAD.title,
            }}
          >
            Choose your tier
          </Text>
          <Text variant="body" tone="textSecondary" testID="tier-offer-blurb">
            {TIER_WORDS.blurb}
          </Text>
        </View>
        {body}
      </ScrollView>
      {closeButton ? null : (
        <View
          style={[
            styles.foot,
            {
              backgroundColor: colors.surfacePage,
              paddingBottom: space.lg + insets.bottom,
            },
            side,
          ]}
        >
          <NotNow onPress={onClose} />
        </View>
      )}
    </View>
  );
}

/** The text button that replaces the X when an admin switched it off. A 44 high target, the primary text colour: never faint. */
function NotNow({ onPress }: { onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="tier-offer-not-now"
      accessibilityRole="button"
      accessibilityLabel="Not now"
      onPress={onPress}
      {...ring.handlers}
      style={[styles.notNow, ring.style]}
    >
      <Text variant="body" style={font(600)}>
        Not now
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // The X sits at the top right, on the screen's own edge, 56 high like the other bars.
  bar: { height: BAR.height, alignItems: 'flex-end', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingBottom: space.xl, gap: space.xl },
  head: { gap: space.sm },
  list: { gap: space.xl },
  offer: { gap: space.md },
  foot: { paddingTop: space.sm, alignItems: 'center' },
  notNow: {
    minHeight: layout.tapMin,
    minWidth: layout.tapMin,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
