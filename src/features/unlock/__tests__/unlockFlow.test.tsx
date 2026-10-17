/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Unlocking from the feed (HOME-12): the offer bar, H14 (the pay sheet), H15 (PIN), H16 (Unlocked), H17 (not enough) and H18 (paid,
 * still opening), on the real feed with the Hub as a stand-in `fetch`. The stand-in answers in the Hub's shapes, records every quote and
 * payment (headers and body), and answers a key it knows with the first payment before it looks at the PIN, as the Hub does.
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown, extra: Record<string, unknown> = {}) => json(200, { statusCode: 200, message: 'OK', data, ...extra });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const ME = '00000000-0000-4000-8000-0000000000aa';
const CREATOR = '00000000-0000-4000-8000-0000000000c1';
const PIECE = 'piece-1';
const PAYMENT = '88888888-8888-4888-8888-888888888888';
const PRICE = 250000;
const FEE = 2325;
const tick = (verified: boolean) => ({ verified, expiresAt: null });

const lockedItem = () => ({
  id: PIECE,
  status: 'live',
  createdAt: '2026-10-01T00:00:00Z',
  title: 'How I built a ₦2M a month agency',
  creatorWawuId: CREATOR,
  slug: PIECE,
  contentType: 'video',
  description: 'The full lesson.',
  category: 'Business',
  specializations: [],
  tags: [],
  accessType: 'paid',
  price: 2500,
  durationLabel: '18:04',
  pageCount: null,
  previewAssetUrl: 'https://cdn.test/preview.webm',
  creatorFirstUploadFree: false,
  views: 0,
  ratingPct: null,
  commentCount: 340,
  likes: 21000,
  fullAssetUrl: null,
  fullAssetLocked: true,
  likedByMe: false,
  savedByMe: false,
  followsCreator: false,
  shares: 0,
  creator: { wawuId: CREATOR, displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: tick(true), professional: tick(false) } },
  media: { contentId: PIECE, contentType: 'video', durationLabel: '18:04', pageCount: null, frameCount: 0, frames: [] },
});

type Mode = 'paid' | 'pending' | 'opening' | 'refunded' | 'lost_after' | 'short_at_pay' | 'no_wallet';
const hub = {
  mode: 'paid' as Mode,
  balanceKobo: 48_525_075,
  feeKobo: FEE,
  quotes: 0,
  pays: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Set<string>(),
  payments: 0,
  wrongFirst: false,
  quoteNoWallet: false,
  reads: 0,
  state: 'pending' as 'pending' | 'opening' | 'paid' | 'refunded',
};

