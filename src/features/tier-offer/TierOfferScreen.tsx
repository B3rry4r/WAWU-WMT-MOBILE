import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import type { Currency } from '@/components/Money';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
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
  /** A tier's Subscribe: the checkout (VF6) with that tier. A person billed in dollars is led to the tiers sheet, which says plainly what is open. */
  onSubscribe: (tierId: string, currency: Currency) => void;
};

/**
 * The tier offer (TIER-OFFER, R-94): right after sign-up, before Home, the three tiers as VF5 draws them (the same card), each with what it gives
 * and its own Subscribe. The tiers, prices and lengths are the Hub's (`GET /plans`); on a build with a store the price is the store's (R-86), and
 * none is written here. It always has a way out and it is never hidden or faint: the close X at the top right (a 44 round button, the full-contrast
 * icon, "Close" to a screen reader), or, when an admin switched the X off, a "Not now" button at the foot. The way out stays through loading and
 * an error, so no state of this screen is a dead end.
 */
export function TierOfferScreen({ closeButton, onClose, onSubscribe }: TierOfferScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const owner = useSessionAccount(undefined);
  const plans = useQuery(plansQuery(owner), queryClient);
  // Drawn once is enough: the Hub is told as it appears, so closing the app on this screen never brings it back.
  useEffect(() => {
    settleTierOffer();
  }, []);

  const tiers = plans.data?.tiers ?? [];
  const currency: Currency = plans.data?.currency ?? 'NGN';
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
  } else if (!plans.data) {
    body = (
      <View testID="tier-offer-loading" style={styles.list}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={150} radius={radius.card} />
        ))}
      </View>
    );
  } else if (tiers.length === 0) {
    body = (
      <ErrorState
        testID="tier-offer-none"
        icon="TriangleAlert"
        title="No tiers on sale"
        message="There are no tiers on sale right now. Try again later."
        onRetry={() => void plans.refetch()}
      />
    );
  } else {
    body = (
      <View testID="tier-offer-list" style={styles.list}>
        {tiers.map((tier) => (
          <View key={tier.id} style={styles.offer}>
            <TierCard tier={tier} currency={currency} mark={tier.preselected ? 'best' : undefined} />
            <Button
              testID={`tier-offer-subscribe-${tier.id}`}
              label={`Subscribe to ${tier.name}`}
              variant={tier.preselected ? 'primary' : 'secondary'}
              full
              onPress={() => onSubscribe(tier.id, currency)}
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
