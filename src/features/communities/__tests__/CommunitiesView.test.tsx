/* eslint-disable @typescript-eslint/no-require-imports */
import type React from 'react';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockPush = jest.fn();
let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused, useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** `delay`: the answer comes this many ms late. `onSend`: runs at the moment the request reaches the network, before anything answers it. */
type Answer = { status: number; body: unknown; delay?: number; onSend?: () => void } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown, extra: object = {}): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const refuse = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });
const paged = (items: unknown[], nextPage: number | null = null): Answer =>
  ok(items, { pagination: { currentPage: 1, nextPage, perPage: 20, total: items.length } });

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
  answer.onSend?.();
  if (answer.delay) await new Promise((resolve) => setTimeout(resolve, answer.delay));
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { CommunitiesView } = require('../CommunitiesView') as typeof import('../CommunitiesView');

const ME = 'user-me';
const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const sender = (wawuId: string, name: string) => ({ wawuId, name, handle: null, avatarUrl: null, verification });

function mine(id: string, name: string, over: Record<string, unknown> = {}) {
  return {
    id,
    name,
    kind: 'open',
    imageUrl: null,
    description: 'About it',
    hostWawuId: 'host',
    memberCount: 12,
    messagesToday: 0,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    link: `wawu/c/${name.toLowerCase().replace(/\s+/g, '-')}`,
    role: 'member',
    joinedAt: '2026-10-01T10:00:00Z',
    lastMessage: { id: `${id}-m`, text: 'who’s at the meetup Sat?', imageUrl: null, sentAt: new Date().toISOString(), senderWawuId: 'u2', sender: sender('u2', 'Tolu Balogun') },
    unreadCount: 0,
    lastActivityAt: new Date().toISOString(),
    ...over,
  };
}

function suggestion(id: string, name: string, over: Record<string, unknown> = {}) {
  return { id, name, kind: 'open', imageUrl: null, description: 'About it', hostWawuId: 'host', memberCount: 2100, messagesToday: 0, ...over };
}

const MINE = 'GET /communities/mine?page=1&perPage=20';
const SUGGESTED = 'GET /communities/suggested?page=1&perPage=20';
const SUGGESTED_2 = 'GET /communities/suggested?page=2&perPage=20';

beforeEach(() => {
  mockFocused = true;
  sent = [];
  mockPush.mockClear();
  queryClient.clear();
  answers = {
    'GET /credits': [ok({ userWawuId: ME, creditBalance: 48, trialEndsAt: null })],
    'GET /communities/message-cost': [ok({ creditsPerMessage: 1 })],
    'GET /users/me': [ok({ wawuUserId: ME, firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null, verification })],
  };
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  queryClient.clear();
});

const wrapView = () => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
    <CommunitiesView />
  </SafeAreaProvider>
);

async function renderView() {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <CommunitiesView />
    </SafeAreaProvider>,
  );
}