const quoteView = () => ({
  contentId: PIECE,
  title: 'How I built a ₦2M a month agency',
  creator: { wawuUserId: CREATOR, displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, tick: 'creator' },
  priceKobo: PRICE,
  payment: {
    kind: 'content_unlock',
    targetId: PIECE,
    title: 'How I built a ₦2M a month agency',
    payee: null,
    priceKobo: PRICE,
    fee: { providerFeeKobo: hub.feeKobo, wawuFeeKobo: 0, totalFeeKobo: hub.feeKobo },
    totalKobo: PRICE + hub.feeKobo,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: null,
    willBeHeld: false,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${hub.feeKobo}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
});

function unlockView(state: typeof hub.state) {
  const paid = state === 'paid';
  return {
    id: PAYMENT,
    method: 'wallet',
    contentId: PIECE,
    title: 'How I built a ₦2M a month agency',
    status: paid ? 'paid' : state === 'refunded' ? 'refunded' : 'pending',
    statusMessage: state === 'refunded' ? 'This piece was taken down before it opened. Your ₦2,500 is back in your wallet; the ₦23.25 charge is not refunded.' : null,
    priceKobo: PRICE,
    purchased: paid,
    fullAssetUrl: paid ? 'https://cdn.test/full.webm' : null,
    payment: {
      id: PAYMENT,
      kind: 'content_unlock',
      targetId: PIECE,
      title: 'How I built a ₦2M a month agency',
      status: paid ? 'completed' : state === 'opening' ? 'completed' : state === 'refunded' ? 'reversed' : 'pending',
      priceKobo: PRICE,
      fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE },
      totalKobo: PRICE + FEE,
      reference: 'WAW-UNL-4K2P',
      hold: null,
      failureReason: null,
      delivered: paid,
      statusMessage: null,
      createdAt: '2026-10-17T09:42:00.000Z',
      completedAt: paid ? '2026-10-17T09:42:05.000Z' : null,
    },
    createdAt: '2026-10-17T09:42:00.000Z',
    paidAt: paid ? '2026-10-17T09:42:05.000Z' : null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/feed/entries') {
    return ok([{ kind: 'content', content: lockedItem() }], { pagination: { currentPage: 1, nextPage: null, perPage: 10, total: 1 } });
  }
  if (path === '/users/me') return ok({ wawuUserId: ME });
  if (path.endsWith('/view')) return ok({ views: 1, counted: true });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === `/content/${PIECE}/media`) return ok({ contentId: PIECE, contentType: 'video', durationLabel: '18:04', pageCount: null, frameCount: 0, frames: [] });
  if (path === `/content/${PIECE}/unlock/wallet/quote`) {
    hub.quotes += 1;
    if (hub.quoteNoWallet) return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    return ok(quoteView());
  }
  if (path === `/content/${PIECE}/unlock/wallet` && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.pays.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: unlockView(hub.state) });
    if (hub.wrongFirst && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'no_wallet') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.mode === 'short_at_pay') {
      return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 120_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 120_000 });
    }
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      hub.paidKeys.add(key);
      hub.payments += 1;
      hub.state = 'paid';
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    hub.paidKeys.add(key);
    hub.payments += 1;
    hub.state = hub.mode === 'pending' ? 'pending' : hub.mode === 'opening' ? 'opening' : hub.mode === 'refunded' ? 'refunded' : 'paid';
    return json(201, { statusCode: 201, message: 'Created', data: unlockView(hub.state) });
  }
  if (path === `/content/${PIECE}/unlock/wallet/${PAYMENT}` && method === 'GET') {
    hub.reads += 1;
    return ok(unlockView(hub.state));
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
  await screen.findByTestId(`post-${PIECE}`);
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
  Object.assign(hub, { mode: 'paid', balanceKobo: 48_525_075, feeKobo: FEE, quotes: 0, pays: [], paidKeys: new Set<string>(), payments: 0, wrongFirst: false, quoteNoWallet: false, reads: 0, state: 'pending' });
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

const unlockButton = () => rtl.screen.findByRole('button', { name: /^Unlock · ₦/ });

/** Opens H14 from the offer bar and waits for the pay button. */
async function openSheet() {
  const screen = await boot();
  await rtl.fireEvent.press(screen.getByTestId(`offer-${PIECE}`));
  await unlockButton();
  return screen;
}

async function reachPin() {
  const screen = await openSheet();
  await rtl.fireEvent.press(await unlockButton());
  await screen.findByText(/^Approve /);
  return screen;
}

describe('H3 to H5 and H14: the offer bar and the unlock sheet', () => {
  it('a user taps the offer bar and sees the piece, the price, the bank\'s charge, the total and "Unlock · ₦2,523.25"', async () => {
    const screen = await openSheet();
    expect(hub.quotes).toBe(1);
    expect(screen.getByText('How I built a ₦2M a month agency')).toBeTruthy();
    expect(screen.getByText(/Video · 18 min/)).toBeTruthy();
    expect(screen.getByText('Bank charge')).toBeTruthy();
    expect(screen.getAllByLabelText('2,500 naira')).toHaveLength(2); // the offer bar's chip and the sheet's Price row
    expect(screen.getByLabelText('23 naira 25 kobo')).toBeTruthy();
    expect(screen.getByLabelText('2,523 naira 25 kobo')).toBeTruthy();
    expect(screen.getByText('Pay from wallet')).toBeTruthy();
    expect(screen.queryByText(/Fintava|Forever/)).toBeNull();
  });

  it('the offer bar starts nothing when the feed has nowhere to lead (R-47)', async () => {
    const screen = await boot(null);
    expect(screen.queryByRole('button', { name: /Unlock the full video/ })).toBeNull();
    expect(screen.getByTestId(`offer-${PIECE}`)).toBeTruthy();
  });

  it('with no wallet yet, the quote leads to Open your wallet and no sheet stays up (R-6)', async () => {
    hub.quoteNoWallet = true;
    const pay = wired();
    const screen = await boot(pay);
    await rtl.fireEvent.press(screen.getByTestId(`offer-${PIECE}`));
    await rtl.waitFor(() => expect(pay.onOpenWallet).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/^Unlock · /)).toBeNull();
  });

  it('a double tap on the offer bar asks for one quote', async () => {
    const screen = await boot();
    const bar = screen.getByTestId(`offer-${PIECE}`);
    await rtl.act(async () => {
      rtl.fireEvent.press(bar);
      rtl.fireEvent.press(bar);
    });
    await unlockButton();
    expect(hub.quotes).toBe(1);
  });
});

