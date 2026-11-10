import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { fetchCreatorSuggestions, suggestionsKey } from '@/features/home/api';
import { useTodayClient } from '@/features/home/client';
import { CreatorRail } from '@/features/home/CreatorRail';
import { gutter, todayMetrics } from '@/features/home/look';
import { font, layout, radius, space, useWawu } from '@/theme';

import { feedKey, followingCountKey } from './api';

/** The canvas's empty card: a 56 circle, a 16 title, 13.5 words held to 280 wide, 10 apart, 26 above and below (kit `empty`). */
const empty = { icon: 56, maxWidth: 280, padV: 26, stack: 10, titleGap: space.xs, actionGap: 6, cardPadV: 10, cardPadH: 16 } as const;

export type FollowingEmptyProps = {
  /** How far down the tabs reach: the card starts under them. */
  top: number;
  /** The viewer's own id, so the rail's card for them draws no Follow (HOME-SELF). */
  myId: string | null;
  /** "Find people to follow" and the rail's "See all" open All creators (X4). Neither is drawn without it. */
  onFindPeople?: () => void;
};

/**
 * H12: the Following tab of someone who follows no one. A card says so and offers "Find people to follow", and the
 * creators rail under it is the way out: Follow in place. A follow marks the Following feed and its count as out of
 * date, so the next time the tab is shown it is read again.
 */
export function FollowingEmpty({ top, myId, onFindPeople }: FollowingEmptyProps) {
  const { colors } = useWawu();
  const client = useTodayClient();
  const queries = useQueryClient();
  const creators = useQuery({ queryKey: suggestionsKey, queryFn: fetchCreatorSuggestions }, client);
  const people = creators.data ?? null;
  const refreshFollowing = () => {
    void queries.invalidateQueries({ queryKey: feedKey('following'), refetchType: 'none' });
    void queries.invalidateQueries({ queryKey: followingCountKey, refetchType: 'none' });
  };
  return (
    <ScrollView
      testID="feed-empty"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.body, { paddingTop: top, paddingHorizontal: gutter, paddingBottom: todayMetrics.bodyBottom }]}
    >
      <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
        <View style={styles.state}>
          <IconTile icon="UserPlus" size={empty.icon} />
          <Text variant="h3" accessibilityRole="header" style={[font(600), styles.title]}>
            You&apos;re not following anyone yet
          </Text>
          <Text variant="secondary" tone="textSecondary" style={styles.message}>
            Follow creators and professionals and their new posts land here first.
          </Text>
          {onFindPeople ? (
            <View style={styles.action}>
              <Button testID="feed-find-people" label="Find people to follow" variant="primary" size="md" onPress={onFindPeople} />
            </View>
          ) : null}
        </View>
      </View>
      {creators.isPending ? null : (
        <CreatorRail
          creators={people}
          myId={myId}
          onRetry={() => void creators.refetch()}
          retrying={creators.isFetching}
          onSeeAll={onFindPeople}
          onFollowChange={refreshFollowing}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: todayMetrics.bodyTop, gap: layout.sectionGap },
  card: { borderRadius: radius.card, borderWidth: 1, paddingVertical: empty.cardPadV, paddingHorizontal: empty.cardPadH },
  state: { alignItems: 'center', gap: empty.stack, paddingVertical: empty.padV, paddingHorizontal: space.lg },
  title: { marginTop: empty.titleGap, textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: empty.maxWidth },
  action: { marginTop: empty.actionGap },
});