describe('Communities (I24)', () => {
  it('a user sees their WAWU Credits as a count, and that reading is free', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('48 WAWU Credits')).toBeTruthy();
    expect(await rtl.screen.findByText('Reading is free · 1 credit per message you send')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦|naira/i)).toBeNull();
    expect(sent).toContain('GET /communities/message-cost');
  });

  it('the price of a message is the server\'s figure: 2 credits reads "2 credits per message you send"', async () => {
    answers['GET /communities/message-cost'] = [ok({ creditsPerMessage: 2 })];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('Reading is free · 2 credits per message you send')).toBeTruthy();
  });

  it('says only that reading is free while the price loads, and when it cannot be read, and states it once it can', async () => {
    const boom = refuse(500, 'Something went wrong.');
    answers['GET /communities/message-cost'] = [boom, boom, boom, ok({ creditsPerMessage: 1 })];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    const view = await renderView();
    expect(await rtl.screen.findByText('48 WAWU Credits')).toBeTruthy();
    expect(rtl.screen.getByText('Reading is free')).toBeTruthy();
    // The price fails for real (500, retried, still 500): the strip never invents a figure.
    await rtl.waitFor(() => expect(sent.filter((request) => request === 'GET /communities/message-cost')).toHaveLength(3), { timeout: 8000 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(rtl.screen.getByText('Reading is free')).toBeTruthy();
    expect(rtl.screen.queryByText(/credit per message|credits per message/)).toBeNull();
    // Coming back to the view reads it again.
    mockFocused = false;
    await view.rerender(wrapView());
    mockFocused = true;
    await view.rerender(wrapView());
    expect(await rtl.screen.findByText('Reading is free · 1 credit per message you send')).toBeTruthy();
  }, 20_000);

  it('shows the balance the server holds, and "1 WAWU Credit" for one', async () => {
    answers['GET /credits'] = [ok({ userWawuId: ME, creditBalance: 1, trialEndsAt: null })];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('1 WAWU Credit')).toBeTruthy();
  });

  it('says so when the balance cannot be read, and does not invent one', async () => {
    answers['GET /credits'] = [refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.')];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('Your balance could not be read', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.queryByText(/WAWU Credits$/, { exact: false })).not.toBeNull();
    expect(rtl.screen.queryByText(/^\d+ WAWU Credit/)).toBeNull();
  }, 20_000);

  it('a user sees the rooms they are in, each with who spoke last and what they said, and a lock on a private one', async () => {
    answers[MINE] = [
      paged([
        mine('r1', 'Lagos Freelancers'),
        mine('r2', 'Pricing clinic', { kind: 'private', lastMessage: { id: 'x', text: 'office hours at 6pm', imageUrl: null, sentAt: new Date().toISOString(), senderWawuId: 'u3', sender: sender('u3', 'Kemi Okafor') } }),
      ]),
    ];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('Lagos Freelancers')).toBeTruthy();
    expect(rtl.screen.getByText('Tolu: who’s at the meetup Sat?')).toBeTruthy();
    expect(rtl.screen.getByText('Kemi: office hours at 6pm')).toBeTruthy();
    expect(rtl.screen.getByLabelText(/^Pricing clinic, private/)).toBeTruthy();
    expect(rtl.screen.getByLabelText(/^Lagos Freelancers, Tolu/)).toBeTruthy();
    expect(rtl.screen.getByText('Your communities')).toBeTruthy();
  });

  it('says "You:" for the person\'s own last message, "Photo" for a picture, and "No messages yet" for a quiet room', async () => {
    answers[MINE] = [
      paged([
        mine('r1', 'Mine', { lastMessage: { id: 'x', text: 'on my way', imageUrl: null, sentAt: new Date().toISOString(), senderWawuId: ME, sender: sender(ME, 'Ada Obi') } }),
        mine('r2', 'Pictures', { lastMessage: { id: 'y', text: null, imageUrl: 'http://x/y.png', sentAt: new Date().toISOString(), senderWawuId: 'u2', sender: sender('u2', 'Tolu Balogun') } }),
        mine('r3', 'Quiet', { lastMessage: null, lastActivityAt: null }),
      ]),
    ];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('You: on my way')).toBeTruthy();
    expect(rtl.screen.getByText('Tolu: Photo')).toBeTruthy();
    expect(rtl.screen.getByText('No messages yet')).toBeTruthy();
  });

  it('shows how many messages are unread in a room, and nothing for a room with none', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers', { unreadCount: 3 }), mine('r2', 'Pricing clinic', { unreadCount: 0 })])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('3')).toBeTruthy();
    expect(rtl.screen.getByLabelText(/Lagos Freelancers.*3 unread/)).toBeTruthy();
    expect(rtl.screen.getByLabelText(/^Pricing clinic, /).props.accessibilityLabel).not.toMatch(/unread/);
  });

  it('a user can open a room they are in', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText(/^Lagos Freelancers/));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r1' } });
  });

  it('offers the open rooms the server suggests, in its order (most members first), each with the member count and Join', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [
      paged([suggestion('r3', 'Zebra club', { memberCount: 2100 }), suggestion('r5', 'Afrobeats producers', { memberCount: 12 })]),
    ];
    await renderView();
    expect(await rtl.screen.findByText('Suggested')).toBeTruthy();
    expect(rtl.screen.getByText('2.1K members · open')).toBeTruthy();
    expect(rtl.screen.getByText('12 members · open')).toBeTruthy();
    expect(rtl.screen.getAllByText('Join')).toHaveLength(2);
    // The server's order stands: the phone does not sort them by name.
    const order = rtl.screen.getAllByLabelText(/^Join /).map((node) => node.props.accessibilityLabel as string);
    expect(order).toEqual(['Join Zebra club, 2.1K members', 'Join Afrobeats producers, 12 members']);
    // The suggestions come from their own route, not from the list of every room.
    expect(sent).toContain(SUGGESTED);
    expect(sent.some((request) => request.startsWith('GET /communities?'))).toBe(false);
  });

  it('a user can Join an open room: the server joins them, and the room opens', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')]), paged([mine('r1', 'Lagos Freelancers'), mine('r3', 'Afrobeats producers')])];
    answers[SUGGESTED] = [paged([suggestion('r3', 'Afrobeats producers')]), paged([])];
    answers['POST /communities/r3/join'] = [ok({ id: 'mem', userWawuId: ME, status: 'joined', requestedAt: '2026-10-07T10:00:00Z', communityId: 'r3', joinedAt: '2026-10-07T10:00:00Z' })];
    await renderView();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText(/^Join Afrobeats producers/));
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r3' } }));
    expect(sent).toContain('POST /communities/r3/join');
    // The room moves up into "Your communities", where the server now lists it.
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Join')).toBeNull());
  });

  it('a join that fails says so on the row and can be tried again', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([suggestion('r3', 'Afrobeats producers')])];
    answers['POST /communities/r3/join'] = [refuse(500, 'Something went wrong.'), ok({ id: 'mem', userWawuId: ME, status: 'joined', requestedAt: '2026-10-07T10:00:00Z', communityId: 'r3', joinedAt: '2026-10-07T10:00:00Z' })];
    await renderView();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText(/^Join Afrobeats producers/));
    expect(await rtl.screen.findByText('Try again')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByLabelText(/^Join Afrobeats producers/));
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  });

  it('does not list a private room: asking to join it is another task\'s screen (R-47)', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([suggestion('r4', 'Founders under 30', { kind: 'private', memberCount: 640 }), suggestion('r3', 'Afrobeats producers')])];
    await renderView();
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
    expect(rtl.screen.queryByText('Founders under 30')).toBeNull();
    expect(rtl.screen.queryByLabelText(/Founders under 30/)).toBeNull();
    expect(rtl.screen.queryByText('Ask')).toBeNull();
    expect(rtl.screen.queryByText('Buy')).toBeNull();
    // Nothing on the screen is a row that does nothing: every suggestion is a button that joins.
    expect(rtl.screen.getAllByText('Join')).toHaveLength(1);
  });

  it('a page that holds only private rooms is followed by the next one, until a room that can be joined turns up', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([suggestion('p1', 'Private one', { kind: 'private' }), suggestion('p2', 'Private two', { kind: 'private' })], 2)];
    answers[SUGGESTED_2] = [paged([suggestion('r3', 'Afrobeats producers')])];
    await renderView();
    // Nobody scrolled: the phone itself reads on, and the empty state never shows while more pages exist.
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
    expect(sent).toContain(SUGGESTED_2);
    expect(rtl.screen.queryByTestId('communities-empty')).toBeNull();
    expect(rtl.screen.queryByText('Private one')).toBeNull();
  });

  it('a first page with only a few open rooms is followed by the next one without the person scrolling (defect 22)', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([suggestion('o1', 'Zeta open', { memberCount: 5000 }), suggestion('o2', 'Mid open', { memberCount: 3000 })], 2)];
    answers[SUGGESTED_2] = [paged([suggestion('o3', 'Afrobeats producers'), suggestion('o4', 'Alpha open')])];
    await renderView();
    // Nobody scrolled and the list never reported its end: the phone read page 2 itself.
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
    for (const name of ['Zeta open', 'Mid open', 'Afrobeats producers', 'Alpha open']) expect(rtl.screen.getByText(name)).toBeTruthy();
    expect(sent.filter((request) => request.startsWith('GET /communities/suggested'))).toEqual([SUGGESTED, SUGGESTED_2]);
  });

  it('lists every open room when private rooms fill the pages between them: two open, 45 private, two open', async () => {
    const privates = (from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => suggestion(`p${from + i}`, `Private room ${from + i}`, { kind: 'private', memberCount: 3000 }));
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([suggestion('o1', 'Zeta open', { memberCount: 5000 }), suggestion('o2', 'Mid open', { memberCount: 3000 }), ...privates(1, 18)], 2)];
    answers[SUGGESTED_2] = [paged(privates(19, 38), 3)];
    answers['GET /communities/suggested?page=3&perPage=20'] = [paged([...privates(39, 45), suggestion('o3', 'Afrobeats producers'), suggestion('o4', 'Alpha open')])];
    await renderView();
    expect(await rtl.screen.findByText('Alpha open', {}, { timeout: 5000 })).toBeTruthy();
    for (const name of ['Zeta open', 'Mid open', 'Afrobeats producers', 'Alpha open']) expect(rtl.screen.getByText(name)).toBeTruthy();
    expect(rtl.screen.queryByText(/^Private room/)).toBeNull();
    expect(sent.filter((request) => request.startsWith('GET /communities/suggested'))).toHaveLength(3);
  });

  it('does not read on when the Hub has no next page', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([suggestion('o1', 'Zeta open'), suggestion('o2', 'Mid open')])];
    await renderView();
    expect(await rtl.screen.findByText('Mid open')).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(sent.filter((request) => request.startsWith('GET /communities/suggested'))).toEqual([SUGGESTED]);
  });

  it('a person in no room, when every suggestion is private, sees the empty state and no row that does nothing', async () => {
    answers[MINE] = [paged([])];
    answers[SUGGESTED] = [paged([suggestion('p1', 'Private one', { kind: 'private' })])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-empty')).toBeTruthy();
    expect(rtl.screen.queryByText('Private one')).toBeNull();
    expect(rtl.screen.queryByText('Suggested')).toBeNull();
  });

  it('does not say there are no communities while the next page of suggestions, which may hold a room to join, is still on its way', async () => {
    answers[MINE] = [paged([])];
    answers[SUGGESTED] = [paged([suggestion('p1', 'Private one', { kind: 'private' })], 2)];
    answers[SUGGESTED_2] = ['hold'];
    await renderView();
    await rtl.waitFor(() => expect(sent).toContain(SUGGESTED_2));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(rtl.screen.queryByTestId('communities-empty')).toBeNull();
    expect(rtl.screen.getByTestId('communities-loading-more')).toBeTruthy();
  });

  it('a user who is in no room sees where rooms will be, and the rooms they could join', async () => {
    answers[MINE] = [paged([])];
    answers[SUGGESTED] = [paged([suggestion('r3', 'Afrobeats producers')])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-none')).toBeTruthy();
    expect(rtl.screen.getByText('You have not joined a community yet.')).toBeTruthy();
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
  });

  it('a user with no rooms and none to join sees an empty state', async () => {
    answers[MINE] = [paged([])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-empty')).toBeTruthy();
    expect(rtl.screen.getByText('No communities yet')).toBeTruthy();
  });

  it('shows a loading list while the rooms are on their way', async () => {
    answers[MINE] = ['hold'];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Loading communities')).toBeTruthy();
    expect(rtl.screen.queryByTestId('communities-empty')).toBeNull();
  });

  it('shows the server\'s sentence when the rooms cannot be read, and a retry reads them', async () => {
    const sentence = 'Something went wrong. Please try again.';
    answers[MINE] = [refuse(500, sentence), refuse(500, sentence), refuse(500, sentence), paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText(sentence)).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Lagos Freelancers')).toBeTruthy();
  }, 20_000);

  it('says it is offline when the network is cut', async () => {
    answers[MINE] = ['offline', 'offline', 'offline'];
    await renderView();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.', {}, { timeout: 8000 })).toBeTruthy();
  }, 20_000);

  it('keeps the person\'s rooms and says suggestions failed when only the suggestions fail', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), paged([suggestion('r3', 'Afrobeats producers')])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-suggested-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Lagos Freelancers')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
  }, 20_000);

  it('reads more rooms at the end of the list, the person\'s own first and suggestions only after them', async () => {
    answers[MINE] = [paged([mine('r0', 'Room 0'), mine('r1', 'Room 1')], 2)];
    answers['GET /communities/mine?page=2&perPage=20'] = [paged([mine('r2', 'Room 2')])];
    answers[SUGGESTED] = [paged([suggestion('s1', 'Afrobeats producers')])];
    await renderView();
    await rtl.screen.findByText('Room 0');
    // Nothing is suggested while some of the person's own rooms are still to come.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sent.some((request) => request.startsWith('GET /communities?'))).toBe(false);
    await rtl.fireEvent(rtl.screen.getByTestId('communities-list'), 'endReached');
    expect(await rtl.screen.findByText('Room 2')).toBeTruthy();
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
    expect(sent.indexOf('GET /communities/mine?page=2&perPage=20')).toBeLessThan(sent.indexOf(SUGGESTED));
  });

  it('a next page of suggestions the Hub refuses is asked for once, then the list says so and its Try again asks again', async () => {
    const open = (from: number) => Array.from({ length: 4 }, (_, i) => suggestion(`o${from + i}`, `Open room ${from + i}`));
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged(open(1), 2)];
    answers[SUGGESTED_2] = [refuse(400, 'Bad request'), paged(open(5))];
    await renderView();
    expect(await rtl.screen.findByText('Couldn’t load more communities.')).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(sent.filter((request) => request === SUGGESTED_2)).toHaveLength(1);
    expect(rtl.screen.queryByText('Open room 5')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Open room 5')).toBeTruthy();
    expect(sent.filter((request) => request === SUGGESTED_2)).toHaveLength(2);
  });

  it('draws only a window of a very long list of rooms', async () => {
    answers[MINE] = [paged(Array.from({ length: 800 }, (_, i) => mine(`r${i}`, `Room ${i}`)))];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    await rtl.screen.findByText('Room 0');
    expect(rtl.screen.queryAllByLabelText(/^Room \d+/).length).toBeLessThan(80);
  });

  it('a very long room name stays on one line', async () => {
    const name = 'The Very Long Named Community Of Lagos Based Freelancers And Friends';
    answers[MINE] = [paged([mine('r1', name)])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    const title = await rtl.screen.findByText(name);
    expect(title.props.numberOfLines).toBe(1);
  });
});

