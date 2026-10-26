/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Tipping from the feed (HOME-13): the rail's ₦ Tip, H26 (amount, note, breakdown), H27 (PIN) and H28 (Tip sent), on the real feed
 * with the Hub as a stand-in `fetch`. The stand-in answers in the Hub's shapes, records every quote and every payment (headers and
 * body), and answers a key it knows with the first payment, as the Hub does (`Idempotent-Replayed`), before it looks at the PIN.
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown, extra: Record<string, unknown> = {}) => json(200, { statusCode: 200, message: 'OK', data, ...extra });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const ME = '00000000-0000-4000-8000-0000000000aa';
const CREATOR = '00000000-0000-4000-8000-0000000000c1';
const TIP_ID = '77777777-7777-4777-8777-777777777777';
const FEE = 2325;
const tick = (verified: boolean) => ({ verified, expiresAt: null });

function item(id: string, creator: string, over: Record<string, unknown> = {}) {
  return {
    id,
    status: 'live',
    createdAt: '2026-10-01T00:00:00Z',
    title: `Title ${id}`,
    creatorWawuId: creator,
    slug: id,
    contentType: 'video',
    description: `Caption ${id}`,
    category: 'Creative',
    specializations: [],
    tags: [],
    accessType: 'free',
    price: 0,
    durationLabel: '1:50',
    pageCount: null,
    previewAssetUrl: `https://cdn.test/${id}.webm`,
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 340,
    likes: 12400,
    fullAssetUrl: `https://cdn.test/${id}-full.webm`,
    fullAssetLocked: false,
    likedByMe: false,
    savedByMe: false,
    followsCreator: false,
    shares: 0,
    creator: { wawuId: creator, displayName: 'Tife Adeola', handle: 'tife', avatarUrl: null, verification: { creator: tick(true), professional: tick(false) } },
    media: { contentId: id, contentType: 'video', durationLabel: '1:50', pageCount: null, frameCount: 0, frames: [] },
    ...over,
  };
}

const feedBody = (entries: unknown[]) => ok(entries, { pagination: { currentPage: 1, nextPage: null, perPage: 10, total: entries.length } });

type Mode = 'paid' | 'pending' | 'failed' | 'lost_before' | 'lost_after' | 'short_at_pay' | 'changed_at_pay' | 'no_wallet' | 'in_progress';
const hub = {
  mode: 'paid' as Mode,
  balanceKobo: 48_525_075,
  /** The fee the Hub quotes now; a test changes it between the sheet's quote and the tap. */
  feeKobo: FEE,
  quotes: [] as { amountKobo: number }[],
  pays: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Set<string>(),
  payments: 0,
  wrongFirst: false,
  quoteNoWallet: false,
  reads: 0,
  tipStatus: 'pending' as 'pending' | 'paid' | 'failed',
  /** PAY-FX: the quote carries the firm amount in a dollar account. */
  usd: false,
  /** Every request's path and the paying account it named (PAY-FX round 3: only the paying requests name one). */
  calls: [] as { path: string; account: string | null }[],
};

const quoteView = (amountKobo: number) => ({
  creator: { wawuUserId: CREATOR, displayName: 'Tife Adeola', handle: 'tife', avatarUrl: null, tick: 'creator' },
  amountKobo,
  payment: {
    kind: 'tip',
    targetId: CREATOR,
    title: 'Tip to Tife Adeola',
    payee: null,
    priceKobo: amountKobo,
    fee: { providerFeeKobo: hub.feeKobo, wawuFeeKobo: 0, totalFeeKobo: hub.feeKobo },
    totalKobo: amountKobo + hub.feeKobo,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: null,
    willBeHeld: false,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${amountKobo}-${hub.feeKobo}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
    ...(hub.usd
      ? {
          source: {
            currency: 'USD',
            decimals: 2,
            amountMinor: 23,
            providerFeeMinor: 0,
            wawuFeeMinor: 0,
            totalMinor: 23,
            rate: '0.000741',
            availableMinor: 500,
            shortfallMinor: 0,
            expiresAt: '2099-01-01T00:00:00.000Z',
          },
        }
      : {}),
  },
});

