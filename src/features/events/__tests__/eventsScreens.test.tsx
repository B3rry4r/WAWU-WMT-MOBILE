/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
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

// The screens load here, once the fetch above is in place, and not inside a test: on a cold transform cache under load
// the first load of their module tree takes longer than one test may (20 s), and a load at the top of the file is not timed.
const { EventsScreen } = require('../EventsScreen') as typeof import('../EventsScreen');
const { EventDetailScreen } = require('../EventDetailScreen') as typeof import('../EventDetailScreen');
// React Native's components load on first use (babel-preset-expo's lazy imports), so the first render used to pay for
// transforming them too. Touching them here moves that cost to file load, and the first render of anything (the
// renderer's own start) is paid in a hook with a budget of its own, so no test times either.
void [Animated, Image, Modal, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

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
  const props = { onBack: jest.fn(), onOpenEvent: jest.fn() };
  await render(<EventsScreen {...props} />);
  return props;
}

async function bootDetail(id = 'e-1') {
  const props = { id, onBack: jest.fn() };
  await render(<EventDetailScreen {...props} />);
  return props;
}

const featuredOnly = (c: Call) => c.path === '/events' && c.query.get('featured') === 'true';

/**
 * E1 asks for the featured event, the list and the options at once, and for the prices only after the first two have
 * answered, so each lands on its own turn. The featured card is the only part that holds the featured event's name
 * once the list is known (a row of the same name is dropped when the card draws), so it is the thing to wait for.
 */
const featuredCard = () => rtl.screen.findByTestId('events-featured');

