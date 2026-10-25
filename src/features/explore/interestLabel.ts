import { QueryClientContext, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { queryClient } from '@/api/query';
import { fetchInterests, interestsKey, type Interests } from '@/features/after-signup/api';

/**
 * The line under a creator's name on Home's rail, Search, Explore and All creators (R2-SOCIAL3, CHECK-3 social pass 3 defect 3). The
 * Hub's `field` on a creator is the first interest they picked: an id such as `music_audio`, never words. The words are the labels
 * sign-up's "What are you into?" draws (`GET /users/me/interests`, the same read and the same cache), so a row says "Music and audio"
 * and not the id. An id that list does not know, a list that has not loaded and a list that failed all give `null`: the row draws no
 * line, never the id.
 */
export function interestLabelOf(options: Interests['options'] | undefined, id: string | null | undefined): string | null {
  const key = id?.trim();
  if (!key) return null;
  const found = options?.find((o) => o.id === key);
  return found ? found.label : null;
}

export function useInterestLabel(): (id: string | null | undefined) => string | null {
  const cache = useContext(QueryClientContext) ?? queryClient;
  const list = useQuery({ queryKey: interestsKey, queryFn: fetchInterests, staleTime: 10 * 60_000 }, cache);
  const options = list.data?.options;
  return (id) => interestLabelOf(options, id);
}
