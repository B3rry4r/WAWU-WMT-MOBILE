/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text as NativeText, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Buy WAWU Credits (INBOX-13): I28 (the packs, the breakdown, the PIN), I29 (credits added), and what happens when the money does not
 * go as drawn. The Hub is a stand-in `fetch` installed before the app's modules load. It answers in the Hub's shapes, records every
 * quote and purchase (headers and body) and answers an Idempotency-Key it knows with the first purchase, as the Hub does.
 */
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const PACKS = [
  { pack: 'starter', credits: 50, priceKobo: 50_000, badge: null },
  { pack: 'popular', credits: 120, priceKobo: 100_000, badge: 'popular' },
  { pack: 'pro', credits: 300, priceKobo: 200_000, badge: 'best_value' },
];
const BANK_CHARGE = 2325;

type Mode = 'paid' | 'pending' | 'failed' | 'lost_after' | 'lost_before' | 'short_on_pay' | 'changed' | 'no_wallet_on_pay' | 'in_progress';
const hub = {
  mode: 'paid' as Mode,
  balanceKobo: 48_525_075,
  credits: 48,
  quoteWallet: 'open' as 'open' | 'none',
  quotes: [] as string[],
  quotePrice: null as null | number,
  buys: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Map<string, string>(),
  payments: 0,
  wrongFirst: false,
  purchaseReads: 0,
  pendingReadsLeft: 1,
  holdQuote: null as null | Promise<void>,
};

function quoteFor(pack: string, over: Record<string, unknown> = {}) {
  const row = PACKS.find((p) => p.pack === pack) ?? PACKS[1];
  const price = hub.quotePrice ?? row.priceKobo;
  const total = price + BANK_CHARGE;
  return {
    pack,
    credits: row.credits,
    priceKobo: price,
    badge: row.badge,
    payment: {
      kind: 'credit_pack',
      targetId: pack,
      title: `${row.credits} credits`,
      payee: null,
      priceKobo: price,
      fee: { providerFeeKobo: BANK_CHARGE, wawuFeeKobo: 0, totalFeeKobo: BANK_CHARGE },
      totalKobo: total,
      balanceKobo: hub.balanceKobo,
      shortfallKobo: hub.balanceKobo < total ? total - hub.balanceKobo : null,
      willBeHeld: false,
      withinDailyLimit: true,
      remainingTodayKobo: null,
      quoteToken: `tok-${pack}-${price}`,
      expiresAt: '2099-01-01T00:00:00.000Z',
      ...over,
    },
  };
}

function purchaseView(status: 'paid' | 'pending' | 'failed', pack = 'popular') {
  const row = PACKS.find((p) => p.pack === pack) ?? PACKS[1];
  const total = row.priceKobo + BANK_CHARGE;
  return {
    id: 'cp-1',
    method: 'wallet',
    status,
    statusMessage: status === 'pending' ? 'Paid, finishing it.' : status === 'failed' ? 'The bank did not take it.' : null,
    payment: {
      id: 'pay-1',
      kind: 'credit_pack',
      targetId: pack,
      title: `${row.credits} credits`,
      status: status === 'paid' ? 'completed' : status === 'pending' ? 'pending' : 'failed',
      priceKobo: row.priceKobo,
      fee: { providerFeeKobo: BANK_CHARGE, wawuFeeKobo: 0, totalFeeKobo: BANK_CHARGE },
      totalKobo: total,
      reference: 'WAW-CRD-1',
      hold: null,
      failureReason: status === 'failed' ? 'The bank did not take it.' : null,
      delivered: status === 'paid',
      statusMessage: null,
      createdAt: '2026-10-17T10:00:00.000Z',
      completedAt: status === 'paid' ? '2026-10-17T10:00:03.000Z' : null,
    },
    creditBalance: status === 'paid' ? hub.credits + row.credits : null,
    createdAt: '2026-10-17T10:00:00.000Z',
    paidAt: status === 'paid' ? '2026-10-17T10:00:03.000Z' : null,
    pack,
    credits: row.credits,
    priceKobo: row.priceKobo,
    badge: row.badge,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/credits/packs') return ok({ packs: PACKS });
  if (path === '/credits' && method === 'GET') return ok({ creditBalance: hub.credits });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === '/credits/purchase/wallet/quote') {
    const pack = url.searchParams.get('pack') ?? '';
    hub.quotes.push(pack);
    if (hub.holdQuote) await hub.holdQuote;
    if (hub.quoteWallet === 'none') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    return ok(quoteFor(pack));
  }
  if (path === '/credits/purchase/wallet' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.buys.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    // The Hub answers a key it knows with the first purchase, before it looks at the PIN or the quote.
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: purchaseView(hub.paidKeys.get(key) as 'paid') });
    if (hub.mode === 'no_wallet_on_pay') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.wrongFirst && hub.buys.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'short_on_pay') return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 50_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 50_000 });
    if (hub.mode === 'changed') return refuse(409, { code: 'quote_changed', message: 'The price changed.', paymentQuote: quoteFor('popular').payment });
    if (hub.mode === 'in_progress') return refuse(409, { code: 'payment_in_progress', message: 'Still confirming.' });
    if (hub.mode === 'lost_before' && hub.buys.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      hub.paidKeys.set(key, 'paid');
      hub.payments += 1;
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    const status = hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'paid';
    hub.paidKeys.set(key, status);
    hub.payments += 1;
    return json(201, { statusCode: 201, message: 'Created', data: purchaseView(status) });
  }
  if (path === '/credits/purchase/wallet/cp-1' && method === 'GET') {
    hub.purchaseReads += 1;
    if (hub.pendingReadsLeft > 0) {
      hub.pendingReadsLeft -= 1;
      return ok(purchaseView('pending'));
    }
    return ok(purchaseView('paid'));
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

const { BuyCreditsSheet } = require('../BuyCreditsSheet') as typeof import('../BuyCreditsSheet');
const { forgetAttempts } = require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts');
void [Animated, Image, Modal, Pressable, ScrollView, NativeText, TextInput, View];

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  forgetAttempts();
  Object.assign(hub, {
    mode: 'paid',
    balanceKobo: 48_525_075,
    credits: 48,
    quoteWallet: 'open',
    quotes: [],
    quotePrice: null,
    buys: [],
    paidKeys: new Map<string, string>(),
    payments: 0,
    wrongFirst: false,
    purchaseReads: 0,
    pendingReadsLeft: 1,
    holdQuote: null,
  });
});

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

