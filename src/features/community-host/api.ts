import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { filled } from '@/features/money-attempt/refusal';
import { presign } from '@/features/profile-edit/api';
import type { PickedImage } from '@/features/profile-edit/pickImage';

/**
 * The calls behind hosting a community (INBOX-14: I32, I33, I34), as the Hub's contract types them:
 * - `POST /communities/rooms`: creates the room (creator accounts only) and answers it with its share link `wawu/c/<slug>`. A private room
 *   needs a cover picture and carries the host's monthly price in kobo (`passPriceKobo`, R-63); the Hub checks both and the price's bounds;
 * - `POST /uploads/presign` (folder `community/image`), then a PUT of the bytes: the picture, answered as the address the room takes;
 * - `GET /communities/{id}/requests`, `POST .../approve`, `DELETE .../requests/{userWawuId}`: the join requests a room already holds (a new
 *   private room has none: it is joined by a pass, not by a request).
 */
export type Room = components['schemas']['CommunityRoom'];
export type JoinRequest = components['schemas']['CommunityJoinRequest'];
export type CreateRoomInput = import("./model").RoomInput;

type Envelope<T> = { data?: T | null; pagination?: { nextPage?: number | null; total?: number } };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const requestsKey = (id: string) => ['community', id, 'requests'] as const;
/** How many are waiting on the host, for the room's entry to I34. Under `requestsKey`, so an approve or a decline that refreshes the list refreshes this too. */
export const requestsCountKey = (id: string) => [...requestsKey(id), 'count'] as const;

/** POST /communities/rooms. A room the Hub answers without its id or link is refused, never drawn. */
export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const body = (await unwrap(api.POST('/api/hub/communities/rooms', { body: input }))) as unknown as Envelope<Room>;
  const room = body?.data;
  if (!room || typeof room !== 'object' || !filled(room.id) || !filled(room.link) || !filled(room.name)) throw unreadable('new community');
  return room;
}

/** The code of the error the picture upload itself raises, so the screen knows its sentence is ready to show. */
export const COVER_UPLOAD_FAILED = 'upload_failed';

/** Uploads the room's picture to the Hub's storage and answers the address `POST /communities/rooms` takes as `imageUrl`. */
export async function uploadCover(picked: PickedImage): Promise<string> {
  try {
    const { uploadUrl, fileUrl } = await presign({ folder: 'community/image', contentType: picked.contentType, extension: picked.extension, contentLength: picked.blob.size });
    let response: Response;
    try {
      response = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': picked.contentType }, body: picked.blob });
    } catch {
      throw new ApiError('network', 0, 'No connection. Check your internet and try again.');
    }
    if (!response.ok) throw new ApiError('server', response.status, 'Your picture did not upload. Try again.', COVER_UPLOAD_FAILED);
    return fileUrl;
  } finally {
    // The phone's own copy has done its job once the upload settles, either way.
    picked.discard?.();
  }
}

export type RequestsPage = { items: JoinRequest[]; nextPage: number | null; total: number };

/** GET /communities/{id}/requests: the people waiting on the host, a page at a time. Host only; anyone else is refused. */
export async function fetchRequests(id: string, page: number): Promise<RequestsPage> {
  const body = (await unwrap(api.GET('/api/hub/communities/{id}/requests', { params: { path: { id }, query: { page, perPage: 20 } } }))) as unknown as Envelope<JoinRequest[]>;
  const items = body?.data;
  if (!Array.isArray(items)) throw unreadable('join requests');
  const next = body?.pagination?.nextPage;
  return { items, nextPage: typeof next === 'number' ? next : null, total: body?.pagination?.total ?? items.length };
}

/** Approve: the person is let in. */
export async function approveRequest(id: string, userWawuId: string): Promise<void> {
  await unwrap(api.POST('/api/hub/communities/{id}/requests/{userWawuId}/approve', { params: { path: { id, userWawuId } } }));
}

/** Decline: the request is removed. */
export async function declineRequest(id: string, userWawuId: string): Promise<void> {
  await unwrap(api.DELETE('/api/hub/communities/{id}/requests/{userWawuId}', { params: { path: { id, userWawuId } } }));
}

/** How many people wait on the host in this room (the Hub's total of `GET /communities/{id}/requests`). Host only: anyone else is refused. */
export async function fetchRequestsCount(id: string): Promise<number> {
  const page = await fetchRequests(id, 1);
  return page.items.filter((row) => row.status === 'pending').length > 0 ? Math.max(page.total, 1) : 0;
}
