/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
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
const ALL = 'GET /communities?page=1&perPage=20';

beforeEach(() => {
  sent = [];
  mockPush.mockClear();
  queryClient.clear();
  answers = {
    'GET /credits': [ok({ userWawuId: ME, creditBalance: 48, trialEndsAt: null })],
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
    answers[ALL] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('48 WAWU Credits')).toBeTruthy();
    expect(rtl.screen.getByText('Reading is free')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦|naira/i)).toBeNull();
  });

  it('shows the balance the server holds, and "1 WAWU Credit" for one', async () => {
    answers['GET /credits'] = [ok({ userWawuId: ME, creditBalance: 1, trialEndsAt: null })];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[ALL] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('1 WAWU Credit')).toBeTruthy();
  });

  it('says so when the balance cannot be read, and does not invent one', async () => {
    answers['GET /credits'] = [refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.')];
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[ALL] = [paged([])];
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
    answers[ALL] = [paged([])];
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
    answers[ALL] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('You: on my way')).toBeTruthy();
    expect(rtl.screen.getByText('Tolu: Photo')).toBeTruthy();
    expect(rtl.screen.getByText('No messages yet')).toBeTruthy();
  });

  it('shows how many messages are unread in a room, and nothing for a room with none', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers', { unreadCount: 3 }), mine('r2', 'Pricing clinic', { unreadCount: 0 })])];
    answers[ALL] = [paged([])];
    await renderView();
    expect(await rtl.screen.findByText('3')).toBeTruthy();
    expect(rtl.screen.getByLabelText(/Lagos Freelancers.*3 unread/)).toBeTruthy();
    expect(rtl.screen.getByLabelText(/^Pricing clinic, /).props.accessibilityLabel).not.toMatch(/unread/);
  });

  it('a user can open a room they are in', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[ALL] = [paged([])];
    await renderView();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText(/^Lagos Freelancers/));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r1' } });
  });

  it('offers rooms they are not in, with the member count and whether they are open, and not the ones they are in', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[ALL] = [
      paged([
        suggestion('r1', 'Lagos Freelancers'),
        suggestion('r3', 'Afrobeats producers', { memberCount: 2100 }),
        suggestion('r4', 'Founders under 30', { kind: 'private', memberCount: 640 }),
      ]),
    ];
    await renderView();
    expect(await rtl.screen.findByText('Suggested')).toBeTruthy();
    expect(rtl.screen.getByText('2.1K members · open')).toBeTruthy();
    expect(rtl.screen.getByText('640 members · private')).toBeTruthy();
    expect(rtl.screen.getAllByText('Lagos Freelancers')).toHaveLength(1);
    expect(rtl.screen.getAllByText('Join')).toHaveLength(1);
  });

  it('a user can Join an open room: the server joins them, and the room opens', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')]), paged([mine('r1', 'Lagos Freelancers'), mine('r3', 'Afrobeats producers')])];
    answers[ALL] = [paged([suggestion('r3', 'Afrobeats producers')]), paged([])];
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
    answers[ALL] = [paged([suggestion('r3', 'Afrobeats producers')])];
    answers['POST /communities/r3/join'] = [refuse(500, 'Something went wrong.'), ok({ id: 'mem', userWawuId: ME, status: 'joined', requestedAt: '2026-10-07T10:00:00Z', communityId: 'r3', joinedAt: '2026-10-07T10:00:00Z' })];
    await renderView();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText(/^Join Afrobeats producers/));
    expect(await rtl.screen.findByText('Try again')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByLabelText(/^Join Afrobeats producers/));
    await rtl.waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  });

  it('draws a private room with its lock and no way in: asking is another task\'s', async () => {
    answers[MINE] = [paged([mine('r1', 'Lagos Freelancers')])];
    answers[ALL] = [paged([suggestion('r4', 'Founders under 30', { kind: 'private', memberCount: 640 })])];
    await renderView();
    const row = await rtl.screen.findByLabelText(/^Founders under 30, private/);
    expect(row.props.accessibilityRole).not.toBe('button');
    expect(rtl.screen.queryByText('Ask')).toBeNull();
    expect(rtl.screen.queryByText('Buy')).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: /Founders under 30/ })).toBeNull();
  });

  it('a user who is in no room sees where rooms will be, and the rooms they could join', async () => {
    answers[MINE] = [paged([])];
    answers[ALL] = [paged([suggestion('r3', 'Afrobeats producers')])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-none')).toBeTruthy();
    expect(rtl.screen.getByText('You have not joined a community yet.')).toBeTruthy();
    expect(rtl.screen.getByText('Afrobeats producers')).toBeTruthy();
  });

  it('a user with no rooms and none to join sees an empty state', async () => {
    answers[MINE] = [paged([])];
    answers[ALL] = [paged([])];
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
    answers[ALL] = [paged([])];
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
    answers[ALL] = [refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), paged([suggestion('r3', 'Afrobeats producers')])];
    await renderView();
    expect(await rtl.screen.findByTestId('communities-suggested-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Lagos Freelancers')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
  }, 20_000);

  it('reads more rooms at the end of the list, the person\'s own first and suggestions only after them', async () => {
    answers[MINE] = [paged([mine('r0', 'Room 0'), mine('r1', 'Room 1')], 2)];
    answers['GET /communities/mine?page=2&perPage=20'] = [paged([mine('r2', 'Room 2')])];
    answers[ALL] = [paged([suggestion('s1', 'Afrobeats producers')])];
    await renderView();
    await rtl.screen.findByText('Room 0');
    // Nothing is suggested while some of the person's own rooms are still to come.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sent.some((request) => request.startsWith('GET /communities?'))).toBe(false);
    await rtl.fireEvent(rtl.screen.getByTestId('communities-list'), 'endReached');
    expect(await rtl.screen.findByText('Room 2')).toBeTruthy();
    expect(await rtl.screen.findByText('Afrobeats producers')).toBeTruthy();
    expect(sent.indexOf('GET /communities/mine?page=2&perPage=20')).toBeLessThan(sent.indexOf(ALL));
  });

  it('draws only a window of a very long list of rooms', async () => {
    answers[MINE] = [paged(Array.from({ length: 800 }, (_, i) => mine(`r${i}`, `Room ${i}`)))];
    answers[ALL] = [paged([])];
    await renderView();
    await rtl.screen.findByText('Room 0');
    expect(rtl.screen.queryAllByLabelText(/^Room \d+/).length).toBeLessThan(80);
  });

  it('a very long room name stays on one line', async () => {
    const name = 'The Very Long Named Community Of Lagos Based Freelancers And Friends';
    answers[MINE] = [paged([mine('r1', name)])];
    answers[ALL] = [paged([])];
    await renderView();
    const title = await rtl.screen.findByText(name);
    expect(title.props.numberOfLines).toBe(1);
  });
});
