/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer | Answer[]> = {};
let asked: string[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    asked.push(`${request.method} ${url.pathname}${url.search}`);
    const queued = answers[`${request.method} ${url.pathname}${url.search}`] ?? answers[`${request.method} ${url.pathname}`];
    const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer === 'hang') return new Promise<Response>(() => undefined);
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { MeScreen } = require('../MeScreen') as typeof import('../MeScreen');

const ME = '/api/hub/users/me';
const FIELDS = '/api/hub/users/me/profile-fields';
const STATS = '/api/hub/users/me/profile-stats';
const GRID = '/api/hub/users/u1/content';
const TIER = '/api/hub/me/tier';
const DRAFTS = '/api/hub/product-drafts';

const profile = (over: Record<string, unknown> = {}) => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  bio: 'Filmmaker and brand strategist.',
  avatarUrl: null,
  coverUrl: null,
  instagramHandle: null,
  tiktokHandle: null,
  xHandle: null,
  youtubeUrl: null,
  facebookUrl: null,
  linkedinUrl: null,
  websiteUrl: null,
  createdAt: '2025-03-10T09:00:00.000Z',
  experience: [],
  verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
  ...over,
});
const details = (badge: unknown = null) => ({ wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null, badge });
const stats = { wawuUserId: 'u1', followerCount: 12, followingCount: 3, postCount: 2 };
const piece = (id: string) => ({ id, title: `Piece ${id}`, contentType: 'image', accessType: 'free', price: 0, views: 12000, previewAssetUrl: `https://files.test/${id}.jpg` });
const draft = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  title,
  contentType: 'video',
  description: null,
  category: null,
  specializations: [],
  tags: [],
  accessType: 'paid',
  price: 4500,
  missing: ['file'],
  createdAt: '2026-10-10T09:00:00.000Z',
  updatedAt: '2026-10-10T09:00:00.000Z',
  ...over,
});
const tierView = (over: Record<string, unknown> = {}) => ({
  state: 'active',
  tier: { id: 'verify_plus', name: 'Verify Plus', badge: { id: 'verify_plus', numbered: false } },
  activeFrom: '2026-10-01T00:00:00.000Z',
  activeUntil: '2026-11-26T10:00:00.000Z',
  productsAllowed: 7,
  productsUsed: 2,
  extraProducts: 0,
  pointsIncluded: 0,
  firstVoiceIntroIncluded: false,
  eventPass: null,
  ...over,
});

function base(over: Record<string, Answer | Answer[]> = {}) {
  return {
    [`GET ${ME}`]: ok(profile()),
    [`GET ${FIELDS}`]: ok(details()),
    [`GET ${STATS}`]: ok(stats),
    [`GET ${GRID}?page=1&perPage=18`]: ok([piece('p1'), piece('p2')], { pagination: { currentPage: 1, nextPage: null } }),
    [`GET ${TIER}`]: ok(tierView()),
    [`GET ${DRAFTS}`]: ok([]),
    ...over,
  } as Record<string, Answer | Answer[]>;
}

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

async function boot() {
  await render(frame(<MeScreen onEditProfile={jest.fn()} onAddWork={jest.fn()} onOpenWork={jest.fn()} onOpenSettings={jest.fn()} />));
}

