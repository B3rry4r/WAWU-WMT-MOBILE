import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components, operations } from '@/api/schema.generated';

/**
 * The Events calls (E1, E2, E8, E9), as the Hub's contract types them:
 * - `GET /events` (the public calendar, one page, the featured one, or only a count),
 * - `GET /events/options` (the words for each kind, category and format),
 * - `GET /events/{id}` and `GET /events/{id}/tickets` (the detail and what is on sale),
 * - `POST` and `DELETE /events/{id}/going` (the interest signal, idempotent).
 *
 * The Hub's success body is `{ statusCode, message, data }` (and `pagination` on a page);
 * the contract types only `data` (SHARED-CHANGES.md row 11), so each call reads the
 * envelope itself, as `src/features/feed/api.ts` does.
 */
export type EventView = components['schemas']['EventView'];
export type EventOptions = components['schemas']['EventOptionsView'];
export type EventGoing = components['schemas']['EventGoingView'];
export type EventKind = EventView['type'];
export type EventCategory = EventView['category'];
type TicketList = operations['EventTicketingController_ticketTypes']['responses'][200]['content']['application/json'];
export type TicketType = TicketList[number];

type Envelope<T> = {
  statusCode?: number;
  message?: string;
  data?: T | null;
  pagination?: { nextPage?: number | null; total?: number };
};

export type EventsView = 'upcoming' | 'past';

/** What E8 sets: when, which kind, which category. `null` is "All" and "Every category". */
export type EventFilters = { view: EventsView; kind: EventKind | null; category: EventCategory | null };

export const defaultFilters: EventFilters = { view: 'upcoming', kind: null, category: null };

export const filtersAreDefault = (f: EventFilters) => f.view === defaultFilters.view && f.kind === null && f.category === null;

/** How many filters are on, for the filter button's screen-reader name. */
export const activeFilterCount = (f: EventFilters) => (f.view !== defaultFilters.view ? 1 : 0) + (f.kind ? 1 : 0) + (f.category ? 1 : 0);

/** The Hub's page size for the calendar: a screen shows a handful and asks for the next page on request. */
export const EVENTS_PAGE_SIZE = 20;

export type EventsPage = { events: EventView[]; nextPage: number | null; total: number };

export const eventsKey = ['events'] as const;
export const listKey = (filters: EventFilters) => ['events', 'list', filters] as const;
export const featuredKey = (filters: EventFilters) => ['events', 'featured', filters] as const;
export const countKey = (filters: EventFilters) => ['events', 'count', filters] as const;
export const optionsKey = ['events', 'options'] as const;
export const detailKey = (id: string) => ['events', 'detail', id] as const;
export const ticketsKey = (id: string) => ['events', 'tickets', id] as const;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function queryFor(filters: EventFilters, page: number, perPage: number, featured?: boolean) {
  return {
    page,
    perPage,
    view: filters.view,
    sort: 'starting_soon' as const,
    ...(filters.kind ? { type: filters.kind } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(featured ? { featured: true } : {}),
  };
}

async function fetchPage(filters: EventFilters, page: number, perPage: number, featured?: boolean): Promise<EventsPage> {
  const body = (await unwrap(
    api.GET('/api/hub/events', { params: { query: queryFor(filters, page, perPage, featured) } }),
  )) as unknown as Envelope<EventView[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('events');
  const next = body.pagination?.nextPage;
  const total = body.pagination?.total;
  return {
    events: body.data,
    nextPage: typeof next === 'number' ? next : null,
    total: typeof total === 'number' ? total : body.data.length,
  };
}

/** One page of the calendar, nearest first. `nextPage` is null on the last page. */
export const fetchEventsPage = (filters: EventFilters, page: number) => fetchPage(filters, page, EVENTS_PAGE_SIZE);

/** The featured event (E1's picture card): the Hub's own `featured=true` rail, one row, or none. */
export async function fetchFeatured(filters: EventFilters): Promise<EventView | null> {
  const { events } = await fetchPage(filters, 1, 1, true);
  return events[0] ?? null;
}

/** How many events these filters show: the number on E8's button. One row is fetched, the Hub's total is read. */
export async function fetchCount(filters: EventFilters): Promise<number> {
  return (await fetchPage(filters, 1, 1)).total;
}

/** The label to show for each kind, category and format, beside the value to send (EVENTS-02). */
export async function fetchOptions(): Promise<EventOptions> {
  const body = (await unwrap(api.GET('/api/hub/events/options'))) as unknown as Envelope<EventOptions>;
  const options = body?.data;
  if (!options || !Array.isArray(options.types) || !Array.isArray(options.categories)) throw unreadable('filters');
  return options;
}

export async function fetchEvent(id: string): Promise<EventView> {
  const body = (await unwrap(api.GET('/api/hub/events/{id}', { params: { path: { id } } }))) as unknown as Envelope<EventView>;
  const event = body?.data;
  if (!event || typeof event !== 'object' || !event.id) throw unreadable('event');
  return event;
}

/** What is on sale for the event: each tier with what is left. Public. */
export async function fetchTickets(id: string): Promise<TicketType[]> {
  const body = (await unwrap(api.GET('/api/hub/events/{id}/tickets', { params: { path: { id } } }))) as unknown as Envelope<TicketType[]>;
  if (!body || !Array.isArray(body.data)) throw unreadable('tickets');
  return body.data;
}

/** Marks or withdraws "I'm going". The Hub answers with the person's flag and the count. */
export async function setGoing(id: string, going: boolean): Promise<EventGoing> {
  const call = going
    ? api.POST('/api/hub/events/{id}/going', { params: { path: { id } } })
    : api.DELETE('/api/hub/events/{id}/going', { params: { path: { id } } });
  const body = (await unwrap(call)) as unknown as Envelope<EventGoing>;
  const state = body?.data;
  if (!state || typeof state.userGoing !== 'boolean') throw unreadable('answer');
  return state;
}

type GoingPatch = Pick<EventView, 'userGoing' | 'goingCount'>;

/**
 * Writes the person's Going flag into every copy of the event the app holds: the
 * list's pages, the featured card and the detail. The row and the detail then
 * always agree, whichever the person toggled.
 */
export function patchGoing(client: QueryClient, id: string, patch: GoingPatch): void {
  client.setQueriesData<InfiniteData<EventsPage>>({ queryKey: ['events', 'list'] }, (old) =>
    old
      ? { ...old, pages: old.pages.map((page) => ({ ...page, events: page.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })) }
      : old,
  );
  client.setQueriesData<EventView | null>({ queryKey: ['events', 'featured'] }, (old) =>
    old && old.id === id ? { ...old, ...patch } : old,
  );
  client.setQueryData<EventView>(detailKey(id), (old) => (old ? { ...old, ...patch } : old));
}

/** The Going flag and count as the app holds them now, from whichever copy has the event. */
export function heldGoing(client: QueryClient, id: string): GoingPatch | null {
  const detail = client.getQueryData<EventView>(detailKey(id));
  if (detail) return { userGoing: detail.userGoing, goingCount: detail.goingCount };
  for (const [, data] of client.getQueriesData<InfiniteData<EventsPage>>({ queryKey: ['events', 'list'] })) {
    for (const page of data?.pages ?? []) {
      const found = page.events.find((e) => e.id === id);
      if (found) return { userGoing: found.userGoing, goingCount: found.goingCount };
    }
  }
  for (const [, data] of client.getQueriesData<EventView | null>({ queryKey: ['events', 'featured'] })) {
    if (data && data.id === id) return { userGoing: data.userGoing, goingCount: data.goingCount };
  }
  return null;
}
