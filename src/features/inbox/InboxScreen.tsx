import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
  /** The round buttons at the right of the title (kit.js line 24, `Big`), each added by the task that builds the screen it opens. */
  headerActions?: ReactNode;
};

/**
 * I1, I35 and I36: the inbox, its chips, and the empty and loading states, with a real error state
 * (the request failed, with a retry). The list reads `GET /inbox` a page at a time, refreshes when the
 * live connection says something changed (see `unread.ts`), and when pulled down. The Communities chip
 * swaps the list for I24 (`CommunitiesView`), which reads its own rooms.
 */
export function InboxScreen({ renderers = inboxRowRenderers, headerActions }: InboxScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const [chip, setChip] = useState(inboxChips[0]?.value ?? 'all');
  const kind = inboxChips.find((c) => c.value === chip)?.kind ?? 'all';

  return (
    <View testID="inbox-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.title}>
        <Text variant="title">Inbox</Text>
        {headerActions ? <View style={styles.actions}>{headerActions}</View> : null}
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
  // Some kind can be drawn but the pages read so far hold none of it: read on until one is found or the pages end.
  // With no kind drawn at all there is nothing to look for, so nothing is read ahead.
  const canDraw = Object.values(renderers).some((renderer) => renderer !== undefined);
  const readingPast = rows.length === 0 && canDraw && hasNextPage && !inbox.isFetchNextPageError;

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

  // Reads the next page when nothing is in flight and no row is drawn yet. It runs again each time a read ends, however it ended: a page
  // landed (`pagesRead`), or a refresh (a live event, a return to the tab) cancelled the page being read and refetched the pages held.
  // That refetch ends with the same pages and the same flags as before it began, and a render may never have shown it under way, so
  // `dataUpdatedAt` tells this effect it ended; without it the screen would sit on the loading list with nothing being read. A refetch
  // that is refused moves `errorUpdatedAt` instead and leaves `dataUpdatedAt` where it was, so that one is watched too. It cannot loop:
  // each run needs a read to have ended, and a read-on stops at the last page, at an error (one Try again) or at a drawn row.
  const pagesRead = inbox.data?.pages.length ?? 0;
  useEffect(() => {
    if (readingPast && !inbox.isFetching) void fetchNextPage();
  }, [readingPast, inbox.isFetching, inbox.dataUpdatedAt, inbox.errorUpdatedAt, pagesRead, fetchNextPage]);

  // Nothing is read ahead unless a row is drawn: a page that adds nothing to the screen is not worth a request.
  const onEndReached = useCallback(() => {
    if (rows.length > 0 && hasNextPage && !isFetchingNextPage && !inbox.isFetchNextPageError) void fetchNextPage();
  }, [rows.length, hasNextPage, isFetchingNextPage, inbox.isFetchNextPageError, fetchNextPage]);

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
  } else if (rows.length === 0) {
    // No row to draw: the Hub served none, or every row it served is of a kind nobody has built yet (R-47).
    // The same empty state either way; a blank body would read as a broken screen.
    if (readingPast) {
      body = <InboxSkeleton />;
    } else if (inbox.isFetchNextPageError) {
      center = true;
      body = (
        <ErrorState
          testID="inbox-error"
          title="Couldn’t load your inbox"
          message="Something went wrong. Try again."
          onRetry={() => void fetchNextPage()}
        />
      );
    } else {
      center = true;
      body = (
        <EmptyState
          testID="inbox-empty"
          title="No messages yet"
          message="Message a creator from their profile, or join a community to talk with people like you."
          action={{ label: 'Browse communities', onPress: onBrowseCommunities }}
        />
      );
    }
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
      // Under no row, the body already says what the next page is doing.
      ListFooterComponent={
        rows.length === 0 ? null : inbox.isFetchNextPageError ? (
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
  title: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingTop: inboxMetrics.titleTop, paddingBottom: inboxMetrics.titleBottom, paddingHorizontal: layout.gutter },
  actions: { flexDirection: 'row', gap: space.sm },
  chips: { paddingBottom: inboxMetrics.chipsBottom },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: inboxMetrics.listTop, paddingBottom: inboxMetrics.listBottom },
  centered: { justifyContent: 'center' },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
});
