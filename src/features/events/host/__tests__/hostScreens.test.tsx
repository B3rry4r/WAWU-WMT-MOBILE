/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ActivityIndicator, Animated, BackHandler, Image, Modal, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// The plans are read per account (`plansQuery`); the account is known here without a sign-in.
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'acct-host' }));

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

/*
 * The first test in this file used to pay for loading the screens' modules and React Native's components (loaded on
 * first use, by babel-preset-expo's lazy imports) and for the renderer's own start: 20.5 s on a cold transform cache,
 * which is what a fresh checkout has, against a test's 20 s. They load here, with the fetch in place, where no timeout
 * applies, and the first render of anything is paid in a hook with a budget of its own.
 */
const { HostScreen } = require('../HostScreen') as typeof import('../HostScreen');
const { SentBackScreen } = require('../SentBackScreen') as typeof import('../SentBackScreen');
void [ActivityIndicator, Animated, BackHandler, Image, Modal, Pressable, ScrollView, NativeText, TextInput, View];

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

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

/** `GET /me/tier` in the Hub's shape. */
const tierView = (state: 'none' | 'active' | 'ending' | 'ended') =>
  state === 'none'
    ? { state, tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null }
    : { state, tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } }, activeFrom: '2026-10-01T00:00:00.000Z', activeUntil: '2026-11-26T12:00:00.000Z', productsAllowed: 3, productsUsed: 1, extraProducts: 0, pointsIncluded: 100, firstVoiceIntroIncluded: true, eventPass: null };

/** `GET /plans`: three tiers, the cheapest at 100,000 kobo. */
const plansView = (currency: 'NGN' | 'USD' = 'NGN') => {
  const tier = (id: string, name: string, priceMinor: number) => ({ id, name, days: 30, products: 3, bonusPoints: 100, bonusPointsExpireDays: 365, priceMinor, eventPass: { id: 'p', name: 'Pass' }, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: false });
  return { currency, currencyFixed: false, tiers: [tier('founding', 'Founding Maker', 500_000), tier('verify', 'Verify', 100_000), tier('plus', 'Verify Plus', 300_000)], extraProducts: { count: 5, priceMinor: 150_000 }, packs: [], checkoutBump: { points: 1000, priceMinor: 80_000 }, actions: [], caps: {} };
};

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

/** The Hub as a host meets it: the tick (`verified`), the tier (`none` when not named), the options and the plans. */
const serve = (verified: boolean, extra?: (c: Call) => Reply | undefined, tier: 'none' | 'active' | 'ending' | 'ended' = 'none') => {
  handler = (c) => {
    const own = extra?.(c);
    if (own) return own;
    if (c.path === '/verification/me') return ok(tick(verified));
    if (c.path === '/me/tier') return ok(tierView(tier));
    if (c.path === '/plans') return ok(plansView());
    if (c.path === '/events/options') return ok(options);
    return undefined;
  };
};

/** What serve() answers, as a function a handler can call for the paths it does not hold. */
const serveOnce = (c: Call): Reply | undefined => {
  if (c.path === '/verification/me') return ok(tick(false));
  if (c.path === '/me/tier') return ok(tierView('none'));
  if (c.path === '/events/options') return ok(options);
  return undefined;
};

