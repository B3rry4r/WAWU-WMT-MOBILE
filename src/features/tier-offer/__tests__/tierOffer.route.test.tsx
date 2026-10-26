/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

/** The machine that runs these is often loaded: wait up to 15 s for a screen, never less than the default. */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const ok = (data: unknown) => ({ statusCode: 200, message: 'OK', data });
const tier = (id: string, name: string, priceMinor: number, products: number, preselected = false) => ({
  id,
  name,
  days: 365,
  products,
  bonusPoints: 0,
  bonusPointsExpireDays: 365,
  priceMinor,
  eventPass: { id: 'c', name: 'Maker Pass' },
  badge: { id, numbered: false },
  packBonusPercent: 0,
  firstVoiceIntroIncluded: false,
  preselected,
});
const plans = (currency = 'NGN') => ({
  currency,
  currencyFixed: false,
  extraProducts: { count: 5, priceMinor: 150000 },
  packs: [],
  checkoutBump: { points: 1000, priceMinor: 80000 },
  actions: [],
  caps: {
    dailyPoints: 5000,
    maxCharactersPerJob: 5000,
    maxAudioMinutesPerJob: 10,
  },
  tiers: [tier('verify', 'Verify', 299900, 3), tier('plus', 'Verify Plus', 599900, 6, true), tier('founding', 'Founding Maker', 999900, 10)],
});
const ADA = 'account-ada';
let seenCalls = 0;
const hub: Record<string, unknown> = {};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const key = `${request.method} ${new URL(request.url).pathname}`;
  if (key === 'POST /api/hub/me/tier-offer/seen') seenCalls += 1;
  const found = hub[key];
  const answer = typeof found === 'function' ? (found as () => unknown)() : found;
  if (!answer || answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

const RootLayout = require('@/app/_layout').default as typeof import('@/app/_layout').default;
const TabsLayout = require('@/app/(tabs)/_layout').default as typeof import('@/app/(tabs)/_layout').default;
const Home = require('@/app/(tabs)/index').default as typeof import('@/app/(tabs)/index').default;
const Explore = require('@/app/(tabs)/explore').default as typeof import('@/app/(tabs)/explore').default;
const Inbox = require('@/app/(tabs)/inbox').default as typeof import('@/app/(tabs)/inbox').default;
const Wallet = require('@/app/(tabs)/wallet').default as typeof import('@/app/(tabs)/wallet').default;
const Me = require('@/app/(tabs)/me').default as typeof import('@/app/(tabs)/me').default;
const TierOfferRoute = require('@/app/tier-offer').default as typeof import('@/app/tier-offer').default;
const WelcomeRoute = require('@/app/welcome').default as typeof import('@/app/welcome').default;
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { ACCESS_KEY, REFRESH_KEY } = require('@/api/tokenStore') as typeof import('@/api/tokenStore');
const { resetSignupGate } = require('@/features/auth/signupGate') as typeof import('@/features/auth/signupGate');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetTierOffer } = require('../offerStep') as typeof import('../offerStep');

const stub = (name: string) =>
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{`route ${name}`}</Text>
      </View>
    );
  };
const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'tier-offer': TierOfferRoute,
  checkout: stub('checkout'),
  tiers: stub('tiers'),
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;
const home = () => screen.getByRole('header', { name: 'Home' });
const signedIn = () => {
  mockVault.set(ACCESS_KEY, tokenFor(ADA));
  mockVault.set(REFRESH_KEY, 'stored-refresh');
};

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  seenCalls = 0;
  for (const key of Object.keys(hub)) delete hub[key];
  hub['GET /api/hub/users/me'] = ok({
    wawuUserId: ADA,
    accountType: 'creator',
    firstName: 'Ada',
    lastName: 'Obi',
    handle: 'ada',
  });
  hub['GET /api/hub/plans'] = ok(plans());
  hub['GET /api/hub/me/tier-offer'] = ok({ show: true, closeButton: true });
  hub['POST /api/hub/me/tier-offer/seen'] = ok({
    seenAt: '2026-10-26T10:00:00.000Z',
  });
  queryClient.clear();
  mockVault.clear();
  resetSessionForTests();
  resetTierOffer();
  resetSignupGate();
  signedIn();
});

describe('a person the Hub offers the tiers to sees them before Home (TIER-OFFER, R-94)', () => {
  it('a person can see the three tiers with a Subscribe each, close with the X and land on Home', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-screen')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    await waitFor(() => expect(screen.getByTestId('tier-offer-list')).toBeTruthy());
    for (const id of ['verify', 'plus', 'founding']) expect(screen.getByTestId(`tier-offer-subscribe-${id}`)).toBeTruthy();
    // The prices are the Hub's, as the tiers sheet draws them.
    expect(screen.getByLabelText(/Verify, .*2,999/)).toBeTruthy();
    expect(screen.getByLabelText(/Verify Plus, .*5,999/)).toBeTruthy();
    expect(screen.getByLabelText(/Founding Maker, .*9,999/)).toBeTruthy();

    // The way out is plain: a button named Close, and no "Not now" while the X is on.
    const close = screen.getByRole('button', { name: 'Close' });
    expect(screen.queryByTestId('tier-offer-not-now')).toBeNull();
    // The Hub is told it was drawn.
    await waitFor(() => expect(seenCalls).toBe(1));

    await fireEvent.press(close);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-screen')).toBeNull();
    expect(seenCalls).toBe(1);
  });

  it('a person sees "Not now" at the bottom, and no X, when the admin switched the close button off', async () => {
    hub['GET /api/hub/me/tier-offer'] = ok({ show: true, closeButton: false });
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-screen')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    await waitFor(() => expect(home()).toBeTruthy());
  });

  it('a person can leave even when the tiers could not be loaded', async () => {
    hub['GET /api/hub/plans'] = 'offline';
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-screen')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('tier-offer-error')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(home()).toBeTruthy());
  });

  it("a person who taps Subscribe on a tier lands in that tier's checkout, with Home under it", async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-subscribe-plus')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('tier-offer-subscribe-plus'));
    await waitFor(() => expect(screen.getByRole('header', { name: 'route checkout' })).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-screen')).toBeNull();
    expect(seenCalls).toBe(1);
  });

  it('a person billed in dollars who taps Subscribe is led to the tiers sheet, which says what is open', async () => {
    hub['GET /api/hub/plans'] = ok(plans('USD'));
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('tier-offer-subscribe-founding')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('tier-offer-subscribe-founding'));
    await waitFor(() => expect(screen.getByRole('header', { name: 'route tiers' })).toBeTruthy());
  });
});

describe('a person the Hub does not offer the tiers to goes straight to Home', () => {
  it.each([
    ['a fan, or a person already shown it, or one who holds a tier', ok({ show: false, closeButton: true })],
    ['the Hub cannot be reached', 'offline'],
  ])('%s', async (_name, answer) => {
    hub['GET /api/hub/me/tier-offer'] = answer;
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-screen')).toBeNull();
    expect(seenCalls).toBe(0);
  });
});
