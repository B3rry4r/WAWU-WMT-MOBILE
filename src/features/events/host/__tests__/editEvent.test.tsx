/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ActivityIndicator, Animated, BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { darkColors, lightColors } from '@/theme/tokens.generated';
import { setThemePick } from '@/theme/override';

// The plans are read per account (`plansQuery`); the account is known here without a sign-in.
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'acct-host' }));

type Reply = { status?: number; body?: unknown };
type Call = { method: string; path: string; body: unknown };

let handler: (call: Call) => Reply | undefined = () => undefined;
let calls: Call[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  const call: Call = { method: request.method, path: url.pathname.replace(/^\/api\/hub/, ''), body: text ? JSON.parse(text) : undefined };
  calls.push(call);
  const reply = handler(call);
  if (!reply) throw new Error(`no answer for ${call.method} ${call.path}`);
  return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

// Loaded with the fetch in place, where no timeout applies (the first render of anything is paid in a hook with a budget of its own).
const { EditEventScreen } = require('../EditEventScreen') as typeof import('../EditEventScreen');
const { TicketTypesScreen } = require('../TicketTypesScreen') as typeof import('../TicketTypesScreen');
void [ActivityIndicator, Animated, BackHandler, Image, Modal, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
}, 60_000);

const NOW = new Date('2027-01-01T09:00:00Z').getTime();
const SOLD_RULE = 'Tickets have already sold for "Regular". Ticket types cannot change once a ticket is sold.';

const options = {
  categories: [
    { value: 'business', label: 'Business & Finance' },
    { value: 'music', label: 'Music' },
  ],
  formats: [
    { value: 'in_person', label: 'In person' },
    { value: 'online', label: 'Online' },
    { value: 'hybrid', label: 'Hybrid' },
  ],
  types: [
    { value: 'conference', label: 'Conference' },
    { value: 'workshop', label: 'Workshop' },
  ],
  tickets: { hostSharePercent: 85, minPriceNaira: 0, maxPriceNaira: 10_000_000, minQuantity: 1, maxQuantity: 1_000_000, nameMinLength: 2, nameMaxLength: 60, maxTypes: 20 },
  fields: { nameMax: 160, descriptionMax: 5000, hostOrgMax: 160, addressMax: 300 },
};

/** A live event: 12 Jan 2027, 14:00 to 17:00 in Lagos. */
const live = (over: Record<string, unknown> = {}) => ({
  id: 'e-9',
  name: 'Creators Summit',
  description: 'Two days of talks.',
  hostOrg: 'Adeyemi & Co',
  format: 'in_person',
  type: 'conference',
  startsAt: '2027-01-12T13:00:00.000Z',
  endsAt: '2027-01-12T16:00:00.000Z',
  address: '5 Marina, Lagos',
  category: 'business',
  bannerUrl: null,
  status: 'published',
  lastDecisionReason: null,
  cancelledAt: null,
  ...over,
});

const tier = (id: string, tierName: string, name: string, priceNaira: number, quantity: number, sold = 0) => ({
  id,
  tier: tierName,
  name,
  priceNaira,
  quantity,
  sold,
  remaining: quantity - sold,
  soldOut: sold >= quantity,
  salesStartAt: null,
  salesEndAt: null,
});

const dashboard = (ticketsSold: number) => ({ eventId: 'e-9', eventName: 'Creators Summit', ticketsSold, checkedIn: 0, remaining: 120 - ticketsSold, attendees: ticketsSold, grossNaira: 0, netNaira: 0, referrals: [] });

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
  return client;
}

/** The Hub as E18's two rows meet it: the event, its options, its tiers and its sold figure. */
const serve = (tiers: ReturnType<typeof tier>[], sold: number, extra?: (c: Call) => Reply | undefined) => {
  handler = (c) => {
    const own = extra?.(c);
    if (own) return own;
    if (c.method === 'GET' && c.path === '/prices') return ok(priceList);
    if (c.method === 'GET' && c.path === '/events/options') return ok(options);
    if (c.method === 'GET' && c.path === '/events/e-9') return ok(live());
    if (c.method === 'GET' && c.path === '/events/e-9/tickets') return ok(tiers);
    if (c.method === 'GET' && c.path === '/events/e-9/dashboard') return ok(dashboard(sold));
    return undefined;
  };
};

