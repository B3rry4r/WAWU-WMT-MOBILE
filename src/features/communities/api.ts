import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, paths } from '@/api/schema.generated';
import { presign } from '@/features/profile-edit/api';
import type { PickedImage } from '@/features/profile-edit/pickImage';

/**
 * The calls behind the community screens (I24, I25, I26), as the Hub's contract types them
 * (INBOX-01 for the rooms, the web's routes for the rest):
 * - `GET /communities/mine`: the rooms the person hosts or has joined, newest activity first, each with
 *   its last message, its unread count and its link;
 * - `GET /communities/suggested`: the rooms the person could join (not hosted, joined, asked for or hidden),
 *   most members first (INBOX-05, closes G-451);
 * - `GET /communities/:id/room`: one room as the person sees it: counts, link, their `role` there and what one
 *   message costs them (INBOX-05);
 * - `GET /communities/message-cost`: what each kind of message costs a member, in WAWU Credits (INBOX-05, closes G-450; by kind since
 *   INBOX-22, R-62: `creditsByKind` text, photo, video, voice);
 * - `POST /uploads/presign` (folder `community/message`), a PUT of the bytes and `POST /uploads/confirm`: a photo for a message (INBOX-23);
 * - `POST /communities/:id/join`;
 * - `GET` and `POST /communities/:id/messages`: history, newest first, a page at a time, and a send;
 * - `POST /communities/:id/read`: the room's read mark;
 * - `GET /communities/links/:slug`: what a link `wawu/c/<slug>` names;
 * - `GET /credits`: the WAWU Credits count.
 *
 * The Hub's success body is `{ statusCode, message, data }`, and a paged list adds `pagination`; the
 * contract types only `data` (SHARED-CHANGES.md row 11), so each call reads the envelope itself.
 */
export type MyCommunity = components['schemas']['MyCommunity'];
export type Community = components['schemas']['CommunityResponse'];
export type RoomView = components['schemas']['CommunityRoomView'];
export type MessageCost = components['schemas']['CommunityMessageCost'];
export type CommunityRoom = components['schemas']['CommunityRoom'];
export type CommunityMessage = components['schemas']['CommunityMessage'];
export type CommunitySender = components['schemas']['CommunityMessageSender'];
export type Membership = paths['/api/hub/communities/{id}/join']['post']['responses'][200]['content']['application/json'];
export type CreditsState = paths['/api/hub/credits']['get']['responses'][200]['content']['application/json'];

type Envelope<T> = { data?: T | null; pagination?: { currentPage?: number; nextPage?: number | null; total?: number } };

/** How many rows one page asks for. The server's own default (`DEFAULT_PER_PAGE`), written down so a page is the same everywhere. */
export const PAGE_SIZE = 20;

export type Paged<T> = { items: T[]; nextPage: number | null; total: number };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

function pageOf<T>(body: unknown, what: string): Paged<T> {
  const envelope = body as Envelope<T[]> | null;
  const items = envelope?.data;
  if (!Array.isArray(items)) throw unreadable(what);
  const next = envelope?.pagination?.nextPage;
  return { items, nextPage: typeof next === 'number' ? next : null, total: envelope?.pagination?.total ?? items.length };
}

/** The person's own rooms live under `inbox`, so a live event that refreshes the inbox refreshes them too; the rooms to suggest do not change with a message, so they stay outside it. */
export const myCommunitiesKey = ['inbox', 'communities', 'mine'] as const;
export const suggestedKey = ['communities', 'suggested'] as const;
export const messageCostKey = ['communities', 'message-cost'] as const;
export const roomKey = (id: string) => ['community', id] as const;
export const messagesKey = (id: string) => ['community', id, 'messages'] as const;
export const creditsKey = ['credits'] as const;

export async function fetchMyCommunities(page: number): Promise<Paged<MyCommunity>> {
  return pageOf(
    await unwrap(api.GET('/api/hub/communities/mine', { params: { query: { page, perPage: PAGE_SIZE } } })),
    'list of your communities',
  );
}

/** The rooms the person could join, most members first. The server leaves out rooms they host, are in, asked for or cannot see. */
export async function fetchSuggested(page: number): Promise<Paged<Community>> {
  return pageOf(
    await unwrap(api.GET('/api/hub/communities/suggested', { params: { query: { page, perPage: PAGE_SIZE } } })),
    'list of suggested communities',
  );
}

/** One room as the person sees it: the room, their `role` in it, and what one message costs them there (0 for the host). */
export async function fetchRoom(id: string): Promise<RoomView> {
  const room = dataOf<RoomView>(await unwrap(api.GET('/api/hub/communities/{id}/room', { params: { path: { id } } })), 'community');
  if (typeof room.id !== 'string' || typeof room.name !== 'string') throw unreadable('community');
  return room;
}

/** What each kind of message costs a member, in WAWU Credits. A count, never naira (DECISIONS R-5). */
export type CostsByKind = MessageCost['creditsByKind'];

/** The kinds of message that cost credits, in the order they are written ("photos, video, voice"). */
export const PAID_KINDS = ['photo', 'video', 'voice'] as const;
export type PaidKind = (typeof PAID_KINDS)[number];

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * What each kind of message costs a member (R-62), as the Hub says: text and emoji, a photo, a video, a voice note. A price the Hub
 * did not send as a count is no price, so the whole answer is refused rather than guessed at (R-47).
 */
