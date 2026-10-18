/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { CommunityMessage } from '../api';

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: mockReplace }) }));

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

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
let posts: { path: string; body: unknown }[] = [];
/** The `Idempotency-Key` header of each POST to a room's messages, in order (null when a POST carried none). */
let postKeys: (string | null)[] = [];

const ok = (data: unknown, extra: object = {}): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });
const created = (data: unknown): Answer => ({ status: 201, body: { statusCode: 201, message: 'OK', data } });
const refuse = (status: number, message: string, extra: object = {}): Answer => ({ status, body: { statusCode: status, message, data: null, ...extra } });
const paged = (items: unknown[], nextPage: number | null = null): Answer =>
  ok(items, { pagination: { currentPage: 1, nextPage, perPage: 20, total: items.length } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  sent.push(`${key}${url.search}`);
  if (request.method === 'POST') posts.push({ path, body: await request.clone().json().catch(() => null) });
  if (request.method === 'POST' && /^\/communities\/[^/]+\/messages$/.test(path)) postKeys.push(request.headers.get('idempotency-key'));
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { adoptSession, resetSessionForTests, signOut } = require('@/api/session') as typeof import('@/api/session');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { RoomScreen, roomItems } = require('../RoomScreen') as typeof import('../RoomScreen');

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

const ROOM = 'room-1';
const ME = 'user-me';
const HOST = 'user-host';
const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const person = (wawuId: string, name: string) => ({ wawuId, name, handle: null, avatarUrl: null, verification });

const room = (over: object = {}) => ({
  id: ROOM,
  name: 'Lagos Freelancers',
  description: 'Freelancers in Lagos.',
  kind: 'open',
  imageUrl: null,
  hostWawuId: HOST,
  memberCount: 1204,
  messagesToday: 3,
  slug: 'lagos-freelancers',
  link: 'wawu/c/lagos-freelancers',
  role: 'member',
  messageCostInCredits: 1,
  ...over,
});

let counter = 0;
function message(text: string | null, by: string = 'u2', over: Partial<CommunityMessage> = {}): CommunityMessage {
  counter += 1;
  const names: Record<string, string> = { [HOST]: 'Kemi Okafor', u2: 'Tolu Balogun', [ME]: 'Ada Obi' };
  return {
    id: `m${counter}`,
    imageUrl: null,
    videoUrl: null,
    voiceUrl: null,
    senderWawuId: by,
    text,
    sentAt: new Date(Date.now() - (1000 - counter) * 1000).toISOString(),
    communityId: ROOM,
    costInCredits: by === HOST ? 0 : 1,
    sender: person(by, names[by] ?? 'Someone'),
    ...over,
  };
}

const credits = (creditBalance: number) => ok({ userWawuId: ME, creditBalance, trialEndsAt: null });
const me = ok({ wawuUserId: ME, firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null, verification });
const MESSAGES = `GET /communities/${ROOM}/messages?page=1&perPage=20`;

function serve(extra: Record<string, Answer[]> = {}) {
  answers = {
    [`GET /communities/${ROOM}/room`]: [ok(room())],
    'GET /credits': [credits(48)],
    'GET /users/me': [me],
    [`POST /communities/${ROOM}/read`]: [ok({ communityId: ROOM, lastReadAt: new Date().toISOString() })],
    'GET /inbox/unread': [ok({ total: 0, chats: 0, paidDms: 0, communities: 0 })],
    'GET /live/catch-up': [ok({ events: [], cursor: 'c0', hasMore: false })],
    ...extra,
  };
}

const back = jest.fn();
async function renderRoom(signedIn = true) {
  if (signedIn) await adoptSession({ accessToken: token, refreshToken: 'r' });
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <RoomScreen id={ROOM} onBack={back} />
    </SafeAreaProvider>,
  );
}

const settle = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
const postIds = () => rtl.screen.queryAllByTestId(/^post-m\d+$/).map((node) => node.props.testID);
const type = async (text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId('composer-input'), text);
const pressSend = async () => rtl.fireEvent.press(rtl.screen.getByTestId('composer-send'));
const lastSocket = () => FakeSocket.all[FakeSocket.all.length - 1] as FakeSocket;

async function connect(cursor = 'c0') {
  await rtl.waitFor(() => expect(FakeSocket.all.length).toBeGreaterThan(0));
  const socket = lastSocket();
  await rtl.act(async () => {
    socket.readyState = 1;
    socket.onopen?.({});
    socket.say({ type: 'ready', wawuId: ME, cursor });
  });
  return socket;
}

const liveMessage = (m: CommunityMessage, cursor: string, communityId = ROOM) => ({ type: 'community.message', cursor, communityId, message: m });

beforeEach(() => {
  sent = [];
  posts = [];
  postKeys = [];
  counter = 0;
  FakeSocket.all = [];
  back.mockClear();
  mockPush.mockClear();
  queryClient.clear();
  resetSessionForTests();
  mockVault.clear();
  serve();
});

afterEach(async () => {
  jest.useRealTimers();
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await signOut();
  });
  rtl.cleanup();
  queryClient.clear();
});

/**
 * Freezes the date and nothing else (every timer stays real) at a fixed noon. `message()` stamps a message about 16 minutes before
 * "now", which is yesterday for the 17 minutes after midnight, so a test that expects the day label `Today` pins the date first.
 */
