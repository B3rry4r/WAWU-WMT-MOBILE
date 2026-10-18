/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, usePathname } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Share, Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Publish your first product and the identity check (VERIFY-04: VF12 to VF12c, VF15 to VF15b) and Your tier and all products used
 * (VERIFY-05: VF13, VF14 to VF14b) as the real route files over a stand-in `fetch` in the Hub's shapes. Picking and sending a file
 * are the create flow's own (`pickFile`, `uploadFile`), replaced here by a file and its answer.
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
jest.mock('@/features/create/pickFile', () => ({
  canPickFile: true,
  pickFile: jest.fn(async (types: string[]) => ({ blob: { size: 18 * 1024 * 1024 }, name: types.includes('application/pdf') ? 'brand-deck.pdf' : 'cover.png', contentType: types[0], extension: 'pdf' })),
}));
jest.mock('@/features/create/upload', () => ({
  UPLOAD_CANCELLED: 'upload_cancelled',
  UPLOAD_FAILED: 'upload_failed',
  uploadFile: jest.fn(async (file: { name: string }, target: { folder: string }, onProgress: (n: number) => void) => {
    onProgress(0.62);
    return { name: file.name, bytes: 18 * 1024 * 1024, contentType: 'application/pdf', key: `k-${target.folder}`, fileUrl: `https://files.test/${target.folder}/${file.name}` };
  }),
}));

const MB18 = 18 * 1024 * 1024;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const DAY = 86_400_000;
/**
 * The day these cases are read on unless one says otherwise. An end date is written against today (it carries its year when it is not
 * this year, FIX-78 F-3), so the clock is pinned: no case changes with the calendar. The router's test renderer installs the fake clock.
 */
