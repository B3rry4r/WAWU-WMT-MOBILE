import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchCommunity, fetchMembership, membershipKey, roomKey, type Community, type CommunityMessage } from './api';
import { Composer } from './Composer';
import { dayKey, dayLabel, membersFull } from './format';
import { GroupTile, tileMetrics } from './GroupTile';
import { MessagePost, OutgoingPost } from './MessagePost';
import { RoomHeader } from './RoomHeader';
import { useJoinCommunity } from './useCommunities';
import { useCredits } from './useCredits';
import { useRoomMessages, type OutgoingMessage } from './useRoomMessages';

/**
 * design/_gen/inbox.js lines 25 and 26: the messages sit 14 under the header and have 16 at the sides, 10 apart; a day label is
 * 12 / 600 muted with 4 above and below.
 */
const roomMetrics = { padTop: 14, padH: 16, between: 10, dayFont: 12, dayPad: 4, loadingRows: 5, avatar: 34, bubble: 15 } as const;
/** A reader this close to the newest message counts as being at the bottom: new messages keep the view pinned there. */
const AT_BOTTOM_PX = 24;
const SCROLL_EVENT_MS = 16;

type Item =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'post'; key: string; message: CommunityMessage }
  | { kind: 'out'; key: string; entry: OutgoingMessage };

/** Newest first, as the inverted list draws it, with each day's label after (above) that day's oldest message. */
export function roomItems(messages: readonly CommunityMessage[], outgoing: readonly OutgoingMessage[], now: Date = new Date()): Item[] {
  const items: Item[] = [];
  for (let i = outgoing.length - 1; i >= 0; i -= 1) {
    const entry = outgoing[i];
    if (entry) items.push({ kind: 'out', key: entry.localId, entry });
  }
  messages.forEach((message, i) => {
    items.push({ kind: 'post', key: message.id, message });
    const older = messages[i + 1];
    if (!older || dayKey(older.sentAt) !== dayKey(message.sentAt)) {
      items.push({ kind: 'day', key: `day-${dayKey(message.sentAt)}`, label: dayLabel(message.sentAt, now) });
    }
  });
  return items;
}

export type RoomScreenProps = {
  id: string;
  onBack: () => void;
};

/**
 * I25 and I26: a community's room. The header carries the member count and the person's credit balance; the messages are
 * read free, newest at the bottom, live; the host's own messages carry a Host tag; the composer sends one message
 * at a time. A person who is not in the room sees what it is and, for an open one, a Join button.
 */
export function RoomScreen({ id, onBack }: RoomScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const room = useQuery({ queryKey: roomKey(id), queryFn: () => fetchCommunity(id) }, queryClient);
  const credits = useCredits();
  const messages = useRoomMessages(id, focused);

  const notMember = isApiError(messages.error) && messages.error.status === 403;
  const hidden = (isApiError(room.error) && room.error.status === 404) || (isApiError(messages.error) && messages.error.status === 404);

  const header = room.data ? (
    <RoomHeader
      name={room.data.name}
      imageUrl={room.data.imageUrl}
      sub={`${membersFull(room.data.memberCount)} · ${room.data.kind}`}
      credits={credits.data?.creditBalance}
      onBack={onBack}
    />
  ) : (
    <View style={styles.plainBar}>
      <IconButton icon="ChevronLeft" label="Back" onPress={onBack} size={roomBarBack} testID="room-back" />
    </View>
  );

  let body;
  if (hidden) {
    body = (
      <View style={styles.center}>
        <EmptyState
          testID="room-unavailable"
          icon="Ban"
          title="This community isn’t available"
          message="It may have been taken down, or you may not be able to see it."
        />
      </View>
    );
  } else if (room.isPending || (messages.isPending && !notMember)) {
    body = <RoomSkeleton />;
  } else if (room.isError && !room.data) {
    body = (
      <View style={styles.center}>
        <ErrorState
          testID="room-error"
          title="Couldn’t open this community"
          message={isApiError(room.error) ? room.error.message : 'Something went wrong. Try again.'}
          icon={isApiError(room.error) && room.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void room.refetch()}
        />
      </View>
    );
  } else if (notMember && room.data) {
    body = <NotMemberPanel room={room.data} />;
  } else if (messages.isError && !messages.data) {
    body = (
      <View style={styles.center}>
        <ErrorState
          testID="room-messages-error"
          title="Couldn’t load the messages"
          message={isApiError(messages.error) ? messages.error.message : 'Something went wrong. Try again.'}
          icon={isApiError(messages.error) && messages.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void messages.refetch()}
        />
      </View>
    );
  } else {
    body = <Thread room={room.data} messages={messages} />;
  }

  const showComposer = !hidden && !notMember && !room.isPending && !(room.isError && !room.data) && !messages.isPending && !(messages.isError && !messages.data);

  return (
    <KeyboardAvoidingView
      testID="room-screen"
      behavior="padding"
      style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}
    >
      {header}
      <View style={styles.body}>{body}</View>
      {showComposer ? <Composer onSend={messages.send} busy={messages.busy} /> : <View style={{ height: Math.max(insets.bottom, space.lg) }} />}
    </KeyboardAvoidingView>
  );
}

