/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown, pagination?: unknown): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data, ...(pagination ? { pagination } : {}) },
});
const page = (entries: unknown[], nextPage: number | null = null) =>
  ok(entries, { currentPage: 1, nextPage, perPage: 10, total: entries.length });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  sent.push(`${key}${url.search}`);
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ME = '00000000-0000-4000-8000-0000000000aa';
const tick = (verified: boolean) => ({ verified, expiresAt: null });

function item(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    status: 'live',
    createdAt: '2026-10-01T00:00:00Z',
    title: `Title ${id}`,
    creatorWawuId: `creator-${id}`,
    slug: id,
    contentType: 'video',
    description: `Caption ${id}`,
    category: 'Creative',
    specializations: [],
    tags: [],
    accessType: 'free',
    price: 0,
    durationLabel: '1:50',
    pageCount: null,
    previewAssetUrl: `https://cdn.test/${id}.webm`,
    creatorFirstUploadFree: false,
    views: 0,
    ratingPct: null,
    commentCount: 340,
    likes: 12400,
    fullAssetUrl: `https://cdn.test/${id}-full.webm`,
    fullAssetLocked: false,
    likedByMe: false,
    savedByMe: false,
    followsCreator: false,
    shares: 0,
    creator: {
      wawuId: `creator-${id}`,
      displayName: `Person ${id}`,
      handle: id,
      avatarUrl: null,
      verification: { creator: tick(true), professional: tick(false) },
    },
    media: { contentId: id, contentType: 'video', durationLabel: '1:50', pageCount: null, frameCount: 0, frames: [] },
    ...over,
  };
}
const content = (c: unknown) => ({ kind: 'content', content: c });

const FOR_YOU = 'GET /feed/entries?scope=for_you&sort=trending&page=1&perPage=10';
const FOLLOWING = 'GET /feed/entries?scope=following&sort=trending&page=1&perPage=10';

const clients: QueryClient[] = [];

async function boot(props: Record<string, unknown> = {}) {
  const { FeedScreen } = require('../FeedScreen') as typeof import('../FeedScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const screen = await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <FeedScreen {...props} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  await rtl.act(async () => {
    rtl.fireEvent(screen.getByTestId('feed'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 754 } } });
  });
  return screen;
}

/*
 * The first render loads the feed's modules (about 5 s on a quiet machine, far more on a
 * loaded one). Rendering once here pays that under its own budget, so each test's budget
 * measures only the test (the same fix as shell.test.tsx).
 */
beforeAll(async () => {
  answers = { 'GET /users/me': ['hold'], [FOR_YOU]: ['hold'] };
  const screen = await boot();
  await screen.unmount();
}, 120_000);

