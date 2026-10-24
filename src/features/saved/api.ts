import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind Saved (M30), as the Hub's contract types them (ME-10 built the list, the content and event saves are older):
 * - `GET /me/saved?type=&cursor=&limit=`: content, events and creators the person kept, newest first, one list or one tab;
 * - `DELETE /content/{id}/save`, `DELETE /events/{id}/save`, `DELETE /me/saved/creators/{wawuId}`: take a save back (each is idempotent).
 * Putting something into Saved is done where the thing is shown (a piece, an event, a profile), not on this screen. The success body
 * is `{ statusCode, message, data }` and the contract types only `data`, so each call reads `data` itself.
 */
type Envelope<T> = { data?: T | null };

export type SavedEntry = components['schemas']['SavedEntryView'];
export type SavedTab = 'all' | 'content' | 'events' | 'creators';

/** How many saves one page asks for. */
export const PAGE_SIZE = 20;

export type SavedPage = { items: SavedEntry[]; nextCursor: string | null };

/** Every key starts with `me`, so one invalidation refreshes the lists and the Me menu's count. */
export const savedKey = (tab: SavedTab) => ['me', 'saved', tab] as const;
export const savedRoot = ['me', 'saved'] as const;

const unreadable = (): ApiError => new ApiError('unknown', 200, 'Your saved items could not be read. Try again.');

const isEntry = (value: unknown): value is SavedEntry => {
  const e = value as Partial<SavedEntry> | null;
  if (typeof e?.id !== 'string' || typeof e.savedAt !== 'string') return false;
  if (e.kind === 'content') return typeof e.content?.id === 'string' && typeof e.content.title === 'string' && typeof e.content.contentType === 'string';
  if (e.kind === 'event') return typeof e.event?.id === 'string' && typeof e.event.name === 'string' && typeof e.event.startsAt === 'string';
  if (e.kind === 'creator') return typeof e.creator?.wawuId === 'string';
  return false;
};

export async function fetchSavedPage(tab: SavedTab, cursor: string | null): Promise<SavedPage> {
  const body = (await unwrap(api.GET('/api/hub/me/saved', { params: { query: { type: tab, cursor: cursor ?? undefined, limit: PAGE_SIZE } } }))) as unknown as Envelope<{
    items?: unknown;
    nextCursor?: unknown;
  }>;
  const data = body?.data;
  if (!data || !Array.isArray(data.items) || !data.items.every(isEntry) || !(typeof data.nextCursor === 'string' || data.nextCursor === null)) throw unreadable();
  return { items: data.items, nextCursor: data.nextCursor };
}

/** Takes one save back, whichever kind it is. */
export async function removeSaved(entry: SavedEntry): Promise<void> {
  if (entry.kind === 'content' && entry.content) {
    await unwrap(api.DELETE('/api/hub/content/{id}/save', { params: { path: { id: entry.content.id } } }));
  } else if (entry.kind === 'event' && entry.event) {
    await unwrap(api.DELETE('/api/hub/events/{id}/save', { params: { path: { id: entry.event.id } } }));
  } else if (entry.kind === 'creator' && entry.creator) {
    await unwrap(api.DELETE('/api/hub/me/saved/creators/{wawuId}', { params: { path: { wawuId: entry.creator.wawuId } } }));
  } else {
    throw unreadable();
  }
}
