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

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const pageOf = (items: unknown[], nextCursor: string | null = null) => ok({ items, nextCursor });

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
const { InboxScreen } = require('../InboxScreen') as typeof import('../InboxScreen');

const person = { wawuId: 'u2', name: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } };

function row(id: string, over: Partial<InboxItem> = {}): InboxItem {
  return {
    id,
    kind: 'chat',
    lastActivityAt: '2026-10-07T10:00:00Z',
    unreadCount: 0,
    preview: { text: `Words of ${id}`, attachment: null, mine: false, senderName: null, sentAt: '2026-10-07T10:00:00Z' },
    chat: { chatId: id, other: person, canMessage: true },
    paidDm: null,
    community: null,
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

  it('shows only the chips whose screens exist: All and Communities', async () => {
    answers[FIRST] = [pageOf([row('chat:1')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:1');
    expect(rtl.screen.getAllByRole('radio').map((chip) => chip.props.accessibilityLabel)).toEqual(['All', 'Communities']);
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

  it('draws nothing for a kind of row nobody has built yet, and does not call the inbox empty', async () => {
    answers[FIRST] = [pageOf([row('chat:1'), row('community:1', { kind: 'community', chat: null })])];
    await renderScreen({});
    await rtl.waitFor(() => expect(sent).toContain(FIRST));
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('inbox-loading')).toBeNull());
    expect(ids()).toEqual([]);
    expect(rtl.screen.queryByText('No messages yet')).toBeNull();
  });

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
        preview: { text: 'who’s at the meetup Sat?', attachment: null, mine: false, senderName: 'Tolu Balogun', sentAt: '2026-10-07T10:00:00Z' },
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

    it('a user can tap a community row and open its room', async () => {
      answers[FIRST] = [pageOf([community('r1')])];
      await renderScreen();
      await rtl.fireEvent.press(await rtl.screen.findByTestId('row-community:r1'));
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r1' } });
    });

    it('a user with chats and no community sees the title and the chips and nothing else: chat rows are drawn by another task', async () => {
      answers[FIRST] = [pageOf([row('chat:1'), row('chat:2')])];
      await renderScreen();
      await rtl.screen.findByRole('header', { name: 'Inbox' });
      await settle();
      expect(rtl.screen.queryAllByTestId(/^row-/)).toEqual([]);
      expect(rtl.screen.queryByText('No messages yet')).toBeNull();
      expect(rtl.screen.queryByTestId('inbox-error')).toBeNull();
      expect(rtl.screen.getAllByRole('radio')).toHaveLength(2);
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
      answers['GET /communities?page=1&perPage=20'] = [noRooms];
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
      answers['GET /communities?page=1&perPage=20'] = [noRooms];
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
