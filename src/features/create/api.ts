import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';

import type { FormatId, FormatRule } from './model';

/**
 * The calls M19 to M22 make, as the Hub's contract types them:
 * - `GET /uploads/allowance`: "Uploads 4 of 5 used" (M19), from the Hub's own count and limit for this account;
 * - `GET /uploads/formats`: what each format may upload, the types, the most bytes and the clip length (M20 to M22);
 * - `POST /uploads/presign` with `format`: the link one file goes up to, checked against that format's rule;
 * - `POST /uploads/release`: gives a file back once the draft lets go of it, so it stops counting against the account's storage.
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
  withTick: { uploads: number };
};

export async function fetchAllowance(): Promise<Allowance> {
  const out = dataOf<Partial<Allowance>>(await unwrap(api.GET('/api/hub/uploads/allowance')), 'uploads');
  const { uploads, withTick } = out;
  if (
    typeof out.tickHeld !== 'boolean' ||
    typeof uploads?.used !== 'number' ||
    typeof uploads.allowed !== 'number' ||
    typeof uploads.remaining !== 'number' ||
    typeof withTick?.uploads !== 'number'
  ) {
    throw unreadable('uploads');
  }
  return { tickHeld: out.tickHeld, uploads, withTick };
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
