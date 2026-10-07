import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The person's own tickets (E6, E7, E12), as the Hub's contract types them (EVENTS-03):
 * - `GET /events/tickets/held`: one row per order and tier, upcoming or past, in pages;
 * - `GET /events/tickets/held/{ticketId}`: one ticket with the code the door scans.
 * The Hub's success body is `{ statusCode, message, data }` plus `pagination` on a page; the contract
 * types only `data` (SHARED-CHANGES.md row 11), so each call reads the envelope itself, as `api.ts` does.
 */
export type HeldGroup = components['schemas']['HeldTicketGroup'];
export type HeldTicket = components['schemas']['HeldTicketView'];
export type HeldStub = components['schemas']['HeldTicketStub'];
export type HeldEvent = components['schemas']['HeldTicketEventView'];
export type HeldView = 'upcoming' | 'past';

type Envelope<T> = { data?: T | null; pagination?: { nextPage?: number | null; total?: number } };

export const HELD_PAGE_SIZE = 20;

/** Every list of held tickets, whichever tab: what a screen shown again asks for. */
export const heldRootKey = ['events', 'held', 'list'] as const;
export const heldKey = (view: HeldView) => [...heldRootKey, view] as const;
export const heldTicketKey = (id: string) => ['events', 'held', 'one', id] as const;

/** A ticket id is a uuid; anything else in a link is not a ticket and is never sent to the Hub. */
export const isTicketId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export type HeldPage = { groups: HeldGroup[]; nextPage: number | null; total: number };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

export async function fetchHeldPage(view: HeldView, page: number): Promise<HeldPage> {
  const body = (await unwrap(
    api.GET('/api/hub/events/tickets/held', { params: { query: { view, page, perPage: HELD_PAGE_SIZE } } }),
  )) as unknown as Envelope<HeldGroup[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('tickets');
  const next = body.pagination?.nextPage;
  const total = body.pagination?.total;
  return {
    groups: body.data,
    nextPage: typeof next === 'number' ? next : null,
    total: typeof total === 'number' ? total : body.data.length,
  };
}

export async function fetchHeldTicket(id: string): Promise<HeldTicket> {
  const body = (await unwrap(
    api.GET('/api/hub/events/tickets/held/{ticketId}', { params: { path: { ticketId: id } } }),
  )) as unknown as Envelope<HeldTicket>;
  const ticket = body?.data;
  if (!ticket || typeof ticket !== 'object' || !ticket.id || typeof ticket.code !== 'string') throw unreadable('ticket');
  return ticket;
}
