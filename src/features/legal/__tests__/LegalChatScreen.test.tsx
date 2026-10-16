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
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  useSession: () => ({ status: 'signedIn' }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockLive = new Set<(event: unknown) => void>();
const mockSynced = new Set<() => void>();
jest.mock('@/features/inbox/live', () => ({
  retainLive: () => () => undefined,
  onLiveEvent: (listener: (event: unknown) => void) => {
    mockLive.add(listener);
    return () => mockLive.delete(listener);
  },
  onLiveSynced: (listener: () => void) => {
    mockSynced.add(listener);
    return () => mockSynced.delete(listener);
  },
}));

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
const type = async (text: string) => rtl.fireEvent.changeText(rtl.screen.getByTestId('legal-input'), text);
const press = async (testID: string) => await rtl.fireEvent.press(rtl.screen.getByTestId(testID));
const sendEnabled = () => rtl.screen.getByTestId('legal-send').props.accessibilityState.disabled === false;
/**
 * A sent message is drawn at once, dimmed, while the Hub is asked (`legal-bubble-sending`), so its words are on screen before the Hub has
 * answered. This waits until the Hub has: the dimmed copy is gone and the confirmed message has replaced it. A test that ends before then
 * leaves the request running, and its answer lands in the next test's conversation.
 */
const messageConfirmed = () => rtl.waitFor(() => expect(rtl.screen.queryByTestId('legal-bubble-sending')).toBeNull());

beforeEach(() => {
  answers = { [MINE]: [ok([])], [OPEN]: [ok(thread())] };
  sent = [];
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack = true;
  mockFocused = true;
  mockLive.clear();
  mockSynced.clear();
  appHandlers.clear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, handler: (state: string) => void) => {
    appHandlers.add(handler);
    return { remove: () => appHandlers.delete(handler) };
  }) as never);
  queryClient.clear();
  const { writeDraft } = require('../draft') as typeof import('../draft');
  writeDraft('i1', '');
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await settle();
  });
  rtl.cleanup();
  queryClient.clear();
});

describe('S14 · the assistant opens', () => {
  it('a user sees the assistant while it opens, then its two lines and the four taps', async () => {
    answers[OPEN] = ['hold'];
    await renderScreen();
    expect(await rtl.screen.findByTestId('legal-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Opening the assistant')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-composer')).toBeNull();
    answers[OPEN] = [ok(thread())];
  });

  it('draws the opener and the "nothing is charged" line the server wrote, and the taps it offers', async () => {
    await renderScreen();
    expect(await rtl.screen.findByText(OPENER)).toBeTruthy();
    expect(rtl.screen.getByText(NOT_CHARGED)).toBeTruthy();
    expect(rtl.screen.getByText('WAWU Legal')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-sub').props.children).toBe('Assistant · a consultant takes over');
    for (const t of TOPICS) expect(rtl.screen.getByRole('button', { name: t.label })).toBeTruthy();
    expect(rtl.screen.getByPlaceholderText('Type your message')).toBeTruthy();
  });

  it('the send button is disabled, and does nothing, until there are words', async () => {
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    expect(sendEnabled()).toBe(false);
    await type('   \n ');
    expect(sendEnabled()).toBe(false);
    await settle();
    expect(calls(MESSAGES)).toHaveLength(0);
    await type('Hello');
    expect(sendEnabled()).toBe(true);
  });

  it('a user can pick a quick reply: the tap is sent by its id and the assistant answers', async () => {
    answers[MESSAGES] = [ok(asking())];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'A tenancy problem' }));
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(calls(MESSAGES).map((c) => c.body)).toEqual([{ quickReplyId: 'topic:property' }]);
  });

  it('a user can type the problem: trimmed words are sent, the box empties and the answer appears', async () => {
    answers[MESSAGES] = [ok(asking())];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('  My landlord wants to raise my rent by 60% mid-lease. Can he do that?  ');
    await press('legal-send');
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(calls(MESSAGES).map((c) => c.body)).toEqual([{ body: 'My landlord wants to raise my rent by 60% mid-lease. Can he do that?' }]);
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('');
  });

  it('shows the words at once, dimmed, with the assistant replying, and a second press is not a second send', async () => {
    answers[MESSAGES] = ['hold'];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('My rent');
    await press('legal-send');
    expect(await rtl.screen.findByTestId('legal-bubble-sending')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-typing')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-taps')).toBeNull();
    expect(sendEnabled()).toBe(false);
    await type('My rent again');
    await press('legal-send');
    await rtl.fireEvent.press(rtl.screen.getByTestId('legal-send'));
    await settle();
    expect(calls(MESSAGES)).toHaveLength(1);
  });

  it('two taps in the same instant send once', async () => {
    answers[MESSAGES] = ['hold'];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    const tap = rtl.screen.getByRole('button', { name: 'A tenancy problem' });
    await rtl.fireEvent.press(tap);
    await rtl.fireEvent.press(tap);
    await settle();
    expect(calls(MESSAGES)).toHaveLength(1);
  });
});