function handlers() {
  return { onClose: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn(), onOpenWallet: jest.fn(), onAdded: jest.fn() };
}

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

async function boot(h = handlers()) {
  await render(<BuyCreditsSheet visible doneLabel="Back to chat" {...h} />);
  await rtl.screen.findByTestId('credits-total');
  return h;
}

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

const buyButton = () => rtl.screen.findByTestId('credits-buy');

async function reachPin() {
  await rtl.fireEvent.press(await buyButton());
  await rtl.screen.findByText(/ for 120 credits$/);
}

describe('I28: the packs sheet', () => {
  it('a user sees the packs, the bank charge and the total, and the button carries the total', async () => {
    await boot();
    expect(rtl.screen.getByText('Buy WAWU Credits')).toBeTruthy();
    expect(rtl.screen.getByText('Popular')).toBeTruthy();
    expect(rtl.screen.getByText('Best value')).toBeTruthy();
    // The popular pack is drawn chosen, as the board draws it.
    expect(rtl.screen.getByTestId('credits-pack-popular').props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByLabelText('23 naira 25 kobo')).toBeTruthy();
    expect(rtl.screen.getByLabelText('1,023 naira 25 kobo')).toBeTruthy();
    expect((await buyButton()).props.accessibilityLabel).toContain('Buy 120 credits · ₦1,023.25');
    // The old wording is not on the sheet.
    expect(rtl.screen.queryByText(/Fintava/)).toBeNull();
  });

  it('picking another pack asks for its quote and puts its total on the button', async () => {
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('credits-pack-pro'));
    await rtl.waitFor(() => expect(hub.quotes).toContain('pro'));
    await rtl.waitFor(async () => expect((await buyButton()).props.accessibilityLabel).toContain('Buy 300 credits · ₦2,023.25'));
  });

  it('a user buys 120 credits with the PIN: one purchase, then I29 says what was paid and what they have', async () => {
    const h = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByTestId('credits-added');
    expect(rtl.screen.getByText('120 credits added')).toBeTruthy();
    expect(rtl.screen.getByTestId('credits-added-line').props.children).toBe('Paid ₦1,023.25 from your Naira wallet. You have 168 credits.');
    expect(hub.buys).toHaveLength(1);
    expect(hub.buys[0].pin).toBe('4829');
    expect(hub.buys[0].body).toEqual({ pack: 'popular', expectedTotalKobo: 102_325, quoteToken: 'tok-popular-100000' });
    expect(hub.buys[0].key).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('credits-added-done'));
    expect(h.onClose).toHaveBeenCalledTimes(1);
    expect(h.onAdded).toHaveBeenCalledTimes(1);
  });
});

