/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Reply = { status?: number; body?: unknown; offline?: true; hold?: true };
type Call = { method: string; path: string; body: unknown };

let handler: (call: Call) => Reply | undefined = () => undefined;
let calls: Call[] = [];
let held: ((r: Response) => void)[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  const call: Call = { method: request.method, path: url.pathname.replace(/^\/api\/hub/, ''), body: text ? JSON.parse(text) : undefined };
  calls.push(call);
  const reply = handler(call);
  if (!reply) throw new Error(`no answer for ${call.method} ${call.path}`);
  if (reply.offline) throw new TypeError('Network request failed');
  if (reply.hold) return new Promise<Response>((resolve) => held.push(resolve));
  return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

const NOW = new Date('2027-01-01T09:00:00Z').getTime();

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
  tickets: {
    hostSharePercent: 85,
    minPriceNaira: 0,
    maxPriceNaira: 10_000_000,
    minQuantity: 1,
    maxQuantity: 1_000_000,
    nameMinLength: 2,
    nameMaxLength: 60,
    maxTypes: 20,
  },
  fields: { nameMax: 160, descriptionMax: 5000, hostOrgMax: 160, addressMax: 300 },
};

const tick = (creator: boolean, professional = false) => ({
  verification: { creator: { verified: creator, expiresAt: null }, professional: { verified: professional, expiresAt: null } },
  pricing: { creator: 2000, professional: 2000, currency: 'NGN', termMonths: 12 },
  eligibility: [],
});

const created = { id: 'e-new', name: 'Pricing your work', status: 'pending' };

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

const serve = (verified: boolean, extra?: (c: Call) => Reply | undefined) => {
  handler = (c) => {
    if (c.path === '/verification/me') return ok(tick(verified));
    if (c.path === '/events/options') return ok(options);
    return extra?.(c);
  };
};

async function bootHost() {
  const { HostScreen } = require('../HostScreen') as typeof import('../HostScreen');
  const props = { onBack: jest.fn(), onDiscover: jest.fn(), onDone: jest.fn(), now: () => NOW };
  await render(<HostScreen {...props} />);
  return props;
}

const type = (id: string, text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId(id), text);
const press = (id: string) => rtl.fireEvent.press(rtl.screen.getByTestId(id));

async function fillBasics() {
  await rtl.screen.findByTestId('host-name');
  await type('host-name', 'Pricing your work');
  await type('host-description', 'Three hours on the numbers.');
  await type('host-org', 'Adeyemi & Co');
  await press('host-kind');
  await press('host-kind-sheet-workshop');
  await press('host-continue');
}

async function fillWhen() {
  await press('host-starts');
  await press('host-starts-sheet-day-2027-01-02');
  await press('host-starts-sheet-time-14:00');
  await press('host-starts-done');
  await press('host-ends');
  await press('host-ends-sheet-time-17:00');
  await press('host-ends-done');
  await type('host-address', '5 Marina, Lagos');
  await press('host-category');
  await press('host-category-sheet-business');
  await press('host-continue');
}

async function fillTickets() {
  await type('host-ticket-0-name', 'Regular');
  await type('host-ticket-0-price', '5000');
  await type('host-ticket-0-quantity', '100');
}

