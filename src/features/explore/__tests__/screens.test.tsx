/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
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

const ME = 'me-1';
const ALL_PAGE_1 = 'GET /explore/creators?page=1&perPage=24';
const PHOTO_PAGE_1 = 'GET /explore/creators?page=1&perPage=24&category=photography';
const GAMING_PAGE_1 = 'GET /explore/creators?page=1&perPage=24&category=gaming_esports';

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const settle = () => rtl.act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
});

afterEach(async () => {
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
  };
  sent = [];
  queryClient.clear();
});

describe('X1 · Explore', () => {
  const featured = 'GET /explore/featured-creators?limit=10';

  it('a user sees the loading view (X14) while Explore loads, and no error or empty words', async () => {
    answers[featured] = ['hold'];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    expect(await rtl.screen.findByTestId('explore-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Loading Explore')).toBeTruthy();
    expect(rtl.screen.getByRole('header', { name: 'Explore' })).toBeTruthy();
    expect(rtl.screen.queryByTestId('explore-error')).toBeNull();
  });

  it('a user sees the category tiles in the server’s order and the featured creators, with handle, field and tick', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist'), card('c2', 'funmi', 'Accountant', { verification: ticks(false, true) })] })];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
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

  it('draws no entry whose screen is not built yet (R-41): no search, bell, events, See all, doors or Create', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    await rtl.screen.findByText('Featured creators');
    for (const words of [/Search/, 'See all', 'Upcoming events', /FEATURED EVENT/i, 'Find a professional', 'Find a school', 'List your services']) {
      expect(rtl.screen.queryByText(words)).toBeNull();
    }
    expect(rtl.screen.queryByLabelText(/Notifications|Create/)).toBeNull();
    // A creator card opens nothing yet (M5 is ME-02): only its Follow is a control.
    expect(rtl.within(rtl.screen.getByTestId('explore-featured-c1')).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Follow']);
  });

  it('a user can tap a category tile to open that category, and All or More to open every category', async () => {
    answers[featured] = [ok({ items: [] })];
    const onOpen = jest.fn();
    await rtl.render(wrap(<ExploreScreen onOpenCategory={onOpen} />));
    await rtl.screen.findByTestId('explore-tile-photography');
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-photography'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-all'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('explore-tile-more'));
    expect(onOpen.mock.calls).toEqual([['photography'], ['all'], ['all']]);
  });

  it('with nobody featured, a user sees the tiles and no empty rail', async () => {
    answers[featured] = [ok({ items: [] })];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.screen.queryByText('Featured creators')).toBeNull();
  });

  it('a user can Follow a featured creator, and unfollow with Following', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    answers['POST /creators/c1/follow'] = [ok({ following: true }, 201)];
    answers['DELETE /creators/c1/follow'] = [ok({ following: false })];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
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
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    expect(await rtl.screen.findByText('Couldn’t follow @adaeze. Try again later.')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Follow' })).toBeTruthy();
    expect(rtl.screen.queryByText('You cannot follow this account.')).toBeNull();
  });

  it('a Follow still on its way does not stop a user following a second creator', async () => {
    answers[featured] = [ok({ items: [card('c1', 'adaeze', 'Business strategist'), card('c2', 'funmi', 'Accountant')] })];
    answers['POST /creators/c1/follow'] = ['hold'];
    answers['POST /creators/c2/follow'] = [ok({ following: true }, 201)];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
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
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
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
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
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
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    const tiles = await rtl.screen.findByTestId('explore-tiles');
    expect(rtl.within(tiles).getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['All', 'Music & Audio']);
  });

  it('the viewer’s own card has no Follow (nobody follows themselves)', async () => {
    answers[featured] = [ok({ items: [card(ME, 'me', 'Me'), card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    await rtl.screen.findByText('@me');
    await settle();
    expect(rtl.within(rtl.screen.getByTestId(`explore-featured-${ME}`)).queryAllByRole('button')).toHaveLength(0);
    expect(rtl.screen.getAllByRole('button', { name: 'Follow' })).toHaveLength(1);
  });

  it('when Explore cannot load, a user sees why and can try again', async () => {
    answers[featured] = [refused(500, 'Something went wrong on our side'), refused(500, 'Something went wrong on our side'), refused(500, 'Something went wrong on our side'), ok({ items: [card('c1', 'adaeze', 'Business strategist')] })];
    await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
    expect(await rtl.screen.findByTestId('explore-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load Explore')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('@adaeze')).toBeTruthy();
  }, 15000);
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
    const explore = await rtl.render(wrap(<ExploreScreen onOpenCategory={jest.fn()} />));
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
