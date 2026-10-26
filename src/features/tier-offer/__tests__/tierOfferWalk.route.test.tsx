/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';

/**
 * A new creator's sign-up, walked in the merged root layout (TIER-OFFER round 2, F1): the Hub's first answer to "is this person offered the
 * tiers" is no (the account type it holds has not caught up with the write), the app asks once more after the type was written, and the
 * offer is on screen after A11 and before Home. WAWU ID's progress is a small stand-in, as in the VERIFY-01 walks.
 */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();
let mockTokens = { accessToken: '', refreshToken: 'new-refresh' };
let mockDone = 0;
const mockProgress = () => ({
  step: ['creator_setup'][mockDone] ?? 'done',
  inSequence: true,
  accountType: 'creator',
  steps: ['creator_setup'],
  emailProven: false,
});

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
  signupProgressRequest: jest.fn(async () => mockProgress()),
  signupCompleteStepRequest: jest.fn(async () => {
    mockDone += 1;
    return mockProgress();
  }),
}));
jest.mock('@/features/auth/signupStore', () => ({
  ...jest.requireActual('@/features/auth/signupStore'),
  heldSignup: () => ({ phone: '+2348031234567', attempt: 'secret' }),
}));

const ok = (data: unknown) => ({ statusCode: 200, message: 'OK', data });
const ADA = 'account-ada';
const tier = (id: string, name: string, priceMinor: number, products: number) => ({
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
  preselected: id === 'plus',
});
const plans = {
  currency: 'NGN',
  currencyFixed: false,
  extraProducts: { count: 5, priceMinor: 150000 },
  packs: [],
  checkoutBump: { points: 1000, priceMinor: 80000 },
  actions: [],
  caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 },
  tiers: [tier('verify', 'Verify', 299900, 3), tier('plus', 'Verify Plus', 599900, 6), tier('founding', 'Founding Maker', 999900, 10)],
};

/** The Hub's profile, as it is while the account-type write has not landed (a fan) and after it has (a creator). */
let hubType: 'user' | 'creator' = 'user';
const calls: Record<string, number> = {};
const hub: Record<string, unknown> = {
  'GET /api/hub/users/me': () => ok({ wawuUserId: ADA, accountType: hubType, firstName: 'Ada', lastName: 'Obi', handle: 'ada' }),
  'PUT /api/hub/users/me/account-type': () => {
    hubType = 'creator';
    return ok({ accountType: 'creator' });
  },
  'GET /api/hub/me/tier-offer': () => ok({ show: hubType === 'creator' && calls['GET /api/hub/me/tier-offer'] >= 2, closeButton: true }),
  'POST /api/hub/me/tier-offer/seen': ok({ seenAt: '2026-10-26T10:00:00.000Z' }),
  'GET /api/hub/plans': ok(plans),
  'GET /api/hub/product-drafts': ok([]),
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const key = `${request.method} ${new URL(request.url).pathname}`;
  calls[key] = (calls[key] ?? 0) + 1;
  const found = hub[key];
  const answer = typeof found === 'function' ? (found as () => unknown)() : found;
  if (!answer) throw new TypeError('Network request failed');
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
const CreatorSetupRoute = require('@/app/creator-setup').default as typeof import('@/app/creator-setup').default;
const TierOfferRoute = require('@/app/tier-offer').default as typeof import('@/app/tier-offer').default;
const VerifyBonusRoute = require('@/app/verify-bonus').default as typeof import('@/app/verify-bonus').default;
const WelcomeRoute = require('@/app/welcome').default as typeof import('@/app/welcome').default;
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { confirmSignupCode } = require('@/features/auth/signupFlow') as typeof import('@/features/auth/signupFlow');
const { resetSignupGate } = require('@/features/auth/signupGate') as typeof import('@/features/auth/signupGate');
const { setStarted } = require('@/features/auth/signupStore') as typeof import('@/features/auth/signupStore');
const { resetOfferStep } = require('@/features/claim/offerStep') as typeof import('@/features/claim/offerStep');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetBonusStep } = require('@/features/verify/bonusStep') as typeof import('@/features/verify/bonusStep');
const { setBonusGateDelaysForTests } = require('@/features/verify/bonusGate') as typeof import('@/features/verify/bonusGate');
const { resetTierOffer } = require('../offerStep') as typeof import('../offerStep');

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
  'creator-setup': CreatorSetupRoute,
  'tier-offer': TierOfferRoute,
  'verify-bonus': VerifyBonusRoute,
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockDone = 0;
  hubType = 'user';
  for (const key of Object.keys(calls)) delete calls[key];
  setBonusGateDelaysForTests([40, 40, 40, 40]);
  queryClient.clear();
  mockVault.clear();
  mockTokens = { accessToken: tokenFor(ADA), refreshToken: 'new-refresh' };
  resetSessionForTests();
  resetOfferStep();
  resetBonusStep();
  resetTierOffer();
  resetSignupGate();
});

describe('a new creator is offered the tiers although the Hub first answered no (TIER-OFFER round 2, F1)', () => {
  it('signs up, writes the account type, asks the Hub again, and shows the offer after A11 and before Home', async () => {
    await renderRouter(routes);
    await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
    setStarted({ channel: 'sms', maskedEmail: null, phoneNotSaved: false, emailCodeRequired: false, resendIn: 0, expiresIn: 600 });
    await act(async () => {
      await confirmSignupCode('123456', '');
    });
    await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('claim-offer-skip'));

    await waitFor(() => expect(screen.getByTestId('creator-setup')).toBeTruthy());
    expect(screen.queryByTestId('tier-offer-screen')).toBeNull();
    await fireEvent.press(screen.getByTestId('setup-later'));

    await waitFor(() => expect(screen.getByTestId('tier-offer-screen')).toBeTruthy());
    expect(screen.queryByRole('header', { name: 'Home' })).toBeNull();
    expect(calls['PUT /api/hub/users/me/account-type']).toBe(1);
    // The first answer was no (the Hub still held a fan when it was asked), the second yes: asked twice, not more.
    expect(calls['GET /api/hub/me/tier-offer']).toBe(2);
    await waitFor(() => expect(calls['POST /api/hub/me/tier-offer/seen']).toBe(1));
  });
});
