/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { HeldEvent, HeldGroup, HeldStub, HeldTicket } from '../ticketsApi';

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

// The picture is drawn from exactly the text the screen gives it: record it.
jest.mock('../qr', () => {
  const actual = jest.requireActual('../qr');
  return { ...actual, qrModules: jest.fn(actual.qrModules) };
});
const mockBrightness = { can: false, boost: jest.fn(), restore: jest.fn() };
jest.mock('../brightness', () => ({
  get canBoostBrightness() {
    return mockBrightness.can;
  },
  boostBrightness: () => {
    mockBrightness.boost();
    return mockBrightness.restore;
  },
}));

const page = (groups: HeldGroup[], total = groups.length, nextPage: number | null = null, currentPage = 1) => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: groups, pagination: { currentPage, nextPage, perPage: 20, total } },
});
const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const fail = (status: number, message = 'Nope') => ({ status, body: { statusCode: status, message } });

const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const stub = (n: number, status: HeldStub['status'] = 'valid', checkedInAt: string | null = null): HeldStub => ({ id: UUID(n), status, checkedInAt });

const heldEvent = (over: Partial<HeldEvent> = {}): HeldEvent => ({
  id: 'e-1',
  name: 'Creators Summit',
  startsAt: '2026-10-12T09:00:00.000Z',
  endsAt: null,
  timezone: null,
  timeLabel: null,
  format: 'in_person',
  location: 'Lagos',
  venueName: 'Eko Convention Centre',
  bannerUrl: null,
  status: 'published',
  cancelledAt: null,
  ...over,
});

const group = (over: Partial<HeldGroup> = {}): HeldGroup => ({
  orderId: 'o-1',
  ticketTypeId: 't-1',
  tierName: 'Regular',
  quantity: 1,
  event: heldEvent(),
  tickets: [stub(1)],
  ...over,
});

const ticket = (over: Partial<HeldTicket> = {}): HeldTicket => ({
  id: UUID(1),
  orderId: 'o-1',
  code: 'K7QX-4M2P-9WLA-3RTE',
  status: 'valid',
  checkedInAt: null,
  tierName: 'Regular',
  holderName: 'Chidi Umeh',
  event: heldEvent(),
  siblings: [stub(1)],
  ...over,
});

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {child}
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

async function bootList() {
  const { MyTicketsScreen } = require('../MyTicketsScreen') as typeof import('../MyTicketsScreen');
  const props = { onBack: jest.fn(), onOpenTicket: jest.fn() };
  await render(<MyTicketsScreen {...props} />);
  return props;
}

async function bootTicket(id = UUID(1)) {
  const { TicketScreen } = require('../TicketScreen') as typeof import('../TicketScreen');
  const props = { id, onBack: jest.fn(), onOpenTicket: jest.fn() };
  await render(<TicketScreen {...props} />);
  return props;
}

const heldList = (c: Call) => c.path === '/events/tickets/held';
const noDashes = () => expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—|Flutterwave/);

let nowSpy: jest.SpyInstance;
beforeEach(() => {
  calls = [];
  handler = () => undefined;
  mockBrightness.can = false;
  mockBrightness.boost.mockClear();
  mockBrightness.restore.mockClear();
  nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-07T10:00:00Z'));
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
  nowSpy.mockRestore();
});

