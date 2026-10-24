import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, paths } from '@/api/schema.generated';

/**
 * The inbox's calls (I1, I35, I36), as the Hub's contract types them (INBOX-07, INBOX-02):
 * - `GET /inbox`: chats, paid questions and communities in one list, newest activity first,
 *   cursor-paged with an opaque cursor (`?kind=money`: money requests and sends between two people, FIX-114);
 * - `GET /inbox/unread`: the Inbox tab's badge, the sum of every row's unread count;
 * - `GET /live/catch-up`: what the live socket missed while it was down.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
export type InboxItem = components['schemas']['InboxItem'];
export type InboxKind = InboxItem['kind'];
/** What `GET /inbox` takes as `kind`: one kind of row, or `money` (the Money chip: requests and sends between two people together). */
export type InboxFilter = NonNullable<NonNullable<paths['/api/hub/inbox']['get']['parameters']['query']>['kind']>;
export type InboxPage = components['schemas']['InboxPage'];
export type InboxUnread = components['schemas']['InboxUnread'];
export type LiveCatchUp = components['schemas']['LiveCatchUp'];
export type LiveEvent = LiveCatchUp['events'][number];

type Envelope<T> = { data?: T | null };

/** How many rows one page asks for. The server's own default, written down so a page is the same everywhere. */
export const INBOX_PAGE_SIZE = 20;
/** The most a catch-up page can hold (the contract: 1 to 100). */
export const CATCH_UP_PAGE_SIZE = 100;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const inboxKey = ['inbox'] as const;
export const inboxListKey = (kind: InboxFilter | 'all') => ['inbox', 'list', kind] as const;
export const inboxUnreadKey = ['inbox', 'unread'] as const;

/** One page of the inbox. `nextCursor` is null on the last page; send it back exactly as given. */
export async function fetchInboxPage(kind: InboxFilter | 'all', cursor?: string): Promise<InboxPage> {
  const page = dataOf<InboxPage>(
    await unwrap(
      api.GET('/api/hub/inbox', {
        params: { query: { limit: INBOX_PAGE_SIZE, ...(cursor ? { cursor } : {}), ...(kind === 'all' ? {} : { kind }) } },
      }),
    ),
    'inbox',
  );
  if (!Array.isArray(page.items)) throw unreadable('inbox');
  return page;
}

/** The count the Inbox tab shows. */
export async function fetchInboxUnread(): Promise<InboxUnread> {
  const unread = dataOf<InboxUnread>(await unwrap(api.GET('/api/hub/inbox/unread')), 'unread count');
  if (typeof unread.total !== 'number') throw unreadable('unread count');
  return unread;
}

/** What happened after `cursor`, oldest first. Send `cursor` from the answer straight back while `hasMore` is true. */
export async function fetchCatchUp(cursor: string): Promise<LiveCatchUp> {
  const page = dataOf<LiveCatchUp>(
    await unwrap(api.GET('/api/hub/live/catch-up', { params: { query: { cursor, limit: CATCH_UP_PAGE_SIZE } } })),
    'missed updates',
  );
  if (!Array.isArray(page.events) || typeof page.cursor !== 'string') throw unreadable('missed updates');
  return page;
}
