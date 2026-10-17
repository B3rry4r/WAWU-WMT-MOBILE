/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { EventView } from '../../api';
import { refundBannerBody } from '../../ticketFormat';
import { linksLine, opensOf, outcomeLines, pillOf, reasonError, refundLine, rowLine } from '../organiserFormat';

// The machine is shared and slow: wait for the Hub's answers longer than the 1 s default.
rtl.configure({ asyncUtilTimeout: 6000 });
jest.setTimeout(20000);

// A screen shown again refetches (useRefetchOnFocus); the navigator is not here, so the effect runs once on mount.
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  const React = jest.requireActual('react');
  return {
    ...actual,
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

type Call = { method: string; path: string; query: URLSearchParams; body: unknown };
type Reply = { status?: number; body?: unknown };
let handler: (call: Call) => Reply | undefined = () => undefined;
let calls: Call[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  const call = { method: request.method, path: url.pathname.replace(/^\/api\/hub/, ''), query: url.searchParams, body: text ? JSON.parse(text) : null };
  calls.push(call);
  const reply = handler(call);
  if (!reply) throw new TypeError(`no answer for ${call.method} ${call.path}`);
  return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown, pagination?: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, pagination } });
const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const event = (n: number, over: Partial<EventView> = {}): EventView =>
  ({
    id: UUID(n), name: `Event ${n}`, startsAt: '2026-10-12T09:00:00.000Z', endsAt: null, timezone: null, timeLabel: null, status: 'published',
    bannerUrl: null, cancelledAt: null, cancelReason: null, lastDecisionReason: null, ticketed: true, format: 'in_person', location: 'Lagos',
    ...over,
  }) as unknown as EventView;

const dashboard = (over: Record<string, unknown> = {}) => ({
  eventId: UUID(1), eventName: 'Event 1', ticketsSold: 64, checkedIn: 3, remaining: 56, attendees: 64, grossNaira: 480000, netNaira: 408000, buyersToRefund: 40, referrals: [], ...over,
});
const options = { types: [], categories: [], formats: [], tickets: { hostSharePercent: 85 } };

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return {
    client,
    ui: (
      <QueryClientProvider client={client}>
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{ui}</SafeAreaProvider>
      </QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  calls = [];
  handler = () => undefined;
});

// A sheet left open at the end of a test is taken down before the next screen is drawn.
afterEach(async () => {
  await rtl.cleanup();
});