beforeEach(() => {
  calls = [];
  held = [];
  handler = () => undefined;
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

const posts = () => calls.filter((c) => c.method === 'POST' && c.path === '/events');

describe('E21 · Needs a tick', () => {
  it('shows the gate, with the price from the system, to an account without a tick', async () => {
    serve(false);
    await bootHost();
    expect(await rtl.screen.findByText('Hosting needs a verified tick')).toBeTruthy();
    expect(rtl.screen.getByText('A creator or professional tick, ₦2,000 a year.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-name')).toBeNull();
  });

  it('draws Get verified as designed; it does nothing until ME-12 (R-46)', async () => {
    serve(false);
    await bootHost();
    await rtl.screen.findByTestId('host-gate');
    const button = rtl.screen.getByTestId('host-get-verified');
    expect(rtl.screen.getByText('Get verified')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(button));
    expect(rtl.screen.getByTestId('host-gate')).toBeTruthy();
  });

  it('lets a professional tick host', async () => {
    handler = (c) => (c.path === '/verification/me' ? ok(tick(false, true)) : c.path === '/events/options' ? ok(options) : undefined);
    await bootHost();
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
  });

  it('goes back from the gate', async () => {
    serve(false);
    const props = await bootHost();
    await rtl.screen.findByTestId('host-gate');
    await press('host-back');
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the gate when the Hub refuses the submit for a missing tick', async () => {
    serve(true, (c) =>
      c.method === 'POST' && c.path === '/events'
        ? { status: 403, body: { statusCode: 403, message: 'Only verified accounts can host an event.', reason: { code: 'verification_required' } } }
        : undefined,
    );
    await bootHost();
    await fillBasics();
    await fillWhen();
    await fillTickets();
    await press('host-send');
    expect(await rtl.screen.findByText('Hosting needs a verified tick')).toBeTruthy();
  });
});

describe('loading and error', () => {
  it('shows a skeleton while the Hub answers, then the form', async () => {
    serve(true);
    await bootHost();
    expect(rtl.screen.getByTestId('host-loading')).toBeTruthy();
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
  });

  it('shows an error offline and recovers on Retry', async () => {
    handler = () => ({ offline: true });
    await bootHost();
    expect(await rtl.screen.findByTestId('host-error')).toBeTruthy();
    serve(true);
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
  });
});

describe('E13 to E15 · the wizard', () => {
  it('does not move on from Basics until every field is filled, and says which', async () => {
    serve(true);
    await bootHost();
    await rtl.screen.findByTestId('host-name');
    await press('host-continue');
    expect(rtl.screen.getByText('Give the event a name.')).toBeTruthy();
    expect(rtl.screen.getByText('Say what happens at it.')).toBeTruthy();
    expect(rtl.screen.getByText('Say who is running it.')).toBeTruthy();
    expect(rtl.screen.getByText('Pick the kind of event.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-starts')).toBeNull();
  });

  it('keeps what was typed when going back a step', async () => {
    serve(true);
    const props = await bootHost();
    await fillBasics();
    await rtl.screen.findByTestId('host-starts');
    await press('host-back');
    expect(props.onBack).not.toHaveBeenCalled();
    expect(rtl.screen.getByTestId('host-name').props.value).toBe('Pricing your work');
    expect(rtl.screen.getByText('Workshop')).toBeTruthy();
  });

  it('asks for the street address of an in-person event but not an online one', async () => {
    serve(true);
    await bootHost();
    await fillBasics();
    await press('host-starts');
    await press('host-starts-sheet-day-2027-01-02');
    await press('host-starts-sheet-time-14:00');
    await press('host-starts-done');
    await press('host-ends');
    await press('host-ends-sheet-time-17:00');
    await press('host-ends-done');
    await press('host-category');
    await press('host-category-sheet-business');
    await press('host-continue');
    expect(rtl.screen.getByText('Add the street address.')).toBeTruthy();
    await press('host-back');
    await press('host-format-online');
    await press('host-continue');
    await press('host-continue');
    expect(rtl.screen.getByTestId('host-ticket-0')).toBeTruthy();
  });

  it('writes the ticket note from the Hub and sends the event and its types in one POST', async () => {
    serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? ok(created) : undefined));
    const props = await bootHost();
    await fillBasics();
    await fillWhen();
    expect(await rtl.screen.findByText('You keep 85% of every ticket. Set price to ₦0 for a free event.')).toBeTruthy();
    await fillTickets();
    await press('host-add-ticket');
    await type('host-ticket-1-name', 'VIP');
    await type('host-ticket-1-price', '12000');
    await type('host-ticket-1-quantity', '20');
    await press('host-send');
    expect(await rtl.screen.findByText('Sent for review')).toBeTruthy();
    expect(rtl.screen.getByText('A person checks it. It goes live on its own once approved.')).toBeTruthy();
    expect(posts()).toHaveLength(1);
    expect(posts()[0].body).toEqual({
      name: 'Pricing your work',
      description: 'Three hours on the numbers.',
      hostOrg: 'Adeyemi & Co',
      format: 'in_person',
      type: 'workshop',
      startsAt: '2027-01-02T13:00:00.000Z',
      endsAt: '2027-01-02T16:00:00.000Z',
      address: '5 Marina, Lagos',
      category: 'business',
      ticketTypes: [
        { name: 'Regular', priceNaira: 5000, quantity: 100 },
        { name: 'VIP', priceNaira: 12000, quantity: 20 },
      ],
    });
    await press('host-done');
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it('sends a free ticket as 0 (R-8)', async () => {
    serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? ok(created) : undefined));
    await bootHost();
    await fillBasics();
    await fillWhen();
    await type('host-ticket-0-name', 'Free pass');
    await type('host-ticket-0-price', '0');
    await type('host-ticket-0-quantity', '50');
    await press('host-send');
    await rtl.screen.findByText('Sent for review');
    expect((posts()[0].body as { ticketTypes: unknown[] }).ticketTypes).toEqual([{ name: 'Free pass', priceNaira: 0, quantity: 50 }]);
  });

  it('flags only the ticket type that is wrong and sends nothing', async () => {
    serve(true);
    await bootHost();
    await fillBasics();
    await fillWhen();
    await fillTickets();
    await press('host-add-ticket');
    await type('host-ticket-1-name', 'VIP');
    await type('host-ticket-1-price', '12000');
    await press('host-send');
    expect(await rtl.screen.findByText('How many?')).toBeTruthy();
    expect(posts()).toHaveLength(0);
  });

  it('sends one request however many times Send for review is pressed, then ends', async () => {
    serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? { hold: true } : undefined));
    await bootHost();
    await fillBasics();
    await fillWhen();
    await fillTickets();
    await press('host-send');
    await press('host-send');
    await press('host-send');
    expect(posts()).toHaveLength(1);
    await rtl.act(async () => {
      held[0](new Response(JSON.stringify({ data: created }), { status: 200, headers: { 'content-type': 'application/json' } }));
    });
    expect(await rtl.screen.findByText('Sent for review')).toBeTruthy();
    expect(posts()).toHaveLength(1);
    expect(rtl.screen.getByText('My events')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('host-my-events')));
    expect(rtl.screen.getByTestId('host-submitted')).toBeTruthy();
  });

  it('draws the My events tab between Discover and Host event; it does nothing until EVENTS-08', async () => {
    serve(true);
    await bootHost();
    await rtl.screen.findByTestId('host-name');
    const labels = rtl.screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel);
    expect(labels).toEqual(['Discover', 'My events', 'Host event']);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('events-tab-mine')));
    expect(rtl.screen.getByTestId('host-name')).toBeTruthy();
  });

  it('keeps everything typed after a failed submit, says why, and sends again on retry', async () => {
    let attempt = 0;
    serve(true, (c) => {
      if (!(c.method === 'POST' && c.path === '/events')) return undefined;
      attempt += 1;
      return attempt === 1 ? { status: 500, body: { statusCode: 500, message: 'The Hub had a problem.' } } : ok(created);
    });
    await bootHost();
    await fillBasics();
    await fillWhen();
    await fillTickets();
    await press('host-send');
    expect(await rtl.screen.findByTestId('host-failure')).toBeTruthy();
    expect(rtl.screen.getByTestId('host-ticket-0-name').props.value).toBe('Regular');
    await press('host-send');
    expect(await rtl.screen.findByText('Sent for review')).toBeTruthy();
    expect(posts()).toHaveLength(2);
  });

  it('keeps everything typed when the phone is offline at submit', async () => {
    serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? { offline: true } : undefined));
    await bootHost();
    await fillBasics();
    await fillWhen();
    await fillTickets();
    await press('host-send');
    expect(await rtl.screen.findByTestId('host-failure')).toBeTruthy();
    expect(rtl.screen.getByTestId('host-ticket-0-quantity').props.value).toBe('100');
  });

  it('shows the Hub\'s own sentence when it refuses a value', async () => {
    serve(true, (c) =>
      c.method === 'POST' && c.path === '/events'
        ? { status: 400, body: { statusCode: 400, message: ['quantity must be a whole number, from 1 to 1000000.'] } }
        : undefined,
    );
    await bootHost();
    await fillBasics();
    await fillWhen();
    await fillTickets();
    await press('host-send');
    expect(await rtl.screen.findByText('quantity must be a whole number, from 1 to 1000000.')).toBeTruthy();
  });
});

