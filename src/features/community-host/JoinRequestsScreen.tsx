import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { CreateFrame } from '@/features/create/CreateFrame';
import { fetchRoom, roomKey } from '@/features/communities/api';
import { font, layout, space, useWawu } from '@/theme';

import { approveRequest, declineRequest, fetchRequests, requestsKey, type JoinRequest } from './api';
import { askedAgo, requestLine } from './model';

/** design/_gen/inbox.js line 89, `requests`: a 48 avatar, 12 beside the name (15.5 / 600) and its line (13, muted), the two buttons under at the `md` size, 8 apart. */
const metrics = { avatar: 48, name: 15.5, line: 13, between: 12, padV: 14, buttons: 8, loadingRows: 3 } as const;

export type JoinRequestsScreenProps = { id: string; onBack: () => void };

/**
 * I34 · Join requests (INBOX-14). The queue of a private room that already holds requests: who asked, how long ago, Decline and Approve.
 * A private room made now is joined by a pass and has no queue (R-63), so the screen is reached only from a room the Hub lists requests for.
 * The Hub serves the requester's handle and picture; the headline and city the board draws are not served (G-INBOX-14-2) and are left out.
 */
export function JoinRequestsScreen({ id, onBack }: JoinRequestsScreenProps) {
  const { colors } = useWawu();
  const room = useQuery({ queryKey: roomKey(id), queryFn: () => fetchRoom(id) }, queryClient);
  const list = useInfiniteQuery(
    {
      queryKey: requestsKey(id),
      queryFn: ({ pageParam }) => fetchRequests(id, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
    },
    queryClient,
  );
  const items = useMemo(() => list.data?.pages.flatMap((page) => page.items).filter((row) => row.status === 'pending') ?? [], [list.data]);
  const settle = useMutation(
    {
      mutationFn: ({ userWawuId, approve }: { userWawuId: string; approve: boolean }) => (approve ? approveRequest(id, userWawuId) : declineRequest(id, userWawuId)),
      onSuccess: async () => {
        await Promise.all([queryClient.invalidateQueries({ queryKey: requestsKey(id) }), queryClient.invalidateQueries({ queryKey: roomKey(id) })]);
      },
    },
    queryClient,
  );
  const working = settle.isPending ? settle.variables?.userWawuId : undefined;
  const subtitle = room.data ? `${room.data.name} · ${room.data.kind}` : undefined;

  let body;
  if (list.isPending) {
    body = (
      <LoadingView testID="requests-loading" label="Loading the join requests">
        {Array.from({ length: metrics.loadingRows }, (_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width={metrics.avatar} height={metrics.avatar} radius={metrics.avatar / 2} />
            <Skeleton width={layout.screenW / 2} height={metrics.avatar / 2} />
          </View>
        ))}
      </LoadingView>
    );
  } else if (list.isError && !list.data) {
    body = (
      <ErrorState
        testID="requests-error"
        title="Couldn’t load the join requests"
        message={isApiError(list.error) ? list.error.message : 'Something went wrong. Try again.'}
        icon={isApiError(list.error) && list.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void list.refetch()}
      />
    );
  } else if (items.length === 0) {
    body = <EmptyState testID="requests-empty" icon="Users" title="No requests waiting" message="People who ask to join this room show up here." />;
  } else {
    body = (
      <FlatList
        testID="requests-list"
        data={items}
        keyExtractor={(row) => row.id}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
        renderItem={({ item }) => (
          <Row
            row={item}
            busy={working === item.userWawuId}
            disabled={settle.isPending}
            onApprove={() => settle.mutate({ userWawuId: item.userWawuId, approve: true })}
            onDecline={() => settle.mutate({ userWawuId: item.userWawuId, approve: false })}
          />
        )}
        ItemSeparatorComponent={() => <View style={[styles.rule, { backgroundColor: colors.borderHairline }]} />}
      />
    );
  }

  return (
    <CreateFrame testID="requests-screen" title="Join requests" subtitle={subtitle} onLeave={onBack} gap={0}>
      {settle.isError ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="requests-failed">
          {isApiError(settle.error) ? settle.error.message : 'That did not go through. Try again.'}
        </Text>
      ) : null}
      {body}
    </CreateFrame>
  );
}

function Row({ row, busy, disabled, onApprove, onDecline }: { row: JoinRequest; busy: boolean; disabled: boolean; onApprove: () => void; onDecline: () => void }) {
  const who = row.handle ? `@${row.handle.replace(/^@/, '')}` : 'Someone';
  return (
    <View style={styles.row} testID={`request-${row.userWawuId}`}>
      <View style={styles.who}>
        <Avatar name={row.handle ?? undefined} source={row.avatarUrl ?? undefined} size={metrics.avatar} decorative />
        <View style={styles.words}>
          <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: metrics.name }]}>
            {who}
          </Text>
          <Text variant="caption" tone="textMuted" style={{ fontSize: metrics.line }}>
            {requestLine(askedAgo(row.requestedAt))}
          </Text>
        </View>
      </View>
      <View style={styles.buttons}>
        <View style={styles.flex}>
          <Button label="Decline" variant="secondary" size="md" full disabled={disabled} onPress={onDecline} testID={`decline-${row.userWawuId}`} />
        </View>
        <View style={styles.flex}>
          <Button label="Approve" size="md" full loading={busy} disabled={disabled} onPress={onApprove} testID={`approve-${row.userWawuId}`} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: metrics.between, paddingVertical: metrics.padV },
  who: { flexDirection: 'row', alignItems: 'center', gap: metrics.between },
  words: { flex: 1, minWidth: 0, gap: space.xs },
  buttons: { flexDirection: 'row', gap: metrics.buttons },
  flex: { flex: 1 },
  rule: { height: StyleSheet.hairlineWidth },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: metrics.padV },
});
