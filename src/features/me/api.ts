import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * The Me tab's own calls (M1, M2, M4), as the Hub's contract types them. The profile itself and its details
 * are read with M8's calls (`fetchMe`, `fetchFields` in `@/features/profile-edit/api`) under the same keys, so
 * a save on M8 is on M1 when the person comes back; the works with M34's (`@/features/works/api`).
 * - `GET /users/me/profile-stats`: followers, following and live pieces (the three counts);
 * - `GET /users/{wawuId}/content`: the live pieces, newest first, as a visitor sees them (the Content grid);
 * - `GET /creator/state`: paid messages on or off, the price and the reply window (M2's first row);
 * - `GET /professionals/applications/mine`: the person's professional listings (M2's other rows);
 * - `GET /users/me/featured-works?limit=3`: the works on the About tab (under ME-11's `['works']` key).
 *
 * The Hub's success body is `{ statusCode, message, data }` (and `pagination` on a list) and the contract types
 * only `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null; pagination?: { nextPage?: number | null; total?: number } };

export type MyProfile = components['schemas']['UserProfileWithClaims'];
export type ProfileFields = components['schemas']['ProfileFieldsView'];
export type Experience = components['schemas']['ProfileExperienceView'];
export type ProfileStats = components['schemas']['ProfileStatsView'];
export type ContentPiece = components['schemas']['ContentPieceResponse'];
export type ServiceState = components['schemas']['CreatorStateResponse'];
export type Works = components['schemas']['ProfileWorksView'];
export type Listing = operations['ProfessionalController_mine']['responses'][200]['content']['application/json'][number];

const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** Every key here but the works' starts with `profile`, so M8's save (`invalidateQueries({ queryKey: ['profile'] })`) refreshes the whole tab. */
export const statsKey = ['profile', 'stats'] as const;
export const gridKey = (wawuId: string) => ['profile', 'content', wawuId] as const;
export const servicesKey = ['profile', 'services'] as const;
export const listingsKey = ['profile', 'listings'] as const;

/** How many pieces one page of the grid asks for: four rows of three on a phone, and a little more. */
export const GRID_PAGE_SIZE = 18;

/** The counts. An account that has never saved a profile has no row yet: the Hub answers 404, and it has nobody and nothing to count. */
export async function fetchProfileStats(): Promise<Pick<ProfileStats, 'followerCount' | 'followingCount' | 'postCount'>> {
  let body: Envelope<ProfileStats>;
  try {
    body = (await unwrap(api.GET('/api/hub/users/me/profile-stats'))) as unknown as Envelope<ProfileStats>;
  } catch (error) {
    if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) return { followerCount: 0, followingCount: 0, postCount: 0 };
    throw error;
  }
  const stats = body?.data;
  if (!stats || typeof stats.followerCount !== 'number' || typeof stats.followingCount !== 'number' || typeof stats.postCount !== 'number') {
    throw unreadable('numbers');
  }
  return stats;
}

export type GridPage = { pieces: ContentPiece[]; nextPage: number | null };

export async function fetchGridPage(wawuId: string, page: number): Promise<GridPage> {
  const body = (await unwrap(
    api.GET('/api/hub/users/{wawuId}/content', { params: { path: { wawuId }, query: { page, perPage: GRID_PAGE_SIZE } } }),
  )) as unknown as Envelope<ContentPiece[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('content');
  const next = body.pagination?.nextPage;
  return { pieces: body.data, nextPage: typeof next === 'number' && body.data.length > 0 ? next : null };
}

/**
 * Paid messages, for a creator account. A plain account has no creator state: the Hub answers 403 ("a creator
 * account type is required") or, for a row that is gone, 404. Either means "nothing to show", not a failure.
 */
export async function fetchServiceState(): Promise<ServiceState | null> {
  try {
    const body = (await unwrap(api.GET('/api/hub/creator/state'))) as unknown as Envelope<ServiceState>;
    const state = body?.data;
    if (!state || typeof state.dmEnabled !== 'boolean') throw unreadable('services');
    return state;
  } catch (error) {
    if (error instanceof ApiError && (error.status === HTTP_FORBIDDEN || error.status === HTTP_NOT_FOUND)) return null;
    throw error;
  }
}

export async function fetchListings(): Promise<Listing[]> {
  const body = (await unwrap(api.GET('/api/hub/professionals/applications/mine'))) as unknown as Envelope<Listing[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('listings');
  return body.data;
}

/** The About tab's works card shows three (M4). */
export const ABOUT_WORKS_SHOWN = 3;

/** Under ME-11's `['works']` key, so adding a work on M36 or removing one on M35 refreshes the About tab too. */
export const aboutWorksKey = ['works', 'mine', 'about'] as const;

/** The person's own works, first three (any account may add works, so this is the owner's route, not the visitor's). */
export async function fetchAboutWorks(): Promise<Works> {
  const body = (await unwrap(api.GET('/api/hub/users/me/featured-works', { params: { query: { limit: ABOUT_WORKS_SHOWN } } }))) as unknown as Envelope<Works>;
  const works = body?.data;
  if (!works || !Array.isArray(works.works) || typeof works.count !== 'number') throw unreadable('featured works');
  return works;
}
