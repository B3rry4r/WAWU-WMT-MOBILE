import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import type { FormatId, FormatRule } from './model';

/**
 * The calls M19 to M22 make, as the Hub's contract types them:
 * - `GET /uploads/allowance`: "Uploads 4 of 5 used" (M19), from the Hub's own count and limit for this account;
 * - `GET /uploads/formats`: what each format may upload, the types, the most bytes and the clip length (M20 to M22);
 * - `POST /uploads/presign` with `format`: the link one file goes up to, checked against that format's rule;
 * - `POST /uploads/release`: gives a file back once the draft lets go of it, so it stops counting against the account's storage;
 * - `POST /content`: sends the finished piece for review (M24), which takes a place in the uploads (M25's "5 of 5 used").
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`, so each call reads it.
 */
const unreadable = (what: string): ApiError => new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as { data?: T | null } | undefined)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const allowanceKey = ['uploads', 'allowance'] as const;
export const formatsKey = ['uploads', 'formats'] as const;

export type Allowance = {
  tickHeld: boolean;
  uploads: { used: number; allowed: number; remaining: number };
  /** The uploads of the Hub's free level: 0 while nothing may be published with no tier and no tick (R-43). */
  free: { uploads: number };
  withTick: { uploads: number };
};

export async function fetchAllowance(): Promise<Allowance> {
  const out = dataOf<Partial<Allowance>>(await unwrap(api.GET('/api/hub/uploads/allowance')), 'uploads');
  const { uploads, withTick } = out;
  const free = out.free as Partial<Allowance['free']> | undefined;
  if (
    typeof out.tickHeld !== 'boolean' ||
    typeof uploads?.used !== 'number' ||
    typeof uploads.allowed !== 'number' ||
    typeof uploads.remaining !== 'number' ||
    typeof withTick?.uploads !== 'number'
  ) {
    throw unreadable('uploads');
  }
  // A Hub that does not name its free level has none to say: no one is told they are on a free allowance.
  return { tickHeld: out.tickHeld, uploads, free: { uploads: typeof free?.uploads === 'number' ? free.uploads : 0 }, withTick };
}

export async function fetchFormats(): Promise<FormatRule[]> {
  const out = dataOf<{ formats?: unknown }>(await unwrap(api.GET('/api/hub/uploads/formats')), 'formats');
  if (!Array.isArray(out.formats) || out.formats.length === 0) throw unreadable('formats');
  return out.formats as FormatRule[];
}

export type Presigned = { uploadUrl: string; key: string; fileUrl: string };

export async function presign(
  folder: 'content/full' | 'content/preview',
  format: FormatId,
  contentType: string,
  extension: string,
  contentLength: number,
): Promise<Presigned> {
  const out = dataOf<{ uploadUrl?: unknown; key?: unknown; fileUrl?: unknown }>(
    await unwrap(api.POST('/api/hub/uploads/presign', { body: { folder, format, contentType, extension, contentLength } })),
    'upload',
  );
  if (typeof out.uploadUrl !== 'string' || typeof out.key !== 'string' || typeof out.fileUrl !== 'string') throw unreadable('upload');
  return { uploadUrl: out.uploadUrl, key: out.key, fileUrl: out.fileUrl };
}

/**
 * Tells the Hub the draft no longer holds this file. The Hub deletes it and frees its space unless a listing already uses it (then it
 * refuses, and the file stays). Nothing waits on this: the callers send it and move on, and a failure is dropped.
 */
export async function releaseUpload(key: string): Promise<void> {
  await unwrap(api.POST('/api/hub/uploads/release', { body: { key } }));
}

export type CreateContentBody = components['schemas']['CreateContentDto'];

/**
 * Sends the piece for review. The Hub files every new piece as pending. A 402 (`tier_required`, `product_limit_reached`)
 * arrives as an `ApiError` carrying the Hub's own sentence and `code`. The call never fails once the Hub has said yes: a
 * piece that was taken but whose answer cannot be read still goes to M25, because sending it again would make a second one.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types the piece itself, so both are read.
 */
export async function createContent(body: CreateContentBody): Promise<{ title: string }> {
  const raw = (await unwrap(api.POST('/api/hub/content', { body }))) as unknown;
  const piece = ((raw as { data?: unknown } | undefined)?.data ?? raw ?? {}) as { title?: unknown };
  return { title: typeof piece.title === 'string' && piece.title !== '' ? piece.title : body.title };
}
