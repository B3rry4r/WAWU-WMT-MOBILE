import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { VerifiedTick } from '@/components/icon';
import { gradientEnds } from '@/components/MediaCard';
import { EmptyState } from '@/components/StateViews';
import { Text as WawuText } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { layout, radius, space, useWawu } from '@/theme';

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

function SuggestionCard({ item, onFollow, busy }: { item: CreatorSuggestion; onFollow: () => void; busy: boolean }) {
  const { colors, gradients } = useWawu();
  const scrim = gradients.scrimCard;
  const ends = gradientEnds(scrim.angle);
  const tick = suggestionTick(item);
  const line = suggestionLine(item);
  return (
    <View
      testID={`today-creator-${item.wawuId}`}
      accessibilityLabel={[item.name, line].filter(Boolean).join(', ')}
      style={[styles.card, { backgroundColor: colors.surfaceSunken }]}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
      ) : (
        <View style={styles.initials}>
          <Avatar name={item.name} hue={hueFor(item.wawuId)} size={m.cardAvatar} decorative />
        </View>
      )}
      <LinearGradient
        pointerEvents="none"
        colors={scrim.colors as unknown as readonly [string, string, ...string[]]}
        locations={scrim.locations as unknown as readonly [number, number, ...number[]]}
        start={ends.start}
        end={ends.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.caption}>
        <View>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={[todayWords.cardName, styles.name, { color: cardInk.ink }]}>
              {item.name}
            </Text>
            {tick ? <VerifiedTick kind={tick} size={m.cardTick} /> : null}
          </View>
          {line ? (
            <Text numberOfLines={1} style={[todayWords.cardLine, styles.line, { color: cardInk.ink }]}>
              {line}
            </Text>
          ) : null}
        </View>
        <FollowButton name={item.name} following={item.following} busy={busy} onPress={onFollow} testID={`today-follow-${item.wawuId}`} />
      </View>
    </View>
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
  const client = useQueryClient();
  const [failed, setFailed] = useState<string | null>(null);
  const follow = useMutation({
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
  });
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
  card: { width: m.cardWidth, height: m.cardHeight, borderRadius: radius.media, overflow: 'hidden' },
  initials: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: m.cardAvatar },
  caption: { position: 'absolute', left: m.cardInset, right: m.cardInset, bottom: m.cardInset, gap: m.cardStack },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: m.nameGap },
  name: { flexShrink: 1 },
  line: { marginTop: m.cardLineTop },
  follow: { height: m.follow, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  problem: { alignItems: 'flex-start', gap: space.md },
});