describe('E6 · My tickets', () => {
  const regular = group();
  const vip = group({
    orderId: 'o-2',
    ticketTypeId: 't-2',
    tierName: 'VIP',
    quantity: 2,
    event: heldEvent({ id: 'e-2', name: 'Gospel Night Live', startsAt: '2026-10-18T16:00:00.000Z' }),
    tickets: [stub(2, 'checked_in', '2026-10-18T15:00:00Z'), stub(3, 'valid')],
  });

  it('a user can see their tickets grouped per order and tier, with the event date', async () => {
    handler = (c) => (heldList(c) ? page([regular, vip]) : undefined);
    await bootList();
    expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.getByText('1 × Regular')).toBeTruthy();
    expect(rtl.screen.getByText('Gospel Night Live')).toBeTruthy();
    expect(rtl.screen.getByText('2 × VIP')).toBeTruthy();
    expect(rtl.screen.getByLabelText('OCT 12')).toBeTruthy();
    expect(rtl.screen.getByLabelText('OCT 18')).toBeTruthy();
    expect(calls[0].query.get('view')).toBe('upcoming');
    expect(calls[0].query.get('page')).toBe('1');
    noDashes();
  });

  it('a user can open a ticket: a row opens the first ticket that can still be scanned', async () => {
    handler = (c) => (heldList(c) ? page([regular, vip]) : undefined);
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('ticket-group-o-2-t-2'));
    expect(props.onOpenTicket).toHaveBeenLastCalledWith(UUID(3));
    await rtl.fireEvent.press(rtl.screen.getByTestId('ticket-group-o-1-t-1'));
    expect(props.onOpenTicket).toHaveBeenLastCalledWith(UUID(1));
    expect(props.onOpenTicket).toHaveBeenCalledTimes(2);
  });

  it('a user can switch to Past, which asks the Hub for past tickets and shows only those', async () => {
    const past = group({ orderId: 'o-9', event: heldEvent({ id: 'e-9', name: 'Old Summit', startsAt: '2026-08-01T09:00:00Z' }) });
    handler = (c) => (heldList(c) ? page(c.query.get('view') === 'past' ? [past] : [regular]) : undefined);
    await bootList();
    expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Past'));
    expect(await rtl.screen.findByText('Old Summit')).toBeTruthy();
    expect(rtl.screen.queryByText('Creators Summit')).toBeNull();
    expect(calls.filter(heldList).map((c) => c.query.get('view'))).toEqual(['upcoming', 'past']);
    await rtl.fireEvent.press(rtl.screen.getByText('Upcoming'));
    expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.queryByText('Old Summit')).toBeNull();
  });

  it('FIX-101 L-C: a called-off event\'s ticket under Past says it was called off, and still opens the ticket page (which says what came back)', async () => {
    const off = group({
      orderId: 'o-7',
      event: heldEvent({ id: 'e-7', name: 'Dusk photo walk', status: 'cancelled', cancelledAt: '2026-10-22T09:00:00Z', startsAt: '2026-10-24T16:00:00Z' }),
      tickets: [stub(7, 'void')],
    });
    const past = group({ orderId: 'o-8', event: heldEvent({ id: 'e-8', name: 'Old Summit', startsAt: '2026-08-01T09:00:00Z' }) });
    handler = (c) => (heldList(c) ? page(c.query.get('view') === 'past' ? [off, past] : []) : undefined);
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByText('Past'));
    expect(await rtl.screen.findByText('Dusk photo walk')).toBeTruthy();
    expect(rtl.screen.getByTestId('ticket-group-o-7-t-1-called-off')).toBeTruthy();
    expect(rtl.screen.getByText('Called off')).toBeTruthy();
    expect(rtl.screen.getAllByText('1 × Regular')).toHaveLength(2);
    // An event that simply ended says nothing of the kind.
    expect(rtl.screen.queryByTestId('ticket-group-o-8-t-1-called-off')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('ticket-group-o-7-t-1'));
    expect(props.onOpenTicket).toHaveBeenCalledWith(UUID(7));
    noDashes();
  });

  it('draws the event\'s own date: 03:00 UTC on the 15th is the 14th in New York', async () => {
    const ny = group({ event: heldEvent({ startsAt: '2026-10-15T03:00:00Z', timezone: 'America/New_York', timeLabel: '10:00 EDT' }) });
    handler = (c) => (heldList(c) ? page([ny]) : undefined);
    await bootList();
    expect(await rtl.screen.findByLabelText('OCT 14')).toBeTruthy();
  });

  it('a user with no tickets sees an empty state for each tab, with its own words', async () => {
    handler = (c) => (heldList(c) ? page([]) : undefined);
    await bootList();
    expect(await rtl.screen.findByText('No upcoming tickets')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Past'));
    expect(await rtl.screen.findByText('No past tickets')).toBeTruthy();
    expect(rtl.screen.queryByText('No upcoming tickets')).toBeNull();
    expect(rtl.screen.queryByTestId('my-tickets-more')).toBeNull();
  });

  it('shows a loading state while the Hub has not answered', async () => {
    handler = () => ({ hold: true });
    await bootList();
    expect(await rtl.screen.findByTestId('my-tickets-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('my-tickets-empty')).toBeNull();
    expect(rtl.screen.queryByTestId('my-tickets-error')).toBeNull();
  });

  it('a server failure shows an error with the server\'s words, and Try again loads the tickets', async () => {
    let failing = true;
    handler = (c) => (heldList(c) ? (failing ? fail(500, 'The Hub is down') : page([regular])) : undefined);
    await bootList();
    expect(await rtl.screen.findByTestId('my-tickets-error')).toBeTruthy();
    expect(rtl.screen.getByText("Couldn't load your tickets")).toBeTruthy();
    expect(rtl.screen.getByText('The Hub is down')).toBeTruthy();
    failing = false;
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.queryByTestId('my-tickets-error')).toBeNull();
  });

  it('with no connection it says so, and is not the empty state', async () => {
    handler = () => ({ offline: true });
    await bootList();
    expect(await rtl.screen.findByText("You're offline")).toBeTruthy();
    expect(rtl.screen.queryByTestId('my-tickets-empty')).toBeNull();
  });

  it('a page that cannot be read is an error, not an empty list', async () => {
    handler = (c) => (heldList(c) ? { status: 200, body: { statusCode: 200, message: 'OK', data: null } } : undefined);
    await bootList();
    expect(await rtl.screen.findByTestId('my-tickets-error')).toBeTruthy();
  });

  it('pages: Show more asks for the next page and adds to the list; the button goes when there is no next page', async () => {
    const second = group({ orderId: 'o-3', ticketTypeId: 't-3', event: heldEvent({ id: 'e-3', name: 'Third Summit' }) });
    handler = (c) => {
      if (!heldList(c)) return undefined;
      return c.query.get('page') === '2' ? page([second], 2, null, 2) : page([regular], 2, 2, 1);
    };
    await bootList();
    expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.queryByText('Third Summit')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('my-tickets-more'));
    expect(await rtl.screen.findByText('Third Summit')).toBeTruthy();
    expect(rtl.screen.getByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.queryByTestId('my-tickets-more')).toBeNull();
    expect(calls.filter(heldList).map((c) => c.query.get('page'))).toEqual(['1', '2']);
  });

  it('a tab with one page has no Show more', async () => {
    handler = (c) => (heldList(c) ? page([regular]) : undefined);
    await bootList();
    await rtl.screen.findByText('Creators Summit');
    expect(rtl.screen.queryByTestId('my-tickets-more')).toBeNull();
  });

  it('the back button goes back', async () => {
    handler = (c) => (heldList(c) ? page([regular]) : undefined);
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('my-tickets-back'));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});

