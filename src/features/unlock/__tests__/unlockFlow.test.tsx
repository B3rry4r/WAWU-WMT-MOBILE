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
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, router: { push: (...args: unknown[]) => mockPush(...args) } }));

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
  contentType: hub.kind,
  description: 'The full lesson.',
  category: 'Business',
  specializations: [],
  tags: [],
  accessType: 'paid',
  price: 2500,
  durationLabel: '18:04',
  pageCount: null,
  previewAssetUrl: hub.preview,
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
  media: { contentId: PIECE, contentType: hub.kind, durationLabel: hub.kind === 'video' ? '18:04' : null, pageCount: null, frameCount: 0, frames: [] },
});

type Mode = 'paid' | 'pending' | 'opening' | 'refunded' | 'lost_after' | 'short_at_pay' | 'no_wallet';
type Kind = 'video' | 'course' | 'template';
const hub = {
  /** What the feed's one post is (HOME-07: a course or a template is unlocked from the feed as a video is). */
  kind: 'video' as Kind,
  /** The piece's preview file: a clip for a video, a picture for a template (R2-SOCIAL: H14's thumbnail). */
  preview: 'https://cdn.test/preview.webm',
  mode: 'paid' as Mode,
  balanceKobo: 48_525_075,
  feeKobo: FEE,
  quotes: 0,
  pays: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Set<string>(),
  payments: 0,
  wrongFirst: false,
  quoteNoWallet: false,
  /** FIX-101 H-A: the creator has no display name (every new creator starts without one) and no handle. */
  nameless: false as false | 'none' | 'handle',
  reads: 0,
  /** What POST /support/thread was sent (SUPPORT-01), and whether the Hub refuses it. */
  support: [] as Record<string, unknown>[],
  supportRefused: false,
  /** While set, POST /support/thread waits for it. */
  supportHold: null as null | Promise<void>,
  state: 'pending' as 'pending' | 'opening' | 'paid' | 'refunded',
  /** PAY-FX: the buyer pays from a dollar account (the quote and the payment carry the Hub's `source`). */
  usd: false,
};

const USD_QUOTE = { currency: 'USD', decimals: 2, amountMinor: 23, providerFeeMinor: 0, wawuFeeMinor: 0, totalMinor: 23, rate: '0.000741', availableMinor: 500, shortfallMinor: 0, expiresAt: '2099-01-01T00:00:00.000Z' };
const USD_PAID = { currency: 'USD', decimals: 2, amountMinor: 23, providerFeeMinor: 0, wawuFeeMinor: 0, totalMinor: 23, rate: '0.000741', refundedMinor: null };

