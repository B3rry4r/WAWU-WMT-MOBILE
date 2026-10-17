/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: (run: () => void) => {
    require('react').useEffect(run, [run]);
  },
  router: { push: (href: string) => mockPush(href) },
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer | Answer[]> = {};
let sent: { method: string; path: string; body: unknown }[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// The Hub client keeps the `fetch` it finds when it is first loaded, so the screens load after the stand-in is in place.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { CreatorGate } = require('@/features/pro-listing/ApplyScreen') as typeof import('@/features/pro-listing/ApplyScreen');
const { CreatorSetupScreen } = require('../CreatorSetupScreen') as typeof import('../CreatorSetupScreen');
const { FollowScreen } = require('../FollowScreen') as typeof import('../FollowScreen');
const { InterestsScreen } = require('../InterestsScreen') as typeof import('../InterestsScreen');

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const calls = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === path);

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
const interests = (selected: string[] = []) => ok({ minimum: 3, options: chips, selected });
const person = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  wawuId: id,
  name,
  handle: name.toLowerCase().replace(' ', ''),
  avatarUrl: null,
  field: 'photography',
  pieceCount: 2,
  verification: { creator: { verified: true }, professional: { verified: false } },
  badge: null,
  following: false,
  ...over,
});

const frame = (ui: ReactElement) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  </SafeAreaProvider>
);

// What isolates one test from the next in this file. The app's one query client is shared by the screens (the follow button writes its
// optimistic answer to it), so it is emptied before and after each test, answers every read once (no retries), and drops a finished
// mutation at once: left to its default it keeps one for 5 minutes on a timer that holds the test process open after the last test.
// The stand-in's answers and record start empty each time, and each test settles what is in flight before it ends.
const appQueryDefaults = queryClient.getDefaultOptions();

beforeAll(() => {
  queryClient.setDefaultOptions({
    ...appQueryDefaults,
    queries: { ...appQueryDefaults.queries, retry: false },
    mutations: { ...appQueryDefaults.mutations, gcTime: 0 },
  });
});

afterAll(() => {
  queryClient.setDefaultOptions(appQueryDefaults);
});