const pinDate = () =>
  jest.useFakeTimers({
    now: new Date('2026-10-07T12:00:00'),
    doNotFake: ['hrtime', 'nextTick', 'performance', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
  });

describe('a community room (I25)', () => {
  it('a member reads the messages oldest at the top, with the member count and the credit balance in the header, and a Host tag on the host\'s message', async () => {
    pinDate();
    const first = message('Meetup is Saturday, 2pm.', HOST);
    const second = message("Who's at the meetup Sat?", 'u2');
    const third = message("I'll be there. First time.", 'u3');
    // The route answers newest first.
    answers[MESSAGES] = [paged([third, second, first])];
    await renderRoom();
    expect(await rtl.screen.findByText("Who's at the meetup Sat?")).toBeTruthy();
    expect(postIds()).toEqual([`post-${third.id}`, `post-${second.id}`, `post-${first.id}`]);
    expect(rtl.screen.getByTestId('room-name').props.children).toBe('Lagos Freelancers');
    expect(rtl.screen.getByTestId('room-sub').props.children).toBe('1,204 members · open');
    expect(await rtl.screen.findByText('48 credits')).toBeTruthy();
    // Only the host's message carries the tag.
    expect(rtl.screen.getByTestId(`post-${first.id}-host`)).toBeTruthy();
    expect(rtl.screen.queryByTestId(`post-${second.id}-host`)).toBeNull();
    expect(rtl.screen.getAllByText('Host')).toHaveLength(1);
    expect(rtl.screen.getByText('Today')).toBeTruthy();
  });

  it('reading costs nothing: opening the room asks only for the room, its messages, the balance and the read mark', async () => {
    answers[MESSAGES] = [paged([message('hello')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await rtl.waitFor(() => expect(sent).toContain(`POST /communities/${ROOM}/read`));
    const writes = posts.map((request) => request.path);
    expect(writes).toEqual([`/communities/${ROOM}/read`]);
    expect(sent).not.toContain(`POST /communities/${ROOM}/messages`);
  });

  it('the credit balance in the header is the server\'s number', async () => {
    answers['GET /credits'] = [credits(0)];
    answers[MESSAGES] = [paged([message('hello')])];
    await renderRoom();
    expect(await rtl.screen.findByText('0 credits')).toBeTruthy();
  });

  it('a room nobody has written in says so, and the composer is there', async () => {
    answers[MESSAGES] = [paged([])];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-empty')).toBeTruthy();
    expect(rtl.screen.getByText('No messages yet')).toBeTruthy();
    expect(rtl.screen.getByTestId('composer-input')).toBeTruthy();
  });

  it('a room with no members yet says "0 members"', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ memberCount: 0 }))];
    answers[MESSAGES] = [paged([])];
    await renderRoom();
    await rtl.screen.findByTestId('room-empty');
    expect(rtl.screen.getByTestId('room-sub').props.children).toBe('0 members · open');
  });

  it('a user sees the room load: a loading list while the messages are on their way, the header once the room is known', async () => {
    answers[MESSAGES] = ['hold'];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-loading')).toBeTruthy();
    expect(await rtl.screen.findByTestId('room-name')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Loading the messages')).toBeTruthy();
    expect(rtl.screen.queryByTestId('composer')).toBeNull();
  });

  it('a user can go back', async () => {
    answers[MESSAGES] = [paged([message('hello')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await rtl.fireEvent.press(rtl.screen.getByTestId('room-back'));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('long words, emoji and right-to-left text are drawn whole', async () => {
    const long = 'x'.repeat(300);
    answers[MESSAGES] = [paged([message('مرحبا بالجميع 👋🏽'), message(long), message('🎉🎉🎉 party time', 'u2')])];
    await renderRoom();
    expect(await rtl.screen.findByText('مرحبا بالجميع 👋🏽')).toBeTruthy();
    expect(rtl.screen.getByText(long)).toBeTruthy();
    expect(rtl.screen.getByText('🎉🎉🎉 party time')).toBeTruthy();
  });

  it('a very long room name is cut after three lines in the header, and the member count is never cut', async () => {
    const name = 'The Very Long Named Community Of Lagos Based Freelancers And Friends';
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ name }))];
    answers[MESSAGES] = [paged([])];
    await renderRoom();
    const title = await rtl.screen.findByTestId('room-name');
    expect(title.props.children).toBe(name);
    expect(title.props.numberOfLines).toBe(3);
    // The artboard has no ellipsis on the count: on a narrow phone it wraps (verifier note 26).
    expect(rtl.screen.getByTestId('room-sub').props.numberOfLines).toBeUndefined();
  });

  it('draws only a window of a very long history', async () => {
    const many = Array.from({ length: 1500 }, (_, i) => message(`message ${i}`, 'u2', { id: `m${100000 + i}` }));
    answers[MESSAGES] = [paged(many)];
    await renderRoom();
    await rtl.screen.findByTestId('room-messages');
    await rtl.waitFor(() => expect(postIds().length).toBeGreaterThan(0));
    expect(postIds().length).toBeLessThan(120);
  });

  it('names the days: a day label sits above the first message of each day', () => {
    const now = new Date('2026-10-07T12:00:00');
    const today = message('today', 'u2', { sentAt: '2026-10-07T09:12:00' });
    const earlier = message('earlier today', 'u2', { sentAt: '2026-10-07T08:40:00' });
    const yesterday = message('yesterday', 'u2', { sentAt: '2026-10-06T21:00:00' });
    const items = roomItems([today, earlier, yesterday], [], now);
    expect(items.map((item) => (item.kind === 'day' ? item.label : item.kind === 'post' ? item.message.text : item.kind))).toEqual([
      'today',
      'earlier today',
      'Today',
      'yesterday',
      'Yesterday',
    ]);
  });

  it('marks the room read once its messages are on screen', async () => {
    answers[MESSAGES] = [paged([message('hello')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await rtl.waitFor(() => expect(sent.filter((s) => s === `POST /communities/${ROOM}/read`)).toHaveLength(1));
  });
});

describe('older messages', () => {
  it('a user reaching the top of the history gets the next page, and no message shows twice', async () => {
    // The server lists newest first: `newer 0` is the newest, so it is made last.
    const newer = Array.from({ length: 3 }, (_, i) => message(`newer ${2 - i}`, 'u2')).reverse();
    // The server's pages are offset pages, so a message that arrived meanwhile repeats the last one of the page before.
    const older = [newer[2] as CommunityMessage, message('the oldest one', 'u2', { sentAt: '2000-01-01T00:00:00Z' })];
    answers[MESSAGES] = [paged(newer, 2)];
    answers[`GET /communities/${ROOM}/messages?page=2&perPage=20`] = [paged(older)];
    await renderRoom();
    await rtl.screen.findByText('newer 0');
    await rtl.fireEvent(rtl.screen.getByTestId('room-messages'), 'endReached');
    expect(await rtl.screen.findByText('the oldest one')).toBeTruthy();
    expect(rtl.screen.getAllByText('newer 2')).toHaveLength(1);
  });

  it('a page that fails keeps the messages and offers to try that page again', async () => {
    const newer = Array.from({ length: 3 }, (_, i) => message(`newer ${2 - i}`, 'u2')).reverse();
    answers[MESSAGES] = [paged(newer, 2)];
    answers[`GET /communities/${ROOM}/messages?page=2&perPage=20`] = ['offline', 'offline', 'offline', paged([message('the oldest one', 'u2', { sentAt: '2000-01-01T00:00:00Z' })])];
    await renderRoom();
    await rtl.screen.findByText('newer 0');
    await rtl.fireEvent(rtl.screen.getByTestId('room-messages'), 'endReached');
    expect(await rtl.screen.findByText('Couldn’t load older messages.', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('newer 0')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('the oldest one')).toBeTruthy();
  }, 20_000);

  it('does not ask for another page when the history has ended', async () => {
    answers[MESSAGES] = [paged([message('only')])];
    await renderRoom();
    await rtl.screen.findByText('only');
    await rtl.fireEvent(rtl.screen.getByTestId('room-messages'), 'endReached');
    await settle();
    expect(sent.filter((s) => s.startsWith(`GET /communities/${ROOM}/messages`))).toEqual([MESSAGES]);
  });
});

describe('sending (I26)', () => {
  it('a user types a message and presses Send: it is posted with that text, shown, and the balance is the server\'s new number', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    answers['GET /credits'] = [credits(48), credits(47)];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await rtl.screen.findByText('48 credits');
    await type('Count me in, bringing the bank logo.');
    expect(rtl.screen.getByText('Send · 1')).toBeTruthy();
    answers[`POST /communities/${ROOM}/messages`] = [created(message('Count me in, bringing the bank logo.', ME, { costInCredits: 1, sender: undefined }))];
    await pressSend();
    expect(await rtl.screen.findByText('Count me in, bringing the bank logo.')).toBeTruthy();
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toEqual([
      { path: `/communities/${ROOM}/messages`, body: { text: 'Count me in, bringing the bank logo.' } },
    ]);
    expect(await rtl.screen.findByText('47 credits')).toBeTruthy();
    // The field is empty again and Send is the arrow.
    expect(rtl.screen.getByTestId('composer-input').props.value).toBe('');
    // The person's own message reads like any other, under their own name.
    expect(rtl.screen.getByText('Ada Obi')).toBeTruthy();
  });

  it('the balance after a send is read from the server, never worked out on the phone', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    // The server says 40, not 47: a phone that subtracted one would show 47.
    answers['GET /credits'] = [credits(48), credits(40)];
    await renderRoom();
    await rtl.screen.findByText('48 credits');
    await type('hi');
    answers[`POST /communities/${ROOM}/messages`] = [created(message('hi', ME))];
    await pressSend();
    expect(await rtl.screen.findByText('40 credits')).toBeTruthy();
  });

  it('the host sends for free and the balance the server reports does not move', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    answers['GET /credits'] = [credits(0), credits(0)];
    await renderRoom();
    await rtl.screen.findByText('0 credits');
    await type('Welcome everyone');
    answers[`POST /communities/${ROOM}/messages`] = [created(message('Welcome everyone', HOST, { costInCredits: 0 }))];
    await pressSend();
    expect(await rtl.screen.findByText('Welcome everyone')).toBeTruthy();
    await rtl.waitFor(() => expect(sent.filter((s) => s === 'GET /credits')).toHaveLength(2));
    expect(rtl.screen.getByText('0 credits')).toBeTruthy();
  });

  it('shows the message as sending while the server has not answered, and Send waits', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('on its way');
    answers[`POST /communities/${ROOM}/messages`] = ['hold'];
    await pressSend();
    expect((await rtl.screen.findAllByText('Sending')).length).toBeGreaterThan(0);
    expect(rtl.screen.getByText('on its way')).toBeTruthy();
    // Typing the next one is allowed; sending it waits for the first.
    await type('next one');
    expect(rtl.screen.getByTestId('composer-send').props.accessibilityState.disabled).toBe(true);
  });

  it('a double press posts the message once', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('only once');
    answers[`POST /communities/${ROOM}/messages`] = ['hold'];
    await pressSend();
    await pressSend();
    await pressSend();
    await settle();
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(1);
  });

  it('nothing is posted for an empty or blank field, and Send is disabled', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    expect(rtl.screen.getByTestId('composer-send').props.accessibilityState.disabled).toBe(true);
    await type('    ');
    await pressSend();
    await settle();
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(0);
  });

  it('a message that fails keeps its text, says it was not sent, and Send again sends it', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    answers['GET /credits'] = [credits(48), credits(47)];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('please send me');
    answers[`POST /communities/${ROOM}/messages`] = [refuse(429, 'Too many messages. Slow down.'), created(message('please send me', ME))];
    await pressSend();
    expect(await rtl.screen.findByText('Not sent')).toBeTruthy();
    expect(rtl.screen.getByText('please send me')).toBeTruthy();
    expect(rtl.screen.getByText('Too many messages. Slow down.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(rtl.screen.getByText('please send me')).toBeTruthy();
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(2);
  });

  it('a user can remove a message that did not send', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('drop me');
    answers[`POST /communities/${ROOM}/messages`] = [refuse(400, 'Nope.')];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Remove' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('drop me')).toBeNull());
  });

  it('a send with no answer is not sent twice: Send again first looks for the message the server may have stored', async () => {
    const stored = message('did it land?', ME);
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([stored, message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('did it land?');
    answers[`POST /communities/${ROOM}/messages`] = ['offline'];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(1);
    expect(rtl.screen.getAllByText('did it land?')).toHaveLength(1);
  });

  it('INBOX-05 #34: a send with no answer whose message then arrives on the live socket clears its "Not sent" copy', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    const socket = await connect();
    await rtl.screen.findByText('hello');
    await type('stored but unanswered');
    answers[`POST /communities/${ROOM}/messages`] = ['offline'];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    // The Hub did store it; the socket delivers the stored message.
    await rtl.act(async () => socket.say(liveMessage(message('stored but unanswered', ME), 'c9')));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(rtl.screen.getAllByText('stored but unanswered')).toHaveLength(1);
    expect(rtl.screen.queryByRole('button', { name: 'Send again' })).toBeNull();
  });

  it('INBOX-05 W4b L2: when the stored message arrives on the socket the balance is read again (the words were paid for)', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    answers['GET /credits'] = [credits(48), credits(47)];
    await renderRoom();
    const socket = await connect();
    await rtl.screen.findByText('hello');
    await rtl.screen.findByText('48 credits');
    await type('stored but unanswered');
    answers[`POST /communities/${ROOM}/messages`] = ['offline'];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    await rtl.act(async () => socket.say(liveMessage(message('stored but unanswered', ME), 'c9')));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(await rtl.screen.findByText('47 credits')).toBeTruthy();
  });

  it('INBOX-05 W4b L2: a page that brings the stored message clears its "Not sent" copy and the balance is read again', async () => {
    const stored = message('landed unseen', ME);
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([stored, message('hello', 'u2')])];
    answers['GET /credits'] = [credits(48), credits(47)];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await rtl.screen.findByText('48 credits');
    await type('landed unseen');
    answers[`POST /communities/${ROOM}/messages`] = ['offline'];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    // The socket comes up and syncs: it reads the newest page, which carries the stored message.
    await connect();
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(rtl.screen.getAllByText('landed unseen')).toHaveLength(1);
    expect(await rtl.screen.findByText('47 credits')).toBeTruthy();
  });

  it('INBOX-05 #34: the same words from another member do not clear a "Not sent" copy', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    const socket = await connect();
    await rtl.screen.findByText('hello');
    await type('same words');
    answers[`POST /communities/${ROOM}/messages`] = ['offline'];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    await rtl.act(async () => socket.say(liveMessage(message('same words', 'u2'), 'c9')));
    expect(rtl.screen.getByText('Not sent')).toBeTruthy();
    expect(rtl.screen.getAllByText('same words')).toHaveLength(2);
  });

  it('a send with no answer that did not land is sent again', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('lost on the way');
    answers[`POST /communities/${ROOM}/messages`] = ['offline', created(message('lost on the way', ME))];
    await pressSend();
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(2);
  });

  it('a user with no credits left sees the server\'s own sentence, keeps the message, and the balance is read again', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    answers['GET /credits'] = [credits(0), credits(0)];
    await renderRoom();
    await rtl.screen.findByText('0 credits');
    await type('one more');
    const sentence = 'You are out of WAWU Credits. Buy more to keep messaging in this community.';
    answers[`POST /communities/${ROOM}/messages`] = [refuse(402, sentence, { reason: 'insufficient_credits' })];
    await pressSend();
    expect(await rtl.screen.findByText(sentence)).toBeTruthy();
    expect(rtl.screen.getByText('one more')).toBeTruthy();
    expect(rtl.screen.getByText('Not sent')).toBeTruthy();
    await rtl.waitFor(() => expect(sent.filter((s) => s === 'GET /credits').length).toBeGreaterThanOrEqual(2));
    // Buying credits is INBOX-13's screen (I27, I28), which is now built: a person with none left is offered the way to it.
    expect(rtl.screen.getByTestId('out-of-credits-buy')).toBeTruthy();
  });

  it('is not charged for reading: the balance is not asked to change by anything but a send', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    expect(posts.map((request) => request.path).filter((path) => path.includes('credits'))).toEqual([]);
  });
});

