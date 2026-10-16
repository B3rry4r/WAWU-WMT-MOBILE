/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
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

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
let bodies: Record<string, unknown[]> = {};

const ok = (data: unknown, status = 200): Answer => ({ status, body: { statusCode: status, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(`${key}${url.search}`);
  if (request.method === 'POST') (bodies[key] ??= []).push(await request.clone().json().catch(() => null));
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { SearchScreen } = require('../SearchScreen') as typeof import('../SearchScreen');
const { ExploreBar } = require('@/features/explore/ExploreBar') as typeof import('@/features/explore/ExploreBar');
const { CategoriesScreen } = require('@/features/explore/CategoriesScreen') as typeof import('@/features/explore/CategoriesScreen');
const { CreatorRail } = require('@/features/home/CreatorRail') as typeof import('@/features/home/CreatorRail');
const { contentRows, countsOf, namedCreators, peopleMap, personIds, typeLabel } = require('../model') as typeof import('../model');

const ticks = (creator: boolean, professional: boolean) => ({ creator: { verified: creator, expiresAt: null }, professional: { verified: professional, expiresAt: null } });
const person = (wawuId: string, name: string, over: Record<string, unknown> = {}) => ({
  wawuId, name, handle: name.split(' ')[0].toLowerCase(), avatarUrl: null, field: 'Business strategist', verification: ticks(true, false), following: false, ...over,
});
const profile = (wawuUserId: string) => ({ wawuUserId, handle: wawuUserId });
const piece = (id: string, creatorWawuId: string, title: string, over: Record<string, unknown> = {}) => ({
  id, title, creatorWawuId, contentType: 'pdf', accessType: 'paid', price: 3000, previewAssetUrl: '', fullAssetLocked: true, ...over,
});
const room = (id: string, name: string, kind: 'open' | 'private', memberCount: number) => ({ id, name, kind, imageUrl: null, description: '', hostWawuId: 'h', memberCount, messagesToday: 0 });

const SUGGEST = 'GET /search/suggestions';
const POPULAR = 'GET /search/popular';
const SEARCH = 'GET /search';
const PEOPLE = 'GET /search/people';

const kemi = person('c-kemi', 'Kemi Okafor');
const adaeze = person('c-adaeze', 'Adaeze Okonkwo');
const funmi = person('c-funmi', 'Funmi Adeyemi', { following: true, verification: ticks(false, true) });

function landing(over: { recent?: string[]; popular?: string[]; known?: unknown[]; people?: unknown[] } = {}) {
  answers[SUGGEST] = [ok({ recentSearches: over.recent ?? ['pricing playbook', 'Funmi'], popularSearches: ['NEVER SHOWN'], suggestedCreators: over.known ?? [profile('c-adaeze')] })];
  answers[POPULAR] = [ok({ items: over.popular ?? ['tax filing', 'VFX course'] })];
  answers[PEOPLE] = [ok({ items: over.people ?? [adaeze] })];
}

function results() {
  answers[SEARCH] = [
    ok({
      content: [
        piece('p1', 'c-kemi', 'The Freelancer’s Pricing Playbook'),
        piece('p2', 'c-adaeze', 'How to price your first shoot', { accessType: 'free', price: 0, fullAssetLocked: false, contentType: 'video' }),
        piece('p3', 'c-kemi', 'Rate card template', { price: 1500, contentType: 'template' }),
        piece('p4', 'c-kemi', 'Pricing beats', { price: 1000, contentType: 'audio' }),
      ],
      creators: [profile('c-adaeze'), profile('c-funmi'), profile('c-hidden')],
      communities: [room('r-open', 'Lagos Freelancers', 'open', 1204), room('r-private', 'Pricing clinic', 'private', 380)],
    }),
  ];
  answers[PEOPLE] = [ok({ items: [adaeze, funmi, kemi] })];
}

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const onCancel = jest.fn();
const onOpenRoom = jest.fn();
const screen = () => rtl.render(wrap(<SearchScreen onCancel={onCancel} onOpenRoom={onOpenRoom} />));
const type = (text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId('search-input'), text);
const submit = (text: string) => rtl.fireEvent(rtl.screen.getByTestId('search-input'), 'submitEditing', { nativeEvent: { text } });

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
  answers = { 'GET /users/me': [ok({ wawuUserId: 'me-1' })] };
  sent = [];
  bodies = {};
  onCancel.mockClear();
  onOpenRoom.mockClear();
  queryClient.clear();
});

describe('X5 · the landing', () => {
  it('a user sees their recent searches with Clear, what people are searching, and creators to know, asked for the way the Hub opts in', async () => {
    landing();
    await screen();
    expect(await rtl.screen.findByText('pricing playbook')).toBeTruthy();
    expect(rtl.screen.getByText('Funmi')).toBeTruthy();
    expect(rtl.screen.getByText('tax filing')).toBeTruthy();
    expect(rtl.screen.getByText('VFX course')).toBeTruthy();
    expect(await rtl.screen.findByText('Adaeze Okonkwo')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Follow' })).toBeTruthy();
    expect(rtl.screen.getByText('Clear')).toBeTruthy();
    expect(rtl.screen.queryByText('NEVER SHOWN')).toBeNull();
    expect(rtl.screen.getByPlaceholderText('Search Who Made This')).toBeTruthy();
    expect(sent).toContain('GET /search/suggestions?include=recent');
    expect(sent.some((s) => s.startsWith('GET /search/people?ids=c-adaeze'))).toBe(true);
  });

  it('with nothing to show, Recent says so, and no popular or creators section is drawn (R-47)', async () => {
    landing({ recent: [], popular: [], known: [], people: [] });
    await screen();
    expect(await rtl.screen.findByText('No recent searches yet.')).toBeTruthy();
    expect(rtl.screen.queryByText('Clear')).toBeNull();
    expect(rtl.screen.queryByText('PEOPLE ARE SEARCHING')).toBeNull();
    expect(rtl.screen.queryByText('People are searching')).toBeNull();
    expect(rtl.screen.queryByText('Creators to know')).toBeNull();
    expect(rtl.screen.queryByText('CREATORS TO KNOW')).toBeNull();
  });

  it('Clear forgets the recent searches at once and asks the Hub to', async () => {
    landing();
    answers['DELETE /search/recent'] = [ok({ cleared: 2 })];
    await screen();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('search-clear-recent'));
    expect(await rtl.screen.findByText('No recent searches yet.')).toBeTruthy();
    expect(sent).toContain('DELETE /search/recent');
    expect(rtl.screen.queryByText('pricing playbook')).toBeNull();
  });

  it('Follow turns to Following in place, and goes back with a line when the Hub refuses', async () => {
    landing();
    answers['POST /creators/c-adaeze/follow'] = [ok({ following: true })];
    await screen();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    expect(await rtl.screen.findByRole('button', { name: 'Following' })).toBeTruthy();
    answers['DELETE /creators/c-adaeze/follow'] = [{ status: 400, body: { statusCode: 400, message: 'No' } }];
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Following' }));
    expect(await rtl.screen.findByText(/Couldn’t unfollow @adaeze/)).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Following' })).toBeTruthy();
  });

  it('Cancel leaves Search', async () => {
    landing();
    await screen();
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('a failed read says so under a Try again, and typing still works', async () => {
    answers[SUGGEST] = ['offline'];
    answers[POPULAR] = [ok({ items: [] })];
    await screen();
    expect(await rtl.screen.findByText('Couldn’t load your searches', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByTestId('search-input')).toBeTruthy();
  }, 15000);
});

describe('X6 to X9 · the results', () => {
  it('a recent search searches that text, is remembered, and shows the tabs with counts, sections and names from the Hub', async () => {
    landing();
    results();
    answers['POST /search/recent'] = [ok({ items: ['pricing'] }, 201)];
    await screen();
    await rtl.fireEvent.press(await rtl.screen.findByText('pricing playbook'));
    expect(await rtl.screen.findByTestId('search-tab-all')).toBeTruthy();
    expect(sent.some((s) => s === 'GET /search?q=pricing+playbook&tab=all&include=communities' || s === 'GET /search?q=pricing%20playbook&tab=all&include=communities')).toBe(true);
    expect(bodies['POST /search/recent']).toEqual([{ q: 'pricing playbook' }]);
    // 4 content, 2 creators (the third is not named by the Hub), 2 communities.
    expect(rtl.screen.getByTestId('search-tab-all').props.accessibilityLabel).toBe('All 8');
    expect(rtl.screen.getByTestId('search-tab-content').props.accessibilityLabel).toBe('Content 4');
    expect(rtl.screen.getByTestId('search-tab-creators').props.accessibilityLabel).toBe('Creators 2');
    expect(rtl.screen.getByTestId('search-tab-communities').props.accessibilityLabel).toBe('Communities 2');
    // The All tab: 3 pieces, 2 creators, 1 community, and See all where more exist.
    expect(rtl.screen.getByText('Kemi Okafor · PDF')).toBeTruthy();
    expect(rtl.screen.getByText('Free')).toBeTruthy();
    expect(rtl.screen.queryByText('Pricing beats')).toBeNull();
    expect(rtl.screen.getByText('See all 4')).toBeTruthy();
    expect(rtl.screen.queryByText('See all 2', { exact: true })).toBeTruthy();
    expect(rtl.screen.getByText('Funmi Adeyemi')).toBeTruthy();
    expect(rtl.screen.queryByText('c-hidden')).toBeNull();
    expect(rtl.screen.getByText('Lagos Freelancers')).toBeTruthy();
    expect(rtl.screen.queryByText('Pricing clinic')).toBeNull();
  });

  it('typing searches once typing pauses, and a user can switch tabs', async () => {
    landing();
    results();
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('pricing');
    expect(await rtl.screen.findByTestId('search-tab-content', {}, { timeout: 4000 })).toBeTruthy();
    expect(sent.filter((s) => s.startsWith('GET /search?q=pricing')).length).toBe(1);
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-tab-content'));
    expect(rtl.screen.getByText('Pricing beats')).toBeTruthy();
    expect(rtl.screen.getByText('Rate card template')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-tab-communities'));
    expect(rtl.screen.getByText('Pricing clinic')).toBeTruthy();
    expect(rtl.screen.getByText('Ask')).toBeTruthy();
    expect(rtl.screen.getByText('Join')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-tab-creators'));
    expect(rtl.screen.getByRole('button', { name: 'Following' })).toBeTruthy();
  });

  it('Follow works in place on a creator row', async () => {
    landing();
    results();
    answers['POST /creators/c-adaeze/follow'] = [ok({ following: true })];
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('pricing');
    await rtl.screen.findByTestId('search-tab-all', {}, { timeout: 4000 });
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Follow' }));
    await rtl.waitFor(() => expect(rtl.screen.getAllByRole('button', { name: 'Following' })).toHaveLength(2));
  });

  it('Join opens an open room (I25); Ask sends the request to a private one and the row says Requested', async () => {
    landing();
    results();
    answers['POST /communities/r-open/join'] = [ok({ id: 'm1', userWawuId: 'me-1', status: 'joined', requestedAt: 'x', communityId: 'r-open', joinedAt: 'x' })];
    answers['POST /communities/r-private/join'] = [ok({ id: 'm2', userWawuId: 'me-1', status: 'pending', requestedAt: 'x', communityId: 'r-private', joinedAt: null })];
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('pricing');
    await rtl.screen.findByTestId('search-tab-communities', {}, { timeout: 4000 });
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-tab-communities'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-room-r-open-join'));
    await rtl.waitFor(() => expect(onOpenRoom).toHaveBeenCalledWith('r-open'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-room-r-private-ask'));
    expect(await rtl.screen.findByText('Requested')).toBeTruthy();
    expect(onOpenRoom).toHaveBeenCalledTimes(1);
  });

  it('a tab with nothing in it says so, and the other tabs keep their counts', async () => {
    landing();
    answers[SEARCH] = [ok({ content: [piece('p1', 'c-kemi', 'Only piece')], creators: [], communities: [] })];
    answers[PEOPLE] = [ok({ items: [kemi] })];
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('only');
    await rtl.fireEvent.press(await rtl.screen.findByTestId('search-tab-creators', {}, { timeout: 4000 }));
    expect(await rtl.screen.findByText('No creators found')).toBeTruthy();
    expect(rtl.screen.getByTestId('search-tab-content').props.accessibilityLabel).toBe('Content 1');
  });

  it('when nothing matched a user is told to try a shorter search and sees the closest content (X10)', async () => {
    landing();
    answers[SEARCH] = [ok({ content: [], creators: [], communities: [] })];
    answers['GET /search/closest'] = [ok({ items: [piece('p9', 'c-kemi', 'Wedding films for beginners', { price: 2500, contentType: 'video' })] })];
    answers[PEOPLE] = [ok({ items: [kemi] })];
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('how to price a wedding film in abuja');
    expect(await rtl.screen.findByText('Try a shorter search', {}, { timeout: 4000 })).toBeTruthy();
    expect(rtl.screen.getByText('Fewer words usually finds more.')).toBeTruthy();
    expect(await rtl.screen.findByText('Wedding films for beginners')).toBeTruthy();
    expect(rtl.screen.getByText('Kemi Okafor · Video')).toBeTruthy();
    expect(rtl.screen.getByTestId('search-tab-all').props.accessibilityLabel).toBe('All 0');
  });

  it('a failed search says it is not working and Try again reads it again (X12)', async () => {
    landing();
    answers[SEARCH] = ['offline'];
    answers[PEOPLE] = [ok({ items: [kemi] })];
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('pricing');
    expect(await rtl.screen.findByText('Search isn’t working right now', {}, { timeout: 12000 })).toBeTruthy();
    expect(rtl.screen.getByText('Check your connection and try again.')).toBeTruthy();
    answers[SEARCH] = [ok({ content: [piece('p1', 'c-kemi', 'Back again')], creators: [], communities: [] })];
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Back again')).toBeTruthy();
  }, 25000);

  it('clearing the text goes back to the landing', async () => {
    landing();
    results();
    await screen();
    await rtl.screen.findByText('pricing playbook');
    await type('pricing');
    await rtl.screen.findByTestId('search-tab-all', {}, { timeout: 4000 });
    await rtl.fireEvent.press(rtl.screen.getByTestId('search-input-clear'));
    expect(await rtl.screen.findByTestId('search-landing')).toBeTruthy();
  });
});

describe('the model', () => {
  it('reads kinds, bylines and prices from the Hub: a paid piece in kobo, a free one as Free, no name when the Hub gave none', () => {
    const rows = contentRows(
      [piece('a', 'x', 'A', { contentType: 'pdf', price: 3000 }) as never, piece('b', 'y', 'B', { accessType: 'free', price: 0, contentType: 'course', fullAssetLocked: false, previewAssetUrl: 'u' }) as never],
      peopleMap([person('x', 'Xi Ola') as never]),
    );
    expect(rows[0]).toMatchObject({ byline: 'Xi Ola · PDF', priceKobo: 300000, locked: true, thumb: null });
    expect(rows[1]).toMatchObject({ byline: 'Course', priceKobo: null, locked: false, thumb: 'u' });
    expect(typeLabel('hologram')).toBe('Hologram');
  });

  it('counts only the creators the Hub named, and asks for each id once, creators first', () => {
    const people = peopleMap([person('a', 'A A') as never]);
    const creators = [{ wawuUserId: 'a' }, { wawuUserId: 'gone' }] as never[];
    const content = [piece('1', 'a', 't'), piece('2', 'b', 't')] as never[];
    const named = namedCreators(creators, people);
    expect(named.map((p) => p.wawuId)).toEqual(['a']);
    expect(personIds(creators, content)).toEqual(['a', 'gone', 'b']);
    expect(countsOf({ content, creators, communities: [room('r', 'R', 'open', 1)] } as never, named)).toEqual({ all: 4, content: 2, creators: 1, communities: 1 });
  });
});