beforeEach(() => {
  answers = {};
  sent = [];
  mockPush.mockClear();
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const failure = { status: 500, body: { statusCode: 500, message: 'x', data: null } } as const;

describe('A12 What are you into', () => {
  it('a user can pick three of the twelve chips from the Hub and tap Continue with their ids', async () => {
    answers['GET /api/hub/users/me/interests'] = interests();
    const onContinue = jest.fn(async () => undefined);
    await render(frame(<InterestsScreen step="1 of 2" onContinue={onContinue} />));
    await screen.findByTestId('interest-music_audio');
    expect(screen.getByText('Pick 3 or more. It tunes your feed.')).toBeTruthy();
    expect(screen.getByText('Gaming & Esports')).toBeTruthy();
    expect(screen.getByTestId('interests-continue').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('interest-technology'));
    await fireEvent.press(screen.getByTestId('interest-music_audio'));
    expect(screen.getByTestId('interests-continue').props.accessibilityState?.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('interest-film_video'));
    expect(screen.getByTestId('interests-continue').props.accessibilityState?.disabled).toBeFalsy();
    await fireEvent.press(screen.getByTestId('interests-continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledWith(['music_audio', 'film_video', 'technology']));
  });

  it('shows the picks saved before, an error with Try again, and a line when Continue fails', async () => {
    answers['GET /api/hub/users/me/interests'] = failure;
    const onContinue = jest.fn(async () => {
      throw new Error('no');
    });
    await render(frame(<InterestsScreen onContinue={onContinue} />));
    await screen.findByTestId('interests-error');
    answers['GET /api/hub/users/me/interests'] = interests(['art_design', 'technology', 'photography']);
    await fireEvent.press(screen.getByText('Try again'));
    await screen.findByTestId('interest-art_design');
    expect(screen.getByTestId('interest-art_design').props.accessibilityState?.selected).toBe(true);
    await fireEvent.press(screen.getByTestId('interests-continue'));
    await screen.findByTestId('interests-failed');
    expect(onContinue).toHaveBeenCalledWith(['photography', 'technology', 'art_design'].sort((a, b) => chips.findIndex((c) => c.id === a) - chips.findIndex((c) => c.id === b)));
  });
});

describe('A13 People to follow', () => {
  it('a user sees the creators the Hub suggests for their picks, can follow and unfollow one, and tap Go to Home', async () => {
    answers['GET /api/hub/users/me/interests'] = interests(['photography', 'film_video', 'technology']);
    answers['GET /api/hub/explore/suggested-creators'] = ok({ items: [person('c1', 'Amaka Nwosu'), person('c2', 'Tife Adeola', { following: true, field: 'film_video' })] });
    answers['POST /api/hub/creators/c1/follow'] = ok({ following: true });
    answers['DELETE /api/hub/creators/c2/follow'] = ok({ following: false });
    const onDone = jest.fn(async () => undefined);
    await render(frame(<FollowScreen step="2 of 2" onDone={onDone} />));
    await screen.findByTestId('person-c1');
    expect(calls('GET', '/api/hub/explore/suggested-creators')).toHaveLength(1);
    expect(screen.getByText('Photography')).toBeTruthy();
    expect(screen.getByText('Film & Video')).toBeTruthy();
    expect(screen.getByText('Based on what you picked.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('follow-c1'));
    await waitFor(() => expect(calls('POST', '/api/hub/creators/c1/follow')).toHaveLength(1));
    await fireEvent.press(screen.getByTestId('follow-c2'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/creators/c2/follow')).toHaveLength(1));
    await fireEvent.press(screen.getByTestId('follow-done'));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it('says so when nobody matches yet, and Go to Home still works', async () => {
    answers['GET /api/hub/users/me/interests'] = interests(['photography', 'film_video', 'technology']);
    answers['GET /api/hub/explore/suggested-creators'] = ok({ items: [] });
    const onDone = jest.fn(async () => undefined);
    await render(frame(<FollowScreen onDone={onDone} />));
    await screen.findByTestId('follow-empty');
    await fireEvent.press(screen.getByTestId('follow-done'));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it('shows an error with Try again when the list cannot be read, and Go to Home still works', async () => {
    answers['GET /api/hub/users/me/interests'] = interests(['photography', 'film_video', 'technology']);
    answers['GET /api/hub/explore/suggested-creators'] = failure;
    await render(frame(<FollowScreen onDone={async () => undefined} />));
    await screen.findByTestId('follow-error');
    expect(screen.getByTestId('follow-done')).toBeTruthy();
    answers['GET /api/hub/explore/suggested-creators'] = ok({ items: [person('c1', 'Amaka Nwosu')] });
    await fireEvent.press(screen.getByText('Try again'));
    await screen.findByTestId('person-c1');
  });
});

describe('A11 Set up your account', () => {
  const priced = { enabled: true, priceKobo: 50000, responseHours: 24, creatorSharePct: 85, earnPerMessageKobo: 42500, raiseToKobo: null, options: { minPriceKobo: 1, maxPriceKobo: 2, pricePresets: [], responseWindowHours: [24] }, standing: { paused: false } };
  const stats = (over: Record<string, unknown> = {}) => ok({ postCount: 0, followerCount: 0, followingCount: 0, profileCompletenessPct: 40, profileCompletenessMissing: ['bio'], ...over });

  it('a creator sees which steps are done, can open each of the four, and tap Later', async () => {
    answers['GET /api/hub/paid-dm/settings'] = ok(priced);
    answers['GET /api/hub/users/me/profile-stats'] = stats();
    answers['GET /api/hub/money/wallet'] = ok({ state: 'not_open', account: null, limits: null, pin: { isSet: false } });
    const onOpen = jest.fn();
    const onLater = jest.fn();
    await render(frame(<CreatorSetupScreen onOpen={onOpen} onLater={onLater} />));
    await screen.findByTestId('setup-count');
    expect(screen.getByText('1 of 4')).toBeTruthy();
    expect(screen.getByText('Your earnings wait until you open your wallet')).toBeTruthy();
    expect(screen.getByText('Nothing published yet')).toBeTruthy();
    expect(screen.queryByText('Start your first community')).toBeNull();
    expect(screen.queryByText('Free to list')).toBeNull();
    for (const target of ['paid', 'profile', 'publish', 'wallet']) {
      await fireEvent.press(screen.getByTestId(`setup-row-${target}`));
      expect(onOpen).toHaveBeenLastCalledWith(target);
    }
    await fireEvent.press(screen.getByTestId('setup-later'));
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it('counts every finished step', async () => {
    answers['GET /api/hub/paid-dm/settings'] = ok(priced);
    answers['GET /api/hub/users/me/profile-stats'] = stats({ postCount: 2, profileCompletenessMissing: [] });
    answers['GET /api/hub/money/wallet'] = ok({ state: 'open', account: { accountNumber: '0000000000', accountName: 'A B', bankName: 'Nuvion' }, limits: null, pin: { isSet: true } });
    await render(frame(<CreatorSetupScreen onOpen={jest.fn()} onLater={jest.fn()} />));
    await screen.findByText('4 of 4');
    expect(screen.queryByTestId('setup-read-failed')).toBeNull();
  });

  it('keeps the rows working when a read fails', async () => {
    answers['GET /api/hub/paid-dm/settings'] = ok(priced);
    answers['GET /api/hub/users/me/profile-stats'] = stats({ postCount: 2, profileCompletenessMissing: [] });
    answers['GET /api/hub/money/wallet'] = 'offline';
    const onOpen = jest.fn();
    await render(frame(<CreatorSetupScreen onOpen={onOpen} onLater={jest.fn()} />));
    await screen.findByTestId('setup-read-failed');
    expect(screen.queryByTestId('setup-count')).toBeNull();
    await fireEvent.press(screen.getByTestId('setup-row-wallet'));
    expect(onOpen).toHaveBeenCalledWith('wallet');
  });
});

describe('P10 Become a creator', () => {
  it('a user can tap Become a creator: the Hub records the type and A11 opens', async () => {
    answers['PUT /api/hub/users/me/account-type'] = ok({ accountType: 'creator' });
    await render(frame(<CreatorGate title="Offer your services" onBack={jest.fn()} />));
    await fireEvent.press(screen.getByTestId('pro-become-creator'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/creator-setup'));
    expect(calls('PUT', '/api/hub/users/me/account-type')[0].body).toEqual({ accountType: 'creator' });
  });

  it('draws Become a creator as the board\'s compact pill: 44 high, centred, not the full-width 54 px button', async () => {
    await render(frame(<CreatorGate title="Offer your services" onBack={jest.fn()} />));
    const button = StyleSheet.flatten(screen.getByTestId('pro-become-creator').props.style);
    expect(button.height).toBe(44);
    expect(button.alignSelf).toBe('center');
  });

  it('stays on the gate with a line when the Hub refuses', async () => {
    answers['PUT /api/hub/users/me/account-type'] = failure;
    await render(frame(<CreatorGate title="Offer your services" onBack={jest.fn()} />));
    await fireEvent.press(screen.getByTestId('pro-become-creator'));
    await screen.findByTestId('pro-become-failed');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
