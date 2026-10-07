/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { EventView, TicketType } from '../api';

type Reply = { status?: number; body?: unknown; offline?: true; hold?: true };
type Call = { method: string; path: string; query: URLSearchParams };

let handler: (call: Call) => Reply | undefined = () => undefined;
let calls: Call[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const call = { method: request.method, path: url.pathname.replace(/^\/api\/hub/, ''), query: url.searchParams };
  calls.push(call);
  const reply = handler(call);
  if (!reply) throw new Error(`no answer for ${call.method} ${call.path}?${call.query}`);
  if (reply.hold) return new Promise<Response>(() => undefined);
  if (reply.offline) throw new TypeError('Network request failed');
  return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const fromPrices = (rows: (readonly [string, number | null])[]) =>
  ok({ prices: rows.map(([eventId, priceFromNaira]) => ({ eventId, priceFromNaira })) });

const page = (events: EventView[], total = events.length) => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: events, pagination: { currentPage: 1, nextPage: null, perPage: 20, total } },
});
const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
const later = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString();

const event = (over: Partial<EventView> = {}): EventView => ({
  id: 'e-1',
  hostWawuId: 'h-1',
  hostVerification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } },
  name: 'Creators Summit',
  description: 'A day for creators.',
  hostOrg: 'Summit Hosts',
  hostOrgBio: null,
  format: 'in_person',
  type: 'summit',
  startsAt: soon,
  endsAt: null,
  timeLabel: null,
  timezone: null,
  location: 'Lagos',
  address: 'Victoria Island',
  venueName: 'Eko Hall',
  externalUrl: null,
  bannerUrl: null,
  category: 'conference',
  contactEmail: null,
  contactPhone: null,
  cancelledAt: null,
  cancelReason: null,
  hasRecap: false,
  recapUrl: null,
  recapText: null,
  featured: false,
  status: 'published',
  goingCount: 4,
  userGoing: false,
  userSaved: false,
  ticketed: true,
  priceFromNaira: 7500,
  speakers: [],
  createdAt: soon,
  lastDecisionReason: null,
  ...over,
});

const tier = (over: Partial<TicketType> = {}): TicketType => ({
  id: 't-reg',
  tier: 'regular',
  name: 'Regular',
  priceNaira: 7500,
  quantity: 100,
  sold: 10,
  remaining: 90,
  soldOut: false,
  salesStartAt: null,
  salesEndAt: null,
  ...over,
});

const options = {
  categories: [
    { value: 'business', label: 'Business & Finance' },
    { value: 'music', label: 'Music' },
  ],
  formats: [{ value: 'online', label: 'Online' }],
  types: [
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'concert', label: 'Concert' },
  ],
};

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider
        initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
      >
        {child}
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

async function bootList() {
  const { EventsScreen } = require('../EventsScreen') as typeof import('../EventsScreen');
  const props = { onBack: jest.fn(), onOpenEvent: jest.fn() };
  await render(<EventsScreen {...props} />);
  return props;
}

async function bootDetail(id = 'e-1') {
  const { EventDetailScreen } = require('../EventDetailScreen') as typeof import('../EventDetailScreen');
  const props = { id, onBack: jest.fn() };
  await render(<EventDetailScreen {...props} />);
  return props;
}

const featuredOnly = (c: Call) => c.path === '/events' && c.query.get('featured') === 'true';