/** A Going toggle flips the button at once and is finished only when the Hub has answered: the button is busy until then. */
const goingSettled = (testID: string) =>
  rtl.waitFor(() => expect(rtl.screen.getByTestId(testID).props.accessibilityState).toMatchObject({ busy: false }));

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
    expect(rtl.within(await featuredCard()).getByText('Featured Summit')).toBeTruthy();
    // The prices come after the list and the featured event, in a call of their own.
    expect(await rtl.screen.findByText('from ₦7,500', { exact: false })).toBeTruthy();
    expect(rtl.screen.getByText('This week')).toBeTruthy();
    expect(rtl.screen.getByText('Gospel Night')).toBeTruthy();
    expect(rtl.screen.getByText('Abuja')).toBeTruthy();
    expect(await rtl.screen.findByText('From ₦5,000')).toBeTruthy();
    expect(rtl.screen.getByText('Going')).toBeTruthy();
    // Beyond the week: not under "This week" until See all.
    expect(rtl.screen.queryByText('Online Talk')).toBeNull();
    expect(rtl.screen.queryByText('Featured Summit', { exact: true })).toBeTruthy();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—|Flutterwave/);
  });

  it('draws the featured card kicker, name and place line on the canvas normal line heights (D13-E1)', async () => {
    serve();
    await bootList();
    await featuredCard();
    const lineHeightOf = (node: ReturnType<typeof rtl.screen.getByText>) => {
      const style: unknown = node.props.style;
      const flat = ([] as unknown[]).concat(style).flat(3).reduce<Record<string, unknown>>((a, x) => ({ ...a, ...((x as object) || {}) }), {});
      return flat.lineHeight;
    };
    const { canvasNormalLineHeight } = require('@/theme') as typeof import('@/theme');
    expect(lineHeightOf(rtl.screen.getByText('FEATURED'))).toBe(canvasNormalLineHeight(11));
    expect(lineHeightOf(rtl.screen.getByText('Featured Summit', { exact: true }))).toBe(canvasNormalLineHeight(20));
    const place = await rtl.screen.findByText('from ₦7,500', { exact: false });
    expect(lineHeightOf(place)).toBe(canvasNormalLineHeight(12.5));
  });

  it('draws the gap before the featured card name as 4 and before the place line as 3, as the canvas does (D13-E1b)', async () => {
    serve();
    await bootList();
    await featuredCard();
    const flatOf = (node: ReturnType<typeof rtl.screen.getByText>) =>
      ([] as unknown[]).concat(node.props.style).flat(3).reduce<Record<string, unknown>>((a, x) => ({ ...a, ...((x as object) || {}) }), {});
    expect(flatOf(rtl.screen.getByText('Featured Summit', { exact: true })).marginTop).toBe(4);
    expect(flatOf(await rtl.screen.findByText('from ₦7,500', { exact: false })).marginTop).toBe(3);
  });

  it('a user can see the rest with See all: every event, free ones marked Free, an online one marked Online', async () => {
    serve();
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-see-all'));
    expect(rtl.screen.getByText('Upcoming')).toBeTruthy();
    expect(rtl.screen.getByText('Online Talk')).toBeTruthy();
    // "Free" is drawn from the prices call, which answers after the list.
    expect(await rtl.screen.findByText('Free')).toBeTruthy();
    expect(rtl.screen.getByText('Online')).toBeTruthy();
    expect(rtl.screen.queryByTestId('events-see-all')).toBeNull();
  });

  it('a user can open an event by tapping its row, and the featured card', async () => {
    serve();
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('event-row-e-2'));
    expect(props.onOpenEvent).toHaveBeenCalledWith('e-2');
    await rtl.fireEvent.press(await featuredCard());
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
    // The button says Going at once; it is the Hub's answer that frees it for another press.
    await goingSettled('event-going-e-2');
    expect(calls.filter((c) => c.path === '/events/e-2/going').map((c) => c.method)).toEqual(['POST']);
    await rtl.fireEvent.press(rtl.screen.getByTestId('event-going-e-2'));
    expect(await rtl.screen.findByText('Going?')).toBeTruthy();
    await goingSettled('event-going-e-2');
    expect(calls.filter((c) => c.path === '/events/e-2/going').map((c) => c.method)).toEqual(['POST', 'DELETE']);
  });

  it('a Going toggle the Hub refuses goes back and says so', async () => {
    serve([summit, event({ id: 'e-2', name: 'Gospel Night', userGoing: false })]);
    const base = handler;
    handler = (c) => (c.path === '/events/e-2/going' ? { status: 500, body: { statusCode: 500, message: 'Something broke' } } : base(c));
    await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('event-going-e-2'));
    expect(await rtl.screen.findByTestId('events-going-error')).toBeTruthy();
    await goingSettled('event-going-e-2');
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
    await rtl.waitFor(() => expect(calls.filter((c) => c.path === '/events/e-2/going')).toHaveLength(1));
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
    // The kinds and the categories come from the options call, which answers on its own turn.
    for (const label of ['All', 'Conference', 'Workshop', 'Concert', 'Upcoming', 'Past', 'Every category'])
      expect(await rtl.screen.findByText(label)).toBeTruthy();
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

  it('shows each open tier with its price, and no stepper or running total while EVENTS-06 is not built (R-47)', async () => {
    serve();
    await bootDetail();
    const regRow = rtl.within(await rtl.screen.findByTestId('tier-t-reg'));
    expect(regRow.getByText('Regular')).toBeTruthy();
    expect(regRow.getByText('90 left')).toBeTruthy();
    expect(regRow.getByLabelText('7,500 naira')).toBeTruthy();
    const vipRow = rtl.within(rtl.screen.getByTestId('tier-t-vip'));
    expect(vipRow.getByText('5 left')).toBeTruthy();
    expect(vipRow.getByLabelText('12,000 naira')).toBeTruthy();
    // A picker with no Get tickets button leads nowhere: no control, no count, no total, in any tier.
    expect(rtl.screen.queryByTestId('step-plus')).toBeNull();
    expect(rtl.screen.queryByTestId('step-minus')).toBeNull();
    expect(rtl.screen.queryByLabelText(/^(More|Fewer) .* tickets$/)).toBeNull();
    expect(rtl.screen.queryByTestId('tier-t-reg-count')).toBeNull();
    expect(rtl.screen.queryByTestId('event-total')).toBeNull();
    expect(rtl.screen.queryByTestId('event-total-amount')).toBeNull();
    expect(rtl.screen.queryByText(/^(No tickets|1 ticket|\d+ tickets)$/)).toBeNull();
  });

  it('lists the tiers a person can buy first and the ended or sold-out ones after, whatever order the Hub sends', async () => {
    serve({}, [early, regular, vip]);
    await bootDetail();
    await rtl.screen.findByTestId('tier-t-reg');
    const order = rtl.screen.getAllByTestId(/^tier-t-(reg|vip|early)$/).map((n) => n.props.testID);
    expect(order).toEqual(['tier-t-reg', 'tier-t-vip', 'tier-t-early']);
  });

  it('marks a tier that ended and sold out, with the day it ended', async () => {
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
    await goingSettled('event-going');
    await rtl.fireEvent.press(rtl.screen.getByTestId('event-going'));
    expect(await rtl.screen.findByText('Going?')).toBeTruthy();
    await goingSettled('event-going');
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

  it('a free tier shows Free, with no running total', async () => {
    serve({}, [tier({ priceNaira: 0, name: 'Free entry' })]);
    await bootDetail();
    await rtl.screen.findByTestId('tier-t-reg');
    expect(rtl.within(rtl.screen.getByTestId('tier-t-reg')).getByText('Free')).toBeTruthy();
    expect(rtl.screen.queryByTestId('event-total')).toBeNull();
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

describe('The list draws before the prices answer (P1)', () => {
  const gospel = event({ id: 'e-2', name: 'Gospel Night', location: 'Abuja', venueName: null, priceFromNaira: 3000 });
  const serveWith = (prices: Reply) => {
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (c.path === '/events/from-prices') return prices;
      if (featuredOnly(c)) return page([]);
      if (c.path === '/events' && c.method === 'GET') return page([gospel]);
      return undefined;
    };
  };

  it('draws the rows while the prices call is still open, and never shows the skeleton for it', async () => {
    serveWith({ hold: true });
    await bootList();
    expect(await rtl.screen.findByText('Gospel Night')).toBeTruthy();
    expect(rtl.screen.queryByTestId('events-loading')).toBeNull();
    expect(rtl.screen.queryByText(/From ₦/i)).toBeNull();
  });

  it('does not retry a failed prices call, and the rows stay without a price line', async () => {
    serveWith({ status: 500, body: { statusCode: 500, message: 'Prices are down' } });
    await bootList();
    expect(await rtl.screen.findByText('Gospel Night')).toBeTruthy();
    // The prices are asked for once the list and the featured event are known, so the call may not have been made yet.
    await rtl.waitFor(() => expect(calls.filter((c) => c.path === '/events/from-prices')).toHaveLength(1));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(calls.filter((c) => c.path === '/events/from-prices')).toHaveLength(1);
    expect(rtl.screen.queryByTestId('events-loading')).toBeNull();
    expect(rtl.screen.queryByText(/From ₦/i)).toBeNull();
  });
});

describe('Show more asks the next page (T1)', () => {
  const far = (n: number) => event({ id: `p-${n}`, name: `Far Event ${n}`, startsAt: later, ticketed: false });
  const paged = (c: Call) => {
    if (c.path === '/events/options') return ok(options);
    if (featuredOnly(c)) return page([]);
    if (c.path === '/events' && c.method === 'GET') {
      const n = Number(c.query.get('page'));
      const rows = n === 2 ? [far(3), far(4)] : [far(1), far(2)];
      return {
        status: 200,
        body: { statusCode: 200, message: 'OK', data: rows, pagination: { currentPage: n, nextPage: n === 1 ? 2 : null, perPage: 20, total: 4 } },
      };
    }
    return undefined;
  };

  it('offers "Show more" while the Hub has a next page, asks page 2 once, appends it and then stops offering', async () => {
    handler = paged;
    await bootList();
    expect(await rtl.screen.findByText('Far Event 2')).toBeTruthy();
    expect(rtl.screen.queryByText('Far Event 3')).toBeNull();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-more'));
    expect(await rtl.screen.findByText('Far Event 4')).toBeTruthy();
    expect(rtl.screen.getByText('Far Event 1')).toBeTruthy();
    expect(rtl.screen.getByText('Far Event 3')).toBeTruthy();
    expect(rtl.screen.queryByTestId('events-more')).toBeNull();
    const asked = calls.filter((c) => c.path === '/events' && c.query.get('featured') !== 'true').map((c) => c.query.get('page'));
    expect(asked).toEqual(['1', '2']);
  });
});

describe('Dates and zones on the detail (E2)', () => {
  function serveEvent(over: Partial<EventView>) {
    handler = (c) => {
      if (c.path === '/events/e-1' && c.method === 'GET') return ok(event(over));
      if (c.path === '/events/e-1/tickets') return ok([tier()]);
      return undefined;
    };
  }

  it('adds the year only when the event is not in the current year', async () => {
    serveEvent({ startsAt: '2031-03-16T09:00:00.000Z' });
    await bootDetail();
    expect(await rtl.screen.findByText('Sun 16 Mar 2031 · 10:00 WAT')).toBeTruthy();
  });

  it('shows the Hub\'s time label, not WAT, for an event in another zone', async () => {
    serveEvent({ timezone: 'America/New_York', timeLabel: '5:00 AM EST' });
    await bootDetail();
    await rtl.screen.findByText('Creators Summit');
    expect(rtl.screen.getByText(/· 5:00 AM EST$/)).toBeTruthy();
    expect(rtl.screen.queryByText(/WAT/)).toBeNull();
  });

  it('keeps WAT for an event in Lagos', async () => {
    serveEvent({ timezone: 'Africa/Lagos', timeLabel: 'ignored' });
    await bootDetail();
    expect(await rtl.screen.findByText(/WAT$/)).toBeTruthy();
  });

  it('answers a link that is not an event id with the screen\'s own words, not the validator\'s', async () => {
    handler = (c) =>
      c.path.startsWith('/events/')
        ? { status: 400, body: { statusCode: 400, message: 'Validation failed (uuid is expected)' } }
        : undefined;
    await bootDetail('not-a-uuid');
    expect(await rtl.screen.findByTestId('event-gone')).toBeTruthy();
    expect(rtl.screen.queryByText(/uuid/i)).toBeNull();
  });
});

describe('Sold out needs every tier sold (T2)', () => {
  it('draws no sold-out bar when one tier is sold out and another is open', async () => {
    handler = (c) => {
      if (c.path === '/events/e-1' && c.method === 'GET') return ok(event());
      if (c.path === '/events/e-1/tickets')
        return ok([tier({ id: 't-gone', name: 'Early bird', soldOut: true, remaining: 0 }), tier({ id: 't-open', name: 'Regular' })]);
      return undefined;
    };
    await bootDetail();
    const open = rtl.within(await rtl.screen.findByTestId('tier-t-open'));
    expect(open.getByLabelText('7,500 naira')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('tier-t-gone')).getByText('Sold out')).toBeTruthy();
    expect(rtl.screen.queryByTestId('event-sold-bar')).toBeNull();
  });
});

describe('Every date is read in the event own zone, on every screen (D7, D8, V11, D10)', () => {
  // 14 Oct 23:00 UTC is 7:00 PM on 14 Oct in New York and already 15 Oct in Lagos.
  const nycHero = event({
    id: 'z-hero',
    name: 'New York Hero',
    featured: true,
    timezone: 'America/New_York',
    timeLabel: '7:00 PM EDT',
    startsAt: '2026-10-14T23:00:00.000Z',
  });
  // 8 Jan 03:30 UTC is 10:30 PM on 7 Jan in New York and 8 Jan in Lagos.
  const nycRow = event({
    id: 'z-row',
    name: 'New York Row',
    timezone: 'America/New_York',
    timeLabel: '10:30 PM EST',
    startsAt: '2027-01-08T03:30:00.000Z',
  });
  const lagosRow = event({ id: 'z-lagos', name: 'Lagos Row', timezone: 'Africa/Lagos', startsAt: '2026-11-09T09:00:00.000Z' });

  async function listShown() {
    const rows = [nycHero, nycRow, lagosRow];
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (c.path === '/events/from-prices') return fromPrices(rows.map((r) => [r.id, r.priceFromNaira]));
      if (featuredOnly(c)) return page([nycHero]);
      if (c.path === '/events' && c.method === 'GET') return page(rows);
      return undefined;
    };
    await bootList();
    await rtl.screen.findByText('New York Hero');
    const seeAll = rtl.screen.queryByTestId('events-see-all');
    if (seeAll) await rtl.fireEvent.press(seeAll);
    await rtl.screen.findByText('New York Row');
  }

  it("a user sees the featured card's date in the event's zone, not Lagos's (D7)", async () => {
    await listShown();
    expect(rtl.screen.getByLabelText('OCT 14')).toBeTruthy();
    expect(rtl.screen.queryByLabelText('OCT 15')).toBeNull();
  });

  it("a user sees a row's date in the event's zone, not Lagos's (V11)", async () => {
    await listShown();
    expect(rtl.screen.getByLabelText('JAN 07')).toBeTruthy();
    expect(rtl.screen.queryByLabelText('JAN 08')).toBeNull();
  });

  it('a user sees the badge day in two digits, as the design draws it ("NOV 09") (D10)', async () => {
    await listShown();
    expect(rtl.screen.getByLabelText('NOV 09')).toBeTruthy();
    expect(rtl.screen.getAllByText('09').length).toBeGreaterThan(0);
    expect(rtl.screen.queryByText('9', { exact: true })).toBeNull();
  });

  it('a user sees when a tier ended and when one opens in the event\'s zone, beside its own clock (D8)', async () => {
    handler = (c) => {
      if (c.path === '/events/e-1' && c.method === 'GET')
        return ok(event({ timezone: 'America/New_York', timeLabel: '7:00 PM EDT', startsAt: '2030-10-14T23:00:00.000Z' }));
      if (c.path === '/events/e-1/tickets')
        return ok([
          tier({ id: 't-early', name: 'Early bird', salesEndAt: '2026-10-06T23:30:00.000Z' }),
          tier({ id: 't-late', name: 'Late release', salesStartAt: '2030-10-10T23:30:00.000Z' }),
        ]);
      return undefined;
    };
    await bootDetail();
    expect(await rtl.screen.findByText('Mon 14 Oct 2030 · 7:00 PM EDT')).toBeTruthy();
    expect(rtl.screen.getByLabelText('OCT 14')).toBeTruthy();
    // The tiers are asked for once the event is known, so they land after it.
    expect(await rtl.screen.findByText('Ended 6 Oct')).toBeTruthy();
    expect(rtl.screen.getByText('Opens 10 Oct')).toBeTruthy();
    expect(rtl.screen.queryByText('Ended 7 Oct')).toBeNull();
    expect(rtl.screen.queryByText('Opens 11 Oct')).toBeNull();
  });
});

describe('Prices already drawn stay when a later prices call fails (D9)', () => {
  const hero = event({ id: 'm-hero', name: 'Hero Night', featured: true, startsAt: later });
  const far = (n: number) => event({ id: `m-${n}`, name: `Paid Event ${n}`, startsAt: later });

  it('page 1 prices arrive, page 2 prices call fails: page 1 rows and the featured card keep their prices', async () => {
    let priceCalls = 0;
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (c.path === '/events/from-prices') {
        priceCalls += 1;
        if (priceCalls > 1) return { status: 500, body: { statusCode: 500, message: 'Prices are down' } };
        return fromPrices([
          ['m-hero', 7500],
          ['m-1', 1000],
          ['m-2', 2000],
        ]);
      }
      if (featuredOnly(c)) return page([hero]);
      if (c.path === '/events' && c.method === 'GET') {
        const n = Number(c.query.get('page'));
        const rows = n === 2 ? [far(3), far(4)] : [far(1), far(2)];
        return {
          status: 200,
          body: { statusCode: 200, message: 'OK', data: rows, pagination: { currentPage: n, nextPage: n === 1 ? 2 : null, perPage: 20, total: 4 } },
        };
      }
      return undefined;
    };
    await bootList();
    expect(await rtl.screen.findByText('From ₦2,000')).toBeTruthy();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-more'));
    expect(await rtl.screen.findByText('Paid Event 4')).toBeTruthy();
    await rtl.waitFor(() => expect(priceCalls).toBe(2));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(rtl.screen.getByText('From ₦1,000')).toBeTruthy();
    expect(rtl.screen.getByText('From ₦2,000')).toBeTruthy();
    expect(rtl.screen.getByText('from ₦7,500', { exact: false })).toBeTruthy();
    // Only the rows that never got a price draw none.
    expect(rtl.screen.getAllByText(/From ₦/)).toHaveLength(2);
  });
});

describe('The prices call is never retried, whatever the client allows (T3)', () => {
  it('asks once when the prices call fails, under a client that retries every other query', async () => {
    const gospel = event({ id: 'e-2', name: 'Gospel Night', location: 'Abuja', venueName: null });
    handler = (c) => {
      if (c.path === '/events/options') return ok(options);
      if (c.path === '/events/from-prices') return { status: 500, body: { statusCode: 500, message: 'Prices are down' } };
      if (featuredOnly(c)) return page([]);
      if (c.path === '/events' && c.method === 'GET') return page([gospel]);
      return undefined;
    };
    const client = new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: 1, gcTime: Infinity } } });
    clients.push(client);
    await rtl.render(
      <QueryClientProvider client={client}>
        <SafeAreaProvider
          initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
        >
          <EventsScreen onBack={jest.fn()} onOpenEvent={jest.fn()} />
        </SafeAreaProvider>
      </QueryClientProvider>,
    );
    expect(await rtl.screen.findByText('Gospel Night')).toBeTruthy();
    // The prices are asked for once the list and the featured event are known, so the call may not have been made yet.
    await rtl.waitFor(() => expect(calls.filter((c) => c.path === '/events/from-prices')).toHaveLength(1));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(calls.filter((c) => c.path === '/events/from-prices')).toHaveLength(1);
    expect(rtl.screen.queryByText(/From ₦/i)).toBeNull();
  });
});
