import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useFocusEffect, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button, IconButton } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { BuyCreditsEntry } from '@/features/credits/BuyCreditsEntry';
import { CreateFrame } from '@/features/create/CreateFrame';
import { countsKey } from '@/features/me/counts';
import { font, space, useWawu } from '@/theme';

import { feedKey, feedRoot, fetchFeedPage, markRead, type FeedCategory, type FeedItem, type FeedPage } from './api';
import { CAUGHT_UP, CHIPS, actionOf, iconOf, routeOf, toneOf, whenOf } from './model';

/** design/_gen/kit.js `body` pads 120 at the foot and M32 centres its words in what is left under the bar; CreateFrame already keeps `space.xl` of it, so the empty block lifts by the rest. */
const EMPTY_LIFT = 120 - space.xl;

/** design/_gen/me.js `nRow`: a 44 circle, 12 to the words, 14 above and below; the title 15 (700 unread, 600 read), the words 13.5 on a 1.4 line 3 under it, the button 8 under them; the time 12 and the unread dot 8, 8 apart. */
const rowMetrics = { between: 12, padV: 14, circle: 44, title: 15, titleLead: 20, body: 13.5, bodyLead: 1.4, bodyGap: 3, actionGap: 8, time: 12, dot: 8, sideGap: 8, partsBetween: 12 } as const;

export type NotificationFeedScreenProps = {
  onBack: () => void;
  /** A row (or its button) opens a screen of the app. */
  onOpen: (href: Href) => void;
  /** The sliders in the bar open Notifications in Settings (Z3). */
  onOpenSettings: () => void;
};

type Cached = InfiniteData<FeedPage, string | null> | undefined;

/** The cache with one notification read and the unread count one lower. */
function withRead(data: Cached, id: string): Cached {
  if (!data) return data;
  const was = data.pages.some((page) => page.items.some((item) => item.id === id && !item.read));
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      unreadCount: was ? Math.max(0, page.unreadCount - 1) : page.unreadCount,
      items: page.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
  };
}

/**
 * M31 and M32 · Notifications. The person's notifications, newest first, from `GET /me/notifications`, by the chips All, Money,
 * Messages and Content: each row says what the Hub says (its title, its words, its time) in the colour of its tone. A new one has the
 * accent dot and a bold title; opening a row marks it read and opens what it is about when that screen is built ("See why" on a piece
 * sent back opens M26, "Top up" on low credits raises I28, "Reply" on a paid question opens I10). A row with nothing to open is pressed only
 * to mark it read. With nothing at all, M32 says the person is caught up.
 */
