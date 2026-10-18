import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Share,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchRequestsCount, requestsCountKey } from '@/features/community-host/api';
import { fetchHostHandle, fetchPass, hostKey, passKey } from '@/features/community-pass/api';
import { BuyCreditsEntry } from '@/features/credits/BuyCreditsEntry';
import { OutOfCreditsPanel } from '@/features/credits/OutOfCreditsPanel';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchRoom, roomKey, type CommunityMessage, type RoomView } from './api';
import { Composer, type ComposerAttach, type ComposerDraft } from './Composer';
import { CoverHeader, CoverShare } from './CoverHeader';
import { dayKey, dayLabel, membersFull, outOfCreditsLine, priceLine } from './format';
import { GroupTile, tileMetrics } from './GroupTile';
import { MessagePost, OutgoingPost } from './MessagePost';
import { CreditPill, RoomHeader } from './RoomHeader';
import { useJoinCommunity } from './useCommunities';
import { useCredits, useMessageCost } from './useCredits';
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
 * I25 and I26: a community's room, read from `GET /communities/:id/room` (the room, the person's role in it and what one
 * message costs them). The header carries the member count and the person's credit balance; the messages are read free,
 * newest at the bottom, live; the host's own messages carry a Host tag; the composer states the price and sends one message
 * at a time. A person who is not in the room sees what it is and, for an open one, a Join button.
 */
export function RoomScreen({ id, onBack }: RoomScreenProps) {
  const { status } = useSession();
  if (status === 'signedOut') return <SignInPrompt onBack={onBack} />;
  if (status === 'restoring') {
    return (
      <View style={styles.root}>
        <RoomSkeleton />
      </View>
    );
  }
  return <SignedInRoom id={id} onBack={onBack} />;
}

/** A room opened by someone who is signed out (a link, a saved screen): asked to sign in, never shown the server's refusal. */
function SignInPrompt({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="room-signed-out" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.plainBar}>
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} size={roomBarBack} testID="room-back" />
      </View>
      <View style={styles.center}>
        <EmptyState
          icon="Lock"
          title="Sign in to open this community"
          message="Communities open once you are signed in."
          action={{ label: 'Sign in', onPress: () => router.push('/sign-in') }}
        />
      </View>
    </View>
  );
}

function SignedInRoom({ id, onBack }: RoomScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const room = useQuery({ queryKey: roomKey(id), queryFn: () => fetchRoom(id) }, queryClient);
  const credits = useCredits();
  const prices = useMessageCost();
  const messages = useRoomMessages(id, focused);
  const [buying, setBuying] = useState(false);
  const [draft, setDraft] = useState<ComposerDraft | undefined>(undefined);
  const edit = (localId: string) => {
    const entry = messages.outgoing.find((candidate) => candidate.localId === localId);
    if (!entry) return;
    setDraft({ id: (draft?.id ?? 0) + 1, text: entry.text, photo: entry.photo ?? null });
    messages.discard(localId, true);
  };
  const retryAll = () => {
    void room.refetch();
    void messages.refetch();
  };

  const notMember = isApiError(messages.error) && messages.error.status === 403;
  const hidden = (isApiError(room.error) && room.error.status === 404) || (isApiError(messages.error) && messages.error.status === 404);

  const isPrivate = room.data?.kind === 'private';
  const hostWawuId = room.data?.hostWawuId;
  const host = useQuery({ queryKey: hostKey(hostWawuId ?? ''), queryFn: () => fetchHostHandle(hostWawuId as string), enabled: isPrivate && Boolean(hostWawuId), retry: false }, queryClient);
  // The host of a private room that holds people waiting on them (a removed member is one, G-INBOX-24-6) gets the way into I34; nobody else does.
  const hostsPrivate = isPrivate && room.data?.role === 'host';
  const waitingOnHost = useQuery({ queryKey: requestsCountKey(id), queryFn: () => fetchRequestsCount(id), enabled: hostsPrivate, retry: false }, queryClient);
  const header = room.data ? (
    isPrivate ? (
      // I37: a private room keeps its picture as the header, with the credit balance on it.
      <CoverHeader
        size="room"
        name={room.data.name}
        imageUrl={room.data.imageUrl}
        sub={[membersFull(room.data.memberCount), host.data ? `hosted by @${host.data}` : null].filter(Boolean).join(' · ')}
        onBack={onBack}
        right={
          credits.data?.creditBalance !== undefined ? (
            <CreditPill credits={credits.data.creditBalance} />
          ) : (
            <CoverShare onPress={() => void Share.share({ message: room.data?.link ?? '' }).catch(() => undefined)} />
          )
        }
        testID="room-cover"
      />
    ) : (
      <RoomHeader
        name={room.data.name}
        imageUrl={room.data.imageUrl}
        sub={`${membersFull(room.data.memberCount)} · ${room.data.kind}`}
        credits={credits.data?.creditBalance}
        onBack={onBack}
      />
    )
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
          onRetry={retryAll}
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
          onRetry={retryAll}
        />
      </View>
    );
  } else {
    body = <Thread room={room.data} messages={messages} onEdit={edit} onBuy={() => setBuying(true)} />;
  }

  const showComposer = !hidden && !notMember && !room.isPending && !(room.isError && !room.data) && !messages.isPending && !(messages.isError && !messages.data);

  // What a photo costs this person: the Hub's price by kind (R-62), and nothing for the host, who sends every kind free in their own room.
  const costs = prices.data?.creditsByKind;
  const hostSends = room.data?.role === 'host';
  const photoCost = costs === undefined ? undefined : hostSends ? 0 : costs.photo;
  // I27: no credits left while the Hub prices photos, video or voice notes. Text and emoji stay free, so the composer stays; Buy credits opens I28.
  const outOfCredits = showComposer && !hostSends && credits.data?.creditBalance === 0 && costs !== undefined && outOfCreditsLine(costs) !== null;
  // I38: the "+" is drawn once the Hub's prices are known. With no credits and a priced photo it opens Buy credits instead of the library.
  const attach: ComposerAttach | undefined =
    costs === undefined || photoCost === undefined
      ? undefined
      : {
          photoCost,
          line: hostSends ? null : priceLine(costs),
          blocked: photoCost > 0 && credits.data?.creditBalance === 0,
          onBuy: () => setBuying(true),
        };

  return (
    <KeyboardAvoidingView
      testID="room-screen"
      behavior="padding"
      style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: isPrivate ? 0 : insets.top }]}
    >
      {header}
      {hostsPrivate && (waitingOnHost.data ?? 0) > 0 ? <JoinRequestsEntry id={id} count={waitingOnHost.data ?? 0} /> : null}
      <View style={styles.body}>{body}</View>
      {outOfCredits && costs ? <OutOfCreditsPanel onBuy={() => setBuying(true)} line={outOfCreditsLine(costs) ?? undefined} /> : null}
      {showComposer ? <Composer onSend={messages.send} busy={messages.busy} draft={draft} attach={attach} /> : <View style={{ height: Math.max(insets.bottom, space.lg) }} />}
      {buying ? <BuyCreditsEntry visible onClose={() => setBuying(false)} doneLabel="Back to chat" onAdded={() => void credits.refetch()} /> : null}
    </KeyboardAvoidingView>
  );
}