export async function fetchMessageCost(): Promise<MessageCost> {
  const cost = dataOf<MessageCost>(await unwrap(api.GET('/api/hub/communities/message-cost')), 'message price');
  const kinds = cost.creditsByKind as Partial<CostsByKind> | undefined;
  if (!isCount(cost.creditsPerMessage) || !kinds || !isCount(kinds.text) || !PAID_KINDS.every((kind) => isCount(kinds[kind]))) {
    throw unreadable('message price');
  }
  return cost;
}

/** Joins an open room at once; asks a private one (the answer says `pending`). */
export async function joinCommunity(id: string): Promise<Membership> {
  return dataOf<Membership>(await unwrap(api.POST('/api/hub/communities/{id}/join', { params: { path: { id } } })), 'membership');
}

export async function fetchMessages(id: string, page: number): Promise<Paged<CommunityMessage>> {
  return pageOf(
    await unwrap(api.GET('/api/hub/communities/{id}/messages', { params: { path: { id }, query: { page, perPage: PAGE_SIZE } } })),
    'messages',
  );
}

let keyCount = 0;

/**
 * The `Idempotency-Key` for one message the person composes: made once when they press Send, kept with that message across
 * every retry of it, and never used for another (INBOX-05 round 5, verifier defect 21). Per sender and key the Hub stores and
 * charges the message once and answers a repeat with the first one, so sending it again after an answer was lost can never post
 * it, or charge for it, twice. 8 to 128 letters, digits, hyphens and underscores, as the Hub accepts; the time, a count for this
 * run of the app and two random parts keep two messages apart even when pressed in the same millisecond.
 */
export function newMessageKey(): string {
  keyCount += 1;
  const part = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0');
  return `msg-${Date.now().toString(36)}-${keyCount.toString(36)}-${part()}${part()}`;
}

/** What one message carries: words, a photo the person already uploaded (its address), or both. */
export type MessageBody = { text?: string; imageUrl?: string };

/**
 * Sends one message under the key made for it. The answer is the stored message; its `costInCredits` is what the server
 * charged (nothing for text and emoji, R-62). A repeat of the same key answers with the first message, so the caller may send
 * it again until it hears an answer; a repeat must carry the same words and the same photo address.
 */
export async function sendMessage(id: string, body: MessageBody, key: string): Promise<CommunityMessage> {
  const message = dataOf<CommunityMessage>(
    await unwrap(
      api.POST('/api/hub/communities/{id}/messages', {
        params: { path: { id }, header: { 'Idempotency-Key': key } },
        body: { ...(body.text ? { text: body.text } : {}), ...(body.imageUrl ? { imageUrl: body.imageUrl } : {}) },
        fetch: resendsUnderKey,
      }),
    ),
    'message',
  );
  if (typeof message.id !== 'string') throw unreadable('message');
  return message;
}

/** The code of the error the photo's upload itself raises, so the screen knows its sentence is ready to show. */
export const PHOTO_UPLOAD_FAILED = 'upload_failed';

/**
 * Uploads a photo for a message through the Hub's presign and confirm path and answers the address the send takes as `imageUrl`:
 * `POST /uploads/presign` (folder `community/message`), a PUT of the bytes, then `POST /uploads/confirm`, which asks the storage
 * host whether the file landed. A file the host says is not there (`abandoned`) is an upload that failed; the phone's own copy
 * is left for the caller to delete once the message is settled, because the sending bubble still draws it.
 */
export async function uploadMessagePhoto(picked: PickedImage): Promise<string> {
  const { uploadUrl, fileUrl } = await presign({ folder: 'community/message', contentType: picked.contentType, extension: picked.extension, contentLength: picked.blob.size });
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': picked.contentType }, body: picked.blob });
  } catch {
    throw new ApiError('network', 0, 'No connection. Check your internet and try again.');
  }
  if (!response.ok) throw new ApiError('server', response.status, 'Your photo did not upload. Try again.', PHOTO_UPLOAD_FAILED);
  const settled = dataOf<{ status?: unknown }>(await unwrap(api.POST('/api/hub/uploads/confirm', { body: { key: fileUrl } })), 'upload');
  if (settled.status === 'abandoned') throw new ApiError('server', 0, 'Your photo did not upload. Try again.', PHOTO_UPLOAD_FAILED);
  return fileUrl;
}

export async function markRoomRead(id: string): Promise<void> {
  await unwrap(api.POST('/api/hub/communities/{id}/read', { params: { path: { id } } }));
}

/** What a link `wawu/c/<slug>` names. A slug nobody holds answers 404. */
export async function resolveLink(slug: string): Promise<CommunityRoom> {
  const room = dataOf<CommunityRoom>(
    await unwrap(api.GET('/api/hub/communities/links/{slug}', { params: { path: { slug } } })),
    'community link',
  );
  if (typeof room.id !== 'string') throw unreadable('community link');
  return room;
}

/** The person's WAWU Credits, as the server holds them. A count, never naira (DECISIONS R-5). */
export async function fetchCredits(): Promise<CreditsState> {
  const credits = dataOf<CreditsState>(await unwrap(api.GET('/api/hub/credits')), 'credits balance');
  if (typeof credits.creditBalance !== 'number') throw unreadable('credits balance');
  return credits;
}
