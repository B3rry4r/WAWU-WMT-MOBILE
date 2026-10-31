/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { CommunityMessage } from '../api';

// MOD-ROOMS (R-122): the host's tools in their own room, the muted member's line, and the Hub's word-filter refusal, with the real room
// screen and the real handlers (press and hold, the confirm sheets, the Android back button, the keyboard's composer), on both phones.
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
const mockPick = jest.fn();
jest.mock('@/features/profile-edit/pickImage', () => ({ pickImage: () => mockPick(), canPickImage: true }));

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
const { RoomScreen } = require('../RoomScreen') as typeof import('../RoomScreen');

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
  messageCostInCredits: 0,
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

/** What the Hub says each kind costs (R-62): text and emoji free, a photo 1, a video and a voice note 3. */
const costs = (over: object = {}) => ({ creditsPerMessage: 0, creditsByKind: { text: 0, photo: 1, video: 3, voice: 3, ...over } });
const credits = (creditBalance: number) => ok({ userWawuId: ME, creditBalance, trialEndsAt: null });
const me = ok({ wawuUserId: ME, firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null, verification });
const MESSAGES = `GET /communities/${ROOM}/messages?page=1&perPage=20`;

function serve(extra: Record<string, Answer[]> = {}) {
  answers = {
    [`GET /communities/${ROOM}/room`]: [ok(room())],
    'GET /credits': [credits(48)],
    'GET /communities/message-cost': [ok(costs())],
    'GET /users/me': [me],
    [`POST /communities/${ROOM}/read`]: [ok({ communityId: ROOM, lastReadAt: new Date().toISOString() })],
    'GET /inbox/unread': [ok({ total: 0, chats: 0, paidDms: 0, communities: 0 })],
    'GET /live/catch-up': [ok({ events: [], cursor: 'c0', hasMore: false })],
    ...extra,
  };
}

/*
 * SWEEP-APP-3 row 128 (ME-13 L4): the first render in this file pays for the renderer's start and React Native's lazily loaded components,
 * which on a loaded machine and a cold transform cache ran past a test's 20 s. It is paid here, in a hook with a budget of its own.
 */
beforeAll(async () => {
  const warm = await rtl.render(<View />);
  await warm.unmount();
}, 120_000);

const back = jest.fn();
async function renderRoom(signedIn = true) {
  if (signedIn) await adoptSession({ accessToken: token, refreshToken: 'r' });
  return rtl.render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
        <RoomScreen id={ROOM} onBack={back} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}

const type = async (text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId('composer-input'), text);
const pressSend = async () => rtl.fireEvent.press(rtl.screen.getByTestId('composer-send'));



