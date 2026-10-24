/* eslint-disable @typescript-eslint/no-require-imports */
import { Stack } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Capital (NUV-12) on the real Expo Router stack: the home, a product, the review with the PIN sheet, a holding and a withdrawal as their
 * real route files, and the Hub as a stand-in `fetch` installed before the app's modules load. It answers in the Hub's shapes with
 * figures that are not any design's (a rate of 18% for 90 days, a minimum of ₦1,000), records every reservation, confirmation and
 * withdrawal with its headers and body, and can answer as the Hub does when the PIN is wrong, the answer is lost, the reservation
 * ran out, or the balance is short.
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
const mockOpened: string[] = [];
jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  openURL: jest.fn(async (url: string) => {
    mockOpened.push(url);
    return true;
  }),
}));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const created = (data: unknown) => json(201, { statusCode: 201, message: 'Created', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const FR = 'prod-fr-90';
const SO = 'prod-so-closed';
const ORDER = '11111111-1111-4111-8111-111111111111';

const hub = {
  available: true,
  confirm: 'ok' as 'ok' | 'wrongFirst' | 'lost' | 'expired' | 'short',
  orderStatus: 'reserved' as string,
  invested: false,
  noWallet: false,
  expiresInMs: 15 * 60_000,
  reserves: [] as { key: string | null; body: Record<string, unknown> }[],
  confirms: [] as { pin: string | null; key: string | null }[],
  withdraws: [] as { pin: string | null; key: string | null }[],
  made: false,
  withdrawn: false,
};

const product = (over: Record<string, unknown> = {}) => ({
  id: FR,
  kind: 'fixed_return',
  name: '90 Days Treasury Bills',
  description: 'A government issued instrument for 90 days',
  minKobo: 100_000,
  maxKobo: 100_000_000,
  tenorDays: 90,
  annualRate: 0.18,
  rateBands: [],
  allowEarlyWithdrawal: true,
  earliestWithdrawalDays: null,
  deductibles: [{ name: 'Withholding Tax', value: 0.1, valueType: 'percentage', appliesTo: 'interest' }],
  opensAt: null,
  closesAt: null,
  issuerName: null,
  offerPriceKobo: null,
  lockPeriodDays: null,
  orderable: true,
  notOrderableReason: null,
  documents: [],
  ...over,
});
const detail = (over: Record<string, unknown> = {}) => ({
  ...product({ documents: [{ name: 'Terms & Conditions.pdf', url: 'https://docs.example.test/terms.pdf' }], ...over }),
  terms: { wawuMinKobo: null, wawuMaxKobo: null, wawuFeeFlatKobo: 0, wawuFeeBasisPoints: 0 },
});
const quote = {
  totalDebitKobo: 1_500_000,
  principalKobo: 1_500_000,
  tenorDays: 90,
  lockedRate: 0.18,
  locked: false,
  allowEarlyWithdrawal: true,
  earliestWithdrawalDays: null,
  penaltyRate: 0.15,
  deductibles: [{ name: 'Withholding Tax', value: 0.1, valueType: 'percentage', appliesTo: 'interest' }],
  requestedShares: null,
  allocatedShares: null,
  unallocatedKobo: null,
  offerPriceKobo: null,
  baseCostKobo: null,
  brokerageFeeKobo: null,
  crossDealFeeKobo: null,
  lockPeriodDays: null,
};
const holding = () => ({
  numberLast4: '4002',
  lifecycle: hub.withdrawn ? 'EARLY_LIQUIDATING' : 'ACTIVE',
  payoutStatus: hub.withdrawn ? 'pending' : null,
  principalKobo: 1_500_000,
  lockedRate: 0.18,
  tenorDays: 90,
  startedAt: '2030-01-10T10:00:00.000Z',
  maturesAt: '2030-04-10T10:00:00.000Z',
  earlyExitFrom: '2030-01-10T10:00:00.000Z',
  accruedKobo: 4_500,
  expectedGrossInterestKobo: 66_000,
  expectedDeductionsKobo: 6_600,
  expectedPayoutKobo: 1_559_400,
  payoutKobo: hub.withdrawn ? 1_504_000 : null,
  settlesAt: null,
  sharesPurchased: null,
  unitsHeld: null,
  costKobo: null,
  lockEndsAt: null,
  currentValueKobo: null,
  pendingRefundKobo: null,
});
function order() {
  const status = hub.withdrawn ? 'paying_out' : hub.invested ? 'invested' : hub.orderStatus;
  return {
    id: ORDER,
    status,
    productId: FR,
    productName: '90 Days Treasury Bills',
    kind: 'fixed_return',
    amountKobo: 1_500_000,
    quote,
    feeKobo: 0,
    totalKobo: 1_500_000,
    expiresAt: new Date(Date.now() + hub.expiresInMs).toISOString(),
    confirmedAt: hub.invested ? '2030-01-10T10:00:00.000Z' : null,
    createdAt: '2030-01-10T09:55:00.000Z',
    frozen: false,
    holding: hub.invested ? holding() : null,
    canWithdraw: hub.invested && !hub.withdrawn,
    withdrawBlockedBy: null,
    note: null,
  };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/capital/availability') return ok({ available: hub.available });
  if (hub.noWallet && path.startsWith('/capital')) return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
  if (path === '/capital/portfolio') return ok({ investedKobo: hub.invested ? 1_500_000 : 0, returnKobo: hub.invested ? 4_500 : 0, valueKobo: hub.invested ? 1_504_500 : 0, holdings: hub.invested ? 1 : 0, otherCurrencies: 0 });
  if (path === '/capital/products') return ok({ items: [product(), product({ id: SO, kind: 'share_offering', name: 'MTN Public Offering', tenorDays: null, annualRate: null, issuerName: 'MTN', offerPriceKobo: 100_000, orderable: false, notOrderableReason: 'sale_closed' })], nextCursor: null });
  if (path === `/capital/products/${FR}`) return ok(detail());
  if (path === '/capital/orders' && method === 'POST') {
    hub.reserves.push({ key: request.headers.get('idempotency-key'), body: (await request.json()) as Record<string, unknown> });
    hub.made = true;
    return created(order());
  }
  if (path === '/capital/orders' && method === 'GET') {
    const show = url.searchParams.get('show');
    return ok({ items: hub.made && hub.invested && show !== 'ended' ? [order()] : [], nextCursor: null });
  }
  if (path === `/capital/orders/${ORDER}/confirm` && method === 'POST') {
    hub.confirms.push({ pin: request.headers.get('x-transaction-pin'), key: request.headers.get('idempotency-key') });
    if (hub.confirm === 'wrongFirst' && hub.confirms.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.confirm === 'expired') return refuse(409, { code: 'reservation_expired', message: 'This reservation has run out. Start again to invest.' });
    if (hub.confirm === 'short') return refuse(402, { code: 'insufficient_funds', message: 'You need ₦2,000.00 more in your wallet.', shortfallKobo: 200_000 });
    hub.invested = true;
    if (hub.confirm === 'lost') {
      hub.confirm = 'ok';
      throw new TypeError('Network request failed');
    }
    return created(order());
  }
  if (path === `/capital/orders/${ORDER}/withdrawal` && method === 'POST') {
    hub.withdraws.push({ pin: request.headers.get('x-transaction-pin'), key: request.headers.get('idempotency-key') });
    hub.withdrawn = true;
    return created(order());
  }
  if (path === `/capital/orders/${ORDER}/withdrawal`) return ok({ early: true, grossInterestKobo: 4_500, penaltyRate: 0.15, penaltyKobo: 675, deductionsKobo: 383, netPayoutKobo: 1_503_442, daysHeld: 3 });
  if (path === `/capital/orders/${ORDER}/transactions`) return ok({ items: [{ id: 't1', event: 'PURCHASE', amountKobo: 1_500_000, accruedOn: null, occurredAt: '2030-01-10T10:00:00.000Z' }], nextCursor: null });
  if (path === `/capital/orders/${ORDER}`) return ok(order());
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
      </View>
    );
  }
  return Stub;
};
const page = (module: string): ComponentType => (require(module) as { default: ComponentType }).default;

