/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';

/** The machine that runs these is often loaded: wait up to 15 s for a screen, never less than the default. */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();
/** What the code step's confirm request answers: the new account's first session. */
let mockTokens = { accessToken: '', refreshToken: 'new-refresh' };

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('@/api/identity', () => ({
  ...jest.requireActual('@/api/identity'),
  phoneVerifyConfirmRequest: jest.fn(async () => mockTokens),
}));
jest.mock('@/features/auth/signupStore', () => ({
  ...jest.requireActual('@/features/auth/signupStore'),
  heldSignup: () => ({ phone: '+2348031234567', attempt: 'secret' }),
}));

const ok = (data: unknown) => ({ statusCode: 200, message: 'OK', data });
const plans = {
  currency: 'NGN',
  currencyFixed: false,
  extraProducts: { count: 5, priceMinor: 150000 },
  packs: [],
  checkoutBump: { points: 1000, priceMinor: 80000 },
  actions: [{ id: 'voiceover_per_min', points: 250, per: 'minute' }],
  caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 },
  tiers: [
    { id: 'founding', name: 'Founding Maker', days: 365, products: 10, bonusPoints: 600, bonusPointsExpireDays: 365, priceMinor: 500000, eventPass: { id: 'c', name: 'Maker Pass, priority' }, badge: { id: 'founding', numbered: true }, packBonusPercent: 10, firstVoiceIntroIncluded: true, preselected: true },
  ],
};
const ADA = 'account-ada';
// The Hub answers the three things the creator gate, VF1 and VF2 ask; WAWU ID and everything else cannot be reached. Installed
// before the app is loaded: the API client keeps the fetch it finds when it is first loaded.
const profile = (accountType: string | null) => ok({ wawuUserId: ADA, accountType });
const hub: Record<string, unknown> = {
  'GET /api/hub/users/me': profile('creator'),
  'GET /api/hub/plans': ok(plans),
  'GET /api/hub/product-drafts': ok([]),
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const found = hub[`${request.method} ${new URL(request.url).pathname}`];
  // A function answers afresh each time (the profile that is not known yet, then known); 'offline' is a read that fails.
  const answer = typeof found === 'function' ? (found as () => unknown)() : found;
  if (!answer || answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const RootLayout = require('@/app/_layout').default as typeof import('@/app/_layout').default;
const TabsLayout = require('@/app/(tabs)/_layout').default as typeof import('@/app/(tabs)/_layout').default;
const Home = require('@/app/(tabs)/index').default as typeof import('@/app/(tabs)/index').default;
const Explore = require('@/app/(tabs)/explore').default as typeof import('@/app/(tabs)/explore').default;
const Inbox = require('@/app/(tabs)/inbox').default as typeof import('@/app/(tabs)/inbox').default;
const Wallet = require('@/app/(tabs)/wallet').default as typeof import('@/app/(tabs)/wallet').default;
const Me = require('@/app/(tabs)/me').default as typeof import('@/app/(tabs)/me').default;
const ClaimOfferRoute = require('@/app/claim-offer').default as typeof import('@/app/claim-offer').default;
const ShopRoute = require('@/app/shop').default as typeof import('@/app/shop').default;
const ShopProductRoute = require('@/app/shop-product').default as typeof import('@/app/shop-product').default;
const VerifyBonusRoute = require('@/app/verify-bonus').default as typeof import('@/app/verify-bonus').default;
const WelcomeRoute = require('@/app/welcome').default as typeof import('@/app/welcome').default;
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { ACCESS_KEY, REFRESH_KEY } = require('@/api/tokenStore') as typeof import('@/api/tokenStore');
const { confirmSignupCode } = require('@/features/auth/signupFlow') as typeof import('@/features/auth/signupFlow');
const { resetSignupGate } = require('@/features/auth/signupGate') as typeof import('@/features/auth/signupGate');
const { setStarted } = require('@/features/auth/signupStore') as typeof import('@/features/auth/signupStore');
const { resetOfferStep } = require('@/features/claim/offerStep') as typeof import('@/features/claim/offerStep');
const { offerKey } = require('@/features/claim/localStore') as typeof import('@/features/claim/localStore');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetBonusStep } = require('../bonusStep') as typeof import('../bonusStep');
const { setBonusGateDelaysForTests } = require('../bonusGate') as typeof import('../bonusGate');

const routes = {
  _layout: RootLayout,
  welcome: WelcomeRoute,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/explore': Explore,
  '(tabs)/inbox': Inbox,
  '(tabs)/wallet': Wallet,
  '(tabs)/me': Me,
  'claim-offer': ClaimOfferRoute,
  'verify-bonus': VerifyBonusRoute,
  shop: ShopRoute,
  'shop-product': ShopProductRoute,
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;
const bonusFlag = (sub: string) => mockVault.get(`wmt.verify.bonus.${sub}`);

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  hub['GET /api/hub/users/me'] = profile('creator');
  setBonusGateDelaysForTests([40, 40, 40, 40]);
  // The app's one cache outlives a test: an earlier test's profile would answer this one's first read.
  queryClient.clear();
  mockVault.clear();
  mockTokens = { accessToken: tokenFor(ADA), refreshToken: 'new-refresh' };
  resetSessionForTests();
  resetOfferStep();
  resetBonusStep();
  resetSignupGate();
});

const home = () => screen.getByRole('header', { name: 'Home' });

