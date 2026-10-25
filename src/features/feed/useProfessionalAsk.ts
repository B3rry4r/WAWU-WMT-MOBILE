import { QueryClientContext, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { queryClient } from '@/api/query';
import { useAskTerms } from '@/features/paid-ask/useAskTerms';
import { fetchProfile, prosKeys } from '@/features/professionals/api';

import type { ProfessionalCardData } from './api';

/**
 * Whether H10's Message is drawn, and on what terms. The card carries the Hub's price and reply window (`dmPrice` in naira,
 * `dmResponseHours`) but not whether the professional has paid messages switched on, so their listing says that (the same read P2
 * makes, kept under the same key so Profile opens on it), then the Hub's own pause. `null` until both have answered, and for good
 * when the listing could not be read: a button that might open a sheet the Hub refuses is not drawn (R-47). Nothing is read unless
 * `enabled` (the feed was wired to open the ask sheet).
 */
export function useProfessionalAsk(card: Pick<ProfessionalCardData, 'id' | 'wawuId' | 'dmPrice' | 'dmResponseHours'>, enabled: boolean) {
  const cache = useContext(QueryClientContext) ?? queryClient;
  const listing = useQuery({ queryKey: prosKeys.profile(card.id), queryFn: () => fetchProfile(card.id), enabled, retry: false, staleTime: 60_000 }, cache);
  const listed = enabled ? (listing.data ?? null) : null;
  return useAskTerms(listed ? card.wawuId : null, listed ? { dmEnabled: listed.dmEnabled, dmPrice: card.dmPrice, dmResponseHours: card.dmResponseHours } : null);
}
