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
import { fetchPass, passKey } from '@/features/community-pass/api';
import { font, layout, space, useWawu } from '@/theme';

import { approveRequest, declineRequest, fetchRequests, requestsKey, type JoinRequest } from './api';
import { askedAgo, removedLine, requestLine } from './model';

/** design/_gen/inbox.js line 89, `requests`: a 48 avatar, 12 beside the name (15.5 / 600) and its line (13, muted), the two buttons under at the `md` size, 8 apart. */
const metrics = { avatar: 48, name: 15.5, line: 13, between: 12, padV: 14, buttons: 8, loadingRows: 3 } as const;

export type JoinRequestsScreenProps = { id: string; onBack: () => void };

/**
 * I34 · Join requests (INBOX-14). The queue of a private room that already holds requests: who asked, how long ago, Decline and Approve.
 * A private room made now is joined by a pass and has no queue (R-63), so the screen is reached only from a room the Hub lists requests for.
 * The Hub serves the requester's handle and picture; the headline and city the board draws are not served (G-INBOX-14-2) and are left out.
 * In a room that sells a pass a waiting row is a member the host removed (INBOX-24 round 2, G-INBOX-24-6), not someone who asked: the line says so,
 * and the one button, "Let back in", lets them back (the Hub keeps a removed row whatever the host declines, so Decline is not drawn, R-47, INBOX-24 round 3).
 * Decline is drawn only on a real request, in a room that sells no pass. Until the room is known no button is drawn; if it cannot be read, Approve alone is.
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
  // Whether the room sells a pass decides what a waiting row means; until it is read the older words ("asked") are not written for a row.
  const pass = useQuery({ queryKey: passKey(id), queryFn: () => fetchPass(id) }, queryClient);
  const removedRoom = pass.data?.sellsPass === true;
  // What a waiting row is decides the buttons: a removed member can only be let back in; a request can be declined or approved.
  const rowKind: RowKind = pass.isPending ? 'unknown' : pass.isError ? 'unread' : removedRoom ? 'removed' : 'request';
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
    body = (
      <EmptyState
        testID="requests-empty"
        icon="Users"
        title="No requests waiting"
        message={removedRoom ? 'People you remove from this room wait here until you let them back in.' : 'People who ask to join this room show up here.'}
      />
    );
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
            line={pass.isPending ? '' : removedRoom ? removedLine() : requestLine(askedAgo(item.requestedAt))}
            kind={rowKind}
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

/** unknown: the room is still being read, no button yet. unread: it could not be read, Approve works either way. */
type RowKind = 'unknown' | 'unread' | 'removed' | 'request';

function Row({ row, line, kind, busy, disabled, onApprove, onDecline }: { row: JoinRequest; line: string; kind: RowKind; busy: boolean; disabled: boolean; onApprove: () => void; onDecline: () => void }) {
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
            {line}
          </Text>
        </View>
      </View>
      {kind === 'unknown' ? null : (
        <View style={styles.buttons}>
          {kind === 'request' ? (
            <View style={styles.flex}>
              <Button label="Decline" variant="secondary" size="md" full disabled={disabled} onPress={onDecline} testID={`decline-${row.userWawuId}`} />
            </View>
          ) : null}
          <View style={styles.flex}>
            <Button label={kind === 'removed' ? 'Let back in' : 'Approve'} size="md" full loading={busy} disabled={disabled} onPress={onApprove} testID={`approve-${row.userWawuId}`} />
          </View>
        </View>
      )}
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
