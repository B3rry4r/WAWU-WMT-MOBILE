import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { presign } from '@/features/profile-edit/api';
import type { PickedImage } from '@/features/profile-edit/pickImage';

import type { EventView } from '../api';
import type { createBody, patchBody } from './hostForm';
import { hostUnwrap } from './hostTier';

/**
 * The host wizard's calls (E13 to E16, E21, E22), typed by the Hub's contract:
 * - `GET /verification/me`: the person's ticks (a live tick still hosts; the tier is `GET /me/tier`, read by the screen; E21 opens for neither),
 * - `POST /events`: the event and its ticket types in one submit (EVENTS-02); `403 tier_required` is E21 (EVENTS-12),
 * - `PATCH /events/{id}`: a sent-back event, fixed and sent again (E22), and a live one edited from E18 (EVENTS-14). Either way the Hub puts the event back in review,
 * - `POST /uploads/presign` (folder `event/banner`, EVENTS-04): the banner image (E14).
 * The Hub's success body is `{ statusCode, message, data }`; the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads the envelope itself.
 */
export type MyVerification = components['schemas']['MyVerificationView'];
type Envelope<T> = { data?: T | null };
type CreateEventBody = components['schemas']['CreateEventDto'];
type UpdateEventBody = components['schemas']['UpdateEventDto'];

export const verificationKey = ['verification', 'me'] as const;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export async function fetchMyVerification(): Promise<MyVerification> {
  const body = (await unwrap(api.GET('/api/hub/verification/me'))) as unknown as Envelope<MyVerification>;
  const me = body?.data;
  if (!me || !me.verification || !me.pricing) throw unreadable('account');
  return me;
}

/** A live verification tick still hosts until it ends (EVENTS-12: nothing live stops working): a current creator or professional tick. */
export const mayHost = (me: MyVerification) => me.verification.creator.verified || me.verification.professional.verified;

/** A host call's answer. A missing tier arrives as a `HostTierRefusal` (hostTier.ts), so a screen can open E21 instead of a generic error. */
async function readEvent(request: ReturnType<typeof api.POST> | ReturnType<typeof api.PATCH>): Promise<EventView> {
  const body = (await hostUnwrap(request as Promise<{ data?: unknown; error?: unknown; response: Response }>)) as Envelope<EventView>;
  const event = body?.data;
  if (!event || typeof event !== 'object' || !event.id) throw unreadable('event');
  return event;
}

export function createEvent(body: ReturnType<typeof createBody>): Promise<EventView> {
  return readEvent(api.POST('/api/hub/events', { body: body as CreateEventBody }));
}

export function updateEvent(id: string, body: UpdateEventBody | ReturnType<typeof patchBody>): Promise<EventView> {
  return readEvent(api.PATCH('/api/hub/events/{id}', { params: { path: { id } }, body: body as UpdateEventBody }));
}

/** Uploads the banner to the Hub's storage and answers the address `bannerUrl` takes. */
export async function uploadBanner(picked: PickedImage): Promise<string> {
  const { uploadUrl, fileUrl } = await presign({
    folder: 'event/banner',
    contentType: picked.contentType,
    extension: picked.extension,
    contentLength: picked.blob.size,
  });
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': picked.contentType }, body: picked.blob });
  } catch {
    throw new ApiError('network', 0, 'No connection. Check your internet and try again.');
  }
  if (!response.ok) throw new ApiError('server', response.status, 'The banner did not upload. Try again.');
  return fileUrl;
}