const roomBarBack = 40;

function Thread({ room, messages }: { room: Community | undefined; messages: ReturnType<typeof useRoomMessages> }) {
  const { colors } = useWawu();
  const list = useRef<FlatList<Item>>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [seenNewest, setSeenNewest] = useState<string | undefined>(undefined);
  const newest = messages.items[0];
  const newestId = useRef(newest?.id);
  useEffect(() => {
    newestId.current = newest?.id;
  }, [newest?.id]);

  const items = useMemo(() => roomItems(messages.items, messages.outgoing), [messages.items, messages.outgoing]);

  // Leaving the bottom remembers the newest message the reader has seen; coming back forgets it.
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const near = event.nativeEvent.contentOffset.y <= AT_BOTTOM_PX;
    setAtBottom(near);
    setSeenNewest((seen) => (near ? undefined : (seen ?? newestId.current)));
  }, []);

  // A message from somebody else arrived while the reader is up in the history: say so and offer the way down.
  const waiting = !atBottom && newest !== undefined && seenNewest !== undefined && newest.id !== seenNewest && newest.senderWawuId !== messages.me?.wawuId;
  const toBottom = useCallback(() => {
    list.current?.scrollToOffset({ offset: 0, animated: true });
    setSeenNewest(undefined);
  }, []);

  // What the person just sent is the newest thing there is: show it, wherever they were reading.
  const sendingCount = messages.outgoing.length;
  useEffect(() => {
    if (sendingCount > 0) list.current?.scrollToOffset({ offset: 0, animated: true });
  }, [sendingCount]);

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = messages;
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if (item.kind === 'day') {
        return (
          <Text variant="caption" tone="textMuted" style={[font(600), styles.day]}>
            {item.label}
          </Text>
        );
      }
      if (item.kind === 'out') {
        return (
          <OutgoingPost
            entry={item.entry}
            sender={messages.me}
            isHost={room !== undefined && messages.me?.wawuId === room.hostWawuId}
            onRetry={() => messages.retry(item.entry.localId)}
            onDiscard={() => messages.discard(item.entry.localId)}
          />
        );
      }
      return <MessagePost message={item.message} sender={null} isHost={room !== undefined && item.message.senderWawuId === room.hostWawuId} />;
    },
    [room, messages],
  );

  if (messages.items.length === 0 && messages.outgoing.length === 0 && !hasNextPage) {
    return (
      <View style={styles.center}>
        <EmptyState testID="room-empty" icon="MessageCircle" title="No messages yet" message="Say hello. Reading here is free." />
      </View>
    );
  }

  return (
    <View style={styles.thread}>
      <FlatList
        ref={list}
        testID="room-messages"
        inverted
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ItemSeparatorComponent={Gap}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        onScroll={onScroll}
        scrollEventThrottle={SCROLL_EVENT_MS}
        maintainVisibleContentPosition={{ minIndexForVisible: 1, autoscrollToTopThreshold: AT_BOTTOM_PX }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListFooterComponent={
          isFetchNextPageError ? (
            <View style={styles.older}>
              <Text variant="secondary">Couldn’t load older messages.</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => void fetchNextPage()} />
            </View>
          ) : isFetchingNextPage ? (
            <View style={styles.older} testID="room-loading-older">
              <Skeleton width={roomMetrics.avatar * 4} height={roomMetrics.bubble * 2} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.messages}
        style={styles.list}
      />
      {waiting ? (
        <Pressable
          testID="room-new-messages"
          accessibilityRole="button"
          accessibilityLabel="New messages, go to the newest"
          onPress={toBottom}
          style={[styles.newPill, { backgroundColor: colors.accent }]}
        >
          <Icon name="ChevronDown" size={roomMetrics.dayFont + space.xs} color={colors.textOnAccent} strokeWidth={2.4} />
          <Text variant="caption" tone="textOnAccent" style={font(700)}>
            New messages
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

/** The person is not in the room: what it is, and a way in when it is open. */
function NotMemberPanel({ room }: { room: Community }) {
  const join = useJoinCommunity();
  const membership = useQuery({ queryKey: membershipKey(room.id), queryFn: () => fetchMembership(room.id) }, queryClient);
  const waiting = membership.data?.status === 'pending';
  const isOpen = room.kind === 'open';
  return (
    <View style={styles.notMember} testID="room-not-member">
      <GroupTile uri={room.imageUrl} size={tileMetrics.row} />
      <Text variant="h3" style={[font(700), styles.centered]}>
        {room.name}
      </Text>
      {room.description ? (
        <Text variant="secondary" tone="textSecondary" style={styles.centered}>
          {room.description}
        </Text>
      ) : null}
      {isOpen ? (
        <>
          <Text variant="secondary" tone="textSecondary" style={styles.centered}>
            Join to read and write here. Reading is free.
          </Text>
          <Button
            label="Join"
            size="lg"
            loading={join.isPending}
            onPress={() => join.mutate(room.id)}
            testID="room-join"
          />
          {join.isError ? (
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" style={styles.centered} testID="room-join-error">
              {isApiError(join.error) ? join.error.message : 'Something went wrong. Try again.'}
            </Text>
          ) : null}
        </>
      ) : (
        <Text variant="secondary" tone={waiting ? 'textSecondary' : 'textMuted'} style={styles.centered} testID="room-private-note">
          {waiting ? 'Your request is with the host. You can read here once they approve it.' : 'This community is private. Only members can read it.'}
        </Text>
      )}
    </View>
  );
}

function RoomSkeleton() {
  return (
    <LoadingView testID="room-loading" label="Loading the messages">
      <View style={styles.skeletonPad}>
        {Array.from({ length: roomMetrics.loadingRows }, (_, i) => (
          <View key={i} style={[styles.skeletonRow, i > 0 && styles.skeletonGap]}>
            <Skeleton width={roomMetrics.avatar} height={roomMetrics.avatar} radius={radius.chip} />
            <View style={styles.skeletonWords}>
              <Skeleton width={roomMetrics.avatar * 3} height={roomMetrics.dayFont + space.xs} />
              <Skeleton width={i % 2 === 0 ? '70%' : '45%'} height={roomMetrics.bubble * 2 + space.sm} radius={radius.media} />
            </View>
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  plainBar: { minHeight: roomBarBack + space.lg * 2, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center' },
  thread: { flex: 1 },
  list: { flex: 1 },
  /** The list is inverted, so `flex-end` seats a short thread at the top, under the header, as the design draws it; a long one fills the screen and scrolls. */
  messages: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: roomMetrics.padTop, paddingBottom: roomMetrics.padTop, paddingHorizontal: roomMetrics.padH },
  gap: { height: roomMetrics.between },
  day: { alignSelf: 'center', paddingVertical: roomMetrics.dayPad, fontSize: roomMetrics.dayFont },
  older: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  newPill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: space.md,
    height: layout.tapMin - space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  notMember: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  centered: { textAlign: 'center' },
  skeletonPad: { paddingTop: roomMetrics.padTop, paddingHorizontal: roomMetrics.padH },
  skeletonRow: { flexDirection: 'row', gap: space.md },
  skeletonGap: { marginTop: roomMetrics.between },
  skeletonWords: { flex: 1, gap: space.sm },
});