describe('Suggested reads on until it lists enough open rooms (defect 22)', () => {
  const { useSuggestedCommunities, SUGGESTED_READ_ON_ROOMS, SUGGESTED_READ_ON_PAGES } = require('../useCommunities') as typeof import('../useCommunities');
  const suggestedRequests = () => sent.filter((request) => request.startsWith('GET /communities/suggested'));
  const pageUrl = (n: number) => `GET /communities/suggested?page=${n}&perPage=20`;
  const settle = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

  it('reads on while fewer than eight open rooms are listed and the Hub has a next page, and stops at eight', async () => {
    const open = (from: number) => Array.from({ length: 4 }, (_, i) => suggestion(`o${from + i}`, `Open room ${from + i}`));
    answers[pageUrl(1)] = [paged(open(1), 2)];
    answers[pageUrl(2)] = [paged(open(5), 3)];
    answers[pageUrl(3)] = [paged(open(9))];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await rtl.waitFor(() => expect(hook.result.current.items).toHaveLength(SUGGESTED_READ_ON_ROOMS));
    await settle();
    // Eight open rooms are listed: the phone does not read the third page by itself.
    expect(suggestedRequests()).toEqual([pageUrl(1), pageUrl(2)]);
    expect(hook.result.current.items.map((room) => room.name)).toEqual(Array.from({ length: 8 }, (_, i) => `Open room ${i + 1}`));
    // The list reaching its end is the normal paging, and it still asks for the next page.
    await rtl.act(async () => {
      await hook.result.current.fetchNextPage();
    });
    await rtl.waitFor(() => expect(hook.result.current.items).toHaveLength(12));
    expect(suggestedRequests()).toEqual([pageUrl(1), pageUrl(2), pageUrl(3)]);
  });

  it('reads on by itself for at most five pages in a pass, and the end of the list carries on after that', async () => {
    const page = (n: number) => paged([suggestion(`o${n}`, `Open room ${n}`)], n < 7 ? n + 1 : null);
    for (let n = 1; n <= 7; n += 1) answers[pageUrl(n)] = [page(n)];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await rtl.waitFor(() => expect(hook.result.current.items).toHaveLength(SUGGESTED_READ_ON_PAGES));
    await settle(250);
    expect(suggestedRequests()).toHaveLength(SUGGESTED_READ_ON_PAGES);
    expect(hook.result.current.hasNextPage).toBe(true);
    await rtl.act(async () => {
      await hook.result.current.fetchNextPage();
    });
    await rtl.waitFor(() => expect(hook.result.current.items).toHaveLength(SUGGESTED_READ_ON_PAGES + 1));
    await settle();
    // The sixth page was asked for by the end of the list, and the phone does not go on by itself from there.
    expect(suggestedRequests()).toHaveLength(SUGGESTED_READ_ON_PAGES + 1);
  });

  it('reads on past pages of private rooms, which count as pages read', async () => {
    const privatePage = (n: number) => paged([suggestion(`p${n}`, `Private ${n}`, { kind: 'private' })], n + 1);
    for (let n = 1; n <= 4; n += 1) answers[pageUrl(n)] = [privatePage(n)];
    answers[pageUrl(5)] = [paged([suggestion('o5', 'Open room 5')], 6)];
    answers[pageUrl(6)] = [paged([suggestion('o6', 'Open room 6')])];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await rtl.waitFor(() => expect(hook.result.current.items.map((room) => room.name)).toEqual(['Open room 5']));
    await settle(250);
    // Five pages in the pass, the last one the first with a room to join; the sixth is for the end of the list.
    expect(suggestedRequests()).toHaveLength(5);
  });

  it('does not start before it is enabled', async () => {
    answers[pageUrl(1)] = [paged([suggestion('o1', 'Open room 1')])];
    await rtl.renderHook(() => useSuggestedCommunities(false));
    await settle();
    expect(suggestedRequests()).toEqual([]);
  });

  // INBOX-05 note 37. The read-on stops at an error: a page the Hub refuses is asked for once, and asking again is the list's Try again.
  it('asks once for a next page the Hub refuses, and asks again only when the list\'s Try again does', async () => {
    const open = (from: number) => Array.from({ length: 4 }, (_, i) => suggestion(`o${from + i}`, `Open room ${from + i}`));
    answers[pageUrl(1)] = [paged(open(1), 2)];
    // The second answer is there to be read if the phone asked a second time by itself.
    answers[pageUrl(2)] = [refuse(400, 'Bad request'), paged(open(5))];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await rtl.waitFor(() => expect({ failed: hook.result.current.isFetchNextPageError, inFlight: queryClient.isFetching() }).toEqual({ failed: true, inFlight: 0 }));
    await settle(250);
    expect(suggestedRequests()).toEqual([pageUrl(1), pageUrl(2)]);
    expect(hook.result.current.items.map((room) => room.name)).toEqual(['Open room 1', 'Open room 2', 'Open room 3', 'Open room 4']);
    await rtl.act(async () => {
      await hook.result.current.fetchNextPage();
    });
    await rtl.waitFor(() => expect(hook.result.current.items).toHaveLength(SUGGESTED_READ_ON_ROOMS));
    expect(suggestedRequests()).toEqual([pageUrl(1), pageUrl(2), pageUrl(2)]);
  });
});

