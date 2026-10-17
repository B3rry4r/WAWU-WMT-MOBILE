import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { BuyCreditsEntry } from '@/features/credits/BuyCreditsEntry';
import { layout, space, useWawu } from '@/theme';
import { queryClient } from '@/api/query';

import { creditsKey, messageCostKey, myCommunitiesKey, suggestedKey, type Community, type MyCommunity } from './api';
import { CommunitiesSkeleton } from './CommunitiesSkeleton';
import { CommunityRow } from './CommunityRow';
import { CreditsStrip } from './CreditsStrip';
import { lastLine, membersShort, rowTime } from './format';
import { openPass, openRoom } from './routes';
import { useJoinCommunity, useMyCommunities, useSuggestedCommunities } from './useCommunities';
import { useMe } from './useRoomMessages';

/** design/_gen/inbox.js line 70: the strip, "Your communities" and "Suggested" are 16 apart. */
const viewMetrics = { sectionGap: 16, listBottom: 120 } as const;

type Entry =
  | { kind: 'label'; key: string; title: string; first?: boolean }
  | { kind: 'mine'; key: string; room: MyCommunity }
  | { kind: 'none'; key: string }
  | { kind: 'suggested'; key: string; room: Community };

export type CommunitiesViewProps = {
  testID?: string;
};

/**
 * I24: the Communities chip's view of the Inbox. The person's WAWU Credits, the rooms they host or have
 * joined with the last message of each, and open rooms they could join, each on one tap that opens the room.
 * A private room is listed with a lock and Join: it opens I30, where the host's monthly pass is paid for (INBOX-14, R-63).
 */
