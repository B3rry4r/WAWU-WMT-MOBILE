import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryClient } from '@/api/query';

import { fetchInboxPage, inboxListKey, type InboxFilter, type InboxItem } from './api';

/**
 * The inbox list for one filter, read a page at a time. The cursor is the server's, opaque, and goes
 * back exactly as given. It reads the app's one cache (`@/api/query`) by name, the same one the live
 * refresh in `unread.ts` invalidates, so the screen needs no provider above it. Rows are kept in the order the server sent them; a row that shows up twice
 * (a refetch moved it while the next page was being read) is kept once, where it first appeared.
 */
export function useInbox(kind: InboxFilter | 'all') {
  const query = useInfiniteQuery({
    queryKey: inboxListKey(kind),
    queryFn: ({ pageParam }) => fetchInboxPage(kind, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  }, queryClient);
  const items = useMemo(() => dedupeById(query.data?.pages.flatMap((page) => page.items) ?? []), [query.data]);
  return { ...query, items };
}

export function dedupeById(items: readonly InboxItem[]): InboxItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