describe('Suggested reads on when a refresh or a Join lands during it (defect 30)', () => {
  const { useSuggestedCommunities, SUGGESTED_READ_ON_ROOMS } = require('../useCommunities') as typeof import('../useCommunities');
  const { suggestedKey } = require('../api') as typeof import('../api');
  const suggestedRequests = () => sent.filter((request) => request.startsWith('GET /communities/suggested'));
  const pageUrl = (n: number) => `GET /communities/suggested?page=${n}&perPage=20`;
  const settle = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
  /** What a Join, a live event or a pull to refresh does to the list: every page held is read again. */
  const refresh = () => void queryClient.invalidateQueries({ queryKey: suggestedKey });
  /** Five pages of two open rooms each: the read-on stops at eight rooms, after the fourth. */
  const roomsOf = (n: number) => [suggestion(`o${2 * n - 1}`, `Open room ${2 * n - 1}`), suggestion(`o${2 * n}`, `Open room ${2 * n}`)];
  const page = (n: number): Answer => paged(roomsOf(n), n < 5 ? n + 1 : null);
  const withSend = (answer: Answer, onSend: () => void): Answer => ({ ...(answer as object), onSend }) as Answer;
  const withDelay = (answer: Answer, delay: number): Answer => ({ ...(answer as object), delay }) as Answer;
  /** A read the Hub refuses (a 400): the app does not retry it, so it ends at once. */
  const refused = (): Answer => refuse(400, 'Bad request');
  const names = (rooms: readonly { name: string }[]) => rooms.map((room) => room.name);
  const EIGHT = Array.from({ length: SUGGESTED_READ_ON_ROOMS }, (_, i) => `Open room ${i + 1}`);

  /** Waits for the read-on to end on eight rooms, then checks it stopped: nothing in flight and nothing more asked. */
  async function expectEight(hook: Awaited<ReturnType<typeof rtl.renderHook<ReturnType<typeof useSuggestedCommunities>, unknown>>>) {
    await rtl.waitFor(() => expect({ rooms: names(hook.result.current.items), inFlight: queryClient.isFetching() }).toEqual({ rooms: EIGHT, inFlight: 0 }), { timeout: 4000 });
    const asked = sent.length;
    await settle();
    expect(sent).toHaveLength(asked);
  }

  // The refresh lands at the moment the named page is asked for, before any render has drawn that the page is being read: it cancels that
  // read and refetches the pages held, and the refetch ends with the same pages and the same flags as before it began. The page is answered
  // when it is asked again.
  it.each([2, 3, 4])('reaches eight rooms, not the ones held, when a refresh lands as page %i is asked for', async (asked) => {
    for (let n = 1; n <= 5; n += 1) answers[pageUrl(n)] = n === asked ? [withSend(page(n), refresh), page(n)] : [page(n)];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await expectEight(hook);
    expect(suggestedRequests().filter((request) => request === pageUrl(asked)).length).toBeGreaterThanOrEqual(2);
  }, 10_000);

  // The same, with pages that take time, so the refresh lands at each of these moments (ms after the list opens, then ms a page takes).
  it.each([
    [0, 30],
    [10, 30],
    [30, 30],
    [40, 30],
    [60, 30],
    [100, 30],
    [20, 100],
    [50, 100],
    [120, 100],
    [200, 100],
  ] as const)('reaches eight rooms: refresh at %i ms, pages of %i ms', async (refreshAt, pageMs) => {
    for (let n = 1; n <= 5; n += 1) answers[pageUrl(n)] = [withDelay(page(n), pageMs)];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await new Promise((resolve) => setTimeout(resolve, refreshAt));
    await rtl.act(async () => {
      refresh();
    });
    await expectEight(hook);
  }, 10_000);

  // The same refresh, but the refetch it starts is REFUSED. A failed read moves `errorUpdatedAt`, not `dataUpdatedAt`, and a refusal that comes
  // in the same instant as the ask is never drawn as under way, so the read-on has to hear it end by `errorUpdatedAt`.
  describe('and the refetch it starts is refused', () => {
    it('reaches eight rooms when the refetch of the first page is refused', async () => {
      answers[pageUrl(1)] = [page(1), refused(), page(1)];
      answers[pageUrl(2)] = [withSend(page(2), refresh), page(2)];
      for (let n = 3; n <= 5; n += 1) answers[pageUrl(n)] = [page(n)];
      const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
      await expectEight(hook);
      expect(suggestedRequests().filter((request) => request === pageUrl(2)).length).toBeGreaterThanOrEqual(2);
    }, 10_000);

    it('reaches eight rooms when two pages are held and the refetch of the second is refused', async () => {
      answers[pageUrl(1)] = [page(1)];
      answers[pageUrl(2)] = [page(2), refused(), page(2)];
      answers[pageUrl(3)] = [withSend(page(3), refresh), page(3)];
      for (let n = 4; n <= 5; n += 1) answers[pageUrl(n)] = [page(n)];
      const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
      await expectEight(hook);
      expect(suggestedRequests().filter((request) => request === pageUrl(3)).length).toBeGreaterThanOrEqual(2);
    }, 10_000);

    it('stops at the error, without a loop, when the refetch and the page being read are both refused, and goes on when the page is asked for again', async () => {
      answers[pageUrl(1)] = [page(1), refused(), page(1)];
      answers[pageUrl(2)] = [withSend(page(2), refresh), refused()];
      for (let n = 3; n <= 5; n += 1) answers[pageUrl(n)] = [page(n)];
      const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
      await rtl.waitFor(() => expect({ failed: hook.result.current.isFetchNextPageError, inFlight: queryClient.isFetching() }).toEqual({ failed: true, inFlight: 0 }), { timeout: 4000 });
      const asked = sent.length;
      await settle();
      expect(sent).toHaveLength(asked);
      expect(names(hook.result.current.items)).toEqual(['Open room 1', 'Open room 2']);
      answers[pageUrl(2)] = [page(2)];
      await rtl.act(async () => {
        await hook.result.current.fetchNextPage();
      });
      await expectEight(hook);
    }, 10_000);
  });

  // A read that is cancelled from outside ends with no page and no error, so neither `dataUpdatedAt` nor `errorUpdatedAt` moves: only the end
  // of the read itself (`isFetching`) tells the read-on to ask again.
  it('asks for the next page again when the read of it is cancelled from outside', async () => {
    for (let n = 1; n <= 5; n += 1) answers[pageUrl(n)] = n === 2 ? [withDelay(page(2), 1000), page(2)] : [page(n)];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    await rtl.waitFor(() => expect(hook.result.current.isFetchingNextPage).toBe(true));
    await rtl.act(async () => {
      await queryClient.cancelQueries({ queryKey: suggestedKey });
    });
    await expectEight(hook);
    expect(suggestedRequests().filter((request) => request === pageUrl(2))).toHaveLength(2);
  }, 10_000);

  // The rooms the Hub lists change under the reader: A is joined (it leaves the list), so every room moves up one place. Page 1 is read again
  // after the join; if the read-on's own request for the next page cancels that, the phone holds page 1 as it was before the join and the
  // later pages as they are after it: A is listed still, and C, which moved onto page 1, is lost.
  it('holds the list as the Hub now has it when a Join lands while the next page is on its way: B C D, not A B D', async () => {
    const [A, B, C, D] = ['A', 'B', 'C', 'D'].map((id) => suggestion(`o${id}`, `Open room ${id}`));
    answers[pageUrl(1)] = [paged([A, B], 2), withDelay(paged([B, C], 2), 250)];
    answers[pageUrl(2)] = [withDelay(paged([C, D]), 1000), paged([D])];
    const hook = await rtl.renderHook(() => useSuggestedCommunities(true));
    // The screen has drawn page 2 as being read (a slow network) when the Join lands.
    await rtl.waitFor(() => expect(hook.result.current.isFetchingNextPage).toBe(true));
    await rtl.act(async () => {
      refresh();
    });
    await rtl.waitFor(() => expect({ rooms: names(hook.result.current.items), inFlight: queryClient.isFetching() }).toEqual({ rooms: ['Open room B', 'Open room C', 'Open room D'], inFlight: 0 }), { timeout: 4000 });
    const asked = sent.length;
    await settle();
    expect(sent).toHaveLength(asked);
  }, 10_000);

  it('on the screen, tapping Join on a suggestion while the next page is held leaves the rest of Suggested as the Hub now lists it', async () => {
    const [A, B, C, D] = ['A', 'B', 'C', 'D'].map((id) => suggestion(`o${id}`, `Open room ${id}`));
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')]), paged([mine('r1', 'Lagos Freelancers'), mine('oA', 'Open room A')])];
    answers[pageUrl(1)] = [paged([A, B], 2), withDelay(paged([B, C], 2), 150)];
    answers[pageUrl(2)] = [withDelay(paged([C, D]), 1500), paged([D])];
    answers['POST /communities/oA/join'] = [ok({ id: 'mem', userWawuId: ME, status: 'joined', requestedAt: '2026-10-07T10:00:00Z', communityId: 'oA', joinedAt: '2026-10-07T10:00:00Z' })];
    await renderView();
    const join = await rtl.screen.findByLabelText(/^Join Open room A/);
    // Page 2 is asked for by the read-on and held; the person taps Join meanwhile.
    await rtl.waitFor(() => expect(sent).toContain(pageUrl(2)));
    await rtl.fireEvent.press(join);
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'oA' } }));
    await rtl.waitFor(() => expect(rtl.screen.queryByLabelText(/^Join Open room D/)).toBeTruthy(), { timeout: 4000 });
    await settle(300);
    for (const name of ['Open room B', 'Open room C', 'Open room D']) expect(rtl.screen.getByLabelText(new RegExp(`^Join ${name}`))).toBeTruthy();
    expect(rtl.screen.queryByLabelText(/^Join Open room A/)).toBeNull();
  }, 15_000);
});

