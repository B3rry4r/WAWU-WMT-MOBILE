import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';

import { creditsKey, fetchCredits } from './api';

/**
 * The person's WAWU Credits, read from `GET /credits` and never worked out on the phone: after a
 * send the screen asks again and shows the server's number. It reads again every time a screen that
 * shows it opens, because nothing tells the phone when credits change elsewhere (BACKEND_GAPS.md).
 */
export function useCredits() {
  return useQuery({ queryKey: creditsKey, queryFn: fetchCredits, refetchOnMount: 'always' }, queryClient);
}