beforeEach(() => {
  mockPick.mockReset();
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



const MODERATION = `GET /communities/${ROOM}/moderation`;
const mute = (muted: boolean, mutedMembers: string[] = []) => ok({ muted, mutedMembers });
const hostRoom = () => ok(room({ hostWawuId: ME, role: 'host' }));
const serveHost = (extra: Record<string, Answer[]> = {}) => {
  serve({ [`GET /communities/${ROOM}/room`]: [hostRoom()], [MODERATION]: [mute(false)], ...extra });
};
const hold = async (id: string) => rtl.fireEvent(await rtl.screen.findByTestId(`post-${id}`), 'longPress');

describe.each(['android', 'ios'] as const)('MOD-ROOMS: a room on %s', (os) => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', os);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('the host', () => {
    it('presses and holds a member\'s message: Report, Delete message and Mute {name}; their own message offers only Delete', async () => {
      serveHost({ [MESSAGES]: [paged([message('from the member', 'u2'), message('from the host', ME)])] });
      await renderRoom();
      await hold('m1');
      expect(await rtl.screen.findByTestId('host-menu-report')).toBeTruthy();
      expect(rtl.screen.getByText('Delete message')).toBeTruthy();
      expect(rtl.screen.getByText('Mute Tolu Balogun')).toBeTruthy();
      await rtl.fireEvent(await rtl.screen.findByTestId('host-menu'), 'requestClose');
      await rtl.waitFor(() => expect(rtl.screen.queryByTestId('host-menu-delete')).toBeNull());
      await hold('m2');
      expect(await rtl.screen.findByTestId('host-menu-delete')).toBeTruthy();
      expect(rtl.screen.queryByTestId('host-menu-report')).toBeNull();
      expect(rtl.screen.queryByTestId('host-menu-mute')).toBeNull();
    });

    it('Delete message asks first; Cancel sends nothing; Delete sends one request and the message leaves the room', async () => {
      serveHost({
        [MESSAGES]: [paged([message('rude words', 'u2'), message('kind words', 'u2')])],
        [`DELETE /communities/${ROOM}/messages/m1`]: [ok({ removed: true })],
      });
      await renderRoom();
      await rtl.screen.findByText('rude words');
      await hold('m1');
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-delete'));
      expect(await rtl.screen.findByText('Delete this message?')).toBeTruthy();
      expect(rtl.screen.getByText('It disappears for everyone in this room. This cannot be undone.')).toBeTruthy();
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-menu-delete-no'));
      expect(sent.filter((line) => line.startsWith('DELETE'))).toEqual([]);
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-delete'));
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-menu-delete-yes'));
      await rtl.waitFor(() => expect(rtl.screen.queryByText('rude words')).toBeNull());
      expect(sent.filter((line) => line.startsWith('DELETE'))).toEqual([`DELETE /communities/${ROOM}/messages/m1`]);
      expect(rtl.screen.getByText('kind words')).toBeTruthy();
      expect(rtl.screen.queryByTestId('host-menu')).toBeNull();
    });

    it('a delete the Hub did not take says so, keeps the sheet and keeps the message', async () => {
      serveHost({
        [MESSAGES]: [paged([message('rude words', 'u2')])],
        [`DELETE /communities/${ROOM}/messages/m1`]: [refuse(500, 'Boom')],
      });
      await renderRoom();
      await hold('m1');
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-delete'));
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-menu-delete-yes'));
      expect(await rtl.screen.findByText('Could not do that. Try again.')).toBeTruthy();
      expect(rtl.screen.getByText('rude words')).toBeTruthy();
    });

    it('Mute asks first, then mutes, and the menu then says Unmute; Unmute asks first and lifts it', async () => {
      serveHost({
        [MESSAGES]: [paged([message('a message', 'u2')])],
        [MODERATION]: [mute(false), mute(false, ['u2']), mute(false)],
        [`PUT /communities/${ROOM}/mutes/u2`]: [ok({ muted: true })],
        [`DELETE /communities/${ROOM}/mutes/u2`]: [ok({ muted: false })],
      });
      await renderRoom();
      await hold('m1');
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-mute'));
      expect(await rtl.screen.findByText('Mute Tolu Balogun?')).toBeTruthy();
      expect(rtl.screen.getByText(/They can still read this room, but they cannot send messages in it until you unmute them/)).toBeTruthy();
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-menu-mute-no'));
      expect(sent.filter((line) => line.startsWith('PUT'))).toEqual([]);
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-mute'));
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-menu-mute-yes'));
      await rtl.waitFor(() => expect(sent).toContain(`PUT /communities/${ROOM}/mutes/u2`));
      await rtl.waitFor(() => expect(rtl.screen.queryByTestId('host-menu')).toBeNull());
      await hold('m1');
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-unmute'));
      expect(await rtl.screen.findByText('Unmute Tolu Balogun?')).toBeTruthy();
      await rtl.fireEvent.press(rtl.screen.getByTestId('host-menu-unmute-yes'));
      await rtl.waitFor(() => expect(sent).toContain(`DELETE /communities/${ROOM}/mutes/u2`));
    });

    it('the host\'s Report row opens the report sheet', async () => {
      serveHost({ [MESSAGES]: [paged([message('a message', 'u2')])] });
      await renderRoom();
      await hold('m1');
      await rtl.fireEvent.press(await rtl.screen.findByTestId('host-menu-report'));
      expect(await rtl.screen.findByText('Report this message')).toBeTruthy();
    });
  });

  describe('a member', () => {
    it('presses and holds another member\'s message and gets the report sheet at once, with no host menu; the moderation state is read but never shown', async () => {
      serve({ [MESSAGES]: [paged([message('a message', 'u2')])], [MODERATION]: [mute(false)] });
      await renderRoom();
      await hold('m1');
      expect(await rtl.screen.findByText('Report this message')).toBeTruthy();
      expect(rtl.screen.queryByTestId('host-menu')).toBeNull();
      expect(rtl.screen.queryByText('Delete message')).toBeNull();
      expect(rtl.screen.getByTestId('composer-input')).toBeTruthy();
    });

    it('muted by the host: one calm line in place of the composer, and the room still reads', async () => {
      serve({ [MESSAGES]: [paged([message('still readable', 'u2')])], [MODERATION]: [mute(true)] });
      await renderRoom();
      expect(await rtl.screen.findByText('still readable')).toBeTruthy();
      expect(await rtl.screen.findByTestId('room-muted')).toBeTruthy();
      expect(rtl.screen.getByText('The host has muted you in this room. You can still read it.')).toBeTruthy();
      expect(rtl.screen.queryByTestId('composer-input')).toBeNull();
      expect(rtl.screen.queryByTestId('composer-send')).toBeNull();
    });

    it('muted while the room is open: the refused send leaves no "Not sent" bubble, and the line takes the composer\'s place', async () => {
      serve({
        [MESSAGES]: [paged([message('hello', 'u2')])],
        [MODERATION]: [mute(false), mute(true)],
        [`POST /communities/${ROOM}/messages`]: [refuse(403, 'The host has muted you in this room.', { reason: { code: 'muted_in_room', message: 'The host has muted you in this room.' } })],
      });
      await renderRoom();
      await rtl.screen.findByText('hello');
      await type('can I still talk?');
      await pressSend();
      expect(await rtl.screen.findByTestId('room-muted')).toBeTruthy();
      expect(rtl.screen.queryByText('Not sent')).toBeNull();
      expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(1);
    });

    it('a message with a word the Hub does not allow: its own sentence under the bubble, nothing stored, Edit puts the words back in the field', async () => {
      const sentence = "That has words we don't allow on Who Made This. Change them and try again.";
      serve({
        [MESSAGES]: [paged([message('hello', 'u2')])],
        [MODERATION]: [mute(false)],
        [`POST /communities/${ROOM}/messages`]: [refuse(400, sentence, { reason: { code: 'content_blocked', message: sentence } })],
      });
      await renderRoom();
      await rtl.screen.findByText('hello');
      await type('a rude sentence');
      await pressSend();
      expect(await rtl.screen.findByText('Not sent')).toBeTruthy();
      expect(rtl.screen.getByText(sentence)).toBeTruthy();
      expect(rtl.screen.queryByRole('button', { name: 'Send again' })).toBeNull();
      await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Edit' }));
      expect(rtl.screen.getByTestId('composer-input').props.value).toBe('a rude sentence');
      expect(rtl.screen.queryByText('Not sent')).toBeNull();
      expect(posts.filter((request) => request.path === `/communities/${ROOM}/messages`)).toHaveLength(1);
    });
  });
});
