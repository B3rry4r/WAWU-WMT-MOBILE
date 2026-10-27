import type { QueryClient } from '@tanstack/react-query';

import { fetchIsCreator, fetchMine, proKeys } from './api';

export type ListServicesTarget = '/professional-listings' | '/professional-apply';

/**
 * Where Explore's "List your services" door and Create's Service tile go (R-41, D3): P8 for a creator who has any application
 * (listed, under review, turned down or hidden, so a hidden listing can always be shown again), else P5. An account that is not a
 * creator's goes to P5, which shows P10. The two reads run one after the other and are not retried, so a bad connection is told at
 * once; a read that fails throws, and `useListServicesDoor` says so on the screen instead of opening a screen that would ask again
 * (SERVICES-FEEDBACK 1).
 */
export async function listServicesTarget(client: QueryClient): Promise<ListServicesTarget> {
  const creator = await client.fetchQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator, staleTime: 0, retry: false });
  if (!creator) return '/professional-apply';
  const mine = await client.fetchQuery({ queryKey: proKeys.mine, queryFn: fetchMine, staleTime: 0, retry: false });
  return mine.length > 0 ? '/professional-listings' : '/professional-apply';
}
