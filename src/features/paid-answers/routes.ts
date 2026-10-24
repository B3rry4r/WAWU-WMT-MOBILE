import type { Href } from 'expo-router';

/** I10 and I11: one fan's paid questions, as the creator reads them. `question` is the one the person came for (I9's row), when known. */
export function paidThreadHref(wawuId: string, question?: string): Href {
  return { pathname: '/paid-questions/[wawuId]', params: question ? { wawuId, question } : { wawuId } };
}
