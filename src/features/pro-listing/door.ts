import type { QueryClient } from '@tanstack/react-query';

import { fetchIsCreator, fetchMine, proKeys } from './api';

/**
 * Where Explore's "List your services" door goes (R-41, D3): P8 for a creator who has any application (listed, under
 * review, turned down or hidden, so a hidden listing can always be shown again), else P5. An account that is not a
 * creator's goes to P5, which shows P10. A call that fails goes to P5 too, which asks again and says why.
 */
export async function listServicesTarget(client: QueryClient): Promise<'/professional-listings' | '/professional-apply'> {
  try {
    const creator = await client.fetchQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator, staleTime: 0 });
    if (!creator) return '/professional-apply';
    const mine = await client.fetchQuery({ queryKey: proKeys.mine, queryFn: fetchMine, staleTime: 0 });
    return mine.length > 0 ? '/professional-listings' : '/professional-apply';
  } catch {
    return '/professional-apply';
  }
}