async function bootHost(over: Record<string, unknown> = {}) {
  const props = { onBack: jest.fn(), onDiscover: jest.fn(), onDone: jest.fn(), onSeeTiers: jest.fn(), now: () => NOW, ...over };
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

/** The Hub's refusal of a host action for want of a tier (EVENTS-12), in its one error shape. */
const tierRefusal = (over: { tierState?: 'none' | 'ended'; message?: string; lowestTier?: { id: string; name: string; priceMinor: number } | null; code?: string } = {}) => {
  const message = over.message ?? 'Needs a tier. Pick a tier to host an event.';
  const reason = { code: over.code ?? 'tier_required', message, tierState: over.tierState ?? 'none', currency: 'NGN', lowestTier: over.lowestTier === undefined ? { id: 'verify', name: 'Verify', priceMinor: 100_000 } : over.lowestTier };
  return { status: 403, body: { statusCode: 403, message, data: null, reason } };
};
const ENDED_WORDS = 'Your tier has ended. Renew it to host a new event. Events that are already live keep selling.';

describe('E21 · Needs a tier', () => {
  it('a person with no tier and no tick sees Needs a tier, the tier names and the lowest price from the Hub, and no form', async () => {
    serve(false);
    await bootHost();
    expect(await rtl.screen.findByText('Hosting needs a tier')).toBeTruthy();
    expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(await rtl.screen.findByText('From ₦1,000.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-name')).toBeNull();
    expect(posts()).toHaveLength(0);
  });

  it('writes the price from the plan, not from the screen: a plan that starts higher says so', async () => {
    serve(false, (c) => (c.path === '/plans' ? ok({ ...plansView(), tiers: plansView().tiers.map((t) => ({ ...t, priceMinor: t.priceMinor + 50_000 })) }) : undefined));
    await bootHost();
    expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(await rtl.screen.findByText('From ₦1,500.')).toBeTruthy();
  });

  it('See tiers opens the tiers (VF5)', async () => {
    serve(false);
    const props = await bootHost();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('host-see-tiers'));
    expect(props.onSeeTiers).toHaveBeenCalledTimes(1);
  });

  it('draws no See tiers button when the screen has nowhere to send it (R-47)', async () => {
    serve(false);
    await bootHost({ onSeeTiers: undefined });
    await rtl.screen.findByTestId('host-gate-words');
    expect(rtl.screen.queryByTestId('host-see-tiers')).toBeNull();
    expect(rtl.screen.queryAllByRole('button').map((b) => b.props.testID)).toEqual(['host-back']);
  });

  it('a tier that ended, with no live tick, is told the same way (the Hub says more when it refuses)', async () => {
    serve(false, undefined, 'ended');
    await bootHost();
    expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(await rtl.screen.findByText('From ₦1,000.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-name')).toBeNull();
  });

  it('a running tier hosts without a tick, whether it is active or about to end', async () => {
    for (const tier of ['active', 'ending'] as const) {
      serve(false, undefined, tier);
      await bootHost();
      expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
      expect(rtl.screen.queryByTestId('host-gate')).toBeNull();
      await rtl.cleanup();
    }
  });

  it('a live tick with no tier still hosts: nothing live stops working', async () => {
    serve(true);
    await bootHost();
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-gate')).toBeNull();
  });

  it('lets a professional tick host', async () => {
    handler = (c) => (c.path === '/verification/me' ? ok(tick(false, true)) : c.path === '/events/options' ? ok(options) : undefined);
    await bootHost();
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
  });

  it('a tier that cannot be read, with no live tick, says so and asks again on Try again', async () => {
    serve(false, (c) => (c.path === '/me/tier' ? { offline: true } : undefined));
    await bootHost();
    expect(await rtl.screen.findByTestId('host-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-gate')).toBeNull();
    serve(false, undefined, 'active');
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
  });

  it('goes back from the gate', async () => {
    serve(false);
    const props = await bootHost();
    await rtl.screen.findByTestId('host-gate');
    await press('host-back');
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows a block where the words go while the plan is on its way, then the words', async () => {
    handler = (c) => (c.path === '/plans' ? { hold: true } : serveOnce(c));
    await bootHost();
    await rtl.screen.findByTestId('host-gate-loading');
    expect(rtl.screen.getByText('Hosting needs a tier')).toBeTruthy();
    await rtl.act(async () => {
      held.forEach((release) => release(new Response(JSON.stringify(ok(plansView()).body), { status: 200, headers: { 'content-type': 'application/json' } })));
    });
    expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(rtl.screen.getByText('From ₦1,000.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-gate-loading')).toBeNull();
  });

  it('draws no price when the plan cannot be read, says so, and reads it again on Try again', async () => {
    serve(false, (c) => (c.path === '/plans' ? { offline: true } : undefined));
    await bootHost();
    expect(await rtl.screen.findByTestId('host-gate-retry')).toBeTruthy();
    expect(rtl.screen.queryByText(/From /)).toBeNull();
    expect(rtl.screen.getByTestId('host-see-tiers')).toBeTruthy();
    serve(false);
    await press('host-gate-retry');
    expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(rtl.screen.getByText('From ₦1,000.')).toBeTruthy();
  });

  it('leaves a dollar price out: dollar prices wait for dollar accounts (R-64)', async () => {
    serve(false, (c) => (c.path === '/plans' ? ok(plansView('USD')) : undefined));
    await bootHost();
    expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(rtl.screen.queryByText(/From /)).toBeNull();
  });

  describe('when the Hub refuses the send (the last word)', () => {
    const send = async () => {
      await fillBasics();
      await fillWhen();
      await fillTickets();
      await press('host-send');
    };

    it('opens E21 on 403 tier_required, with the Hub\'s own price, not a generic error', async () => {
      serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? tierRefusal({ lowestTier: { id: 'verify', name: 'Verify', priceMinor: 150_000 } }) : undefined));
      await bootHost();
      await send();
      expect(await rtl.screen.findByText('Hosting needs a tier')).toBeTruthy();
      expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
    expect(await rtl.screen.findByText('From ₦1,500.')).toBeTruthy();
      expect(rtl.screen.queryByTestId('host-failure')).toBeNull();
      expect(rtl.screen.queryByTestId('host-name')).toBeNull();
    });

    it('tells an ended tier in the Hub\'s own words, with its price', async () => {
      serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? tierRefusal({ tierState: 'ended', message: ENDED_WORDS }) : undefined));
      await bootHost();
      await send();
      expect(await rtl.screen.findByText(ENDED_WORDS)).toBeTruthy();
      expect(await rtl.screen.findByText('From ₦1,000.')).toBeTruthy();
      expect(rtl.screen.queryByText(/Founding Maker/)).toBeNull();
    });

    it('opens E21 for an account type the Hub turns away without a tier (account_type_required)', async () => {
      serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? { status: 403, body: { statusCode: 403, message: 'Hosting is for creators and professionals.', data: null, reason: { code: 'account_type_required', message: 'Hosting is for creators and professionals.', steps: ['Pick a tier'] } } } : undefined));
      await bootHost();
      await send();
      expect(await rtl.screen.findByText('Hosting needs a tier')).toBeTruthy();
      expect(await rtl.screen.findByText('Verify, Verify Plus or Founding Maker.')).toBeTruthy();
      expect(await rtl.screen.findByText('From ₦1,000.')).toBeTruthy();
    });

    it('shows any other 403 as the Hub\'s sentence on the form, which stays', async () => {
      serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? { status: 403, body: { statusCode: 403, message: 'You cannot host here.', data: null, reason: { code: 'something_else' } } } : undefined));
      await bootHost();
      await send();
      expect(await rtl.screen.findByTestId('host-failure')).toHaveTextContent('You cannot host here.');
      expect(rtl.screen.queryByTestId('host-gate')).toBeNull();
    });

    it('See tiers on the refusal opens the tiers', async () => {
      serve(true, (c) => (c.method === 'POST' && c.path === '/events' ? tierRefusal() : undefined));
      const props = await bootHost();
      await send();
      await rtl.screen.findByTestId('host-gate');
      await press('host-see-tiers');
      expect(props.onSeeTiers).toHaveBeenCalledTimes(1);
    });
  });
});

