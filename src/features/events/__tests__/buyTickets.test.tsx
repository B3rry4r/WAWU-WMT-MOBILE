/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Buying tickets (EVENTS-06): E2's Get tickets, E3 (pay), E4 (PIN), E5 (the ticket) and E10 (still confirming), on the real screens
 * with the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in answers in the Hub's shapes, records every
 * order and payment (headers and body), and answers a key it knows with the first payment, as the Hub does.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
const mockCalendar = jest.fn(async (_event: unknown) => ({ action: 'done' }));
jest.mock('expo-calendar/legacy', () => ({ createEventInCalendarAsync: (event: unknown) => mockCalendar(event) }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) =>
  json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
const ORDER_ID = '44444444-4444-4444-8444-444444444444';

const REGULAR = { id: 't-reg', tier: 'regular', name: 'Regular', priceNaira: 7500, quantity: 100, sold: 10, remaining: 90, soldOut: false, salesStartAt: null, salesEndAt: null };
const VIP = { ...REGULAR, id: 't-vip', tier: 'vip', name: 'VIP', priceNaira: 12000, remaining: 5 };
const FREE = { ...REGULAR, id: 't-free', name: 'Free entry', priceNaira: 0 };

const eventRow = {
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
};

type OrderStatus = 'awaiting_payment' | 'processing' | 'paid' | 'failed';

function orderView(status: OrderStatus, lines: { ticketTypeId: string; quantity: number }[], over: Record<string, unknown> = {}) {
  const tiers = [REGULAR, VIP, FREE];
  const viewLines = lines.map((l) => {
    const t = tiers.find((x) => x.id === l.ticketTypeId) ?? REGULAR;
    return { ticketTypeId: t.id, tierName: t.name, unitPriceKobo: t.priceNaira * 100, quantity: l.quantity, lineKobo: t.priceNaira * 100 * l.quantity };
  });
  const ticketsKobo = viewLines.reduce((sum, l) => sum + l.lineKobo, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  return {
    id: ORDER_ID,
    reference: 'WAW-EVT-8F2K91QX',
    event: { id: 'e-1', name: 'Creators Summit', startsAt: soon, endsAt: null, timezone: null, timeLabel: null, location: 'Lagos', venueName: 'Eko Hall', bannerUrl: null },
    free: ticketsKobo === 0,
    lines: viewLines,
    ticketCount: count,
    ticketsKobo,
    status,
    paymentId: status === 'awaiting_payment' ? null : 'pay-1',
    paymentStatus: status === 'paid' ? 'completed' : status === 'awaiting_payment' ? null : 'pending',
    statusMessage: status === 'processing' ? 'Paid, still confirming.' : null,
    transferFeeKobo: status === 'paid' ? 1575 : null,
    totalKobo: status === 'paid' ? ticketsKobo + 1575 : null,
    holderName: status === 'paid' ? 'Lennox Emmanuel' : null,
    tickets:
      status === 'paid'
        ? Array.from({ length: count }, (_, i) => ({ id: `55555555-5555-4555-8555-55555555555${i}`, code: `K7QX-4M2P-9WLA-3RT${i}`, tierName: viewLines[0].tierName, status: 'valid' }))
        : [],
    failureReason: status === 'failed' ? 'The tickets sold out before your payment finished. Your money is on its way back.' : null,
    returned: status === 'failed' ? { holdStatus: 'refunded', returned: false, returnedKobo: null } : null,
    createdAt: '2026-10-16T09:42:00.000Z',
    paidAt: status === 'paid' ? '2026-10-16T09:42:05.000Z' : null,
    ...over,
  };
}

function paymentQuote(priceKobo: number, over: Record<string, unknown> = {}) {
  const provider = hub.providerFeeKobo;
  return {
    kind: 'event_ticket',
    targetId: ORDER_ID,
    title: 'Creators Summit',
    payee: null,
    priceKobo,
    fee: { providerFeeKobo: provider, wawuFeeKobo: 0, totalFeeKobo: provider },
    totalKobo: priceKobo + provider,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: null,
    willBeHeld: true,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${priceKobo}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
    ...over,
  };
}

type PayMode = 'paid' | 'processing' | 'failed' | 'lost_before' | 'lost_after' | 'short' | 'limit' | 'changed' | 'in_progress';
const hub = {
  mode: 'paid' as PayMode,
  balanceKobo: 48_525_075,
  /** The bank's part of the quoted fee. Zero is a quote with no fee at all (R2-SOCIAL d). */
  providerFeeKobo: 1575,
  tiers: [REGULAR, VIP] as unknown[],
  /** How many times the page asked for the tier list. */
  tierReads: 0,
  createFails: null as null | { status: number; reason: Record<string, unknown> },
  /** SWEEP-MONEY-5b F3: this many order requests are taken by the Hub and their answer is lost (the phone sees a failed fetch). */
  createLost: 0,
  /** SWEEP-MONEY-5b F2: the Hub takes the order request and never answers it. */
  createHang: false,
  creates: [] as { key: string | null; body: { lines: { ticketTypeId: string; quantity: number }[] } }[],
  pays: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  /** Every payment the Hub made, by Idempotency-Key: a key it knows is answered again, never paid again. */
  paidKeys: new Set<string>(),
  payments: 0,
  wrongFirst: false,
  orderStatus: 'awaiting_payment' as OrderStatus,
  lines: [] as { ticketTypeId: string; quantity: number }[],
  orderReads: 0,
  noWalletOnPay: false,
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/events/e-1' && method === 'GET') return ok(eventRow);
  if (path === '/events/e-1/tickets') {
    hub.tierReads += 1;
    return ok(hub.tiers);
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-16T09:00:00.000Z' });
  if (path === '/events/e-1/orders/wallet' && method === 'POST') {
    const body = (await request.json()) as { lines: { ticketTypeId: string; quantity: number }[] };
    hub.creates.push({ key: request.headers.get('idempotency-key'), body });
    if (hub.createLost > 0) {
      hub.createLost -= 1;
      throw new TypeError('Network request failed');
    }
    if (hub.createHang) {
      return new Promise<Response>((_resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    }
    if (hub.createFails) return refuse(hub.createFails.status, hub.createFails.reason);
    hub.lines = body.lines;
    const price = orderView('awaiting_payment', body.lines).ticketsKobo;
    if (price === 0) {
      hub.orderStatus = 'paid';
      return json(201, { statusCode: 201, message: 'Created', data: { order: orderView('paid', body.lines), payment: null } });
    }
    hub.orderStatus = 'awaiting_payment';
    return json(201, { statusCode: 201, message: 'Created', data: { order: orderView('awaiting_payment', body.lines), payment: paymentQuote(price) } });
  }
  if (path === '/events/orders/wallet/pay' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.pays.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    // The Hub answers a key it knows with the first payment, before it looks at the PIN or the quote.
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: orderView(hub.orderStatus, hub.lines) });
    if (hub.noWalletOnPay) return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.wrongFirst && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 500_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 500_000 });
    if (hub.mode === 'limit') return refuse(409, { code: 'event_order_limit', message: 'You have reached the order limit for this event.' });
    if (hub.mode === 'changed') {
      return refuse(409, { code: 'quote_changed', message: 'The price changed.', paymentQuote: paymentQuote(Number(body.expectedTotalKobo) - 1575, { fee: { providerFeeKobo: 2575, wawuFeeKobo: 0, totalFeeKobo: 2575 }, totalKobo: Number(body.expectedTotalKobo) - 1575 + 2575, quoteToken: 'tok-new' }) });
    }
    if (hub.mode === 'in_progress') return refuse(409, { code: 'payment_in_progress', message: 'Still confirming.' });
    if (hub.mode === 'lost_before' && hub.pays.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      // The Hub took the payment and its answer never arrives.
      hub.paidKeys.add(key);
      hub.payments += 1;
      hub.orderStatus = 'paid';
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    hub.paidKeys.add(key);
    hub.payments += 1;
    hub.orderStatus = hub.mode === 'processing' ? 'processing' : hub.mode === 'failed' ? 'failed' : 'paid';
    return json(201, { statusCode: 201, message: 'Created', data: orderView(hub.orderStatus, hub.lines) });
  }
  if (path === `/events/orders/wallet/${ORDER_ID}/quote`) {
    return ok({ order: orderView('awaiting_payment', hub.lines), payment: paymentQuote(orderView('awaiting_payment', hub.lines).ticketsKobo) });
  }
  if (path === `/events/orders/wallet/${ORDER_ID}` && method === 'GET') {
    hub.orderReads += 1;
    return ok(orderView(hub.orderStatus, hub.lines));
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

const { EventDetailScreen } = require('../EventDetailScreen') as typeof import('../EventDetailScreen');
const { OrderTicketScreen } = require('../OrderTicketScreen') as typeof import('../OrderTicketScreen');
const { forgetBuyIntentsInMemory, buyIntentsKey, putBuyIntent } = require('../buyIntent') as typeof import('../buyIntent');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');
void [Animated, Image, Modal, Pressable, ScrollView, NativeText, TextInput, View];

// The first draw of the ticket card (the QR) and of the sheets is slow on a cold transform cache under load.
rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  mockVault.clear();
  forgetBuyIntentsInMemory();
  forgetAttempts();
  mockCalendar.mockClear();
  Object.assign(hub, {
    mode: 'paid',
    balanceKobo: 48_525_075,
    providerFeeKobo: 1575,
    tiers: [REGULAR, VIP],
    tierReads: 0,
    createFails: null,
    createLost: 0,
    createHang: false,
    creates: [],
    pays: [],
    paidKeys: new Set<string>(),
    payments: 0,
    wrongFirst: false,
    orderStatus: 'awaiting_payment',
    lines: [],
    orderReads: 0,
    noWalletOnPay: false,
  });
});

const clients: QueryClient[] = [];
afterEach(async () => {
  clients.splice(0).forEach((c) => c.clear());
});

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {child}
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

const handlers = () => ({ onOpenOrder: jest.fn(), onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function bootDetail(buy = handlers(), tierId = 't-reg') {
  const onBack = jest.fn();
  await render(<EventDetailScreen id="e-1" onBack={onBack} buy={buy} />);
  await rtl.screen.findByTestId(`tier-${tierId}`);
  await rtl.waitFor(() => expect(rtl.screen.getByTestId('event-get-tickets').props.accessibilityState?.busy).not.toBe(true));
  return buy;
}

const getTickets = async () => {
  await rtl.fireEvent.press(rtl.screen.getByTestId('event-get-tickets'));
};

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

// R2-SOCIAL (d): E3's button is the verb and the total with no dot, "Pay ₦7,500" (the board); this line pinned "Pay · ".
const payButton = () => rtl.screen.findByRole('button', { name: /^Pay ₦/ });

async function reachPin() {
  await getTickets();
  await rtl.fireEvent.press(await payButton());
  await rtl.screen.findByText(/^Approve /);
}

describe('E2: the picker beside Get tickets', () => {
  it('a user sets a quantity per tier, sees the total, and taps Get tickets', async () => {
    await bootDetail();
    // Regular starts at one, as the artboard draws it.
    expect(rtl.screen.getByTestId('tier-t-reg-count').props.children).toBe(1);
    expect(rtl.screen.getByText('1 ticket')).toBeTruthy();
    await rtl.fireEvent.press(rtl.within(rtl.screen.getByTestId('tier-t-vip')).getByLabelText('More VIP tickets'));
    expect(rtl.screen.getByText('2 tickets')).toBeTruthy();
    expect(rtl.screen.getByLabelText('19,500 naira')).toBeTruthy();
    await getTickets();
    await rtl.waitFor(() => expect(hub.creates).toHaveLength(1));
    expect(hub.creates[0].body.lines).toEqual([
      { ticketTypeId: 't-reg', quantity: 1 },
      { ticketTypeId: 't-vip', quantity: 1 },
    ]);
  });

  it('cannot raise a tier past what is left', async () => {
    await bootDetail();
    const vip = rtl.within(rtl.screen.getByTestId('tier-t-vip'));
    for (let i = 0; i < 7; i += 1) await rtl.fireEvent.press(vip.getByLabelText('More VIP tickets'));
    expect(rtl.screen.getByTestId('tier-t-vip-count').props.children).toBe(5);
    expect(vip.getByLabelText('More VIP tickets').props.accessibilityState.disabled).toBe(true);
  });

  it('a free pick totals Free', async () => {
    hub.tiers = [FREE];
    await render(<EventDetailScreen id="e-1" onBack={jest.fn()} buy={handlers()} />);
    await rtl.screen.findByTestId('tier-t-free');
    expect(rtl.within(rtl.screen.getByTestId('event-total')).getByText('Free')).toBeTruthy();
  });

  it('draws no picker and no button when the screen has nowhere to lead (R-47)', async () => {
    await render(<EventDetailScreen id="e-1" onBack={jest.fn()} />);
    await rtl.screen.findByTestId('tier-t-reg');
    expect(rtl.screen.queryByTestId('event-get-tickets')).toBeNull();
    expect(rtl.screen.queryByTestId('step-plus')).toBeNull();
    expect(rtl.screen.queryByTestId('event-total')).toBeNull();
  });
});

describe('E3 and E4: pay and PIN', () => {
  // R2-SOCIAL (d), CHECK-3 defect 4: with no fee in the Hub's quote the sheet is the board's: "Fee: No fee", the Total and "Pay ₦7,500".
  it('a quote with no fee reads Tickets, "Fee: No fee", Total, and the button "Pay ₦7,500" with no dot', async () => {
    hub.providerFeeKobo = 0;
    await bootDetail();
    await getTickets();
    await rtl.waitFor(() => expect(rtl.screen.getAllByText('Tickets')).toHaveLength(2));
    expect(rtl.screen.getByText('No fee')).toBeTruthy();
    expect(rtl.screen.getByText('Fee')).toBeTruthy();
    expect(rtl.screen.queryByText('Bank charge')).toBeNull();
    expect(rtl.screen.getByText('Total')).toBeTruthy();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦7,500' })).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: /^Pay · / })).toBeNull();
  });

  it('a quote with a fee never says "No fee", and the button is "Pay ₦7,515.75"', async () => {
    await bootDetail();
    await getTickets();
    await rtl.waitFor(() => expect(rtl.screen.getAllByText('Tickets')).toHaveLength(2));
    expect(rtl.screen.queryByText('No fee')).toBeNull();
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦7,515.75' })).toBeTruthy();
  });

  it('a user reviews the order, sees the tickets, the bank charge and the total, and pays with the PIN once', async () => {
    const buy = await bootDetail();
    await getTickets();
    // The word is the page's own label and the sheet's price row.
    await rtl.waitFor(() => expect(rtl.screen.getAllByText('Tickets')).toHaveLength(2));
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByText('Total')).toBeTruthy();
    expect(rtl.screen.queryByText("WAWU's fee")).toBeNull();
    expect(rtl.screen.getByText(/^1 × Regular · [A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2}$/)).toBeTruthy();
    expect(rtl.screen.getByText(/Naira wallet ·/)).toBeTruthy();
    expect(rtl.screen.getByLabelText('7,515 naira 75 kobo')).toBeTruthy();
    await rtl.fireEvent.press(await payButton());
    expect(await rtl.screen.findByText(/^Approve .*7,515\.75.* to Creators Summit$/)).toBeTruthy();
    await enterPin('1234');
    await rtl.waitFor(() => expect(buy.onOpenOrder).toHaveBeenCalledWith(ORDER_ID));
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('1234');
    expect(hub.pays[0].key).toBeTruthy();
    expect(hub.pays[0].body).toEqual({ orderId: ORDER_ID, expectedTotalKobo: 751_575, quoteToken: 'tok-750000' });
    expect(hub.payments).toBe(1);
    // The kept payment is gone once the Hub has decided.
    await rtl.waitFor(() => expect(JSON.parse(mockVault.get(buyIntentsKey('owner-1')) ?? '[]')).toEqual([]));
  });

  it('a wrong PIN sends the same key again and the money moves once', async () => {
    hub.wrongFirst = true;
    const buy = await bootDetail();
    await reachPin();
    await enterPin('1111');
    expect(await rtl.screen.findByText(/4 tries left/)).toBeTruthy();
    await enterPin('1234');
    await rtl.waitFor(() => expect(buy.onOpenOrder).toHaveBeenCalledTimes(1));
    expect(hub.pays.map((p) => p.pin)).toEqual(['1111', '1234']);
    expect(hub.pays[0].key).toBe(hub.pays[1].key);
    expect(hub.payments).toBe(1);
  });

  it('a payment that never reached the Hub is sent again with the same key and the money moves once', async () => {
    hub.mode = 'lost_before';
    const buy = await bootDetail();
    await reachPin();
    await enterPin('1234');
    // Kept on the phone before it left, and still kept: no answer proves nothing.
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    expect(JSON.parse(mockVault.get(buyIntentsKey('owner-1')) ?? '[]')).toHaveLength(1);
    expect(buy.onOpenOrder).not.toHaveBeenCalled();
    await enterPin('1234');
    await rtl.waitFor(() => expect(buy.onOpenOrder).toHaveBeenCalledWith(ORDER_ID));
    expect(hub.pays[0].key).toBe(hub.pays[1].key);
    expect(hub.payments).toBe(1);
  });

  it('a payment the Hub took but never answered is found by reading the order, and is not paid again', async () => {
    hub.mode = 'lost_after';
    const buy = await bootDetail();
    await reachPin();
    await enterPin('1234');
    await rtl.waitFor(() => expect(buy.onOpenOrder).toHaveBeenCalledTimes(1));
    expect(buy.onOpenOrder).toHaveBeenCalledWith(ORDER_ID);
    expect(hub.pays).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('shows the Hub\'s own message when the order limit is reached, and nothing is paid', async () => {
    hub.mode = 'limit';
    await bootDetail();
    await reachPin();
    await enterPin('1234');
    expect(await rtl.screen.findByText('You have reached the order limit for this event.')).toBeTruthy();
    expect(hub.payments).toBe(0);
  });

  it('EVENTS-06 L1: when the Hub refuses the payment, the page behind reads its tiers again', async () => {
    hub.mode = 'limit';
    await bootDetail();
    await reachPin();
    const before = hub.tierReads;
    await enterPin('1234');
    expect(await rtl.screen.findByText('You have reached the order limit for this event.')).toBeTruthy();
    await rtl.waitFor(() => expect(hub.tierReads).toBeGreaterThan(before));
  });

  it('shows the Hub\'s own message when the order limit stops the order itself', async () => {
    hub.createFails = { status: 409, reason: { code: 'event_order_limit', message: 'You have reached the order limit for this event.' } };
    await bootDetail();
    await getTickets();
    expect(await rtl.screen.findByText('You have reached the order limit for this event.')).toBeTruthy();
    expect(hub.pays).toHaveLength(0);
  });

  describe('an order request the Hub never answered (SWEEP-MONEY-5b F2 and F3)', () => {
    it('F3: the answer was lost and the person left; the same tickets asked for again are the SAME request under the same key: one order', async () => {
      await bootDetail();
      hub.createLost = 1;
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(1));
      expect(await rtl.screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();

      // The person leaves the event and comes back: a new page, a new tap, the same tickets.
      await rtl.cleanup();
      await bootDetail();
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(2));
      expect(hub.creates[1].key).toBe(hub.creates[0].key);
      expect(hub.creates[0].key).toMatch(/\S/);
      expect(hub.creates[1].body).toEqual(hub.creates[0].body);
      expect(await rtl.screen.findByText('Bank charge')).toBeTruthy();
      expect(new Set(hub.creates.map((c) => c.key)).size).toBe(1);
    });

    it('F3: other tickets are another request under another key', async () => {
      await bootDetail();
      hub.createLost = 1;
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(1));
      await rtl.cleanup();
      await bootDetail();
      await rtl.fireEvent.press(rtl.within(rtl.screen.getByTestId('tier-t-reg')).getByLabelText('More Regular tickets'));
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(2));
      expect(hub.creates[1].key).not.toBe(hub.creates[0].key);
      expect(hub.creates[1].body.lines).toEqual([{ ticketTypeId: 't-reg', quantity: 2 }]);
    });

    it('F3: once the Hub has refused an order request, the key is free: the next tap after leaving is a new request', async () => {
      hub.createFails = { status: 409, reason: { code: 'event_order_limit', message: 'You have reached the order limit for this event.' } };
      await bootDetail();
      await getTickets();
      expect(await rtl.screen.findByText('You have reached the order limit for this event.')).toBeTruthy();
      await rtl.cleanup();
      hub.createFails = null;
      await bootDetail();
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(2));
      expect(hub.creates[1].key).not.toBe(hub.creates[0].key);
    });

    it('F3: an order the Hub answered is done with: after leaving, the same tickets asked for again are a new order', async () => {
      await bootDetail();
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(1));
      await rtl.screen.findByText('Bank charge');
      await rtl.cleanup();
      await bootDetail();
      await getTickets();
      await rtl.waitFor(() => expect(hub.creates).toHaveLength(2));
      expect(hub.creates[1].key).not.toBe(hub.creates[0].key);
    });

    it('F2: an order request that gets no answer ends after 30 s and says "We didn\'t get an answer", not "No connection"', async () => {
      await bootDetail();
      hub.createHang = true;
      jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'] });
      try {
        await getTickets();
        await rtl.waitFor(() => expect(hub.creates).toHaveLength(1));
        await rtl.act(async () => {
          await jest.advanceTimersByTimeAsync(30_500);
        });
        expect(await rtl.screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
        expect(rtl.screen.queryByText(/No connection/)).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  it('a user with no wallet who taps Get tickets lands in Open your wallet', async () => {
    hub.createFails = { status: 409, reason: { code: 'wallet_not_open', message: 'Open your wallet first.' } };
    const buy = await bootDetail();
    await getTickets();
    await rtl.waitFor(() => expect(buy.onOpenWallet).toHaveBeenCalledTimes(1));
    expect(rtl.screen.queryByText('Bank charge')).toBeNull();
  });

  it('a user short of money sees the bank\'s figures and can add money', async () => {
    hub.mode = 'short';
    const buy = await bootDetail();
    await reachPin();
    await enterPin('1234');
    expect(await rtl.screen.findByText('Not enough in your Naira wallet')).toBeTruthy();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: /^Add / }));
    expect(buy.onAddMoney).toHaveBeenCalledWith(251_575);
    expect(hub.payments).toBe(0);
  });

  it('asks again when the price moved, with the new total, and pays that one under a new key', async () => {
    hub.mode = 'changed';
    await bootDetail();
    await reachPin();
    await enterPin('1234');
    expect(await rtl.screen.findByText('The price changed. Check the new total before you pay.')).toBeTruthy();
    expect(await rtl.screen.findByLabelText('7,525 naira 75 kobo')).toBeTruthy();
    expect(hub.payments).toBe(0);
  });
});

describe('a free ticket (R-8)', () => {
  it('a user gets a ticket to a free event without a wallet, a pay sheet or a PIN', async () => {
    hub.tiers = [FREE];
    const buy = await bootDetail(handlers(), 't-free');
    await getTickets();
    await rtl.waitFor(() => expect(buy.onOpenOrder).toHaveBeenCalledWith(ORDER_ID));
    expect(hub.pays).toHaveLength(0);
    expect(rtl.screen.queryByText('Bank charge')).toBeNull();
    expect(rtl.screen.queryByText('Enter your PIN')).toBeNull();
    expect(hub.creates[0].body.lines).toEqual([{ ticketTypeId: 't-free', quantity: 1 }]);
  });
});

describe('E10: still confirming', () => {
  it('shows Paid, still confirming with Refresh, never asks to pay again, and goes on to the ticket when the Hub has finished', async () => {
    hub.mode = 'processing';
    const buy = await bootDetail();
    await reachPin();
    await enterPin('1234');
    expect(await rtl.screen.findByTestId('event-confirming')).toBeTruthy();
    expect(rtl.screen.getByText('Paid, still confirming')).toBeTruthy();
    expect(rtl.screen.getByText("Don't pay again. Your ticket shows up in a minute.")).toBeTruthy();
    expect(rtl.screen.queryByTestId('event-get-tickets')).toBeNull();
    expect(rtl.screen.queryByTestId('tier-t-reg')).toBeNull();
    expect(buy.onOpenOrder).not.toHaveBeenCalled();
    hub.orderStatus = 'paid';
    await rtl.fireEvent.press(rtl.screen.getByTestId('event-refresh'));
    await rtl.waitFor(() => expect(buy.onOpenOrder).toHaveBeenCalledWith(ORDER_ID));
    expect(hub.pays).toHaveLength(1);
  });

  it('a user who leaves and comes back finds the payment still confirming, not a second Get tickets', async () => {
    // What the phone kept when the payment was taken: the app was closed, and opens again with only this.
    hub.lines = [{ ticketTypeId: 't-reg', quantity: 1 }];
    hub.orderStatus = 'processing';
    hub.creates.push({ key: 'earlier', body: { lines: hub.lines } });
    await putBuyIntent('owner-1', {
      eventId: 'e-1',
      order: orderView('awaiting_payment', hub.lines) as never,
      payment: paymentQuote(750_000) as never,
      key: 'earlier-key-0001',
      phase: 'processing',
      at: Date.now(),
    });
    forgetBuyIntentsInMemory();
    await render(<EventDetailScreen id="e-1" onBack={jest.fn()} buy={handlers()} />);
    expect(await rtl.screen.findByTestId('event-confirming')).toBeTruthy();
    expect(rtl.screen.queryByTestId('event-get-tickets')).toBeNull();
    expect(hub.creates).toHaveLength(1);
    expect(hub.pays).toHaveLength(0);
  });

  it('shows the Hub\'s reason when the order failed after the payment, and the tickets can be asked for again', async () => {
    hub.mode = 'failed';
    await bootDetail();
    await reachPin();
    await enterPin('1234');
    expect(await rtl.screen.findByTestId('event-order-failed')).toBeTruthy();
    expect(rtl.screen.getByText('The tickets sold out before your payment finished. Your money is on its way back.')).toBeTruthy();
    expect(rtl.screen.getByTestId('event-get-tickets')).toBeTruthy();
  });
});

describe('E5: the ticket', () => {
  const props = () => ({ orderId: ORDER_ID, onClose: jest.fn(), onMyTickets: jest.fn() });

  it('a user sees the QR, the code, the tier and their name, and can go to My tickets', async () => {
    hub.lines = [{ ticketTypeId: 't-reg', quantity: 1 }];
    hub.orderStatus = 'paid';
    const p = props();
    await render(<OrderTicketScreen {...p} />);
    expect(await rtl.screen.findByText("You're in. Show this at the door.")).toBeTruthy();
    expect(rtl.screen.getByTestId('ticket-qr')).toBeTruthy();
    expect(rtl.screen.getByText('K7QX-4M2P-9WLA-3RT0')).toBeTruthy();
    expect(rtl.screen.getByText('Regular · Lennox Emmanuel')).toBeTruthy();
    expect(rtl.screen.getByText('Your ticket')).toBeTruthy();
    expect(rtl.screen.queryByTestId('order-ticket-pager')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('order-ticket-mine'));
    expect(p.onMyTickets).toHaveBeenCalledTimes(1);
    await rtl.fireEvent.press(rtl.screen.getByTestId('order-ticket-close'));
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });

  it('a user can add the event to their calendar', async () => {
    hub.lines = [{ ticketTypeId: 't-reg', quantity: 1 }];
    hub.orderStatus = 'paid';
    await render(<OrderTicketScreen {...props()} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('order-ticket-calendar'));
    await rtl.waitFor(() => expect(mockCalendar).toHaveBeenCalledTimes(1));
    expect(mockCalendar.mock.calls[0][0]).toMatchObject({ title: 'Creators Summit', location: 'Eko Hall, Lagos' });
  });

  it('shows the tickets of one order one at a time', async () => {
    hub.lines = [{ ticketTypeId: 't-reg', quantity: 2 }];
    hub.orderStatus = 'paid';
    await render(<OrderTicketScreen {...props()} />);
    expect(await rtl.screen.findByText('Ticket 1 of 2')).toBeTruthy();
    expect(rtl.screen.getByText('Your tickets')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('order-ticket-next'));
    expect(rtl.screen.getByText('Ticket 2 of 2')).toBeTruthy();
    expect(rtl.screen.getByText('K7QX-4M2P-9WLA-3RT1')).toBeTruthy();
  });

  it('says still confirming, with Refresh, for an order the Hub has not finished', async () => {
    hub.lines = [{ ticketTypeId: 't-reg', quantity: 1 }];
    hub.orderStatus = 'processing';
    await render(<OrderTicketScreen {...props()} />);
    expect(await rtl.screen.findByTestId('order-ticket-confirming')).toBeTruthy();
    expect(rtl.screen.queryByTestId('ticket-qr')).toBeNull();
    hub.orderStatus = 'paid';
    await rtl.fireEvent.press(rtl.screen.getByTestId('order-ticket-refresh'));
    expect(await rtl.screen.findByTestId('ticket-qr')).toBeTruthy();
  });
});