describe('a person who is not in the room', () => {
  it('sees what an open room is and can Join it, and then reads it', async () => {
    answers[MESSAGES] = [refuse(403, 'Join this community to read or post in it.'), paged([message('welcome in', HOST)])];
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ role: 'none' })), ok(room({ role: 'member' }))];
    answers[`POST /communities/${ROOM}/join`] = [ok({ id: 'mem', userWawuId: ME, status: 'joined', requestedAt: '2026-10-07T10:00:00Z', communityId: ROOM, joinedAt: '2026-10-07T10:00:00Z' })];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-not-member')).toBeTruthy();
    expect(rtl.screen.getByText('Freelancers in Lagos.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('composer')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('room-join'));
    expect(await rtl.screen.findByText('welcome in')).toBeTruthy();
    expect(sent).toContain(`POST /communities/${ROOM}/join`);
    expect(rtl.screen.getByTestId('composer')).toBeTruthy();
  });

  it('is told why when joining fails, and can try again', async () => {
    answers[MESSAGES] = [refuse(403, 'Join this community to read or post in it.')];
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ role: 'none' }))];
    answers[`POST /communities/${ROOM}/join`] = [refuse(500, 'Something went wrong. Please try again.')];
    await renderRoom();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('room-join'));
    expect(await rtl.screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
    expect(rtl.screen.getByTestId('room-join')).toBeTruthy();
  });

  it('sees a private room as private, with no button to join or to ask (asking is another task\'s)', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'none' }))];
    answers[MESSAGES] = [refuse(403, 'Join this community to read or post in it.')];
    answers[`GET /communities/${ROOM}/pass`] = [ok({ communityId: ROOM, sellsPass: false, priceKobo: null, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: false, isHost: false })];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-private-note')).toBeTruthy();
    expect(rtl.screen.getByText('This community is private. Only members can read it.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('room-join')).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: /^Ask/ })).toBeNull();
    // A private room keeps its picture as the header (I37): the count is on the cover.
    expect(rtl.screen.getByTestId('room-cover-sub').props.children).toBe('1,204 members');
  });

  it('a private room that sells a monthly pass opens its pass page in the room\'s place, where the host\'s price is paid (INBOX-14, R-63)', async () => {
    mockReplace.mockClear();
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'none' }))];
    answers[MESSAGES] = [refuse(403, 'Join this community to read or post in it.')];
    answers[`GET /communities/${ROOM}/pass`] = [ok({ communityId: ROOM, sellsPass: true, priceKobo: 200_000, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: true, isHost: false })];
    await renderRoom();
    await rtl.waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/community/pass/[id]', params: { id: ROOM } }));
    expect(rtl.screen.queryByTestId('room-private-note')).toBeNull();
  });

  it('removed by the host from a room that sells a pass lands on I30\'s "Removed by the host", not on a request still with the host (INBOX-24 round 2)', async () => {
    mockReplace.mockClear();
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'pending' }))];
    answers[MESSAGES] = [refuse(403, 'Join this community to read or post in it.')];
    answers[`GET /communities/${ROOM}/pass`] = [ok({ communityId: ROOM, sellsPass: true, priceKobo: 200_000, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: false, isHost: false })];
    await renderRoom();
    await rtl.waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/community/pass/[id]', params: { id: ROOM } }));
    expect(rtl.screen.queryByText('Your request is with the host. You can read here once they approve it.')).toBeNull();
  });

  it('whose request to a private room is still with the host is told so', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'pending' }))];
    answers[MESSAGES] = [refuse(403, 'Join this community to read or post in it.')];
    answers[`GET /communities/${ROOM}/pass`] = [ok({ communityId: ROOM, sellsPass: false, priceKobo: null, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: false, isHost: false })];
    await renderRoom();
    expect(await rtl.screen.findByText('Your request is with the host. You can read here once they approve it.')).toBeTruthy();
  });

  it('who was removed from a room while reading it, and tries to send, lands on the same page', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')]), refuse(403, 'Join this community to read or post in it.')];
    answers[`GET /communities/${ROOM}/room`] = [ok(room()), ok(room({ role: 'none' }))];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('am I still in?');
    answers[`POST /communities/${ROOM}/messages`] = [refuse(403, 'Join this community to read or post in it.')];
    await pressSend();
    expect(await rtl.screen.findByTestId('room-not-member')).toBeTruthy();
    expect(rtl.screen.queryByTestId('composer')).toBeNull();
  });

  it('is told a room is not available when the server hides it (404), and is offered nothing else', async () => {
    answers[`GET /communities/${ROOM}/room`] = [refuse(404, 'Community not found')];
    answers[MESSAGES] = [refuse(404, 'Community not found')];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-unavailable')).toBeTruthy();
    expect(rtl.screen.getByText('This community isn’t available')).toBeTruthy();
    expect(rtl.screen.queryByTestId('composer')).toBeNull();
  });
});

