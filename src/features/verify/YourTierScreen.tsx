import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { formatPointsCount } from '@/components/PointsFigure';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TierBadge } from '@/components/TierBadge';
import { fetchMyTier, tierKey, type MyTier } from '@/features/me/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { PointsFrame } from '@/features/points/PointsFrame';
import { tierItemOf } from '@/features/store/model';
import { useStoreCatalog } from '@/features/store/useStore';
import { font, radius, space, useWawu } from '@/theme';

import { plansQuery } from './purchaseApi';
import { dayOf, higherTiers } from './purchaseModel';

const BODY_GAP = 12;
const DAY_MS = 86_400_000;

export type YourTierScreenProps = {
  onBack: () => void;
  /** Renew: the checkout (VF6) for the tier held, `kind` renew. */
  onRenew: (tierId: string) => void;
  /** Upgrade: VF5b for a running tier, VF5 for an ended one. */
  onUpgrade: () => void;
  /** A person with no tier is shown VF5 from here. */
  onSeeTiers: () => void;
};

/** Whole days from now to the end of the tier, counted up: "ends in 3 days" at two days and a few hours. Null when the Hub sent no date. */
export function daysLeft(until: string | null, now: number = Date.now()): number | null {
  const ms = until ? Date.parse(until) : NaN;
  return Number.isFinite(ms) ? Math.max(0, Math.ceil((ms - now) / DAY_MS)) : null;
}

/** "Ends in 3 days · 26 Nov", "Ends today · 26 Nov"; a date outside this year carries its year ("Ends in 3 days · 2 Jan 2027"). */
export function endingLine(until: string | null, now?: number): string {
  const left = daysLeft(until, now);
  const day = dayOf(until, new Date(now ?? Date.now()));
  const head = left === null ? 'Ending soon' : left === 0 ? 'Ends today' : `Ends in ${left} ${left === 1 ? 'day' : 'days'}`;
  return day ? `${head} · ${day}` : head;
}

/**
 * The card's line for each state: "Active until 26 Nov", "Ends in 3 days · 26 Nov", "Ended 26 Nov". The date is the Hub's, never worked
 * out from a price or a length, and carries its year when it is not this year ("Active until 18 Oct 2027", FIX-78 F-3).
 */
export function stateLine(tier: Pick<MyTier, 'state' | 'activeUntil'>, now?: number): string | null {
  const day = dayOf(tier.activeUntil, new Date(now ?? Date.now()));
  if (tier.state === 'active') return day ? `Active until ${day}` : 'Active';
  if (tier.state === 'ending') return endingLine(tier.activeUntil, now);
  if (tier.state === 'ended') return day ? `Ended ${day}` : 'Ended';
  return null;
}

/**
 * VF14 · Your tier, with VF14a (ending soon) and VF14b (ended). Everything is the Hub's own answer (`GET /me/tier`): the tier's name and
 * dates, the products used and allowed (the places the person added included), the points the tier gave and the event pass; a row
 * the Hub does not carry is not drawn. Renew pays the tier held, at its own price (the checkout asks the Hub for the quote), and
 * Upgrade moves up, paying only the difference (VF5b); both are drawn only when the Hub sells them. A tier that ended keeps its
 * published products up and pauses new publishing until it is renewed.
 */
