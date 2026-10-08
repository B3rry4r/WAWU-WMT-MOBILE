import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { layout, radius } from '@/theme';

import { fetchHeldPage, heldKey, type HeldView } from './ticketsApi';
import { GroupRow, listMetrics, Page, RefreshFailed, TicketNav } from './ticketParts';

const views = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
] as const;

const SKELETON_ROWS = 2;
const SKELETON_ROW = 72;

export type MyTicketsScreenProps = {
  onBack: () => void;
  onOpenTicket: (ticketId: string) => void;
};

/** E6 · My tickets: Upcoming and Past, one row per order and tier ("2 × VIP"); a row opens the ticket's QR (E7). */
export function MyTicketsScreen({ onBack, onOpenTicket }: MyTicketsScreenProps) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<HeldView>('upcoming');
  const list = useInfiniteQuery({
    queryKey: heldKey(view),
    queryFn: ({ pageParam }) => fetchHeldPage(view, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
  const groups = (list.data?.pages ?? []).flatMap((page) => page.groups);
  const offline = list.isError && isApiError(list.error) && list.error.kind === 'network';

  return (
    <Page testID="my-tickets-screen" insetTop={insets.top}>
      <TicketNav title="My tickets" onBack={onBack} backTestID="my-tickets-back" />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: listMetrics.bottom + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <FilterChips testID="my-tickets-views" label="Show tickets" items={views} value={view} onChange={setView} inset={0} />
        {list.isPending ? (
          <LoadingView label="Loading your tickets" testID="my-tickets-loading">
            <View style={styles.list}>
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <Skeleton key={i} height={SKELETON_ROW} radius={radius.media} />
              ))}
            </View>
          </LoadingView>
        ) : list.isError && !list.data ? (
          <ErrorState
            testID="my-tickets-error"
            title={offline ? "You're offline" : "Couldn't load your tickets"}
            message={isApiError(list.error) ? list.error.message : 'Check your connection and try again.'}
            onRetry={() => void list.refetch()}
          />
        ) : groups.length === 0 ? (
          <EmptyState
            testID="my-tickets-empty"
            icon="Ticket"
            title={view === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
            message={view === 'upcoming' ? 'Tickets you get for events show up here.' : 'Tickets for events that are over show up here.'}
          />
        ) : (
          <View style={styles.list}>
            {list.isError ? (
              <RefreshFailed
                testID="my-tickets-refresh-failed"
                message={offline ? "You're offline. These tickets may be out of date." : "Couldn't refresh. These tickets may be out of date."}
                onRetry={() => void (list.hasNextPage && list.isFetchNextPageError ? list.fetchNextPage() : list.refetch())}
              />
            ) : null}
            {groups.map((group) => (
              <GroupRow key={`${group.orderId}:${group.ticketTypeId}`} group={group} onOpen={onOpenTicket} />
            ))}
            {list.hasNextPage ? (
              <View style={styles.more}>
                <Button
                  testID="my-tickets-more"
                  label="Show more"
                  variant="secondary"
                  size="md"
                  loading={list.isFetchingNextPage}
                  onPress={() => void list.fetchNextPage()}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: layout.gutter, paddingTop: listMetrics.top, gap: listMetrics.stack },
  list: { gap: listMetrics.stack },
  more: { alignItems: 'center', paddingTop: listMetrics.stack },
});
