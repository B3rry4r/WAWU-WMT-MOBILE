import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { layout, radius, space, useWawu } from '@/theme';

import { fetchReferrals, referralsKey } from './api';
import { momentCopy } from './model';
import { inviteMetrics, LinkCard, NavBar, NextBlock, NobodyYet, StatsCard } from './parts';
import { RewardMoment } from './RewardMoment';
import { useMoments } from './useMoments';

/** The body stands 8 under the bar and 40 above the bottom, its parts 14 apart (kit `body`, rf1's `gap: 14`). */
const body = { top: space.sm, bottom: 40 } as const;
/** The loading view's shapes: the link card, the numbers card and the next-milestone card. */
const skeleton = { link: 176, stats: 168, next: 66 } as const;

export type InviteScreenProps = {
  onBack: () => void;
  /** The help button opens RF4. */
  onOpenRules: () => void;
  /** Share opens RF2. */
  onOpenCard: () => void;
};

/**
 * RF1 · Invite and earn, with RF1a (nobody has used the link yet) and RF1b (one more person reaches a milestone) as the
 * states of the same screen, and RF3 and RF3a in front of it when the Hub says points became available. Every figure
 * is from `GET /me/referrals` (REF-02); Pending is the people still in the hold, and the points the Hub holds for them
 * are not drawn because the board does not draw them. Read again each time the screen opens, so a reward that landed
 * while the app was shut is told.
 */
export function InviteScreen({ onBack, onOpenRules, onOpenCard }: InviteScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const referrals = useQuery({ queryKey: referralsKey, queryFn: fetchReferrals, staleTime: 0 });
  const moments = useMoments(referrals.data);
  const view = referrals.data;

  if (view && moments.ready && moments.current) {
    const moment = moments.current;
    return <RewardMoment copy={momentCopy(moment, view)} onKeepInviting={() => moments.done(moment.id)} />;
  }

  return (
    <View testID="invite" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar
        title="Invite and earn"
        onBack={onBack}
        idPrefix="invite"
        right={<IconButton icon="CircleHelp" label="How it works" onPress={onOpenRules} testID="invite-help" />}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + body.bottom }]}
        testID="invite-scroll"
        refreshControl={<RefreshControl refreshing={referrals.isRefetching && Boolean(view)} onRefresh={() => void referrals.refetch()} tintColor={colors.textMuted} />}
      >
        {view && moments.ready ? (
          <>
            <LinkCard link={view.link} code={view.code} onShare={onOpenCard} />
            <StatsCard view={view} />
            <NextBlock view={view} />
            {view.brought === 0 ? <NobodyYet /> : null}
          </>
        ) : referrals.isError && !view ? (
          <ErrorState
            title="Couldn't load your referrals"
            message="Check your connection and try again."
            onRetry={() => void referrals.refetch()}
            testID="invite-error"
          />
        ) : (
          <LoadingView label="Loading your referrals" testID="invite-loading">
            <View style={styles.skeletons}>
              <Skeleton height={skeleton.link} radius={radius.card} />
              <Skeleton height={skeleton.stats} radius={radius.card} />
              <Skeleton height={skeleton.next} radius={radius.card} />
            </View>
          </LoadingView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  body: { paddingTop: body.top, paddingHorizontal: layout.gutter, gap: inviteMetrics.body },
  skeletons: { gap: inviteMetrics.body },
});