describe('the host of a private room (I34 entry, INBOX-14)', () => {
  const requests = (total: number) => ok([{ id: 'q1', userWawuId: 'u9', status: 'pending', requestedAt: '2026-10-17T09:00:00.000Z', communityId: ROOM, joinedAt: null, handle: 'tolu', avatarUrl: null }], { pagination: { nextPage: null, total } });

  it('sees a Join requests row while someone waits on them, and it opens I34', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'host' }))];
    answers[`GET /communities/${ROOM}/requests?page=1&perPage=20`] = [requests(1)];
    await renderRoom();
    const entry = await rtl.screen.findByTestId('room-requests');
    expect(rtl.screen.getByText('1 waiting')).toBeTruthy();
    rtl.fireEvent.press(entry);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/community/requests/[id]', params: { id: ROOM } });
  });

  it('sees no row when nobody waits, and a member never asks the Hub who waits', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'host' }))];
    answers[`GET /communities/${ROOM}/requests?page=1&perPage=20`] = [ok([], { pagination: { nextPage: null, total: 0 } })];
    await renderRoom();
    await rtl.screen.findByTestId('room-cover');
    await settle(300);
    expect(rtl.screen.queryByTestId('room-requests')).toBeNull();
  });

  it('a member of a private room is shown no such row', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ kind: 'private', role: 'member' }))];
    await renderRoom();
    await rtl.screen.findByTestId('room-cover');
    await settle(300);
    expect(rtl.screen.queryByTestId('room-requests')).toBeNull();
  });
});

