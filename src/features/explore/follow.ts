import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { exploreKey, setFollowing, type CreatorsPage, type ExploreCreator } from './api';

/** What an Explore query holds: a list (featured, categories), pages of a list (one category), or anything else. */
type ExploreData = unknown;

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

/**
 * Follow and Following on a creator card. The button turns at once, on every Explore list, and is put
 * right by the Hub's answer, or put back when the Hub refuses. A second tap while one is on its way is ignored.
 */
export function useFollow() {
  const client = useQueryClient();
  const apply = (wawuId: string, following: boolean) =>
    client.setQueriesData<ExploreData>({ queryKey: exploreKey }, (data: ExploreData) => withFollowing(data, wawuId, following));

  const mutation = useMutation({
    mutationFn: ({ wawuId, following }: { wawuId: string; following: boolean }) => setFollowing(wawuId, following),
    onMutate: ({ wawuId, following }) => apply(wawuId, following),
    onSuccess: (following, { wawuId }) => apply(wawuId, following),
    onError: (_error, { wawuId, following }) => apply(wawuId, !following),
  });

  return {
    toggle: (creator: ExploreCreator) => {
      if (mutation.isPending) return;
      mutation.mutate({ wawuId: creator.wawuId, following: !creator.following });
    },
  };
}
