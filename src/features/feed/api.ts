import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * The For you and Following feed's calls (H2 to H6), as the Hub's contract types them:
 * - `GET /feed/entries` (HOME-05): one page of the mixed feed, each entry a content card,
 *   a creator card or a professional card; the content card carries the viewer's flags
 *   (HOME-04), the creator line and the media details (frames, length, page count);
 * - `GET /content/{id}/detail` (HOME-06): the free preview the creator declared (pages of
 *   a PDF, seconds of a video or audio file);
 * - like, save and follow, written by the viewer from the rail.
 *
 * The Hub's success body is `{ statusCode, message, data }` (and `pagination` on a page);
 * the contract types only `data` (SHARED-CHANGES.md row 11), so each call reads the
 * envelope itself, as `src/features/about/api.ts` does.
 */
export type FeedItem = components['schemas']['FeedItem'];
export type FeedCreator = components['schemas']['FeedCreator'];
export type MediaFrame = components['schemas']['MediaFrame'];
export type ContentDetail = components['schemas']['ContentDetail'];
export type FeedScope = 'for_you' | 'following';

type Entries = operations['FeedController_mixed']['responses'][200]['content']['application/json'];
export type FeedEntry = Entries[number];

type Envelope<T> = { statusCode?: number; message?: string; data?: T | null; pagination?: { nextPage?: number | null } };

export type FeedPage = { entries: FeedEntry[]; nextPage: number | null };

/** The page size the app asks for: one screen is one post, so a page is a few swipes. */
export const FEED_PAGE_SIZE = 10;

/** The Hub's own default order for For you (Following is always newest first). */
const FEED_SORT = 'trending';

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const feedKey = (scope: FeedScope) => ['feed', scope] as const;
export const detailKey = (id: string) => ['content-detail', id] as const;

/** One page of the feed. `nextPage` is null on the last page. */
export async function fetchFeedPage(scope: FeedScope, page: number): Promise<FeedPage> {
  const body = (await unwrap(
    api.GET('/api/hub/feed/entries', { params: { query: { scope, sort: FEED_SORT, page, perPage: FEED_PAGE_SIZE } } }),
  )) as unknown as Envelope<FeedEntry[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('feed');
  const next = body.pagination?.nextPage;
  return { entries: body.data, nextPage: typeof next === 'number' ? next : null };
}

/** The free preview and counts of one piece. */
export async function fetchContentDetail(id: string): Promise<ContentDetail> {
  const body = (await unwrap(
    api.GET('/api/hub/content/{id}/detail', { params: { path: { id } } }),
  )) as unknown as Envelope<ContentDetail>;
  const detail = body?.data;
  if (!detail || typeof detail !== 'object' || !detail.freePreview) throw unreadable('preview');
  return detail;
}

export type LikeState = components['schemas']['LikeState'];

/** Likes or unlikes a piece; the Hub answers with the count and the viewer's flag. */
export async function setLiked(id: string, liked: boolean): Promise<LikeState> {
  const call = liked
    ? api.POST('/api/hub/content/{id}/like', { params: { path: { id } } })
    : api.DELETE('/api/hub/content/{id}/like', { params: { path: { id } } });
  const body = (await unwrap(call)) as unknown as Envelope<LikeState>;
  const state = body?.data;
  if (!state || typeof state.likes !== 'number') throw unreadable('like');
  return state;
}

/** Saves a piece to the viewer's list, or takes it off. */
export async function setSaved(id: string, saved: boolean): Promise<void> {
  if (saved) await unwrap(api.POST('/api/hub/content/{id}/save', { params: { path: { id } } }));
  else await unwrap(api.DELETE('/api/hub/content/{id}/save', { params: { path: { id } } }));
}

/** Follows a creator. */
export async function follow(wawuId: string): Promise<boolean> {
  const body = (await unwrap(
    api.POST('/api/hub/creators/{wawuId}/follow', { params: { path: { wawuId } } }),
  )) as unknown as Envelope<{ following: boolean }>;
  return body?.data?.following === true;
}

/**
 * Counts one view of a piece the viewer opened (HOME-04: the Hub counts one per person per
 * piece per day and never the owner's own). The feed calls it when a post fills the screen.
 */
export async function recordView(id: string): Promise<void> {
  await unwrap(api.POST('/api/hub/content/{id}/view', { params: { path: { id } } }));
}

export const meKey = ['feed', 'me'] as const;

/** The viewer's own id, so the rail never offers to follow the viewer's own post. */
export async function fetchMyId(): Promise<string> {
  const body = (await unwrap(api.GET('/api/hub/users/me'))) as unknown as Envelope<{ wawuUserId?: string }>;
  const id = body?.data?.wawuUserId;
  if (typeof id !== 'string' || !id) throw unreadable('account');
  return id;
}

export const followingCountKey = ['feed', 'following-count'] as const;

/** How many people the viewer follows: tells "you follow nobody" from "they have not posted". */
export async function fetchFollowingCount(): Promise<number> {
  const body = (await unwrap(api.GET('/api/hub/feed/following/count'))) as unknown as Envelope<{ count?: number }>;
  const count = body?.data?.count;
  if (typeof count !== 'number') throw unreadable('count');
  return count;
}

