/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LegalThread } from '../api';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockFocused = true;
jest.mock('expo-router', () => ({
  useIsFocused: () => mockFocused,
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack }),
}));
const mockJwt = () => {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
};
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
  getAccessToken: async () => mockJwt(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/*
 * The live path with nothing in the middle mocked: the real shared live client (`@/features/inbox/live`) opens a
 * WebSocket, here a fake transport, and a real `legal.thread` frame string is fed to it. The older screen test
 * mocks `onLiveEvent`, which is how D1 (the client dropped every frame but chat ones) got through.
 */
class FakeWebSocket {
  static all: FakeWebSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  constructor(readonly url: string) {
    FakeWebSocket.all.push(this);
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.({});
    }, 0);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
    if ((JSON.parse(data) as { type: string }).type === 'auth') setTimeout(() => this.onmessage?.({ data: JSON.stringify({ type: 'ready', wawuId: 'me', cursor: 'c0' }) }), 0);
  }
  close() {
    this.readyState = 3;
  }
}
(globalThis as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
const appHandlers = new Set<(state: string) => void>();
let answers: Record<string, Answer[]> = {};
let sent: { key: string; body: unknown }[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refuse = (status: number, code: string, message: string): Answer => ({ status, body: { statusCode: status, message, reason: { code, message } } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const text = await request.clone().text();
  sent.push({ key, body: text ? JSON.parse(text) : undefined });
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { LegalChatScreen } = require('../LegalChatScreen') as typeof import('../LegalChatScreen');

const AT = '2026-10-08T10:00:00.000Z';
const OPENER = "Hi Chidi. Tell me what's going on, in your own words. I'll ask a few questions, then a consultant picks it up.";
const NOT_CHARGED = 'Nothing is charged, and no price is quoted until a consultant has read it.';
const TOPICS = [
  { id: 'topic:property', label: 'A tenancy problem' },
  { id: 'topic:business_registration', label: 'Register a business' },
  { id: 'topic:contract', label: 'Check a contract' },
  { id: 'topic:other', label: 'Something else' },
];
const line = (id: string, authorRole: 'client' | 'assistant' | 'consultant', body: string, consultantName: string | null = null) => ({ id, authorRole, body, createdAt: AT, consultantName });
const BRIEF = {
  matter: 'property',
  matterLabel: 'Tenancy',
  ready: true,
  rows: [
    { label: 'Matter', value: 'Tenancy · rent increase' },
    { label: 'Lease', value: 'Signed, 14 months left' },
    { label: 'Rent review clause', value: 'Not sure' },
    { label: 'Location', value: 'Lekki, Lagos' },
  ],
};

function thread(over: Partial<LegalThread> = {}): LegalThread {
  return {
    id: 'i1',
    stage: 'profiling',
    matter: 'other',
    matterLabel: 'Something else',
    messages: [line('a1', 'assistant', OPENER), line('a2', 'assistant', NOT_CHARGED)],
    quickReplies: TOPICS,
    brief: null,
    awaitingReply: false,
    legalRequestId: null,
    requestStatus: null,
    consultant: null,
    assistantStopped: false,
    ...over,
  };
}
const asking = (over: Partial<LegalThread> = {}) =>
  thread({
    matter: 'property',
    messages: [line('a1', 'assistant', OPENER), line('c1', 'client', 'My landlord wants to raise my rent by 60% mid-lease. Can he do that?'), line('a3', 'assistant', 'Does the lease say anything about rent reviews?')],
    quickReplies: [
      { id: 'q:clause', label: "Yes, there's a clause" },
      { id: 'q:no', label: 'No' },
      { id: 'q:unsure', label: "I'm not sure" },
    ],
    ...over,
  });
const briefReady = (over: Partial<LegalThread> = {}) =>
  asking({ stage: 'brief_ready', quickReplies: [], brief: BRIEF, messages: [line('a1', 'assistant', OPENER), line('c1', 'client', 'My rent'), line('a4', 'assistant', "Thanks. Here's what I'll pass on. Check it's right.")], ...over });
const sentThread = (over: Partial<LegalThread> = {}) =>
  briefReady({
    stage: 'sent',
    brief: BRIEF,
    legalRequestId: 'r1',
    requestStatus: 'awaiting_quote',
    messages: [line('a1', 'assistant', OPENER), line('c1', 'client', 'My rent'), line('a5', 'assistant', "I've sent your brief to a consultant.")],
    ...over,
  });
const withConsultant = (over: Partial<LegalThread> = {}) =>
  sentThread({
    consultant: { name: 'Adaora Nnaji', joinedAt: AT },
    assistantStopped: true,
    messages: [line('a1', 'assistant', OPENER), line('c1', 'client', 'My rent'), line('a5', 'assistant', "I've sent your brief to a consultant."), line('k1', 'consultant', "Hi Chidi, I've read your brief.", 'Adaora Nnaji')],
    ...over,
  });

const MINE = 'GET /legal/intake/mine';
const OPEN = 'POST /legal/assistant';
const GET = 'GET /legal/assistant/i1';
const MESSAGES = 'POST /legal/assistant/i1/messages';
const REPLY = 'POST /legal/assistant/i1/reply';
const SEND = 'POST /legal/assistant/i1/send';
const calls = (key: string) => sent.filter((s) => s.key === key);

async function renderScreen() {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <LegalChatScreen />
    </SafeAreaProvider>,
  );
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

const CATCH_UP = 'GET /live/catch-up';

beforeEach(() => {
  answers = { [MINE]: [ok([])], [OPEN]: [ok(sentThread())], [GET]: [ok(sentThread()), ok(withConsultant())], [CATCH_UP]: [ok({ events: [], cursor: 'c0', hasMore: false })] };
  sent = [];
  FakeWebSocket.all = [];
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  rtl.cleanup();
  queryClient.clear();
});

describe("S17 · the consultant's message over the real live connection (D1)", () => {
  it('a legal.thread frame from the Hub, handed to the real live client, brings the consultant message in without a refresh', async () => {
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await rtl.waitFor(() => expect(FakeWebSocket.all.length).toBeGreaterThan(0));
    await rtl.waitFor(() => expect(FakeWebSocket.all[0].sent).toContainEqual({ type: 'auth', token: expect.any(String) }));
    await rtl.act(async () => {
      await settle();
    });
    expect(rtl.screen.queryByText("Hi Chidi, I've read your brief.")).toBeNull();
    // Connecting reads the conversation once (the sync after `ready`); the frame is the second read.
    await rtl.waitFor(() => expect(calls(GET)).toHaveLength(1));
    const socket = FakeWebSocket.all[FakeWebSocket.all.length - 1];
    await rtl.act(async () => {
      socket.onmessage?.({ data: '{"type":"legal.thread","cursor":"c1","legalRequestId":"r1"}' });
      await settle();
    });
    expect(await rtl.screen.findByText("Hi Chidi, I've read your brief.")).toBeTruthy();
    expect(calls(GET)).toHaveLength(2);
  });

  it('a frame of a type the app does not know changes nothing', async () => {
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await rtl.waitFor(() => expect(FakeWebSocket.all.length).toBeGreaterThan(0));
    await rtl.act(async () => {
      await settle();
    });
    await rtl.waitFor(() => expect(calls(GET)).toHaveLength(1));
    await rtl.act(async () => {
      FakeWebSocket.all[FakeWebSocket.all.length - 1].onmessage?.({ data: '{"type":"something.else","cursor":"c1"}' });
      await settle();
    });
    expect(calls(GET)).toHaveLength(1);
    expect(rtl.screen.queryByText("Hi Chidi, I've read your brief.")).toBeNull();
  });
});
