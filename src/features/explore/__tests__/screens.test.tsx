/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { ExploreScreenProps } from '../ExploreScreen';

let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown, status = 200): Answer => ({ status, body: { statusCode: status, message: 'OK', data } });
/** A page as the Hub sends it: the items in `data`, the counts in `pagination` (its response interceptor's shape). */
const page = (items: unknown[], currentPage: number, total: number): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: items, pagination: { currentPage, nextPage: currentPage * 24 < total ? currentPage + 1 : null, perPage: 24, total } },
});
const refused = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, error: 'Bad Request' } });

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

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { ExploreScreen } = require('../ExploreScreen') as typeof import('../ExploreScreen');
const { CategoriesScreen } = require('../CategoriesScreen') as typeof import('../CategoriesScreen');

const categories = [
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

const ticks = (creator: boolean, professional: boolean) => ({
  creator: { verified: creator, expiresAt: null },
  professional: { verified: professional, expiresAt: null },
});

function card(wawuId: string, handle: string, field: string, over: Record<string, unknown> = {}) {
  return { wawuId, name: `${handle} name`, handle, avatarUrl: null, field, pieceCount: 2, verification: ticks(true, false), following: false, ...over };
}

/**
 * Every word X1 draws when the Hub serves nothing but (maybe) the categories, in the order it draws them. A neutral frame
 * carries none of its own, so a name, date or figure on one is a word that is not in this list.
 */
const WORDS_BEFORE_TILES = ['Search Who Made This', 'FEATURED EVENT', 'All'];
const WORDS_AFTER_TILES = [
  'More', 'Featured creators', 'See all', 'Upcoming events', 'See all',
  'Find a professional', 'Accountants, lawyers, designers', 'Find a school', 'Courses from schools and academies',
  'List your services', 'Get paid to answer questions',
];
const WORDS_NOTHING_SERVED = [...WORDS_BEFORE_TILES, ...WORDS_AFTER_TILES];
const WORDS_CATEGORIES_ONLY = [
  ...WORDS_BEFORE_TILES, 'Music & Audio', 'Film & Video', 'Photography', 'Fashion & Beauty', 'Business & Finance', 'Technology', ...WORDS_AFTER_TILES,
];

const ME = 'me-1';
const ALL_PAGE_1 = 'GET /explore/creators?page=1&perPage=24';
const PHOTO_PAGE_1 = 'GET /explore/creators?page=1&perPage=24&category=photography';
const GAMING_PAGE_1 = 'GET /explore/creators?page=1&perPage=24&category=gaming_esports';
const FEATURED_EVENT = 'GET /events?page=1&perPage=1&view=upcoming&sort=starting_soon&featured=true';
const UPCOMING = 'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon';
const COUNTS = 'GET /me/counts';
const noEvents: Answer = {
  status: 200,
  body: { statusCode: 200, message: 'OK', data: [], pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } },
};

/** Every destination Explore can open, each a spy; a test names the ones it taps. */
function entries(over: Partial<ExploreScreenProps> = {}): ExploreScreenProps {
  return { onOpenCategory: jest.fn(), onOpenEvent: jest.fn(), onSeeAllEvents: jest.fn(), onListServices: jest.fn(), ...over };
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/** The screen as a user sees it: every host node's type, test id, label and words, in order (cheap to compare, unlike the whole tree). */
function outline(): string {
  const lines: string[] = [];
  const walk = (node: unknown, depth: number) => {
    if (typeof node === 'string') return void lines.push(`${' '.repeat(depth)}"${node}"`);
    const n = node as { type: string; props: Record<string, unknown>; children: unknown[] | null };
    lines.push(`${' '.repeat(depth)}${n.type} ${String(n.props.testID ?? '')} ${String(n.props.accessibilityLabel ?? '')}`);
    (n.children ?? []).forEach((c) => walk(c, depth + 1));
  };
  const tree = rtl.screen.toJSON();
  [tree].flat().forEach((n) => n && walk(n, 0));
  return lines.join('\n');
}

const settle = () => rtl.act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
});

/** The app's reads wait 1 s and 2 s between tries; a test about what a failure draws makes the first failure final. */
const appDefaults = queryClient.getDefaultOptions();
const failAtOnce = () => queryClient.setDefaultOptions({ ...appDefaults, queries: { ...appDefaults.queries, retry: false } });

/** Every word on the screen, in order: the text of each string child, whatever draws it. */
function words(): string[] {
  const found: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === 'string') return void found.push(node);
    ((node as { children: unknown[] | null }).children ?? []).forEach(walk);
  };
  [rtl.screen.toJSON()].flat().forEach((n) => n && walk(n));
  return found;
}

afterEach(async () => {
  mockFocused = true;
  queryClient.setDefaultOptions(appDefaults);
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  // A finished follow waits five minutes in the mutation cache before it is collected; that timer would keep jest open.
  queryClient.getMutationCache().getAll().forEach((mutation) => mutation.destroy());
  queryClient.clear();
});

beforeEach(() => {
  answers = {
    'GET /explore/categories': [ok({ items: categories })],
    'GET /users/me': [ok({ wawuUserId: ME })],
    [FEATURED_EVENT]: [noEvents],
    [UPCOMING]: [noEvents],
    [COUNTS]: [ok({ purchases: 0, saved: 0, unreadNotifications: 0 })],
  };
  sent = [];
  queryClient.clear();
});