const TODAY = '2026-10-18T09:00:00.000Z';
const pinClock = (iso: string) => jest.setSystemTime(new Date(iso));
/** The Hub's own sentence for a paused identity check (`403 identity_paused`, S7 round 2). */
const HUB_PAUSE = 'Publishing is paused until your identity check passes. Your wallet is not finished opening. Send the documents the bank asked for.';
const hub = {
  tier: 'active' as 'none' | 'active' | 'ending' | 'ended',
  /** The Hub fails the tier read this many more times (a real failure, FIX-68 F-2). */
  tierFails: 0,
  tierReads: 0,
  /** The Hub's own end date for the tier when a test sets one (otherwise a few days from now, by state). */
  until: null as string | null,
  used: 2,
  allowed: 3,
  wallet: 'open' as 'open' | 'opening' | 'rejected',
  walletReads: 0,
  openAfter: 0,
  category: null as string | null,
  publishes: [] as Record<string, unknown>[],
  patches: [] as Record<string, unknown>[],
  buys: [] as { key: string | null; body: Record<string, unknown> }[],
  full: false,
  paused: false,
  lostFirstBuy: false,
};
const FORMATS = [{ id: 'pdf', full: { contentTypes: ['application/pdf'], extensions: ['pdf'], maxBytes: 100_000_000 }, preview: { contentTypes: ['application/pdf'], extensions: ['pdf'], maxBytes: 100_000_000, kind: 'extract', seconds: null } }];
const draft = () => ({ id: 'd1', title: 'Brand deck template', contentType: 'pdf', description: 'A deck', category: hub.category, specializations: [], tags: [], accessType: 'paid', price: 4500, missing: hub.category ? [] : ['category'], createdAt: '2026-10-16T00:00:00.000Z', updatedAt: '2026-10-16T00:00:00.000Z' });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  const until = hub.until ?? new Date(Date.now() + (hub.tier === 'ending' ? 2.4 : hub.tier === 'ended' ? -3 : 40) * DAY).toISOString();
  if (path === '/users/me') return ok({ wawuUserId: '00000000-0000-4000-8000-0000000000b4', accountType: 'creator', firstName: 'Lennox', lastName: 'Emmanuel' });
  if (path === '/me/tier') {
    hub.tierReads += 1;
    if (hub.tierFails > 0) {
      hub.tierFails -= 1;
      return refuse(500, { message: 'Something went wrong on our side.' });
    }
    if (hub.tier === 'none') return ok({ state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null });
    return ok({ state: hub.tier, tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } }, activeFrom: '2026-10-01T00:00:00.000Z', activeUntil: until, productsAllowed: hub.allowed, productsUsed: hub.used, extraProducts: 0, pointsIncluded: 100, firstVoiceIntroIncluded: true, eventPass: { id: 'watch_apply', name: 'Watch live, apply' } });
  }
  if (path === '/plans') {
    const tier = (id: string, name: string, price: number) => ({ id, name, days: 30, products: 3, bonusPoints: 100, bonusPointsExpireDays: 365, priceMinor: price, eventPass: { id: 'p', name: 'Pass' }, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: false });
    return ok({ currency: 'NGN', currencyFixed: false, tiers: [tier('verify', 'Verify', 100_000), tier('founding', 'Founding Maker', 500_000)], extraProducts: { count: 5, priceMinor: 150_000 }, packs: [], checkoutBump: { points: 1000, priceMinor: 80_000 }, actions: [], caps: {} });
  }
  if (path === '/uploads/formats') return ok({ formats: FORMATS });
  if (path === '/money/wallet') {
    hub.walletReads += 1;
    if (hub.wallet === 'opening' && hub.openAfter > 0 && hub.walletReads > hub.openAfter) hub.wallet = 'open';
    const review = hub.wallet === 'rejected' ? { stage: 'rejected', reasons: [{ code: 'nin_name', message: "The name on your NIN doesn't match your BVN.", fix: 'Update your NIN details with NIMC, then try again' }], canResubmit: true, canResubmitAt: null, decidedAt: null } : null;
    return ok({ state: hub.wallet === 'rejected' ? 'not_open' : hub.wallet, openingFlow: 'review', accountNumberStatus: 'none', review });
  }
  if (path === '/product-drafts/d1' && method === 'GET') return ok(draft());
  if (path === '/product-drafts/d1' && method === 'PATCH') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.patches.push(body);
    if (typeof body.category === 'string') hub.category = body.category;
    return ok(draft());
  }
  if (path === '/product-drafts/d1/publish' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    if (hub.paused) return refuse(403, { code: 'identity_paused', message: HUB_PAUSE, stage: 'needs_documents' });
    if (hub.full) return refuse(402, { code: 'product_limit_reached', message: 'You have used all 3 of your products.' });
    hub.publishes.push(body);
    hub.used += 1;
    return json(201, { statusCode: 201, message: 'Created', data: { id: 'c1', title: 'Brand deck template', slug: 'brand-deck', creatorWawuId: 'lennox', status: 'pending' } });
  }
  if (path === '/plans/purchases/quote') {
    return ok({ kind: 'extra_products', currency: 'NGN', extraMinor: 150_000, products: 5, productsAllowed: hub.allowed, productsAllowedAfter: hub.allowed + 5, paymentKind: 'extra_products', payment: { kind: 'extra_products', targetId: 'extra', title: '5 more products', payee: null, priceKobo: 150_000, fee: { providerFeeKobo: 2500, wawuFeeKobo: 0, totalFeeKobo: 2500 }, totalKobo: 152_500, balanceKobo: 48_525_075, shortfallKobo: 0, willBeHeld: false, withinDailyLimit: true, remainingTodayKobo: null, quoteToken: 'tok-extra', expiresAt: '2099-01-01T00:00:00.000Z' } });
  }
  if (path === '/plans/purchases' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key');
    hub.buys.push({ key, body });
    if (hub.buys.filter((b) => b.key === key).length === 1) hub.allowed += 5;
    // The Hub took the payment and the answer never came back.
    if (hub.lostFirstBuy && hub.buys.length === 1) throw new TypeError('Network request failed');
    return json(201, { statusCode: 201, message: 'Created', data: { id: 'x1', kind: 'extra_products', method: 'wallet', currency: 'NGN', amountMinor: 150_000, products: 5, status: 'paid', statusMessage: null, payment: null, transfer: null, grant: { productsAllowed: hub.allowed }, createdAt: '2026-10-17T00:00:00.000Z', paidAt: '2026-10-17T00:00:01.000Z' } });
  }
  return json(404, { statusCode: 404, message: `Not here: ${method} ${path}` });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