export function CommunitiesView({ testID = 'communities-view' }: CommunitiesViewProps) {
  const router = useRouter();
  const { colors } = useWawu();
  const me = useMe();
  const mine = useMyCommunities();
  const mineDone = mine.isSuccess && !mine.hasNextPage;
  const suggested = useSuggestedCommunities(mineDone);
  const join = useJoinCommunity();
  const focused = useIsFocused();

  // What the strip and the rows lean on besides the lists (the balance, the price of a message, the person's own profile for "You:")
  // is read again whenever the person comes back to this view and whenever they retry: something that failed once must not stay
  // failed while everything else recovers. The profile is asked again only when it failed, because it never changes otherwise.
  const { refetch: refetchMe, isError: meFailed } = me;
  const recover = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: creditsKey });
    void queryClient.invalidateQueries({ queryKey: messageCostKey });
    if (meFailed) void refetchMe();
  }, [meFailed, refetchMe]);
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current) recover();
    wasFocused.current = focused;
  }, [focused, recover]);
  const [pulled, setPulled] = useState(false);
  const [buying, setBuying] = useState(false);

  const joining = join.isPending ? join.variables : undefined;
  const joinFailed = join.isError ? join.variables : undefined;

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [{ kind: 'label', key: 'label-mine', title: 'Your communities', first: true }];
    if (mine.items.length === 0) list.push({ kind: 'none', key: 'none' });
    for (const room of mine.items) list.push({ kind: 'mine', key: `mine-${room.id}`, room });
    if (suggested.items.length > 0) {
      list.push({ kind: 'label', key: 'label-suggested', title: 'Suggested' });
      for (const room of suggested.items) list.push({ kind: 'suggested', key: `suggested-${room.id}`, room });
    }
    return list;
  }, [mine.items, suggested.items]);

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myCommunitiesKey }),
        queryClient.invalidateQueries({ queryKey: suggestedKey }),
        queryClient.invalidateQueries({ queryKey: creditsKey }),
        queryClient.invalidateQueries({ queryKey: messageCostKey }),
        meFailed ? refetchMe() : Promise.resolve(),
      ]);
    } finally {
      setPulled(false);
    }
  }, [meFailed, refetchMe]);

  const { fetchNextPage: fetchMoreMine, isFetchingNextPage: fetchingMine, isFetchNextPageError: mineMoreFailed } = mine;
  const { fetchNextPage: fetchMoreSuggested, isFetchingNextPage: fetchingSuggested, isFetchNextPageError: suggestedMoreFailed } = suggested;
  const onEndReached = useCallback(() => {
    if (mine.hasNextPage) {
      if (!fetchingMine && !mineMoreFailed) void fetchMoreMine();
    } else if (suggested.hasNextPage && !fetchingSuggested && !suggestedMoreFailed) {
      void fetchMoreSuggested();
    }
  }, [mine.hasNextPage, fetchingMine, mineMoreFailed, fetchMoreMine, suggested.hasNextPage, fetchingSuggested, suggestedMoreFailed, fetchMoreSuggested]);

  const onJoin = useCallback(
    (id: string) => {
      if (join.isPending) return;
      join.mutate(id, { onSuccess: () => openRoom(router, id) });
    },
    [join, router],
  );

  const renderEntry = useCallback(
    ({ item }: { item: Entry }) => {
      if (item.kind === 'label') {
        return (
          <Text variant="label" accessibilityRole="header" style={item.first ? undefined : styles.secondLabel}>
            {item.title}
          </Text>
        );
      }
      if (item.kind === 'none') {
        return (
          <Text variant="secondary" tone="textSecondary" style={styles.none} testID="communities-none">
            You have not joined a community yet.
          </Text>
        );
      }
      if (item.kind === 'mine') {
        const room = item.room;
        // `lastMessage` is null for a room nobody has written in; the contract types it as always present.
        const last = room.lastMessage as MyCommunity['lastMessage'] | null;
        return (
          <CommunityRow
            testID={`community-${room.id}`}
            name={room.name}
            imageUrl={room.imageUrl}
            locked={room.kind === 'private'}
            line={
              last
                ? lastLine({
                    text: last.text,
                    hasPhoto: Boolean(last.imageUrl),
                    mine: me.data !== undefined && last.senderWawuId === me.data.wawuUserId,
                    senderName: last.sender?.name ?? null,
                  })
                : 'No messages yet'
            }
            meta={rowTime(room.lastActivityAt)}
            unread={room.unreadCount}
            onPress={() => openRoom(router, room.id)}
          />
        );
      }
      const room = item.room;
      const busy = joining === room.id;
      const failed = joinFailed === room.id;
      return (
        <CommunityRow
          testID={`suggested-${room.id}`}
          name={room.name}
          imageUrl={room.imageUrl}
          locked={room.kind === 'private'}
          line={`${membersShort(room.memberCount)} · ${room.kind}`}
          meta={busy ? 'Joining' : failed ? 'Try again' : 'Join'}
          problem={failed}
          accessibilityLabel={`Join ${room.name}, ${room.kind === 'private' ? 'private, ' : ''}${membersShort(room.memberCount)}`}
          onPress={() => (room.kind === 'private' ? openPass(router, room.id) : onJoin(room.id))}
        />
      );
    },
    [me.data, router, joining, joinFailed, onJoin],
  );

  let state: 'list' | 'loading' | 'error' | 'empty' = 'list';
  if (mine.isPending) state = 'loading';
  else if (mine.isError && !mine.data) state = 'error';
  else if (mine.items.length === 0 && suggested.isSuccess && !suggested.hasNextPage && suggested.items.length === 0) state = 'empty';

  const moreFailed = mineMoreFailed || suggestedMoreFailed;
  const fetchingMore = fetchingMine || fetchingSuggested;
  const suggestionsFailed = mineDone && suggested.isError && !suggested.data;

  return (
    <View testID={testID} style={styles.root}>
      <FlatList
        testID="communities-list"
        data={state === 'list' ? entries : []}
        keyExtractor={(entry) => entry.key}
        renderItem={renderEntry}
        ListHeaderComponent={
          <View style={styles.header}>
            <CreditsStrip onBuy={() => setBuying(true)} />
          </View>
        }
        ListEmptyComponent={
          state === 'loading' ? (
            <CommunitiesSkeleton />
          ) : state === 'error' ? (
            <ErrorState
              testID="communities-error"
              title="Couldn’t load communities"
              message={isApiError(mine.error) ? mine.error.message : 'Something went wrong. Try again.'}
              icon={isApiError(mine.error) && mine.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
              onRetry={() => {
                recover();
                void mine.refetch();
              }}
            />
          ) : state === 'empty' ? (
            <EmptyState
              testID="communities-empty"
              icon="Users"
              title="No communities yet"
              message="Communities you join, and ones you host, show up here."
            />
          ) : null
        }
        ListFooterComponent={
          moreFailed ? (
            <View style={styles.footer}>
              <Text variant="secondary">Couldn’t load more communities.</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => void (mineMoreFailed ? fetchMoreMine() : fetchMoreSuggested())} />
            </View>
          ) : suggestionsFailed ? (
            <View style={styles.footer} testID="communities-suggested-error">
              <Text variant="secondary">Couldn’t load suggestions.</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => {
                recover();
                void suggested.refetch();
              }} />
            </View>
          ) : fetchingMore || (mineDone && suggested.isPending) ? (
            <CommunitiesSkeleton rows={2} testID="communities-loading-more" />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
        contentContainerStyle={styles.content}
        style={styles.list}
      />
      {buying ? <BuyCreditsEntry visible onClose={() => setBuying(false)} doneLabel="Done" onAdded={recover} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  /** `body()` (kit.js line 35) pads 8 above the list and 120 below it, over a tab bar that sits on top of it; here the bar is its own box. */
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm, paddingBottom: viewMetrics.listBottom - layout.tabbarH },
  header: { marginBottom: viewMetrics.sectionGap },
  secondLabel: { marginTop: viewMetrics.sectionGap },
  none: { paddingVertical: space.lg },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
});
