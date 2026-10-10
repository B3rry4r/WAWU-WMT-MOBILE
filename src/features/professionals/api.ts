import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * P1 to P4's calls, as the Hub's contract types them (PROS-02):
 * - `GET /professionals/fields`: the fields the chips filter by, in the canvas's order (read through PROS-03's
 *   `fetchFields`, one cache entry for both features);
 * - `GET /professionals/directory?field=`: listed professionals, a page at a time, with the field, the city, the usual
 *   reply time and the price of a message. The Hub leaves out anyone the viewer blocked or who blocked the viewer;
 * - `GET /professionals/directory/{id}`: one listing with its about, services and credential (404 when it is not
 *   listed, or the viewer and the professional have blocked each other).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row
 * 11), so each call reads `data` itself.
 */
export type DirectoryEntry = components['schemas']['ProfessionalDirectoryEntry'];
export type DirectoryProfile = components['schemas']['ProfessionalDirectoryProfile'];
type DirectoryQuery = NonNullable<operations['ProfessionalController_directory']['parameters']['query']>;
/** The field ids the contract accepts on the directory. */
export type FieldId = NonNullable<DirectoryQuery['field']>;
type ContractPage = components['schemas']['ProfessionalDirectoryPage'];

/** One page as the screen uses it. `nextPage` is null on the last page. */
export type DirectoryPage = { items: DirectoryEntry[]; nextPage: number | null };

type Envelope<T> = { data?: T | null; pagination?: { currentPage?: number; nextPage?: number | null; perPage?: number; total?: number } };

/** How many professionals one page asks for: the Hub's own default (1 to 50), written down so every page is the same. */
export const DIRECTORY_PAGE_SIZE = 20;

export const prosKeys = {
  all: ['professionals'] as const,
  /** `all` is every field; anything else is one field's id. */
  directory: (field: string) => ['professionals', 'directory', field] as const,
  profile: (id: string) => ['professionals', 'profile', id] as const,
};

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

/**
 * The page after this one, or null on the last page or when a page came back empty (so an empty page never asks for
 * another). Read from the counts the contract describes.
 */
export function nextFromCounts(page: Pick<ContractPage, 'currentPage' | 'perPage' | 'total'>, itemCount: number): number | null {
  if (itemCount === 0) return null;
  return page.currentPage * page.perPage < page.total ? page.currentPage + 1 : null;
}

/**
 * One page of the directory, every field's (`all`) or one field's. Pages count from 1.
 *
 * On the wire the Hub's response interceptor may move a page's `items` into `data` and its counts into a `pagination`
 * block (`{ data: [...], pagination: { currentPage, nextPage, perPage, total } }`), while the contract describes the page
 * before that move (`{ items, currentPage, perPage, total }` inside `data`; BACKEND_GAPS G-300). Both are read.
 */
export async function fetchDirectoryPage(field: FieldId | 'all', page: number): Promise<DirectoryPage> {
  const query = { page, perPage: DIRECTORY_PAGE_SIZE, ...(field === 'all' ? {} : { field }) };
  const body = (await unwrap(api.GET('/api/hub/professionals/directory', { params: { query } }))) as unknown as Envelope<
    DirectoryEntry[] | Partial<ContractPage>
  >;
  const data = body?.data;
  if (Array.isArray(data)) {
    const next = body.pagination?.nextPage;
    if (!body.pagination || (next !== null && next !== undefined && typeof next !== 'number')) throw unreadable('professionals');
    if (typeof next === 'number' || next === null) return { items: data, nextPage: data.length === 0 ? null : next };
    const { currentPage, perPage, total } = body.pagination;
    if (typeof currentPage !== 'number' || typeof perPage !== 'number' || typeof total !== 'number') throw unreadable('professionals');
    return { items: data, nextPage: nextFromCounts({ currentPage, perPage, total }, data.length) };
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) throw unreadable('professionals');
  if (typeof data.currentPage !== 'number' || typeof data.perPage !== 'number' || typeof data.total !== 'number') {
    throw unreadable('professionals');
  }
  return { items: data.items, nextPage: nextFromCounts({ currentPage: data.currentPage, perPage: data.perPage, total: data.total }, data.items.length) };
}

/** One listing, for P2 and P3. */
export async function fetchProfile(id: string): Promise<DirectoryProfile> {
  const body = (await unwrap(api.GET('/api/hub/professionals/directory/{id}', { params: { path: { id } } }))) as unknown as Envelope<DirectoryProfile>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || typeof data.id !== 'string' || typeof data.name !== 'string') throw unreadable('profile');
  return data;
}
