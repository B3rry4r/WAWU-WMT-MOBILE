import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * Today's own calls (H1), as the Hub's contract types them:
 * - `GET /creators` (creator discovery): the people with something live to browse, each with
 *   whether the viewer already follows them; the "Creators to discover" rail;
 * - `POST` and `DELETE /creators/{wawuId}/follow`: Follow and Following, in place.
 *
 * Today also reads, through their owners' modules so each answer is cached once: the balance
 * (`@/api/money`, MONEY-11). It reads no TGIF (R-59, DV2-RM).
 *
 * The Hub's success body is `{ statusCode, message, data }`; the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads the envelope itself.
 */
export type CreatorSuggestion = components['schemas']['CreatorDiscoveryItem'];

type CreatorPage = operations['CreatorDiscoveryController_list']['responses'][200]['content']['application/json'];
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };
/**
 * A paginated answer: the Hub's interceptor lifts the page's `items` into `data` and the rest
 * into `pagination` (wawu-backend `src/common/interceptors/response.interceptor.ts`), so the
 * contract's `{ items, total, ... }` arrives as `{ data: items, pagination }`.
 */
type PageEnvelope<T> = Envelope<T[]> & { pagination?: { nextPage?: number | null; total?: number } };

/**
 * How many people the rail asks for: the first page of the Hub's own list. Three cards fill
 * the screen's width; the rest are a sideways swipe away.
 */
export const SUGGESTION_PAGE_SIZE = 12;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const suggestionsKey = ['home', 'creators'] as const;

/** The first page of creators to discover, in the Hub's order. */
export async function fetchCreatorSuggestions(): Promise<CreatorSuggestion[]> {
  const body = (await unwrap(
    api.GET('/api/hub/creators', { params: { query: { page: 1, perPage: SUGGESTION_PAGE_SIZE } } }),
  )) as unknown as PageEnvelope<CreatorPage['items'][number]>;
  const items = body?.data;
  if (!Array.isArray(items)) throw unreadable('creators');
  return items;
}

/** Follows or unfollows a creator; the Hub answers with where the viewer now stands. */
export async function setFollowing(wawuId: string, on: boolean): Promise<boolean> {
  const call = on
    ? api.POST('/api/hub/creators/{wawuId}/follow', { params: { path: { wawuId } } })
    : api.DELETE('/api/hub/creators/{wawuId}/follow', { params: { path: { wawuId } } });
  const body = (await unwrap(call)) as unknown as Envelope<{ following?: boolean }>;
  const following = body?.data?.following;
  if (typeof following !== 'boolean') throw unreadable('follow');
  return following;
}