function tipView(status: 'pending' | 'paid' | 'failed', body: Record<string, unknown>) {
  const amountKobo = Number(body.amountKobo);
  return {
    id: TIP_ID,
    method: 'wallet',
    status,
    statusMessage: status === 'failed' ? 'Your tip did not go through and nothing left your wallet.' : null,
    creator: quoteView(amountKobo).creator,
    amountKobo,
    note: typeof body.note === 'string' ? body.note : null,
    payment: {
      id: 'pay-1',
      kind: 'tip',
      targetId: CREATOR,
      title: 'Tip to Tife Adeola',
      status: status === 'paid' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
      priceKobo: amountKobo,
      fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE },
      totalKobo: amountKobo + FEE,
      reference: 'WAW-TIP-8F2K91QX',
      hold: null,
      failureReason: status === 'failed' ? 'refused' : null,
      delivered: status === 'paid',
      statusMessage: null,
      createdAt: '2026-10-17T09:42:00.000Z',
      completedAt: status === 'paid' ? '2026-10-17T09:42:05.000Z' : null,
    },
    createdAt: '2026-10-17T09:42:00.000Z',
    paidAt: status === 'paid' ? '2026-10-17T09:42:05.000Z' : null,
  };
}

let lastBody: Record<string, unknown> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  hub.calls.push({ path, account: request.headers.get('x-pay-source-currency') });
  if (path === '/money/fx/accounts') return ok([]);
  if (path === '/feed/entries') {
    return feedBody([
      { kind: 'content', content: item('a', CREATOR) },
      { kind: 'content', content: item('own', ME) },
    ]);
  }
  if (path === '/users/me') return ok({ wawuUserId: ME });
  if (path.endsWith('/view')) return ok({ views: 1, counted: true });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === '/tips/wallet/quote' && method === 'GET') {
    const amountKobo = Number(url.searchParams.get('amountKobo'));
    hub.quotes.push({ amountKobo });
    if (hub.quoteNoWallet) return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    return ok(quoteView(amountKobo));
  }
  if (path === '/tips/wallet' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.pays.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    lastBody = body;
    // The Hub answers a key it knows with the first payment, before it looks at the PIN or the quote.
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: tipView(hub.tipStatus, body) });
    if (hub.wrongFirst && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'no_wallet') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.mode === 'short_at_pay') {
      return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 150_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 150_000 });
    }
    if (hub.mode === 'changed_at_pay') {
      hub.feeKobo = 3000;
      return refuse(409, { code: 'quote_changed', message: 'The price changed.', paymentQuote: quoteView(Number(body.amountKobo)).payment });
    }
    if (hub.mode === 'in_progress') return refuse(409, { code: 'payment_in_progress', message: 'Still confirming.' });
    if (hub.mode === 'lost_before' && hub.pays.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      // The Hub took the payment and its answer never arrives.
      hub.paidKeys.add(key);
      hub.payments += 1;
      hub.tipStatus = 'paid';
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    hub.paidKeys.add(key);
    hub.payments += 1;
    hub.tipStatus = hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'paid';
    return json(201, { statusCode: 201, message: 'Created', data: tipView(hub.tipStatus, body) });
  }
  if (path === `/tips/wallet/${TIP_ID}` && method === 'GET') {
    hub.reads += 1;
    return ok(tipView(hub.tipStatus, lastBody));
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

const clients: QueryClient[] = [];

const wired = () => ({ onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function boot(pay: ReturnType<typeof wired> | null = wired()) {
  const { FeedScreen } = require('@/features/feed/FeedScreen') as typeof import('@/features/feed/FeedScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const screen = await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <FeedScreen pay={pay ?? undefined} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  await rtl.act(async () => {
    rtl.fireEvent(screen.getByTestId('feed'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 754 } } });
  });
  await screen.findByTestId('post-a');
  return screen;
}

const { clearAttempts } = require('@/features/feedpay/usePaymentFlow') as typeof import('@/features/feedpay/usePaymentFlow');

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await boot();
  warm.unmount();
}, 120_000);

