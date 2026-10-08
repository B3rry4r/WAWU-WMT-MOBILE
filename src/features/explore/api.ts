import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * Explore's calls (X1, X2, X3, X13, X14), as the Hub's contract types them (EXPLORE-03):
 * - `GET /explore/categories`: the creator categories, in the order the chips and tiles show them;
 * - `GET /explore/featured-creators`: the creators an admin featured, in the admin's order;
 * - `GET /explore/creators`: every creator, or one category's, a page at a time;
 * - `POST` and `DELETE /creators/{wawuId}/follow`: the viewer follows or unfollows a creator.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
export type ExploreCreator = components['schemas']['ExploreCreatorCard'];
export type ExploreCategory = operations['ExploreController_categories']['responses'][200]['content']['application/json']['items'][number];
type CreatorsQuery = NonNullable<operations['ExploreController_creators']['parameters']['query']>;
/** The category ids the contract accepts on `GET /explore/creators`. */
export type CategoryId = NonNullable<CreatorsQuery['category']>;
/** The page the contract describes inside `data` (EXPLORE-03). */
type ContractCreatorsPage = operations['ExploreController_creators']['responses'][200]['content']['application/json'];
/** One page of creators as the screens use it. `nextPage` is null on the last page. */
export type CreatorsPage = { items: ExploreCreator[]; nextPage: number | null };

type Envelope<T> = { data?: T | null; pagination?: { currentPage?: number; nextPage?: number | null; perPage?: number; total?: number } };

/** How many creators one page of a category asks for: the server's own default, written down so every page is the same. */
export const CREATORS_PAGE_SIZE = 24;
/** How many featured creators the rail asks for: the server's own default (1 to 20). */
export const FEATURED_LIMIT = 10;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

function itemsOf<T>(data: { items?: unknown }, what: string): T[] {
  if (!Array.isArray(data.items)) throw unreadable(what);
  return data.items as T[];
}

export const exploreKey = ['explore'] as const;
export const categoriesKey = ['explore', 'categories'] as const;
export const featuredKey = ['explore', 'featured'] as const;
/** `all` is every creator; anything else is one category's id. */
export const creatorsKey = (category: CategoryId | 'all') => ['explore', 'creators', category] as const;

/** The creator categories, in the order to show them. */
export async function fetchCategories(): Promise<ExploreCategory[]> {
  const data = dataOf<{ items?: unknown }>(await unwrap(api.GET('/api/hub/explore/categories')), 'categories');
  return itemsOf<ExploreCategory>(data, 'categories').filter(
    (c) => typeof c?.id === 'string' && c.id !== '' && typeof c.label === 'string' && c.label !== '',
  );
}

/** The creators an admin featured, first to last. Empty until someone is featured. */
export async function fetchFeaturedCreators(): Promise<ExploreCreator[]> {
  const data = dataOf<{ items?: unknown }>(
    await unwrap(api.GET('/api/hub/explore/featured-creators', { params: { query: { limit: FEATURED_LIMIT } } })),
    'featured creators',
  );
  return itemsOf<ExploreCreator>(data, 'featured creators');
}

/**
 * One page of creators, every creator (`all`) or one category's. Pages count from 1.
 *
 * On the wire the Hub's response interceptor moves a page's `items` into `data` and its counts into a `pagination`
 * block (`{ data: [...], pagination: { currentPage, nextPage, perPage, total } }`), while the contract describes the
 * page before that move (`{ items, currentPage, perPage, total }` inside `data`; BACKEND_GAPS G-300). Both are read,
 * so the screen keeps working when the contract is corrected.
 */
export async function fetchCreatorsPage(category: CategoryId | 'all', page: number): Promise<CreatorsPage> {
  const query = { page, perPage: CREATORS_PAGE_SIZE, ...(category === 'all' ? {} : { category }) };
  const body = (await unwrap(api.GET('/api/hub/explore/creators', { params: { query } }))) as unknown as Envelope<
    ExploreCreator[] | Partial<ContractCreatorsPage>
  >;
  const data = body?.data;
  if (Array.isArray(data)) {
    const next = body.pagination?.nextPage;
    if (!body.pagination || (next !== null && typeof next !== 'number')) throw unreadable('creators');
    return { items: data, nextPage: next ?? null };
  }
  if (!data || typeof data !== 'object') throw unreadable('creators');
  const items = itemsOf<ExploreCreator>(data, 'creators');
  if (typeof data.currentPage !== 'number' || typeof data.perPage !== 'number' || typeof data.total !== 'number') {
    throw unreadable('creators');
  }
  const more = items.length > 0 && data.currentPage * data.perPage < data.total;
  return { items, nextPage: more ? data.currentPage + 1 : null };
}

/** Follows (`true`) or unfollows (`false`) a creator. Resolves with what the Hub now holds. */
export async function setFollowing(wawuId: string, following: boolean): Promise<boolean> {
  const params = { params: { path: { wawuId } } };
  const call = following
    ? api.POST('/api/hub/creators/{wawuId}/follow', params)
    : api.DELETE('/api/hub/creators/{wawuId}/follow', params);
  const data = dataOf<{ following?: unknown }>(await unwrap(call), 'follow');
  if (typeof data.following !== 'boolean') throw unreadable('follow');
  return data.following;
}
