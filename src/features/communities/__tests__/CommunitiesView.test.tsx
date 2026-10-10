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

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
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
