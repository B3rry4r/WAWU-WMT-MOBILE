import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * Someone else's profile (M5, M6, M33), as the Hub's contract types it (ME-02):
 * - `GET /users/{wawuId}/visitor-profile`: everything the header, Services and About draw, in one answer (the public profile,
 *   the profile details, the name, whether the caller follows them, their live listings). The id may be a handle;
 * - `GET /users/{wawuId}/content`: their live pieces (the Content tab, read with M1's `fetchGridPage`);
 * - `GET /users/{wawuId}/featured-works` and `GET /users/{wawuId}/education`: the About tab;
 * - `POST` and `DELETE /creators/{wawuId}/follow`: Follow and Following (Explore's `setFollowing`);
 * - `POST /settings/privacy/blocked`: Block, from the profile's menu (SETTINGS-04).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads `data` itself.
 */
type Envelope<T> = { statusCode?: number; message?: string; data?: T | null };

export type VisitorProfile = components['schemas']['VisitorProfileView'];
export type VisitorListing = components['schemas']['VisitorListingView'];
export type Education = components['schemas']['ProfileEducationView'];
export type VisitorWorks = components['schemas']['ProfileWorksView'];

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `This ${what} could not be read. Try again.`);
}

/** Every key starts with `profile`, so a save elsewhere that refreshes `['profile']` refreshes these too. */
export const visitorKey = (wawuId: string) => ['profile', 'visitor', wawuId] as const;
export const visitorWorksKey = (wawuId: string) => ['works', wawuId, 'visitor-about'] as const;
export const educationKey = (wawuId: string) => ['profile', 'education', wawuId] as const;

/** How many works the About tab's row holds before "See all" (M34 lists the rest). */
export const ABOUT_WORKS_SHOWN = 10;

export async function fetchVisitorProfile(wawuId: string): Promise<VisitorProfile> {
  const body = (await unwrap(api.GET('/api/hub/users/{wawuId}/visitor-profile', { params: { path: { wawuId } } }))) as unknown as Envelope<VisitorProfile>;
  const view = body?.data;
  if (!view || typeof view !== 'object' || !view.profile || !view.fields || typeof view.following !== 'boolean' || !Array.isArray(view.listings)) {
    throw unreadable('profile');
  }
  return view;
}

export async function fetchVisitorWorks(wawuId: string): Promise<VisitorWorks> {
  const body = (await unwrap(
    api.GET('/api/hub/users/{wawuId}/featured-works', { params: { path: { wawuId }, query: { limit: ABOUT_WORKS_SHOWN } } }),
  )) as unknown as Envelope<VisitorWorks>;
  const works = body?.data;
  if (!works || !Array.isArray(works.works) || typeof works.count !== 'number') throw unreadable('featured works');
  return works;
}

export async function fetchEducation(wawuId: string): Promise<Education[]> {
  const body = (await unwrap(api.GET('/api/hub/users/{wawuId}/education', { params: { path: { wawuId } } }))) as unknown as Envelope<Education[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('education');
  return body.data;
}

/** Blocks the person. The Hub drops any follow between the two, so the screen leaves their profile. */
export async function blockPerson(wawuId: string): Promise<void> {
  await unwrap(api.POST('/api/hub/settings/privacy/blocked', { body: { blockedWawuId: wawuId } }));
}
