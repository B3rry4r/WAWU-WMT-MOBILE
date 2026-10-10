import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, paths } from '@/api/schema.generated';
import { listingsKey } from '@/features/me/api';
import type { QueryClient } from '@tanstack/react-query';

/**
 * P5 to P10's calls, as the Hub's contract types them:
 * - `GET /professionals/fields` (PROS-02): the fields a person can offer services in, with `regulated`;
 * - `POST /professionals/applications`: one application per field (the Hub keeps one per person and category);
 * - `GET /professionals/applications/mine`: every application the person has, with its status and reason;
 * - `PATCH /professionals/applications/{id}/listing`: Hide and Show on a listed field;
 * - `GET /users/me`: the account type, for the creator gate (P10);
 * - `POST /uploads/presign` with `professional/document`: the licence file.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type ProField = components['schemas']['ProfessionalFieldView'];
export type Application = paths['/api/hub/professionals/applications/mine']['get']['responses']['200']['content']['application/json'][number];
export type ApplyBody = components['schemas']['ApplyProfessionalDto'];
export type CredentialKind = ApplyBody['credentialKind'];

export const proKeys = {
  fields: ['pro-listing', 'fields'] as const,
  mine: ['pro-listing', 'mine'] as const,
  account: ['pro-listing', 'account'] as const,
};

/** Every query that shows the person's listings: P5 to P8 read `mine`, M2 on Me reads `listingsKey`. Refresh both in one place. */
export function refreshListings(client: QueryClient, opts: { refetchMine?: boolean } = {}): Promise<unknown> {
  // After Hide or Show the screen already holds the Hub's saved row, so `mine` is only marked stale (it is read again on the next focus).
  return Promise.all([
    client.invalidateQueries({ queryKey: proKeys.mine, refetchType: opts.refetchMine === false ? 'none' : 'active' }),
    client.invalidateQueries({ queryKey: listingsKey }),
  ]);
}

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (data === null || data === undefined || typeof data !== 'object') throw unreadable(what);
  return data;
}

export async function fetchFields(): Promise<ProField[]> {
  const rows = dataOf<ProField[]>(await unwrap(api.GET('/api/hub/professionals/fields')), 'fields');
  if (!Array.isArray(rows)) throw unreadable('fields');
  return rows;
}

export async function fetchMine(): Promise<Application[]> {
  const rows = dataOf<Application[]>(await unwrap(api.GET('/api/hub/professionals/applications/mine')), 'listings');
  if (!Array.isArray(rows)) throw unreadable('listings');
  return rows;
}

export async function applyIn(body: ApplyBody): Promise<Application> {
  return dataOf<Application>(await unwrap(api.POST('/api/hub/professionals/applications', { body })), 'application');
}

export async function setListed(id: string, listed: boolean): Promise<Application> {
  return dataOf<Application>(
    await unwrap(api.PATCH('/api/hub/professionals/applications/{id}/listing', { params: { path: { id } }, body: { listed } })),
    'listing',
  );
}

/** Whether this person has a creator account: P10 stops everyone else. */
export async function fetchIsCreator(): Promise<boolean> {
  const me = dataOf<{ accountType?: unknown }>(await unwrap(api.GET('/api/hub/users/me')), 'account');
  // The contract allows a null account type: that person has not chosen one, so they are not a creator (P10).
  if (me.accountType !== null && typeof me.accountType !== 'string') throw unreadable('account');
  return me.accountType === 'creator';
}

export type Presigned = components['schemas']['PresignUploadDto'];

export async function presign(body: Presigned): Promise<{ uploadUrl: string; fileUrl: string }> {
  const out = dataOf<{ uploadUrl?: unknown; fileUrl?: unknown }>(await unwrap(api.POST('/api/hub/uploads/presign', { body })), 'upload');
  if (typeof out.uploadUrl !== 'string' || typeof out.fileUrl !== 'string') throw unreadable('upload');
  return { uploadUrl: out.uploadUrl, fileUrl: out.fileUrl };
}
