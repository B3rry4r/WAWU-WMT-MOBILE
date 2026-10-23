/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen, waitFor as waitForRaw } from 'expo-router/testing-library';

/**
 * SWEEP-FLOWS B4 and B5, on the merged root layout (the harness of signupWalks.route.test.tsx): a creator still inside sign-up setup who
 * holds a tier (bought from the checklist) can open "Record my voice" (VF8), and is never shown "Your bonus is waiting" (VF1) after Later.
 */
const waitFor = (check: () => void) => waitForRaw(check, { timeout: 15_000 });

jest.setTimeout(60_000);

const mockVault = new Map<string, string>();
let mockTokens = { accessToken: '', refreshToken: 'new-refresh' };
/** WAWU ID's side of the sign-up: the type picked at A2, the steps after the phone code, and how many are done. */
let mockType: 'user' | 'creator' = 'creator';
let mockDone = 0;
/** The tier the Hub says the person holds: null is an answer the app cannot read, `none` is a person with no tier. */
let mockTier: 'none' | 'active' | 'ending' | 'ended' | null = 'none';
const mockSteps = (): string[] => (mockType === 'creator' ? ['creator_setup'] : ['interests', 'follows']);
const mockProgress = () => ({
  step: mockSteps()[mockDone] ?? 'done',
  inSequence: true,
  accountType: mockType,
  steps: mockSteps(),
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
const chips = [
  ['music_audio', 'Music & Audio'],
  ['film_video', 'Film & Video'],
  ['photography', 'Photography'],
  ['fashion_beauty', 'Fashion & Beauty'],
  ['business_finance', 'Business & Finance'],
  ['technology', 'Technology'],
  ['food_lifestyle', 'Food & Lifestyle'],
  ['faith_spirituality', 'Faith & Spirituality'],
  ['art_design', 'Art & Design'],
  ['writing_publishing', 'Writing & Publishing'],
  ['sports_fitness', 'Sports & Fitness'],
  ['gaming_esports', 'Gaming & Esports'],
].map(([id, label]) => ({ id, label }));
let saved: string[] = [];
const interests = () => ok({ minimum: 3, options: chips, selected: saved });
const suggested = ok({
  items: [
    {
      wawuId: 'w-tife',
      name: 'Tife Adeola',
      handle: 'tife',
      avatarUrl: null,
      field: 'music_audio',
      pieceCount: 2,
      verification: { creator: { verified: true }, professional: { verified: false } },
      badge: null,
      following: false,
    },
  ],
});
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
// The Hub answers what the gate, the sign-up screens, VF1 and the shop ask; everything else cannot be reached (A11's four row reads
// fail, which it shows as a note and carries on). A function answers afresh each time.
const hub: Record<string, unknown> = {
  'GET /api/hub/users/me': () => ok({ wawuUserId: ADA, accountType: mockType }),
  'GET /api/hub/me/tier': () => (mockTier === null ? undefined : ok({ state: mockTier, tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null })),
  'PUT /api/hub/users/me/account-type': () => ok({ accountType: mockType }),
  'GET /api/hub/users/me/interests': interests,
  'PUT /api/hub/users/me/interests': interests,
  'GET /api/hub/explore/suggested-creators': suggested,
  'GET /api/hub/plans': ok(plans),
  'GET /api/hub/product-drafts': ok([]),
};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const found = hub[`${request.method} ${new URL(request.url).pathname}`];
  const answer = typeof found === 'function' ? (found as () => unknown)() : found;
  if (!answer) throw new TypeError('Network request failed');
  // The save is the one write whose body matters: the answer to the next read is what was sent.
  if (request.method === 'PUT' && request.url.endsWith('/users/me/interests')) {
    saved = ((await request.json()) as { interests: string[] }).interests;
    return new Response(JSON.stringify(interests()), { status: 200, headers: { 'content-type': 'application/json' } });
  }
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
const InterestsRoute = require('@/app/interests').default as typeof import('@/app/interests').default;
const PeopleToFollowRoute = require('@/app/people-to-follow').default as typeof import('@/app/people-to-follow').default;
const ShopRoute = require('@/app/shop').default as typeof import('@/app/shop').default;
const ShopProductRoute = require('@/app/shop-product').default as typeof import('@/app/shop-product').default;
const VoiceConsentRoute = require('@/app/voice-consent').default as typeof import('@/app/voice-consent').default;
const VerifyBonusRoute = require('@/app/verify-bonus').default as typeof import('@/app/verify-bonus').default;
const WelcomeRoute = require('@/app/welcome').default as typeof import('@/app/welcome').default;
const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
const { confirmSignupCode } = require('@/features/auth/signupFlow') as typeof import('@/features/auth/signupFlow');
const { resetSignupGate } = require('@/features/auth/signupGate') as typeof import('@/features/auth/signupGate');
const { setStarted } = require('@/features/auth/signupStore') as typeof import('@/features/auth/signupStore');
const { resetOfferStep } = require('@/features/claim/offerStep') as typeof import('@/features/claim/offerStep');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { resetBonusStep } = require('../bonusStep') as typeof import('../bonusStep');
const { setBonusGateDelaysForTests } = require('../bonusGate') as typeof import('../bonusGate');

/** Counts every time VF1's route is mounted or drawn: a discoverer must leave it at zero. */
const vf1Draws = jest.fn();
const CountedVf1 = () => {
  vf1Draws();
  return <VerifyBonusRoute />;
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
  'claim-offer': ClaimOfferRoute,
  'creator-setup': CreatorSetupRoute,
  interests: InterestsRoute,
  'people-to-follow': PeopleToFollowRoute,
  'verify-bonus': CountedVf1,
  shop: ShopRoute,
  'shop-product': ShopProductRoute,
  'voice-consent': VoiceConsentRoute,
};

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const tokenFor = (sub: string) => `${b64({ alg: 'RS256' })}.${b64({ sub, iat: 1000, exp: 4_000_000_000 })}.sig`;
const bonusFlag = () => mockVault.get(`wmt.verify.bonus.${ADA}`);
const home = () => screen.getByRole('header', { name: 'Home' });

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
  vf1Draws.mockClear();
}, 60_000);