function Where() {
  const params = useLocalSearchParams();
  return (
    <View>
      <Text testID="where">{`${usePathname()}?${new URLSearchParams(params as Record<string, string>).toString()}`}</Text>
    </View>
  );
}
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
        <Where />
      </View>
    );
  }
  return Stub;
};
function FullRoute() {
  const { ProductsFullHost } = require('../ProductsFullHost') as typeof import('../ProductsFullHost');
  return <ProductsFullHost onClose={() => undefined} />;
}

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    welcome: stub('Welcome'),
    index: stub('Home'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'add-money': stub('Add money'),
    tiers: stub('Tiers'),
    checkout: stub('Checkout'),
    shop: stub('Shop'),
    'shop-product': stub('Draft form'),
    full: FullRoute,
    publish: page('@/app/publish'),
    'your-tier': page('@/app/your-tier'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/your-tier' });
  await unmount();
}, 60_000);

beforeEach(() => {
  pinClock(TODAY);
  Object.assign(hub, { tier: 'active', tierFails: 0, tierReads: 0, until: null, used: 2, allowed: 3, wallet: 'open', walletReads: 0, openAfter: 0, category: null, publishes: [], patches: [], buys: [], full: false, paused: false, lostFirstBuy: false });
  (require('../purchaseIntent') as { forgetIntentInMemory: () => void }).forgetIntentInMemory();
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  // The create flow's creator gate: a creator account.
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000b4'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});
afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});
afterEach(async () => {
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
});
const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};

describe('identityStateOf · the identity check is the wallet’s own state (VF15 to VF15b)', () => {
  const { identityStateOf } = require('../identityModel') as typeof import('../identityModel');
  const progress = (state: string, review: unknown = null) => ({ state, flow: 'review', accountNumberStatus: 'none', review }) as never;
  it('an open wallet passed; an opening wallet is being checked; a rejected one is paused with the Hub’s reason and what to do', () => {
    expect(identityStateOf(progress('open')).kind).toBe('passed');
    expect(identityStateOf(progress('opening')).kind).toBe('checking');
    expect(identityStateOf(progress('not_open', { stage: 'checking', reasons: [], canResubmit: false, canResubmitAt: null, decidedAt: null })).kind).toBe('checking');
    const paused = identityStateOf(progress('not_open', { stage: 'rejected', reasons: [{ code: 'x', message: 'Names differ.', fix: 'Fix your NIN' }], canResubmit: true, canResubmitAt: null, decidedAt: null }));
    expect(paused).toEqual({ kind: 'paused', reason: 'Names differ.', fixes: ['Fix your NIN'], canOpen: true });
    expect(identityStateOf(progress('not_open')).kind).toBe('paused');
    expect(identityStateOf(progress('frozen'))).toMatchObject({ kind: 'paused', canOpen: false });
  });
});

