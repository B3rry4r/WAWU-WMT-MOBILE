import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';

import { creditsKey, fetchCredits, fetchMessageCost, messageCostKey } from './api';

/**
 * The person's WAWU Credits, read from `GET /credits` and never worked out on the phone: after a
 * send the screen asks again and shows the server's number. It reads again every time a screen that
 * shows it opens, because nothing tells the phone when credits change elsewhere (BACKEND_GAPS.md).
 */
export function useCredits() {
  return useQuery({ queryKey: creditsKey, queryFn: fetchCredits, refetchOnMount: 'always' }, queryClient);
}

/**
 * What each kind of message costs a member, from `GET /communities/message-cost`: the credits by kind (R-62) behind I24's
 * "Chat free · photos, video, voice use credits". They are the server's numbers, never ones written in the app. While they are
 * unknown (loading, or they could not be read) the strip says only what is always true, that reading is free.
 */
export function useMessageCost() {
  return useQuery({ queryKey: messageCostKey, queryFn: fetchMessageCost }, queryClient);
}
