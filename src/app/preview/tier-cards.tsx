import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { CheckoutReady } from '@/features/verify/CheckoutScreen';
import { PointsFrame } from '@/features/points/PointsFrame';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { said } from '@/features/store/words';
import { TierCard } from '@/features/verify/TiersScreen';
import type { PlanTier } from '@/features/verify/purchaseApi';
import { TIER_WORDS } from '@/features/verify/purchaseModel';
import { layout, space, useWawu } from '@/theme';

/**
 * Development-only pictures for TIER-CARDS (R-108): /preview/tier-cards?view=offer (the tier offer's three cards, each with its own Subscribe),
 * view=choose (the tiers sheet's choice: the same card with a radio and Continue under the list) and view=declined (the checkout after a
 * payment the store refused). The plans have the shape of `GET /plans`; the prices are sample store prices, as a phone's store writes them
 * (the app reads both from the Hub and the store). A release build leaves this route (`LeaveDevRoute`).
 */
const plan = (over: Partial<PlanTier> & Pick<PlanTier, 'id' | 'name' | 'products' | 'bonusPoints' | 'priceMinor' | 'eventPass'>): PlanTier => ({
  days: 365,
  bonusPointsExpireDays: 365,
  badge: { id: over.id, numbered: false },
  packBonusPercent: 0,
  firstVoiceIntroIncluded: false,
  preselected: false,
  ...over,
});
const TIERS: { tier: PlanTier; price: string }[] = [
  { tier: plan({ id: 'verify', name: 'Verify', products: 3, bonusPoints: 100, priceMinor: 299_900, eventPass: { id: 'watch_apply', name: 'Watch live, apply', benefits: [] } }), price: '₦2,999.00' },
  { tier: plan({ id: 'plus', name: 'Verify Plus', products: 6, bonusPoints: 300, priceMinor: 599_900, eventPass: { id: 'maker', name: 'Maker Pass', benefits: [] } }), price: '₦5,999.00' },
  {
    tier: plan({ id: 'founding', name: 'Founding Maker', products: 10, bonusPoints: 600, priceMinor: 999_900, eventPass: { id: 'maker_priority', name: 'Maker Pass, priority', benefits: [] }, badge: { id: 'founding', numbered: true }, packBonusPercent: 10, preselected: true }),
    price: '₦9,999.00',
  },
];

export default function TierCardsPreview() {
  const { colors } = useWawu();
  const { view } = useLocalSearchParams<{ view?: string }>();
  // A tap does something here too: it is named under the cards, so no control in the gallery is dead.
  const [last, setLast] = useState<string | null>(null);
  const tapped = (what: string) => () => setLast(what);
  const idle = { restore: async () => setLast('Restore purchases'), restoring: false, restoreLine: null, busy: false };
  if (!__DEV__) return <LeaveDevRoute />;

  if (view === 'declined') {
    const founding = TIERS[2];
    return (
      <PointsFrame title={TIER_WORDS.checkout} onBack={tapped('Back')} gap={space.md} foot={<Button testID="checkout-pay" label={`Buy · ${founding.price}`} full onPress={tapped('Buy')} />} testID="checkout-screen">
        <CheckoutReady tier={founding.tier} price={founding.price} kind="tier" said={said({ kind: 'declined' }, 'android', true)} buyer={idle} />
      </PointsFrame>
    );
  }

  const choose = view === 'choose';
  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <View style={styles.bar}>{choose ? null : <IconButton testID="tier-offer-close" icon="X" label="Close" size={layout.tapMin} onPress={tapped('Close')} />}</View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Text variant="display" accessibilityRole="header" style={styles.title}>
            {choose ? TIER_WORDS.title : 'Choose your tier'}
          </Text>
          <Text variant="body" tone="textSecondary">
            {TIER_WORDS.blurb}
          </Text>
        </View>
        <View style={styles.list}>
          {TIERS.map(({ tier, price }) =>
            choose ? (
              <TierCard key={tier.id} tier={tier} price={price} on={tier.preselected} mark={tier.preselected ? 'best' : undefined} onPress={tapped(tier.name)} />
            ) : (
              <TierCard
                key={tier.id}
                tier={tier}
                price={price}
                featured={tier.preselected}
                mark={tier.preselected ? 'best' : undefined}
                action={{ testID: `tier-offer-subscribe-${tier.id}`, label: `Subscribe to ${tier.name}`, onPress: tapped(`Subscribe to ${tier.name}`) }}
              />
            ),
          )}
        </View>
        {last ? (
          <Text variant="meta" testID="tap-note">
            {`Tapped: ${last}`}
          </Text>
        ) : null}
        {choose ? <Button testID="tiers-continue" label="Continue with Founding Maker" full onPress={tapped('Continue')} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { height: 56, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: layout.gutter, marginTop: space.lg },
  content: { paddingHorizontal: layout.gutter, paddingBottom: space.s3xl, gap: space.xl },
  head: { gap: space.sm },
  title: { fontSize: 26 },
  list: { gap: space.lg },
});