/** The price list the Hub serves (R-101): what a ticket's picker offers. */
const priceList = {
  prices: [100, 200, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6500, 7500, 10_000, 12_000, 15_000].map((n) => ({ priceNaira: n, priceKobo: n * 100 })),
  tips: [{ priceNaira: 200, priceKobo: 20_000 }],
};
/** A host picks a list price for ticket type `i` from its strip, and turns it Paid or Free with the switch above it. */
const pick = async (i: number, naira: number) =>
  rtl.fireEvent.press(await rtl.within(await rtl.screen.findByTestId(`host-ticket-${i}-picker`)).findByTestId(`price-stop-${naira}`));
const access = (i: number, which: 'Paid' | 'Free') => rtl.fireEvent.press(rtl.within(rtl.screen.getByTestId(`host-ticket-${i}-access`)).getByLabelText(which));

const type = (id: string, text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId(id), text);
const press = (id: string) => rtl.fireEvent.press(rtl.screen.getByTestId(id));

beforeEach(() => {
  calls = [];
  handler = () => undefined;
});

afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

describe('E18 · Edit event', () => {
  async function bootEdit() {
    const props = { id: 'e-9', onBack: jest.fn(), onDone: jest.fn(), onMine: jest.fn(), onSeeTiers: jest.fn(), now: () => NOW };
    await render(<EditEventScreen {...props} />);
    await rtl.screen.findByTestId('host-name');
    return props;
  }

  it('a host can edit a live event: it is filled from the event, they are told it goes back to review, and it is sent', async () => {
    serve([], 0, (c) => (c.method === 'PATCH' && c.path === '/events/e-9' ? ok(live({ status: 'pending', name: 'Creators Summit 2027' })) : undefined));
    const props = await bootEdit();
    expect(rtl.screen.getByTestId('host-name').props.value).toBe('Creators Summit');
    expect(rtl.screen.getByTestId('host-org').props.value).toBe('Adeyemi & Co');
    // Nothing changed yet: there is nothing to save.
    await press('edit-continue');
    expect(rtl.screen.getByTestId('host-starts')).toHaveTextContent(/Tue 12 Jan, 14:00/);
    expect(rtl.screen.getByTestId('host-ends')).toHaveTextContent(/17:00/);
    expect(rtl.screen.getByTestId('host-address').props.value).toBe('5 Marina, Lagos');
    expect(rtl.screen.getByTestId('edit-save').props.accessibilityState.disabled).toBe(true);
    await press('edit-back');
    await type('host-name', 'Creators Summit 2027');
    await press('edit-continue');
    await press('edit-save');
    // The sheet says what the Hub will do, before anything is sent.
    expect(await rtl.screen.findByTestId('review-sheet-words')).toHaveTextContent('Your event goes back to review and comes off the calendar until a person approves it again.');
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
    await press('review-confirm');
    expect(await rtl.screen.findByTestId('host-submitted')).toBeTruthy();
    expect(rtl.screen.getByText('Sent for review')).toBeTruthy();
    const patch = calls.filter((c) => c.method === 'PATCH');
    expect(patch).toHaveLength(1);
    expect(patch[0].path).toBe('/events/e-9');
    expect(patch[0].body).toEqual({ name: 'Creators Summit 2027' });
    await press('host-my-events');
    expect(props.onMine).toHaveBeenCalledTimes(1);
    await press('host-done');
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('a host who keeps the sheet closed sends nothing: Keep editing goes back to the form', async () => {
    serve([], 0);
    await bootEdit();
    await type('host-name', 'Creators Summit 2027');
    await press('edit-continue');
    await press('edit-save');
    await press('review-keep');
    await rtl.waitFor(() => expect(calls.some((c) => c.method === 'PATCH')).toBe(false));
    expect(rtl.screen.getByTestId('edit-save')).toBeTruthy();
  });

  it('a host can change when it starts, and the new start and end go to the Hub in the event\'s own zone (Lagos)', async () => {
    serve([], 0, (c) => (c.method === 'PATCH' ? ok(live({ status: 'pending' })) : undefined));
    await bootEdit();
    await press('edit-continue');
    await press('host-starts');
    await press('host-starts-sheet-day-2027-01-13');
    await press('host-starts-sheet-time-15:00');
    await press('host-starts-done');
    await press('host-ends');
    await press('host-ends-sheet-time-18:00');
    await press('host-ends-done');
    await press('edit-save');
    await press('review-confirm');
    await rtl.screen.findByTestId('host-submitted');
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ startsAt: '2027-01-13T14:00:00.000Z', endsAt: '2027-01-13T17:00:00.000Z' });
  });

  it('a host can rename an event that has already started: a start left as it was is not asked to be in the future', async () => {
    serve([], 0, (c) => (c.method === 'PATCH' ? ok(live({ status: 'pending' })) : undefined));
    const props = { id: 'e-9', onBack: jest.fn(), onDone: jest.fn(), now: () => new Date('2027-01-12T15:00:00Z').getTime() };
    await render(<EditEventScreen {...props} />);
    await rtl.screen.findByTestId('host-name');
    await type('host-name', 'Creators Summit, day one');
    await press('edit-continue');
    await press('edit-save');
    await press('review-confirm');
    expect(await rtl.screen.findByTestId('host-submitted')).toBeTruthy();
    expect(rtl.screen.queryByText('Pick a time that has not passed.')).toBeNull();
  });

  it('a host who moves the start to a time that has passed is told, and nothing is sent', async () => {
    serve([], 0);
    const props = { id: 'e-9', onBack: jest.fn(), onDone: jest.fn(), now: () => new Date('2027-01-12T15:00:00Z').getTime() };
    await render(<EditEventScreen {...props} />);
    await rtl.screen.findByTestId('host-name');
    await press('edit-continue');
    await press('host-starts');
    await press('host-starts-sheet-time-10:00');
    await press('host-starts-done');
    await press('edit-save');
    expect(await rtl.screen.findByText('Pick a time that has not passed.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('review-sheet')).toBeNull();
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  describe('an event the Hub holds as several days, or with no end', () => {
    // Tue 12 Jan 2027 09:00 to Thu 14 Jan 16:00 in Lagos.
    const threeDays = (over: Record<string, unknown> = {}) => live({ startsAt: '2027-01-12T08:00:00.000Z', endsAt: '2027-01-14T15:00:00.000Z', ...over });
    const serveEvent = (event: ReturnType<typeof live>) =>
      serve([], 0, (c) => {
        if (c.method === 'GET' && c.path === '/events/e-9') return ok(event);
        return c.method === 'PATCH' ? ok(live({ status: 'pending' })) : undefined;
      });
    const sendEdit = async () => {
      await press('edit-save');
      await press('review-confirm');
      await rtl.screen.findByTestId('host-submitted');
      return calls.find((c) => c.method === 'PATCH')?.body;
    };

    it('a host can rename a three-day event: only the name is sent, so its end date is untouched', async () => {
      serveEvent(threeDays());
      await bootEdit();
      await type('host-name', 'Creators Summit 2027');
      await press('edit-continue');
      expect(rtl.screen.getByTestId('host-ends')).toHaveTextContent(/Thu 14 Jan, 16:00/);
      expect(await sendEdit()).toEqual({ name: 'Creators Summit 2027' });
    });

    it('a host who moves the start time of a three-day event keeps its end on day three', async () => {
      serveEvent(threeDays());
      await bootEdit();
      await press('edit-continue');
      await press('host-starts');
      await press('host-starts-sheet-time-10:00');
      await press('host-starts-done');
      expect(rtl.screen.getByTestId('host-ends')).toHaveTextContent(/Thu 14 Jan, 16:00/);
      expect(await sendEdit()).toEqual({ startsAt: '2027-01-12T09:00:00.000Z' });
    });

    it('a host who moves the start day of a three-day event moves its end with it, still three days', async () => {
      serveEvent(threeDays());
      await bootEdit();
      await press('edit-continue');
      await press('host-starts');
      await press('host-starts-sheet-day-2027-01-19');
      await press('host-starts-done');
      expect(rtl.screen.getByTestId('host-ends')).toHaveTextContent(/Thu 21 Jan, 16:00/);
      expect(await sendEdit()).toEqual({ startsAt: '2027-01-19T08:00:00.000Z', endsAt: '2027-01-21T15:00:00.000Z' });
    });

    it('a host can rename a three-day event that ends at 07:00, earlier in the day than it starts', async () => {
      serveEvent(threeDays({ endsAt: '2027-01-14T06:00:00.000Z' }));
      await bootEdit();
      await type('host-name', 'Creators Summit 2027');
      await press('edit-continue');
      expect(rtl.screen.getByTestId('host-ends')).toHaveTextContent(/Thu 14 Jan, 07:00/);
      expect(await sendEdit()).toEqual({ name: 'Creators Summit 2027' });
      expect(rtl.screen.queryByText('It has to end after it starts.')).toBeNull();
    });

    it('a host can rename an event with no end: none is asked for and none is made up', async () => {
      serveEvent(live({ endsAt: null }));
      await bootEdit();
      await type('host-name', 'Creators Summit 2027');
      await press('edit-continue');
      expect(rtl.screen.getByTestId('host-ends')).toHaveTextContent(/Pick a time/);
      expect(await sendEdit()).toEqual({ name: 'Creators Summit 2027' });
      expect(rtl.screen.queryByText('Pick when it ends.')).toBeNull();
    });

    it('a host who moves the start of an event with no end sends the start alone', async () => {
      serveEvent(live({ endsAt: null }));
      await bootEdit();
      await press('edit-continue');
      await press('host-starts');
      await press('host-starts-sheet-time-15:00');
      await press('host-starts-done');
      expect(await sendEdit()).toEqual({ startsAt: '2027-01-12T14:00:00.000Z' });
    });
  });

  it('a host sees the Hub\'s own message when the edit is refused, keeps what they typed, and can try again', async () => {
    serve([], 0, (c) => (c.method === 'PATCH' ? { status: 409, body: { statusCode: 409, message: 'This event has been called off.' } } : undefined));
    const props = await bootEdit();
    await type('host-name', 'Creators Summit 2027');
    await press('edit-continue');
    await press('edit-save');
    await press('review-confirm');
    expect(await rtl.screen.findByText('This event has been called off.')).toBeTruthy();
    expect(rtl.screen.getByTestId('edit-save')).toBeTruthy();
    await press('edit-back');
    expect(rtl.screen.getByTestId('host-name').props.value).toBe('Creators Summit 2027');
    expect(props.onDone).not.toHaveBeenCalled();
  });

  it('a host whose tier has ended is taken to E21 with the Hub\'s own words when the edit is refused', async () => {
    serve([], 0, (c) => {
      if (c.method === 'PATCH') {
        return {
          status: 403,
          body: { statusCode: 403, message: 'Your tier has ended.', reason: { code: 'tier_required', message: 'Your tier has ended.', tierState: 'ended', currency: 'NGN', lowestTier: { id: 'verify', name: 'Verify', priceMinor: 100_000 } } },
        };
      }
      return undefined;
    });
    await bootEdit();
    await type('host-name', 'Creators Summit 2027');
    await press('edit-continue');
    await press('edit-save');
    await press('review-confirm');
    expect(await rtl.screen.findByTestId('host-gate')).toBeTruthy();
    expect(await rtl.screen.findByText('Your tier has ended.')).toBeTruthy();
  });
});

describe('E18 · Ticket types', () => {
  async function bootTypes() {
    const props = { id: 'e-9', onBack: jest.fn(), onDone: jest.fn(), onMine: jest.fn(), onSeeTiers: jest.fn() };
    await render(<TicketTypesScreen {...props} />);
    await rtl.screen.findByTestId('host-ticket-0-name');
    return props;
  }
  const regular = () => tier('t1', 'regular', 'Regular', 5000, 100);
  const vip = () => tier('t2', 'vip', 'VIP', 12_000, 20);

  it('a host with no ticket sold can change a type\'s price and places, is told it goes back to review, and the Hub saves them', async () => {
    serve([regular(), vip()], 0, (c) => (c.method === 'PUT' && c.path === '/events/e-9/tickets' ? ok([]) : undefined));
    const props = await bootTypes();
    // The saved 5,000 is the price selected on the strip; nothing is typed.
    expect((await rtl.within(rtl.screen.getByTestId('host-ticket-0-picker')).findByTestId('price-stop-5000')).props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByTestId('host-ticket-0-quantity').props.value).toBe('100');
    expect(rtl.screen.queryByTestId('ticket-types-locked')).toBeNull();
    expect(rtl.screen.getByTestId('ticket-types-save').props.accessibilityState.disabled).toBe(true);
    await pick(0, 6500);
    await type('host-ticket-0-quantity', '80');
    await press('ticket-types-save');
    expect(await rtl.screen.findByTestId('review-sheet-words')).toHaveTextContent('Your event goes back to review and comes off the calendar until a person approves it again.');
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
    await press('review-confirm');
    expect(await rtl.screen.findByTestId('host-submitted')).toBeTruthy();
    const put = calls.filter((c) => c.method === 'PUT');
    expect(put).toHaveLength(1);
    expect(put[0].path).toBe('/events/e-9/tickets');
    expect(put[0].body).toEqual({
      types: [
        { tier: 'regular', name: 'Regular', priceNaira: 6500, quantity: 80 },
        { tier: 'vip', name: 'VIP', priceNaira: 12_000, quantity: 20 },
      ],
    });
    await press('host-done');
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('a host can add a type and remove one before any ticket sells', async () => {
    serve([regular()], 0, (c) => (c.method === 'PUT' ? ok([]) : undefined));
    await bootTypes();
    await press('host-add-ticket');
    await type('host-ticket-1-name', 'Early bird');
    await pick(1, 3000);
    await type('host-ticket-1-quantity', '30');
    await press('host-ticket-0-remove');
    await press('ticket-types-save');
    await press('review-confirm');
    await rtl.screen.findByTestId('host-submitted');
    expect(calls.find((c) => c.method === 'PUT')?.body).toEqual({ types: [{ tier: 'regular', name: 'Early bird', priceNaira: 3000, quantity: 30 }] });
  });

  it('a host who turns a type Free sends the free tier, and a free type turned Paid and given a list price becomes a paid one', async () => {
    serve([tier('t1', 'regular', 'Regular', 5000, 100), tier('t3', 'free', 'Open door', 0, 50)], 0, (c) => (c.method === 'PUT' ? ok([]) : undefined));
    await bootTypes();
    await access(0, 'Free');
    await access(1, 'Paid');
    await pick(1, 1500);
    await press('ticket-types-save');
    await press('review-confirm');
    await rtl.screen.findByTestId('host-submitted');
    expect(calls.find((c) => c.method === 'PUT')?.body).toEqual({
      types: [
        { tier: 'free', name: 'Regular', priceNaira: 0, quantity: 100 },
        { tier: 'regular', name: 'Open door', priceNaira: 1500, quantity: 50 },
      ],
    });
  });

  it('a host with a ticket sold sees every type\'s price and places locked with one line of why, and is offered nothing the Hub would refuse', async () => {
    serve([tier('t1', 'regular', 'Regular', 5000, 100, 3), vip()], 3);
    const props = await bootTypes();
    expect(rtl.screen.getByTestId('ticket-types-locked')).toHaveTextContent('A ticket has sold, so ticket types cannot change.');
    for (const field of ['name', 'price', 'quantity']) {
      expect(rtl.screen.getByTestId(`host-ticket-0-${field}`).props.editable).toBe(false);
      expect(rtl.screen.getByTestId(`host-ticket-1-${field}`).props.editable).toBe(false);
    }
    expect(rtl.screen.getByTestId('host-ticket-0-price').props.value).toBe('₦5,000');
    expect(rtl.screen.queryByTestId('host-add-ticket')).toBeNull();
    expect(rtl.screen.queryByTestId('host-ticket-0-remove')).toBeNull();
    expect(rtl.screen.queryByTestId('ticket-types-save')).toBeNull();
    expect(rtl.screen.queryByTestId('host-ticket-note')).toBeNull();
    await press('ticket-types-done');
    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('a host can read the locked values in both themes: the text is the secondary colour on the sunken surface, at least 4.5 to 1', async () => {
    const ratio = (a: string, b: string) => {
      const channel = (hex: string, at: number) => {
        const c = parseInt(hex.slice(at, at + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const lum = (hex: string) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    try {
      for (const [pick, theme] of [['dark', darkColors], ['light', lightColors]] as const) {
        setThemePick(pick);
        serve([tier('t1', 'regular', 'Regular', 5000, 100, 3)], 3);
        await bootTypes();
        for (const field of ['name', 'price', 'quantity']) {
          const style = StyleSheet.flatten(rtl.screen.getByTestId(`host-ticket-0-${field}`).props.style);
          expect(style.color).toBe(theme.textSecondary);
          expect(ratio(style.color as string, theme.surfaceSunken)).toBeGreaterThanOrEqual(4.5);
        }
        // The theme's disabled text colour is the one that was too dim.
        expect(ratio(theme.textDisabled, theme.surfaceSunken)).toBeLessThan(4.5);
        await rtl.cleanup();
      }
    } finally {
      setThemePick('system');
    }
  });

  it('a host is locked out by the event\'s sold figure too: a ticket sold on a type no longer on sale still locks the rest', async () => {
    serve([regular(), vip()], 2);
    await bootTypes();
    expect(rtl.screen.getByTestId('ticket-types-locked')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-types-save')).toBeNull();
  });

  it('a host whose save meets a sale made after the screen was read is shown the Hub\'s message, and the types lock', async () => {
    let sold = false;
    serve([regular(), vip()], 0, (c) => {
      if (c.method === 'PUT') {
        sold = true;
        return { status: 409, body: { statusCode: 409, message: SOLD_RULE } };
      }
      if (sold && c.method === 'GET' && c.path === '/events/e-9/tickets') return ok([tier('t1', 'regular', 'Regular', 5000, 100, 1), vip()]);
      if (sold && c.method === 'GET' && c.path === '/events/e-9/dashboard') return ok(dashboard(1));
      return undefined;
    });
    const props = await bootTypes();
    await pick(0, 6500);
    await press('ticket-types-save');
    await press('review-confirm');
    expect(await rtl.screen.findByText(SOLD_RULE)).toBeTruthy();
    expect(props.onDone).not.toHaveBeenCalled();
    // What the Hub holds is shown, locked: the typed price is not.
    expect(await rtl.screen.findByTestId('ticket-types-locked')).toBeTruthy();
    expect(rtl.screen.getByTestId('host-ticket-0-price').props.value).toBe('₦5,000');
    expect(rtl.screen.queryByTestId('ticket-types-save')).toBeNull();
    expect(rtl.screen.queryByTestId('host-submitted')).toBeNull();
  });

  it('Save stays off until the price list has loaded, so nothing is judged against an empty list', async () => {
    serve([regular()], 0, (c) => (c.method === 'GET' && c.path === '/prices' ? { status: 500, body: { statusCode: 500, message: 'Try later' } } : undefined));
    await bootTypes();
    await type('host-ticket-0-quantity', '90');
    expect(rtl.screen.getByTestId('ticket-types-save').props.accessibilityState.disabled).toBe(true);
    await press('ticket-types-save');
    expect(rtl.screen.queryByTestId('review-sheet')).toBeNull();
  });

  it('never sends a price off the list: a saved type priced 1,200 shows the nearest list price, says to pick one, and Save is refused until one is picked', async () => {
    serve([tier('t1', 'regular', 'Regular', 1200, 100)], 0, (c) => (c.method === 'PUT' ? ok([]) : undefined));
    await bootTypes();
    expect((await rtl.within(rtl.screen.getByTestId('host-ticket-0-picker')).findByTestId('price-stop-1000')).props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByTestId('host-ticket-0-picker-off-list')).toBeTruthy();
    await type('host-ticket-0-quantity', '90');
    await press('ticket-types-save');
    expect((await rtl.screen.findAllByText('Pick a price from the list.')).length).toBeGreaterThan(0);
    expect(rtl.screen.queryByTestId('review-sheet')).toBeNull();
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
    // Picking a list price sends it.
    await pick(0, 1000);
    await press('ticket-types-save');
    await press('review-confirm');
    await rtl.screen.findByTestId('host-submitted');
    expect(calls.find((c) => c.method === 'PUT')?.body).toEqual({ types: [{ tier: 'regular', name: 'Regular', priceNaira: 1000, quantity: 90 }] });
  });

  it('a host\'s save refused as 400 price_not_on_list reads the list again and shows the Hub\'s sentence', async () => {
    const sentence = 'That price is not on the price list. The nearest are ₦5,000 and ₦6,500.';
    serve([regular()], 0, (c) =>
      c.method === 'PUT' ? { status: 400, body: { statusCode: 400, message: sentence, reason: { code: 'price_not_on_list', message: sentence, nearestLowerNaira: 5000, nearestHigherNaira: 6500 } } } : undefined,
    );
    await bootTypes();
    await pick(0, 6500);
    await type('host-ticket-0-quantity', '90');
    await press('ticket-types-save');
    await press('review-confirm');
    expect(await rtl.screen.findByText(sentence)).toBeTruthy();
    await rtl.waitFor(() => expect(calls.filter((c) => c.method === 'GET' && c.path === '/prices').length).toBeGreaterThanOrEqual(2));
  });

  it('a host whose tier has ended is taken to E21 with the Hub\'s own words when the save is refused', async () => {
    serve([regular()], 0, (c) =>
      c.method === 'PUT'
        ? { status: 403, body: { statusCode: 403, message: 'Your tier has ended.', reason: { code: 'tier_required', message: 'Your tier has ended.', tierState: 'ended', currency: 'NGN', lowestTier: { id: 'verify', name: 'Verify', priceMinor: 100_000 } } } }
        : undefined,
    );
    await bootTypes();
    await type('host-ticket-0-quantity', '90');
    await press('ticket-types-save');
    await press('review-confirm');
    expect(await rtl.screen.findByTestId('host-gate')).toBeTruthy();
  });
});