describe('E17 to E25 · the words come from the Hub', () => {
  it('a pill says what each status is, and only live and sent-back events open', () => {
    expect(pillOf({ status: 'published' }).label).toBe('Live');
    expect(pillOf({ status: 'pending' }).label).toBe('In review');
    expect(pillOf({ status: 'rejected' }).label).toBe('Sent back');
    expect(pillOf({ status: 'removed' }).label).toBe('Removed');
    expect(pillOf({ status: 'cancelled' }).label).toBe('Called off');
    expect(opensOf({ status: 'published' })).toBe('dashboard');
    expect(opensOf({ status: 'rejected' })).toBe('sent-back');
    expect(opensOf({ status: 'pending' })).toBeNull();
    expect(opensOf({ status: 'removed' })).toBeNull();
  });

  it('a row says "64 sold" only for a live event the Hub sent a count for, and never "0 sold" from nothing', () => {
    const now = Date.parse('2026-10-01T00:00:00Z');
    expect(rowLine(event(1), 64, now)).toBe('Mon 12 Oct · 64 sold');
    expect(rowLine(event(1), undefined, now)).toBe('Mon 12 Oct');
    expect(rowLine(event(1, { status: 'pending' }), 5, now)).toBe('Mon 12 Oct');
    expect(rowLine(event(1, { status: 'removed' }), undefined, now)).toBe('Taken down');
  });

  it('shared links read "3 links · 22 sales" from the Hub\'s counts, one is singular, none is said so', () => {
    expect(linksLine([{ ticketsSold: 10 }, { ticketsSold: 7 }, { ticketsSold: 5 }])).toBe('3 links · 22 sales');
    expect(linksLine([{ ticketsSold: 1 }])).toBe('1 link · 1 sale');
    expect(linksLine([])).toBe('No links yet');
  });

  it('the sheet says how many buyers are refunded, and a reason needs ten characters', () => {
    expect(refundLine(64)).toBe('All 64 buyers get their money back.');
    expect(refundLine(1)).toBe('The 1 buyer gets their money back.');
    expect(refundLine(0)).toBe('Nobody has paid for a ticket, so no money moves.');
    expect(reasonError('too short')).toBeDefined();
    expect(reasonError('The venue withdrew.')).toBeUndefined();
    expect(reasonError(' '.repeat(20))).toBeDefined();
    expect(reasonError('x'.repeat(501))).toBeDefined();
  });

  it('what calling it off did is said plainly: sent, still going out, and needing a person', () => {
    expect(outcomeLines({ cancelled: true, ordersRefunded: 38, refundsNeedingAttention: 0 })).toEqual(['38 refunds sent.']);
    expect(outcomeLines({ cancelled: true, ordersRefunded: 30, refundsNeedingAttention: 2, ordersLeftToSweep: 8 })).toEqual([
      '30 refunds sent.',
      '8 refunds are still going out. They send on their own.',
      '2 refunds could not be sent automatically.',
    ]);
    expect(outcomeLines({ cancelled: true, ordersRefunded: 1, refundsNeedingAttention: 1, ordersLeftToSweep: 1 })[1]).toBe('1 refund is still going out. They send on their own.');
    expect(outcomeLines({ cancelled: true, ordersRefunded: 0, refundsNeedingAttention: 0 })).toEqual(['Nobody had paid, so no money moved.']);
  });

  it('E11 says what came back, that it is on its way, or that it could not be sent; a free order says nothing', () => {
    const back = { holdStatus: 'refunded' as const, returned: true, returnedKobo: 750000 };
    expect(refundBannerBody({ free: false, ticketCount: 1, returned: back })).toBe('₦7,500 is back in your Naira wallet.');
    expect(refundBannerBody({ free: false, ticketCount: 2, returned: { ...back, returnedKobo: 1500000 } })).toBe('₦15,000 for your 2 tickets is back in your Naira wallet.');
    expect(refundBannerBody({ free: false, ticketCount: 1, returned: { holdStatus: 'held', returned: false, returnedKobo: null } })).toBe('Your refund is on its way to your Naira wallet.');
    expect(refundBannerBody({ free: false, ticketCount: 1, returned: { holdStatus: 'released', returned: false, returnedKobo: null } })).toBe('Your refund could not be sent automatically.');
    expect(refundBannerBody({ free: true, ticketCount: 1, returned: { holdStatus: 'held', returned: false, returnedKobo: null } })).toBeNull();
  });
});

