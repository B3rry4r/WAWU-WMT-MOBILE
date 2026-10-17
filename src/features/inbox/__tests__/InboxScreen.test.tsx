/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { InboxItem } from '../api';
import type { InboxRowRenderers } from '../rows';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** `delay`: the answer comes this many ms late. `onSend`: runs at the moment the request reaches the network, before anything answers it. */
type Answer = { status: number; body: unknown; delay?: number; onSend?: () => void } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const pageOf = (items: unknown[], nextCursor: string | null = null) => ok({ items, nextCursor });
/** A read the Hub refuses (a 400): the app does not retry it, so it ends at once. */
const refused = (over: { delay?: number } = {}): Answer => ({ status: 400, body: { statusCode: 400, message: 'Bad request' }, ...over });

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
const { InboxScreen } = require('../InboxScreen') as typeof import('../InboxScreen');

const person = { wawuId: 'u2', name: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } };

function row(id: string, over: Partial<InboxItem> = {}): InboxItem {
  return {
    id,
    kind: 'chat',
    lastActivityAt: '2026-10-07T10:00:00Z',
    unreadCount: 0,
    preview: { text: `Words of ${id}`, attachment: null, mine: false, senderName: null, sentAt: '2026-10-07T10:00:00Z', moneyRequest: null },
    chat: { chatId: id, other: person, canMessage: true },
    paidDm: null,
    community: null,
    moneyRequest: null,
    ...over,
  };
}

/** A stand-in row drawn only so these tests can see order, paging and refresh; the real rows belong to the tasks that build them. */
const testRows: InboxRowRenderers = {
  chat: (item) => (
    <View testID={`row-${item.id}`}>
      <Text>{item.preview?.text}</Text>
    </View>
  ),
};

const FIRST = 'GET /inbox?limit=20';
const unreadAnswer = [ok({ total: 0, chats: 0, paidDms: 0, communities: 0 })];

async function renderScreen(renderers?: InboxRowRenderers) {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <InboxScreen renderers={renderers} />
    </SafeAreaProvider>,
  );
}