let routes: Record<string, ComponentType>;

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => <Stack screenOptions={{ headerShown: false }} />,
    wallet: stub('Wallet tab'),
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'capital/index': page('@/app/capital/index'),
    'capital/product': page('@/app/capital/product'),
    'capital/review': page('@/app/capital/review'),
    'capital/order': page('@/app/capital/order'),
    'capital/withdraw': page('@/app/capital/withdraw'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, { available: true, confirm: 'ok', orderStatus: 'reserved', invested: false, noWallet: false, expiresInMs: 15 * 60_000, reserves: [], confirms: [], withdraws: [], made: false, withdrawn: false });
  mockOpened.length = 0;
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 } });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000c1'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const sleep = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};

describe('NUV-12 · Capital', () => {
  it('a user sees what they have invested and the products with the rate and term the Hub states; a closed sale says so', async () => {
    await renderRouter(routes, { initialUrl: '/capital' });
    await screen.findByTestId('capital-products');
    expect(screen.getByTestId('capital-invested')).toHaveTextContent('₦0.00', { exact: false });
    expect(screen.getByTestId(`capital-product-${FR}`)).toHaveTextContent('18% a year · 90 days', { exact: false });
    expect(screen.getByTestId(`capital-product-${SO}`)).toHaveTextContent('Sale closed', { exact: false });
    expect(screen.getByTestId('capital-note')).toHaveTextContent('not a promise of a return', { exact: false });
    await fireEvent.press(screen.getByRole('tab', { name: 'Mine' }));
    await screen.findByTestId('capital-mine-empty');
  });

  it('a user opens a product, agrees to the documents, and reserves it; the review shows the quote and nothing was taken', async () => {
    await renderRouter(routes, { initialUrl: '/capital' });
    await screen.findByTestId('capital-products');
    await fireEvent.press(screen.getByTestId(`capital-product-${FR}`));
    await screen.findByTestId('capital-product-terms');
    expect(pathname()).toBe('/capital/product');
    expect(screen.getByTestId('capital-product-terms')).toHaveTextContent('18% a year', { exact: false });
    expect(screen.getByTestId('capital-product-terms')).toHaveTextContent('10% of interest', { exact: false });
    // A document opens in the browser.
    await fireEvent.press(screen.getByTestId('capital-document'));
    expect(mockOpened).toEqual(['https://docs.example.test/terms.pdf']);

    await fireEvent.changeText(screen.getByTestId('capital-amount'), '500');
    await screen.findByText('The least this takes is ₦1,000.00.');
    await fireEvent.changeText(screen.getByTestId('capital-amount'), '15000');
    expect(screen.queryByText(/The least this takes/)).toBeNull();
    expect(screen.getByTestId('capital-review').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('capital-agree'));
    await press('Review');
    await screen.findByTestId('capital-review-figures');
    expect(hub.reserves).toHaveLength(1);
    expect(hub.reserves[0].body).toEqual({ productId: FR, amountKobo: 1_500_000, lockInvestment: false, agreedToDocuments: true });
    expect(hub.reserves[0].key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(pathname()).toBe('/capital/review');
    expect(screen.getByTestId('capital-review-figures')).toHaveTextContent('18% a year', { exact: false });
    expect(screen.getByTestId('capital-review-figures')).toHaveTextContent('If you leave early15% of interest', { exact: false });
    expect(screen.getByTestId('capital-review-figures')).toHaveTextContent('From your wallet₦15,000.00', { exact: false });
    expect(screen.queryByText(/Our fee/)).toBeNull();
    expect(screen.getByTestId('capital-countdown')).toHaveTextContent('Held for you for 15:00');
    await sleep(3000);
    expect(screen.getByTestId('capital-countdown')).toHaveTextContent('Held for you for 14:57');
    expect(hub.confirms).toHaveLength(0);
  });

  it('a wrong PIN then the right one confirms once with the same key, and the person is invested', async () => {
    hub.confirm = 'wrongFirst';
    hub.made = true;
    await renderRouter(routes, { initialUrl: `/capital/review?id=${ORDER}` });
    await screen.findByTestId('capital-review-figures');
    await press(/^Invest ₦15,000/);
    await tap('9999');
    await screen.findByText(/4 tries left/);
    await tap('4826');
    await screen.findByTestId('capital-invested-result');
    expect(screen.getByText('₦15,000.00 invested')).toBeTruthy();
    expect(hub.confirms.map((c) => c.pin)).toEqual(['9999', '4826']);
    expect(hub.confirms[0].key).toBe(hub.confirms[1].key);
  });

  it('an answer that is lost is sent again with the same key and the Hub takes the money once', async () => {
    hub.confirm = 'lost';
    hub.made = true;
    await renderRouter(routes, { initialUrl: `/capital/review?id=${ORDER}` });
    await screen.findByTestId('capital-review-figures');
    await press(/^Invest ₦15,000/);
    await tap('4826');
    await waitFor(() => expect(hub.confirms).toHaveLength(1));
    await tap('4826');
    await screen.findByTestId('capital-invested-result');
    expect(hub.confirms).toHaveLength(2);
    expect(hub.confirms[1].key).toBe(hub.confirms[0].key);
  });

  it('a reservation that ran out says nothing was taken and starts again at the product', async () => {
    hub.confirm = 'expired';
    hub.made = true;
    await renderRouter(routes, { initialUrl: `/capital/review?id=${ORDER}` });
    await screen.findByTestId('capital-review-figures');
    await press(/^Invest ₦15,000/);
    await tap('4826');
    await screen.findByTestId('capital-ended-result');
    expect(screen.getByText('This reservation ran out')).toBeTruthy();
    expect(screen.getByText(/Nothing was taken/)).toBeTruthy();
    await press('Start again');
    await waitFor(() => expect(pathname()).toBe('/capital/product'));
  });

  it('a short balance is said in the Hub\'s words and nothing is taken', async () => {
    hub.confirm = 'short';
    hub.made = true;
    await renderRouter(routes, { initialUrl: `/capital/review?id=${ORDER}` });
    await screen.findByTestId('capital-review-figures');
    await press(/^Invest ₦15,000/);
    await tap('4826');
    await screen.findByTestId('capital-review-problem');
    expect(screen.getByText('You need ₦2,000.00 more in your wallet.')).toBeTruthy();
    expect(screen.queryByTestId('capital-invested-result')).toBeNull();
  });

  it('a user sees an investment with its figures as stated and its movements, and withdraws early with the PIN once', async () => {
    hub.invested = true;
    hub.made = true;
    await renderRouter(routes, { initialUrl: `/capital/order?id=${ORDER}` });
    await screen.findByTestId('capital-figures');
    expect(screen.getByTestId('capital-holding-status')).toHaveTextContent('Invested');
    expect(screen.getByTestId('capital-figures')).toHaveTextContent('18% a year', { exact: false });
    expect(screen.getByTestId('capital-figures')).toHaveTextContent('Expected at the end₦15,594.00', { exact: false });
    expect(screen.getByTestId('capital-holding-note')).toHaveTextContent('not a promise of a return', { exact: false });
    await screen.findByTestId('capital-moves');
    await press('Withdraw');
    await screen.findByTestId('capital-withdraw-figures');
    expect(screen.getByTestId('capital-withdraw-figures')).toHaveTextContent('Share taken for leaving early−₦6.75', { exact: false });
    expect(screen.getByTestId('capital-withdraw-figures')).toHaveTextContent('You get₦15,034.42', { exact: false });
    await press(/^Withdraw ₦15,034.42/);
    await tap('4826');
    await screen.findByTestId('capital-withdraw-result');
    expect(hub.withdraws).toHaveLength(1);
    expect(hub.withdraws[0].pin).toBe('4826');
    await press('Done');
    await waitFor(() => expect(pathname()).toBe('/capital'));
  });

  it('a person with no wallet is offered Open your wallet, not a list of products', async () => {
    hub.noWallet = true;
    await renderRouter(routes, { initialUrl: '/capital' });
    await screen.findByTestId('capital-no-wallet');
    expect(screen.queryByTestId('capital-products')).toBeNull();
    await sleep(0);
  });
});