beforeEach(() => {
  answers = {};
  asked = [];
  // An end date is read against today, so the clock is the day these were written on (FIX-78 F-3): none changes with the calendar.
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'], now: new Date('2026-10-18T09:00:00Z') });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('M1 · tier badge and products meter (DV2-03)', () => {
  it('a person with a running tier sees its badge by their name and "N of M products" with the tier and its end day, all from the Hub', async () => {
    answers = base();
    await boot();
    expect(await screen.findByTestId('me-products')).toBeTruthy();
    expect(screen.getByTestId('me-products')).toHaveTextContent(/2 of 7 products/);
    expect(screen.getByTestId('me-products')).toHaveTextContent(/Verify Plus · ends 26 Nov/);
    expect(screen.getByTestId('me-products').props.accessibilityValue).toEqual({ min: 0, max: 7, now: 2 });
    expect(within(screen.getByTestId('me-tier-badge')).getByText('Verify Plus')).toBeTruthy();
    expect(asked).toContain(`GET ${TIER}`);
    expect(screen.queryByTestId('me-products-loading')).toBeNull();
  });

  it('a 12-month tier bought today shows its year, so it never reads as ending today (FIX-78 F-3)', async () => {
    answers = base({ [`GET ${TIER}`]: ok(tierView({ tier: { id: 'founding_maker', name: 'Founding Maker', badge: null }, activeFrom: '2026-10-18T09:00:00.000Z', activeUntil: '2027-10-18T09:00:00.000Z' })) });
    await boot();
    expect(await screen.findByTestId('me-products')).toHaveTextContent(/Founding Maker · ends 18 Oct 2027/);
  });

  it('a tier that is ending still shows both, and the meter follows the Hub when the person has added products', async () => {
    answers = base({ [`GET ${TIER}`]: ok(tierView({ state: 'ending', productsAllowed: 9, productsUsed: 9, extraProducts: 4 })) });
    await boot();
    expect(await screen.findByTestId('me-products')).toHaveTextContent(/9 of 9 products/);
    expect(screen.getByTestId('me-tier-badge')).toBeTruthy();
  });

  it('a numbered badge carries its number from the profile details ("Founding Maker #128")', async () => {
    answers = base({
      [`GET ${TIER}`]: ok(tierView({ tier: { id: 'founding_maker', name: 'Founding Maker', badge: { id: 'founding_maker', numbered: true } } })),
      [`GET ${FIELDS}`]: ok(details({ id: 'founding_maker', numbered: true, name: 'Founding Maker', number: 128 })),
    });
    await boot();
    expect(await screen.findByTestId('me-tier-badge')).toHaveTextContent('Founding Maker #128');
    expect(screen.getByLabelText('Founding Maker tier, number 128')).toBeTruthy();
  });

  it('a person with no tier sees neither the badge nor the meter, and no block is left where the meter loaded', async () => {
    answers = base({
      [`GET ${TIER}`]: ok(tierView({ state: 'none', tier: null, activeFrom: null, activeUntil: null, productsAllowed: 0, productsUsed: 0 })),
    });
    await boot();
    expect(await screen.findByTestId('me-name')).toBeTruthy();
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
    expect(screen.queryByTestId('me-tier-badge')).toBeNull();
    expect(screen.queryByTestId('me-products')).toBeNull();
    expect(screen.queryByTestId('me-products-loading')).toBeNull();
    expect(screen.queryByTestId('me-tier-error')).toBeNull();
  });

  it('a tier that has ended shows neither (nothing is running to show)', async () => {
    answers = base({ [`GET ${TIER}`]: ok(tierView({ state: 'ended', activeUntil: '2026-09-01T10:00:00.000Z' })) });
    await boot();
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
    expect(screen.queryByTestId('me-tier-badge')).toBeNull();
    expect(screen.queryByTestId('me-products')).toBeNull();
  });

  it('while the tier is on its way the meter is a block of its size and the profile is already there', async () => {
    answers = base({ [`GET ${TIER}`]: 'hang' });
    await boot();
    expect(await screen.findByTestId('me-name')).toBeTruthy();
    expect(screen.getByTestId('me-products-loading')).toBeTruthy();
    expect(screen.queryByTestId('me-tier-badge')).toBeNull();
  });

  it('a tier that fails to load leaves the profile on screen with a note and a retry that brings the badge and meter', async () => {
    answers = base({ [`GET ${TIER}`]: [refusal(500, 'Server error'), ok(tierView())] });
    await boot();
    expect(await screen.findByTestId('me-tier-error')).toHaveTextContent('Your tier did not load');
    expect(screen.getByTestId('me-name')).toBeTruthy();
    expect(screen.queryByTestId('me-products')).toBeNull();
    await fireEvent.press(screen.getByTestId('me-tier-error-retry'));
    expect(await screen.findByTestId('me-products')).toHaveTextContent(/2 of 7 products/);
    expect(screen.queryByTestId('me-tier-error')).toBeNull();
  });

  it('draws no Voice Intro player, Bio label or AI voice tag for a person with no Voice Intro made (R-47)', async () => {
    answers = base();
    await boot();
    await screen.findByTestId('me-products');
    expect(screen.queryByText('Bio')).toBeNull();
    expect(screen.queryByText('AI voice')).toBeNull();
    expect(screen.queryByLabelText(/play|voice/i)).toBeNull();
    expect(screen.queryByText('Get your professional tick')).toBeNull();
    expect(screen.queryByText('Shop')).toBeNull();
  });
});

