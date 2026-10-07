import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { VerifiedTick } from '@/components/icon';
import { MediaCard } from '@/components/MediaCard';
import { EmptyState } from '@/components/StateViews';
import { Text as WawuText } from '@/components/Text';
import { layout, radius, space } from '@/theme';

import { useTodayClient } from './client';
import { setFollowing, suggestionsKey, type CreatorSuggestion } from './api';
import { cardInk, gutter, todayMetrics as m, todayWords } from './look';
import { suggestionLine, suggestionTick } from './model';

/** Follow and Following on a card, in place. One tap at a time per card. */
function FollowButton({ name, following, busy, onPress, testID }: { name: string; following: boolean; busy: boolean; onPress: () => void; testID: string }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={following ? `Following ${name}. Unfollow` : `Follow ${name}`}
      accessibilityState={{ selected: following, busy }}
      onPress={onPress}
      hitSlop={(layout.tapMin - m.follow) / 2}
      {...ring.handlers}
      style={[styles.follow, { backgroundColor: following ? cardInk.following : cardInk.accent }, ring.style]}
    >
      <Text style={[todayWords.follow, { color: cardInk.ink }]}>{following ? 'Following' : 'Follow'}</Text>
    </Pressable>
  );
}

/**
 * One creator on the rail: the shared stacked `MediaCard` (H1's `cCard`, 146 by 196), the tick after the name
 * through `titleAccessory`, and the canvas's own Follow pill through `footer`. `action` would draw the shared
 * `Button` (13.5 label, glass with a hairline ring once followed), where `cCard` draws a 13 label on white at
 * 20% with no ring, so the pill goes through `footer` and nothing is forked. With no photo the picture is
 * MediaCard's quiet block (it has no slot for initials yet: SHARED-CHANGES HOME-01 #3).
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
      titleAccessory={tick ? <VerifiedTick kind={tick} size={m.cardTick} /> : undefined}
      footer={<FollowButton name={item.name} following={item.following} busy={busy} onPress={onFollow} testID={`today-follow-${item.wawuId}`} />}
    />
  );
}

export type CreatorRailProps = {
  /** The people to show, already without the viewer; null while their read has failed. */
  creators: CreatorSuggestion[] | null;
  onRetry: () => void;
  retrying: boolean;
};

/**
 * "Creators to discover" (H1): a sideways rail of creators, each with Follow in place. The
 * Hub's answer is changed at once and put right by its reply; a refused follow goes back and
 * says so. "See all" (X4) and a card opening the profile (M5) are added by EXPLORE-02 and
 * ME-02 with their screens (R-27, R-41).
 */
export function CreatorRail({ creators, onRetry, retrying }: CreatorRailProps) {
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
      <WawuText variant="h2">Creators to discover</WawuText>
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
  rail: { marginRight: -gutter },
  railRow: { gap: m.cardsApart, paddingRight: gutter },
  follow: { height: m.follow, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  problem: { alignItems: 'flex-start', gap: space.md },
});