describe('VF12 · publish your first product', () => {
  it('a user with a tier adds the preview and the file, picks a category, publishes once, and shares the link from the phone’s share sheet', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    await renderRouter(routes, { initialUrl: '/publish?id=d1' });
    await screen.findByTestId('publish-submit');
    expect(screen.getByTestId('publish-meter')).toBeTruthy();
    expect(screen.getByTestId('publish-submit')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('publish-preview'));
    await waitFor(() => expect(screen.getByTestId('publish-preview')).toHaveTextContent(/cover|brand-deck/));
    await sleep(900);
    await fireEvent.press(screen.getByTestId('publish-file'));
    expect(await screen.findByText('18 MB · ready')).toBeTruthy();
    expect(screen.getByTestId('publish-submit')).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Technology' }));
    await waitFor(() => expect(screen.getByTestId('publish-submit')).toBeEnabled());
    await fireEvent.press(screen.getByTestId('publish-submit'));
    expect(await screen.findByTestId('publish-published')).toBeTruthy();
    expect(hub.patches).toEqual([{ category: 'technology' }]);
    expect(hub.publishes).toHaveLength(1);
    expect(hub.publishes[0]).toEqual({ previewAsset: expect.stringContaining('content/preview'), fullAsset: expect.stringContaining('content/full') });
    expect(screen.getByTestId('publish-published-line')).toHaveTextContent(/with our team for review/);
    expect(screen.getByTestId('publish-link')).toHaveTextContent('wawu/lennox/brand-deck');
    await fireEvent.press(screen.getByTestId('publish-share'));
    expect(share).toHaveBeenCalledWith({ message: 'wawu/lennox/brand-deck' }, expect.anything());
    share.mockRestore();
  });

  it('a person with no tier is told to make it official, and the button opens the tiers', async () => {
    hub.tier = 'none';
    await renderRouter(routes, { initialUrl: '/publish?id=d1' });
    expect(await screen.findByTestId('publish-no-tier')).toBeTruthy();
    expect(screen.queryByTestId('publish-submit')).toBeNull();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('where')).toHaveTextContent(/\/tiers/);
  });

  it('a person whose identity check is not through sees uploads paused with the Hub’s reason and cannot publish; Try again opens Open your wallet', async () => {
    hub.wallet = 'rejected';
    await renderRouter(routes, { initialUrl: '/publish?id=d1' });
    expect(await screen.findByTestId('identity-title')).toHaveTextContent('Uploads are paused');
    expect(screen.getByTestId('identity-line')).toHaveTextContent("The name on your NIN doesn't match your BVN.");
    expect(screen.getByTestId('identity-fixes')).toHaveTextContent(/Update your NIN details with NIMC, then try again/);
    expect(screen.queryByTestId('publish-submit')).toBeNull();
    await fireEvent.press(screen.getByTestId('identity-try-again'));
    expect(await screen.findByTestId('where')).toHaveTextContent(/\/open-wallet/);
  });

  it('the Hub’s own pause: a publish it refuses with identity_paused shows its sentence as VF15b, publishes nothing, and Try again opens Open your wallet (S7 F3)', async () => {
    hub.paused = true;
    hub.category = 'technology';
    await renderRouter(routes, { initialUrl: '/publish?id=d1' });
    await screen.findByTestId('publish-submit');
    await fireEvent.press(screen.getByTestId('publish-preview'));
    await sleep(900);
    await fireEvent.press(screen.getByTestId('publish-file'));
    await screen.findByText('18 MB · ready');
    await fireEvent.press(screen.getByTestId('publish-submit'));
    expect(await screen.findByTestId('identity-title')).toHaveTextContent('Uploads are paused');
    // The Hub's sentence as it is: no steps are added under it, and the form is gone.
    expect(screen.getByTestId('identity-line')).toHaveTextContent(HUB_PAUSE);
    expect(screen.queryByTestId('identity-fixes')).toBeNull();
    expect(screen.queryByTestId('publish-submit')).toBeNull();
    expect(hub.publishes).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('identity-try-again'));
    expect(await screen.findByTestId('where')).toHaveTextContent(/\/open-wallet/);
  });

  it('a check that is still running is shown, then passed with Continue, then the publish form', async () => {
    hub.wallet = 'opening';
    hub.openAfter = 1;
    await renderRouter(routes, { initialUrl: '/publish?id=d1' });
    expect(await screen.findByTestId('identity-ring')).toBeTruthy();
    expect(screen.getByTestId('identity-title')).toHaveTextContent('Checking your identity');
    await sleep(3100);
    expect(await screen.findByTestId('identity-passed-mark')).toBeTruthy();
    expect(screen.getByTestId('identity-line')).toHaveTextContent('You can upload and publish.');
    await fireEvent.press(screen.getByTestId('identity-continue'));
    expect(await screen.findByTestId('publish-submit')).toBeTruthy();
  });

  it('a full tier answers the publish with the Hub’s limit and VF13 opens', async () => {
    hub.full = true;
    hub.category = 'technology';
    await renderRouter(routes, { initialUrl: '/publish?id=d1' });
    await screen.findByTestId('publish-submit');
    await fireEvent.press(screen.getByTestId('publish-preview'));
    await sleep(900);
    await fireEvent.press(screen.getByTestId('publish-file'));
    await screen.findByText('18 MB · ready');
    await fireEvent.press(screen.getByTestId('publish-submit'));
    expect(await screen.findByTestId('full-title')).toHaveTextContent('You have used 2 of 3');
  });
});