describe('E22 · Sent back', () => {
  const sentBack = (over: Record<string, unknown> = {}) => ({
    id: 'e-9',
    name: 'Aba Fashion Market',
    format: 'in_person',
    address: null,
    status: 'rejected',
    lastDecisionReason: 'Add the street address, then send it again.',
    ...over,
  });

  async function bootSentBack() {
    const { SentBackScreen } = require('../SentBackScreen') as typeof import('../SentBackScreen');
    const props = { id: 'e-9', onBack: jest.fn(), onDone: jest.fn() };
    await render(<SentBackScreen {...props} />);
    return props;
  }

  it('shows the reviewer\'s words and flags a missing address, then sends the fix', async () => {
    handler = (c) =>
      c.path === '/events/options' ? ok(options) : c.method === 'GET' && c.path === '/events/e-9' ? ok(sentBack()) : c.method === 'PATCH' ? ok(sentBack({ status: 'pending' })) : undefined;
    const props = await bootSentBack();
    expect(await rtl.screen.findByText('Add the street address, then send it again.')).toBeTruthy();
    expect(rtl.screen.getByText('Needed before it can go live')).toBeTruthy();
    await type('sent-back-address', '12 Ngwa Road, Aba');
    expect(rtl.screen.queryByText('Needed before it can go live')).toBeNull();
    await press('sent-back-send');
    await rtl.waitFor(() => expect(props.onDone).toHaveBeenCalledTimes(1));
    const patch = calls.find((c) => c.method === 'PATCH');
    expect(patch?.path).toBe('/events/e-9');
    expect(patch?.body).toEqual({ name: 'Aba Fashion Market', address: '12 Ngwa Road, Aba' });
  });

  it('does not send while the address is still empty', async () => {
    handler = (c) => (c.path === '/events/options' ? ok(options) : c.path === '/events/e-9' ? ok(sentBack()) : undefined);
    await bootSentBack();
    await rtl.screen.findByTestId('sent-back-send');
    await press('sent-back-send');
    expect(rtl.screen.getByText('Add the street address.')).toBeTruthy();
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('does not flag an address that is there', async () => {
    handler = (c) => (c.path === '/events/options' ? ok(options) : c.path === '/events/e-9' ? ok(sentBack({ address: '5 Marina' })) : undefined);
    await bootSentBack();
    await rtl.screen.findByTestId('sent-back-send');
    expect(rtl.screen.queryByText('Needed before it can go live')).toBeNull();
  });

  it('keeps the typed address when the send fails', async () => {
    handler = (c) =>
      c.path === '/events/options'
        ? ok(options)
        : c.method === 'GET' && c.path === '/events/e-9'
          ? ok(sentBack())
          : c.method === 'PATCH'
            ? { status: 500, body: { statusCode: 500, message: 'Try later.' } }
            : undefined;
    const props = await bootSentBack();
    await rtl.screen.findByTestId('sent-back-address');
    await type('sent-back-address', '12 Ngwa Road');
    await press('sent-back-send');
    expect(await rtl.screen.findByTestId('sent-back-failure')).toBeTruthy();
    expect(rtl.screen.getByTestId('sent-back-address').props.value).toBe('12 Ngwa Road');
    expect(props.onDone).not.toHaveBeenCalled();
  });

  it('shows an error with Retry when the event cannot be read', async () => {
    handler = () => ({ offline: true });
    await bootSentBack();
    expect(await rtl.screen.findByTestId('sent-back-error')).toBeTruthy();
  });
});

describe('the phone\'s Back', () => {
  it('goes a step back with the text kept, and out from the first step', async () => {
    const { BackHandler } = require('react-native') as typeof import('react-native');
    let press: (() => boolean) | undefined;
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, cb) => {
      press = cb as () => boolean;
      return { remove: jest.fn() };
    });
    serve(true);
    const props = await bootHost();
    await fillBasics();
    await rtl.screen.findByTestId('host-starts');
    await rtl.act(async () => {
      expect(press?.()).toBe(true);
    });
    expect(props.onBack).not.toHaveBeenCalled();
    expect(rtl.screen.getByTestId('host-name').props.value).toBe('Pricing your work');
    await rtl.act(async () => {
      press?.();
    });
    expect(props.onBack).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