beforeEach(() => {
  answers = { 'GET /users/me': [ok({ wawuUserId: ME })], 'POST /content/a/view': [ok({ views: 1, counted: true })] };
  sent = [];
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('H2 to H6 · the For you feed', () => {
  it('a user sees a loading view while the first page is on its way, with the Following and For you tabs', async () => {
    answers[FOR_YOU] = ['hold'];
    const screen = await boot();
    expect(screen.getByTestId('feed-loading')).toBeTruthy();
    expect(screen.getByTestId('feed-tab-for_you').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId('feed-tab-following')).toBeTruthy();
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('a user offline sees the feed did not load, and Try again brings the posts', async () => {
    answers[FOR_YOU] = ['offline', page([content(item('a'))])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('feed-error')).toBeTruthy());
    expect(screen.getByText("The feed didn't load")).toBeTruthy();
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByText('Try again'));
    });
    await rtl.waitFor(() => expect(screen.getByTestId('post-a')).toBeTruthy());
  });

  it('a user with nothing in For you sees an empty feed', async () => {
    answers[FOR_YOU] = [page([])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('feed-empty')).toBeTruthy());
    expect(screen.getByText('Nothing to show yet')).toBeTruthy();
  });

  it("a user who follows nobody sees, on Following, that they're not following anyone yet", async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    answers[FOLLOWING] = [page([])];
    answers['GET /feed/following/count'] = [ok({ count: 0 })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('post-a')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('feed-tab-following'));
    });
    await rtl.waitFor(() => expect(screen.getByText("You're not following anyone yet")).toBeTruthy());
    expect(sent).toContain(FOLLOWING);
  });

  it('a user sees the post the Hub serves: name, caption, pill and the rail counts', async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('post-a')).toBeTruthy());
    expect(screen.getByTestId('name-a').props.children).toBe('Person a');
    expect(screen.getByTestId('caption-a').props.children).toBe('Caption a');
    expect(screen.getByText('Video · 1:50')).toBeTruthy();
    expect(screen.getByTestId('likes-a').props.children).toBe('12.4K');
    expect(screen.getByTestId('comments-a').props.children).toBe('340');
    expect(screen.queryByTestId('offer-a')).toBeNull();
    await rtl.waitFor(() => expect(sent).toContain('POST /content/a/view'));
  });

  it('counts a view only for the post that fills the screen, and only once (M7)', async () => {
    answers[FOR_YOU] = [page([content(item('a')), content(item('b'))])];
    answers['POST /content/b/view'] = [ok({ views: 1, counted: true })];
    const views = () => sent.filter((s) => /^POST \/content\/[ab]\/view$/.test(s));
    const scrollTo = async (screen: ReturnType<typeof rtl.render> extends Promise<infer R> ? R : never, y: number) => {
      await rtl.act(async () => {
        rtl.fireEvent.scroll(screen.getByTestId('feed-for_you'), { nativeEvent: { contentOffset: { x: 0, y } } });
      });
    };
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('post-b')).toBeTruthy());
    await rtl.waitFor(() => expect(views()).toEqual(['POST /content/a/view']));
    // B is drawn (the list renders ahead) but is not on screen: no view for it.
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(views()).toEqual(['POST /content/a/view']);

    await scrollTo(screen, 754);
    await rtl.waitFor(() => expect(views()).toEqual(['POST /content/a/view', 'POST /content/b/view']));
    // Back to A, then to B again: neither is counted a second time.
    await scrollTo(screen, 0);
    await scrollTo(screen, 754);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(views()).toEqual(['POST /content/a/view', 'POST /content/b/view']);
  });

  it('a user sees a locked video with its lock and price, and the offer bar starts no payment', async () => {
    answers[FOR_YOU] = [
      page([
        content(
          item('a', {
            accessType: 'paid',
            price: 2500,
            fullAssetLocked: true,
            fullAssetUrl: null,
            durationLabel: '18:00',
            media: { contentId: 'a', contentType: 'video', durationLabel: '18:00', pageCount: null, frameCount: 0, frames: [] },
          }),
        ),
      ]),
    ];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('offer-a')).toBeTruthy());
    expect(screen.getByText('Locked · 18 min')).toBeTruthy();
    expect(screen.getByText('Unlock the full video')).toBeTruthy();
    expect(screen.getByText('18 min · Pay\u00a0from\u00a0wallet')).toBeTruthy();
    expect(screen.getByTestId('offer-a-price').props.accessibilityLabel).toBe('2,500 naira');
    const offer = screen.getByTestId('offer-a');
    expect(offer.props.onPress).toBeUndefined();
    expect(offer.props.accessibilityRole).toBeUndefined();
    rtl.fireEvent.press(offer);
    expect(sent.filter((s) => /unlock|pay|money/.test(s))).toEqual([]);
  });

  it('a user can like a post, and the count is the Hub\'s answer', async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    answers['POST /content/a/like'] = [ok({ likes: 12401, likedByMe: true })];
    answers['DELETE /content/a/like'] = [ok({ likes: 12400, likedByMe: false })];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('like-a')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('like-a'));
    });
    await rtl.waitFor(() => expect(sent).toContain('POST /content/a/like'));
    expect(screen.getByTestId('like-a').props.accessibilityState).toEqual({ selected: true });
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('like-a'));
    });
    await rtl.waitFor(() => expect(sent).toContain('DELETE /content/a/like'));
    expect(screen.getByTestId('like-a').props.accessibilityState).toEqual({ selected: false });
  });

  it('a refused like is put back', async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    answers['POST /content/a/like'] = [{ status: 404, body: { statusCode: 404, message: 'Not found' } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('like-a')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('like-a'));
    });
    await rtl.waitFor(() => expect(screen.getByTestId('likes-a').props.children).toBe('12.4K'));
    expect(screen.getByTestId('like-a').props.accessibilityState).toEqual({ selected: false });
  });

  it('a user can follow a creator from the rail, and is never offered to follow themselves', async () => {
    answers[FOR_YOU] = [page([content(item('a')), content(item('b', { creatorWawuId: ME }))])];
    answers[`POST /creators/creator-a/follow`] = [{ status: 201, body: { statusCode: 201, message: 'OK', data: { following: true } } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('follow-a')).toBeTruthy());
    expect(screen.queryByTestId('follow-b')).toBeNull();
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('follow-a'));
    });
    await rtl.waitFor(() => expect(sent).toContain('POST /creators/creator-a/follow'));
    expect(screen.queryByTestId('follow-a')).toBeNull();
    expect(screen.getAllByText('· Following').length).toBe(1);
  });

  it('a user can save a post', async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    answers['POST /content/a/save'] = [{ status: 201, body: { statusCode: 201, message: 'OK', data: {} } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('save-a')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('save-a'));
    });
    await rtl.waitFor(() => expect(sent).toContain('POST /content/a/save'));
    expect(screen.getByTestId('save-a').props.accessibilityState).toEqual({ selected: true });
  });

  it('a user sees H6: an audio post by someone they follow, tagged Following and with no follow button', async () => {
    answers[FOR_YOU] = [
      page([
        content(
          item('a', {
            contentType: 'audio',
            followsCreator: true,
            durationLabel: '12:00',
            media: { contentId: 'a', contentType: 'audio', durationLabel: '12:00', pageCount: null, frameCount: 0, frames: [] },
          }),
        ),
      ]),
    ];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByText('Audio · 12 min')).toBeTruthy());
    expect(screen.getByText('· Following')).toBeTruthy();
    expect(screen.queryByTestId('follow-a')).toBeNull();
    expect(screen.getByTestId('wave-a')).toBeTruthy();
  });

  it('a user sees H3: a photo set with its counter, and locked frames have no picture', async () => {
    const frames = [
      { position: 1, url: 'https://cdn.test/1.jpg', locked: false },
      { position: 2, url: null, locked: true },
    ];
    answers[FOR_YOU] = [
      page([
        content(
          item('a', {
            contentType: 'image',
            accessType: 'paid',
            price: 2500,
            fullAssetLocked: true,
            media: { contentId: 'a', contentType: 'image', durationLabel: null, pageCount: null, frameCount: 2, frames },
          }),
        ),
      ]),
    ];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('counter-a')).toBeTruthy());
    expect(screen.getByText('Photo set · 2')).toBeTruthy();
    expect(screen.getByLabelText('Photo 2 of 2, locked')).toBeTruthy();
    expect(screen.getByText('2 photos · Pay\u00a0from\u00a0wallet')).toBeTruthy();
  });

  it('a user sees H4: a PDF as its book with the free pages the creator declared', async () => {
    answers[FOR_YOU] = [
      page([
        content(
          item('a', {
            contentType: 'pdf',
            title: 'The Playbook',
            accessType: 'paid',
            price: 3000,
            fullAssetLocked: true,
            pageCount: 84,
            media: { contentId: 'a', contentType: 'pdf', durationLabel: null, pageCount: 84, frameCount: 0, frames: [] },
          }),
        ),
      ]),
    ];
    answers['GET /content/a/detail'] = [
      ok({ contentId: 'a', contentType: 'pdf', updatedAt: '', purchasedAt: null, buyerCount: 0, studentCount: null, freePreview: { pages: 12, seconds: null, lessons: null }, lessons: [], rating: { average: null, count: 0, myRating: null, canRate: false, cannotRateReason: 'not_purchased' } }),
    ];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByText('12 pages free')).toBeTruthy());
    expect(screen.getByText('PDF · 84 pages')).toBeTruthy();
    expect(screen.getByText('The Playbook')).toBeTruthy();
    expect(screen.getByText('84 pages')).toBeTruthy();
    expect(screen.getByLabelText('Read the free pages of The Playbook')).toBeTruthy();
  });

  it('a card with no name is not offered, and the feed reads on until it has a screen', async () => {
    answers[FOR_YOU] = [page([{ kind: 'creator', creator: { wawuId: 'u9', displayName: null } }], 2)];
    answers['GET /feed/entries?scope=for_you&sort=trending&page=2&perPage=10'] = [page([content(item('a'))])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('post-a')).toBeTruthy());
    expect(screen.queryByTestId('creator-card-u9')).toBeNull();
  });
});