describe('E7 · Ticket QR', () => {
  const serve = (t: HeldTicket) => {
    handler = (c) => (c.path === `/events/tickets/held/${t.id}` ? ok(t) : undefined);
  };
  const qrCalls = () => (require('../qr') as { qrModules: jest.Mock }).qrModules.mock.calls.map((a) => a[0]);

  it('a user can show the QR at the door: the picture is drawn from exactly the code the Hub issued', async () => {
    serve(ticket());
    (require('../qr') as { qrModules: jest.Mock }).qrModules.mockClear();
    await bootTicket();
    expect(await rtl.screen.findByTestId('ticket-qr')).toBeTruthy();
    expect(rtl.screen.getByTestId('ticket-code').props.children).toBe('K7QX-4M2P-9WLA-3RTE');
    expect(new Set(qrCalls())).toEqual(new Set(['K7QX-4M2P-9WLA-3RTE']));
    expect(rtl.screen.getByText('Creators Summit')).toBeTruthy();
    expect(rtl.screen.getByText('Mon 12 Oct · 10:00 · Eko Convention Centre')).toBeTruthy();
    expect(rtl.screen.getByText('Regular · Chidi Umeh')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-checked-in')).toBeNull();
    expect(rtl.screen.queryByTestId('ticket-void')).toBeNull();
    expect(calls).toHaveLength(1);
    noDashes();
  });

  it('leaves the holder out when the Hub has no name', async () => {
    serve(ticket({ holderName: null }));
    await bootTicket();
    expect(await rtl.screen.findByText('Regular')).toBeTruthy();
  });

  it('does not say the brightness goes up while the phone cannot do it, and does when it can', async () => {
    serve(ticket());
    await bootTicket();
    await rtl.screen.findByTestId('ticket-qr');
    expect(rtl.screen.queryByText('Brightness goes up when this opens.')).toBeNull();
    expect(mockBrightness.boost).not.toHaveBeenCalled();
  });

  it('raises the brightness while a valid ticket is open and puts it back after', async () => {
    mockBrightness.can = true;
    serve(ticket());
    await bootTicket();
    expect(await rtl.screen.findByText('Brightness goes up when this opens.')).toBeTruthy();
    expect(mockBrightness.boost).toHaveBeenCalledTimes(1);
    await rtl.act(async () => rtl.cleanup());
    expect(mockBrightness.restore).toHaveBeenCalledTimes(1);
  });

  it('a ticket already scanned shows neither the brightness note nor a raised screen', async () => {
    mockBrightness.can = true;
    serve(ticket({ status: 'checked_in', checkedInAt: '2026-10-12T08:52:00Z' }));
    await bootTicket();
    await rtl.screen.findByTestId('ticket-checked-in');
    expect(rtl.screen.queryByText('Brightness goes up when this opens.')).toBeNull();
    expect(mockBrightness.boost).not.toHaveBeenCalled();
  });

  it('two tickets in one order: it says which this is and a user can go to the next, then back', async () => {
    const siblings = [stub(1), stub(2), stub(3)];
    serve(ticket({ id: UUID(2), siblings }));
    const props = await bootTicket(UUID(2));
    expect(await rtl.screen.findByText('Ticket 2 of 3')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('ticket-next'));
    expect(props.onOpenTicket).toHaveBeenLastCalledWith(UUID(3));
    await rtl.fireEvent.press(rtl.screen.getByTestId('ticket-previous'));
    expect(props.onOpenTicket).toHaveBeenLastCalledWith(UUID(1));
  });

  it('the first ticket has only Next, the last only Previous, a lone ticket neither', async () => {
    const siblings = [stub(1), stub(2)];
    serve(ticket({ id: UUID(1), siblings }));
    await bootTicket(UUID(1));
    expect(await rtl.screen.findByText('Ticket 1 of 2')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-previous')).toBeNull();
    expect(rtl.screen.getByTestId('ticket-next')).toBeTruthy();
  });

  it('the last ticket has only Previous', async () => {
    serve(ticket({ id: UUID(2), siblings: [stub(1), stub(2)] }));
    await bootTicket(UUID(2));
    expect(await rtl.screen.findByText('Ticket 2 of 2')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-next')).toBeNull();
    expect(rtl.screen.getByTestId('ticket-previous')).toBeTruthy();
  });

  it('a lone ticket shows no pager', async () => {
    serve(ticket());
    await bootTicket();
    await rtl.screen.findByTestId('ticket-qr');
    expect(rtl.screen.queryByTestId('ticket-pager')).toBeNull();
  });

  it('an event in another zone shows its own date and the host\'s label for the time', async () => {
    serve(ticket({ event: heldEvent({ startsAt: '2026-10-15T03:00:00Z', timezone: 'America/New_York', timeLabel: '10:00 EDT', venueName: 'Hall' }) }));
    await bootTicket();
    expect(await rtl.screen.findByText('Wed 14 Oct · 10:00 EDT · Hall')).toBeTruthy();
  });

  it('an online event says Online instead of a venue', async () => {
    serve(ticket({ event: heldEvent({ format: 'online', venueName: null, location: '' }) }));
    await bootTicket();
    expect(await rtl.screen.findByText('Mon 12 Oct · 10:00 · Online')).toBeTruthy();
  });

  it('a link that is not a ticket id says the ticket is not available and never asks the Hub', async () => {
    await bootTicket('not-a-ticket');
    expect(await rtl.screen.findByText('This ticket is not available')).toBeTruthy();
    expect(calls).toHaveLength(0);
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
  });

  it('a ticket the Hub does not know, or that is someone else\'s (404), says the same', async () => {
    handler = () => fail(404, 'Ticket not found');
    await bootTicket();
    expect(await rtl.screen.findByTestId('ticket-gone')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-error')).toBeNull();
  });

  it('shows a loading state while the Hub has not answered', async () => {
    handler = () => ({ hold: true });
    await bootTicket();
    expect(await rtl.screen.findByTestId('ticket-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
  });

  it('a server failure shows an error, and Try again loads the ticket', async () => {
    let failing = true;
    handler = (c) => (failing ? fail(500, 'The Hub is down') : ok(ticket()));
    await bootTicket();
    expect(await rtl.screen.findByTestId('ticket-error')).toBeTruthy();
    expect(rtl.screen.getByText('The Hub is down')).toBeTruthy();
    failing = false;
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByTestId('ticket-qr')).toBeTruthy();
  });

  it('with no connection it says so and draws no code', async () => {
    handler = () => ({ offline: true });
    await bootTicket();
    expect(await rtl.screen.findByText("You're offline")).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
  });

  it('an answer without a code is an error, never a made-up code', async () => {
    handler = () => ok({ id: UUID(1), status: 'valid' });
    await bootTicket();
    expect(await rtl.screen.findByTestId('ticket-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
  });

  it('the back button goes back', async () => {
    serve(ticket());
    const props = await bootTicket();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('ticket-back'));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});

describe('E12 · Checked in', () => {
  const serve = (t: HeldTicket) => {
    handler = (c) => (c.path === `/events/tickets/held/${t.id}` ? ok(t) : undefined);
  };

  it('a user whose ticket was scanned sees "Already checked in" with the day and the time', async () => {
    serve(ticket({ status: 'checked_in', checkedInAt: '2026-10-12T08:52:00Z' }));
    await bootTicket();
    expect(await rtl.screen.findByText('Already checked in')).toBeTruthy();
    expect(rtl.screen.getByText('Mon 12 Oct at 09:52.')).toBeTruthy();
    // The card and the code stay, as drawn.
    expect(rtl.screen.getByTestId('ticket-qr')).toBeTruthy();
    expect(rtl.screen.getByTestId('ticket-code')).toBeTruthy();
    noDashes();
  });

  it('shows the year only when the scan was not this year', async () => {
    serve(ticket({ status: 'checked_in', checkedInAt: '2027-10-12T08:52:00Z' }));
    await bootTicket();
    expect(await rtl.screen.findByText('Tue 12 Oct 2027 at 09:52.')).toBeTruthy();
  });

  it('reads the time in the event\'s own zone, named', async () => {
    serve(ticket({ status: 'checked_in', checkedInAt: '2026-10-12T13:52:00Z', event: heldEvent({ timezone: 'America/New_York', timeLabel: '10:00 EDT' }) }));
    await bootTicket();
    expect(await rtl.screen.findByText('Mon 12 Oct at 09:52 EDT.')).toBeTruthy();
  });

  it('a ticket not yet scanned shows no checked-in note', async () => {
    serve(ticket({ status: 'valid' }));
    await bootTicket();
    await rtl.screen.findByTestId('ticket-qr');
    expect(rtl.screen.queryByText('Already checked in')).toBeNull();
  });

  it('a scanned ticket whose time is missing shows no time instead of a made-up one', async () => {
    serve(ticket({ status: 'checked_in', checkedInAt: null }));
    await bootTicket();
    await rtl.screen.findByTestId('ticket-qr');
    expect(rtl.screen.queryByText('Already checked in')).toBeNull();
  });

  it('a ticket that is not valid shows a warning and no code to scan', async () => {
    serve(ticket({ status: 'void', event: heldEvent({ status: 'cancelled', cancelledAt: '2026-10-08T09:00:00Z' }) }));
    await bootTicket();
    expect(await rtl.screen.findByText('This ticket is not valid')).toBeTruthy();
    expect(rtl.screen.getByText('The event was called off, so this ticket cannot be used.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
    expect(rtl.screen.queryByTestId('ticket-code')).toBeNull();
    expect(rtl.screen.queryByText('Already checked in')).toBeNull();
  });

  it('a void ticket of an event that was not called off says it cannot be used at the door', async () => {
    serve(ticket({ status: 'void' }));
    await bootTicket();
    expect(await rtl.screen.findByText('This ticket cannot be used at the door.')).toBeTruthy();
  });
});