describe('loading and error', () => {
  it('shows a skeleton while the Hub answers, then the form', async () => {
    // Both answers are held until the skeleton has been looked at, so a fast answer cannot beat the look; the test then releases them.
    handler = (c) => (c.path === '/verification/me' || c.path === '/events/options' ? { hold: true } : undefined);
    await bootHost();
    await rtl.waitFor(() => expect(held).toHaveLength(2));
    expect(rtl.screen.getByTestId('host-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-name')).toBeNull();
    const answerTo = (path: string) => (path === '/verification/me' ? ok(tick(true)) : ok(options)).body;
    await rtl.act(async () => {
      held.forEach((release, i) => release(new Response(JSON.stringify(answerTo(calls[i]?.path ?? '')), { status: 200, headers: { 'content-type': 'application/json' } })));
    });
    expect(await rtl.screen.findByTestId('host-name')).toBeTruthy();
    expect(rtl.screen.queryByTestId('host-loading')).toBeNull();
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
    // My events (E17) is EVENTS-08's: until it is built the confirmation offers Done alone (R-47).
    expect(rtl.screen.queryByText('My events')).toBeNull();
    expect(rtl.screen.queryByTestId('host-my-events')).toBeNull();
    expect(rtl.screen.getByTestId('host-done')).toBeTruthy();
  });

  it('draws Discover, My events and Host event: the My events tab is EVENTS-08\'s and is built', async () => {
    serve(true);
    await bootHost();
    await rtl.screen.findByTestId('host-name');
    const labels = rtl.screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel);
    expect(labels).toEqual(['Discover', 'My events', 'Host event']);
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
    const props = { id: 'e-9', onBack: jest.fn(), onDone: jest.fn(), onSeeTiers: jest.fn() };
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

  it('opens E21 when the Hub refuses the edit for want of a tier: its own words, its price, and See tiers (EVENTS-12)', async () => {
    handler = (c) =>
      c.path === '/events/options'
        ? ok(options)
        : c.path === '/plans'
          ? ok(plansView())
          : c.method === 'GET' && c.path === '/events/e-9'
            ? ok(sentBack())
            : c.method === 'PATCH'
              ? tierRefusal({ tierState: 'ended', message: ENDED_WORDS })
              : undefined;
    const props = await bootSentBack();
    await rtl.screen.findByTestId('sent-back-address');
    await type('sent-back-address', '12 Ngwa Road');
    await press('sent-back-send');
    expect(await rtl.screen.findByText(ENDED_WORDS)).toBeTruthy();
    expect(await rtl.screen.findByText('From ₦1,000.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('sent-back-failure')).toBeNull();
    await press('host-see-tiers');
    expect(props.onSeeTiers).toHaveBeenCalledTimes(1);
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

describe('ticket prices on an event (PUT /events/{id}/tickets)', () => {
  const { saveTicketTypes } = require('../../organiser/organiserApi') as typeof import('../../organiser/organiserApi');
  const { HostTierRefusal, isHostTierRefusal } = require('../hostTier') as typeof import('../hostTier');
  const types = [{ tier: 'regular' as const, name: 'Regular', priceNaira: 5000, quantity: 100 }];

  it('meets a missing tier as the tier refusal, with the state and the Hub\'s lowest tier, never a generic failure', async () => {
    handler = (c) => (c.method === 'PUT' && c.path === '/events/e-9/tickets' ? tierRefusal({ tierState: 'ended', message: ENDED_WORDS }) : undefined);
    const error = await saveTicketTypes('e-9', types).catch((e: unknown) => e);
    expect(isHostTierRefusal(error)).toBe(true);
    expect(error).toBeInstanceOf(HostTierRefusal);
    expect(error).toMatchObject({ status: 403, code: 'tier_required', tierState: 'ended', currency: 'NGN', message: ENDED_WORDS, lowestTier: { priceMinor: 100_000 } });
  });

  it('leaves every other refusal as the plain error it was', async () => {
    handler = () => ({ status: 409, body: { statusCode: 409, message: 'Tickets are already on sale.', data: null } });
    const error = await saveTicketTypes('e-9', types).catch((e: unknown) => e);
    expect(isHostTierRefusal(error)).toBe(false);
    expect(error).not.toBeInstanceOf(HostTierRefusal);
    expect(error).toMatchObject({ status: 409, message: 'Tickets are already on sale.' });
  });
});