describe('H14 to H18: paying', () => {
  it('a user pays with the PIN and sees Unlocked, what was paid, from where and the reference; Watch now opens the whole piece in place', async () => {
    const screen = await reachPin();
    expect(hub.quotes).toBe(2); // a fresh quote on the tap of Pay, before the PIN
    expect(screen.getByText('Approve ₦2,523.25 to Chidi Eze')).toBeTruthy();
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(screen.getByText("The full 18 minutes are yours, and it's in My purchases from now on.")).toBeTruthy();
    const receipt = rtl.within(screen.getByTestId('unlock-receipt'));
    expect(receipt.getByLabelText('2,523 naira 25 kobo')).toBeTruthy();
    expect(receipt.getByText('Naira wallet')).toBeTruthy();
    expect(receipt.getByText('WAW-UNL-4K2P')).toBeTruthy();
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].key).toMatch(/[0-9a-f-]{36}/);
    expect(hub.pays[0].body).toEqual({ expectedTotalKobo: PRICE + FEE, quoteToken: `tok-${FEE}` });
    // The post is locked until Watch now; then it is not, in the feed's own data.
    expect(screen.queryByTestId('offer-piece-1')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByTestId('unlock-open'));
    await rtl.waitFor(() => expect(screen.queryByTestId(`offer-${PIECE}`)).toBeNull());
    expect(screen.queryByText('Unlocked')).toBeNull();
    expect(screen.getByTestId(`pill-${PIECE}`)).toBeTruthy();
    expect(rtl.within(screen.getByTestId(`pill-${PIECE}`)).getByText('Video · 18 min')).toBeTruthy();
  });

  it('a double PIN pays once', async () => {
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(hub.pays).toHaveLength(1);
    expect(hub.payments).toBe(1);
  });

  it('a wrong PIN moves nothing and the same key and quote go again with the right one: one payment', async () => {
    hub.wrongFirst = true;
    const screen = await reachPin();
    await enterPin('1111');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    await screen.findByText(/4 tries left|Wrong PIN/);
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(hub.pays).toHaveLength(2);
    expect(hub.payments).toBe(1);
    expect(hub.pays[1].body.quoteToken).toBe(hub.pays[0].body.quoteToken);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
  });

  it('a request that got no answer is sent again with the SAME key and quote, never a new quote: one payment', async () => {
    hub.mode = 'lost_after';
    const screen = await reachPin();
    const asked = hub.quotes;
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
    expect(hub.quotes).toBe(asked);
    expect(hub.payments).toBe(1);
  });

  it('a wallet too low for the total shows Not enough with the shortfall, Add leads to the wallet, and no PIN is asked', async () => {
    hub.balanceKobo = 120_000;
    const pay = wired();
    const screen = await boot(pay);
    await rtl.fireEvent.press(screen.getByTestId(`offer-${PIECE}`));
    await screen.findByText('Not enough in your Naira wallet');
    expect(screen.getByText('This costs ₦2,523.25. You have ₦1,200.00.')).toBeTruthy();
    expect(screen.getByText('Add ₦1,323.25')).toBeTruthy();
    await rtl.fireEvent.press(screen.getByText('Add ₦1,323.25'));
    expect(pay.onAddMoney).toHaveBeenCalledWith(132325);
    expect(hub.pays).toHaveLength(0);
  });

  it('a wallet that turns out short at the payment shows the bank\'s figures and moves nothing', async () => {
    hub.mode = 'short_at_pay';
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText('Not enough in your Naira wallet');
    expect(screen.getByText('This costs ₦2,523.25. You have ₦1,200.00.')).toBeTruthy();
    expect(hub.payments).toBe(0);
  });

  it('a price that moved before the PIN is shown, NOT paid, and the next tap pays the new total', async () => {
    const screen = await openSheet();
    hub.feeKobo = 3000;
    await rtl.fireEvent.press(await unlockButton());
    await screen.findByText('The price changed');
    expect(hub.pays).toHaveLength(0);
    expect(screen.queryByText(/^Approve /)).toBeNull();
    await rtl.fireEvent.press(screen.getByText('Try again'));
    await rtl.fireEvent.press(await screen.findByRole('button', { name: 'Unlock · ₦2,530' }));
    await screen.findByText('Approve ₦2,530 to Chidi Eze');
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(hub.pays[0].body.expectedTotalKobo).toBe(PRICE + 3000);
  });

  it('a payment the Hub took and has not finished shows Still confirming, is only read, and ends on Unlocked', async () => {
    hub.mode = 'pending';
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText('Still confirming');
    hub.state = 'paid';
    await rtl.fireEvent.press(await screen.findByText('Refresh'));
    await screen.findByText('Unlocked');
    expect(hub.pays).toHaveLength(1);
    expect(hub.reads).toBeGreaterThan(0);
  });

  it('when the money has left and the opening is not finished, H18 says so with the total and Refresh; it ends on Unlocked', async () => {
    hub.mode = 'opening';
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText('Paid, still opening');
    expect(screen.getByText("₦2,523.25 left your wallet and we couldn't finish opening the video. You won't be charged twice.")).toBeTruthy();
    expect(screen.queryByText('Contact support')).toBeNull(); // SUPPORT-01 adds it (R-47)
    hub.state = 'paid';
    await rtl.fireEvent.press(await screen.findByText('Refresh'));
    await screen.findByText('Unlocked');
    expect(hub.pays).toHaveLength(1);
  });

  it('a piece taken down meanwhile is refunded by the Hub: its words are shown, the post stays locked and nothing is sent again', async () => {
    hub.mode = 'refunded';
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText("Payment didn't go through");
    expect(screen.getByText(/taken down before it opened/)).toBeTruthy();
    expect(hub.pays).toHaveLength(1);
    expect(screen.queryByText('Unlocked')).toBeNull();
    expect(screen.getByTestId(`offer-${PIECE}`)).toBeTruthy();
  });

  it('with no wallet at the payment, leads to Open your wallet', async () => {
    hub.mode = 'no_wallet';
    const pay = wired();
    const screen = await boot(pay);
    await rtl.fireEvent.press(screen.getByTestId(`offer-${PIECE}`));
    await rtl.fireEvent.press(await unlockButton());
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await rtl.waitFor(() => expect(pay.onOpenWallet).toHaveBeenCalledTimes(1));
  });
});
