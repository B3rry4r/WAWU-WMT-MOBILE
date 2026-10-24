import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import type { components } from '@/api/schema.generated';

import type { FieldsUpdate, MyProfile, ProfileFields, ProfileUpdate } from './form';

/**
 * M8 and M9's calls, as the Hub's contract types them:
 * - `GET /users/me` and `PATCH /users/me`: name, handle, bio, picture, cover and the
 *   social handles that were always there (Instagram, TikTok, X, YouTube, Facebook,
 *   LinkedIn);
 * - `GET` and `PATCH /users/me/profile-fields` (ME-05): location, the Threads handle and
 *   the order the social links show in;
 * - `PUT /users/me/handle` (SIGNUP-NAMES round 3): the username (the profile's handle). It is not sent in
 *   `PATCH /users/me`, which the web calls and which keeps its old rules;
 * - `POST /uploads/presign` for a new picture.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type Presigned = components['schemas']['PresignUploadDto'];

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const meKey = ['profile', 'me'] as const;
export const fieldsKey = ['profile', 'fields'] as const;

export async function fetchMe(): Promise<MyProfile> {
  const me = dataOf<MyProfile>(await unwrap(api.GET('/api/hub/users/me')), 'profile');
  if (typeof me.wawuUserId !== 'string') throw unreadable('profile');
  return me;
}

/**
 * The profile read the sign-up gate shares (SIGNUP-NAMES, R-82): the app's own profile query (`meKey`), asked fresh and
 * once, so the account type check and the name check of one start are the same single `GET /users/me`, and Home and Edit
 * profile find the answer already in the cache (written with `setQueryData`: the gate needs no query timers). It does not retry: the gate opens without it and the next start asks again.
 */
export async function readMine(): Promise<MyProfile> {
  const me = await fetchMe();
  queryClient.setQueryData(meKey, me);
  return me;
}

export async function fetchFields(): Promise<ProfileFields> {
  const fields = dataOf<ProfileFields>(await unwrap(api.GET('/api/hub/users/me/profile-fields')), 'profile details');
  if (!Array.isArray(fields.socialOrder)) throw unreadable('profile details');
  return fields;
}

export async function patchMe(body: ProfileUpdate): Promise<void> {
  await unwrap(api.PATCH('/api/hub/users/me', { body }));
}

/** `PUT /users/me/handle`: the Hub's own rules for a username (unique ignoring case, words kept back). A refusal is a 409 or 400 whose message is the Hub's sentence. */
export async function changeHandle(handle: string): Promise<void> {
  await unwrap(api.PUT('/api/hub/users/me/handle', { body: { handle } }));
}

export async function patchFields(body: FieldsUpdate): Promise<ProfileFields> {
  return dataOf<ProfileFields>(await unwrap(api.PATCH('/api/hub/users/me/profile-fields', { body })), 'profile details');
}

export async function presign(body: Presigned): Promise<{ uploadUrl: string; fileUrl: string }> {
  const out = dataOf<{ uploadUrl?: unknown; fileUrl?: unknown }>(await unwrap(api.POST('/api/hub/uploads/presign', { body })), 'upload');
  if (typeof out.uploadUrl !== 'string' || typeof out.fileUrl !== 'string') throw unreadable('upload');
  return { uploadUrl: out.uploadUrl, fileUrl: out.fileUrl };
}
