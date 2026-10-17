import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind My content (M28) and Rejected (M26), as the Hub's contract types them (ME-09 built them, ME-07 draws them):
 * - `GET /content/mine/library?status=&page=`: the person's own pieces, newest first, each with its sales and the reviewer's reason;
 * - `GET /content/mine/library/counts`: the numbers on the filter chips (All, Live, In review, Rejected);
 * - `GET /content/mine/library/{id}`: one of the person's pieces (M26);
 * - `PATCH /content/{id}`: the details or the file of a piece that is waiting or was turned down;
 * - `POST /content/{id}/resubmit`: sends a turned-down piece for review again (it takes a place like a new piece);
 * - `DELETE /content/{id}`: takes a piece down.
 * The Hub's success body is `{ statusCode, message, data }` (and `pagination` on a list) and the contract types only the inner
 * piece, so each call reads `data` itself and refuses a body that is not the piece it asked for.
 */
type Envelope<T> = { data?: T | null; pagination?: { nextPage?: number | null; total?: number } };

export type LibraryPiece = components['schemas']['MyContentItem'];
export type LibraryCounts = components['schemas']['MyContentCounts'];
export type UpdateBody = components['schemas']['UpdateContentDto'];
/** The states M28's chips filter on, in the Hub's words (`status` on the list). */
export type LibraryFilter = 'all' | 'live' | 'pending' | 'rejected';

const unreadable = (what: string): ApiError => new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);

/** Every key starts with `library`, so one invalidation after a delete, an edit or a resend refreshes the list, the counts and the piece. */
export const libraryKey = ['library'] as const;
export const countsKey = ['library', 'counts'] as const;
export const listKey = (filter: LibraryFilter) => ['library', 'list', filter] as const;
export const pieceKey = (id: string) => ['library', 'piece', id] as const;

/** How many pieces one page asks for. */
export const PAGE_SIZE = 20;

const STATUSES = ['pending', 'rejected', 'live', 'removed'];
const isPiece = (value: unknown): value is LibraryPiece => {
  const p = value as Partial<LibraryPiece> | null;
  return Boolean(p) && typeof p?.id === 'string' && typeof p.title === 'string' && typeof p.status === 'string' && STATUSES.includes(p.status) && typeof p.price === 'number';
};

export type LibraryPage = { pieces: LibraryPiece[]; nextPage: number | null };

export async function fetchLibraryPage(filter: LibraryFilter, page: number): Promise<LibraryPage> {
  const status = filter === 'all' ? undefined : filter;
  const body = (await unwrap(api.GET('/api/hub/content/mine/library', { params: { query: { page, perPage: PAGE_SIZE, status } } }))) as unknown as Envelope<LibraryPiece[]>;
  if (!body || !Array.isArray(body.data) || !body.data.every(isPiece)) throw unreadable('content');
  const next = body.pagination?.nextPage;
  return { pieces: body.data, nextPage: typeof next === 'number' && body.data.length > 0 ? next : null };
}

const whole = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

export async function fetchCounts(): Promise<LibraryCounts> {
  const body = (await unwrap(api.GET('/api/hub/content/mine/library/counts'))) as unknown as Envelope<LibraryCounts>;
  const c = body?.data;
  if (!c || !whole(c.all) || !whole(c.live) || !whole(c.pending) || !whole(c.rejected)) throw unreadable('content');
  return c;
}

export async function fetchPiece(id: string): Promise<LibraryPiece> {
  const body = (await unwrap(api.GET('/api/hub/content/mine/library/{id}', { params: { path: { id } } }))) as unknown as Envelope<LibraryPiece>;
  if (!isPiece(body?.data)) throw unreadable('piece');
  return body.data;
}

/** Edits the details or the file; the Hub answers the piece as it now stands. */
export async function updatePiece(id: string, changes: UpdateBody): Promise<LibraryPiece> {
  const body = (await unwrap(api.PATCH('/api/hub/content/{id}', { params: { path: { id } }, body: changes }))) as unknown as Envelope<LibraryPiece>;
  if (!isPiece(body?.data)) throw unreadable('piece');
  return body.data;
}

/** Sends a turned-down piece for review again. A refusal arrives as an `ApiError` carrying the Hub's own sentence and `code`. */
export async function resubmitPiece(id: string): Promise<LibraryPiece> {
  const body = (await unwrap(api.POST('/api/hub/content/{id}/resubmit', { params: { path: { id } } }))) as unknown as Envelope<LibraryPiece>;
  if (!isPiece(body?.data)) throw unreadable('piece');
  return body.data;
}

export async function deletePiece(id: string): Promise<void> {
  await unwrap(api.DELETE('/api/hub/content/{id}', { params: { path: { id } } }));
}