describe('E17 · My events', () => {
  const serve = () => {
    handler = (c) =>
      c.path === '/events/mine'
        ? ok([event(1), event(2, { status: 'pending' }), event(3, { status: 'rejected', lastDecisionReason: 'Add the street address.' }), event(4, { status: 'removed' })], { nextPage: null })
        : c.path === '/events/mine/sold'
          ? ok({ items: [{ eventId: UUID(1), ticketsSold: 64 }] })
          : undefined;
  };

  it('a host sees every status with the Hub\'s sales and the reviewer\'s note, and opens a live or a sent-back event', async () => {
    serve();
    const { MyEventsScreen } = require('../MyEventsScreen') as typeof import('../MyEventsScreen');
    const onOpenLive = jest.fn();
    const onOpenSentBack = jest.fn();
    const { ui, client } = wrap(
      <MyEventsScreen onBack={jest.fn()} onDiscover={jest.fn()} onHost={jest.fn()} onOpenLive={onOpenLive} onOpenSentBack={onOpenSentBack} now={() => Date.parse('2026-10-01T00:00:00Z')} />,
    );
    await rtl.render(ui);
    expect(await rtl.screen.findByText('Mon 12 Oct · 64 sold')).toBeTruthy();
    expect(rtl.screen.getByTestId(`my-event-pill-${UUID(1)}`)).toHaveTextContent('Live');
    expect(rtl.screen.getByTestId(`my-event-pill-${UUID(2)}`)).toHaveTextContent('In review');
    expect(rtl.screen.getByTestId(`my-event-pill-${UUID(3)}`)).toHaveTextContent('Sent back');
    expect(rtl.screen.getByTestId(`my-event-pill-${UUID(4)}`)).toHaveTextContent('Removed');
    expect(rtl.screen.getByTestId(`my-event-note-${UUID(3)}`)).toHaveTextContent("Reviewer's note: Add the street address.");
    // In review and removed have no screen: no row to press.
    expect(rtl.screen.queryByTestId(`my-event-open-${UUID(2)}`)).toBeNull();
    expect(rtl.screen.queryByTestId(`my-event-open-${UUID(4)}`)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId(`my-event-open-${UUID(1)}`));
    expect(onOpenLive).toHaveBeenCalledWith(UUID(1));
    await rtl.fireEvent.press(rtl.screen.getByTestId(`my-event-open-${UUID(3)}`));
    expect(onOpenSentBack).toHaveBeenCalledWith(UUID(3));
    client.clear();
  });

  it('a count the Hub could not send leaves the date alone, never "0 sold"', async () => {
    handler = (c) => (c.path === '/events/mine' ? ok([event(1)], { nextPage: null }) : { status: 500, body: { statusCode: 500, message: 'down' } });
    const { MyEventsScreen } = require('../MyEventsScreen') as typeof import('../MyEventsScreen');
    const { ui, client } = wrap(<MyEventsScreen onBack={jest.fn()} onDiscover={jest.fn()} onHost={jest.fn()} onOpenLive={jest.fn()} onOpenSentBack={jest.fn()} now={() => Date.parse('2026-10-01T00:00:00Z')} />);
    await rtl.render(ui);
    expect(await rtl.screen.findByText('Mon 12 Oct')).toBeTruthy();
    expect(rtl.screen.queryByText(/sold/)).toBeNull();
    client.clear();
  });

  it('draws the empty state with a way to host, and the error state with Try again', async () => {
    handler = (c) => (c.path === '/events/mine' ? ok([], { nextPage: null }) : ok({ items: [] }));
    const { MyEventsScreen } = require('../MyEventsScreen') as typeof import('../MyEventsScreen');
    const onHost = jest.fn();
    const first = wrap(<MyEventsScreen onBack={jest.fn()} onDiscover={jest.fn()} onHost={onHost} onOpenLive={jest.fn()} onOpenSentBack={jest.fn()} />);
    await rtl.render(first.ui);
    expect(await rtl.screen.findByTestId('my-events-empty')).toBeTruthy();
    first.client.clear();
    await rtl.cleanup();
    handler = () => ({ status: 500, body: { statusCode: 500, message: 'The Hub is down.' } });
    const second = wrap(<MyEventsScreen onBack={jest.fn()} onDiscover={jest.fn()} onHost={onHost} onOpenLive={jest.fn()} onOpenSentBack={jest.fn()} />);
    await rtl.render(second.ui);
    expect(await rtl.screen.findByTestId('my-events-error')).toBeTruthy();
    second.client.clear();
  });
});