describe('the balance recovers (verifier defect)', () => {
  const boom = refuse(500, 'Something went wrong.');
  const wrap = (node: React.ReactElement) => (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{node}</SafeAreaProvider>
  );

  it('a balance that failed is read again when the person comes back to the view', async () => {
    answers['GET /credits'] = [boom, boom, boom, ok({ userWawuId: ME, creditBalance: 48, trialEndsAt: null })];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    const view = await renderView();
    expect(await rtl.screen.findByText('Your balance could not be read', {}, { timeout: 8000 })).toBeTruthy();
    mockFocused = false;
    await view.rerender(wrap(<CommunitiesView />));
    mockFocused = true;
    await view.rerender(wrap(<CommunitiesView />));
    expect(await rtl.screen.findByText('48 WAWU Credits')).toBeTruthy();
  }, 20_000);

  it('a balance that failed is read again when the list\'s Try again succeeds', async () => {
    answers['GET /credits'] = [boom, boom, boom, ok({ userWawuId: ME, creditBalance: 48, trialEndsAt: null })];
    answers[MINE] = [boom, boom, boom, paged([mine('r1', 'Lagos Freelancers')])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    await rtl.screen.findByTestId('communities-error', {}, { timeout: 8000 });
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Lagos Freelancers')).toBeTruthy();
    expect(await rtl.screen.findByText('48 WAWU Credits')).toBeTruthy();
  }, 20_000);
});

describe('the person\'s own name recovers (verifier defect 16)', () => {
  const boom = refuse(500, 'Something went wrong.');
  const own = { id: 'x', text: 'on my way', imageUrl: null, sentAt: new Date().toISOString(), senderWawuId: ME, sender: sender(ME, 'Ada Obi') };
  const profile = ok({ wawuUserId: ME, firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null, verification });

  it('after the Hub was unreachable at first open, Try again shows the person\'s own last message as "You:", not their first name', async () => {
    answers['GET /users/me'] = ['offline', 'offline', 'offline', profile];
    answers[MINE] = ['offline', 'offline', 'offline', paged([mine('r1', 'Mine', { lastMessage: own })])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    await rtl.screen.findByTestId('communities-error', {}, { timeout: 8000 });
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('You: on my way')).toBeTruthy();
    expect(rtl.screen.queryByText('Ada: on my way')).toBeNull();
  }, 20_000);

  it('a profile that failed while the list loaded is read again when the person pulls to refresh, and not when it was fine', async () => {
    answers['GET /users/me'] = [boom, boom, boom, profile];
    answers[MINE] = [paged([mine('r1', 'Mine', { lastMessage: own })])];
    answers[SUGGESTED] = [paged([])];
    await renderView();
    // The profile fails for real (500, retried twice, still 500) while the list loads: until it is known the row names the person by first name.
    await rtl.waitFor(() => expect(sent.filter((request) => request === 'GET /users/me')).toHaveLength(3), { timeout: 8000 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(await rtl.screen.findByText('Ada: on my way')).toBeTruthy();
    await rtl.act(async () => {
      const list = rtl.screen.getByTestId('communities-list');
      await list.props.refreshControl.props.onRefresh();
    });
    expect(await rtl.screen.findByText('You: on my way')).toBeTruthy();
    expect(sent.filter((request) => request === 'GET /users/me')).toHaveLength(4);
    // Now it is known: another pull does not ask for it again.
    await rtl.act(async () => {
      await rtl.screen.getByTestId('communities-list').props.refreshControl.props.onRefresh();
    });
    expect(sent.filter((request) => request === 'GET /users/me')).toHaveLength(4);
  }, 20_000);
});