describe('M1 · drafts in the Content grid (DV2-03)', () => {
  it('a person with drafts sees each tagged Draft, ahead of their published pieces, with the draft titles', async () => {
    answers = base({ [`GET ${DRAFTS}`]: ok([draft('d1', 'Colour LUT pack'), draft('d2', 'Brand deck', { contentType: null, price: null, accessType: null })]) });
    await boot();
    expect(await screen.findByTestId('me-tile-d1-draft')).toHaveTextContent('Draft');
    expect(screen.getByTestId('me-tile-d2-draft')).toHaveTextContent('Draft');
    expect(screen.getByTestId('me-tile-d1-caption')).toHaveTextContent('Colour LUT pack');
    expect(screen.getByLabelText('Colour LUT pack, draft')).toBeTruthy();
    // Published pieces carry no tag and keep their figure.
    expect(screen.queryByTestId('me-tile-p1-draft')).toBeNull();
    expect(screen.getByTestId('me-tile-p1-caption')).toHaveTextContent('12K');
    // Drafts lead: the first row of the grid is the two drafts and the first piece.
    const ids = screen.getAllByTestId(/^me-tile-[a-z0-9]+$/).map((tile) => tile.props.testID);
    expect(ids).toEqual(['me-tile-d1', 'me-tile-d2', 'me-tile-p1', 'me-tile-p2']);
  });

  it('a draft is not pressable yet: the screen that finishes it is VERIFY-01\'s (R-47)', async () => {
    answers = base({ [`GET ${DRAFTS}`]: ok([draft('d1', 'Colour LUT pack')]) });
    await boot();
    const tile = await screen.findByTestId('me-tile-d1');
    expect(tile.props.onClick ?? tile.props.onPress).toBeUndefined();
    expect(within(tile).queryByRole('button')).toBeNull();
  });

  it('a person with no drafts sees the grid as before, with no tag', async () => {
    answers = base();
    await boot();
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
    expect(screen.queryByText('Draft')).toBeNull();
    expect(asked).toContain(`GET ${DRAFTS}`);
  });

  it('drafts alone fill the grid: the empty state is for no pieces and no drafts', async () => {
    answers = base({
      [`GET ${GRID}?page=1&perPage=18`]: ok([], { pagination: { currentPage: 1, nextPage: null } }),
      [`GET ${DRAFTS}`]: ok([draft('d1', 'Colour LUT pack')]),
    });
    await boot();
    expect(await screen.findByTestId('me-tile-d1-draft')).toBeTruthy();
    expect(screen.queryByTestId('me-grid-empty')).toBeNull();
  });

  it('with no pieces and no drafts the empty state stays', async () => {
    answers = base({ [`GET ${GRID}?page=1&perPage=18`]: ok([], { pagination: { currentPage: 1, nextPage: null } }) });
    await boot();
    expect(await screen.findByTestId('me-grid-empty')).toBeTruthy();
  });

  // SWEEP-APP DV2-03 L1: the pieces waited for the drafts read, so one that never answered kept them hidden.
  it('draws the published pieces while the drafts read has not answered, and puts the drafts in front when it does', async () => {
    answers = base({ [`GET ${DRAFTS}`]: 'hang' });
    await boot();
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
    expect(screen.getByTestId('me-tile-p2')).toBeTruthy();
    expect(screen.queryByTestId('me-grid-loading')).toBeNull();
  });

  it('keeps the skeleton, not an empty state, while the drafts read is out and there are no pieces to draw', async () => {
    answers = base({
      [`GET ${DRAFTS}`]: 'hang',
      [`GET ${GRID}?page=1&perPage=18`]: ok([], { pagination: { currentPage: 1, nextPage: null } }),
    });
    await boot();
    expect(await screen.findByTestId('me-grid-loading')).toBeTruthy();
    expect(screen.queryByTestId('me-grid-empty')).toBeNull();
  });

  // SWEEP-APP DV2-03 L4: two notes can show together, and both read "Try again" to a screen reader.
  it('names what each retry mark retries, so the tier note and the drafts note are told apart', async () => {
    answers = base({ [`GET ${TIER}`]: refusal(500, 'Server error'), [`GET ${DRAFTS}`]: refusal(500, 'Server error') });
    await boot();
    expect(await screen.findByTestId('me-tier-error')).toBeTruthy();
    expect(await screen.findByTestId('me-drafts-error')).toBeTruthy();
    expect(screen.getByLabelText('Try loading your tier again')).toBe(screen.getByTestId('me-tier-error-retry'));
    expect(screen.getByLabelText('Try loading your drafts again')).toBe(screen.getByTestId('me-drafts-error-retry'));
    expect(screen.queryByLabelText('Try again')).toBeNull();
  });

  it('drafts that fail to load leave the pieces on screen with a note and a retry that brings the drafts', async () => {
    answers = base({ [`GET ${DRAFTS}`]: [refusal(500, 'Server error'), ok([draft('d1', 'Colour LUT pack')])] });
    await boot();
    expect(await screen.findByTestId('me-drafts-error')).toHaveTextContent('Your drafts did not load');
    expect(screen.getByTestId('me-tile-p1')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('me-drafts-error-retry'));
    expect(await screen.findByTestId('me-tile-d1-draft')).toBeTruthy();
    expect(screen.queryByTestId('me-drafts-error')).toBeNull();
  });

  it('a plain (non-creator) account never asks for drafts', async () => {
    answers = base({ [`GET ${ME}`]: ok(profile({ accountType: 'buyer' })), [`GET ${DRAFTS}`]: refusal(403, 'A creator account type is required') });
    await boot();
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
    expect(asked.some((call) => call.includes(DRAFTS))).toBe(false);
    expect(screen.queryByTestId('me-drafts-error')).toBeNull();
  });

  it('a Hub that refuses a creator the drafts (403) shows the grid without them and no error', async () => {
    answers = base({ [`GET ${DRAFTS}`]: refusal(403, 'A creator account type is required') });
    await boot();
    expect(await screen.findByTestId('me-tile-p1')).toBeTruthy();
    expect(screen.queryByTestId('me-drafts-error')).toBeNull();
  });
});
