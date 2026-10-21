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
import { purchaseQuery } from './purchaseApi';
import { grantRows, TIER_WORDS } from './purchaseModel';

const MARK = { circle: 88, icon: 40 } as const;
const HEAD = { title: 30, tracking: -0.035 } as const;

export type OfficialScreenProps = {
  /** The purchase the Hub granted (`GET /plans/purchases/{id}`). */
  purchaseId: string;
  /** The way out: back to where the person started choosing a tier. It is the header's back (the board draws no second button), so a person who does not record can leave. */
  onDone: () => void;
  /** The way into recording a Voice Intro (VF8). Left out until VERIFY-03 builds it: the button is then not drawn (R-47). */
  onRecordVoice?: () => void;
};

/**
 * VF7 · You're official, and VF7a for the Founding Maker. What the person sees is what the Hub granted, read by the purchase's id so
 * it is the same after a restart or a repeated confirmation: the tier's badge, the points added (the tier's and the offer's), the
 * products to publish and the event pass. The numbered Founding badge draws its number once the Hub serves it (G-421): until then
 * it is the tier's name. The board's "Record my voice" opens VF8 and is drawn only when VERIFY-03 has built it.
 */
export function OfficialScreen({ purchaseId, onDone, onRecordVoice }: OfficialScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const read = useQuery(purchaseQuery(owner, purchaseId), queryClient);
  const grant = read.data?.status === 'paid' ? read.data.grant : null;

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
        message="We are still finishing your payment. Check again in a minute."
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