describe('the attacks I28 survives', () => {
  it('a double tap on Buy asks for one quote and opens one PIN sheet, and one purchase follows', async () => {
    await boot();
    const before = hub.quotes.length;
    let release: () => void = () => undefined;
    hub.holdQuote = new Promise<void>((resolve) => {
      release = resolve;
    });
    const button = await buyButton();
    await rtl.fireEvent.press(button);
    await rtl.fireEvent.press(button);
    release();
    await rtl.screen.findByText(/ for 120 credits$/);
    expect(hub.quotes.length - before).toBe(1);
    expect(rtl.screen.getAllByText(/ for 120 credits$/)).toHaveLength(1);
    await enterPin('4829');
    await rtl.screen.findByTestId('credits-added');
    expect(hub.payments).toBe(1);
    expect(hub.buys).toHaveLength(1);
  });

  it('a wrong PIN says so, moves nothing, and the right PIN then buys once', async () => {
    hub.wrongFirst = true;
    await boot();
    await reachPin();
    await enterPin('1111');
    await rtl.screen.findByText(/Wrong PIN/);
    expect(hub.payments).toBe(0);
    await enterPin('4829');
    await rtl.screen.findByTestId('credits-added');
    expect(hub.payments).toBe(1);
    expect(hub.buys).toHaveLength(2);
  });

  it('a wallet too short is told so before any PIN, with Add money, and nothing is bought', async () => {
    hub.balanceKobo = 50_000;
    const h = handlers();
    await render(<BuyCreditsSheet visible doneLabel="Back to chat" {...h} />);
    await rtl.screen.findByText(/Not enough in your Naira wallet/);
    expect(rtl.screen.queryByTestId('credits-buy')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByText(/^Add /));
    expect(h.onAddMoney).toHaveBeenCalledWith(52_325);
    expect(hub.buys).toHaveLength(0);
  });

  it('a purchase the Hub refuses for a short wallet after the PIN shows the bank balance and keeps the key free', async () => {
    hub.mode = 'short_on_pay';
    const h = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText(/Not enough in your Naira wallet/);
    expect(hub.payments).toBe(0);
    expect(h.onAddMoney).not.toHaveBeenCalled();
    // The bank's own figure is what the sheet now reads, and Add money asks for exactly the shortfall.
    await rtl.fireEvent.press(rtl.screen.getByText(/^Add /));
    expect(h.onAddMoney).toHaveBeenCalledWith(52_325);
  });

  it('an answer that never comes is followed by the SAME request, and the wallet is charged once', async () => {
    hub.mode = 'lost_after';
    await boot();
    await reachPin();
    await enterPin('4829');
    // The Hub took the payment and its answer was lost: the sheet asks for the PIN again, it does not say the purchase failed.
    await rtl.screen.findByText(/ for 120 credits$/);
    expect(hub.payments).toBe(1);
    await enterPin('4829');
    await rtl.screen.findByTestId('credits-added');
    expect(hub.payments).toBe(1);
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[1].key).toBe(hub.buys[0].key);
    expect(hub.buys[1].body).toEqual(hub.buys[0].body);
  });

  it('a lost answer, then the sheet closed and opened again, sends the same key and the same quote', async () => {
    hub.mode = 'lost_before';
    const first = await render(<BuyCreditsSheet visible doneLabel="Back to chat" {...handlers()} />);
    await rtl.screen.findByTestId('credits-total');
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText(/ for 120 credits$/);
    await first.unmount();
    const quotesBefore = hub.quotes.length;
    await render(<BuyCreditsSheet visible doneLabel="Back to chat" {...handlers()} />);
    await rtl.screen.findByTestId('credits-total');
    await rtl.fireEvent.press(await buyButton());
    await rtl.screen.findByText(/ for 120 credits$/);
    // A purchase already sent is asked again as it was: no new quote is made for it.
    expect(hub.quotes.length).toBe(quotesBefore);
    await enterPin('4829');
    await rtl.screen.findByTestId('credits-added');
    expect(hub.payments).toBe(1);
    expect(hub.buys[1].key).toBe(hub.buys[0].key);
  });

  it('a price that moved between the sheet and the tap is shown first and nothing is paid', async () => {
    await boot();
    hub.quotePrice = 120_000;
    await rtl.fireEvent.press(await buyButton());
    await rtl.screen.findByTestId('credits-notice');
    expect(rtl.screen.getByTestId('credits-notice').props.children).toBe('The price changed. Check the new total before you buy.');
    expect(hub.buys).toHaveLength(0);
    expect((await buyButton()).props.accessibilityLabel).toContain('Buy 120 credits · ₦1,223.25');
  });

  it('a purchase the Hub took and has not finished is read, never bought again, and I29 follows when it is paid', async () => {
    hub.mode = 'pending';
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('Still confirming');
    expect(hub.payments).toBe(1);
    await rtl.fireEvent.press(await rtl.screen.findByText('Refresh'));
    await rtl.screen.findByTestId('credits-added');
    expect(hub.payments).toBe(1);
    expect(hub.buys).toHaveLength(1);
  });

  it('a purchase that fails says why and buys nothing', async () => {
    hub.mode = 'failed';
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('The bank did not take it.');
    expect(rtl.screen.queryByTestId('credits-added')).toBeNull();
  });

  it('a person with no wallet is led to Open your wallet and the sheet closes', async () => {
    hub.quoteWallet = 'none';
    const h = handlers();
    await render(<BuyCreditsSheet visible doneLabel="Back to chat" {...h} />);
    await rtl.waitFor(() => expect(h.onOpenWallet).toHaveBeenCalledTimes(1));
    expect(h.onClose).toHaveBeenCalled();
    expect(hub.buys).toHaveLength(0);
  });
});
