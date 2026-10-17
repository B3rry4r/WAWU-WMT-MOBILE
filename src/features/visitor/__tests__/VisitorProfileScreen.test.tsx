/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
const { VisitorProfileScreen } = require('../VisitorProfileScreen') as typeof import('../VisitorProfileScreen');

const VISIT = '/api/hub/users/u2/visitor-profile';
const GRID = '/api/hub/users/u2/content?page=1&perPage=18';
const FOLLOW = '/api/hub/creators/u2/follow';
const BLOCK = '/api/hub/settings/privacy/blocked';

const view = (over: Record<string, unknown> = {}, profileOver: Record<string, unknown> = {}) => ({
  name: 'Lennox Emmanuel',
  own: false,
  following: false,
  profile: {
    wawuUserId: 'u2',
    handle: 'lennox',
    bio: 'Filmmaker and brand strategist. Teaching African creators.',
    avatarUrl: null,
    coverUrl: null,
    headline: 'Filmmaker and brand strategist',
    company: 'Lennox Films',
    instagramHandle: 'lennox.films',
    tiktokHandle: null,
    xHandle: null,
    youtubeUrl: null,
    facebookUrl: null,
    linkedinUrl: null,
    whatsappHandle: null,
    websiteUrl: null,
    interests: [],
    verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
    experience: [{ id: 'r1', title: 'Founder, director', company: 'Lennox Films', location: null, startedOn: '2021-01', endedOn: null, current: true, description: null }],
    dmEnabled: true,
    dmPrice: 300,
    dmResponseHours: 24,
    evgScore: 0,
    contentCount: 48,
    followerCount: 12500,
    followingCount: 486,
    communityCount: 0,
    ...profileOver,
  },
  fields: {
    wawuUserId: 'u2',
    location: 'Lagos, Nigeria',
    skills: ['Brand film', 'Pricing'],
    openTo: ['Brand films', 'Workshops'],
    threadsHandle: null,
    socialOrder: [],
    memberSince: '2025-03-10T09:00:00.000Z',
    badge: null,
  },
  listings: [{ id: 'l1', headline: 'Brand strategy sessions', category: 'marketing' }],
  ...over,
});
const piece = (id: string, accessType: 'free' | 'paid', price: number, views: number) => ({ id, title: `Piece ${id}`, contentType: 'image', accessType, price, views, previewAssetUrl: `https://files.test/${id}.jpg` });
const works = {
  owner: { wawuId: 'u2', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null },
  count: 12,
  categories: [],
  works: [{ id: 'w1', title: 'Brand film', role: 'Director', client: null, year: 2025, link: null, category: null, description: null, media: [{ url: 'https://files.test/w1.jpg', kind: 'image' }], position: 0, createdAt: '2026-10-01T00:00:00.000Z' }],
};
const education = [{ id: 'e1', school: 'University of Lagos', field: 'Mass Communication', startYear: 2014, endYear: 2018, current: false }];