/** Long enough for a request that should not be sent to have been sent. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));
const ids = () => rtl.screen.queryAllByTestId(/^row-/).map((node) => node.props.testID);

afterEach(async () => {
  // A request still being retried must not reach the next test.
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  rtl.cleanup();
  // Empties the cache and the timers it holds, so the test process can exit.
  queryClient.clear();
});

beforeEach(() => {
  answers = { 'GET /inbox/unread': unreadAnswer };
  sent = [];
  mockPush.mockClear();
  queryClient.clear();
});

describe('the inbox screen', () => {
  it('a user sees the title and the All chip while the inbox loads, and a loading list under them', async () => {
    answers[FIRST] = ['hold'];
    await renderScreen(testRows);
    expect(rtl.screen.getByRole('header', { name: 'Inbox' })).toBeTruthy();
    expect(rtl.screen.getByRole('radio', { name: 'All' }).props.accessibilityState.checked).toBe(true);
    expect(await rtl.screen.findByTestId('inbox-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Loading your inbox')).toBeTruthy();
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
  });

  it('shows only the chips whose screens exist: All, Communities and Money (INBOX-20 built it)', async () => {
    answers[FIRST] = [pageOf([row('chat:1')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:1');
    expect(rtl.screen.getAllByRole('radio').map((chip) => chip.props.accessibilityLabel)).toEqual(['All', 'Communities', 'Money']);
  });

  it('a user with no messages sees "No messages yet" and the guidance', async () => {
    answers[FIRST] = [pageOf([])];
    await renderScreen(testRows);
    expect(await rtl.screen.findByText('No messages yet')).toBeTruthy();
    expect(rtl.screen.getByText('Message a creator from their profile, or join a community to talk with people like you.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('inbox-loading')).toBeNull();
    expect(rtl.screen.queryByTestId('inbox-error')).toBeNull();
  });

  it('a user sees their conversations in the order the server sent them', async () => {
    answers[FIRST] = [pageOf([row('chat:b'), row('chat:a'), row('chat:c')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:a');
    expect(ids()).toEqual(['row-chat:b', 'row-chat:a', 'row-chat:c']);
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
  });

  it('a user whose rows are all of a kind nobody has built yet sees the empty state, not a blank page (R-47)', async () => {
    answers[FIRST] = [pageOf([row('chat:1'), row('community:1', { kind: 'community', chat: null })])];
    await renderScreen({});
    await rtl.waitFor(() => expect(sent).toContain(FIRST));
    expect(await rtl.screen.findByTestId('inbox-empty')).toBeTruthy();
    expect(rtl.screen.getByText('No messages yet')).toBeTruthy();
    expect(rtl.screen.getByText('Message a creator from their profile, or join a community to talk with people like you.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('inbox-loading')).toBeNull();
    expect(rtl.screen.queryByTestId('inbox-error')).toBeNull();
    expect(ids()).toEqual([]);
  });

  it('draws the rows it can and nothing for the kinds it cannot, with no empty state', async () => {
    answers[FIRST] = [pageOf([row('community:1', { kind: 'community', chat: null }), row('chat:1')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:1');
    expect(ids()).toEqual(['row-chat:1']);
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
  });

  it('reads on past a page of rows it cannot draw to find ones it can, and shows no empty state on the way', async () => {
    const community = (id: string) => row(id, { kind: 'community', chat: null });
    answers[FIRST] = [pageOf([community('community:1'), community('community:2')], 'cur2')];
    answers['GET /inbox?limit=20&cursor=cur2'] = [pageOf([community('community:3')], 'cur3')];
    answers['GET /inbox?limit=20&cursor=cur3'] = [pageOf([row('chat:late')], null)];
    await renderScreen(testRows);
    expect(await rtl.screen.findByTestId('row-chat:late')).toBeTruthy();
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
    expect(sent.filter((s) => s.startsWith('GET /inbox?'))).toEqual([FIRST, 'GET /inbox?limit=20&cursor=cur2', 'GET /inbox?limit=20&cursor=cur3']);
  });

  it('shows the loading list, not the empty state, while it reads on past rows it cannot draw', async () => {
    answers[FIRST] = [pageOf([row('community:1', { kind: 'community', chat: null })], 'cur2')];
    answers['GET /inbox?limit=20&cursor=cur2'] = ['hold'];
    await renderScreen(testRows);
    await rtl.waitFor(() => expect(sent).toContain('GET /inbox?limit=20&cursor=cur2'));
    expect(await rtl.screen.findByTestId('inbox-loading')).toBeTruthy();
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
  });

  it('says the inbox is empty when every page held only rows it cannot draw', async () => {
    const community = (id: string) => row(id, { kind: 'community', chat: null });
    answers[FIRST] = [pageOf([community('community:1')], 'cur2')];
    answers['GET /inbox?limit=20&cursor=cur2'] = [pageOf([community('community:2')], null)];
    await renderScreen(testRows);
    expect(await rtl.screen.findByTestId('inbox-empty')).toBeTruthy();
    expect(ids()).toEqual([]);
    expect(sent.filter((s) => s.startsWith('GET /inbox?'))).toEqual([FIRST, 'GET /inbox?limit=20&cursor=cur2']);
  });

  it('shows an error with Try again, not the empty state, when reading on past undrawable rows fails', async () => {
    const community = (id: string) => row(id, { kind: 'community', chat: null });
    answers[FIRST] = [pageOf([community('community:1')], 'cur2')];
    answers['GET /inbox?limit=20&cursor=cur2'] = ['offline', 'offline', 'offline', pageOf([row('chat:late')])];
    await renderScreen(testRows);
    expect(await rtl.screen.findByTestId('inbox-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
    expect(rtl.screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(1);
    rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByTestId('row-chat:late')).toBeTruthy();
    expect(rtl.screen.queryByTestId('inbox-error')).toBeNull();
  }, 20_000);

  it('a user can retry when the network is cut, and then sees their inbox', async () => {
    answers[FIRST] = ['offline', 'offline', 'offline', pageOf([row('chat:1')])];
    await renderScreen(testRows);
    expect(await rtl.screen.findByTestId('inbox-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText("Couldn’t load your inbox")).toBeTruthy();
    expect(rtl.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
    rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByTestId('row-chat:1')).toBeTruthy();
    expect(rtl.screen.queryByTestId('inbox-error')).toBeNull();
  }, 20_000);

  it('shows the server\'s own sentence when the inbox answers 500', async () => {
    answers[FIRST] = [{ status: 500, body: { statusCode: 500, message: 'The inbox is unavailable.', data: null } }];
    await renderScreen(testRows);
    expect(await rtl.screen.findByTestId('inbox-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('The inbox is unavailable.')).toBeTruthy();
  }, 20_000);

  it('a user scrolling to the end gets the next page, sent with the cursor exactly as given, with no row twice', async () => {
    const cursor = 'MjAyNi0xMC0wN1QxMDowMDowMC4wMDBafGNoYXQ6Yg==';
    answers[FIRST] = [pageOf([row('chat:a'), row('chat:b')], cursor)];
    answers[`GET /inbox?limit=20&cursor=${encodeURIComponent(cursor)}`] = [pageOf([row('chat:b'), row('chat:c')], null)];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:a');
    rtl.fireEvent(rtl.screen.getByTestId('inbox-list'), 'endReached');
    await rtl.screen.findByTestId('row-chat:c');
    expect(ids()).toEqual(['row-chat:a', 'row-chat:b', 'row-chat:c']);
    expect(sent.filter((s) => s.startsWith('GET /inbox?'))).toEqual([FIRST, `GET /inbox?limit=20&cursor=${encodeURIComponent(cursor)}`]);
    rtl.fireEvent(rtl.screen.getByTestId('inbox-list'), 'endReached');
    await settle();
    expect(sent.filter((s) => s.startsWith('GET /inbox?'))).toHaveLength(2);
  });

  it('does not read pages ahead when none of the rows can be drawn', async () => {
    answers[FIRST] = [pageOf([row('community:1', { kind: 'community', chat: null })], 'next')];
    await renderScreen({});
    await rtl.waitFor(() => expect(sent).toContain(FIRST));
    rtl.fireEvent(await rtl.screen.findByTestId('inbox-list'), 'endReached');
    await settle();
    expect(sent.filter((s) => s.startsWith('GET /inbox?'))).toEqual([FIRST]);
  });

  it('a user who fails to load the next page sees the rows they have and a way to try that page again', async () => {
    answers[FIRST] = [pageOf([row('chat:a')], 'cur2')];
    answers['GET /inbox?limit=20&cursor=cur2'] = ['offline', 'offline', 'offline', pageOf([row('chat:z')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:a');
    rtl.fireEvent(rtl.screen.getByTestId('inbox-list'), 'endReached');
    expect(await rtl.screen.findByText("Couldn’t load more messages.", {}, { timeout: 8000 })).toBeTruthy();
    expect(ids()).toEqual(['row-chat:a']);
    rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByTestId('row-chat:z')).toBeTruthy();
  }, 20_000);

  it('a user pulling down reads the inbox again and sees what changed', async () => {
    answers[FIRST] = [pageOf([row('chat:a')]), pageOf([row('chat:new'), row('chat:a')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:a');
    const list = rtl.screen.getByTestId('inbox-list');
    await rtl.act(async () => {
      list.props.refreshControl.props.onRefresh();
    });
    await rtl.screen.findByTestId('row-chat:new');
    expect(ids()).toEqual(['row-chat:new', 'row-chat:a']);
  });

  it('a user sees a new message without refreshing when the inbox is marked stale by a live event', async () => {
    answers[FIRST] = [pageOf([row('chat:a')]), pageOf([row('chat:new', { unreadCount: 1 }), row('chat:a')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:a');
    const { inboxKey } = require('../api') as typeof import('../api');
    await rtl.act(async () => {
      await queryClient.invalidateQueries({ queryKey: inboxKey });
    });
    await rtl.screen.findByTestId('row-chat:new');
  });

  describe('communities in the inbox (INBOX-05)', () => {
    const community = (id: string, over: Partial<InboxItem> = {}): InboxItem =>
      row(`community:${id}`, {
        kind: 'community',
        chat: null,
        unreadCount: 2,
        preview: { text: 'who’s at the meetup Sat?', attachment: null, mine: false, senderName: 'Tolu Balogun', sentAt: '2026-10-07T10:00:00Z', moneyRequest: null },
        community: { communityId: id, name: 'Lagos Freelancers', imageUrl: null, kind: 'open', role: 'member' },
        ...over,
      });
    const noRooms: Answer = { status: 200, body: { statusCode: 200, message: 'OK', data: [], pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } } };

    it('a user sees a community in the list: its name, who spoke last, and what is unread', async () => {
      answers[FIRST] = [pageOf([community('r1')])];
      await renderScreen();
      const rowNode = await rtl.screen.findByTestId('row-community:r1');
      expect(rtl.screen.getByText('Lagos Freelancers')).toBeTruthy();
      expect(rtl.screen.getByText('Tolu: who’s at the meetup Sat?')).toBeTruthy();
      expect(rtl.screen.getByText('2')).toBeTruthy();
      expect(rowNode.props.accessibilityLabel).toMatch(/Lagos Freelancers.*2 unread/);
    });

    it('says "You:" when the last message in a room is the person\'s own, whether or not the Hub names them, and the speaker\'s first name when it is somebody else\'s (defect 31)', async () => {
      const said = (mine: boolean, senderName: string | null) => ({ text: 'Thanks for the pattern', attachment: null, mine, senderName, sentAt: '2026-10-07T10:00:00Z', moneyRequest: null });
      answers[FIRST] = [
        pageOf([
          community('own', { preview: said(true, 'Ada Obi'), community: { communityId: 'own', name: 'Own words, named', imageUrl: null, kind: 'open', role: 'member' } }),
          community('unnamed', { preview: said(true, null), community: { communityId: 'unnamed', name: 'Own words, unnamed', imageUrl: null, kind: 'open', role: 'member' } }),
          community('theirs', { preview: said(false, 'Tolu Balogun'), community: { communityId: 'theirs', name: 'Their words', imageUrl: null, kind: 'open', role: 'member' } }),
        ]),
      ];
      await renderScreen();
      await rtl.screen.findByTestId('row-community:own');
      // One line per row, in the order the Hub gave them.
      expect(rtl.screen.getAllByText(/: Thanks for the pattern$/).map((node) => node.props.children)).toEqual([
        'You: Thanks for the pattern',
        'You: Thanks for the pattern',
        'Tolu: Thanks for the pattern',
      ]);
      expect(rtl.screen.queryByText('Ada: Thanks for the pattern')).toBeNull();
    });

    it('a user can tap a community row and open its room', async () => {
      answers[FIRST] = [pageOf([community('r1')])];
      await renderScreen();
      await rtl.fireEvent.press(await rtl.screen.findByTestId('row-community:r1'));
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r1' } });
    });

    it('a user with chats and no community sees no chat row (another task draws them) and the same empty state as an empty inbox, never a blank page (FIX-30)', async () => {
      answers[FIRST] = [pageOf([row('chat:1'), row('chat:2')])];
      await renderScreen();
      await rtl.screen.findByRole('header', { name: 'Inbox' });
      expect(await rtl.screen.findByText('No messages yet')).toBeTruthy();
      expect(rtl.screen.queryAllByTestId(/^row-/)).toEqual([]);
      expect(rtl.screen.queryByTestId('inbox-error')).toBeNull();
      expect(rtl.screen.getAllByRole('radio')).toHaveLength(2);
      expect(rtl.screen.getByRole('button', { name: 'Browse communities' })).toBeTruthy();
    });

    it('keeps reading pages until a row it can draw appears, when the first pages hold only rows nobody draws yet', async () => {
      answers[FIRST] = [pageOf([row('chat:1')], 'cur2')];
      answers['GET /inbox?limit=20&cursor=cur2'] = [pageOf([row('chat:2')], 'cur3')];
      answers['GET /inbox?limit=20&cursor=cur3'] = [pageOf([community('r9')])];
      await renderScreen();
      expect(await rtl.screen.findByTestId('row-community:r9')).toBeTruthy();
      expect(sent.filter((s) => s.startsWith('GET /inbox?'))).toEqual([FIRST, 'GET /inbox?limit=20&cursor=cur2', 'GET /inbox?limit=20&cursor=cur3']);
    });

    it('reads the next page at the end of the list now that rows are drawn, with the cursor exactly as given', async () => {
      answers[FIRST] = [pageOf([community('r1')], 'next-cursor')];
      answers['GET /inbox?limit=20&cursor=next-cursor'] = [pageOf([community('r2'), community('r1')])];
      await renderScreen();
      await rtl.screen.findByTestId('row-community:r1');
      await rtl.fireEvent(rtl.screen.getByTestId('inbox-list'), 'endReached');
      await rtl.screen.findByTestId('row-community:r2');
      expect(ids()).toEqual(['row-community:r1', 'row-community:r2']);
    });

    it('the Communities chip opens the communities view, and All brings the inbox back', async () => {
      answers[FIRST] = [pageOf([community('r1')])];
      answers['GET /communities/mine?page=1&perPage=20'] = [noRooms];
      answers['GET /communities/suggested?page=1&perPage=20'] = [noRooms];
      answers['GET /credits'] = [ok({ userWawuId: 'me', creditBalance: 48, trialEndsAt: null })];
      answers['GET /users/me'] = [ok({ wawuUserId: 'me', firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null })];
      await renderScreen();
      await rtl.screen.findByTestId('row-community:r1');
      await rtl.fireEvent.press(rtl.screen.getByRole('radio', { name: 'Communities' }));
      expect(await rtl.screen.findByTestId('communities-view')).toBeTruthy();
      expect(await rtl.screen.findByText('48 WAWU Credits')).toBeTruthy();
      expect(rtl.screen.getByRole('radio', { name: 'Communities' }).props.accessibilityState.checked).toBe(true);
      expect(rtl.screen.queryByTestId('inbox-list')).toBeNull();
      await rtl.fireEvent.press(rtl.screen.getByRole('radio', { name: 'All' }));
      expect(await rtl.screen.findByTestId('row-community:r1')).toBeTruthy();
    });

    it('a user with an empty inbox can Browse communities, which opens the Communities chip', async () => {
      answers[FIRST] = [pageOf([])];
      answers['GET /communities/mine?page=1&perPage=20'] = [noRooms];
      answers['GET /communities/suggested?page=1&perPage=20'] = [noRooms];
      answers['GET /credits'] = [ok({ userWawuId: 'me', creditBalance: 0, trialEndsAt: null })];
      answers['GET /users/me'] = [ok({ wawuUserId: 'me', firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null })];
      await renderScreen();
      await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Browse communities' }));
      expect(await rtl.screen.findByTestId('communities-view')).toBeTruthy();
      expect(rtl.screen.getByRole('radio', { name: 'Communities' }).props.accessibilityState.checked).toBe(true);
    });

    it('the Browse communities button is not drawn while the inbox is loading, failed, or has rows', async () => {
      answers[FIRST] = ['hold'];
      await renderScreen();
      await rtl.screen.findByTestId('inbox-loading');
      expect(rtl.screen.queryByRole('button', { name: 'Browse communities' })).toBeNull();
    });
  });
});

/**
 * A refresh (`refreshInbox`: at start-up, on every live event, on every return to the tab) cancels the page
 * being read and refetches the pages held. Whenever it lands during the read-on, the screen must go on to
 * the end of the pages and stop there, on a drawn row or the empty state, never on the loading list with
 * no request in flight (the FIX-30 verifier's stall).
 */