describe('VF13 · all products used', () => {
  it('a user at the limit adds five once with the PIN even after a double tap, and sees the new number', async () => {
    hub.used = 3;
    await renderRouter(routes, { initialUrl: '/full' });
    expect(await screen.findByTestId('full-title')).toHaveTextContent('You have used 3 of 3');
    await screen.findByText('Add 5 for ₦1,525');
    expect(screen.getByTestId('full-upgrade')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('full-add'));
    await fireEvent.press(screen.getByTestId('full-add'));
    await screen.findByText(/ for 5 more products/);
    await tap('1234');
    expect(await screen.findByTestId('full-added-title')).toHaveTextContent('5 more products added');
    expect(screen.getByTestId('full-added-line')).toHaveTextContent('You can publish up to 8 products now.');
    expect(hub.buys).toHaveLength(1);
    expect(hub.buys[0].body).toEqual({ kind: 'extra_products', method: 'wallet', expectedTotalKobo: 152_500, quoteToken: 'tok-extra' });
  });
});

describe('VF13 · a lost answer on the products sheet (SWEEP-APP-3, SWEEP-APP-2 #1)', () => {
  it('says the payment may have gone through and that the retry happens once, then sends the same key and the same body', async () => {
    hub.used = 3;
    hub.lostFirstBuy = true;
    await renderRouter(routes, { initialUrl: '/full' });
    await screen.findByText('Add 5 for ₦1,525');
    await fireEvent.press(screen.getByTestId('full-add'));
    await screen.findByText(/ for 5 more products/);
    await tap('1234');
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    expect(hub.buys).toHaveLength(1);
    await tap('1234');
    expect(await screen.findByTestId('full-added-title')).toHaveTextContent('5 more products added');
    expect(hub.buys).toHaveLength(2);
    expect(hub.buys[1].key).toBe(hub.buys[0].key);
    expect(hub.buys[1].body).toEqual(hub.buys[0].body);
    expect(hub.allowed).toBe(8);
  });
});