describe('when something goes wrong', () => {
  it('a room that cannot be read shows the server\'s sentence and a retry that reads it', async () => {
    answers[`GET /communities/${ROOM}/room`] = [refuse(500, 'Something went wrong. Please try again.'), refuse(500, 'Something went wrong. Please try again.'), refuse(500, 'Something went wrong. Please try again.'), ok(room())];
    answers[MESSAGES] = [paged([message('back again', 'u2')])];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('back again')).toBeTruthy();
  }, 20_000);

  it('messages that cannot be read keep the header, say so, and a retry reads them', async () => {
    answers[MESSAGES] = ['offline', 'offline', 'offline', paged([message('back again', 'u2')])];
    await renderRoom();
    expect(await rtl.screen.findByTestId('room-messages-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(rtl.screen.getByTestId('room-name')).toBeTruthy();
    expect(rtl.screen.queryByTestId('composer')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('back again')).toBeTruthy();
  }, 20_000);

  it('the header shows no balance when the balance cannot be read, and the room still works', async () => {
    answers['GET /credits'] = [refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.'), refuse(500, 'Something went wrong.')];
    answers[MESSAGES] = [paged([message('still here', 'u2')])];
    await renderRoom();
    expect(await rtl.screen.findByText('still here')).toBeTruthy();
    expect(rtl.screen.queryByTestId('room-credits')).toBeNull();
  });
});

describe('live messages', () => {
  async function openLive(first: CommunityMessage[]) {
    answers[MESSAGES] = [paged(first)];
    await renderRoom();
    await rtl.screen.findByTestId('room-messages').catch(() => undefined);
    return connect();
  }

  it('a message another member sends shows up without a refresh', async () => {
    const socket = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    const incoming = message('fresh from Tolu', 'u2');
    await rtl.act(async () => socket.say(liveMessage(incoming, 'c1')));
    expect(await rtl.screen.findByText('fresh from Tolu')).toBeTruthy();
    expect(postIds()[0]).toBe(`post-${incoming.id}`);
  });

  it('a message that arrives twice, or that a page also holds, shows once', async () => {
    const socket = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    const incoming = message('only once please', 'u2');
    await rtl.act(async () => {
      socket.say(liveMessage(incoming, 'c1'));
      socket.say(liveMessage(incoming, 'c2'));
    });
    await rtl.screen.findByText('only once please');
    expect(rtl.screen.getAllByText('only once please')).toHaveLength(1);
  });

  it('a message for another room does not show here', async () => {
    const socket = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    await rtl.act(async () => socket.say(liveMessage(message('wrong room', 'u2', { communityId: 'room-2' }), 'c1', 'room-2')));
    await settle(200);
    expect(rtl.screen.queryByText('wrong room')).toBeNull();
  });

  it('the host\'s live message carries the Host tag', async () => {
    const socket = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    const incoming = message('from the host', HOST);
    await rtl.act(async () => socket.say(liveMessage(incoming, 'c1')));
    expect(await rtl.screen.findByTestId(`post-${incoming.id}-host`)).toBeTruthy();
  });

  it('after the socket drops and comes back, what was missed is caught up and shows', async () => {
    const first = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    const missed = message('sent while offline', 'u2');
    answers['GET /live/catch-up'] = [ok({ events: [liveMessage(missed, 'c5')], cursor: 'c6', hasMore: false })];
    await rtl.act(async () => {
      first.readyState = 3;
      first.onclose?.({ code: 1006 });
    });
    await rtl.waitFor(() => expect(FakeSocket.all).toHaveLength(2), { timeout: 4000 });
    await connect('c9');
    expect(await rtl.screen.findByText('sent while offline', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('a message stored after the page was read but before the socket was ready shows once the socket is ready (the newest page is read when it syncs)', async () => {
    const stored = message('stored in the gap', 'u2');
    // The first read of the newest page is the room opening; the second is the socket becoming ready. The message is stored between them,
    // so no event carries it (the socket was not up) and only that second read can show it.
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([stored, message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    expect(rtl.screen.queryByText('stored in the gap')).toBeNull();
    await connect();
    expect(await rtl.screen.findByText('stored in the gap')).toBeTruthy();
    expect(rtl.screen.getAllByText('stored in the gap')).toHaveLength(1);
    expect(sent.filter((request) => request === MESSAGES)).toHaveLength(2);
  });

  it('a reader up in the history is told when a new message arrives, and the tell goes when they are back at the bottom', async () => {
    const socket = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    const list = rtl.screen.getByTestId('room-messages');
    await rtl.fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 400, x: 0 }, contentSize: { height: 2000, width: 390 }, layoutMeasurement: { height: 600, width: 390 } } });
    expect(rtl.screen.queryByTestId('room-new-messages')).toBeNull();
    await rtl.act(async () => socket.say(liveMessage(message('while you read', 'u2'), 'c1')));
    expect(await rtl.screen.findByTestId('room-new-messages')).toBeTruthy();
    await rtl.fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 0, x: 0 }, contentSize: { height: 2000, width: 390 }, layoutMeasurement: { height: 600, width: 390 } } });
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('room-new-messages')).toBeNull());
  });

  it('a reader at the bottom is not told anything: the new message is simply there', async () => {
    const socket = await openLive([message('hello', 'u2')]);
    await rtl.screen.findByText('hello');
    await rtl.act(async () => socket.say(liveMessage(message('right here', 'u2'), 'c1')));
    expect(await rtl.screen.findByText('right here')).toBeTruthy();
    expect(rtl.screen.queryByTestId('room-new-messages')).toBeNull();
  });
});

