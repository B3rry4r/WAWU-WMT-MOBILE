import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The call behind My purchases (M29): `GET /me/purchases/all?q=&cursor=&limit=` (FIX-59), everything the person paid for, newest first:
 * pieces they unlocked, event tickets, credit packs, school fees and community passes, searchable by a part of the title (or a
 * piece's creator's handle; 2 to 60 characters), each marked `paid` or `refunded`. ME-10's `GET /me/purchases` lists pieces only and
 * is not read here. The success body is `{ statusCode, message, data }` and the contract types only `data`, so the call reads `data`
 * itself and refuses a body that is not a page of purchases.
 */
type Envelope<T> = { data?: T | null };

export type PurchaseEntry = components['schemas']['PaidPurchaseView'];
export type PurchaseKind = PurchaseEntry['kind'];

/** How many purchases one page asks for. */
export const PAGE_SIZE = 20;
/** The Hub's search runs on 2 to 60 characters. */
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 60;

export type PurchasesPage = { items: PurchaseEntry[]; nextCursor: string | null };

/** Every key starts with `me`, so the Me menu's count and these lists can be refreshed together. */
export const purchasesKey = (query: string) => ['me', 'purchases', query] as const;

const KINDS: readonly string[] = ['content_unlock', 'event_ticket', 'credit_pack', 'school_fee', 'community_pass', 'legal_fee'];

const isEntry = (value: unknown): value is PurchaseEntry => {
  const e = value as Partial<PurchaseEntry> | null;
  if (!e || typeof e.id !== 'string' || typeof e.title !== 'string' || typeof e.purchasedAt !== 'string' || typeof e.amountKobo !== 'number') return false;
  if (!KINDS.includes(String(e.kind)) || (e.status !== 'paid' && e.status !== 'refunded')) return false;
  if (e.openId != null && typeof e.openId !== 'string') return false;
  if (e.content != null) {
    const c = e.content as Partial<NonNullable<PurchaseEntry['content']>>;
    return typeof c.id === 'string' && typeof c.title === 'string' && typeof c.contentType === 'string' && typeof c.creator === 'object' && c.creator !== null;
  }
  return true;
};

export async function fetchPurchasesPage(query: string, cursor: string | null): Promise<PurchasesPage> {
  const body = (await unwrap(
    api.GET('/api/hub/me/purchases/all', { params: { query: { q: query === '' ? undefined : query, cursor: cursor ?? undefined, limit: PAGE_SIZE } } }),
  )) as unknown as Envelope<{ items?: unknown; nextCursor?: unknown }>;
  const data = body?.data;
  if (!data || !Array.isArray(data.items) || !data.items.every(isEntry) || !(typeof data.nextCursor === 'string' || data.nextCursor === null)) {
    throw new ApiError('unknown', 200, 'Your purchases could not be read. Try again.');
  }
  return { items: data.items, nextCursor: data.nextCursor };
}
