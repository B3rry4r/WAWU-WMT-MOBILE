import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { VerifiedTick } from '@/components/icon';
import { MediaCard, mediaMetrics } from '@/components/MediaCard';
import { EmptyState } from '@/components/StateViews';
import { Text as WawuText } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { space } from '@/theme';

import { useTodayClient } from './client';
import { setFollowing, suggestionsKey, type CreatorSuggestion } from './api';
import { gutter, todayMetrics as m } from './look';
import { suggestionLine, suggestionTick } from './model';

/**
 * One creator on the rail: the shared stacked `MediaCard` (H1's `cCard`, 146 by 196), the tick after the name
 * through `titleAccessory`, and Follow as the card's shared `action` (lead ruling, HOME-01 round 3), which draws the
 * canvas's Follow (13 at 700) and Following (white at 20%, no ring) for every creator card. With no photo the card
 * shows the person's initials on their hue through `placeholder`.
 */
function SuggestionCard({ item, onFollow, busy }: { item: CreatorSuggestion; onFollow: () => void; busy: boolean }) {
  const tick = suggestionTick(item);
  return (
    <MediaCard
      testID={`today-creator-${item.wawuId}`}
      layout="stacked"
      width={m.cardWidth}
      height={m.cardHeight}
      title={item.name}
      subtitle={suggestionLine(item) ?? undefined}
      imageUrl={item.avatarUrl ?? undefined}
      placeholder={<Avatar name={item.name} hue={hueFor(item.wawuId)} size={mediaMetrics.placeholderAvatar} decorative />}
      titleAccessory={tick ? <VerifiedTick kind={tick} size={m.cardTick} /> : undefined}
      action={{ label: item.following ? 'Following' : 'Follow', on: item.following, onPress: onFollow, loading: busy, testID: `today-follow-${item.wawuId}` }}
    />
  );
}

export type CreatorRailProps = {
  /** The people to show, already without the viewer; null while their read has failed. */
  creators: CreatorSuggestion[] | null;
  onRetry: () => void;
  retrying: boolean;
  /** "See all" at the end of the heading opens All creators (X4). Not drawn without it. */
  onSeeAll?: () => void;
  /** A follow or an unfollow the Hub accepted: whoever shows the rail can mark what depends on it (HOME-07, H12). */
  onFollowChange?: () => void;
};

/**
 * "Who Made This?" (H1, R-69): a sideways rail of creators, each with Follow in place. The
 * Hub's answer is changed at once and put right by its reply; a refused follow goes back and
 * says so. "See all" opens All creators (X4, EXPLORE-02); a card opening the profile (M5) is added by
 * ME-02 with its screen (R-27, R-41).
 */
export function CreatorRail({ creators, onRetry, retrying, onSeeAll, onFollowChange }: CreatorRailProps) {
  const client = useTodayClient();
  const [failed, setFailed] = useState<string | null>(null);
  const follow = useMutation(
    {
      mutationFn: ({ item, on }: { item: CreatorSuggestion; on: boolean }) => setFollowing(item.wawuId, on),
      onMutate: ({ item, on }) => {
        setFailed(null);
        client.setQueryData<CreatorSuggestion[]>(suggestionsKey, (list) => list?.map((c) => (c.wawuId === item.wawuId ? { ...c, following: on } : c)));
      },
      onSuccess: (following, { item }) => {
        client.setQueryData<CreatorSuggestion[]>(suggestionsKey, (list) => list?.map((c) => (c.wawuId === item.wawuId ? { ...c, following } : c)));
        onFollowChange?.();
      },
      onError: (_error, { item, on }) => {
        client.setQueryData<CreatorSuggestion[]>(suggestionsKey, (list) => list?.map((c) => (c.wawuId === item.wawuId ? { ...c, following: !on } : c)));
        setFailed(on ? `${item.name} wasn't followed. Try again.` : `${item.name} wasn't unfollowed. Try again.`);
      },
    },
    client,
  );
  const busyId = follow.isPending ? follow.variables?.item.wawuId : undefined;

  let body;
  if (creators === null) {
    body = (
      <View testID="today-creators-error" style={styles.problem}>
        <WawuText variant="secondary" accessibilityRole="alert">
          The creators didn&apos;t load. Check your connection, then try again.
        </WawuText>
        <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" loading={retrying} onPress={onRetry} />
      </View>
    );
  } else if (creators.length === 0) {
    body = (
      <EmptyState
        testID="today-creators-empty"
        icon="Users"
        title="No creators to suggest yet"
        message="New creators show up here as they join and publish."
      />
    );
  } else {
    body = (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rail}
        contentContainerStyle={styles.railRow}
        testID="today-creators"
      >
        {creators.map((item) => (
          <SuggestionCard
            key={item.wawuId}
            item={item}
            busy={busyId === item.wawuId}
            onFollow={() => {
              if (follow.isPending) return;
              follow.mutate({ item, on: !item.following });
            }}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <WawuText variant="h2">Who Made This?</WawuText>
        {onSeeAll ? (
          <Pressable testID="today-creators-see-all" accessibilityRole="button" accessibilityLabel="See all creators" hitSlop={space.md} onPress={onSeeAll}>
            <WawuText variant="linkStrong">See all</WawuText>
          </Pressable>
        ) : null}
      </View>
      {body}
      {failed ? (
        <WawuText variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="today-follow-failed">
          {failed}
        </WawuText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: m.railGap },
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  rail: { marginRight: -gutter },
  railRow: { gap: m.cardsApart, paddingRight: gutter },
  problem: { alignItems: 'flex-start', gap: space.md },
});