describe('defects found by the verifier', () => {
  it('one tap on Try again recovers a room that failed to open together with its messages', async () => {
    const boom = refuse(500, 'Something went wrong. Please try again.');
    answers[`GET /communities/${ROOM}/room`] = [boom, boom, boom, ok(room())];
    answers[MESSAGES] = [boom, boom, boom, paged([message('all back', 'u2')])];
    await renderRoom();
    await rtl.screen.findByTestId('room-error', {}, { timeout: 8000 });
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText('all back')).toBeTruthy();
    expect(rtl.screen.queryByTestId('room-messages-error')).toBeNull();
  }, 20_000);

  it('a signed-out visit asks the person to sign in, shows no server word, and asks the server nothing', async () => {
    await renderRoom(false);
    expect(await rtl.screen.findByTestId('room-signed-out')).toBeTruthy();
    expect(rtl.screen.getByText('Sign in to open this community')).toBeTruthy();
    expect(rtl.screen.queryByText(/unauthorized/i)).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Sign in' }));
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
    expect(sent.filter((request) => request.includes('/communities'))).toEqual([]);
  });

  it('a message past the limit says so in plain words, offers Edit and not Send again, and Edit puts the words back in the field', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    await type('a very long message');
    answers[`POST /communities/${ROOM}/messages`] = [refuse(400, 'text must be shorter than or equal to 2000 characters')];
    await pressSend();
    expect(await rtl.screen.findByText('That message is too long. Shorten it and send it again.')).toBeTruthy();
    expect(rtl.screen.queryByText(/shorter than or equal/)).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: 'Send again' })).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Edit' }));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('composer-input').props.value).toBe('a very long message'));
    expect(rtl.screen.queryByText('Not sent')).toBeNull();
  });
});

