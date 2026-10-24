import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TierBadge } from '@/components/TierBadge';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { PointsFrame } from '@/features/points/PointsFrame';
import { radius, space, useWawu } from '@/theme';

import { Confetti } from './planParts';
import { plansQuery } from './purchaseApi';
import { grantRows, TIER_WORDS } from './purchaseModel';

const MARK = { circle: 88, icon: 40 } as const;
const HEAD = { title: 30, tracking: -0.035 } as const;

export type OfficialScreenProps = {
  /** The tier the Hub granted (the store purchase's `grant.tierId`). */
  tierId: string;
  /** The way out: back to where the person started choosing a tier. It is the header's back (the board draws no second button), so a person who does not record can leave. */
  onDone: () => void;
  /** The way into recording a Voice Intro (VF8). Left out until VERIFY-03 builds it: the button is then not drawn (R-47). */
  onRecordVoice?: () => void;
};

/**
 * VF7 · You're official, and VF7a for the Founding Maker. What the person sees is what the tier gives, read from the plan by the tier the
 * Hub granted, so it is the same after a restart or a restore: the tier's badge, the points added, the products to publish and the event
 * pass. The numbered Founding badge draws its number once the Hub serves it (G-421): until then
 * it is the tier's name. The board's "Record my voice" opens VF8 and is drawn only when VERIFY-03 has built it.
 */
export function OfficialScreen({ tierId, onDone, onRecordVoice }: OfficialScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const read = useQuery({ ...plansQuery(owner), retry: false }, queryClient);
  const tier = read.data?.tiers.find((t) => t.id === tierId) ?? null;
  const grant = tier ? { tierName: tier.name, bonusPoints: tier.bonusPoints, bumpPoints: 0, productsAllowed: tier.products, eventPass: tier.eventPass ?? null } : null;

  let body;
  if (read.isError && !read.data) {
    body = (
      <ErrorState
        testID="official-error"
        icon={isApiError(read.error) && read.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your tier"
        message={isApiError(read.error) && read.error.message ? read.error.message : 'Check your connection and try again.'}
        onRetry={() => void read.refetch()}
      />
    );
  } else if (!read.data) {
    body = (
      <View testID="official-loading" style={styles.loading}>
        <Skeleton height={MARK.circle} width={MARK.circle} radius={MARK.circle / 2} />
        <Skeleton height={32} width="55%" />
        <Skeleton height={150} radius={radius.card} style={styles.fullWidth} />
      </View>
    );
  } else if (!grant) {
    // Only a paid purchase is celebrated. One the Hub is still finishing, or one that did not go through, has nothing to show here.
    body = (
      <ErrorState
        testID="official-not-yet"
        icon="Clock"
        title="Your tier is not ready yet"
        message="We could not find this tier yet. Check again in a minute."
        onRetry={() => void read.refetch()}
      />
    );
  } else {
    body = (
      <View style={styles.centre}>
        <View testID="official-mark" style={[styles.mark, { backgroundColor: colors.accentTint }]}>
          <Icon name="BadgeCheck" size={MARK.icon} color={colors.accent} strokeWidth={2} />
        </View>
        <Text variant="display" accessibilityRole="header" testID="official-title" style={[styles.title, { fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }]}>
          {TIER_WORDS.officialTitle}
        </Text>
        {grant.tierName ? (
          <View style={styles.badge}>
            <TierBadge name={grant.tierName} testID="official-badge" />
          </View>
        ) : null}
        <GroupedList testID="official-rows" style={styles.fullWidth}>
          {grantRows(grant).map((row) => (
            <KeyValueRow key={row.id} testID={`official-${row.id}`} label={row.label} value={row.value} />
          ))}
        </GroupedList>
      </View>
    );
  }

  const foot = grant ? (
    onRecordVoice ? (
      <Button testID="official-voice" label="Record my voice" icon="Mic" full onPress={onRecordVoice} />
    ) : (
      <Button testID="official-done" label="Done" full onPress={onDone} />
    )
  ) : undefined;

  return (
    <View testID="official-screen" style={styles.root}>
      <PointsFrame title="" onBack={onDone} gap={space.lg} foot={foot} centered>
        {body}
      </PointsFrame>
      {grant ? <Confetti /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centre: { alignItems: 'center', gap: space.md },
  loading: { alignItems: 'center', gap: space.lg },
  fullWidth: { alignSelf: 'stretch' },
  mark: { width: MARK.circle, height: MARK.circle, borderRadius: MARK.circle / 2, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  badge: { marginBottom: space.sm },
});
