import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, paths } from '@/api/schema.generated';

/**
 * The calls behind a legal matter (S20 to S23, LEGAL-04 and LEGAL-06), as the Hub's contract types them:
 * - `GET /legal/requests/{id}`: the matter as it stands, which every step of the tracker is drawn from;
 * - `GET /legal/requests/{id}/booking`: the booked hour (LEGAL-03);
 * - `GET /legal/requests/{id}/contract` and `POST /legal/requests/{id}/contract/sign`: the engagement letter and the typed name that signs it;
 * - `GET /legal/requests/{id}/deliverables`: every file delivered (LEGAL-03).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each call reads the
 * envelope itself.
 */
export type LegalRequest = paths['/api/hub/legal/requests/{id}']['get']['responses'][200]['content']['application/json'];
export type Booking = components['schemas']['ConsultationBookingView'];
export type Deliverables = components['schemas']['LegalDeliverablesView'];
export type Deliverable = components['schemas']['LegalDeliverableView'];
export type Letter = paths['/api/hub/legal/requests/{id}/contract']['get']['responses'][200]['content']['application/json'];

type Envelope<T> = { data?: T | null };

export const matterKeys = {
  request: (id: string) => ['legal', 'request', id] as const,
  letter: (id: string) => ['legal', 'letter', id] as const,
  deliverables: (id: string) => ['legal', 'deliverables', id] as const,
};

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

/** A matter as the screens read it: an id, its name and a status. Anything else is refused, never drawn half empty. */
export function readRequest(value: unknown): LegalRequest {
  const r = value as Partial<LegalRequest> | null;
  if (!r || typeof r !== 'object' || !filled(r.id) || !filled(r.serviceName) || !filled(r.status) || !filled(r.path)) throw unreadable('request');
  return r as LegalRequest;
}

export async function fetchRequest(id: string): Promise<LegalRequest> {
  const body = (await unwrap(api.GET('/api/hub/legal/requests/{id}', { params: { path: { id } } }))) as unknown as Envelope<LegalRequest>;
  return readRequest(body?.data);
}

export async function fetchBooking(id: string): Promise<Booking> {
  const body = (await unwrap(api.GET('/api/hub/legal/requests/{id}/booking', { params: { path: { id } } }))) as unknown as Envelope<Booking>;
  const b = body?.data;
  if (!b || typeof b !== 'object' || !filled(b.requestId)) throw unreadable('booking');
  return b;
}

/** The engagement letter the person is about to sign, exactly as the Hub holds it. */
export async function fetchLetter(id: string): Promise<Letter> {
  const body = (await unwrap(api.GET('/api/hub/legal/requests/{id}/contract', { params: { path: { id } } }))) as unknown as Envelope<Letter>;
  const l = body?.data;
  if (!l || typeof l !== 'object' || !filled(l.contractText)) throw unreadable('letter');
  return l;
}

/** Signs with the typed full name. Answers the matter as it stands after. */
export async function signLetter(id: string, fullName: string): Promise<LegalRequest> {
  const body = (await unwrap(
    api.POST('/api/hub/legal/requests/{id}/contract/sign', { params: { path: { id } }, body: { fullName } }),
  )) as unknown as Envelope<LegalRequest>;
  return readRequest(body?.data);
}

export async function fetchDeliverables(id: string): Promise<Deliverables> {
  const body = (await unwrap(
    api.GET('/api/hub/legal/requests/{id}/deliverables', { params: { path: { id } } }),
  )) as unknown as Envelope<Deliverables>;
  const d = body?.data;
  if (!d || typeof d !== 'object' || !Array.isArray(d.items)) throw unreadable('documents');
  return d;
}