describe('the price of a message, from the server (G-450)', () => {
  it('the field says "Message · 1 credit" and the button "Send · 1", from the room view', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    expect(sent).toContain(`GET /communities/${ROOM}/room`);
    expect(rtl.screen.getByTestId('composer-input').props.placeholder).toBe('Message · 1 credit');
    await type('Count me in');
    expect(rtl.screen.getByText('Send · 1')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Send message, 1 credit')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦|naira/i)).toBeNull();
  });

  it('shows the figure the server sends, not a built-in one: 3 credits reads "Message · 3 credits" and "Send · 3"', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ messageCostInCredits: 3 }))];
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    expect(rtl.screen.getByTestId('composer-input').props.placeholder).toBe('Message · 3 credits');
    await type('Count me in');
    expect(rtl.screen.getByText('Send · 3')).toBeTruthy();
  });

  it('the host sends free, so the field and the button carry no figure', async () => {
    answers[`GET /communities/${ROOM}/room`] = [ok(room({ role: 'host', messageCostInCredits: 0 }))];
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    expect(rtl.screen.getByTestId('composer-input').props.placeholder).toBe('Message');
    await type('Welcome everyone');
    expect(rtl.screen.getByText('Send')).toBeTruthy();
    expect(rtl.screen.queryByText(/^Send ·/)).toBeNull();
  });
});

describe('a room opened with no tabs underneath keeps the live connection (verifier defect 13)', () => {
  it('opens the connection itself, shows a message another account sends, and closes it when the room is left', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    // Nothing else holds the connection: no Inbox, no tab bar, as after a reload on the room, a room link or a push.
    const view = await renderRoom();
    await rtl.screen.findByText('hello');
    const socket = await connect();
    const incoming = message('from another account', 'u2');
    await rtl.act(async () => socket.say(liveMessage(incoming, 'c1')));
    expect(await rtl.screen.findByText('from another account')).toBeTruthy();
    expect(socket.readyState).toBe(1);
    await rtl.act(async () => view.unmount());
    expect(socket.readyState).toBe(3);
  });

  it('leaving the room does not close a connection the Inbox still holds', async () => {
    const { retainLive } = require('@/features/inbox/live') as typeof import('@/features/inbox/live');
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    const inbox = retainLive();
    const view = await renderRoom();
    await rtl.screen.findByText('hello');
    const socket = await connect();
    await rtl.act(async () => view.unmount());
    expect(socket.readyState).toBe(1);
    inbox();
    expect(socket.readyState).toBe(3);
  });
});