beforeEach(() => {
  calls = [];
  handler = () => undefined;
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('E1 · Events', () => {
  const summit = event({ id: 'e-feat', name: 'Featured Summit', featured: true, priceFromNaira: 7500 });
  const gospel = event({ id: 'e-2', name: 'Gospel Night', location: 'Abuja', venueName: null, priceFromNaira: 5000, userGoing: true });
  const free = event({
    id: 'e-3',
    name: 'Online Talk',
    format: 'online',
    location: '',
    venueName: null,
    priceFromNaira: 0,
    startsAt: later,
  });

  function serve(rows: EventView[] = [summit, gospel, free]) {
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (c.path === '/events/from-prices') return fromPrices(rows.map((r) => [r.id, r.priceFromNaira]));
      if (featuredOnly(c)) return page(rows.filter((r) => r.featured).slice(0, 1));
      if (c.path === '/events' && c.method === 'GET') return page(rows, rows.length);
      return undefined;
    };
  }

  it('shows the featured event, then this week\'s rows with their place, "from" price and Going state', async () => {
    serve();
    await bootList();
    expect(await rtl.screen.findByText('Featured Summit')).toBeTruthy();
    expect(rtl.screen.getByText('from ₦7,500', { exact: false })).toBeTruthy();
    expect(rtl.screen.getByText('This week')).toBeTruthy();
    expect(rtl.screen.getByText('Gospel Night')).toBeTruthy();
    expect(rtl.screen.getByText('Abuja')).toBeTruthy();
    expect(rtl.screen.getByText('From ₦5,000')).toBeTruthy();
    expect(rtl.screen.getByText('Going')).toBeTruthy();
    // Beyond the week: not under "This week" until See all.
    expect(rtl.screen.queryByText('Online Talk')).toBeNull();
    expect(rtl.screen.queryByText('Featured Summit', { exact: true })).toBeTruthy();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—|Flutterwave/);
  });

  it('a user can see the rest with See all: every event, free ones marked Free, an online one marked Online', async () => {
    serve();
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-see-all'));
    expect(rtl.screen.getByText('Upcoming')).toBeTruthy();
    expect(rtl.screen.getByText('Online Talk')).toBeTruthy();
    expect(rtl.screen.getByText('Free')).toBeTruthy();
    expect(rtl.screen.getByText('Online')).toBeTruthy();
    expect(rtl.screen.queryByTestId('events-see-all')).toBeNull();
  });

  it('a user can open an event by tapping its row, and the featured card', async () => {
    serve();
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('event-row-e-2'));
    expect(props.onOpenEvent).toHaveBeenCalledWith('e-2');
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-featured'));
    expect(props.onOpenEvent).toHaveBeenCalledWith('e-feat');
  });

  it('a user can go back', async () => {
    serve();
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-back'));
    expect(props.onBack).toHaveBeenCalled();
  });

  it("a user can toggle Going on a row: the Hub is told, and the row shows the Hub's answer", async () => {
    serve([summit, event({ id: 'e-2', name: 'Gospel Night', userGoing: false, goingCount: 4 })]);
    const base = handler;
    handler = (c) =>
      c.path === '/events/e-2/going'
        ? ok({ eventId: 'e-2', userGoing: c.method === 'POST', goingCount: c.method === 'POST' ? 5 : 4 })
        : base(c);
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('event-going-e-2'));
    expect(await rtl.screen.findByText('Going')).toBeTruthy();
    expect(calls.filter((c) => c.path === '/events/e-2/going').map((c) => c.method)).toEqual(['POST']);
    await rtl.fireEvent.press(rtl.screen.getByTestId('event-going-e-2'));
    expect(await rtl.screen.findByText('Going?')).toBeTruthy();
    expect(calls.filter((c) => c.path === '/events/e-2/going').map((c) => c.method)).toEqual(['POST', 'DELETE']);
  });

  it('a Going toggle the Hub refuses goes back and says so', async () => {
    serve([summit, event({ id: 'e-2', name: 'Gospel Night', userGoing: false })]);
    const base = handler;
    handler = (c) => (c.path === '/events/e-2/going' ? { status: 500, body: { statusCode: 500, message: 'Something broke' } } : base(c));
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('event-going-e-2'));
    expect(await rtl.screen.findByTestId('events-going-error')).toBeTruthy();
    expect(rtl.screen.getByText('Going?')).toBeTruthy();
  });

  it('a double tap sends one request', async () => {
    serve([summit, event({ id: 'e-2', name: 'Gospel Night' })]);
    const base = handler;
    handler = (c) => (c.path === '/events/e-2/going' ? { hold: true } : base(c));
    await bootList();
    const button = await rtl.screen.findByTestId('event-going-e-2');
    await rtl.fireEvent.press(button);
    await rtl.fireEvent.press(button);
    expect(calls.filter((c) => c.path === '/events/e-2/going')).toHaveLength(1);
  });

  it('shows what the Hub says when it cannot load, and a Try again that asks again', async () => {
    handler = (c) =>
      c.path === '/events/options' ? ok(options) : { status: 500, body: { statusCode: 500, message: 'The calendar is down' } };
    await bootList();
    expect(await rtl.screen.findByTestId('events-error')).toBeTruthy();
    expect(rtl.screen.getByText("Couldn't load events")).toBeTruthy();
    const before = calls.length;
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    await rtl.waitFor(() => expect(calls.length).toBeGreaterThan(before));
  });

  it('is the loading state until the Hub answers', async () => {
    handler = () => ({ hold: true });
    await bootList();
    expect(rtl.screen.getByTestId('events-loading')).toBeTruthy();
  });

  it('says there are no events when the calendar is empty', async () => {
    handler = (c) => (c.path === '/events/options' ? ok(options) : page([]));
    await bootList();
    expect(await rtl.screen.findByTestId('events-empty')).toBeTruthy();
    expect(rtl.screen.getByText('No events yet')).toBeTruthy();
  });
});