describe('S15 · profiling', () => {
  it('a user answers in free text or with a tap, and the header reads "Assistant"', async () => {
    answers[OPEN] = [ok(asking())];
    answers[MESSAGES] = [ok(briefReady())];
    await renderScreen();
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-sub').props.children).toBe('Assistant');
    expect(rtl.screen.getByRole('button', { name: "Yes, there's a clause" })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'No' })).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: "I'm not sure" }));
    expect(await rtl.screen.findByTestId('legal-brief')).toBeTruthy();
    expect(calls(MESSAGES)[0].body).toEqual({ quickReplyId: 'q:unsure' });
  });

  it('draws no taps while the last message waits for an answer', async () => {
    answers[OPEN] = [ok(asking({ awaitingReply: true }))];
    await renderScreen();
    await rtl.screen.findByText('Does the lease say anything about rent reviews?');
    expect(rtl.screen.queryByTestId('legal-taps')).toBeNull();
  });
});

describe('S16 · the brief', () => {
  it('a user sees the brief rows as the server gave them, with "Add anything else" in the box', async () => {
    answers[OPEN] = [ok(briefReady())];
    await renderScreen();
    expect(await rtl.screen.findByText('Your brief')).toBeTruthy();
    BRIEF.rows.forEach((row, i) => {
      const node = rtl.screen.getByTestId(`legal-brief-row-${i}`);
      expect(rtl.within(node).getByText(row.label)).toBeTruthy();
      expect(rtl.within(node).getByText(row.value)).toBeTruthy();
    });
    expect(rtl.screen.getByPlaceholderText('Add anything else')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-taps')).toBeNull();
  });

  it('draws no figure the server did not send: no "Nothing is charged yet" line of its own', async () => {
    answers[OPEN] = [ok(briefReady())];
    await renderScreen();
    await rtl.screen.findByText('Your brief');
    expect(rtl.screen.queryByText(/Nothing is charged yet/)).toBeNull();
  });

  it('a user can Send to a consultant: one request, then the conversation continues with the consultant', async () => {
    answers[OPEN] = [ok(briefReady())];
    answers[SEND] = [ok(sentThread())];
    await renderScreen();
    await rtl.screen.findByText('Your brief');
    await press('legal-send-brief');
    expect(await rtl.screen.findByText("I've sent your brief to a consultant.")).toBeTruthy();
    expect(calls(SEND)).toHaveLength(1);
    expect(rtl.screen.queryByTestId('legal-brief')).toBeNull();
    expect(rtl.screen.getByTestId('legal-sub').props.children).toBe('Waiting for a consultant');
    expect(rtl.screen.getByPlaceholderText('Message a consultant')).toBeTruthy();
  });

  it('a double tap on Send sends once', async () => {
    answers[OPEN] = [ok(briefReady())];
    answers[SEND] = ['hold'];
    await renderScreen();
    await rtl.screen.findByText('Your brief');
    await press('legal-send-brief');
    await press('legal-send-brief');
    await settle();
    expect(calls(SEND)).toHaveLength(1);
  });

  it('a user can add anything else: it is sent as a message and the brief is drawn again from the answer', async () => {
    answers[OPEN] = [ok(briefReady())];
    answers[MESSAGES] = [ok(briefReady({ brief: { ...BRIEF, rows: [...BRIEF.rows, { label: 'Landlord', value: 'Wants 60% more' }] } }))];
    await renderScreen();
    await rtl.screen.findByText('Your brief');
    await type('The landlord is a company');
    await press('legal-send');
    expect(await rtl.screen.findByText('Wants 60% more')).toBeTruthy();
    expect(calls(MESSAGES)[0].body).toEqual({ body: 'The landlord is a company' });
  });

  it('a failed Send says why, in the server words, keeps the brief and can be tried again', async () => {
    answers[OPEN] = [ok(briefReady())];
    answers[SEND] = [refuse(503, 'assistant_unavailable', 'We could not prepare your brief just now. Nothing was sent. Try again in a moment.'), ok(sentThread())];
    await renderScreen();
    await rtl.screen.findByText('Your brief');
    await press('legal-send-brief');
    expect(await rtl.screen.findByText('We could not prepare your brief just now. Nothing was sent. Try again in a moment.')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-brief')).toBeTruthy();
    await press('legal-problem-action');
    expect(await rtl.screen.findByText("I've sent your brief to a consultant.")).toBeTruthy();
    expect(calls(SEND)).toHaveLength(2);
  });

  it('a brief that is not ready is not offered', async () => {
    answers[OPEN] = [ok(briefReady({ brief: { ...BRIEF, ready: false } }))];
    await renderScreen();
    await rtl.screen.findByText("Thanks. Here's what I'll pass on. Check it's right.");
    expect(rtl.screen.queryByTestId('legal-brief')).toBeNull();
    expect(rtl.screen.queryByTestId('legal-send-brief')).toBeNull();
  });
});

describe('S17 · a consultant joins', () => {
  it('a user sees the consultant by name, the notice, the label over her message and "Message Adaora"', async () => {
    answers[OPEN] = [ok(withConsultant())];
    await renderScreen();
    expect(await rtl.screen.findByText("Hi Chidi, I've read your brief.")).toBeTruthy();
    expect(rtl.screen.getByText('Adaora Nnaji')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-sub').props.children).toBe('Consultant · WAWU Legal');
    expect(rtl.screen.getByText('Adaora joined. The assistant has stopped replying.')).toBeTruthy();
    expect(rtl.screen.getByText('Adaora Nnaji · Consultant')).toBeTruthy();
    expect(rtl.screen.getByPlaceholderText('Message Adaora')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-taps')).toBeNull();
    expect(rtl.screen.queryByText('Book a consultation')).toBeNull();
  });

  it('a user can Message Adaora: the words go to the messages route and no assistant is waited on', async () => {
    answers[OPEN] = [ok(withConsultant())];
    const next = withConsultant({ messages: [...withConsultant().messages, line('c2', 'client', 'Thank you')] });
    answers[MESSAGES] = [ok(next)];
    await renderScreen();
    await rtl.screen.findByText("Hi Chidi, I've read your brief.");
    await type('Thank you');
    await press('legal-send');
    await messageConfirmed();
    expect(await rtl.screen.findByText('Thank you')).toBeTruthy();
    expect(calls(MESSAGES)[0].body).toEqual({ body: 'Thank you' });
  });

  it("a consultant's message arrives without a refresh when the live connection says the conversation changed", async () => {
    answers[OPEN] = [ok(sentThread())];
    answers[GET] = [ok(withConsultant())];
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    expect(rtl.screen.queryByText('Adaora joined. The assistant has stopped replying.')).toBeNull();
    await rtl.act(async () => {
      mockLive.forEach((listener) => listener({ type: 'legal.thread' }));
      await settle();
    });
    expect(await rtl.screen.findByText('Adaora joined. The assistant has stopped replying.')).toBeTruthy();
    expect(rtl.screen.getByPlaceholderText('Message Adaora')).toBeTruthy();
  });

  it('an unrelated live event does not read the conversation again', async () => {
    answers[OPEN] = [ok(sentThread())];
    answers[GET] = [ok(withConsultant())];
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await rtl.act(async () => {
      mockLive.forEach((listener) => listener({ type: 'chat.message' }));
      await settle();
    });
    expect(calls(GET)).toHaveLength(0);
  });

  it('the conversation is read again when the live connection comes back', async () => {
    answers[OPEN] = [ok(sentThread())];
    answers[GET] = [ok(withConsultant())];
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await rtl.act(async () => {
      mockSynced.forEach((listener) => listener());
      await settle();
    });
    expect(await rtl.screen.findByText('Adaora joined. The assistant has stopped replying.')).toBeTruthy();
    expect(calls(GET)).toHaveLength(1);
  });

  it('the conversation is read again when the app returns to the foreground, not when it goes to the background', async () => {
    answers[OPEN] = [ok(sentThread())];
    answers[GET] = [ok(withConsultant())];
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await rtl.act(async () => {
      appHandlers.forEach((h) => h('background'));
      await settle();
    });
    expect(calls(GET)).toHaveLength(0);
    await rtl.act(async () => {
      appHandlers.forEach((h) => h('active'));
      await settle();
    });
    expect(calls(GET)).toHaveLength(1);
    expect(await rtl.screen.findByText('Adaora joined. The assistant has stopped replying.')).toBeTruthy();
  });

  it('a conversation shown again (the person came back to it) is read again, not drawn stale', async () => {
    answers[OPEN] = [ok(sentThread())];
    answers[GET] = [ok(withConsultant())];
    const screen = await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await screen.unmount();
    await renderScreen();
    expect(await rtl.screen.findByText('Adaora joined. The assistant has stopped replying.')).toBeTruthy();
  });

  it('a failed refresh keeps the conversation on screen and says so, with a way to try again', async () => {
    answers[OPEN] = [ok(sentThread())];
    // Three tries (the app's own retry rule for a lost connection), then the person's own "Try again".
    answers[GET] = ['offline', 'offline', 'offline', ok(withConsultant())];
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    // The app waits 1 s and 2 s between its tries; from here the clock is the test's, so a slow machine does not stretch those 3 s.
    // `queueMicrotask` stays real: React's `act` queues its "was it awaited?" check on it, and a faked one runs that check
    // inside the next `advanceTimersByTime`, before the `await` has reached the act, and prints a warning that is not true.
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      await rtl.act(async () => {
        mockSynced.forEach((listener) => listener());
      });
      for (let i = 0; i < 80 && !rtl.screen.queryByTestId('legal-stale'); i += 1) {
        await rtl.act(async () => {
          await Promise.resolve();
          jest.advanceTimersByTime(100);
        });
      }
      expect(rtl.screen.getByTestId('legal-stale')).toBeTruthy();
      expect(rtl.screen.getByText("I've sent your brief to a consultant.")).toBeTruthy();
      await press('legal-stale-action');
      expect(await rtl.screen.findByText('Adaora joined. The assistant has stopped replying.')).toBeTruthy();
      expect(rtl.screen.queryByTestId('legal-stale')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('when the Hub holds no name the header says "Consultant" and the box says "Message your consultant"', async () => {
    answers[OPEN] = [ok(withConsultant({ consultant: { name: null, joinedAt: AT }, messages: [line('k1', 'consultant', 'Hello', null)] }))];
    await renderScreen();
    await rtl.screen.findByText('Hello');
    expect(rtl.screen.getAllByText('Consultant')).toHaveLength(2);
    expect(rtl.screen.getByText('A consultant joined. The assistant has stopped replying.')).toBeTruthy();
    expect(rtl.screen.getByPlaceholderText('Message your consultant')).toBeTruthy();
  });
});

describe('the matter before payment', () => {
  const intake = (id: string, status: string, legalRequestId: string | null) => ({ id, matter: 'property', matterLabel: 'Tenancy', status, answers: {}, documents: [], questions: [], outstandingRequired: [], brief: null, legalRequestId });

  it('a user who sent a brief and leaves comes back to the same conversation, awaiting a quote, with nothing paid', async () => {
    answers[MINE] = [ok([intake('i1', 'complete', 'r1')])];
    answers[GET] = [ok(sentThread())];
    await renderScreen();
    expect(await rtl.screen.findByText("I've sent your brief to a consultant.")).toBeTruthy();
    expect(calls(OPEN)).toHaveLength(0);
    expect(calls(GET)).toHaveLength(1);
    expect(rtl.screen.getByPlaceholderText('Message a consultant')).toBeTruthy();
  });

  it('writes to the consultant before any payment', async () => {
    answers[MINE] = [ok([intake('i1', 'complete', 'r1')])];
    answers[GET] = [ok(sentThread())];
    answers[MESSAGES] = [ok(sentThread({ messages: [...sentThread().messages, line('c9', 'client', 'Any news?')] }))];
    await renderScreen();
    await rtl.screen.findByText("I've sent your brief to a consultant.");
    await type('Any news?');
    await press('legal-send');
    await messageConfirmed();
    expect(await rtl.screen.findByText('Any news?')).toBeTruthy();
  });

  it('a conversation whose matter has moved past "awaiting a quote" is not reopened: a new one starts', async () => {
    answers[MINE] = [ok([intake('i1', 'complete', 'r1')])];
    answers[GET] = [ok(sentThread({ requestStatus: 'quoted' }))];
    answers[OPEN] = [ok(thread({ id: 'i2' }))];
    await renderScreen();
    expect(await rtl.screen.findByText(OPENER)).toBeTruthy();
    expect(calls(OPEN)).toHaveLength(1);
  });

  it('an unfinished conversation is picked up, an older form intake that answers 404 is passed over', async () => {
    answers[MINE] = [ok([intake('f1', 'in_progress', null), intake('i1', 'in_progress', null)])];
    answers['GET /legal/assistant/f1'] = [refuse(404, 'not_found', 'This conversation could not be found.')];
    answers[GET] = [ok(asking())];
    await renderScreen();
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(calls(OPEN)).toHaveLength(0);
  });

  it('a person with nothing earlier gets a new conversation, and an intake that is not theirs to ask for is never read twice', async () => {
    answers[MINE] = [ok([intake('f1', 'complete', null)])];
    await renderScreen();
    expect(await rtl.screen.findByText(OPENER)).toBeTruthy();
    expect(sent.filter((s) => s.key.startsWith('GET /legal/assistant/'))).toHaveLength(0);
  });
});

describe('when the assistant is slow, a send fails, or the network is gone', () => {
  it('a 503 keeps the message, shows it, and offers "Ask again"; asking again gets the answer', async () => {
    answers[MESSAGES] = [refuse(503, 'assistant_unavailable', 'The assistant could not answer just now. Your message is saved.')];
    answers[GET] = [ok(thread({ messages: [...thread().messages, line('c1', 'client', 'My rent')], quickReplies: [], awaitingReply: true }))];
    answers[REPLY] = [ok(asking())];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('My rent');
    await press('legal-send');
    expect(await rtl.screen.findByTestId('legal-slow')).toBeTruthy();
    expect(rtl.screen.getByText('My rent')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('');
    expect(rtl.screen.queryByTestId('legal-problem')).toBeNull();
    await press('legal-slow-action');
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(calls(REPLY)).toHaveLength(1);
    expect(rtl.screen.queryByTestId('legal-slow')).toBeNull();
  });

  it('when asking again fails too, the server words are shown with a way to try again', async () => {
    answers[OPEN] = [ok(thread({ messages: [...thread().messages, line('c1', 'client', 'My rent')], quickReplies: [], awaitingReply: true }))];
    answers[REPLY] = [refuse(503, 'assistant_unavailable', 'Still no answer.'), ok(asking())];
    await renderScreen();
    await rtl.screen.findByTestId('legal-slow');
    await press('legal-slow-action');
    expect(await rtl.screen.findByText('Still no answer.')).toBeTruthy();
    await press('legal-problem-action');
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(calls(REPLY)).toHaveLength(2);
  });

  it('a send that fails on the network puts the words back in the box, says so, and "Try again" sends them', async () => {
    answers[MESSAGES] = ['offline', ok(asking())];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('My landlord wants more rent');
    await press('legal-send');
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('My landlord wants more rent');
    expect(rtl.screen.queryByTestId('legal-bubble-sending')).toBeNull();
    expect(sendEnabled()).toBe(true);
    await press('legal-problem-action');
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(calls(MESSAGES).map((c) => c.body)).toEqual([{ body: 'My landlord wants more rent' }, { body: 'My landlord wants more rent' }]);
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('');
    expect(rtl.screen.queryByTestId('legal-problem')).toBeNull();
  });

  it('words typed while a send was failing are kept after the failed ones, never overwritten', async () => {
    answers[MESSAGES] = ['hold'];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('First');
    await press('legal-send');
    await rtl.screen.findByTestId('legal-bubble-sending');
    await type('Second');
    answers[MESSAGES] = ['offline'];
    await rtl.act(async () => {
      await queryClient.cancelQueries();
    });
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('Second');
  });

  it('a message that is too long, or a conversation that is full, shows the server words and no "Try again", and keeps the draft', async () => {
    answers[MESSAGES] = [refuse(400, 'validation', 'body must be shorter than or equal to 2000 characters'), refuse(409, 'assistant_conversation_full', 'This conversation is full. Send your brief to a consultant.')];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('x'.repeat(10));
    await press('legal-send');
    expect(await rtl.screen.findByText('body must be shorter than or equal to 2000 characters')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-problem-action')).toBeNull();
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('xxxxxxxxxx');
    await press('legal-send');
    expect(await rtl.screen.findByText('This conversation is full. Send your brief to a consultant.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-problem-action')).toBeNull();
  });

  it('one refusal does not stop the others: a refused tap leaves the box and the other taps working', async () => {
    answers[MESSAGES] = [refuse(400, 'quick_reply_unknown', 'That answer is no longer on offer. Type your answer instead.'), ok(asking())];
    answers[GET] = [ok(thread())];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'A tenancy problem' }));
    expect(await rtl.screen.findByText('That answer is no longer on offer. Type your answer instead.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-problem-action')).toBeNull();
    await type('My rent');
    await press('legal-send');
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-problem')).toBeNull();
  });

  it('a busy assistant (409) reads the conversation again and offers to try again', async () => {
    answers[MESSAGES] = [refuse(409, 'assistant_busy', 'The assistant is already working on this conversation. Wait a moment, then try again.'), ok(asking())];
    answers[GET] = [ok(thread())];
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('My rent');
    await press('legal-send');
    expect(await rtl.screen.findByText(/already working on this conversation/)).toBeTruthy();
    expect(calls(GET)).toHaveLength(1);
    await press('legal-problem-action');
    expect(await rtl.screen.findByText('Does the lease say anything about rent reviews?')).toBeTruthy();
  });
});

describe('when the assistant cannot be opened', () => {
  it('offline: says so, and "Try again" opens it', async () => {
    answers[MINE] = ['offline', 'offline', 'offline', ok([])];
    await renderScreen();
    expect(await rtl.screen.findByText("You're offline", {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Check your connection, then try again.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-composer')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText(OPENER)).toBeTruthy();
  }, 20000);

  it('the Hub failing: says so in its own words and offers to try again', async () => {
    answers[MINE] = [ok([])];
    answers[OPEN] = [refuse(429, 'assistant_rate_limited', 'The assistant could not open this conversation a few times just now. Try again a little later.'), ok(thread())];
    await renderScreen();
    expect(await rtl.screen.findByText("The assistant didn't open")).toBeTruthy();
    expect(rtl.screen.getByText(/Try again a little later/)).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByText(OPENER)).toBeTruthy();
  });

  it('the back button works while it is loading and when it failed', async () => {
    answers[MINE] = [refuse(500, 'x', 'Boom')];
    await renderScreen();
    await press('legal-back');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('leaving and coming back', () => {
  it('the back button goes back, or to Home when there is nothing to go back to', async () => {
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    await press('legal-back');
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    mockCanGoBack = false;
    await press('legal-back');
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('words typed and not sent are still in the box when the person leaves and returns', async () => {
    answers[GET] = [ok(thread())];
    const screen = await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('Half a thought');
    await press('legal-back');
    await screen.unmount();
    await renderScreen();
    await rtl.screen.findByText(OPENER);
    // The screen draws the conversation it held while it reads it again; the test ends once that read has landed.
    await rtl.waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('Half a thought');
    expect(sendEnabled()).toBe(true);
  });

  it('a sent message is not left behind as a draft', async () => {
    answers[MESSAGES] = [ok(asking())];
    answers[GET] = [ok(asking())];
    const screen = await renderScreen();
    await rtl.screen.findByText(OPENER);
    await type('My rent');
    await press('legal-send');
    await rtl.screen.findByText('Does the lease say anything about rent reviews?');
    await screen.unmount();
    await renderScreen();
    await rtl.screen.findByText('Does the lease say anything about rent reviews?');
    await rtl.waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(rtl.screen.getByTestId('legal-input').props.value).toBe('');
  });
});
