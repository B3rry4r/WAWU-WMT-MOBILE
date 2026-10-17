/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Text } from 'react-native';

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

/* A test double of the transport only: the socket the phone would open. The client, the session and the requests are real. */
class FakeSocket {
  static all: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen: ((e: unknown) => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
  }
  say(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }
}
(globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeSocket;

let unreadTotals: number[] = [];
/** When set, the whole answer of `GET /inbox/unread`, instead of one made from `unreadTotals`. */
let unreadAnswer: { total: number; chats: number; paidDms: number; communities: number } | null = null;
let catchUpAnswers: unknown[] = [];
const requests: string[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  requests.push(`${url.pathname.replace(/^\/api\/hub/, '')}${url.search}`);
  const body = (data: unknown) =>
    new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.pathname.endsWith('/inbox/unread')) {
    const total = unreadTotals.length > 1 ? (unreadTotals.shift() as number) : (unreadTotals[0] ?? 0);
    return body(unreadAnswer ?? { total, chats: total, paidDms: 0, communities: 0 });
  }
  if (url.pathname.endsWith('/live/catch-up')) return body(catchUpAnswers.shift() ?? { events: [], cursor: 'x', hasMore: false });
  if (url.pathname.endsWith('/inbox')) return body({ items: [], nextCursor: null });
  throw new Error(`no answer for ${url.pathname}`);
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { adoptSession, resetSessionForTests, signOut } = require('@/api/session') as typeof import('@/api/session');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { setInboxUnread, useInboxUnread } = require('../unread') as typeof import('../unread');
const { inboxRowRenderers } = require('../rows') as typeof import('../rows');

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

function Badge() {
  return <Text testID="badge">{useInboxUnread()}</Text>;
}
const shown = () => Number(rtl.screen.getByTestId('badge').props.children);
const lastSocket = () => FakeSocket.all[FakeSocket.all.length - 1] as FakeSocket;

async function connect(cursor = 'c0') {
  await rtl.waitFor(() => expect(FakeSocket.all.length).toBeGreaterThan(0));
  const socket = lastSocket();
  await rtl.act(async () => {
    socket.readyState = 1;
    socket.onopen?.({});
    socket.say({ type: 'ready', wawuId: 'me', cursor });
  });
  return socket;
}

/** The badge counts the kinds of row the Inbox draws (R-47); each test says which, so none depends on what the app draws today. */
const appDraws = { community: inboxRowRenderers.community, paid_dm: inboxRowRenderers.paid_dm };
const drawChats = () => {
  // The app draws community rows (INBOX-05) and a fan's paid questions (INBOX-10); these tests are about the counting rule, so only chats are drawn here.
  delete inboxRowRenderers.community;
  delete inboxRowRenderers.paid_dm;
  inboxRowRenderers.chat = () => <Text>chat row</Text>;
};

beforeEach(async () => {
  drawChats();
  FakeSocket.all = [];
  requests.length = 0;
  unreadTotals = [3];
  unreadAnswer = null;
  catchUpAnswers = [];
  setInboxUnread(0);
  queryClient.clear();
  resetSessionForTests();
  mockVault.clear();
});

afterEach(async () => {
  delete inboxRowRenderers.chat;
  if (appDraws.community) inboxRowRenderers.community = appDraws.community;
  if (appDraws.paid_dm) inboxRowRenderers.paid_dm = appDraws.paid_dm;
  await rtl.act(async () => signOut());
  rtl.cleanup();
  queryClient.clear();
});

const message = (id: string, cursor: string) => ({
  type: 'chat.message',
  cursor,
  message: { id, chatId: 'c1', senderWawuId: 'u2', mine: false, kind: 'text', text: 'hi', attachment: null, clientMessageId: null, createdAt: '2026-10-07T10:00:00Z', readState: null },
});

describe('the Inbox tab badge', () => {
  it('a signed-in user sees the unread total the server reports, and the app opens the live socket for it', async () => {
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    await rtl.waitFor(() => expect(shown()).toBe(3));
    const socket = await connect();
    expect(socket.url).toMatch(/\/api\/hub\/live$/);
    expect(socket.sent).toEqual([{ type: 'auth', token }]);
  });

  it('a new message raises the badge without a refresh', async () => {
    unreadTotals = [3, 4];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    await rtl.waitFor(() => expect(shown()).toBe(3));
    const socket = await connect();
    await rtl.act(async () => socket.say(message('m1', 'c1')));
    await rtl.waitFor(() => expect(shown()).toBe(4), { timeout: 3000 });
  });

  it('a live event reads again every inbox list that is on screen', async () => {
    const { QueryObserver } = require('@tanstack/react-query') as typeof import('@tanstack/react-query');
    const { inboxListKey } = require('../api') as typeof import('../api');
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    const list = jest.fn(async () => ({ items: [], nextCursor: null }));
    const watch = new QueryObserver(queryClient, { queryKey: inboxListKey('all'), queryFn: list });
    const stop = watch.subscribe(() => undefined);
    await rtl.waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    const socket = await connect();
    await rtl.act(async () => socket.say(message('m1', 'c1')));
    await rtl.waitFor(() => expect(list).toHaveBeenCalledTimes(2), { timeout: 3000 });
    stop();
  });

  it('a burst of messages is read as one change', async () => {
    unreadTotals = [1, 6];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    const socket = await connect();
    await rtl.waitFor(() => expect(shown()).toBe(1));
    const before = requests.filter((r) => r.startsWith('/inbox/unread')).length;
    await rtl.act(async () => {
      ['a', 'b', 'c', 'd', 'e'].forEach((id, i) => socket.say(message(id, `c${i}`)));
    });
    await rtl.waitFor(() => expect(shown()).toBe(6), { timeout: 3000 });
    expect(requests.filter((r) => r.startsWith('/inbox/unread')).length - before).toBe(1);
  });

  it('after the socket drops and comes back, what was missed is caught up and the badge is read again', async () => {
    unreadTotals = [2, 5];
    catchUpAnswers = [{ events: [message('m7', 'c7')], cursor: 'c8', hasMore: false }];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    const first = await connect('c0');
    await rtl.waitFor(() => expect(shown()).toBe(2));
    await rtl.act(async () => {
      first.readyState = 3;
      first.onclose?.({ code: 1006 });
    });
    await rtl.waitFor(() => expect(FakeSocket.all).toHaveLength(2), { timeout: 4000 });
    await connect('c9');
    await rtl.waitFor(() => expect(requests).toContain('/live/catch-up?cursor=c0&limit=100'));
    await rtl.waitFor(() => expect(shown()).toBe(5), { timeout: 3000 });
  });

  it('a user whose unread rows are of a kind nobody draws yet sees no badge', async () => {
    delete inboxRowRenderers.chat;
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    await rtl.waitFor(() => expect(requests).toContain('/inbox/unread'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(shown()).toBe(0);
  });

  it('counts the unread of a drawn kind and not the Hub total, which also holds rows nobody can see', async () => {
    unreadAnswer = { total: 9, chats: 2, paidDms: 3, communities: 4 };
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    await rtl.waitFor(() => expect(shown()).toBe(2));
  });

  it('shows nothing once the user signs out, and the socket stays closed', async () => {
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await rtl.render(<Badge />);
    await rtl.waitFor(() => expect(shown()).toBe(3));
    const socket = await connect();
    await rtl.act(async () => signOut());
    expect(shown()).toBe(0);
    expect(socket.readyState).toBe(3);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(FakeSocket.all).toHaveLength(1);
  });

  it('opens no socket and asks for no count while signed out', async () => {
    await rtl.render(<Badge />);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(shown()).toBe(0);
    expect(FakeSocket.all).toHaveLength(0);
    expect(requests).toEqual([]);
  });
});