const roomBarBack = 40;

/** The host's way into I34 (`/community/requests/<id>`): one row under the cover, drawn only while someone is waiting on them. */
function JoinRequestsEntry({ id, count }: { id: string; count: number }) {
  const router = useRouter();
  return (
    <View style={styles.requestsEntry}>
      <ListRow
        testID="room-requests"
        lead={<IconTile icon="Users" tone="accent" size={roomBarBack} />}
        title="Join requests"
        subtitle={`${count} waiting`}
        onPress={() => router.push({ pathname: '/community/requests/[id]', params: { id } })}
        accessibilityLabel={`Join requests, ${count} waiting`}
      />
    </View>
  );
}

function Thread({ room, messages, onEdit, onBuy }: { room: RoomView | undefined; messages: ReturnType<typeof useRoomMessages>; onEdit: (localId: string) => void; onBuy: () => void }) {
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
            onEdit={() => onEdit(item.entry.localId)}
            onBuy={onBuy}
          />
        );
      }
      return <MessagePost message={item.message} sender={null} isHost={room !== undefined && item.message.senderWawuId === room.hostWawuId} />;
    },
    [room, messages, onEdit, onBuy],
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

/**
 * The person is not in the room: what it is, and a way in. An open room has Join. A private room that sells a monthly pass (R-63) opens
 * I30 in this screen's place, where the host's price is paid from the wallet (INBOX-14), and a pass that ended is brought back the same
 * way; a private room that sells none keeps the older words (the room view says whether a request is still with the host: `role` pending).
 */
function NotMemberPanel({ room }: { room: RoomView }) {
  const router = useRouter();
  const join = useJoinCommunity();
  const waiting = room.role === 'pending';
  const isOpen = room.kind === 'open';
  const pass = useQuery({ queryKey: passKey(room.id), queryFn: () => fetchPass(room.id), enabled: !isOpen, staleTime: 0 }, queryClient);
  // I30 draws both: the host's price to a person who can pay, and "Removed by the host" with the Hub's sentence to a member the host removed
  // (a pending row in a pass room, INBOX-24 round 2). Neither is a request still with the host, so the older words below are not used for them.
  const sellsPass = !isOpen && pass.data?.sellsPass === true && !pass.data.isHost && (pass.data.canBuy || waiting);
  useEffect(() => {
    if (sellsPass) router.replace({ pathname: '/community/pass/[id]', params: { id: room.id } });
  }, [sellsPass, room.id, router]);
  if (!isOpen && pass.isPending) return <RoomSkeleton />;
  if (sellsPass) return <RoomSkeleton />;
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
  requestsEntry: { paddingHorizontal: layout.gutter },
  notMember: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  centered: { textAlign: 'center' },
  skeletonPad: { paddingTop: roomMetrics.padTop, paddingHorizontal: roomMetrics.padH },
  skeletonRow: { flexDirection: 'row', gap: space.md },
  skeletonGap: { marginTop: roomMetrics.between },
  skeletonWords: { flex: 1, gap: space.sm },
});
