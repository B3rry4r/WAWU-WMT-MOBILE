import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { queryClient } from '@/api/query';

import {
  clearRecent,
  closestKey,
  fetchClosest,
  fetchPeople,
  fetchPopular,
  fetchSearch,
  fetchSuggestions,
  peopleKey,
  popularKey,
  recordRecent,
  resultsKey,
  suggestionsKey,
  type SearchContent,
  type SearchCreator,
} from './api';
import { countsOf, namedCreators, peopleMap, personIds } from './model';

/** How long typing must pause before the text is searched. A screen timing, not a fact. */
export const SEARCH_PAUSE_MS = 350;

/** The text to search: what is typed once typing pauses, or at once when it is submitted (the keyboard's search key, a chip). */
export function useSearchText(max: number) {
  const [text, setText] = useState('');
  const [paused, setPaused] = useState('');
  const clean = text.trim().slice(0, max);
  useEffect(() => {
    const timer = setTimeout(() => setPaused(clean), clean === '' ? 0 : SEARCH_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [clean]);
  const submit = (value: string) => {
    const now = value.trim().slice(0, max);
    setText(value);
    setPaused(now);
    return now;
  };
  // Nothing typed is nothing searched at once; typed text is searched once typing pauses (or when it is submitted).
  return { text, setText, query: clean === '' ? '' : paused, submit };
}

/** The people (names, field, ticks, follow state) of some ids, one call. */
export function usePeople(ids: readonly string[]) {
  return useQuery({ queryKey: peopleKey(ids), queryFn: () => fetchPeople(ids), enabled: ids.length > 0 }, queryClient);
}

/** What the Search landing (X5) reads: the person's recent searches and the creators to know, and what many people searched. */
export function useLanding() {
  const suggestions = useQuery({ queryKey: suggestionsKey, queryFn: fetchSuggestions }, queryClient);
  const popular = useQuery({ queryKey: popularKey, queryFn: fetchPopular }, queryClient);
  const known = useMemo<SearchCreator[]>(() => suggestions.data?.suggestedCreators ?? [], [suggestions.data]);
  const ids = useMemo(() => personIds(known, []), [known]);
  const people = usePeople(ids);
  const creators = useMemo(() => namedCreators(known, peopleMap(people.data)), [known, people.data]);
  return { suggestions, popular, people, creators };
}

/** Remembers a submitted search, quietly: a failure never blocks the search itself. */
export function useRecordRecent() {
  return useMutation(
    {
      mutationFn: (q: string) => recordRecent(q),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: suggestionsKey }),
    },
    queryClient,
  );
}

/** Clear: forgets the recent searches and empties the list at once. */
export function useClearRecent() {
  return useMutation(
    {
      mutationFn: () => clearRecent(),
      onSuccess: () =>
        queryClient.setQueryData(suggestionsKey, (old: Awaited<ReturnType<typeof fetchSuggestions>> | undefined) =>
          old ? { ...old, recentSearches: [] } : old,
        ),
    },
    queryClient,
  );
}

/**
 * What the results (X6 to X12) read for a text: the search, then the names of the people it shows. When nothing matched
 * (every count is zero) it also reads the nearest content (X10), and the names of the people that content names.
 */
export function useResults(q: string) {
  const enabled = q !== '';
  const search = useQuery({ queryKey: resultsKey(q), queryFn: () => fetchSearch(q), enabled }, queryClient);
  const answer = search.data;
  const nothing = Boolean(answer) && answer!.content.length === 0 && answer!.creators.length === 0 && answer!.communities.length === 0;
  const closest = useQuery({ queryKey: closestKey(q), queryFn: () => fetchClosest(q), enabled: enabled && nothing }, queryClient);
  const closestItems: SearchContent[] = nothing ? (closest.data ?? []) : [];
  const ids = useMemo(
    () => (answer ? personIds(answer.creators, nothing ? closestItems : answer.content) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answer, nothing, closest.data],
  );
  const people = usePeople(ids);
  const byId = useMemo(() => peopleMap(people.data), [people.data]);
  const creators = useMemo(() => namedCreators(answer?.creators ?? [], byId), [answer, byId]);
  const counts = useMemo(() => countsOf(answer, creators), [answer, creators]);
  const failed = (search.isError && !answer) || (people.isError && !people.data) || (nothing && closest.isError && !closest.data);
  const loading =
    enabled && !failed && (search.isPending || (ids.length > 0 && people.isPending) || (nothing && closest.isPending));
  return {
    answer,
    people: byId,
    creators,
    counts,
    nothing: Boolean(answer) && !loading && !failed && counts.all === 0,
    closest: closestItems,
    loading,
    failed,
    error: search.error ?? people.error ?? closest.error,
    refetch: () => Promise.all([search.refetch(), people.isError ? people.refetch() : Promise.resolve(), closest.isError ? closest.refetch() : Promise.resolve()]),
    retrying: search.isFetching || people.isFetching || closest.isFetching,
  };
}