/** Sign-up's code step (A4) accepted the code: the new account's first session is adopted. */
const acceptCode = async () => {
  setStarted({ channel: 'sms', maskedEmail: null, phoneNotSaved: false, emailCodeRequired: false, resendIn: 0, expiresIn: 600 });
  await act(async () => {
    await confirmSignupCode('123456', '');
  });
};

describe('right after the code is accepted a new person lands on "Your bonus is waiting" once (VERIFY-01 #1)', () => {
  it('goes access code, then VF1, then "Build my shop" opens the shop, and VF1 never comes again', async () => {
    const first = await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    await acceptCode();

    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    await fireEvent.press(screen.getByTestId('claim-offer-skip'));

    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    // Showing it once is enough: it settled itself the moment it was drawn.
    await waitFor(() => expect(bonusFlag(ADA)).toBe('done'));

    await fireEvent.press(await screen.findByTestId('bonus-build'));
    await waitFor(() => expect(screen.getByTestId('shop-screen')).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    await first.unmount();

    // The next start, same phone, same account: Home, and no VF1.
    resetSessionForTests();
    resetOfferStep();
    resetBonusStep();
    resetSignupGate();
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    expect(screen.queryByTestId('claim-offer')).toBeNull();
  });

  it('does not come back on the next start when the person closed the app on it without choosing', async () => {
    const first = await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    await acceptCode();
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('claim-offer-skip'));
    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
    await waitFor(() => expect(bonusFlag(ADA)).toBe('done'));
    await first.unmount();

    resetSessionForTests();
    resetOfferStep();
    resetBonusStep();
    resetSignupGate();
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
  });

  it('shows nothing to an account that signed in without being marked, and nothing to one whose step is done', async () => {
    mockVault.set(ACCESS_KEY, tokenFor(ADA));
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    const first = await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    expect(bonusFlag(ADA)).toBeUndefined();
    await first.unmount();

    resetSessionForTests();
    resetBonusStep();
    resetSignupGate();
    mockVault.set(`wmt.verify.bonus.${ADA}`, 'done');
    mockVault.set(offerKey(ADA), 'done');
    await renderRouter(routes);
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
  });
});

describe('VF1 waits until the Hub knows the account type (VERIFY-01 round 3)', () => {
  /** The code was accepted and the access-code step skipped: VF1's route is the next screen. */
  const toVf1 = async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    await acceptCode();
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('claim-offer-skip'));
  };
  const notFinished = () => {
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    expect(bonusFlag(ADA)).not.toBe('done');
  };

  it('a new account whose Hub profile has no account type yet is not sent Home, and VF1 lands once the Hub knows', async () => {
    let asks = 0;
    hub['GET /api/hub/users/me'] = () => (++asks <= 2 ? profile(null) : profile('creator'));
    await toVf1();
    await waitFor(() => expect(screen.getByTestId('bonus-gate-loading')).toBeTruthy());
    notFinished();
    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
    expect(asks).toBeGreaterThan(2);
    expect(screen.queryByTestId('bonus-gate')).toBeNull();
    // Drawn, so it settles: the next start does not bring it back.
    await waitFor(() => expect(bonusFlag(ADA)).toBe('done'));
  });

  it('a type the Hub never learns stops asking, says so with "Try again", and still has not finished the step', async () => {
    hub['GET /api/hub/users/me'] = profile(null);
    await toVf1();
    await waitFor(() => expect(screen.getByTestId('bonus-gate-waiting')).toBeTruthy());
    notFinished();
    expect(bonusFlag(ADA)).toBe('pending');

    // The Hub knows now: Try again lands on VF1.
    hub['GET /api/hub/users/me'] = profile('creator');
    await fireEvent.press(screen.getByText('Try again'));
    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
  });

  it('a profile read that fails shows the error with "Try again" and never finishes the once-only step', async () => {
    hub['GET /api/hub/users/me'] = 'offline';
    await toVf1();
    await waitFor(() => expect(screen.getByTestId('bonus-gate-error')).toBeTruthy());
    notFinished();
    expect(bonusFlag(ADA)).toBe('pending');

    hub['GET /api/hub/users/me'] = profile('creator');
    await fireEvent.press(screen.getByText('Try again'));
    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
    expect(screen.queryByTestId('bonus-gate-error')).toBeNull();
  });

  it('a known non-creator ends the step and goes Home, without VF1', async () => {
    hub['GET /api/hub/users/me'] = profile('user');
    await toVf1();
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    await waitFor(() => expect(bonusFlag(ADA)).toBe('done'));
  });
});

describe('the shop is for signed-in people (VERIFY-01 #2)', () => {
  it.each(['/shop', '/shop-product', '/verify-bonus'])('a signed-out person opening %s goes to the sign-in screens, never to it', async (url) => {
    await renderRouter(routes, { initialUrl: url });
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    expect(screen.queryByTestId('shop-screen')).toBeNull();
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
  });

  it('a signed-in person opening /shop reaches their shop, and a draft form opens from it', async () => {
    mockVault.set(ACCESS_KEY, tokenFor(ADA));
    mockVault.set(REFRESH_KEY, 'stored-refresh');
    await renderRouter(routes, { initialUrl: '/shop' });
    await waitFor(() => expect(screen.getByTestId('shop-screen')).toBeTruthy());
    await fireEvent.press(await screen.findByTestId('shop-add'));
    await waitFor(() => expect(screen.getByTestId('draft-form')).toBeTruthy());
  });
});
