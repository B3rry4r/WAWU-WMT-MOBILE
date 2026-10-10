import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { queryClient } from '@/api/query';

import {
  fetchMyCommunities,
  fetchSuggested,
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
 * The rooms the person could join (I24 "Suggested"), in the server's order: most members first (`GET /communities/suggested`,
 * which already leaves out rooms the person hosts, is in, has asked for or cannot see, so nothing is dropped on the phone).
 *
 * Only OPEN rooms are listed (R-47, INBOX-05 finding 18): a person can join an open room from this screen, but asking to join a
 * private one is INBOX-14's screen, which is not built, so a private room would be a row that does nothing. INBOX-14 removes
 * the filter and adds Ask. The server pages by its own list, so a page can hold only private rooms; the next page is then read
 * on its own until a room that can be joined turns up, or there are no more. It starts only once `enabled`, which the screen sets
 * when it holds every room of "Your communities", so the person's own rooms are never still arriving above the suggestions.
 */
export function useSuggestedCommunities(enabled: boolean) {
  const query = useInfiniteQuery(
    {
      queryKey: suggestedKey,
      queryFn: ({ pageParam }) => fetchSuggested(pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled,
    },
    queryClient,
  );
  const items = useMemo<Community[]>(
    () => firstSeen(query.data?.pages.flatMap((page) => page.items) ?? []).filter((room) => room.kind === 'open'),
    [query.data],
  );
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query;
  const readOn = items.length === 0 && hasNextPage && !isFetchingNextPage && !isFetchNextPageError;
  useEffect(() => {
    if (readOn) void fetchNextPage();
  }, [readOn, fetchNextPage]);
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
          // The room's key is a prefix of its messages, so one call refreshes both.
          queryClient.invalidateQueries({ queryKey: roomKey(id) }),
          queryClient.invalidateQueries({ queryKey: ['inbox', 'list'] }),
        ]);
      },
    },
    queryClient,
  );
}
