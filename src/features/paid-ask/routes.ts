import type { Href } from 'expo-router';

/** I4, I5 and I7: a fan's paid questions to one creator (`/paid-thread/<the creator's WAWU ID>`). The creator's side is `/paid-questions/<fan's WAWU ID>` (INBOX-18). */
export function paidThreadHref(creatorWawuId: string): Href {
  return { pathname: '/paid-thread/[wawuId]', params: { wawuId: creatorWawuId } };
}