describe('a send that may have been stored is never sent, or charged, twice (verifier defect 15)', () => {
  const sendTwice = async () => {
    await rtl.screen.findByText('hello');
    await type('ok');
    await pressSend();
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
  };
  const posted = () => posts.filter((request) => request.path === `/communities/${ROOM}/messages`).length;

  it('an earlier message of the person\'s own with the same words is not taken for the one that did not land', async () => {
    const earlier = message('ok', ME);
    const later = message('ok', ME);
    // The room already holds an "ok" of theirs; the new one never reached the server.
    answers[MESSAGES] = [paged([earlier, message('hello', 'u2')])];
    await renderRoom();
    answers[`POST /communities/${ROOM}/messages`] = ['offline', created(later)];
    await sendTwice();
    expect(posted()).toBe(2);
    expect(rtl.screen.getAllByText('ok')).toHaveLength(2);
  });

  it('a 5xx may have stored the message: Send again looks for it first and posts nothing twice', async () => {
    const stored = message('ok', ME);
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([stored, message('hello', 'u2')])];
    await renderRoom();
    // The Hub stored the message and then failed to answer.
    answers[`POST /communities/${ROOM}/messages`] = [refuse(500, 'Something went wrong. Please try again.'), created(message('ok', ME))];
    await sendTwice();
    expect(posted()).toBe(1);
    expect(rtl.screen.getAllByText('ok')).toHaveLength(1);
  });

  it('another member\'s message with the same words is not taken for the person\'s own that did not land', async () => {
    // While the person's first try was unconfirmed a different member wrote "ok" too. It is not the person's message: theirs never
    // reached the server, so Send again must post it.
    const theirs = message('ok', 'u2');
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([theirs, message('hello', 'u2')])];
    await renderRoom();
    answers[`POST /communities/${ROOM}/messages`] = ['offline', created(message('ok', ME))];
    await sendTwice();
    expect(posted()).toBe(2);
    expect(rtl.screen.getAllByText('ok')).toHaveLength(1);
    expect(rtl.screen.queryByText('Not sent')).toBeNull();
  });

  it('a refusal that cannot have stored it (429) is sent again without looking first', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    answers[`POST /communities/${ROOM}/messages`] = [refuse(429, 'Too many messages. Slow down.'), created(message('ok', ME))];
    await sendTwice();
    expect(posted()).toBe(2);
    expect(sent.filter((request) => request === MESSAGES)).toHaveLength(1);
  });
});

describe('every message is sent under its own Idempotency-Key, and again under the same one (verifier defect 21)', () => {
  const POST = `POST /communities/${ROOM}/messages`;
  const KEY = /^[A-Za-z0-9_-]{8,128}$/;
  const send = async (text: string) => {
    await type(text);
    await pressSend();
  };

  it('a message goes out with a key of the shape the Hub accepts', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    answers[POST] = [created(message('hi there', ME))];
    await send('hi there');
    await rtl.screen.findByText('hi there');
    expect(postKeys).toHaveLength(1);
    expect(postKeys[0]).toMatch(KEY);
  });

  it('Send again sends the same message under the same key', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    answers[POST] = [refuse(429, 'Too many messages. Slow down.'), created(message('again please', ME))];
    await send('again please');
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(postKeys).toHaveLength(2);
    expect(postKeys[0]).toMatch(KEY);
    expect(postKeys[1]).toBe(postKeys[0]);
  });

  it('two messages never share a key, even with the same words', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    answers[POST] = [created(message('same words', ME)), created(message('same words', ME))];
    await send('same words');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('composer-input').props.value).toBe(''));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('composer-send').props.accessibilityState.disabled).toBe(true));
    await send('same words');
    await rtl.waitFor(() => expect(postKeys).toHaveLength(2));
    expect(postKeys[0]).toMatch(KEY);
    expect(postKeys[1]).toMatch(KEY);
    expect(postKeys[1]).not.toBe(postKeys[0]);
  });

  it('a message whose words were edited after a refusal is a new message with a new key', async () => {
    answers[MESSAGES] = [paged([message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    answers[POST] = [refuse(400, 'text must be shorter than or equal to 2000 characters'), created(message('shorter', ME))];
    await send('far too long');
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Edit' }));
    await send('shorter');
    await rtl.waitFor(() => expect(postKeys).toHaveLength(2));
    expect(postKeys[1]).not.toBe(postKeys[0]);
  });

  it('when the answer is lost AND the look-up of the newest page fails, the message is sent again under the same key, and shows once', async () => {
    const stored = message('stored once', ME);
    // The first try reached the Hub (stored, charged) but its answer was lost; then the look-up read cannot be made either.
    answers[MESSAGES] = [paged([message('hello', 'u2')]), 'offline'];
    await renderRoom();
    await rtl.screen.findByText('hello');
    // The Hub answers the repeat with the message it already stored (the same key).
    answers[POST] = ['offline', created(stored)];
    await send('stored once');
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(2);
    expect(postKeys).toHaveLength(2);
    expect(postKeys[0]).toMatch(KEY);
    expect(postKeys[1]).toBe(postKeys[0]);
    expect(rtl.screen.getAllByText('stored once')).toHaveLength(1);
  });

  it('when the look-up finds the message it is not sent again at all', async () => {
    const stored = message('landed already', ME);
    answers[MESSAGES] = [paged([message('hello', 'u2')]), paged([stored, message('hello', 'u2')])];
    await renderRoom();
    await rtl.screen.findByText('hello');
    answers[POST] = ['offline'];
    await send('landed already');
    await rtl.screen.findByText('Not sent');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Send again' }));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Not sent')).toBeNull());
    expect(postKeys).toHaveLength(1);
    expect(rtl.screen.getAllByText('landed already')).toHaveLength(1);
  });
});