beforeEach(() => {
  mockType = 'creator';
  mockDone = 0;
  mockTier = 'none';
  saved = [];
  vf1Draws.mockClear();
  setBonusGateDelaysForTests([40, 40, 40, 40]);
  queryClient.clear();
  mockVault.clear();
  mockTokens = { accessToken: tokenFor(ADA), refreshToken: 'new-refresh' };
  resetSessionForTests();
  resetOfferStep();
  resetBonusStep();
  resetSignupGate();
});

/** Sign-up's code step (A4) accepted the code, and the access-code step was skipped: the next screen is the first step after sign-up. */
const signUp = async () => {
  const first = await renderRouter(routes);
  await waitFor(() => expect(screen.getByTestId('welcome-sign-in')).toBeTruthy());
  setStarted({ channel: 'sms', maskedEmail: null, phoneNotSaved: false, emailCodeRequired: false, resendIn: 0, expiresIn: 600 });
  await act(async () => {
    await confirmSignupCode('123456', '');
  });
  await waitFor(() => expect(screen.getByTestId('claim-offer')).toBeTruthy());
  await fireEvent.press(screen.getByTestId('claim-offer-skip'));
  return first;
};


describe('SWEEP-FLOWS B4 · Record my voice works inside sign-up setup', () => {
  it('a creator on the setup checklist who opens /voice-consent lands on VF8, not back on the checklist', async () => {
    mockType = 'creator';
    mockTier = 'active';
    await signUp();
    await waitFor(() => expect(screen.getByTestId('creator-setup')).toBeTruthy());

    await act(async () => {
      router.push('/voice-consent');
    });
    await waitFor(() => expect(screen.queryByTestId('voice-consent-loading') ?? screen.queryByTestId('voice-consent-error') ?? screen.queryByTestId('voice-consent-card')).toBeTruthy());
    expect(screen.queryByTestId('creator-setup')).toBeNull();
  });
});

describe('SWEEP-FLOWS B5 · "Your bonus is waiting" is never shown to someone who holds a tier', () => {
  const laterThenHome = async () => {
    await signUp();
    await waitFor(() => expect(screen.getByTestId('creator-setup')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('setup-later'));
  };

  it.each(['active', 'ending'] as const)('a creator holding a %s tier goes from Later straight to Home', async (state) => {
    mockTier = state;
    await laterThenHome();
    await waitFor(() => expect(home()).toBeTruthy());
    expect(screen.queryByTestId('bonus-screen')).toBeNull();
    await waitFor(() => expect(bonusFlag()).toBe('done'));
  });

  it('a creator with no tier still gets VF1, once (the control)', async () => {
    mockTier = 'none';
    await laterThenHome();
    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
  });

  it('a tier the app cannot read does not end VF1: it is drawn (a failed read is not an answer)', async () => {
    mockTier = null;
    await laterThenHome();
    await waitFor(() => expect(screen.getByTestId('bonus-screen')).toBeTruthy());
  });
});