export function NotificationFeedScreen({ onBack, onOpen, onOpenSettings }: NotificationFeedScreenProps) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<FeedCategory>('all');
  const [topUp, setTopUp] = useState(false);
  const { colors } = useWawu();
  const list = useInfiniteQuery({
    queryKey: feedKey(category),
    queryFn: ({ pageParam }) => fetchFeedPage(category, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 0,
  });
  // A notice that lands while the list is open shows without reopening the app (FIX-105, R-81: a community's notice is written
  // a few seconds after the message): the list reads the Hub again when the screen comes back into focus (from what a row
  // opened), when the app returns to the front while the list is in front, and on a pull. The first focus is the screen opening.
  const refetch = list.refetch;
  const opened = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (opened.current) void refetch();
      opened.current = true;
      const watch = AppState.addEventListener('change', (state) => {
        if (state === 'active') void refetch();
      });
      return () => watch.remove();
    }, [refetch]),
  );
  const [pulled, setPulled] = useState(false);
  const pull = async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  };

  // A row's read is sent once: a second tap before the list has redrawn (item.read still false) sends nothing.
  const sentRead = useRef(new Set<string>());
  const read = useMutation({
    mutationFn: markRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: feedRoot });
      queryClient.setQueriesData<InfiniteData<FeedPage, string | null>>({ queryKey: feedRoot }, (data) => withRead(data, id));
    },
    // Whatever the Hub says is true: on a refusal the row goes back to what it holds, and a tap can send the read again.
    onError: (_error, id) => {
      sentRead.current.delete(id);
      void queryClient.invalidateQueries({ queryKey: feedRoot });
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: countsKey }),
  });

  const items = useMemo(() => list.data?.pages.flatMap((page) => page.items) ?? [], [list.data]);
  const now = new Date();
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const more = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  // M32 draws no chips: they come back as soon as there is a list to filter. A chip with nothing in it keeps them.
  const caughtUp = category === 'all' && list.isSuccess && items.length === 0;

  const readOnce = (item: FeedItem) => {
    if (item.read || sentRead.current.has(item.id)) return;
    sentRead.current.add(item.id);
    read.mutate(item.id);
  };

  // A button under a row opens the screen it names (Reply goes to the asker's conversation, which the row itself does not).
  const openAction = (item: FeedItem, href: Href) => {
    if (!item.read) read.mutate(item.id);
    onOpen(href);
  };

  const raiseTopUp = (item: FeedItem) => {
    readOnce(item);
    setTopUp(true);
  };

  const open = (item: FeedItem) => {
    // Low credits are bought in a sheet (the row's Top up button): a tap on the row opens the same sheet.
    if (actionOf(item)?.kind === 'top-up') {
      raiseTopUp(item);
      return;
    }
    readOnce(item);
    const href = routeOf(item);
    if (href) onOpen(href);
  };

  return (
    <>
      <CreateFrame
        testID="notifications-screen"
        title="Notifications"
        onLeave={onBack}
        gap={rowMetrics.partsBetween}
        onNearEnd={more}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void pull()} tintColor={colors.accent} />}
        trailing={<IconButton icon="Settings2" label="Notification settings" onPress={onOpenSettings} testID="notifications-settings" />}
      >
        {caughtUp ? null : <FilterChips testID="notifications-chip" label="Filter notifications" items={CHIPS} value={category} onChange={setCategory} inset={0} />}
        {list.isPending ? (
          <SkeletonRows count={5} testID="notifications-loading" />
        ) : list.isError && items.length === 0 ? (
          <ErrorState
            testID="notifications-error"
            title="Couldn't load your notifications"
            message={isApiError(list.error) ? list.error.message : 'Check your connection and try again.'}
            onRetry={() => void list.refetch()}
          />
        ) : items.length === 0 ? (
          <View testID="notifications-empty-body" style={styles.empty}>
            <EmptyState testID="notifications-empty" icon="Bell" title={CAUGHT_UP.title} message={CAUGHT_UP.message} />
          </View>
        ) : (
          <View testID="notifications-list">
            {items.map((item) => (
              <Row key={item.id} item={item} when={whenOf(item.createdAt, now)} onOpen={() => open(item)} onAction={(action) => (action.kind === 'top-up' ? raiseTopUp(item) : openAction(item, action.href))} />
            ))}
            {isFetchingNextPage ? <SkeletonRows count={1} testID="notifications-more-loading" /> : null}
            {list.isFetchNextPageError && !isFetchingNextPage ? (
              <Pressable accessibilityRole="button" testID="notifications-more-retry" onPress={() => void fetchNextPage()} style={styles.moreFailed}>
                <Text variant="linkStrong">Couldn&apos;t load more. Try again</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </CreateFrame>
      <BuyCreditsEntry visible={topUp} onClose={() => setTopUp(false)} doneLabel="Done" />
    </>
  );
}

type RowProps = { item: FeedItem; when: string; onOpen: () => void; onAction: (action: NonNullable<ReturnType<typeof actionOf>>) => void };

function Row({ item, when, onOpen, onAction }: RowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const action = actionOf(item);
  // A row is pressed when it opens something or has a dot to clear.
  const pressable = !item.read || routeOf(item) !== null;
  const label = [item.title, item.body, when, item.read ? '' : 'new'].filter(Boolean).join(', ');
  const body = (
    <>
      <IconTile icon={iconOf(item.kind)} tone={toneOf(item)} size={rowMetrics.circle} />
      <View style={styles.words}>
        <Text variant="body" style={[styles.title, font(item.read ? 600 : 700)]}>
          {item.title}
        </Text>
        {item.body ? (
          <Text variant="body" tone="textSecondary" style={styles.bodyText}>
            {item.body}
          </Text>
        ) : null}
        {action ? (
          <View style={styles.action}>
            <Button label={action.label} variant="secondary" size="sm" onPress={() => onAction(action)} testID={`notification-action-${item.id}`} />
          </View>
        ) : null}
      </View>
      <View style={styles.side}>
        <Text variant="body" tone="textMuted" style={styles.time}>
          {when}
        </Text>
        {item.read ? null : <View testID={`notification-dot-${item.id}`} style={[styles.dot, { backgroundColor: colors.accent }]} />}
      </View>
    </>
  );
  const frame = [styles.row, { borderBottomColor: colors.borderHairline }];
  return pressable ? (
    <Pressable testID={`notification-row-${item.id}`} accessibilityRole="button" accessibilityLabel={label} onPress={onOpen} {...ring.handlers} style={[...frame, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={`notification-row-${item.id}`} accessible accessibilityLabel={label} style={frame}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', paddingBottom: EMPTY_LIFT },
  row: { flexDirection: 'row', gap: rowMetrics.between, paddingVertical: rowMetrics.padV, borderBottomWidth: StyleSheet.hairlineWidth },
  words: { flex: 1, minWidth: 0 },
  title: { fontSize: rowMetrics.title, lineHeight: rowMetrics.titleLead },
  bodyText: { fontSize: rowMetrics.body, lineHeight: rowMetrics.body * rowMetrics.bodyLead, marginTop: rowMetrics.bodyGap },
  action: { marginTop: rowMetrics.actionGap, flexDirection: 'row' },
  side: { alignItems: 'flex-end', gap: rowMetrics.sideGap },
  time: { fontSize: rowMetrics.time },
  dot: { width: rowMetrics.dot, height: rowMetrics.dot, borderRadius: rowMetrics.dot / 2 },
  moreFailed: { paddingVertical: space.lg, alignItems: 'center' },
});
