import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryClient } from '@/api/query';

import {
  fetchCommunities,
  fetchMyCommunities,
  joinCommunity,
  myCommunitiesKey,
  roomKey,
  suggestedKey,
  type Community,
  type MyCommunity,
} from './api';

function firstSeen<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * The rooms the person hosts or has joined (I24 "Your communities"), newest activity first, a page at a
 * time. A room that shows up twice while pages are read (a message moved it) is kept once.
 */
export function useMyCommunities() {
  const query = useInfiniteQuery(
    {
      queryKey: myCommunitiesKey,
      queryFn: ({ pageParam }) => fetchMyCommunities(pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
    },
    queryClient,
  );
  const items = useMemo<MyCommunity[]>(() => firstSeen(query.data?.pages.flatMap((page) => page.items) ?? []), [query.data]);
  return { ...query, items };
}

/**
 * The rooms the person is not in (I24 "Suggested"), in the order the server lists them (by name: there is no
 * ranking, BACKEND_GAPS.md). It starts only once `enabled`, which the screen sets when it has every room of
 * "Your communities", so a room already joined is never offered as a suggestion.
 */
export function useSuggestedCommunities(enabled: boolean, joinedIds: ReadonlySet<string>) {
  const query = useInfiniteQuery(
    {
      queryKey: suggestedKey,
      queryFn: ({ pageParam }) => fetchCommunities(pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled,
    },
    queryClient,
  );
  const items = useMemo<Community[]>(
    () => firstSeen(query.data?.pages.flatMap((page) => page.items) ?? []).filter((room) => !joinedIds.has(room.id)),
    [query.data, joinedIds],
  );
  return { ...query, items };
}

/** Joins an open room (the answer says `joined`) and refreshes everything that lists rooms. */
export function useJoinCommunity() {
  return useMutation(
    {
      mutationFn: (id: string) => joinCommunity(id),
      onSuccess: async (_membership, id) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: myCommunitiesKey }),
          queryClient.invalidateQueries({ queryKey: suggestedKey }),
          // The room's key is a prefix of its membership and its messages, so one call refreshes all three.
          queryClient.invalidateQueries({ queryKey: roomKey(id) }),
          queryClient.invalidateQueries({ queryKey: ['inbox', 'list'] }),
        ]);
      },
    },
    queryClient,
  );
}