describe('VF14 · your tier', () => {
  it('a user sees the Hub’s dates and counts (active), a warning when it ends soon, and the ended state with Renew', async () => {
    hub.until = '2026-11-26T10:00:00.000Z';
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-name')).toHaveTextContent('Verify');
    expect(screen.getByTestId('your-tier-line')).toHaveTextContent(/^Active until 26 Nov$/);
    expect(screen.getByTestId('your-tier-products')).toHaveTextContent(/2 of 3/);
    expect(screen.getByTestId('your-tier-points')).toHaveTextContent(/100/);
    expect(screen.getByTestId('your-tier-pass')).toHaveTextContent(/Watch live, apply/);
    expect(screen.queryByTestId('your-tier-ending')).toBeNull();
    expect(screen.getByTestId('your-tier-renew')).toHaveTextContent('Renew · ₦1,000');
    await fireEvent.press(screen.getByTestId('your-tier-renew'));
    expect(await screen.findByTestId('where')).toHaveTextContent('/checkout?kind=renew&tier=verify');
  });

  /*
   * An end date carries its year when it is not this year (FIX-78 F-3), and "this year" is the Lagos year: 23:00 UTC on 31 Dec is already
   * midnight on 1 Jan in Lagos. Each row is read at a pinned instant, so the rows hold at every moment of the real year, the hour around
   * New Year included: 23:30 UTC on 31 Dec is 00:30 on 1 Jan in Lagos.
   */
  it.each([
    { now: '2026-10-18T09:00:00.000Z', until: '2027-07-15T10:00:00.000Z', words: 'Active until 15 Jul 2027' },
    { now: '2026-12-31T22:59:59.000Z', until: '2027-07-15T10:00:00.000Z', words: 'Active until 15 Jul 2027' },
    { now: '2026-12-31T23:00:00.000Z', until: '2027-07-15T10:00:00.000Z', words: 'Active until 15 Jul' },
    { now: '2026-12-31T23:30:00.000Z', until: '2027-07-15T10:00:00.000Z', words: 'Active until 15 Jul' },
    { now: '2027-01-01T00:30:00.000Z', until: '2027-07-15T10:00:00.000Z', words: 'Active until 15 Jul' },
  ])('a tier ending $until, read at $now, says "$words" (a 12-month tier never reads as ending today)', async ({ now, until, words }) => {
    pinClock(now);
    hub.until = until;
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-line')).toHaveTextContent(new RegExp(`^${words}$`));
  });

  it.each([
    { now: '2026-10-18T09:00:00.000Z', until: '2026-12-15T10:00:00.000Z', words: 'Active until 15 Dec' },
    { now: '2026-12-31T22:30:00.000Z', until: '2026-12-31T22:45:00.000Z', words: 'Active until 31 Dec' },
    { now: '2026-12-31T23:30:00.000Z', until: '2027-12-15T10:00:00.000Z', words: 'Active until 15 Dec' },
    { now: '2027-01-01T00:30:00.000Z', until: '2027-12-15T10:00:00.000Z', words: 'Active until 15 Dec' },
  ])('a tier that ends later this year, ending $until and read at $now, says the day and no year', async ({ now, until, words }) => {
    pinClock(now);
    hub.until = until;
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-line')).toHaveTextContent(new RegExp(`^${words}$`));
  });

  it.each([
    { now: '2026-10-18T09:00:00.000Z', until: '2025-07-15T10:00:00.000Z', words: 'Ended 15 Jul 2025' },
    { now: '2026-12-31T22:59:59.000Z', until: '2026-07-15T10:00:00.000Z', words: 'Ended 15 Jul' },
    { now: '2026-12-31T23:30:00.000Z', until: '2026-07-15T10:00:00.000Z', words: 'Ended 15 Jul 2026' },
    { now: '2027-01-01T00:30:00.000Z', until: '2026-07-15T10:00:00.000Z', words: 'Ended 15 Jul 2026' },
  ])('a tier that ended $until, read at $now, says "$words" (the year when it was another year)', async ({ now, until, words }) => {
    pinClock(now);
    hub.tier = 'ended';
    hub.until = until;
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-line')).toHaveTextContent(new RegExp(`^${words}$`));
  });

  it('an ending tier warns with the days left, and an ended one says published products stay up and publishing is paused', async () => {
    hub.tier = 'ending';
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-ending')).toHaveTextContent(/Your tier ends in 3 days/);
    expect(screen.getByTestId('your-tier-line')).toHaveTextContent(/^Ends in 3 days · /);
  });

  it('an ended tier can be renewed and keeps its words', async () => {
    hub.tier = 'ended';
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-ended')).toHaveTextContent(/Published products stay up. New publishing is paused until you renew./);
    expect(screen.getByTestId('your-tier-line')).toHaveTextContent(/^Ended /);
    expect(screen.getByTestId('your-tier-renew')).toBeTruthy();
  });

  it('a person with no tier is offered the tiers', async () => {
    hub.tier = 'none';
    await renderRouter(routes, { initialUrl: '/your-tier' });
    expect(await screen.findByTestId('your-tier-none')).toBeTruthy();
  });

  it('no tier is not an error: no alert, no "Try again", and the one button says what it does and opens the tiers (FIX-68 F-2)', async () => {
    hub.tier = 'none';
    await renderRouter(routes, { initialUrl: '/your-tier' });
    const none = await screen.findByTestId('your-tier-none');
    expect(screen.queryByTestId('your-tier-error')).toBeNull();
    expect(screen.queryByText('Try again')).toBeNull();
    expect(within(none).queryByRole('alert')).toBeNull();
    expect(screen.getByText('You have no tier yet')).toBeTruthy();
    await fireEvent.press(screen.getByText('See tiers'));
    expect(await screen.findByTestId('where')).toHaveTextContent('/tiers?');
    expect(hub.tierReads).toBe(1);
  });

  it('a Hub failure keeps its own error, and its Try again reads the tier again instead of opening the tiers (FIX-68 F-2)', async () => {
    hub.tierFails = 1;
    await renderRouter(routes, { initialUrl: '/your-tier' });
    await screen.findByTestId('your-tier-error');
    expect(screen.queryByTestId('your-tier-none')).toBeNull();
    expect(screen.queryByText('See tiers')).toBeNull();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('your-tier-name')).toHaveTextContent('Verify');
    expect(hub.tierReads).toBe(2);
    expect(screen.queryByTestId('where')).toBeNull();
  });
});