beforeEach(() => {
  clearAttempts();
  Object.assign(hub, {
    mode: 'paid',
    balanceKobo: 48_525_075,
    feeKobo: FEE,
    quotes: [],
    pays: [],
    paidKeys: new Set<string>(),
    payments: 0,
    wrongFirst: false,
    quoteNoWallet: false,
    reads: 0,
    tipStatus: 'pending',
    usd: false,
    calls: [],
  });
  (require('@/api/paySource') as typeof import('@/api/paySource')).clearPaySource();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

const tipButton = () => rtl.screen.findByRole('button', { name: /^Tip ₦/ });

/** Opens H26 from the rail and waits for the breakdown of the chosen amount. */
async function openSheet() {
  const screen = await boot();
  await rtl.fireEvent.press(screen.getByTestId('tip-a'));
  await screen.findByTestId('tip-sheet');
  await tipButton();
  return screen;
}

describe('H2 and H26: the rail and the tip sheet', () => {
  it("draws ₦ Tip on a post that is not the viewer's own", async () => {
    const screen = await boot();
    expect(screen.getByTestId('tip-a')).toBeTruthy();
    expect(screen.queryByTestId('tip-own')).toBeNull();
  });

  it('draws no Tip at all when the feed has nowhere to lead (R-47)', async () => {
    const screen = await boot(null);
    expect(screen.queryByTestId('tip-a')).toBeNull();
  });

  it('a user sees Tip Tife, ₦2,000 chosen, the breakdown from the Hub\'s quote, and the button "Tip ₦2,023.25"', async () => {
    const screen = await openSheet();
    expect(screen.getByText('Tip Tife')).toBeTruthy();
    expect(screen.getByText('Goes straight to their wallet. They see your name and note.')).toBeTruthy();
    expect(screen.getByTestId('tip-chip-200000').props.accessibilityState.selected).toBe(true);
    expect(hub.quotes).toEqual([{ amountKobo: 200000 }]);
    const rows = screen.getByTestId('tip-breakdown');
    expect(rtl.within(rows).getByLabelText('2,000 naira')).toBeTruthy();
    expect(rtl.within(rows).getByText('Bank charge')).toBeTruthy();
    expect(rtl.within(rows).getByLabelText('23 naira 25 kobo')).toBeTruthy();
    expect(rtl.within(rows).getByLabelText('2,023 naira 25 kobo')).toBeTruthy();
    expect(screen.queryByText(/Dollar|USDT/)).toBeNull();
    expect(screen.queryByText(/Fintava/)).toBeNull();
  });

  it('another quick amount, and any other whole-naira amount, are quoted again', async () => {
    const screen = await openSheet();
    await rtl.fireEvent.press(screen.getByTestId('tip-chip-500000'));
    await rtl.waitFor(() => expect(hub.quotes.at(-1)).toEqual({ amountKobo: 500000 }));
    await rtl.fireEvent.changeText(screen.getByTestId('tip-other'), '1,250');
    await rtl.waitFor(() => expect(hub.quotes.at(-1)).toEqual({ amountKobo: 125000 }));
    expect(await screen.findByRole('button', { name: 'Tip ₦1,273.25' })).toBeTruthy();
    // A typed amount clears the quick one.
    expect(screen.getByTestId('tip-chip-500000').props.accessibilityState.selected).toBe(false);
  });

  it('a pasted 12.50 is quoted and shown as 12 naira (a tip is whole naira), never 1,250', async () => {
    const screen = await openSheet();
    await rtl.fireEvent.changeText(screen.getByTestId('tip-other'), '12.50');
    await rtl.waitFor(() => expect(hub.quotes.at(-1)).toEqual({ amountKobo: 1200 }));
    expect(await screen.findByRole('button', { name: 'Tip ₦35.25' })).toBeTruthy();
    expect(screen.getByTestId('tip-other').props.value).toBe('12');
    expect(hub.quotes.some((q) => q.amountKobo === 125000 || q.amountKobo === 120000)).toBe(false);
  });

  it('with no wallet yet, the quote leads to Open your wallet and no sheet stays up (R-6)', async () => {
    hub.quoteNoWallet = true;
    const pay = wired();
    const screen = await boot(pay);
    await rtl.fireEvent.press(screen.getByTestId('tip-a'));
    await rtl.waitFor(() => expect(pay.onOpenWallet).toHaveBeenCalledTimes(1));
    await rtl.waitFor(() => expect(screen.queryByTestId('tip-sheet')).toBeNull());
  });
});

describe('H26 to H28: paying', () => {
  it('a user taps Tip, approves with the PIN, and sees "₦2,000 sent to Tife", the note, and Total paid ₦2,023.25; Done returns to the feed', async () => {
    const screen = await openSheet();
    await rtl.fireEvent.changeText(screen.getByTestId('tip-note'), 'That orbit shot is clean.');
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText('Approve ₦2,023.25 to Tife Adeola');
    await enterPin('4829');
    await screen.findByText('₦2,000 sent to Tife');
    expect(screen.getByText('"That orbit shot is clean."')).toBeTruthy();
    expect(rtl.within(screen.getByTestId('tip-total-paid')).getByLabelText('2,023 naira 25 kobo')).toBeTruthy();
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].key).toMatch(/[0-9a-f-]{36}/);
    expect(hub.pays[0].body).toEqual({
      creatorWawuId: CREATOR,
      amountKobo: 200000,
      note: 'That orbit shot is clean.',
      expectedTotalKobo: 202325,
      quoteToken: `tok-200000-${FEE}`,
    });
    await rtl.fireEvent.press(screen.getByTestId('tip-done'));
    await rtl.waitFor(() => expect(screen.queryByTestId('tip-sent')).toBeNull());
  });

  it('asks for a fresh quote on every tap of Tip, before the PIN', async () => {
    const screen = await openSheet();
    expect(hub.quotes).toHaveLength(1);
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    expect(hub.quotes).toHaveLength(2);
  });

  it('a double tap on Tip asks once and opens one PIN sheet; a double PIN pays once', async () => {
    const screen = await openSheet();
    const button = await tipButton();
    await rtl.act(async () => {
      rtl.fireEvent.press(button);
      rtl.fireEvent.press(button);
    });
    await screen.findByText(/^Approve /);
    expect(hub.quotes).toHaveLength(2);
    await enterPin('4829');
    await screen.findByText('₦2,000 sent to Tife');
    expect(hub.pays).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('a wrong PIN moves nothing and the same key and quote go again with the right one: one payment', async () => {
    hub.wrongFirst = true;
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('1111');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    await screen.findByText(/4 tries left|Wrong PIN/);
    await enterPin('4829');
    await screen.findByText('₦2,000 sent to Tife');
    expect(hub.pays).toHaveLength(2);
    expect(hub.payments).toBe(1);
    expect(hub.pays[1].body.quoteToken).toBe(hub.pays[0].body.quoteToken);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
  });

  it('a request that got no answer is sent again with the SAME key and the SAME quote, never a new quote: one payment', async () => {
    hub.mode = 'lost_after';
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    const asked = hub.quotes.length;
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    // The line says the payment may have gone through and that the retry happens once (SWEEP-APP-3, SWEEP-APP-2 #1).
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    await enterPin('4829');
    await screen.findByText('₦2,000 sent to Tife');
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
    expect(hub.quotes).toHaveLength(asked);
    expect(hub.payments).toBe(1);
  });

  it('closing the sheet after a lost answer and tipping again sends the same key, not a new one', async () => {
    hub.mode = 'lost_after';
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    // The person closes everything and comes back to tip the same amount.
    await rtl.fireEvent.press(await screen.findByTestId('sheet-close'));
    await rtl.fireEvent.press(await screen.findByTestId('tip-sheet-close'));
    await rtl.waitFor(() => expect(screen.queryByTestId('tip-sheet')).toBeNull());
    await rtl.fireEvent.press(screen.getByTestId('tip-a'));
    await tipButton();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText('₦2,000 sent to Tife');
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.payments).toBe(1);
  });

  it('a wallet too low for the total shows Not enough in your Naira wallet with the shortfall, and no PIN', async () => {
    hub.balanceKobo = 150_000;
    const pay = wired();
    const screen = await boot(pay);
    await rtl.fireEvent.press(screen.getByTestId('tip-a'));
    await screen.findByText('Not enough in your Naira wallet');
    expect(screen.getByText('This costs ₦2,023.25. You have ₦1,500.00.')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByText('Add ₦523.25'));
    expect(pay.onAddMoney).toHaveBeenCalledWith(52325);
    expect(hub.pays).toHaveLength(0);
  });

  it('a wallet that turns out short at the payment shows the bank\'s figures and moves nothing', async () => {
    hub.mode = 'short_at_pay';
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText('Not enough in your Naira wallet');
    expect(screen.getByText('This costs ₦2,023.25. You have ₦1,500.00.')).toBeTruthy();
    expect(hub.payments).toBe(0);
  });

  it('a total that moved before the PIN is shown and NOT paid; the next tap pays the new total', async () => {
    const screen = await openSheet();
    expect(await screen.findByRole('button', { name: 'Tip ₦2,023.25' })).toBeTruthy();
    hub.feeKobo = 3000;
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText('The price changed');
    expect(await screen.findByRole('button', { name: 'Tip ₦2,030' })).toBeTruthy();
    expect(screen.queryByText(/^Approve /)).toBeNull();
    expect(hub.pays).toHaveLength(0);
    await rtl.fireEvent.press(await screen.findByRole('button', { name: 'Tip ₦2,030' }));
    await screen.findByText('Approve ₦2,030 to Tife Adeola');
    await enterPin('4829');
    await screen.findByText('₦2,000 sent to Tife');
    expect(hub.pays[0].body.expectedTotalKobo).toBe(203000);
  });

  it('a quote the Hub refuses at the payment (quote_changed) pays nothing and shows the new total', async () => {
    hub.mode = 'changed_at_pay';
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText('The price changed');
    expect(await screen.findByRole('button', { name: 'Tip ₦2,030' })).toBeTruthy();
    expect(hub.payments).toBe(0);
  });

  it('a tip the Hub took and has not finished shows Still confirming, is read (never paid again), and ends on Tip sent', async () => {
    hub.mode = 'pending';
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText('Still confirming');
    hub.tipStatus = 'paid';
    await rtl.fireEvent.press(await screen.findByText('Refresh'));
    await screen.findByText('₦2,000 sent to Tife');
    expect(hub.pays).toHaveLength(1);
    expect(hub.reads).toBeGreaterThan(0);
  });

  it('a tip the Hub refused says so in its words and nothing is sent again', async () => {
    hub.mode = 'failed';
    const screen = await openSheet();
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText("Payment didn't go through");
    expect(screen.getByText('Your tip did not go through and nothing left your wallet.')).toBeTruthy();
    expect(hub.pays).toHaveLength(1);
  });

  it('with no wallet at the payment, leads to Open your wallet', async () => {
    hub.mode = 'no_wallet';
    const pay = wired();
    const screen = await boot(pay);
    await rtl.fireEvent.press(screen.getByTestId('tip-a'));
    await screen.findByTestId('tip-sheet');
    await rtl.fireEvent.press(await tipButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await rtl.waitFor(() => expect(pay.onOpenWallet).toHaveBeenCalledTimes(1));
  });
});


describe('PAY-FX (R-91): the tip sheet for a buyer paying from a dollar account', () => {
  it('names the account and the firm amount before the PIN, never a naira total or "Checking your balance"', async () => {
    hub.usd = true;
    hub.balanceKobo = 0;
    // A buyer with no naira wallet (R-87): the layout reads that once and every payment starts from the main currency.
    (require('@/api/paySource') as typeof import('@/api/paySource')).setPaySourceDefaults({ fallback: 'USD', hasNaira: false });
    const screen = await boot();
    await rtl.fireEvent.press(screen.getByTestId('tip-a'));
    await screen.findByTestId('tip-sheet');
    await screen.findByTestId('source-total');
    const rows = screen.getByTestId('tip-breakdown');
    // The naira tip stays; the account and the firm amount come from the one piece the pay sheet draws.
    expect(rtl.within(rows).getByLabelText('2,000 naira')).toBeTruthy();
    expect(rtl.within(rows).getByText('Pay from')).toBeTruthy();
    expect(rtl.within(rows).getByText('USD account')).toBeTruthy();
    expect(rtl.within(rows).getAllByText('$0.23').length).toBe(2);
    expect(screen.queryByText('Checking your balance')).toBeNull();
    expect(screen.queryByText('Pay from wallet')).toBeNull();
    expect(screen.queryByText('Bank charge')).toBeNull();
    // The button says what leaves the account, in its currency, with its sign.
    await rtl.fireEvent.press(await screen.findByRole('button', { name: 'Tip $0.23' }));
    // The PIN sheet says the same amount, not the naira.
    await screen.findByText('Approve $0.23 to Tife Adeola');
    expect(screen.queryByText(/Approve ₦/)).toBeNull();
  });

  it('names the account on the quote and on nothing else; a naira buyer never asks for the other accounts', async () => {
    hub.usd = true;
    // A buyer with no naira wallet (R-87): the layout reads that once and every payment starts from the main currency.
    (require('@/api/paySource') as typeof import('@/api/paySource')).setPaySourceDefaults({ fallback: 'USD', hasNaira: false });
    const screen = await boot();
    await rtl.fireEvent.press(screen.getByTestId('tip-a'));
    await screen.findByTestId('source-total');
    const named = hub.calls.filter((c) => c.account !== null).map((c) => c.path);
    expect(named.length).toBeGreaterThan(0);
    expect(named.every((p) => p === '/tips/wallet/quote')).toBe(true);
    expect(hub.calls.filter((c) => c.path === '/feed/entries').every((c) => c.account === null)).toBe(true);
  });

  it('a person with only a naira wallet that covers the tip never fetches the other accounts or names an account', async () => {
    const screen = await openSheet();
    expect(screen.queryByTestId('source-total')).toBeNull();
    expect(hub.calls.some((c) => c.path === '/money/fx/accounts')).toBe(false);
    expect(hub.calls.every((c) => c.account === null)).toBe(true);
  });
});
