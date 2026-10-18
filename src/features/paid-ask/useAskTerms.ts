import { QueryClientContext, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { queryClient } from '@/api/query';
import { availabilityKey, fetchAvailability } from './api';
import { askTerms, type AskTerms } from './model';

type DmFields = { dmEnabled?: boolean | null; dmPrice?: number | null; dmResponseHours?: number | null };

/**
 * Whether a creator takes paid questions now and on what terms (I2, I8): their own switch and price from the profile the screen
 * already holds, then the Hub's pause (`GET /paid-dm/creators/{wawuId}/availability`). `null` while the profile is not here yet.
 * A failed availability read does not close the door: the profile says on, and the Hub refuses in its own words if it is not.
 */
export function useAskTerms(wawuId: string | null, profile: DmFields | null): AskTerms | null {
  const cache = useContext(QueryClientContext) ?? queryClient;
  const availability = useQuery(
    { queryKey: availabilityKey(wawuId ?? ''), queryFn: () => fetchAvailability(wawuId as string), enabled: Boolean(wawuId && profile), retry: false, staleTime: 30_000 },
    cache,
  );
  if (!profile) return null;
  const terms = askTerms(profile, availability.data);
  // A creator who has not switched paid messages on needs no pause read; one who has waits for it so the button never flashes "on" then "off".
  if (terms.kind === 'on' && availability.isPending) return null;
  return terms;
}
