import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The call behind My purchases (M29), as the Hub's contract types it (ME-10 built it):
 * `GET /me/purchases?q=&cursor=&limit=`: the pieces the person bought, newest first, searchable by a part of the title or the
 * creator's handle (2 to 60 characters), each with the person's own course progress. The success body is `{ statusCode, message,
 * data }` and the contract types only `data`, so the call reads `data` itself and refuses a body that is not a page of purchases.
 */
type Envelope<T> = { data?: T | null };

export type PurchaseEntry = components['schemas']['PurchaseEntryView'];

/** How many purchases one page asks for. */
export const PAGE_SIZE = 20;
/** The Hub's search runs on 2 to 60 characters. */
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 60;

export type PurchasesPage = { items: PurchaseEntry[]; nextCursor: string | null };

/** Every key starts with `me`, so the Me menu's count and these lists can be refreshed together. */
export const purchasesKey = (query: string) => ['me', 'purchases', query] as const;

const isEntry = (value: unknown): value is PurchaseEntry => {
  const e = value as Partial<PurchaseEntry> | null;
  const c = e?.content as Partial<PurchaseEntry['content']> | undefined;
  return (
    typeof e?.id === 'string' &&
    typeof e.purchasedAt === 'string' &&
    typeof c?.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.contentType === 'string' &&
    typeof c.creator === 'object' &&
    c.creator !== null
  );
};

export async function fetchPurchasesPage(query: string, cursor: string | null): Promise<PurchasesPage> {
  const body = (await unwrap(
    api.GET('/api/hub/me/purchases', { params: { query: { q: query === '' ? undefined : query, cursor: cursor ?? undefined, limit: PAGE_SIZE } } }),
  )) as unknown as Envelope<{ items?: unknown; nextCursor?: unknown }>;
  const data = body?.data;
  if (!data || !Array.isArray(data.items) || !data.items.every(isEntry) || !(typeof data.nextCursor === 'string' || data.nextCursor === null)) {
    throw new ApiError('unknown', 200, 'Your purchases could not be read. Try again.');
  }
  return { items: data.items, nextCursor: data.nextCursor };
}
