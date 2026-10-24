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

/** Suggested reads on by itself until it lists at least this many rooms (or the Hub has no next page), whatever the screen's height. */
export const SUGGESTED_READ_ON_ROOMS = 8;
/** One pass reads on by itself for at most this many pages; the list's end-reached paging asks for the rest as the person scrolls. */
export const SUGGESTED_READ_ON_PAGES = 5;

/**
 * The rooms the person could join (I24 "Suggested"), in the server's order: most members first (`GET /communities/suggested`,
 * which already leaves out rooms the person hosts, is in, has asked for or cannot see, so nothing is dropped on the phone).
 *
 * Every room is listed, open or private: an open room is joined in one tap, and a private room opens I30, where its host's monthly pass is
 * paid for (INBOX-14, R-63; closes G-623). The server pages by its own list, so a page can hold few rooms, and a list that does not fill
 * the screen is never scrolled to its end, so the next page is read on its own until the list holds at least `SUGGESTED_READ_ON_ROOMS` rooms
 * or the Hub has no next page, whatever the screen's height (INBOX-05 defect 22), but for at most
 * `SUGGESTED_READ_ON_PAGES` pages in a pass; after that only the end-reached paging carries on. It starts only once `enabled`,
 * which the screen sets when it holds every room of "Your communities", so the person's own rooms are never still arriving
 * above the suggestions.
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
    () => firstSeen(query.data?.pages.flatMap((page) => page.items) ?? []),
    [query.data],
  );
  const { hasNextPage, isFetchNextPageError, isFetching, dataUpdatedAt, errorUpdatedAt, fetchNextPage } = query;
  const pagesRead = query.data?.pages.length ?? 0;
  const readingOn = items.length < SUGGESTED_READ_ON_ROOMS && pagesRead < SUGGESTED_READ_ON_PAGES && hasNextPage && !isFetchNextPageError;
  // Reads the next page only when nothing is in flight, and runs again each time a read ends, however it ended: a page landed
  // (`pagesRead`), or a refresh (a Join, a live event, a return to the screen) cancelled the page being read and refetched the pages held.
  // Asking for the next page while that refetch runs would cancel the refetch, and the pages held would be a mix of before and after the
  // refresh (a joined room still listed, the next one lost). That refetch ends with the same pages and the same flags as before it began,
  // and a render may never have shown it under way, so `dataUpdatedAt` tells this effect it ended; a refetch that is refused moves
  // `errorUpdatedAt` instead and leaves `dataUpdatedAt` where it was, so that one is watched too (as the Inbox's read-on does, FIX-30).
  // It cannot loop: each run needs a read to have ended, and a read-on stops at eight rooms, at five pages, at the last page and at an
  // error (the list's one Try again).
  useEffect(() => {
    if (readingOn && !isFetching) void fetchNextPage();
  }, [readingOn, isFetching, dataUpdatedAt, errorUpdatedAt, pagesRead, fetchNextPage]);
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