describe('X1 · Explore', () => {
  const featured = 'GET /explore/featured-creators?limit=10';

  it('a user sees the loading view (X14) while Explore loads, and no error or empty words', async () => {
    answers[featured] = ['hold'];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByTestId('explore-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Loading Explore')).toBeTruthy();
    expect(rtl.screen.getByRole('header', { name: 'Explore' })).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  });

  it('a user sees the category tiles in the server’s order and the featured creators, with handle, field and tick', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist'), card('c2', 'funmi', 'Accountant', { verification: ticks(false, true) })] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByText('Featured creators')).toBeTruthy();
    const tiles = rtl.screen.getByTestId('explore-tiles');
    expect(rtl.within(tiles).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'All', 'Music & Audio', 'Film & Video', 'Photography', 'Fashion & Beauty', 'Business & Finance', 'Technology', 'More categories',
    ]);
    expect(rtl.screen.getByText('@adaeze')).toBeTruthy();
    expect(rtl.screen.getByText('Business strategist')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('explore-featured-c1')).getByTestId('tick-creator')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('explore-featured-c2')).getByTestId('tick-pro')).toBeTruthy();
  });

  it('a user sees every entry X1 draws, built or not (R-46): the search pill, the bell, both See alls, the doors and, for a creator, Create', async () => {
    answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByText('Featured creators');
    expect(await rtl.screen.findByTestId('explore-create')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Search Who Made This' })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'See all creators' })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'See all events' })).toBeTruthy();
    for (const words of ['FEATURED EVENT', 'Featured creators', 'Upcoming events', 'Find a professional', 'Find a school', 'List your services']) {
      expect(rtl.screen.getByText(words)).toBeTruthy();
    }
    expect(rtl.screen.getByRole('button', { name: 'Create' })).toBeTruthy();
    // The search pill carries the app's name (R-37), never WAWU.
    expect(rtl.screen.queryByText(/WAWU/)).toBeNull();
  });

  it('a user who taps an entry whose screen is not built opens nothing and changes nothing (R-46, each names its task)', async () => {
    answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[COUNTS] = [ok({ purchases: 0, saved: 0, unreadNotifications: 2 })];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByTestId('explore-create');
    await rtl.screen.findByTestId('explore-bell-dot');
    await settle();
    const before = outline();
    const requests = sent.length;
    const inert = [
      'explore-search', // X5, EXPLORE-02
      'explore-bell', // M31, ME-14
      'explore-featured-see-all', // X4, EXPLORE-02
      'explore-featured-c1', // M5, ME-02
      'explore-door-find-professional', // P1, PROS-01
      'explore-door-find-school', // SC1, SCHOOLS-03
      'explore-create', // M19, ME-04
    ];
    for (const id of inert) {
      await rtl.fireEvent.press(rtl.screen.getByTestId(id));
      await settle();
      expect(outline()).toBe(before);
    }
    expect(sent).toHaveLength(requests);
    for (const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled();
  });

  it('a creator card opens nothing yet, and its Follow still follows', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers['POST /creators/c1/follow'] = [ok({ following: true }, 201)];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('explore-featured-c1'));
    expect(sent).not.toContain('POST /creators/c1/follow');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-c1-follow'));
    expect(await rtl.screen.findByRole('button', { name: 'Following' })).toBeTruthy();
    for (const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled();
  });

  it('the search pill and the bell are drawn as the canvas draws them: the pill takes the room the mark and bell leave, the bell is 44 round', async () => {
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    const flat = (node: { props: Record<string, unknown> }) => Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
    expect(flat(rtl.screen.getByTestId('explore-search'))).toMatchObject({ flex: 1, height: 44, borderRadius: 999 });
    expect(flat(rtl.screen.getByTestId('explore-bell'))).toMatchObject({ width: 44, height: 44 });
    expect(rtl.screen.getByText('Search Who Made This')).toBeTruthy();
  });

  it('the bell shows its dot only when something is unread, and says how many to a screen reader', async () => {
    answers[featured] = [ok({ items: [] })];
    answers[COUNTS] = [ok({ purchases: 0, saved: 0, unreadNotifications: 3 })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByTestId('explore-bell-dot')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeTruthy();
  });

  it('with nothing unread, the bell has no dot', async () => {
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    await settle();
    expect(rtl.screen.queryByTestId('explore-bell-dot')).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  });

  it('with the unread count unreadable, the bell has no dot and Explore still draws, with no error', async () => {
    answers[featured] = [ok({ items: [] })];
    answers[COUNTS] = [refused(500, 'Down')];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    await settle();
    expect(rtl.screen.queryByTestId('explore-bell-dot')).toBeNull();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  });

  it('the Create button is for creator accounts, and sits 18 from the right and 16 above the tab bar as the canvas has it', async () => {
    answers[featured] = [ok({ items: [] })];
    answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    const button = await rtl.screen.findByTestId('explore-create');
    const flat = Object.assign({}, ...[button.props.style].flat(Infinity).filter(Boolean));
    expect(flat).toMatchObject({ position: 'absolute', right: 18, bottom: 106 - 90, width: 58, height: 58, borderRadius: 29 });
  });

  it.each([['a user', 'user'], ['a professional', 'professional'], ['someone who has not chosen a type', null]])(
    'the Create button is not drawn for %s',
    async (_who, accountType) => {
      answers[featured] = [ok({ items: [] })];
      answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType })];
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-tiles');
      await settle();
      expect(rtl.screen.queryByTestId('explore-create')).toBeNull();
    },
  );

  it('with nobody featured, a user sees Featured creators with its See all and three neutral cards, and no invented creator', async () => {
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.screen.getByText('Featured creators')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'See all creators' })).toBeTruthy();
    const empty = rtl.screen.getByTestId('explore-featured-empty');
    expect(empty.props.accessibilityLabel).toBe('Featured creators, none to show');
    expect(rtl.within(empty).queryByText(/@/)).toBeNull();
    expect(rtl.within(empty).queryAllByRole('button')).toHaveLength(0);
    expect(rtl.screen.queryByText('Follow')).toBeNull();
  });

  it('with no featured event and no upcoming events, a user sees both sections: the hero frame, and Upcoming events with a working See all', async () => {
    answers[featured] = [ok({ items: [] })];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.screen.getByTestId('explore-featured-event-empty').props.accessibilityLabel).toBe('Featured event, none to show');
    expect(rtl.screen.getByText('FEATURED EVENT')).toBeTruthy();
    expect(rtl.screen.getByText('Upcoming events')).toBeTruthy();
    expect(rtl.screen.getByTestId('explore-events-empty').props.accessibilityLabel).toBe('Upcoming events, none to show');
    expect(rtl.screen.queryByTestId('explore-featured-event')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-events-see-all'));
    expect(spies.onSeeAllEvents).toHaveBeenCalledTimes(1);
    expect(spies.onOpenEvent).not.toHaveBeenCalled();
  });

  it('with no category served, a user sees All, six neutral frames and More, and All and More still open every category', async () => {
    answers['GET /explore/categories'] = [ok({ items: [] })];
    answers[featured] = [ok({ items: [] })];
    const onOpen = jest.fn();
    await rtl.render(wrap(<ExploreScreen {...entries({ onOpenCategory: onOpen })} />));
    const tiles = await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.within(tiles).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['All', 'More categories']);
    expect(rtl.within(tiles).getAllByTestId('explore-tile-blank')).toHaveLength(6);
    for (const blank of rtl.within(tiles).getAllByTestId('explore-tile-blank')) await rtl.fireEvent.press(blank);
    expect(onOpen).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-all'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-more'));
    expect(onOpen.mock.calls).toEqual([['all'], ['all']]);
  });

  it('draws the hero’s three pager dots as the canvas does, over a featured event and over the empty frame', async () => {
    const flat = (node: { props: Record<string, unknown> }) => Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-featured-event-empty');
    const hidden = { includeHiddenElements: true };
    const dots = [0, 1, 2].map((i) => flat(rtl.screen.getByTestId(`explore-hero-dot-${i}`, hidden)));
    expect(dots.map((d) => d.width)).toEqual([22, 6, 6]);
    expect(dots.map((d) => d.opacity)).toEqual([1, 0.4, 0.4]);
    expect(dots.every((d) => d.height === 6 && d.borderRadius === 3)).toBe(true);
    expect(flat(rtl.screen.getByTestId('explore-hero-dots', hidden))).toMatchObject({ right: 16, bottom: 18, gap: 5 });
  });

  it('a user can tap a category tile to open that category, and All or More to open every category', async () => {
    answers[featured] = [ok({ items: [] })];
    const onOpen = jest.fn();
    await rtl.render(wrap(<ExploreScreen {...entries({ onOpenCategory: onOpen })} />));
    await rtl.screen.findByTestId('explore-tile-photography');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-photography'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-all'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-more'));
    expect(onOpen.mock.calls).toEqual([['photography'], ['all'], ['all']]);
  });

  it('a user can Follow a featured creator, and unfollow with Following', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers['POST /creators/c1/follow'] = [ok({ following: true }, 201)];
    answers['DELETE /creators/c1/follow'] = [ok({ following: false })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    expect(await rtl.screen.findByRole('button', { name: 'Following' })).toBeTruthy();
    expect(sent).toContain('POST /creators/c1/follow');
    await settle();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Following' }));
    expect(await rtl.screen.findByRole('button', { name: 'Follow' })).toBeTruthy();
    expect(sent).toContain('DELETE /creators/c1/follow');
  });

  it('when the Hub refuses a follow, the button goes back to Follow and the app says so in its own words', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers['POST /creators/c1/follow'] = [refused(403, 'You cannot follow this account.')];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    expect(await rtl.screen.findByText('Couldn’t follow @adaeze. Try again later.')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Follow' })).toBeTruthy();
    expect(rtl.screen.queryByText('You cannot follow this account.')).toBeNull();
  });

  it('a Follow still on its way does not stop a user following a second creator', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist'), card('c2', 'funmi', 'Accountant')] })];
    answers['POST /creators/c1/follow'] = ['hold'];
    answers['POST /creators/c2/follow'] = [ok({ following: true }, 201)];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByText('@funmi');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-c1-follow'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-c1-follow'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-c2-follow'));
    await settle();
    expect(sent.filter((r) => r === 'POST /creators/c1/follow')).toHaveLength(1);
    expect(sent).toContain('POST /creators/c2/follow');
    expect(rtl.within(rtl.screen.getByTestId('explore-featured-c2')).getByRole('button', { name: 'Following' })).toBeTruthy();
  });

  it('draws Following as the canvas does: white at 20%, no outline', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist', { following: true })] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    const button = await rtl.screen.findByRole('button', { name: 'Following' });
    const flat = (node: { props: Record<string, unknown> }) => Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
    expect(flat(button)).toMatchObject({ backgroundColor: 'transparent', borderWidth: 0 });
    // MediaCard's action draws the white as its own layer at 20% (SHARED-03 item 6).
    expect(flat(rtl.screen.getByTestId('explore-featured-c1-follow-veil'))).toMatchObject({ backgroundColor: '#FFFFFF', opacity: 0.2 });
  });

  it('the refusal line stays up for 4 seconds, then goes by itself', async () => {
    const { FOLLOW_NOTICE_MS } = require('../follow') as typeof import('../follow');
    expect(FOLLOW_NOTICE_MS).toBe(4000);
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers['POST /creators/c1/follow'] = [refused(403, 'You cannot follow this account.')];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    const follow = await rtl.screen.findByRole('button', { name: 'Follow' });
    // The clock is faked from the press on, so the notice's own timer is one the test drives.
    jest.useFakeTimers();
    try {
      await rtl.fireEvent.press(follow);
      for (let i = 0; i < 40 && !rtl.screen.queryByTestId('follow-notice'); i += 1) {
        await rtl.act(async () => {
          await Promise.resolve();
          jest.advanceTimersByTime(1);
        });
      }
      expect(rtl.screen.getByTestId('follow-notice')).toBeTruthy();
      await rtl.act(async () => {
        jest.advanceTimersByTime(3900);
      });
      expect(rtl.screen.getByTestId('follow-notice')).toBeTruthy();
      await rtl.act(async () => {
        jest.advanceTimersByTime(200);
      });
      expect(rtl.screen.queryByTestId('follow-notice')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('drops a category the Hub sends with a blank id or label', async () => {
    answers['GET /explore/categories'] = [ok({ items: [{ id: '', label: 'No id' }, { id: 'nolabel', label: '' }, { id: 'music_audio', label: 'Music & Audio' }] })];
    answers[featured] = [ok({ items: [] })];
    const { fetchCategories } = require('../api') as typeof import('../api');
    expect(await fetchCategories()).toEqual([{ id: 'music_audio', label: 'Music & Audio' }]);
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    const tiles = await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.within(tiles).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['All', 'Music & Audio', 'More categories']);
  });

  it('the viewer’s own card has no Follow (nobody follows themselves)', async () => {
    answers[featured] = [ok({ items: [card(ME, 'me', 'Me'), card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByText('@me');
    await settle();
    expect(rtl.within(rtl.screen.getByTestId(`explore-featured-${ME}`)).queryAllByRole('button')).toHaveLength(0);
    expect(rtl.screen.getAllByRole('button', { name: 'Follow' })).toHaveLength(1);
  });

  it('when Explore cannot load, a user sees why and can try again, and the screen keeps every section while it waits', async () => {
    answers[featured] = [refused(500, 'Something went wrong on our side'), refused(500, 'Something went wrong on our side'), refused(500, 'Something went wrong on our side'), ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByTestId('explore-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load Explore')).toBeTruthy();
    expect(rtl.screen.getByText('Something went wrong on our side')).toBeTruthy();
    expect(rtl.screen.getByTestId('explore-doors')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('@adaeze')).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  }, 15000);

  it('with nobody featured, a user still sees the doors: Find a professional, Find a school and List your services', async () => {
    answers[featured] = [ok({ items: [] })];
    const spies = entries();
    await rtl.render(wrap(<ExploreScreen {...spies} />));
    await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.screen.getByTestId('explore-featured-empty')).toBeTruthy();
    const doors = rtl.screen.getByTestId('explore-doors');
    expect(rtl.within(doors).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Find a professional, Accountants, lawyers, designers',
      'Find a school, Courses from schools and academies',
      'List your services, Get paid to answer questions',
    ]);
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-door-list-services'));
    expect(spies.onListServices).toHaveBeenCalledTimes(1);
  });

  it('with nothing served, the words on screen are the headings, the kicker, the tiles All and More, the doors and the bar, and no name, date or figure', async () => {
    answers['GET /explore/categories'] = [ok({ items: [] })];
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    await settle();
    expect(words()).toEqual(WORDS_NOTHING_SERVED);
  });

  it('with only the categories served, the words on screen add the six category names and nothing else', async () => {
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    await settle();
    expect(words()).toEqual(WORDS_CATEGORIES_ONLY);
  });

  it.each([
    ['held', 'hold' as const],
    ['unreadable', refused(500, 'Down')],
  ])('the Create button is not drawn while the account type is %s', async (_state, answer) => {
    answers[featured] = [ok({ items: [] })];
    answers['GET /users/me'] = [answer];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByTestId('explore-tiles');
    await settle();
    expect(sent.filter((r) => r === 'GET /users/me').length).toBeGreaterThan(0);
    expect(rtl.screen.queryByTestId('explore-create')).toBeNull();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  });

  it('the bar and the Create button of a creator are drawn while Explore loads (X14)', async () => {
    answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
    answers[featured] = ['hold'];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByTestId('explore-loading')).toBeTruthy();
    expect(await rtl.screen.findByTestId('explore-create')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Search Who Made This' })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  });

  describe('the scroll ends above the Create button', () => {
    const bottomOf = () => {
      const flat = Object.assign({}, ...[rtl.screen.getByTestId('explore-scroll').props.contentContainerStyle].flat(Infinity).filter(Boolean));
      return flat.paddingBottom as number;
    };

    it('a creator has 90 below the last row: the button’s 16 offset, its 58 and 16 more, so the last row’s chevron is clear', async () => {
      const { createButtonMetrics } = require('../CreateButton') as typeof import('../CreateButton');
      answers[featured] = [ok({ items: [] })];
      answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-create');
      expect(bottomOf()).toBe(16 + 58 + 16);
      // The button covers the bottom 74 of the scroll's view, so the last row ends above it.
      expect(bottomOf()).toBeGreaterThan(createButtonMetrics.bottom + createButtonMetrics.size);
    });

    it('anyone else keeps the canvas’s 30 below the last row', async () => {
      answers[featured] = [ok({ items: [] })];
      answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'user' })];
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-tiles');
      await settle();
      expect(rtl.screen.queryByTestId('explore-create')).toBeNull();
      expect(bottomOf()).toBe(120 - 90);
    });
  });

  describe('a read that fails keeps every section drawn (R-46), under one banner with Try again', () => {
    beforeEach(() => {
      failAtOnce();
      answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
    });

    it.each([
      ['the categories', 'GET /explore/categories'],
      ['the featured creators', featured],
    ])('when %s cannot be read, a user still sees the bar, the hero, the tiles, both rails, the doors and Create, and the one banner', async (_what, failing) => {
      answers['GET /explore/categories'] = [ok({ items: categories })];
      answers[featured] = [ok({ items: [] })];
      answers[failing] = [refused(500, 'Something went wrong on our side')];
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      expect(await rtl.screen.findByTestId('explore-error')).toBeTruthy();
      await settle();
      expect(rtl.screen.getAllByTestId('explore-error')).toHaveLength(1);
      expect(rtl.screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(1);
      expect(rtl.screen.getByText('Couldn’t load Explore')).toBeTruthy();
      expect(rtl.screen.getByText('Something went wrong on our side')).toBeTruthy();
      expect(rtl.screen.queryByTestId('explore-loading')).toBeNull();
      // The bar.
      expect(rtl.screen.getByRole('header', { name: 'Explore' })).toBeTruthy();
      expect(rtl.screen.getByRole('button', { name: 'Search Who Made This' })).toBeTruthy();
      expect(rtl.screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
      // The sections, as when nothing is served.
      expect(rtl.screen.getByTestId('explore-featured-event-empty')).toBeTruthy();
      expect(rtl.within(rtl.screen.getByTestId('explore-tiles')).getAllByRole('button').length).toBeGreaterThanOrEqual(2);
      expect(rtl.screen.getByText('Featured creators')).toBeTruthy();
      expect(rtl.screen.getByRole('button', { name: 'See all creators' })).toBeTruthy();
      expect(rtl.screen.getByTestId('explore-featured-empty')).toBeTruthy();
      expect(rtl.screen.getByText('Upcoming events')).toBeTruthy();
      expect(rtl.screen.getByRole('button', { name: 'See all events' })).toBeTruthy();
      for (const door of ['find-professional', 'find-school', 'list-services']) expect(rtl.screen.getByTestId(`explore-door-${door}`)).toBeTruthy();
      expect(await rtl.screen.findByTestId('explore-create')).toBeTruthy();
    });

    it('the banner sits above the hero, and the doors still open List your services', async () => {
      answers['GET /explore/categories'] = [refused(500, 'Down')];
      answers[featured] = [ok({ items: [] })];
      const spies = entries();
      await rtl.render(wrap(<ExploreScreen {...spies} />));
      await rtl.screen.findByTestId('explore-error');
      const order = outline().split('\n').map((l) => l.trim().split(' ')[1]).filter((id) => ['explore-error', 'explore-featured-event-empty', 'explore-tiles', 'explore-doors'].includes(id ?? ''));
      expect(order).toEqual(['explore-error', 'explore-featured-event-empty', 'explore-tiles', 'explore-doors']);
      await rtl.fireEvent.press(rtl.screen.getByTestId('explore-door-list-services'));
      expect(spies.onListServices).toHaveBeenCalledTimes(1);
    });

    it('Try again reads the categories, the featured creators, the unread count and the account type again, and the screen fills in', async () => {
      answers['GET /users/me'] = [refused(403, 'No'), refused(403, 'No'), ok({ wawuUserId: ME, accountType: 'creator' })];
      answers['GET /explore/categories'] = [refused(500, 'Down'), ok({ items: categories })];
      answers[featured] = [refused(500, 'Down'), ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
      answers[COUNTS] = [ok({ purchases: 0, saved: 0, unreadNotifications: 0 }), ok({ purchases: 0, saved: 0, unreadNotifications: 2 })];
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-error');
      await settle();
      expect(rtl.screen.queryByTestId('explore-bell-dot')).toBeNull();
      expect(rtl.screen.queryByTestId('explore-create')).toBeNull();
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
      expect(await rtl.screen.findByText('@adaeze')).toBeTruthy();
      expect(await rtl.screen.findByTestId('explore-bell-dot')).toBeTruthy();
      expect(await rtl.screen.findByTestId('explore-create')).toBeTruthy();
      expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
      expect(rtl.screen.getByRole('button', { name: 'Photography' })).toBeTruthy();
      expect(sent.filter((r) => r === COUNTS)).toHaveLength(2);
      expect(sent.filter((r) => r === 'GET /explore/categories')).toHaveLength(2);
      expect(sent.filter((r) => r === 'GET /explore/featured-creators?limit=10')).toHaveLength(2);
    });

    it('when only the featured creators fail, Try again reads them again and the categories already shown stay', async () => {
      answers[featured] = [refused(500, 'Down'), ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-error');
      expect(rtl.screen.getByRole('button', { name: 'Photography' })).toBeTruthy();
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
      expect(await rtl.screen.findByText('@adaeze')).toBeTruthy();
      expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
    });
  });

  describe('the bell’s dot and Create are read again, as the other reads are', () => {
    const unreadTwice = [ok({ purchases: 0, saved: 0, unreadNotifications: 0 }), ok({ purchases: 0, saved: 0, unreadNotifications: 2 })];
    const mineFailsOnce = () => [refused(403, 'No'), refused(403, 'No'), ok({ wawuUserId: ME, accountType: 'creator' })];

    it('a pull to refresh reads the unread count and the account type again, so the dot and Create come back', async () => {
      answers[featured] = [ok({ items: [] })];
      answers[COUNTS] = unreadTwice;
      answers['GET /users/me'] = mineFailsOnce();
      await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-tiles');
      await settle();
      expect(rtl.screen.queryByTestId('explore-bell-dot')).toBeNull();
      expect(rtl.screen.queryByTestId('explore-create')).toBeNull();
      const pull = rtl.screen.getByTestId('explore-scroll').props.refreshControl.props.onRefresh as () => void;
      await rtl.act(async () => {
        pull();
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(await rtl.screen.findByTestId('explore-bell-dot')).toBeTruthy();
      expect(await rtl.screen.findByTestId('explore-create')).toBeTruthy();
    });

    it('coming back to the tab reads the account type again when the first read failed, so Create comes back', async () => {
      answers[featured] = [ok({ items: [] })];
      answers['GET /users/me'] = mineFailsOnce();
      const view = await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-tiles');
      await settle();
      expect(rtl.screen.queryByTestId('explore-create')).toBeNull();
      mockFocused = false;
      await view.rerender(wrap(<ExploreScreen {...entries()} />));
      await settle();
      mockFocused = true;
      await view.rerender(wrap(<ExploreScreen {...entries()} />));
      expect(await rtl.screen.findByTestId('explore-create')).toBeTruthy();
    });

    it('coming back to the tab with everything read and fresh asks for nothing again', async () => {
      answers[featured] = [ok({ items: [] })];
      answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
      const view = await rtl.render(wrap(<ExploreScreen {...entries()} />));
      await rtl.screen.findByTestId('explore-create');
      await settle();
      const before = sent.length;
      mockFocused = false;
      await view.rerender(wrap(<ExploreScreen {...entries()} />));
      await settle();
      mockFocused = true;
      await view.rerender(wrap(<ExploreScreen {...entries()} />));
      await settle();
      expect(sent).toHaveLength(before);
    });
  });
});

describe('X2, X3, X13 · Categories', () => {
  it('a user who opens Categories from All sees every category as a chip, All on, and every creator (X2)', async () => {
    answers[ALL_PAGE_1] = [page([card('c1', 'adaeze', 'Business strategist'), card('c2', 'funmi', 'Accountant', { following: true })], 1, 2)];
    await rtl.render(wrap(<CategoriesScreen onBack={jest.fn()} />));
    expect(await rtl.screen.findByText('@adaeze')).toBeTruthy();
    expect(rtl.screen.getByRole('header', { name: 'Categories' })).toBeTruthy();
    const chips = rtl.screen.getAllByRole('radio');
    expect(chips).toHaveLength(13);
    expect(chips[0]?.props.accessibilityLabel).toBe('All');
    expect(chips[0]?.props.accessibilityState.checked).toBe(true);
    expect(rtl.within(rtl.screen.getByTestId('categories-creator-c2')).getByRole('button', { name: 'Following' })).toBeTruthy();
  });

  it('a user who taps Photography on Explore sees only Photography creators, with that chip on (X3)', async () => {
    answers[PHOTO_PAGE_1] = [page([card('p1', 'amaka', 'Photographer')], 1, 1)];
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    expect(await rtl.screen.findByText('@amaka')).toBeTruthy();
    expect(rtl.screen.getByRole('radio', { name: 'Photography' }).props.accessibilityState.checked).toBe(true);
    expect(sent).toContain(PHOTO_PAGE_1);
    expect(sent).not.toContain(ALL_PAGE_1);
  });

  it('a user who taps a creator card in a category opens nothing yet (M5 is ME-02), and its Follow still follows', async () => {
    answers[PHOTO_PAGE_1] = [page([card('p1', 'amaka', 'Photographer')], 1, 1)];
    answers['POST /creators/p1/follow'] = [ok({ following: true }, 201)];
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    const creatorCard = await rtl.screen.findByTestId('categories-creator-p1');
    const before = outline();
    await rtl.fireEvent.press(creatorCard);
    await settle();
    expect(outline()).toBe(before);
    expect(sent).not.toContain('POST /creators/p1/follow');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Follow' }));
    expect(await rtl.screen.findByRole('button', { name: 'Following' })).toBeTruthy();
  });

  it('a user can switch chip in one tap and see that category’s creators', async () => {
    answers[ALL_PAGE_1] = [page([card('c1', 'adaeze', 'Business strategist')], 1, 1)];
    answers[PHOTO_PAGE_1] = [page([card('p1', 'amaka', 'Photographer')], 1, 1)];
    const onChange = jest.fn();
    await rtl.render(wrap(<CategoriesScreen onBack={jest.fn()} onChange={onChange} />));
    await rtl.screen.findByText('@adaeze');
    await rtl.fireEvent.press(rtl.screen.getByRole('radio', { name: 'Photography' }));
    expect(await rtl.screen.findByText('@amaka')).toBeTruthy();
    expect(rtl.screen.queryByText('@adaeze')).toBeNull();
    expect(onChange).toHaveBeenCalledWith('photography');
  });

  it('a user sees X13 when nobody publishes in the category', async () => {
    answers[GAMING_PAGE_1] = [page([], 1, 0)];
    await rtl.render(wrap(<CategoriesScreen initial="gaming_esports" onBack={jest.fn()} />));
    expect(await rtl.screen.findByText('Nobody is publishing in Gaming & Esports yet')).toBeTruthy();
    expect(rtl.screen.getByText('Try another category, or come back once more people have published.')).toBeTruthy();
  });

  it('opens with the chosen chip scrolled into view when it starts out of view (Categories passes revealSelected)', async () => {
    const { ScrollView } = require('react-native') as typeof import('react-native');
    const { layout } = require('@/theme') as typeof import('@/theme');
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo');
    scrollTo.mockClear();
    try {
      answers[GAMING_PAGE_1] = [page([], 1, 0)];
      await rtl.render(wrap(<CategoriesScreen initial="gaming_esports" onBack={jest.fn()} />));
      const chip = await rtl.screen.findByTestId('categories-chips-gaming_esports');
      const at = (x: number, width: number) => ({ nativeEvent: { layout: { x, y: 0, width, height: 36 } } });
      await rtl.fireEvent(rtl.screen.getByTestId('categories-chips'), 'layout', at(0, 390));
      await rtl.fireEvent(chip, 'layout', at(1500, 160));
      expect(scrollTo).toHaveBeenCalledWith({ x: 1500 - layout.gutter, animated: false });
    } finally {
      scrollTo.mockRestore();
    }
  });

  it('a refused Follow in a category says so above the safe area, as on Explore', async () => {
    answers[PHOTO_PAGE_1] = [page([card('p1', 'amaka', 'Photographer')], 1, 1)];
    answers['POST /creators/p1/follow'] = [refused(403, 'You cannot follow this account.')];
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    const notice = await rtl.screen.findByTestId('follow-notice');
    expect(rtl.within(notice).getByText('Couldn’t follow @amaka. Try again later.')).toBeTruthy();
    // 34 of safe area (the test's insets) and the toast's own 24.
    expect(Object.assign({}, ...[notice.props.style].flat(Infinity).filter(Boolean)).bottom).toBe(34 + 24);
  });

  it('a user sees a loading grid while a category loads', async () => {
    answers[PHOTO_PAGE_1] = ['hold'];
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    expect(await rtl.screen.findByTestId('categories-loading')).toBeTruthy();
  });

  it('when creators cannot load, a user sees why and can try again', async () => {
    answers[PHOTO_PAGE_1] = ['offline', 'offline', 'offline', page([card('p1', 'amaka', 'Photographer')], 1, 1)];
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    expect(await rtl.screen.findByTestId('categories-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load creators')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('@amaka')).toBeTruthy();
  }, 15000);

  it('a user can Follow in a category, and the same creator reads Following on Explore', async () => {
    answers[PHOTO_PAGE_1] = [page([card('p1', 'amaka', 'Photographer')], 1, 1)];
    answers['GET /explore/featured-creators?limit=10'] = [ok({ items: [card('p1', 'amaka', 'Photographer')] })];
    answers['POST /creators/p1/follow'] = [ok({ following: true }, 201)];
    const explore = await rtl.render(wrap(<ExploreScreen {...entries()} />));
    await rtl.screen.findByText('@amaka');
    await explore.unmount();
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    expect(await rtl.screen.findByRole('button', { name: 'Following' })).toBeTruthy();
    await settle();
    const featured = queryClient.getQueryData<{ wawuId: string; following: boolean }[]>(['explore', 'featured']);
    expect(featured?.[0]?.following).toBe(true);
  });

  it('reads a page in the shape the contract describes too (G-300), so a corrected contract keeps working', async () => {
    answers[PHOTO_PAGE_1] = [ok({ items: [card('p1', 'amaka', 'Photographer')], currentPage: 1, perPage: 24, total: 1 })];
    await rtl.render(wrap(<CategoriesScreen initial="photography" onBack={jest.fn()} />));
    expect(await rtl.screen.findByText('@amaka')).toBeTruthy();
  });

  it('a user reads the next page as they scroll to the end', async () => {
    answers[ALL_PAGE_1] = [page([card('c1', 'adaeze', 'Business strategist')], 1, 25)];
    answers['GET /explore/creators?page=2&perPage=24'] = [page([card('c25', 'tunde', 'Drone')], 2, 25)];
    await rtl.render(wrap(<CategoriesScreen onBack={jest.fn()} />));
    await rtl.screen.findByText('@adaeze');
    await rtl.fireEvent(rtl.screen.getByTestId('categories-list'), 'endReached');
    expect(await rtl.screen.findByText('@tunde')).toBeTruthy();
  });
});

describe('X1, X15 and X14 · the event entries (EVENTS-01, R-41)', () => {
  const featured = 'GET /explore/featured-creators?limit=10';
  const featuredEvent = 'GET /events?page=1&perPage=1&view=upcoming&sort=starting_soon&featured=true';
  const upcoming = 'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon';
  const ev = (id: string, name: string, over: Record<string, unknown> = {}) => ({
    id, hostWawuId: 'h', hostVerification: ticks(false, false), name, description: '', hostOrg: 'Hosts', hostOrgBio: null,
    format: 'in_person', type: 'summit', startsAt: '2026-11-02T09:00:00.000Z', endsAt: null, timeLabel: null, timezone: null,
    location: 'Lagos', address: null, venueName: 'Eko Convention Centre', externalUrl: null, bannerUrl: null, category: 'conference',
    contactEmail: null, contactPhone: null, cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null, recapText: null,
    featured: false, status: 'published', goingCount: 0, userGoing: false, userSaved: false, ticketed: false, priceFromNaira: null,
    speakers: [], createdAt: '2026-10-01T00:00:00.000Z', lastDecisionReason: null, ...over,
  });
  const pageOf = (items: unknown[]): Answer => ({
    status: 200,
    body: { statusCode: 200, message: 'OK', data: items, pagination: { currentPage: 1, nextPage: null, perPage: 20, total: items.length } },
  });
  // 14 Oct 23:00 UTC is still 14 Oct in New York (15 Oct in Lagos).
  const summit = ev('ev-1', 'Creators Summit', { featured: true });
  const nyc = ev('ev-2', 'New York Night', { timezone: 'America/New_York', startsAt: '2026-10-14T23:00:00.000Z', venueName: null, location: 'New York' });

  it('a user sees the featured event and Upcoming events, and opens E2 from either and E1 from See all', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = [pageOf([summit])];
    answers[upcoming] = [pageOf([summit, nyc])];
    const onOpenEvent = jest.fn();
    const onSeeAllEvents = jest.fn();
    await rtl.render(wrap(<ExploreScreen {...entries({ onOpenEvent, onSeeAllEvents })} />));
    expect(await rtl.screen.findByText('FEATURED EVENT')).toBeTruthy();
    expect(rtl.screen.getByText('2 Nov · Eko Convention Centre')).toBeTruthy();
    expect(await rtl.screen.findByText('Upcoming events')).toBeTruthy();
    // The card's badge is read in the event's own zone, the day in two digits.
    expect(rtl.screen.getByLabelText('OCT 14')).toBeTruthy();
    expect(rtl.screen.getByLabelText('NOV 02')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-event'));
    expect(onOpenEvent).toHaveBeenLastCalledWith('ev-1');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-event-ev-2'));
    expect(onOpenEvent).toHaveBeenLastCalledWith('ev-2');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-events-see-all'));
    expect(onSeeAllEvents).toHaveBeenCalledTimes(1);
  });

  it('a user sees the pager dots over a featured event and no empty frame beside it, and a tap on the hero still opens the event', async () => {
    answers[featured] = [ok({ items: [] })];
    answers[featuredEvent] = [pageOf([summit])];
    answers[upcoming] = [pageOf([summit, nyc])];
    const onOpenEvent = jest.fn();
    await rtl.render(wrap(<ExploreScreen {...entries({ onOpenEvent })} />));
    await rtl.screen.findByText('FEATURED EVENT');
    const hero = rtl.screen.getByTestId('explore-hero');
    expect(rtl.within(hero).getByTestId('explore-hero-dots', { includeHiddenElements: true })).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-featured-event-empty')).toBeNull();
    expect(rtl.screen.queryByTestId('explore-events-empty')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-event'));
    expect(onOpenEvent).toHaveBeenCalledWith('ev-1');
  });

  it('a user still sees the tiles and creators when the events cannot be read, and the event sections as neutral frames', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = [refused(500, 'Down')];
    answers[upcoming] = [refused(500, 'Down')];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    expect(await rtl.screen.findByText('Featured creators')).toBeTruthy();
    await settle();
    expect(rtl.screen.getByTestId('explore-featured-event-empty')).toBeTruthy();
    expect(rtl.screen.getByTestId('explore-events-empty')).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-featured-event')).toBeNull();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  });

  it('a user sees the featured event block while Explore loads (X14)', async () => {
    answers[featured] = ['hold'];
    await rtl.render(wrap(<ExploreScreen {...entries()} />));
    const loading = await rtl.screen.findByTestId('explore-loading');
    expect(JSON.stringify(loading)).toMatch(/"height":196/);
  });
});

describe('X1 and X14 · the event entries settle before Explore draws (EVENTS-01 round 7, D12, D13, D14, T4)', () => {
  const featured = 'GET /explore/featured-creators?limit=10';
  const featuredEvent = 'GET /events?page=1&perPage=1&view=upcoming&sort=starting_soon&featured=true';
  const upcoming = 'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon';
  const ev = (id: string, name: string, over: Record<string, unknown> = {}) => ({
    id, hostWawuId: 'h', hostVerification: ticks(false, false), name, description: '', hostOrg: 'Hosts', hostOrgBio: null,
    format: 'in_person', type: 'summit', startsAt: '2026-11-02T09:00:00.000Z', endsAt: null, timeLabel: null, timezone: null,
    location: 'Lagos', address: null, venueName: 'Eko Convention Centre', externalUrl: null, bannerUrl: null, category: 'conference',
    contactEmail: null, contactPhone: null, cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null, recapText: null,
    featured: false, status: 'published', goingCount: 0, userGoing: false, userSaved: false, ticketed: false, priceFromNaira: null,
    speakers: [], createdAt: '2026-10-01T00:00:00.000Z', lastDecisionReason: null, ...over,
  });
  const pageOf = (items: unknown[]): Answer => ({
    status: 200,
    body: { statusCode: 200, message: 'OK', data: items, pagination: { currentPage: 1, nextPage: null, perPage: 20, total: items.length } },
  });
  const screen = () => <ExploreScreen {...entries()} />;

  it('keeps X14, hero block included, while the events read is held, then draws the tiles once', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = ['hold'];
    answers[upcoming] = ['hold'];
    await rtl.render(wrap(screen()));
    await settle();
    expect(rtl.screen.getByTestId('explore-loading')).toBeTruthy();
    expect(JSON.stringify(rtl.screen.getByTestId('explore-loading'))).toMatch(/"height":196/);
    expect(rtl.screen.queryByTestId('explore-tiles')).toBeNull();
    // The reads answer: the tiles appear once, with the hero above them already in place.
    await rtl.act(async () => {
      queryClient.setQueryData(['events', 'featured', { view: 'upcoming', kind: null, category: null }], ev('ev-1', 'Creators Summit'));
      queryClient.setQueryData(['events', 'explore-rail'], { events: [ev('ev-1', 'Creators Summit')], nextPage: null, total: 1 });
    });
    expect(await rtl.screen.findByTestId('explore-tiles')).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-loading')).toBeNull();
    expect(rtl.screen.getByText('FEATURED EVENT')).toBeTruthy();
  });

  it('draws Explore with the event sections as neutral frames once a failed events read has settled, asking each only once', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = [refused(500, 'Down')];
    answers[upcoming] = [refused(500, 'Down')];
    await rtl.render(wrap(screen()));
    expect(await rtl.screen.findByText('Featured creators')).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
    expect(rtl.screen.getByTestId('explore-featured-event-empty')).toBeTruthy();
    expect(sent.filter((s) => s.startsWith('GET /events?'))).toHaveLength(2);
  });

  it('reads the hero’s day in the event’s own zone, and the featured event need not be the first on the rail', async () => {
    const summit = ev('ev-1', 'Creators Summit');
    const nyc = ev('ev-2', 'New York Night', { featured: true, timezone: 'America/New_York', startsAt: '2026-10-14T23:00:00.000Z', venueName: null, location: 'New York' });
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = [pageOf([nyc])];
    answers[upcoming] = [pageOf([summit, nyc])];
    const onOpenEvent = jest.fn();
    await rtl.render(wrap(<ExploreScreen {...entries({ onOpenEvent })} />));
    expect(await rtl.screen.findByText('14 Oct · New York')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-featured-event'));
    expect(onOpenEvent).toHaveBeenLastCalledWith('ev-2');
  });

  it('shows the year on the hero line and the card’s spoken label for an event not in the current year (D14)', async () => {
    const far = ev('ev-3', 'Far Fair', { featured: true, startsAt: '2031-03-16T09:00:00.000Z' });
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = [pageOf([far])];
    answers[upcoming] = [pageOf([far])];
    await rtl.render(wrap(screen()));
    expect(await rtl.screen.findByText('16 Mar 2031 · Eko Convention Centre')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Far Fair, 16 Mar 2031, Eko Convention Centre')).toBeTruthy();
  });
});

describe('X1 · the "List your services" door (PROS-03, R-41, D3)', () => {
  const featured = 'GET /explore/featured-creators?limit=10';
  const app = { id: 'a1', status: 'approved', listed: false, category: 'finance', headline: 'Chartered accountant', submittedAt: '2026-10-01T00:00:00.000Z' };
  const open = async (opened: jest.Mock) => {
    const { listServicesTarget } = require('@/features/pro-listing/door') as typeof import('@/features/pro-listing/door');
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen {...entries({ onListServices: () => void listServicesTarget(queryClient).then(opened) })} />));
    await rtl.screen.findByText('Featured creators');
  };

  it('the card has the canvas’s three doors in its order, with its words', async () => {
    await open(jest.fn());
    const doors = rtl.screen.getByTestId('explore-doors');
    expect(rtl.within(doors).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Find a professional, Accountants, lawyers, designers',
      'Find a school, Courses from schools and academies',
      'List your services, Get paid to answer questions',
    ]);
  });

  it('a creator with no application lands on P5, one with any (here a hidden one) on P8, a user on P5', async () => {
    const opened = jest.fn();
    answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'creator' })];
    answers['GET /professionals/applications/mine'] = [ok([])];
    await open(opened);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('explore-door-list-services')));
    await rtl.waitFor(() => expect(opened).toHaveBeenLastCalledWith('/professional-apply'));
    answers['GET /professionals/applications/mine'] = [ok([app])];
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('explore-door-list-services')));
    await rtl.waitFor(() => expect(opened).toHaveBeenLastCalledWith('/professional-listings'));
    queryClient.removeQueries({ queryKey: ['pro-listing'] });
    answers['GET /users/me'] = [ok({ wawuUserId: ME, accountType: 'user' })];
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('explore-door-list-services')));
    await rtl.waitFor(() => expect(opened).toHaveBeenLastCalledWith('/professional-apply'));
  });

  it('with the event entries in, the card waits with them under X14, then follows Upcoming events (merge with EVENTS-01, D12)', async () => {
    const featuredEvent = 'GET /events?page=1&perPage=1&view=upcoming&sort=starting_soon&featured=true';
    const upcoming = 'GET /events?page=1&perPage=20&view=upcoming&sort=starting_soon';
    const event = { ...{ id: 'ev-1', hostWawuId: 'h', hostVerification: ticks(false, false), name: 'Creators Summit', description: '', hostOrg: 'Hosts' },
      hostOrgBio: null, format: 'in_person', type: 'summit', startsAt: '2026-11-02T09:00:00.000Z', endsAt: null, timeLabel: null, timezone: null,
      location: 'Lagos', address: null, venueName: 'Eko Convention Centre', externalUrl: null, bannerUrl: null, category: 'conference',
      contactEmail: null, contactPhone: null, cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null, recapText: null,
      featured: false, status: 'published', goingCount: 0, userGoing: false, userSaved: false, ticketed: false, priceFromNaira: null,
      speakers: [], createdAt: '2026-10-01T00:00:00.000Z', lastDecisionReason: null };
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers[featuredEvent] = ['hold'];
    answers[upcoming] = ['hold'];
    await rtl.render(
      wrap(<ExploreScreen {...entries()} />),
    );
    await settle();
    expect(rtl.screen.getByTestId('explore-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-doors')).toBeNull();
    await rtl.act(async () => {
      queryClient.setQueryData(['events', 'featured', { view: 'upcoming', kind: null, category: null }], event);
      queryClient.setQueryData(['events', 'explore-rail'], { events: [event], nextPage: null, total: 1 });
    });
    expect(await rtl.screen.findByTestId('explore-doors')).toBeTruthy();
    // Tree order: Featured creators, then Upcoming events, then the doors card.
    const order = rtl.screen.getAllByText(/^(Featured creators|Upcoming events|List your services)$/).map((n) => n.props.children);
    expect(order).toEqual(['Featured creators', 'Upcoming events', 'List your services']);
  });
});
