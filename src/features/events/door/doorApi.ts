import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The door's one call (E19 to E24): `POST /events/{id}/door/check-in` (EVENTS-05, widened by EVENTS-09 so any
 * text a camera reads gets a verdict). The host and the door staff the host added may call it; one answer
 * carries the verdict, the ticket (when there is one) and the live counts.
 *
 * The Hub's success body is `{ statusCode, message, data }`; the contract types only `data` (SHARED-CHANGES.md
 * row 11), so the call reads the envelope itself, as `../api.ts` does. A check-in changes the ticket, so it is
 * never repeated on its own: a person asks again.
 */
export type DoorResult = components['schemas']['DoorCheckInResult'];
export type DoorTicket = NonNullable<DoorResult['ticket']>;
export type CheckedInBy = components['schemas']['CheckedInByView'];
export type DoorOutcome = DoorResult['outcome'];

/** An event id is a uuid; anything else in a link is not an event and is never sent to the Hub. */
export const isEventId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const outcomes: readonly string[] = ['valid', 'already_used', 'invalid'] satisfies readonly DoorOutcome[];

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** The answer when it is complete: a known verdict, the counts, and a ticket exactly when the verdict names one. */
export function readDoorResult(body: unknown): DoorResult | null {
  const result = (body as { data?: DoorResult | null } | null)?.data;
  if (!result || typeof result !== 'object') return null;
  const { outcome, ticket, totals } = result;
  if (!outcomes.includes(outcome)) return null;
  if (!totals || !isCount(totals.checkedIn) || !isCount(totals.stillToArrive)) return null;
  if (outcome === 'invalid') return ticket === null ? result : null;
  if (!ticket || typeof ticket.tierName !== 'string') return null;
  if (outcome === 'already_used' && typeof ticket.checkedInAt !== 'string') return null;
  return result;
}

export async function checkInAtDoor(eventId: string, code: string): Promise<DoorResult> {
  const body = await unwrap(api.POST('/api/hub/events/{id}/door/check-in', { params: { path: { id: eventId } }, body: { code } }));
  const result = readDoorResult(body);
  if (!result) throw new ApiError('unknown', 200, "We couldn't read the answer. Scan the ticket again.");
  return result;
}
