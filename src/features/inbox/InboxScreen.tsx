import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { isApiError } from '@/api/errors';
import { CommunitiesView } from '@/features/communities/CommunitiesView';
import { layout, space, useWawu } from '@/theme';

import type { InboxItem, InboxKind } from './api';
import { communitiesChip, inboxChips } from './chips';
import { InboxSkeleton } from './InboxSkeleton';
import { drawableRows, inboxRowRenderers, type InboxRowRenderers } from './rows';
import { useInbox } from './useInbox';

/** design/_gen/kit.js line 24, `Big`: the title sits 6 below the status bar and 14 above what follows; the chips leave 6 under them. */
const inboxMetrics = {
  titleTop: 6,
  titleBottom: 14,
  chipsBottom: 6,
  /** `body()` (kit.js line 35) pads 8 above the list and 120 below it, over a tab bar that sits on top of it; here the bar is its own box. */
  listTop: space.sm,
  listBottom: 120 - layout.tabbarH,
} as const;

export type InboxScreenProps = {
  /** Which kinds of row are drawn, and how. Defaults to the app's (`rows.tsx`). */
  renderers?: InboxRowRenderers;
};

/**
 * I1, I35 and I36: the inbox, its chips, and the empty and loading states, with a real error state
 * (the request failed, with a retry). The list reads `GET /inbox` a page at a time, refreshes when the
 * live connection says something changed (see `unread.ts`), and when pulled down. The Communities chip
 * swaps the list for I24 (`CommunitiesView`), which reads its own rooms.
 */
export function InboxScreen({ renderers = inboxRowRenderers }: InboxScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const [chip, setChip] = useState(inboxChips[0]?.value ?? 'all');
  const kind = inboxChips.find((c) => c.value === chip)?.kind ?? 'all';

  return (
    <View testID="inbox-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.title}>
        <Text variant="title">Inbox</Text>
      </View>
      <View style={styles.chips}>
        <FilterChips items={inboxChips} value={chip} onChange={setChip} label="Filter your inbox" testID="inbox-chips" />
      </View>
      {chip === communitiesChip ? (
        <CommunitiesView />
      ) : (
        <InboxList kind={kind} renderers={renderers} onBrowseCommunities={() => setChip(communitiesChip)} />
      )}
    </View>
  );
}

type InboxListProps = {
  kind: InboxKind | 'all';
  renderers: InboxRowRenderers;
  /** The empty state's way on: the Communities chip. */
  onBrowseCommunities: () => void;
};

function InboxList({ kind, renderers, onBrowseCommunities }: InboxListProps) {
  const { colors } = useWawu();
  const focused = useIsFocused();
  const inbox = useInbox(kind);
  const [pulled, setPulled] = useState(false);

  const rows = drawableRows(inbox.items, renderers);
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isStale } = inbox;

  // Coming back to the tab reads again when what is held has gone stale.
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current && isStale) void refetch();
    wasFocused.current = focused;
  }, [focused, isStale, refetch]);

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  }, [refetch]);

  // A page that adds nothing to the screen is not worth a request, unless some kind of row can be drawn at
  // all: then a later page may hold one, so pages are read until a row appears or the list ends.
  const canDraw = Object.keys(renderers).length > 0;
  const pageFailed = inbox.isFetchNextPageError;
  const onEndReached = useCallback(() => {
    if ((rows.length > 0 || canDraw) && hasNextPage && !isFetchingNextPage && !pageFailed) void fetchNextPage();
  }, [rows.length, canDraw, hasNextPage, isFetchingNextPage, pageFailed, fetchNextPage]);
  const nothingDrawn = rows.length === 0 && inbox.items.length > 0;
  const wantsMore = canDraw && hasNextPage && !isFetchingNextPage && !pageFailed;
  // The count of pages read is a dependency so that every page that arrives, and shows nothing, asks for the next.
  const pagesRead = inbox.data?.pages.length ?? 0;
  useEffect(() => {
    if (pagesRead > 0 && nothingDrawn && wantsMore) void fetchNextPage();
  }, [pagesRead, nothingDrawn, wantsMore, fetchNextPage]);

  const renderRow = useCallback(({ item }: { item: InboxItem }) => renderers[item.kind]?.(item) ?? null, [renderers]);

  let body;
  let center = false;
  if (inbox.isPending) {
    body = <InboxSkeleton />;
  } else if (inbox.isError && !inbox.data) {
    center = true;
    body = (
      <ErrorState
        testID="inbox-error"
        title="Couldn’t load your inbox"
        message={isApiError(inbox.error) ? inbox.error.message : 'Something went wrong. Try again.'}
        icon={isApiError(inbox.error) && inbox.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void refetch()}
      />
    );
  } else if (inbox.items.length === 0) {
    center = true;
    body = (
      <EmptyState
        testID="inbox-empty"
        title="No messages yet"
        message="Message a creator from their profile, or join a community to talk with people like you."
        action={{ label: 'Browse communities', onPress: onBrowseCommunities }}
      />
    );
  } else {
    body = null;
  }

  return (
    <FlatList
      testID="inbox-list"
      data={body ? [] : rows}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      ListEmptyComponent={body}
      ListFooterComponent={
        inbox.isFetchNextPageError ? (
          <View style={styles.footer}>
            <Text variant="secondary">Couldn’t load more messages.</Text>
            <Button label="Try again" variant="secondary" size="sm" onPress={() => void fetchNextPage()} />
          </View>
        ) : isFetchingNextPage ? (
          <InboxSkeleton testID="inbox-loading-more" />
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      contentContainerStyle={[styles.content, center && styles.centered]}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { paddingTop: inboxMetrics.titleTop, paddingBottom: inboxMetrics.titleBottom, paddingHorizontal: layout.gutter },
  chips: { paddingBottom: inboxMetrics.chipsBottom },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: inboxMetrics.listTop, paddingBottom: inboxMetrics.listBottom },
  centered: { justifyContent: 'center' },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
});
