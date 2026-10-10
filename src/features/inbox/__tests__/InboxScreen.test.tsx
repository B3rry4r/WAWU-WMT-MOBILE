/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { InboxItem } from '../api';
import type { InboxRowRenderers } from '../rows';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
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

  it('shows only the chips whose screens exist', async () => {
    answers[FIRST] = [pageOf([row('chat:1')])];
    await renderScreen(testRows);
    await rtl.screen.findByTestId('row-chat:1');
    expect(rtl.screen.getAllByRole('radio').map((chip) => chip.props.accessibilityLabel)).toEqual(['All']);
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
});
