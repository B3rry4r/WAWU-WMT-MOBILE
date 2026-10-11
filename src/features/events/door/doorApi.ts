import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import { ANSWER_WAIT_MS } from './doorConfig';

/**
 * The door's one call (E19 to E24): `POST /events/{id}/door/check-in` (EVENTS-05, widened by EVENTS-09 so any
 * text a camera reads gets a verdict). The host and the door staff the host added may call it; one answer
 * carries the verdict, the ticket (when there is one) and the live counts.
 *
 * The Hub's success body is `{ statusCode, message, data }`; the contract types only `data` (SHARED-CHANGES.md
 * row 11), so the call reads the envelope itself, as `../api.ts` does. A check-in changes the ticket, so it is
 * never repeated on its own: a person asks again, with the same key.
 */
export type DoorResult = components['schemas']['DoorCheckInResult'];
export type DoorTicket = NonNullable<DoorResult['ticket']>;
export type CheckedInBy = components['schemas']['CheckedInByView'];
export type DoorOutcome = DoorResult['outcome'];

/** One scan: the text and the key it carries from its first send to its last (Try again sends the same scan). */
export type DoorScan = { code: string; key: string };

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

/**
 * Asks the Hub about one scan. The scan's key goes in `Idempotency-Key`, so the same scan sent twice is answered
 * with the first verdict. A check with no answer after `waitMs` is given up on (the request is cancelled, which
 * the client reports as a lost connection); the Hub may still have made it, and Try again finds out.
 */
export async function checkInAtDoor(eventId: string, scan: DoorScan, waitMs: number = ANSWER_WAIT_MS): Promise<DoorResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), waitMs);
  try {
    const body = await unwrap(
      api.POST('/api/hub/events/{id}/door/check-in', {
        params: { path: { id: eventId }, header: { 'Idempotency-Key': scan.key } },
        body: { code: scan.code },
        signal: controller.signal,
      }),
    );
    const result = readDoorResult(body);
    if (!result) throw new ApiError('unknown', 200, "We couldn't read the answer. Scan the ticket again.");
    return result;
  } finally {
    clearTimeout(timer);
  }
}
