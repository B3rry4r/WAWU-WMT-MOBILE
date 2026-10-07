import { useMutation, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { queryClient } from '@/api/query';

import { exploreKey, setFollowing, type CreatorsPage, type ExploreCreator } from './api';
import { displayHandle } from './CreatorCard';

/** What an Explore query holds: a list (featured, categories), pages of a list (one category), or anything else. */
type ExploreData = unknown;

/** How long the "Couldn't follow" line stays up (the shared `Toast`'s `duration`). A screen timing, not a fact. */
export const FOLLOW_NOTICE_MS = 4000;

function mark(list: ExploreCreator[], wawuId: string, following: boolean): ExploreCreator[] {
  return list.some((c) => c.wawuId === wawuId && c.following !== following)
    ? list.map((c) => (c.wawuId === wawuId ? { ...c, following } : c))
    : list;
}

/**
 * The same creator's Follow button on every Explore list at once: the featured rail (a list) and each
 * category (pages of a list). Anything else under the Explore key is left as it is.
 */
export function withFollowing(data: ExploreData, wawuId: string, following: boolean): ExploreData {
  if (Array.isArray(data)) {
    return data.every((c) => typeof (c as ExploreCreator)?.wawuId === 'string') ? mark(data as ExploreCreator[], wawuId, following) : data;
  }
  const pages = (data as InfiniteData<CreatorsPage> | undefined)?.pages;
  if (Array.isArray(pages)) {
    const infinite = data as InfiniteData<CreatorsPage>;
    return { ...infinite, pages: pages.map((p) => ({ ...p, items: mark(p.items, wawuId, following) })) };
  }
  return data;
}

/** The app's own words when the Hub refuses or cannot be reached; the server's sentence is never shown. */
export function followRefusedNotice(handle: string, following: boolean): string {
  return following ? `Couldn’t follow ${handle}. Try again later.` : `Couldn’t unfollow ${handle}. Try again later.`;
}

type Vars = { wawuId: string; following: boolean; handle: string };

/**
 * Follow and Following on a creator card. The button turns at once, on every Explore list, and is put right by
 * the Hub's answer. When the Hub refuses, or the request fails, it is put back and a short line says so (`notice`,
 * drawn by the screen's `Toast` for `FOLLOW_NOTICE_MS`, then `dismiss`). A second
 * tap on the same creator while their request is on its way is ignored; other creators can be followed meanwhile.
 */
export function useFollow() {
  const pending = useRef(new Set<string>());
  const [notice, setNotice] = useState<string | null>(null);
  const apply = (wawuId: string, following: boolean) =>
    queryClient.setQueriesData<ExploreData>({ queryKey: exploreKey }, (data: ExploreData) => withFollowing(data, wawuId, following));

  const mutation = useMutation(
    {
      mutationFn: ({ wawuId, following }: Vars) => setFollowing(wawuId, following),
      onMutate: ({ wawuId, following }) => apply(wawuId, following),
      onSuccess: (following, { wawuId }) => apply(wawuId, following),
      onError: (_error, { wawuId, following, handle }) => {
        apply(wawuId, !following);
        setNotice(followRefusedNotice(handle, following));
      },
      onSettled: (_data, _error, { wawuId }) => {
        pending.current.delete(wawuId);
      },
    },
    queryClient,
  );

  const { mutate } = mutation;
  const toggle = useCallback(
    (creator: ExploreCreator) => {
      if (pending.current.has(creator.wawuId)) return;
      pending.current.add(creator.wawuId);
      setNotice(null);
      mutate({ wawuId: creator.wawuId, following: !creator.following, handle: displayHandle(creator) });
    },
    [mutate],
  );

  /** Takes the line down: the toast calls it `FOLLOW_NOTICE_MS` after each new line. */
  const dismiss = useCallback(() => setNotice(null), []);

  return { toggle, notice, dismiss };
}