describe('E18 and E25 · the dashboard and calling it off', () => {
  const serve = (over: { dash?: Record<string, unknown>; ev?: Partial<EventView>; cancel?: Reply } = {}) => {
    handler = (c) => {
      if (c.path === `/events/${UUID(1)}`) return ok(event(1, over.ev ?? {}));
      if (c.path === `/events/${UUID(1)}/dashboard`) return ok(dashboard(over.dash));
      if (c.path === '/events/options') return ok(options);
      if (c.path === `/events/${UUID(1)}/tickets`) return ok([{ name: 'Regular' }, { name: 'VIP' }]);
      if (c.path === `/events/${UUID(1)}/referrals`) return ok([{ id: 'l1', code: 'A', label: 'A', ticketsSold: 10 }, { id: 'l2', code: 'B', label: 'B', ticketsSold: 12 }]);
      if (c.path === `/events/${UUID(1)}/cancel`) return over.cancel ?? { status: 201, body: { statusCode: 201, message: 'Created', data: { cancelled: true, ordersRefunded: 40, refundsNeedingAttention: 0 } } };
      return undefined;
    };
  };
  const boot = async (props: Partial<import('../DashboardScreen').DashboardScreenProps> = {}) => {
    const { DashboardScreen } = require('../DashboardScreen') as typeof import('../DashboardScreen');
    const w = wrap(<DashboardScreen id={UUID(1)} onBack={jest.fn()} onDoor={jest.fn()} onTickets={jest.fn()} onLinks={jest.fn()} onCalledOff={jest.fn()} now={() => Date.parse('2026-10-01T00:00:00Z')} {...props} />);
    await rtl.render(w.ui);
    return w;
  };

  it('every figure is the Hub\'s: sold, checked in, left, what the host is owed and the share, the ticket names and the links', async () => {
    serve();
    const { client } = await boot();
    expect(await rtl.screen.findByTestId('dash-net-figure')).toHaveTextContent('₦408,000');
    expect(rtl.screen.getByText('Yours after our cut')).toBeTruthy();
    expect(rtl.screen.getByTestId('dash-sold')).toHaveTextContent(/64/);
    expect(rtl.screen.getByTestId('dash-checked-in')).toHaveTextContent(/3/);
    expect(rtl.screen.getByTestId('dash-left')).toHaveTextContent(/56/);
    expect(await rtl.screen.findByTestId('dash-net-percent')).toHaveTextContent('85%');
    expect(await rtl.screen.findByText('Regular, VIP')).toBeTruthy();
    expect(await rtl.screen.findByText('2 links · 22 sales')).toBeTruthy();
    client.clear();
  });

  it('draws a row only where its screen is built, and At the door opens the door', async () => {
    serve();
    const onDoor = jest.fn();
    const { client } = await boot({ onDoor, onTickets: undefined, onLinks: undefined, onEdit: undefined });
    await rtl.screen.findByTestId('dash-door');
    expect(rtl.screen.queryByTestId('dash-tickets')).toBeNull();
    expect(rtl.screen.queryByTestId('dash-links')).toBeNull();
    expect(rtl.screen.queryByTestId('dash-edit')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('dash-door'));
    expect(onDoor).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('with no share from the Hub there is no percent, never a typed 85', async () => {
    serve();
    const base = handler;
    handler = (c) => (c.path === '/events/options' ? { status: 500, body: { statusCode: 500, message: 'no' } } : base(c));
    const { client } = await boot();
    await rtl.screen.findByTestId('dash-net-figure');
    expect(rtl.screen.queryByTestId('dash-net-percent')).toBeNull();
    client.clear();
  });

  it('Call the event off asks why, refuses a short reason, and Keep the event changes nothing', async () => {
    serve();
    const { client } = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('dash-call-off'));
    expect(await rtl.screen.findByText('This refunds real money')).toBeTruthy();
    expect(rtl.screen.getByText('All 40 buyers get their money back.')).toBeTruthy();
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('cancel-reason'), 'too short');
    await rtl.fireEvent.press(rtl.screen.getByTestId('cancel-confirm'));
    expect(await rtl.screen.findByText('Give a reason of at least 10 characters.')).toBeTruthy();
    expect(calls.some((c) => c.path.endsWith('/cancel'))).toBe(false);
    await rtl.fireEvent.press(rtl.screen.getByTestId('cancel-keep'));
    expect(calls.some((c) => c.path.endsWith('/cancel'))).toBe(false);
    client.clear();
  });

  it('Cancel and refund everyone sends the reason once and says what happened, including refunds left to the sweep', async () => {
    serve({ cancel: { status: 201, body: { statusCode: 201, message: 'Created', data: { cancelled: true, ordersRefunded: 30, refundsNeedingAttention: 2, ordersLeftToSweep: 8 } } } });
    const onCalledOff = jest.fn();
    const { client } = await boot({ onCalledOff });
    await rtl.fireEvent.press(await rtl.screen.findByTestId('dash-call-off'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('cancel-reason'), 'The venue withdrew.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('cancel-confirm'));
    expect(await rtl.screen.findByTestId('cancel-result')).toBeTruthy();
    expect(rtl.screen.getByText('30 refunds sent.')).toBeTruthy();
    expect(rtl.screen.getByText('8 refunds are still going out. They send on their own.')).toBeTruthy();
    expect(rtl.screen.getByText('2 refunds could not be sent automatically.')).toBeTruthy();
    const sent = calls.filter((c) => c.path.endsWith('/cancel'));
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe('POST');
    expect(sent[0].body).toEqual({ reason: 'The venue withdrew.' });
    await rtl.fireEvent.press(rtl.screen.getByTestId('cancel-done'));
    expect(onCalledOff).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('a second cancel is the Hub\'s 409 and its own words show; nothing is promised', async () => {
    serve({ cancel: { status: 409, body: { statusCode: 409, message: 'This event is already cancelled.' } } });
    const { client } = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('dash-call-off'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('cancel-reason'), 'The venue withdrew.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('cancel-confirm'));
    expect(await rtl.screen.findByText('This event is already cancelled.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('cancel-result')).toBeNull();
    client.clear();
  });

  it('an event that was called off shows it, with the reason, and no way to call it off again', async () => {
    serve({ ev: { status: 'cancelled', cancelledAt: '2026-10-08T09:00:00Z', cancelReason: 'The venue withdrew.' } });
    const { client } = await boot();
    expect(await rtl.screen.findByTestId('dashboard-called-off')).toHaveTextContent(/The venue withdrew\./);
    expect(rtl.screen.queryByTestId('dash-call-off')).toBeNull();
    expect(rtl.screen.queryByTestId('dash-door')).toBeNull();
    client.clear();
  });

  it('an event that is not the person\'s shows the Hub\'s refusal with Try again', async () => {
    handler = (c) => (c.path.endsWith('/dashboard') ? { status: 403, body: { statusCode: 403, message: 'This event is not yours.' } } : c.path === `/events/${UUID(1)}` ? ok(event(1)) : ok(options));
    const { client } = await boot();
    expect(await rtl.screen.findByTestId('dashboard-error')).toBeTruthy();
    expect(rtl.screen.getByText('This event is not yours.')).toBeTruthy();
    client.clear();
  });
});

describe('Shared links', () => {
  it('lists the Hub\'s links with their sales, and makes another with the name typed', async () => {
    let made = false;
    handler = (c) => {
      if (c.method === 'POST' && c.path === `/events/${UUID(1)}/referrals`) {
        made = true;
        return { status: 201, body: { statusCode: 201, message: 'Created', data: {} } };
      }
      if (c.path === `/events/${UUID(1)}/referrals`) return ok([{ id: 'l1', code: 'ABC123', label: 'Instagram', ticketsSold: 22, revenueNaira: 1, createdAt: 'x' }, ...(made ? [{ id: 'l2', code: 'ZZZ999', label: 'Radio', ticketsSold: 0, revenueNaira: 0, createdAt: 'x' }] : [])]);
      return undefined;
    };
    const { SharedLinksScreen } = require('../SharedLinksScreen') as typeof import('../SharedLinksScreen');
    const { ui, client } = wrap(<SharedLinksScreen id={UUID(1)} onBack={jest.fn()} />);
    await rtl.render(ui);
    expect(await rtl.screen.findByText('Instagram')).toBeTruthy();
    expect(rtl.screen.getByTestId('link-sales-l1')).toHaveTextContent('22 sales');
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('links-label'), 'R');
    await rtl.fireEvent.press(rtl.screen.getByTestId('links-make'));
    expect(await rtl.screen.findByText('Name it in at least 2 characters.')).toBeTruthy();
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('links-label'), 'Radio');
    await rtl.fireEvent.press(rtl.screen.getByTestId('links-make'));
    expect(await rtl.screen.findByText('Radio')).toBeTruthy();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ label: 'Radio' });
    client.clear();
  });
});

describe('E11 · called off', () => {
  const heldTicket = {
    id: UUID(9), orderId: UUID(7), code: 'K7QX-4M2P-9WLA-3RTE', status: 'void', checkedInAt: null, tierName: 'Regular', holderName: 'Lennox Emmanuel', siblings: [],
    event: { id: 'e', name: 'Creators Summit', startsAt: '2026-10-12T09:00:00.000Z', endsAt: null, timezone: null, timeLabel: null, format: 'in_person', location: 'Lagos', venueName: null, bannerUrl: null, status: 'cancelled', cancelledAt: '2026-10-08T09:00:00Z' },
  };
  const order = (over: Record<string, unknown>) => ({ id: UUID(7), free: false, ticketCount: 1, returned: { holdStatus: 'refunded', returned: true, returnedKobo: 750000 }, ...over });
  const boot = async (orderReply: Reply) => {
    handler = (c) => (c.path === `/events/tickets/held/${UUID(9)}` ? ok(heldTicket) : c.path === `/events/orders/wallet/${UUID(7)}` ? orderReply : undefined);
    const { TicketScreen } = require('../../TicketScreen') as typeof import('../../TicketScreen');
    const w = wrap(<TicketScreen id={UUID(9)} onBack={jest.fn()} onOpenTicket={jest.fn()} />);
    await rtl.render(w.ui);
    return w;
  };

  it('a buyer of a called-off event is told the event was called off and what came back to their wallet, from the Hub', async () => {
    const { client } = await boot(ok(order({})));
    expect(await rtl.screen.findByText('This event was called off')).toBeTruthy();
    expect(rtl.screen.getByText('₦7,500 is back in your Naira wallet.')).toBeTruthy();
    expect(rtl.screen.queryByText('This ticket is not valid')).toBeNull();
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
    client.clear();
  });

  it('with no answer for the order, the plain "not valid" note stands and no amount is made up', async () => {
    const { client } = await boot({ status: 500, body: { statusCode: 500, message: 'down' } });
    expect(await rtl.screen.findByText('This ticket is not valid')).toBeTruthy();
    expect(rtl.screen.queryByText(/is back in your Naira wallet/)).toBeNull();
    client.clear();
  });
});