const creatorCard = (over: Record<string, unknown> = {}) => ({
  kind: 'creator',
  creator: {
    wawuId: 'u1',
    displayName: 'Zainab Bello',
    handle: 'zainab',
    headline: 'Agribusiness trainer',
    avatarUrl: null,
    coverUrl: null,
    verification: { creator: tick(true), professional: tick(false) },
    badge: null,
    followers: 18200,
    posts: 64,
    rating: 4.9,
    knownFollowers: { count: 13, people: [{ wawuId: 'k1', displayName: 'Amaka Nwosu', avatarUrl: null }, { wawuId: 'k2', displayName: 'Tobi Ade', avatarUrl: null }] },
    works: [
      { id: 'w1', contentType: 'video', accessType: 'free', price: 0, locked: false, title: 'Free clip', thumbnailUrl: null, durationLabel: '4:12', pageCount: null, frameCount: 0, views: 12000 },
      { id: 'w2', contentType: 'course', accessType: 'paid', price: 5000, locked: true, title: 'Soil course', thumbnailUrl: null, durationLabel: null, pageCount: null, frameCount: 0, views: 10 },
    ],
    followsCreator: false,
    ...over,
  },
});

const professionalCard = (over: Record<string, unknown> = {}) => ({
  kind: 'professional',
  professional: {
    id: 'l1',
    wawuId: 'p1',
    displayName: 'Funmi Adeyemi',
    handle: 'funmi',
    headline: 'Chartered accountant',
    avatarUrl: null,
    coverUrl: null,
    verification: { creator: tick(false), professional: tick(true) },
    badge: null,
    category: 'legal_services',
    services: ['Tax filing', 'CAC returns', 'Bookkeeping', 'Pricing your work', 'Audit'],
    ratingAvg: 4.9,
    reviewCount: 212,
    dmPrice: 1500,
    dmResponseHours: 24,
    city: 'Ikeja',
    usualReplyMinutes: 180,
    ...over,
  },
});

