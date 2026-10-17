import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The calls behind Notifications (M31, M32), as the Hub's contract types them (ME-10 built the list):
 * - `GET /me/notifications?category=&cursor=&limit=`: the person's notifications, newest first, by chip, each with the kind the Hub
 *   gave it, its own words (`title`, `body`), a `tone`, whether it was `read`, and what opening it opens (`target`);
 * - `POST /notifications/{id}/read`: marks one read, what opening it does.
 * The success body is `{ statusCode, message, data }` and the contract types only `data`, so each call reads `data` itself.
 */
export type FeedItem = components['schemas']['NotificationFeedItem'];
export type FeedCategory = 'all' | 'money' | 'messages' | 'content';
export type FeedPage = { items: FeedItem[]; nextCursor: string | null; unreadCount: number };

/** How many notifications one page asks for. */
export const PAGE_SIZE = 20;

/** Every key starts with `me`, so one invalidation refreshes the list, the Me menu and the bell. */
export const feedKey = (category: FeedCategory) => ['me', 'notifications', category] as const;
export const feedRoot = ['me', 'notifications'] as const;

const isItem = (value: unknown): value is FeedItem => {
  const n = value as Partial<FeedItem> | null;
  return typeof n?.id === 'string' && typeof n.kind === 'string' && typeof n.title === 'string' && typeof n.body === 'string' && typeof n.read === 'boolean' && typeof n.createdAt === 'string';
};

export async function fetchFeedPage(category: FeedCategory, cursor: string | null): Promise<FeedPage> {
  const body = (await unwrap(api.GET('/api/hub/me/notifications', { params: { query: { category, cursor: cursor ?? undefined, limit: PAGE_SIZE } } }))) as unknown as {
    data?: { items?: unknown; nextCursor?: unknown; unreadCount?: unknown } | null;
  };
  const data = body?.data;
  if (
    !data ||
    !Array.isArray(data.items) ||
    !data.items.every(isItem) ||
    !(typeof data.nextCursor === 'string' || data.nextCursor === null) ||
    typeof data.unreadCount !== 'number'
  ) {
    throw new ApiError('unknown', 200, 'Your notifications could not be read. Try again.');
  }
  return { items: data.items, nextCursor: data.nextCursor, unreadCount: data.unreadCount };
}

/** Marks one notification read. Reading one that is already read changes nothing. */
export async function markRead(id: string): Promise<void> {
  await unwrap(api.POST('/api/hub/notifications/{id}/read', { params: { path: { id } }, body: {} }));
}