export function YourTierScreen({ onBack, onRenew, onUpgrade, onSeeTiers }: YourTierScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const mine = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const plans = useQuery(plansQuery(owner), queryClient);
  // Renew is bought in the store sheet, so the price on it is the store's own (IAP-03, R-86); none is drawn until the store has answered.
  const store = useStoreCatalog(['tier']);
  const tier = mine.data;
  const held = tier && tier.state !== 'none' && tier.tier ? tier.tier : null;

  let body;
  let foot;
  if ((mine.isError && !tier) || (plans.isError && !plans.data)) {
    const error = mine.error ?? plans.error;
    body = (
      <ErrorState
        testID="your-tier-error"
        icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="Your tier did not load"
        message={isApiError(error) && error.message ? error.message : 'Check your connection and try again.'}
        onRetry={() => {
          void mine.refetch();
          void plans.refetch();
        }}
      />
    );
  } else if (!tier || !plans.data) {
    body = (
      <View testID="your-tier-loading" style={styles.stack}>
        <Skeleton height={170} radius={radius.card} />
        <Skeleton height={140} radius={radius.card} />
      </View>
    );
  } else if (!held) {
    // VF14 draws active, ending and ended, never "no tier" (lead default, G-FIX-68-1): a plain state, not an error, with a button that says what it does.
    body = (
      <EmptyState
        testID="your-tier-none"
        icon="BadgeCheck"
        title="You have no tier yet"
        message="Make it official to publish, upload files and unlock your points."
        action={{ label: 'See tiers', onPress: onSeeTiers }}
      />
    );
  } else {
    const sold = plans.data.tiers.find((t) => t.id === held.id) ?? null;
    const canUpgrade = higherTiers(plans.data.tiers, held.id).length > 0;
    const renewPrice = tierItemOf(store.state, held.id)?.price ?? null;
    const line = stateLine(tier);
    body = (
      <>
        <View testID="your-tier-card" style={[styles.card, { backgroundColor: colors.surfaceCardInk }]}>
          <TierBadge name={held.name ?? 'Your tier'} testID="your-tier-badge" />
          <Text variant="display" accessibilityRole="header" testID="your-tier-name" style={[styles.name, { color: colors.textOnAccent }]}>
            {held.name ?? 'Your tier'}
          </Text>
          {line ? (
            <Text variant="body" testID="your-tier-line" style={{ color: colors.textOnAccent }}>
              {line}
            </Text>
          ) : null}
        </View>
        {tier.state === 'ending' ? (
          <View testID="your-tier-ending" accessibilityLiveRegion="polite" style={[styles.note, { backgroundColor: colors.warningTint }]}>
            <Icon name="Clock" size={22} color={colors.warning} />
            <View style={styles.noteWords}>
              <Text variant="body" style={font(700)}>
                {`Your tier ends in ${daysLeft(tier.activeUntil) ?? 'a few'} ${daysLeft(tier.activeUntil) === 1 ? 'day' : 'days'}`}
              </Text>
              <Text variant="secondary" tone="textSecondary">
                Renew to keep publishing.
              </Text>
            </View>
          </View>
        ) : null}
        {tier.state === 'ended' ? (
          <View testID="your-tier-ended" accessibilityLiveRegion="polite" style={[styles.note, { backgroundColor: colors.dangerTint }]}>
            <Icon name="CirclePause" size={22} color={colors.danger} />
            <View style={styles.noteWords}>
              <Text variant="body" style={font(700)}>
                Your tier has ended
              </Text>
              <Text variant="secondary" tone="textSecondary">
                Published products stay up. New publishing is paused until you renew.
              </Text>
            </View>
          </View>
        ) : null}
        <GroupedList testID="your-tier-rows">
          <KeyValueRow testID="your-tier-products" label="Products" value={`${tier.productsUsed} of ${tier.productsAllowed}`} />
          {tier.pointsIncluded > 0 ? <KeyValueRow testID="your-tier-points" label="Points included" value={formatPointsCount(tier.pointsIncluded)} /> : null}
          {tier.eventPass ? <KeyValueRow testID="your-tier-pass" label="Event pass" value={tier.eventPass.name} /> : null}
        </GroupedList>
      </>
    );
    foot =
      canUpgrade || sold ? (
        <View style={styles.foot}>
          {canUpgrade ? <Button testID="your-tier-upgrade" label="Upgrade" variant="outline" onPress={onUpgrade} style={styles.half} /> : null}
          {sold ? <Button testID="your-tier-renew" label={renewPrice ? `Renew · ${renewPrice}` : 'Renew'} onPress={() => onRenew(held.id)} style={styles.half} /> : null}
        </View>
      ) : undefined;
  }

  return (
    <PointsFrame title="Your tier" onBack={onBack} gap={BODY_GAP} foot={foot} testID="your-tier-screen">
      {body}
    </PointsFrame>
  );
}

const styles = StyleSheet.create({
  stack: { gap: BODY_GAP },
  card: { borderRadius: radius.card, padding: space.xl, gap: space.sm, alignItems: 'flex-start' },
  name: { fontSize: 28, letterSpacing: -0.98 },
  note: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card },
  noteWords: { flex: 1, gap: space.xs },
  foot: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
});