describe('H7 to H13 · course, template, creator and professional cards, empty and error', () => {
  it('a user sees H7: a course with its free lesson in the pill, and the course, its lessons and the price in the offer bar', async () => {
    answers[FOR_YOU] = [
      page([content(item('c', { contentType: 'course', title: 'VFX for Beginners', accessType: 'paid', price: 8000, fullAssetLocked: true, fullAssetUrl: null, previewAssetUrl: 'https://cdn.test/c-lesson.mp4', media: { contentId: 'c', contentType: 'course', durationLabel: null, pageCount: null, frameCount: 0, frames: [] } }))]),
    ];
    answers['GET /content/c/detail'] = [
      ok({
        contentId: 'c',
        contentType: 'course',
        updatedAt: '',
        purchasedAt: null,
        buyerCount: 0,
        studentCount: 1280,
        freePreview: { pages: null, seconds: null, lessons: 1 },
        lessons: Array.from({ length: 12 }, (_, i) => ({ id: `l${i}`, title: `Lesson ${i + 1}`, order: i + 1, durationLabel: null, isFree: i === 0 })),
        rating: { average: null, count: 0, myRating: null, canRate: false, cannotRateReason: 'not_purchased' },
      }),
    ];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByText('Course · lesson 1 free')).toBeTruthy());
    expect(screen.getByText('VFX for Beginners')).toBeTruthy();
    expect(screen.getByText('12 lessons · Pay from wallet')).toBeTruthy();
    expect(screen.getByTestId('offer-c-price').props.children).toBeTruthy();
    expect(screen.getByTestId('video-c')).toBeTruthy();
  });

  it('a course the Hub cannot describe still shows its offer without the lesson words', async () => {
    answers[FOR_YOU] = [page([content(item('c', { contentType: 'course', title: 'VFX for Beginners', accessType: 'paid', price: 8000, fullAssetLocked: true, fullAssetUrl: null }))])];
    answers['GET /content/c/detail'] = [{ status: 500, body: { statusCode: 500, message: 'no' } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('offer-c')).toBeTruthy());
    expect(screen.getByText('Course')).toBeTruthy();
    expect(screen.getByText('Pay from wallet')).toBeTruthy();
  });

  it('a user sees H8: a template with its cover, the word Template, and its name and price in the offer bar', async () => {
    answers[FOR_YOU] = [
      page([content(item('t', { contentType: 'template', title: 'Aba Collection · patterns', accessType: 'paid', price: 3500, fullAssetLocked: true, fullAssetUrl: null, previewAssetUrl: 'https://cdn.test/t-cover.jpg' }))]),
    ];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('post-t')).toBeTruthy());
    expect(screen.getByText('Template')).toBeTruthy();
    expect(screen.getByText('Aba Collection · patterns')).toBeTruthy();
    expect(screen.getByText('Template · Pay from wallet')).toBeTruthy();
    expect(screen.getByTestId('cover-t')).toBeTruthy();
  });

  it('a user sees H9: a creator card with the Hub\'s figures, the people they know, and the strip of work, and can Follow and open a piece', async () => {
    answers[FOR_YOU] = [page([creatorCard()])];
    answers['POST /creators/u1/follow'] = [{ status: 201, body: { statusCode: 201, message: 'OK', data: { following: true } } }];
    const opened: string[] = [];
    const screen = await boot({ onOpenPiece: (p: { id: string }) => opened.push(p.id) });
    await rtl.waitFor(() => expect(screen.getByTestId('creator-card-u1')).toBeTruthy());
    expect(screen.getByText('Creator for you')).toBeTruthy();
    expect(screen.getByText('Zainab Bello')).toBeTruthy();
    expect(screen.getByText('Agribusiness trainer')).toBeTruthy();
    expect(screen.getByText('18.2K')).toBeTruthy();
    expect(screen.getByText('64')).toBeTruthy();
    expect(screen.getByText('4.9')).toBeTruthy();
    expect(screen.getByText('and 12 people you know', { exact: false })).toBeTruthy();
    expect(screen.getByLabelText('Soil course, locked, ₦5,000')).toBeTruthy();
    expect(screen.getByLabelText('Free clip, 12K views')).toBeTruthy();
    // Profile is ME-02's: nothing is drawn for it yet.
    expect(screen.queryByText('Profile')).toBeNull();
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('work-w2'));
    });
    expect(opened).toEqual(['w2']);
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('card-follow'));
    });
    await rtl.waitFor(() => expect(sent).toContain('POST /creators/u1/follow'));
    await rtl.waitFor(() => expect(rtl.within(screen.getByTestId('card-follow')).getByText('Following')).toBeTruthy());
  });

  it('a refused follow from a card is put back, with a line that says so', async () => {
    answers[FOR_YOU] = [page([creatorCard({ rating: null, knownFollowers: { count: 0, people: [] }, works: [] })])];
    answers['POST /creators/u1/follow'] = [{ status: 500, body: { statusCode: 500, message: 'no' } }];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('card-follow')).toBeTruthy());
    // A figure the Hub does not have is left out with the element around it.
    expect(screen.queryByTestId('stat-rating')).toBeNull();
    expect(screen.queryByTestId('card-known')).toBeNull();
    expect(screen.queryByTestId('card-works')).toBeNull();
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('card-follow'));
    });
    await rtl.waitFor(() => expect(screen.getByTestId('card-follow-failed')).toBeTruthy());
    expect(screen.getByText("Zainab Bello wasn't followed. Try again.")).toBeTruthy();
    expect(rtl.within(screen.getByTestId('card-follow')).getByText('Follow')).toBeTruthy();
  });

  it('a user sees H10: a professional card with rating, reviews and usual reply, no Trust Score, and Profile opens their page', async () => {
    answers[FOR_YOU] = [page([professionalCard()])];
    const opened: string[] = [];
    const screen = await boot({ onOpenProfessional: (id: string) => opened.push(id) });
    await rtl.waitFor(() => expect(screen.getByTestId('professional-card-l1')).toBeTruthy());
    expect(screen.getByText('Professional')).toBeTruthy();
    expect(screen.getByText('Funmi Adeyemi')).toBeTruthy();
    expect(screen.getByText('Chartered accountant · Ikeja')).toBeTruthy();
    expect(screen.getByText('4.9')).toBeTruthy();
    expect(screen.getByText('212 reviews')).toBeTruthy();
    expect(screen.getByText('~3h')).toBeTruthy();
    expect(screen.getByText('usual reply')).toBeTruthy();
    expect(screen.queryByText(/trust score/i)).toBeNull();
    expect(screen.getByText('Tax filing')).toBeTruthy();
    expect(screen.getByText('Pricing your work')).toBeTruthy();
    expect(screen.queryByText('Audit')).toBeNull();
    expect(screen.getByText('No reply in 24 hours and your ₦1,500 comes back.')).toBeTruthy();
    // Message is INBOX-10's and Online now has no source: neither is drawn.
    expect(screen.queryByText(/Message/)).toBeNull();
    expect(screen.queryByText(/Online now/)).toBeNull();
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('card-profile'));
    });
    expect(opened).toEqual(['l1']);
  });

  it('a professional card without a city, a reply time or reviews leaves those out, and has no Profile without somewhere to open it', async () => {
    answers[FOR_YOU] = [page([professionalCard({ city: null, usualReplyMinutes: null, ratingAvg: null, reviewCount: 0 })])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('professional-card-l1')).toBeTruthy());
    expect(screen.getByText('Chartered accountant')).toBeTruthy();
    expect(screen.queryByTestId('card-stats')).toBeNull();
    expect(screen.queryByTestId('card-profile')).toBeNull();
  });

  it('a user who follows nobody sees H12: the card, Find people to follow, and the creators rail to Follow from', async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    answers[FOLLOWING] = [page([])];
    answers['GET /feed/following/count'] = [ok({ count: 0 })];
    answers['GET /creators?page=1&perPage=12'] = [
      ok([{ wawuId: 'c1', name: 'Adaeze O.', handle: 'adaeze', avatarUrl: null, field: 'Business strategist', pieceCount: 3, verification: { creator: tick(true), professional: tick(false) }, following: false }]),
    ];
    answers['POST /creators/c1/follow'] = [{ status: 201, body: { statusCode: 201, message: 'OK', data: { following: true } } }];
    let found = 0;
    const screen = await boot({ onSeeAllCreators: () => (found += 1) });
    await rtl.waitFor(() => expect(screen.getByTestId('post-a')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('feed-tab-following'));
    });
    await rtl.waitFor(() => expect(screen.getByText("You're not following anyone yet")).toBeTruthy());
    await rtl.waitFor(() => expect(screen.getByText('Who Made This?')).toBeTruthy());
    expect(screen.getByText('Follow creators and professionals and their new posts land here first.')).toBeTruthy();
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('feed-find-people'));
    });
    expect(found).toBe(1);
    await rtl.waitFor(() => expect(screen.getByTestId('today-follow-c1')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('today-follow-c1'));
    });
    await rtl.waitFor(() => expect(sent).toContain('POST /creators/c1/follow'));
  });

  it('an empty Following has no Find people button when All creators is not wired', async () => {
    answers[FOR_YOU] = [page([content(item('a'))])];
    answers[FOLLOWING] = [page([])];
    answers['GET /feed/following/count'] = [ok({ count: 0 })];
    answers['GET /creators?page=1&perPage=12'] = [ok([])];
    const screen = await boot();
    await rtl.waitFor(() => expect(screen.getByTestId('post-a')).toBeTruthy());
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByTestId('feed-tab-following'));
    });
    await rtl.waitFor(() => expect(screen.getByText("You're not following anyone yet")).toBeTruthy());
    expect(screen.queryByTestId('feed-find-people')).toBeNull();
  });
});