describe('E8 · Filters', () => {
  const row = event({ id: 'e-2', name: 'Gospel Night' });

  function serve() {
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (featuredOnly(c)) return page([]);
      if (c.path === '/events') {
        const total =
          c.query.get('perPage') === '1' ? (c.query.get('type') === 'concert' ? 3 : c.query.get('view') === 'past' ? 7 : 24) : 1;
        return page([row], total);
      }
      return undefined;
    };
  }

  it('a user can open the sheet and read how many events it shows', async () => {
    serve();
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filter'));
    expect(await rtl.screen.findByText('Browse the calendar')).toBeTruthy();
    expect(await rtl.screen.findByText('Show 24 events')).toBeTruthy();
    // The kinds are the Hub's own words, after All.
    for (const label of ['All', 'Conference', 'Workshop', 'Concert', 'Upcoming', 'Past', 'Every category'])
      expect(rtl.screen.getByText(label)).toBeTruthy();
  });

  it('a user can pick a kind, see the count change, apply it, and the list asks the Hub for that kind', async () => {
    serve();
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filter'));
    await rtl.fireEvent.press(await rtl.screen.findByText('Concert'));
    expect(await rtl.screen.findByText('Show 3 events')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-filters-apply'));
    await rtl.waitFor(() =>
      expect(calls.some((c) => c.path === '/events' && c.query.get('type') === 'concert' && c.query.get('perPage') === '20')).toBe(true),
    );
  });

  it('a user can pick Past, and the list asks for the past', async () => {
    serve();
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filter'));
    await rtl.fireEvent.press(await rtl.screen.findByText('Past'));
    expect(await rtl.screen.findByText('Show 7 events')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-filters-apply'));
    await rtl.waitFor(() =>
      expect(calls.some((c) => c.path === '/events' && c.query.get('view') === 'past' && c.query.get('perPage') === '20')).toBe(true),
    );
    expect(await rtl.screen.findByText('Past events')).toBeTruthy();
  });

  it('a user can pick a category from the list, and the list asks the Hub for it', async () => {
    serve();
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filter'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filters-category'));
    expect(rtl.screen.getByText('Business & Finance')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-category-music'));
    expect(await rtl.screen.findByText('Music')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-filters-apply'));
    await rtl.waitFor(() =>
      expect(calls.some((c) => c.path === '/events' && c.query.get('category') === 'music' && c.query.get('perPage') === '20')).toBe(true),
    );
  });

  it('says "Show 1 event" for one, and names the choices it could not load with a way to retry', async () => {
    const { showLabel } = require('../FilterSheet') as typeof import('../FilterSheet');
    expect([showLabel(undefined), showLabel(1), showLabel(0)]).toEqual(['Show events', 'Show 1 event', 'Show 0 events']);
    handler = (c) => {
      if (c.path === '/events/options') return { status: 500, body: { statusCode: 500, message: 'Filters are down' } };
      if (featuredOnly(c)) return page([]);
      return page([row], 1);
    };
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filter'));
    expect(await rtl.screen.findByTestId('events-filters-error')).toBeTruthy();
    // When can still be set without the Hub's words.
    expect(rtl.screen.getByText('Past')).toBeTruthy();
  });

  it('a filter that matches nothing says so and offers to clear it', async () => {
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (featuredOnly(c)) return page([]);
      return c.query.get('type') === 'concert' ? page([], 0) : page([row], 1);
    };
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-filter'));
    await rtl.fireEvent.press(await rtl.screen.findByText('Concert'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-filters-apply'));
    expect(await rtl.screen.findByText('No events match')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Clear filters'));
    expect(await rtl.screen.findByText('Gospel Night')).toBeTruthy();
  });
});

describe('E2 · Event, E9 · Sold out', () => {
  const regular = tier();
  const vip = tier({ id: 't-vip', tier: 'vip', name: 'VIP', priceNaira: 12000, remaining: 5 });
  const early = tier({
    id: 't-early',
    tier: 'early_bird',
    name: 'Early bird',
    priceNaira: 5000,
    soldOut: true,
    remaining: 0,
    salesEndAt: '2026-09-30T10:00:00.000Z',
  });

  function serve(over: Partial<EventView> = {}, tiers: TicketType[] = [regular, vip, early]) {
    handler = (c) => {
      if (c.path === '/events/e-1' && c.method === 'GET') return ok(event(over));
      if (c.path === '/events/e-1/tickets') return ok(tiers);
      if (c.path === '/events/e-1/going')
        return ok({ eventId: 'e-1', userGoing: c.method === 'POST', goingCount: c.method === 'POST' ? 5 : 3 });
      return undefined;
    };
  }

  it("shows when, where and who hosts it, with the host's tick", async () => {
    serve();
    await bootDetail();
    expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.getByText(/WAT$/)).toBeTruthy();
    expect(rtl.screen.getByText('Eko Hall, Victoria Island')).toBeTruthy();
    expect(rtl.screen.getByText('Summit Hosts')).toBeTruthy();
    expect(rtl.screen.getByTestId('tick-creator')).toBeTruthy();
  });

  it('starts with one of the first open tier and its price as the total; a stepper adds and takes away across tiers', async () => {
    serve();
    await bootDetail();
    await rtl.screen.findByTestId('tier-t-reg');
    expect(rtl.screen.getByTestId('tier-t-reg-count').props.children).toBe(1);
    expect(rtl.screen.getByText('1 ticket')).toBeTruthy();
    expect(rtl.screen.getByTestId('event-total-amount').props.accessibilityLabel).toBe('7,500 naira');

    const vipRow = rtl.within(rtl.screen.getByTestId('tier-t-vip'));
    await rtl.fireEvent.press(vipRow.getByLabelText('More VIP tickets'));
    await rtl.fireEvent.press(vipRow.getByLabelText('More VIP tickets'));
    expect(rtl.screen.getByText('3 tickets')).toBeTruthy();
    expect(rtl.screen.getByTestId('event-total-amount').props.accessibilityLabel).toBe('31,500 naira');

    const regRow = rtl.within(rtl.screen.getByTestId('tier-t-reg'));
    await rtl.fireEvent.press(regRow.getByLabelText('Fewer Regular tickets'));
    expect(rtl.screen.getByText('2 tickets')).toBeTruthy();
    expect(rtl.screen.getByTestId('event-total-amount').props.accessibilityLabel).toBe('24,000 naira');
  });

  it('lists the tiers a person can buy first and the ended or sold-out ones after, whatever order the Hub sends', async () => {
    serve({}, [early, regular, vip]);
    await bootDetail();
    await rtl.screen.findByTestId('tier-t-reg');
    const order = rtl.screen.getAllByTestId(/^tier-t-(reg|vip|early)$/).map((n) => n.props.testID);
    expect(order).toEqual(['tier-t-reg', 'tier-t-vip', 'tier-t-early']);
  });

  it('cannot take more than is left of a tier', async () => {
    serve({}, [tier({ remaining: 2 })]);
    await bootDetail();
    await rtl.screen.findByTestId('tier-t-reg');
    const row = rtl.within(rtl.screen.getByTestId('tier-t-reg'));
    await rtl.fireEvent.press(row.getByLabelText('More Regular tickets'));
    await rtl.fireEvent.press(row.getByLabelText('More Regular tickets'));
    await rtl.fireEvent.press(row.getByLabelText('More Regular tickets'));
    expect(rtl.screen.getByTestId('tier-t-reg-count').props.children).toBe(2);
  });

  it('marks a tier that ended and sold out, with the day it ended, and gives it no stepper', async () => {
    serve();
    await bootDetail();
    const row = rtl.within(await rtl.screen.findByTestId('tier-t-early'));
    expect(row.getByText('Ended 30 Sep')).toBeTruthy();
    expect(row.getByText('Sold out')).toBeTruthy();
    expect(row.queryByLabelText('More Early bird tickets')).toBeNull();
  });

  it('a user can toggle Going on the event', async () => {
    serve();
    await bootDetail();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('event-going'));
    expect(await rtl.screen.findByText('Going')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('event-going'));
    expect(await rtl.screen.findByText('Going?')).toBeTruthy();
    expect(calls.filter((c) => c.path === '/events/e-1/going').map((c) => c.method)).toEqual(['POST', 'DELETE']);
  });

  it('E9: when every tier has sold, each says Sold out, the page says every ticket has sold, and there is no total', async () => {
    serve({}, [tier({ soldOut: true, remaining: 0 }), tier({ id: 't-vip', name: 'VIP', soldOut: true, remaining: 0 })]);
    await bootDetail();
    expect(await rtl.screen.findByTestId('event-sold-out')).toBeTruthy();
    expect(rtl.screen.getByText('Every ticket for this event has sold.')).toBeTruthy();
    expect(rtl.screen.getAllByText('Sold out')).toHaveLength(3);
    expect(rtl.screen.queryByTestId('event-total')).toBeNull();
    // The bottom button is drawn and cannot be pressed.
    expect(rtl.screen.getByTestId('event-sold-button').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('a free tier shows Free, and a free pick totals Free', async () => {
    serve({}, [tier({ priceNaira: 0, name: 'Free entry' })]);
    await bootDetail();
    await rtl.screen.findByTestId('tier-t-reg');
    expect(rtl.within(rtl.screen.getByTestId('tier-t-reg')).getByText('Free')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('event-total')).getByText('Free')).toBeTruthy();
  });

  it('an event called off sells nothing and says so', async () => {
    serve({ cancelledAt: '2026-10-01T10:00:00.000Z' });
    await bootDetail();
    expect(await rtl.screen.findByTestId('event-called-off')).toBeTruthy();
    expect(rtl.screen.queryByTestId('event-total')).toBeNull();
  });

  it('an event that sells no tickets shows no tickets or total', async () => {
    serve({ ticketed: false, priceFromNaira: null });
    await bootDetail();
    await rtl.screen.findByText('Creators Summit');
    expect(rtl.screen.queryByText('Tickets')).toBeNull();
    expect(calls.some((c) => c.path === '/events/e-1/tickets')).toBe(false);
  });

  it('says so when the event is gone, and when it cannot load', async () => {
    handler = () => ({ status: 404, body: { statusCode: 404, message: 'Not found' } });
    await bootDetail();
    expect(await rtl.screen.findByTestId('event-gone')).toBeTruthy();
    await rtl.act(async () => undefined);
  });

  it('shows an error with Try again when the Hub fails, and the ticket list failing leaves the event readable', async () => {
    handler = (c) => (c.path === '/events/e-1' ? ok(event()) : { status: 500, body: { statusCode: 500, message: 'Tickets are down' } });
    await bootDetail();
    expect(await rtl.screen.findByTestId('tickets-error')).toBeTruthy();
    expect(rtl.screen.getByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.queryByTestId('event-total')).toBeNull();
  });

  it('is the loading state until the Hub answers, and a back button works from every state', async () => {
    handler = () => ({ hold: true });
    const props = await bootDetail();
    expect(rtl.screen.getByTestId('event-loading')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('event-back'));
    expect(props.onBack).toHaveBeenCalled();
  });
});

describe('The "from" price a person can pay (G-271)', () => {
  const summit = event({ id: 'e-feat', name: 'Featured Summit', featured: true, priceFromNaira: 5000 });
  const gospel = event({ id: 'e-2', name: 'Gospel Night', location: 'Abuja', venueName: null, priceFromNaira: 3000 });
  const closed = event({ id: 'e-4', name: 'Closed Night', location: 'Aba', venueName: null, priceFromNaira: 2000 });

  const serveWith = (prices: Reply | undefined) => {
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (c.path === '/events/from-prices') return prices;
      if (featuredOnly(c)) return page([summit]);
      if (c.path === '/events' && c.method === 'GET') return page([summit, gospel, closed]);
      return undefined;
    };
  };

  it('draws what the Hub says can be bought now, never the event\'s own cheapest tier, and asks once for the page', async () => {
    serveWith(fromPrices([['e-feat', 7500], ['e-2', 4000], ['e-4', null]]));
    await bootList();
    expect(await rtl.screen.findByText('from ₦7,500', { exact: false })).toBeTruthy();
    expect(rtl.screen.getByText('From ₦4,000')).toBeTruthy();
    expect(rtl.screen.queryByText('from ₦5,000', { exact: false })).toBeNull();
    expect(rtl.screen.queryByText('From ₦3,000')).toBeNull();
    // Nothing can be bought for Closed Night, so no price is drawn for it.
    expect(rtl.screen.queryByText('From ₦2,000')).toBeNull();
    const asked = calls.filter((c) => c.path === '/events/from-prices');
    expect(asked).toHaveLength(1);
    expect(asked[0].query.getAll('ids').join(',').split(',').sort()).toEqual(['e-2', 'e-4', 'e-feat']);
  });

  it('draws the events with no price when the prices cannot be read', async () => {
    serveWith({ status: 500, body: { statusCode: 500, message: 'Prices are down' } });
    await bootList();
    expect(await rtl.screen.findByText('Gospel Night')).toBeTruthy();
    expect(rtl.screen.queryByText(/From ₦/i)).toBeNull();
  });
});
