import { cardsKey, fetchCards } from './api';

/** The person's cards, for the list, W1's row and W35's. Read again whenever the tab or page asks: a status is the issuer's, never one held from before. */
export function cardsQuery(owner: string | null) {
  return {
    queryKey: [...cardsKey, 'list', owner ?? ''] as const,
    queryFn: fetchCards,
    enabled: Boolean(owner),
    staleTime: 30_000,
    retry: false,
  } as const;
}