const quoteView = () => ({
  contentId: PIECE,
  title: 'How I built a ₦2M a month agency',
  creator: { wawuUserId: CREATOR, displayName: hub.nameless ? '' : 'Chidi Eze', handle: hub.nameless === 'none' ? null : 'chidi', avatarUrl: null, tick: 'creator' },
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
    ...(hub.usd ? { source: USD_QUOTE } : {}),
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
      ...(hub.usd ? { source: USD_PAID } : {}),
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
    // The Hub's own feed opens the piece once the unlock is paid, which is what the app's refresh after a payment reads (SWEEP-FLOWS B2).
    const item = lockedItem();
    const opened = hub.mode === 'paid' && hub.pays.length > 0;
    return ok([{ kind: 'content', content: opened ? { ...item, fullAssetLocked: false, fullAssetUrl: 'https://cdn.test/full.webm' } : item }], { pagination: { currentPage: 1, nextPage: null, perPage: 10, total: 1 } });
  }
  if (path === '/users/me') return ok({ wawuUserId: ME });
  if (path === '/money/fx/accounts') return ok([]);
  if (path.endsWith('/view')) return ok({ views: 1, counted: true });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === `/content/${PIECE}/media`) return ok({ contentId: PIECE, contentType: hub.kind, durationLabel: hub.kind === 'video' ? '18:04' : null, pageCount: null, frameCount: 0, frames: [] });
  if (path === `/content/${PIECE}/detail`) {
    // A course's post reads its lessons here (HOME-07); nothing else asks.
    return ok({
      contentId: PIECE,
      contentType: 'course',
      updatedAt: '',
      purchasedAt: null,
      buyerCount: 0,
      studentCount: 1280,
      freePreview: { pages: null, seconds: null, lessons: 1 },
      lessons: Array.from({ length: 12 }, (_, i) => ({ id: `l${i}`, title: `Lesson ${i + 1}`, order: i + 1, durationLabel: null, isFree: i === 0 })),
      rating: { average: null, count: 0, myRating: null, canRate: false, cannotRateReason: 'not_purchased' },
    });
  }
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
  if (path === '/support/thread' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.support.push(body);
    if (hub.supportHold) await hub.supportHold;
    if (hub.supportRefused) return refuse(404, { message: 'We could not find that payment.' });
    return ok({ chatId: '00000000-0000-4000-8000-0000000000c9', reference: body.reference ?? null, messageId: 'message-1' });
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
  Object.assign(hub, { kind: 'video', preview: 'https://cdn.test/preview.webm', mode: 'paid', balanceKobo: 48_525_075, feeKobo: FEE, quotes: 0, pays: [], paidKeys: new Set<string>(), payments: 0, wrongFirst: false, quoteNoWallet: false, nameless: false, reads: 0, support: [], supportRefused: false, supportHold: null, state: 'pending', usd: false });
  (require('@/api/paySource') as typeof import('@/api/paySource')).clearPaySource();
  mockPush.mockClear();
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

/** The offer bar, then the sheet, for a buyer whose first button is a dollar one. */
async function openSheet2() {
  const screen = await boot();
  await rtl.fireEvent.press(screen.getByTestId(`offer-${PIECE}`));
  await screen.findByRole('button', { name: /^Unlock · \$0\.23$/ });
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
    // FIX-110 (G-1723): H14's "Yours: Forever, in My purchases" row is drawn.
    expect(screen.getByText('Forever, in My purchases')).toBeTruthy();
    expect(screen.queryByText(/Fintava/)).toBeNull();
  });

  // R2-SOCIAL 2 (BRIEF rules 3 and 4, H14): the fee is its parts then the Total, also when the charge is ₦0; "No fee" is never drawn.
  it('a quote with a ₦0 charge still reads Price, Yours, "Bank charge ₦0", the Total, and "Unlock · ₦2,500"', async () => {
    hub.feeKobo = 0;
    const screen = await openSheet();
    expect(screen.queryByText('No fee')).toBeNull();
    expect(screen.getByText('Bank charge')).toBeTruthy();
    expect(screen.getByText('₦0')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('Forever, in My purchases')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Unlock · ₦2,500' })).toBeTruthy();
  });

  it('H14 draws the piece\'s thumbnail when its preview is a picture', async () => {
    hub.kind = 'template';
    hub.preview = 'https://cdn.test/cover.jpg';
    const screen = await openSheet();
    expect(screen.getByTestId('pay-sheet-head-image').props.source).toEqual([{ uri: 'https://cdn.test/cover.jpg' }]);
  });

  it('H14 is the words alone, with no empty square, when the preview is a clip (the Hub serves no poster for a video)', async () => {
    const screen = await openSheet();
    expect(screen.queryByTestId('pay-sheet-head-image')).toBeNull();
    expect(screen.getByTestId('pay-sheet-head').children).toHaveLength(1);
  });

  it('a quote with a fee never says "No fee": the charge, the Total and the button carry the total', async () => {
    const screen = await openSheet();
    expect(screen.queryByText('No fee')).toBeNull();
    expect(screen.getByText('Bank charge')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('FIX-101 H-A: a creator with no display name still gets the sheet, the PIN and the unlock: the Hub\'s quote is never refused for a name', async () => {
    hub.nameless = 'none';
    const screen = await openSheet();
    expect(hub.quotes).toBe(1);
    expect(screen.getByLabelText('2,523 naira 25 kobo')).toBeTruthy();
    // The name the piece's page gives a creator with neither a name nor a handle.
    expect(screen.getByText('Someone')).toBeTruthy();
    await rtl.fireEvent.press(await unlockButton());
    expect(await screen.findByText('Approve ₦2,523.25 to Someone')).toBeTruthy();
    await enterPin('1234');
    expect(await screen.findByText('Unlocked')).toBeTruthy();
    expect(hub.payments).toBe(1);
  });

  it('FIX-101 H-A: a creator with no display name but a handle is named by the handle, as the feed names them', async () => {
    hub.nameless = 'handle';
    const screen = await openSheet();
    expect(screen.getByText('chidi')).toBeTruthy();
    await rtl.fireEvent.press(await unlockButton());
    expect(await screen.findByText('Approve ₦2,523.25 to chidi')).toBeTruthy();
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

describe('HOME-07: a course or a template unlocked from the feed', () => {
  const cases: [Kind, string][] = [
    ['course', "The full course is yours, and it's in My purchases from now on."],
    ['template', "The full template is yours, and it's in My purchases from now on."],
  ];

  it.each(cases)('a %s opens the same unlock sheet from its offer bar, and ends on Done (no player to open into), which closes the sheet', async (kind, line) => {
    hub.kind = kind;
    const screen = await reachPin();
    // H14 named the piece before the PIN; the payment is the ordinary one.
    expect(hub.quotes).toBe(2);
    await enterPin('4829');
    await screen.findByText('Unlocked');
    expect(screen.getByText(line)).toBeTruthy();
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].body).toEqual({ expectedTotalKobo: PRICE + FEE, quoteToken: `tok-${FEE}` });
    // The button is Done, not Watch now: a course or a template has no player in the feed.
    const done = screen.getByTestId('unlock-open');
    expect(rtl.within(done).getByText('Done')).toBeTruthy();
    expect(screen.queryByText('Watch now')).toBeNull();
    // SWEEP-FLOWS B2: the post is the person's the moment it is paid, behind the sheet; Done only closes the sheet, with nothing opened.
    await rtl.waitFor(() => expect(screen.queryByTestId(`offer-${PIECE}`)).toBeNull());
    await rtl.fireEvent.press(done);
    await rtl.waitFor(() => expect(screen.queryByText('Unlocked')).toBeNull());
    await rtl.waitFor(() => expect(screen.queryByTestId(`offer-${PIECE}`)).toBeNull());
    expect(mockPush).not.toHaveBeenCalled();
    expect(hub.pays).toHaveLength(1);
  });
});

describe('PAY-FX (R-91): the receipts of a buyer who paid from a dollar account', () => {
  const asDollarBuyer = () => {
    hub.usd = true;
    (require('@/api/paySource') as typeof import('@/api/paySource')).setPaySourceDefaults({ fallback: 'USD', hasNaira: false });
  };

  it('Unlocked says what left the dollar account, from which account, and the naira price; never a naira wallet', async () => {
    asDollarBuyer();
    const screen = await openSheet2();
    await rtl.fireEvent.press(await screen.findByRole('button', { name: /^Unlock · \$0\.23$/ }));
    await screen.findByText('Approve $0.23 to Chidi Eze');
    await enterPin('4829');
    await screen.findByText('Unlocked');
    const receipt = rtl.within(screen.getByTestId('unlock-receipt'));
    expect(receipt.getByText('$0.23')).toBeTruthy();
    expect(receipt.getByText('USD account')).toBeTruthy();
    expect(receipt.getByLabelText('2,500 naira')).toBeTruthy();
    expect(receipt.queryByText('Naira wallet')).toBeNull();
    expect(receipt.queryByLabelText('2,523 naira 25 kobo')).toBeNull();
  });

  it('Paid, still opening names the dollar amount and the dollar account, not the naira total or the wallet', async () => {
    asDollarBuyer();
    hub.mode = 'opening';
    const screen = await openSheet2();
    await rtl.fireEvent.press(await screen.findByRole('button', { name: /^Unlock · \$0\.23$/ }));
    await screen.findByText(/^Approve /);
    await enterPin('4829');
    await screen.findByText('Paid, still opening');
    expect(screen.getByText("$0.23 left your USD account and we couldn't finish opening the video. You won't be charged twice.")).toBeTruthy();
    expect(screen.queryByText(/₦2,523\.25 left/)).toBeNull();
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
    // SWEEP-FLOWS B2: the post is open the moment the payment is paid, behind H16, with no reload and no need to close the sheet.
    await rtl.waitFor(() => expect(screen.queryByTestId(`offer-${PIECE}`)).toBeNull());
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
    // The line says the payment may have gone through and that the retry happens once (SWEEP-APP-3, SWEEP-APP-2 #1).
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
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
    expect(screen.getByRole('button', { name: 'Contact support' })).toBeTruthy(); // SUPPORT-01 adds it, as H18 draws it
    hub.state = 'paid';
    await rtl.fireEvent.press(await screen.findByText('Refresh'));
    await screen.findByText('Unlocked');
    expect(hub.pays).toHaveLength(1);
  });

  it('H18: Contact support opens the support chat with this unlock\'s payment already attached, and a tap while it is on its way asks nothing more (SUPPORT-01)', async () => {
    hub.mode = 'opening';
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText('Paid, still opening');
    let release = () => {};
    hub.supportHold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Contact support' }));
    await rtl.waitFor(() => expect(hub.support).toHaveLength(1));
    // The first ask is on its way: a second tap finds the button busy and asks nothing.
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Contact support' }));
    expect(hub.support).toHaveLength(1);
    release();
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(hub.support).toEqual([{ reference: { kind: 'payment', id: PAYMENT } }]);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: '00000000-0000-4000-8000-0000000000c9' } });
  });

  it('H18: a support chat the Hub will not open says so in the Hub\'s words and stays on the sheet (SUPPORT-01)', async () => {
    hub.mode = 'opening';
    hub.supportRefused = true;
    const screen = await reachPin();
    await enterPin('4829');
    await screen.findByText('Paid, still opening');
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Contact support' }));
    expect(await screen.findByText('We could not find that payment.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('Paid, still opening')).toBeTruthy();
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
