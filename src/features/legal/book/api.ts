import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import type { Booking } from '../matter/api';

/**
 * The calls behind booking a consultation (S18, S25; LEGAL-03):
 * - `GET /legal/consultation/options`: the kinds WAWU has priced and switched on, each with its length and its price (admin sets both, R-14);
 * - `GET /legal/consultation/slots?medium=`: the calendar for a video or phone call, at that call's length;
 * - `POST /legal/requests/{id}/booking`: holds the picked hour on the person's own request, or records an in-person request. Nothing is charged.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type ConsultationOption = components['schemas']['ConsultationOptionView'];
export type ConsultationOptions = components['schemas']['ConsultationOptionsView'];
export type SlotsView = components['schemas']['ConsultationSlotsView'];
export type SlotMedium = 'zoom' | 'phone';

type Envelope<T> = { data?: T | null };

export const bookKeys = {
  options: ['legal', 'consultation', 'options'] as const,
  slots: (medium: SlotMedium) => ['legal', 'consultation', 'slots', medium] as const,
};

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export async function fetchOptions(): Promise<ConsultationOptions> {
  const body = (await unwrap(api.GET('/api/hub/legal/consultation/options'))) as unknown as Envelope<ConsultationOptions>;
  const data = body?.data;
  if (!data || !Array.isArray(data.options)) throw unreadable('consultation options');
  return data;
}

export async function fetchSlots(medium: SlotMedium): Promise<SlotsView> {
  const body = (await unwrap(
    api.GET('/api/hub/legal/consultation/slots', { params: { query: { medium } } }),
  )) as unknown as Envelope<SlotsView>;
  const data = body?.data;
  if (!data || !Array.isArray(data.days)) throw unreadable('calendar');
  return data;
}

/** Holds the picked hour (`scheduledFor` is the slot's `startsAt` exactly as the calendar gave it), or records an in-person request (no hour). */
export async function bookConsultation(requestId: string, pick: { medium: SlotMedium; scheduledFor: string } | { medium: 'physical' }): Promise<Booking> {
  const body = (await unwrap(
    api.POST('/api/hub/legal/requests/{id}/booking', { params: { path: { id: requestId } }, body: pick }),
  )) as unknown as Envelope<Booking>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || typeof data.requestId !== 'string') throw unreadable('booking');
  return data;
}
