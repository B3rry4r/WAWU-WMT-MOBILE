import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

import type { EventView, TicketType } from '../api';
import { hostUnwrap } from '../host/hostTier';

/**
 * What a host sees of their own events (E17, E18, E25) and what they can do to one, as the Hub's contract types it:
 * - `GET /events/mine` and `GET /events/mine/sold`: every event the person hosts, and the tickets sold on each (EVENTS-05),
 * - `GET /events/mine/decisions`: the day an admin last sent back or took down each of them (E17's "Taken down 20 Sep", FIX-110),
 * - `GET /events/{id}/dashboard`: sold, checked in, left and what the host is owed after our cut,
 * - `GET /events/{id}/call-off`: how many people a call-off refunds (E25),
 * - `GET` and `POST /events/{id}/referrals`: the shared links with their sales,
 * - `POST /events/{id}/cancel`: call it off. Every ticket is voided and every buyer is refunded (EVENTS-10).
 * - `PUT /events/{id}/tickets`: the ticket types, while nothing has sold.
 * The Hub's success body is `{ statusCode, message, data }`; the contract types only `data` (SHARED-CHANGES.md row 11),
 * so each call reads the envelope itself, as `../api.ts` does.
 */
export type Dashboard = operations['EventTicketingController_dashboard']['responses'][200]['content']['application/json'];
export type Referral = components['schemas']['EventReferralSalesView'];
export type CancelAnswer = components['schemas']['CancelEventAnswer'] & { ordersLeftToSweep?: number };
export type TicketTier = TicketType['tier'];

type Envelope<T> = { data?: T | null };

/** All under `['events']`, so a screen that changes an event refreshes them with one `invalidateQueries`. */
export const mineKey = ['events', 'mine'] as const;
export const soldKey = ['events', 'mine', 'sold'] as const;
export const decisionsKey = ['events', 'mine', 'decisions'] as const;
export const dashboardKey = (id: string) => ['events', 'dashboard', id] as const;
export const referralsKey = (id: string) => ['events', 'referrals', id] as const;
export const callOffKey = (id: string) => ['events', 'call-off', id] as const;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const MINE_PAGE_SIZE = 20;

export type MinePage = { events: EventView[]; nextPage: number | null };

/** One page of the host's own events, the Hub's order. */
export async function fetchMinePage(page: number): Promise<MinePage> {
  const body = (await unwrap(
    api.GET('/api/hub/events/mine', { params: { query: { page, perPage: MINE_PAGE_SIZE } } }),
  )) as unknown as Envelope<EventView[]> & { pagination?: { nextPage?: number | null } };
  if (!body || !Array.isArray(body.data)) throw unreadable('list of your events');
  const next = body.pagination?.nextPage;
  return { events: body.data, nextPage: typeof next === 'number' ? next : null };
}

/** Tickets sold per event id. An event the Hub lists with nothing sold reads 0; one it does not list is not in the map. */
export async function fetchSold(): Promise<Record<string, number>> {
  const body = (await unwrap(api.GET('/api/hub/events/mine/sold'))) as unknown as Envelope<{ items?: { eventId: string; ticketsSold: number }[] }>;
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw unreadable('sales');
  const sold: Record<string, number> = {};
  for (const item of items) sold[item.eventId] = item.ticketsSold;
  return sold;
}

/** When an admin last sent each event back or took it down, by event id, as the Hub's timestamp. An event the Hub does not list has no date. */
export async function fetchDecisions(): Promise<Record<string, string>> {
  const body = (await unwrap(api.GET('/api/hub/events/mine/decisions'))) as unknown as Envelope<{ items?: { eventId: string; decidedAt: string }[] }>;
  const items = body?.data?.items;
  if (!Array.isArray(items)) throw unreadable('dates');
  const decided: Record<string, string> = {};
  for (const item of items) if (typeof item.eventId === 'string' && typeof item.decidedAt === 'string') decided[item.eventId] = item.decidedAt;
  return decided;
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export async function fetchDashboard(id: string): Promise<Dashboard> {
  const body = (await unwrap(api.GET('/api/hub/events/{id}/dashboard', { params: { path: { id } } }))) as unknown as Envelope<Dashboard>;
  const d = body?.data;
  if (!d || typeof d !== 'object' || ![d.ticketsSold, d.checkedIn, d.remaining, d.netNaira].every(isCount)) throw unreadable('dashboard');
  return d;
}

/** How many people calling the event off sends money back to: distinct buyers of a priced ticket, never the ticket count. */
export async function fetchCallOff(id: string): Promise<number> {
  const body = (await unwrap(api.GET('/api/hub/events/{id}/call-off', { params: { path: { id } } }))) as unknown as Envelope<{ buyersToRefund?: number }>;
  const count = body?.data?.buyersToRefund;
  if (!isCount(count)) throw unreadable('count of buyers');
  return count;
}

export async function fetchReferrals(id: string): Promise<Referral[]> {
  const body = (await unwrap(api.GET('/api/hub/events/{id}/referrals', { params: { path: { id } } }))) as unknown as Envelope<Referral[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('shared links');
  return body.data;
}

export async function createReferral(id: string, label: string): Promise<void> {
  await unwrap(api.POST('/api/hub/events/{id}/referrals', { params: { path: { id } }, body: { label } }));
}

/** Calls the event off. The answer says how many refunds went out, how many need a person and how many wait for the sweep. */
export async function cancelEvent(id: string, reason: string): Promise<CancelAnswer> {
  const body = (await unwrap(api.POST('/api/hub/events/{id}/cancel', { params: { path: { id } }, body: { reason } }))) as unknown as Envelope<CancelAnswer>;
  const answer = body?.data;
  if (!answer || answer.cancelled !== true || !isCount(answer.ordersRefunded) || !isCount(answer.refundsNeedingAttention)) throw unreadable('answer');
  return answer;
}

export type TierInput = { tier: TicketTier; name: string; priceNaira: number; quantity: number; salesStartAt?: string; salesEndAt?: string };

/** `PUT /events/{id}/tickets` (the whole list; a type sent as it is stays as it is). A refusal for sold tickets is a 409 with the Hub's own sentence. Without a running tier the Hub answers `403 tier_required`, which arrives as a `HostTierRefusal` (E21's reason). */
export async function saveTicketTypes(id: string, types: TierInput[]): Promise<void> {
  await hostUnwrap(api.PUT('/api/hub/events/{id}/tickets', { params: { path: { id } }, body: { types } }));
}