function page(extra: Record<string, Answer | Answer[]> = {}) {
  return {
    [`GET ${VISIT}`]: ok(view()),
    [`GET ${GRID}`]: ok([piece('p1', 'free', 0, 12000), piece('p2', 'paid', 8000, 3)], { pagination: { currentPage: 1, nextPage: null } }),
    'GET /api/hub/users/u2/featured-works': ok(works),
    'GET /api/hub/users/u2/education': ok(education),
    ...extra,
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

async function boot(pay = false) {
  const h = { onBack: jest.fn(), onOwn: jest.fn(), onOpenAllWorks: jest.fn(), onOpenWork: jest.fn(), onOpenListing: jest.fn(), onBlocked: jest.fn() };
  const handlers = pay ? { onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() } : undefined;
  await render(frame(<VisitorProfileScreen wawuId="u2" {...h} pay={handlers} />));
  return h;
}

const count = (needle: string) => asked.filter((line) => line.startsWith(needle)).length;

beforeEach(() => {
  answers = {};
  asked = [];
  // Every wait goes through `findBy` or `waitFor`, on the test's clock; `queueMicrotask` stays real because React's `act` queues on it.
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('M5 and M6 · someone else\'s profile', () => {
  it('a user sees the name, tick, bio, counts and Follow, and the tabs Content, Services and About (no Shop, no Message, no Edit)', async () => {
    answers = page();
    await boot();
    expect(await screen.findByTestId('me-name')).toHaveTextContent('Lennox Emmanuel');
    expect(screen.getByLabelText('Creator tick')).toBeTruthy();
    expect(screen.getByTestId('me-bio')).toHaveTextContent('Filmmaker and brand strategist. Teaching African creators.');
    expect(screen.getByTestId('me-count-followers')).toHaveTextContent('12.5K followers');
    expect(screen.getByTestId('me-count-following')).toHaveTextContent('486 following');
    expect(screen.getByTestId('me-count-pieces')).toHaveTextContent('48 pieces');
    expect(screen.getByTestId('visitor-follow')).toHaveTextContent('Follow');
    expect(screen.getByTestId('me-tab-content')).toBeTruthy();
    expect(screen.getByTestId('me-tab-services')).toBeTruthy();
    expect(screen.getByTestId('me-tab-about')).toBeTruthy();
    expect(screen.queryByText('Shop')).toBeNull();
    expect(screen.queryByText(/^Message/)).toBeNull();
    expect(screen.queryByTestId('me-edit')).toBeNull();
    expect(await screen.findByTestId('me-grid')).toBeTruthy();
  });

  it('a user can Follow and the button reads Following, written once, then Unfollow once (M6)', async () => {
    answers = page({ [`POST ${FOLLOW}`]: ok({ following: true }), [`DELETE ${FOLLOW}`]: ok({ following: false }) });
    await boot();
    const button = await screen.findByTestId('visitor-follow');
    answers[`GET ${VISIT}`] = ok(view({ following: true }));
    await fireEvent.press(button);
    await fireEvent.press(button);
    await waitFor(() => expect(screen.getByTestId('visitor-follow')).toHaveTextContent('Following'));
    expect(count('POST /api/hub/creators/u2/follow')).toBe(1);
    // The write is done once the counts are asked for again; a tap before that is ignored.
    await waitFor(() => expect(count('GET /api/hub/users/u2/visitor-profile')).toBe(2));
    await waitFor(() => expect(screen.getByTestId('visitor-follow')).toBeEnabled());
    answers[`GET ${VISIT}`] = ok(view({ following: false }));
    await fireEvent.press(screen.getByTestId('visitor-follow'));
    await waitFor(() => expect(screen.getByTestId('visitor-follow')).toHaveTextContent('Follow'));
    expect(count('DELETE /api/hub/creators/u2/follow')).toBe(1);
    expect(count('POST /api/hub/creators/u2/follow')).toBe(1);
  });

  it('a user whose follow the Hub refuses sees Follow again and a short line, not a stuck Following', async () => {
    answers = page({ [`POST ${FOLLOW}`]: refusal(500, 'boom') });
    await boot();
    await fireEvent.press(await screen.findByTestId('visitor-follow'));
    expect(await screen.findByTestId('visitor-notice')).toBeTruthy();
    expect(screen.getByTestId('visitor-follow')).toHaveTextContent('Follow');
  });

  it('a user sees the Hub\'s answer, and no half-drawn profile, for a person who is blocked or gone', async () => {
    answers = { [`GET ${VISIT}`]: refusal(404, 'User not found') };
    const h = await boot();
    expect(await screen.findByTestId('visitor-unavailable')).toBeTruthy();
    expect(screen.getByText('User not found')).toBeTruthy();
    expect(screen.queryByTestId('me-name')).toBeNull();
    expect(screen.queryByTestId('visitor-follow')).toBeNull();
    await fireEvent.press(screen.getByText('Go back'));
    expect(h.onBack).toHaveBeenCalled();
  });

  it('a user can try again when the profile did not load', async () => {
    answers = { [`GET ${VISIT}`]: 'offline' };
    await boot();
    expect(await screen.findByTestId('visitor-error')).toBeTruthy();
    answers = page();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('me-name')).toBeTruthy();
  });

  it('a person who opens their own profile is sent to the Me tab', async () => {
    answers = page({ [`GET ${VISIT}`]: ok(view({ own: true })) });
    const h = await boot();
    await waitFor(() => expect(h.onOwn).toHaveBeenCalled());
    expect(screen.queryByTestId('me-name')).toBeNull();
  });

  it('a user sees an empty Content tab when the person has published nothing', async () => {
    answers = page({ [`GET ${GRID}`]: ok([], { pagination: { currentPage: 1, nextPage: null } }) });
    await boot();
    expect(await screen.findByTestId('visitor-grid-empty')).toBeTruthy();
  });

  it('a user can open the person\'s listing from Services, and sees the paid messages line', async () => {
    answers = page();
    const h = await boot();
    await fireEvent.press(await screen.findByTestId('me-tab-services'));
    expect(await screen.findByTestId('me-service-paid-sub')).toHaveTextContent('₦300 a message · replies within 24 hours');
    await fireEvent.press(screen.getByTestId('me-service-listing-l1-open'));
    expect(h.onOpenListing).toHaveBeenCalledWith('l1');
  });

  it('a user sees "No services yet" for a person with no paid messages and no listing', async () => {
    answers = page({ [`GET ${VISIT}`]: ok(view({ listings: [] }, { dmEnabled: false })) });
    await boot();
    await fireEvent.press(await screen.findByTestId('me-tab-services'));
    expect(await screen.findByTestId('visitor-services-empty')).toBeTruthy();
  });

  it('a user sees the tip button only when the page can take a payment, and no Message button either way', async () => {
    answers = page();
    await boot(true);
    expect(await screen.findByTestId('visitor-tip')).toBeTruthy();
    expect(screen.queryByText(/^Message/)).toBeNull();
  });

  it('a user can Block from the menu after a confirmation, written once, and leaves the profile', async () => {
    answers = page({ [`POST ${BLOCK}`]: { status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'b1', userWawuId: 'me', blockedWawuId: 'u2', blockedAt: '2026-10-17T00:00:00.000Z' } } } });
    const h = await boot();
    await fireEvent.press(await screen.findByTestId('visitor-menu-button'));
    await fireEvent.press(await screen.findByTestId('visitor-menu-block'));
    expect(await screen.findByTestId('visitor-block-confirm')).toBeTruthy();
    expect(count('POST /api/hub/settings/privacy/blocked')).toBe(0);
    await fireEvent.press(screen.getByTestId('visitor-block-yes'));
    await waitFor(() => expect(h.onBlocked).toHaveBeenCalled());
    expect(count('POST /api/hub/settings/privacy/blocked')).toBe(1);
  });
});

describe('M33 · About, as a visitor', () => {
  it('a user sees the CV: headline, place, open to, featured works, experience, skills and education, with Follow pinned', async () => {
    answers = page();
    await boot();
    await fireEvent.press(await screen.findByTestId('me-tab-about'));
    expect(await screen.findByTestId('visitor-headline')).toHaveTextContent('Filmmaker and brand strategist · Lennox Films');
    expect(screen.getByTestId('visitor-place')).toHaveTextContent('Lagos, Nigeria · On Who Made This? since 2025');
    expect(screen.getByText('Open to brand films')).toBeTruthy();
    expect(screen.getByText('Workshops')).toBeTruthy();
    expect(await screen.findByTestId('visitor-works-more')).toHaveTextContent('See all 12');
    expect(screen.getByTestId('visitor-experience')).toBeTruthy();
    expect(screen.getByTestId('visitor-skills')).toBeTruthy();
    expect(await screen.findByTestId('visitor-school-e1')).toBeTruthy();
    expect(screen.getByText('Mass Communication · 2014 to 2018')).toBeTruthy();
    expect(screen.getByTestId('visitor-foot')).toBeTruthy();
    expect(screen.queryByText(/^Message/)).toBeNull();
  });

  it('a user can See all works (M34), open a work (M35) and Follow from the pinned bar', async () => {
    answers = page({ [`POST ${FOLLOW}`]: ok({ following: true }) });
    const h = await boot();
    await fireEvent.press(await screen.findByTestId('me-tab-about'));
    await fireEvent.press(await screen.findByTestId('visitor-works-more'));
    expect(h.onOpenAllWorks).toHaveBeenCalledWith('u2');
    await fireEvent.press(screen.getByTestId('visitor-work-w1'));
    expect(h.onOpenWork).toHaveBeenCalledWith('u2', 'w1');
    answers[`GET ${VISIT}`] = ok(view({ following: true }));
    await fireEvent.press(screen.getByTestId('visitor-follow'));
    await waitFor(() => expect(screen.getByTestId('visitor-follow')).toHaveTextContent('Following'));
    expect(count('POST /api/hub/creators/u2/follow')).toBe(1);
  });

  it('a user sees a note and a way to retry when the works did not load, with the rest of the page still there', async () => {
    answers = page({ 'GET /api/hub/users/u2/featured-works': 'offline' });
    await boot();
    await fireEvent.press(await screen.findByTestId('me-tab-about'));
    expect(await screen.findByTestId('visitor-works-error')).toBeTruthy();
    expect(screen.getByTestId('visitor-headline')).toBeTruthy();
  });

  it('a user sees nothing for a CV part the person left empty', async () => {
    answers = page({
      [`GET ${VISIT}`]: ok({ ...view({ listings: [] }, { experience: [], headline: null, company: null }), fields: { ...view().fields, skills: [], openTo: [] } }),
      'GET /api/hub/users/u2/featured-works': ok({ ...works, count: 0, works: [] }),
      'GET /api/hub/users/u2/education': ok([]),
    });
    await boot();
    await fireEvent.press(await screen.findByTestId('me-tab-about'));
    await waitFor(() => expect(screen.queryByTestId('visitor-works-loading')).toBeNull());
    expect(screen.queryByTestId('visitor-works')).toBeNull();
    expect(screen.queryByTestId('visitor-experience')).toBeNull();
    expect(screen.queryByTestId('visitor-skills')).toBeNull();
    expect(screen.queryByTestId('visitor-education')).toBeNull();
    expect(screen.queryByTestId('visitor-headline')).toBeNull();
  });
});

describe('I2 and I8 · Message with its price, and Messages off (INBOX-10)', () => {
  const AVAILABLE = '/api/hub/paid-dm/creators/u2/availability';
  const open = { creatorWawuId: 'u2', paused: false, pausedUntil: null };

  async function bootAsk(withThread = true) {
    const h = { onBack: jest.fn(), onOwn: jest.fn(), onOpenAllWorks: jest.fn(), onOpenWork: jest.fn(), onOpenListing: jest.fn(), onBlocked: jest.fn() };
    const handlers = { onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() };
    const onOpenPaidThread = jest.fn();
    await render(frame(<VisitorProfileScreen wawuId="u2" {...h} pay={handlers} onOpenPaidThread={withThread ? onOpenPaidThread : undefined} />));
    return { onOpenPaidThread };
  }

  it('a user sees "Message · ₦300" beside Follow when the creator takes paid messages, and a tap opens the ask sheet', async () => {
    answers = page({ [`GET ${AVAILABLE}`]: ok(open) });
    await bootAsk();
    const button = await screen.findByTestId('visitor-message');
    expect(screen.getByRole('button', { name: 'Message · ₦300' })).toBeTruthy();
    expect(screen.queryByTestId('visitor-message-off')).toBeNull();
    expect(screen.queryByTestId('visitor-messages-off')).toBeNull();
    await fireEvent.press(button);
    expect(await screen.findByTestId('ask-sheet')).toBeTruthy();
    expect(screen.getByText('Ask Lennox')).toBeTruthy();
  });

  it('a user sees "Messages off" and the note under it when the Hub has paused the creator (I8)', async () => {
    answers = page({ [`GET ${AVAILABLE}`]: ok({ ...open, paused: true, pausedUntil: '2026-10-24T00:00:00.000Z' }) });
    await bootAsk();
    expect(await screen.findByTestId('visitor-message-off')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Messages off' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText("Lennox isn't taking paid messages right now")).toBeTruthy();
    expect(screen.getByText("You can still follow, tip and buy Lennox's work.")).toBeTruthy();
    expect(screen.queryByTestId('visitor-message')).toBeNull();
    expect(screen.getByTestId('visitor-follow')).toBeTruthy();
  });

  it('shows "Messages off" for a creator who switched paid messages off, without asking the Hub about a pause', async () => {
    answers = page({ [`GET ${VISIT}`]: ok(view({}, { dmEnabled: false })) });
    await bootAsk();
    expect(await screen.findByTestId('visitor-message-off')).toBeTruthy();
    expect(screen.getByTestId('visitor-messages-off')).toBeTruthy();
  });

  it('still shows Message when the pause cannot be read: the Hub refuses in its own words if it must', async () => {
    answers = page({ [`GET ${AVAILABLE}`]: refusal(500, 'Something went wrong') });
    await bootAsk();
    expect(await screen.findByTestId('visitor-message')).toBeTruthy();
  });

  it('draws neither Message nor the note when the route cannot open the thread (R-47)', async () => {
    answers = page({ [`GET ${AVAILABLE}`]: ok(open) });
    await bootAsk(false);
    await screen.findByTestId('visitor-follow');
    expect(screen.queryByTestId('visitor-message')).toBeNull();
    expect(screen.queryByTestId('visitor-message-off')).toBeNull();
  });
});
