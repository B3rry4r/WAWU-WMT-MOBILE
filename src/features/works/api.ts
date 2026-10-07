import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * M34, M35 and M36's calls, as the Hub's contract types them (ME-16, and ME-11's `owner`):
 * - `GET /users/{wawuId}/featured-works` (`?category=`): the works, the category chips, the
 *   count, and whose they are. The id may be the person's handle. The person's own page reads
 *   the same route;
 * - `GET /users/{wawuId}/featured-works/{workId}`: one work and its owner;
 * - `POST /users/me/featured-works`: add a work;
 * - `POST /uploads/presign` (folder `profile/work`) for each photo or video.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type Works = components['schemas']['ProfileWorksView'];
export type Work = components['schemas']['ProfileWorkView'];
export type WorkDetail = components['schemas']['ProfileWorkDetailView'];
export type WorkOwner = components['schemas']['ProfileWorkOwnerView'];
export type WorkMedia = components['schemas']['ProfileWorkMediaView'];
export type NewWork = components['schemas']['CreateProfileWorkDto'];

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

/** Every query this feature keeps starts with this, so a saved work refreshes all of them (and a profile screen can too). */
export const worksRoot = ['works'] as const;
export const worksKey = (wawuId: string, category: string | null) => [...worksRoot, wawuId, 'list', category] as const;
export const workKey = (wawuId: string, workId: string) => [...worksRoot, wawuId, 'one', workId] as const;
export const myIdKey = ['works', 'my-id'] as const;

export async function fetchWorks(wawuId: string, category: string | null): Promise<Works> {
  const works = dataOf<Works>(
    await unwrap(
      api.GET('/api/hub/users/{wawuId}/featured-works', {
        params: { path: { wawuId }, query: category ? { category } : {} },
      }),
    ),
    'works',
  );
  if (!Array.isArray(works.works) || !Array.isArray(works.categories) || typeof works.owner !== 'object') throw unreadable('works');
  return works;
}

export async function fetchWork(wawuId: string, workId: string): Promise<WorkDetail> {
  const work = dataOf<WorkDetail>(
    await unwrap(api.GET('/api/hub/users/{wawuId}/featured-works/{workId}', { params: { path: { wawuId, workId } } })),
    'work',
  );
  if (typeof work.id !== 'string' || typeof work.owner !== 'object') throw unreadable('work');
  return work;
}

/** The signed-in person's own WAWU ID, so a screen can tell their own page from somebody else's. */
export async function fetchMyId(): Promise<string> {
  const me = dataOf<{ wawuUserId?: unknown }>(await unwrap(api.GET('/api/hub/users/me')), 'profile');
  if (typeof me.wawuUserId !== 'string') throw unreadable('profile');
  return me.wawuUserId;
}

export async function createWork(body: NewWork): Promise<Work> {
  return dataOf<Work>(await unwrap(api.POST('/api/hub/users/me/featured-works', { body })), 'work');
}

export type Presigned = { uploadUrl: string; key: string };

export async function presignWorkMedia(contentType: string, extension: string, contentLength: number): Promise<Presigned> {
  const out = dataOf<{ uploadUrl?: unknown; key?: unknown }>(
    await unwrap(api.POST('/api/hub/uploads/presign', { body: { folder: 'profile/work', contentType, extension, contentLength } })),
    'upload',
  );
  if (typeof out.uploadUrl !== 'string' || typeof out.key !== 'string') throw unreadable('upload');
  return { uploadUrl: out.uploadUrl, key: out.key };
}