describe('the inbox read-on when a refresh lands during it', () => {
  const community = (id: string) => row(id, { kind: 'community', chat: null });
  const CUR2 = 'GET /inbox?limit=20&cursor=cur2';
  const CUR3 = 'GET /inbox?limit=20&cursor=cur3';
  /** What the person is looking at. */
  const screenState = () => {
    if (rtl.screen.queryByTestId('inbox-error')) return 'error';
    if (rtl.screen.queryByTestId('inbox-loading')) return 'loading';
    if (rtl.screen.queryByTestId('inbox-empty')) return 'empty';
    return ids().length > 0 ? 'rows' : 'blank';
  };
  /** Waits for the read-on to end, then checks it stopped: on the state expected, with nothing in flight and nothing more asked. */
  async function expectReadOnEnds(state: 'empty' | 'rows') {
    await rtl.waitFor(() => expect({ state: screenState(), requestsInFlight: queryClient.isFetching() }).toEqual({ state, requestsInFlight: 0 }), { timeout: 4000 });
    const asked = sent.length;
    await settle();
    expect(sent).toHaveLength(asked);
  }
  const endings = [
    { name: 'the empty state', last: () => community('community:3'), state: 'empty' },
    { name: 'a drawn row', last: () => row('chat:late'), state: 'rows' },
  ] as const;

  // The refresh lands at the moment the named page is asked for, before the screen has drawn that the page is being read: the
  // refresh then cancels that read and refetches the pages held, which is what the stall needs. The page is answered when it is asked again.
  for (const ending of endings) {
    it.each([
      ['second', CUR2],
      ['third', CUR3],
    ] as const)(`ends on ${ending.name}, not the loading list, when the refresh lands as the %s page is asked for`, async (_page, asked) => {
      const { inboxKey } = require('../api') as typeof import('../api');
      const refresh = () => void queryClient.invalidateQueries({ queryKey: inboxKey, predicate: (query) => query.queryKey[1] !== 'unread' });
      const page = { [CUR2]: pageOf([community('community:2')], 'cur3'), [CUR3]: pageOf([ending.last()], null) };
      const answerAt = (url: typeof CUR2 | typeof CUR3): Answer[] => (url === asked ? [{ ...(page[url] as object), onSend: refresh } as Answer, page[url]] : [page[url]]);
      answers[FIRST] = [pageOf([community('community:1')], 'cur2')];
      answers[CUR2] = answerAt(CUR2);
      answers[CUR3] = answerAt(CUR3);
      await renderScreen(testRows);
      await expectReadOnEnds(ending.state);
      // The page was asked again after the refresh cancelled the first ask.
      expect(sent.filter((s) => s === asked).length).toBeGreaterThanOrEqual(2);
    }, 10_000);
  }

  // The same, with pages that take time, so the refresh lands at each of these moments (ms after the screen opens, then ms a page takes).
  // It invalidates as `refreshInbox` does once the count has arrived.
  it.each([
    [0, 30],
    [10, 30],
    [30, 30],
    [60, 30],
    [100, 30],
    [20, 100],
    [50, 100],
    [120, 100],
    [200, 100],
  ] as const)('ends on the empty state, not the loading list: refresh at %i ms, pages of %i ms', async (refreshAt, pageMs) => {
    const after = (answer: Answer): Answer => ({ ...(answer as object), delay: pageMs }) as Answer;
    answers[FIRST] = [after(pageOf([community('community:1')], 'cur2'))];
    answers[CUR2] = [after(pageOf([community('community:2')], 'cur3'))];
    answers[CUR3] = [after(pageOf([community('community:3')], null))];
    await renderScreen(testRows);
    await new Promise((resolve) => setTimeout(resolve, refreshAt));
    const { inboxKey } = require('../api') as typeof import('../api');
    await rtl.act(async () => {
      void queryClient.invalidateQueries({ queryKey: inboxKey, predicate: (query) => query.queryKey[1] !== 'unread' });
    });
    await expectReadOnEnds('empty');
  }, 10_000);

  // The same refresh, but the refetch it starts is REFUSED. A failed read moves `errorUpdatedAt`, not `dataUpdatedAt`, and a refusal that comes
  // in the same instant as the ask is never drawn as under way, so `isFetching` is false before and after: the effect has to hear it end by
  // `errorUpdatedAt`, or the screen sits on the loading list with nothing being read.
  describe('and the refetch it starts is refused', () => {
    /** The refresh fires from the request itself, when the named page is asked for, as in the cases above. */
    const refreshFromRequest = (answer: Answer): Answer => {
      const { inboxKey } = require('../api') as typeof import('../api');
      const refresh = () => void queryClient.invalidateQueries({ queryKey: inboxKey, predicate: (query) => query.queryKey[1] !== 'unread' });
      return { ...(answer as object), onSend: refresh } as Answer;
    };
    for (const ending of endings) {
      it(`ends on ${ending.name} when the refetch of the first page is refused`, async () => {
        const [first, second, third] = [pageOf([community('community:1')], 'cur2'), pageOf([community('community:2')], 'cur3'), pageOf([ending.last()], null)];
        answers[FIRST] = [first, refused(), first];
        answers[CUR2] = [refreshFromRequest(second), second];
        answers[CUR3] = [third];
        await renderScreen(testRows);
        await expectReadOnEnds(ending.state);
        expect(sent.filter((s) => s === CUR2).length).toBeGreaterThanOrEqual(2);
      }, 10_000);

      it(`ends on ${ending.name} when two pages are held and the refetch of the second is refused`, async () => {
        const [first, second, third] = [pageOf([community('community:1')], 'cur2'), pageOf([community('community:2')], 'cur3'), pageOf([ending.last()], null)];
        answers[FIRST] = [first];
        answers[CUR2] = [second, refused(), second];
        answers[CUR3] = [refreshFromRequest(third), third];
        await renderScreen(testRows);
        await expectReadOnEnds(ending.state);
        expect(sent.filter((s) => s === CUR3).length).toBeGreaterThanOrEqual(2);
      }, 10_000);

      it(`ends on the error with one Try again, not a loop, when the refetch and the page being read are both refused (then ${ending.name} once the page answers)`, async () => {
        const [first, second, third] = [pageOf([community('community:1')], 'cur2'), pageOf([community('community:2')], 'cur3'), pageOf([ending.last()], null)];
        answers[FIRST] = [first, refused(), first];
        answers[CUR2] = [refreshFromRequest(second), refused()];
        answers[CUR3] = [third];
        await renderScreen(testRows);
        await rtl.waitFor(() => expect({ state: screenState(), requestsInFlight: queryClient.isFetching() }).toEqual({ state: 'error', requestsInFlight: 0 }), { timeout: 4000 });
        const asked = sent.length;
        await settle();
        expect(sent).toHaveLength(asked);
        expect(rtl.screen.getAllByText('Try again')).toHaveLength(1);
        answers[CUR2] = [second];
        await rtl.act(async () => {
          rtl.fireEvent.press(rtl.screen.getByText('Try again'));
        });
        await expectReadOnEnds(ending.state);
      }, 10_000);
    }

    // Refused at once, with the refresh landing at each of these moments (ms after the screen opens; pages of 30 ms). Which of them stall on
    // the unfixed code differs from run to run with the load, as with the timings above.
    it.each([0, 10, 30, 60, 80, 100] as const)('ends on the empty state, not the loading list: refresh at %i ms, the refetch refused at once', async (refreshAt) => {
      const after = (answer: Answer, delay: number): Answer => ({ ...(answer as object), delay }) as Answer;
      const first = pageOf([community('community:1')], 'cur2');
      answers[FIRST] = [after(first, 30), refused(), after(first, 30)];
      answers[CUR2] = [after(pageOf([community('community:2')], 'cur3'), 30)];
      answers[CUR3] = [after(pageOf([community('community:3')], null), 30)];
      await renderScreen(testRows);
      await new Promise((resolve) => setTimeout(resolve, refreshAt));
      const { inboxKey } = require('../api') as typeof import('../api');
      await rtl.act(async () => {
        void queryClient.invalidateQueries({ queryKey: inboxKey, predicate: (query) => query.queryKey[1] !== 'unread' });
      });
      await expectReadOnEnds('empty');
    }, 10_000);
  });
});
