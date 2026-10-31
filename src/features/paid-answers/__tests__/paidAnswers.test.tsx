/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * The creator's side of paid questions (INBOX-18: I9, I10, I11) on the real screens with the Hub as a stand-in `fetch` that answers in
 * the contract's shapes and records every call. The attacks are the ones a write has to survive: a double tap on Reply, an answer the
 * window has closed on, an answer whose reply was lost on the way back, and a Hub that holds no share.
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const MIN = 60_000;
const HOUR = 60 * MIN;
const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const person = (wawuId: string, name: string) => ({ wawuId, name, handle: null, avatarUrl: null, verification });
const BISI = person('fan-bisi', 'Bisi Akande');
const EMEKA = person('fan-emeka', 'Emeka Obi');
const SADE = person('fan-sade', 'Sade Lawal');

type EarningState = 'pending' | 'on_its_way' | 'waiting_for_wallet' | 'in_wallet';
type Q = {
  id: string;
  text: string;
  amountKobo: number;
  status: 'awaiting_response' | 'responded' | 'refunded';
  mine: boolean;
  sentAt: string;
  deadlineAt: string;
  respondedAt: string | null;
  replies: { id: string; text: string; createdAt: string }[];
  creatorEarning: { amountKobo: number; sharePct: number; state: EarningState } | null;
};

const hub = {
  accountType: 'creator' as string | null,
  waiting: { count: 3, amountKobo: 450_000 },
  queue: [] as Record<string, unknown>[],
  queueFails: 0,
  inbox: [] as Record<string, unknown>[],
  thread: { other: BISI, questions: [] as Q[] },
  threadStatus: 200,
  /** What the answer does: the Hub takes it, refuses it as late, drops the line before it arrives, or after it was written. */
  replyMode: 'ok' as 'ok' | 'late' | 'lost_before' | 'lost_after' | 'slow',
  afterState: 'on_its_way' as EarningState,
  replies: [] as { id: string; text: string }[],
  /** The `Idempotency-Key` each reply request carried, in order (null when the request carried none). */
  keys: [] as (string | null)[],
  /** How far the Hub's clock is from the device's: a reply's `createdAt` is made this many ms away from now. */
  skewMs: 0,
  chats: 0,
  /** FIX-109: the questions reported, the people blocked, and how the Hub answers each. */
  reports: [] as string[],
  blocks: [] as string[],
  reportMode: 'ok' as 'ok' | 'dup' | 'fail',
  blockMode: 'ok' as 'ok' | 'fail',
};

const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ statusCode: status, message: 'OK', data }), { status, headers: { 'content-type': 'application/json' } });
const refuse = (status: number, message: string) => new Response(JSON.stringify({ data: null, statusCode: status, message }), { status, headers: { 'content-type': 'application/json' } });

function question(over: Partial<Q> = {}): Q {
  return {
    id: 'q1',
    text: 'How do I price a logo for a bank? They asked for a quote by Friday.',
    amountKobo: 150_000,
    status: 'awaiting_response',
    mine: false,
    sentAt: new Date(Date.now() - 49 * MIN).toISOString(),
    deadlineAt: new Date(Date.now() + 72 * MIN + 30_000).toISOString(),
    respondedAt: null,
    replies: [],
    creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'pending' },
    ...over,
  };
}

function applyReply(q: Q, text: string) {
  q.status = 'responded';
  q.respondedAt = new Date().toISOString();
  q.replies.push({ id: `r${q.replies.length + 1}`, text, createdAt: new Date(Date.now() + hub.skewMs).toISOString() });
  if (q.creatorEarning) q.creatorEarning = { ...q.creatorEarning, state: hub.afterState };
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  if (key === 'GET /users/me') return ok({ accountType: hub.accountType });
  if (key === 'GET /paid-dm/waiting') return ok(hub.waiting);
  if (key === 'GET /paid-dm/queue') {
    if (hub.queueFails > 0) {
      hub.queueFails -= 1;
      return refuse(400, 'Bad request');
    }
    return ok({ items: hub.queue, nextCursor: null, waitingTotal: hub.waiting.count });
  }
  if (key === 'GET /inbox') return ok({ items: hub.inbox, nextCursor: null });
  const thread = /^GET \/paid-dm\/threads\/(.+)$/.exec(key);
  if (thread) {
    if (hub.threadStatus !== 200) return refuse(hub.threadStatus, 'No paid questions with this person');
    return ok({ thread: { other: hub.thread.other, side: 'creator', questionCount: hub.thread.questions.length, waitingCount: 1, nextDeadlineAt: null, lastActivityAt: new Date().toISOString(), lastText: '', lastTextMine: false }, questions: hub.thread.questions.slice().reverse(), nextCursor: null });
  }
  const reply = /^POST \/paid-dm\/questions\/(.+)\/replies$/.exec(key);
  if (reply) {
    const body = (await request.json()) as { text: string };
    hub.replies.push({ id: reply[1], text: body.text });
    hub.keys.push(request.headers.get('idempotency-key'));
    const q = hub.thread.questions.find((x) => x.id === reply[1])!;
    if (hub.replyMode === 'lost_before') throw new TypeError('Network request failed');
    if (hub.replyMode === 'late') {
      q.status = 'refunded';
      q.creatorEarning = null;
      return refuse(409, `The ${24}-hour response window for this direct message has passed.`);
    }
    if (hub.replyMode === 'slow') await new Promise((resolve) => setTimeout(resolve, 150));
    applyReply(q, body.text);
    if (hub.replyMode === 'lost_after') throw new TypeError('Network request failed');
    return ok(q, 201);
  }
  if (key === 'POST /reports') {
    // REPORT-UGC: the paid thread's Report is the shared sheet; it posts to the one report route (kind direct_message).
    const body = (await request.json()) as { kind: string; targetId: string; reason: string };
    hub.reports.push(`${body.kind}:${body.targetId}:${body.reason}`);
    if (hub.reportMode === 'fail') return refuse(500, 'Something went wrong');
    return ok({ id: 'rep-1', kind: body.kind, targetId: body.targetId, reason: body.reason, status: 'open', createdAt: new Date().toISOString(), alreadyReported: hub.reportMode === 'dup' }, 200);
  }
  if (key === 'POST /chats') {
    hub.chats += 1;
    return ok({ id: 'chat-9' });
  }
  const report = /^POST \/dm\/(.+)\/report$/.exec(key);
  if (report) {
    hub.reports.push(report[1]);
    if (hub.reportMode === 'dup') return refuse(409, 'You have already reported this thread');
    if (hub.reportMode === 'fail') return refuse(500, 'Something went wrong');
    return ok({ id: 'rep-1', createdAt: new Date().toISOString(), threadId: report[1], reporterWawuId: 'me' }, 201);
  }
  if (key === 'POST /settings/privacy/blocked') {
    const body = (await request.json()) as { blockedWawuId: string };
    hub.blocks.push(body.blockedWawuId);
    if (hub.blockMode === 'fail') return refuse(500, 'Something went wrong');
    return ok({ id: 'blk-1', userWawuId: 'me', blockedWawuId: body.blockedWawuId, blockedAt: new Date().toISOString(), blockedUser: null }, 201);
  }
  throw new Error(`no answer for ${key}`);
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { PaidQueueView } = require('../PaidQueueView') as typeof import('../PaidQueueView');
const { PaidThreadScreen } = require('../PaidThreadScreen') as typeof import('../PaidThreadScreen');
const { InboxScreen } = require('@/features/inbox/InboxScreen') as typeof import('@/features/inbox/InboxScreen');

rtl.configure({ asyncUtilTimeout: 5000 });

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const draw = (child: React.ReactElement) => rtl.render(<SafeAreaProvider initialMetrics={frame}>{child}</SafeAreaProvider>);
const words = (id: string): string => {
  const children = rtl.screen.getByTestId(id).props.children as unknown;
  return Array.isArray(children) ? children.join('') : String(children);
};

beforeEach(() => {
  queryClient.clear();
  mockPush.mockClear();
  Object.assign(hub, {
    accountType: 'creator',
    waiting: { count: 3, amountKobo: 450_000 },
    queue: [],
    queueFails: 0,
    inbox: [],
    thread: { other: BISI, questions: [] },
    threadStatus: 200,
    replyMode: 'ok',
    afterState: 'on_its_way',
    replies: [],
    keys: [],
    skewMs: 0,
    chats: 0,
    reports: [],
    blocks: [],
    reportMode: 'ok',
    blockMode: 'ok',
  });
});

const queueItem = (id: string, sender: ReturnType<typeof person>, text: string, leftMs: number) => ({
  id,
  text,
  amountKobo: 150_000,
  sentAt: new Date(Date.now() - HOUR).toISOString(),
  deadlineAt: new Date(Date.now() + leftMs).toISOString(),
  sender,
});

describe('I9 · Paid DMs, to answer', () => {
  it('a creator sees what waits on them in the Hub totals, soonest first, red under 2 hours, and can open a question and Settings', async () => {
    // Two rows are read; the Hub says three questions are waiting and ₦4,500 is owed: the card shows the Hub's figures, not the rows'.
    hub.queue = [queueItem('q1', BISI, 'How do I price a logo for a bank?', 72 * MIN + 30_000), queueItem('q2', EMEKA, 'Is a 50% deposit normal for retainers?', 9 * HOUR + 4 * MIN + 30_000)];
    const onOpenSettings = jest.fn();
    await draw(<PaidQueueView onOpenSettings={onOpenSettings} />);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-queue-card')).toBeTruthy());
    expect(rtl.screen.getByTestId('paid-queue-total').props.accessibilityLabel).toBeDefined();
    expect(words('paid-queue-count')).toBe('from 3 questions');
    expect(rtl.screen.getByText('Waiting on your reply')).toBeTruthy();
    expect(rtl.screen.getByText('Bisi Akande')).toBeTruthy();
    expect(rtl.screen.getByText('1h 12m left')).toBeTruthy();
    expect(rtl.screen.getByText('9h 04m left')).toBeTruthy();
    // Hub order is kept (soonest first).
    const rows = rtl.screen.getAllByTestId(/^paid-row-q\d$/);
    expect(rows.map((r) => r.props.testID)).toEqual(['paid-row-q1', 'paid-row-q2']);

    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-queue-settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-row-q1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/paid-questions/[wawuId]', params: { wawuId: 'fan-bisi', question: 'q1' } });
  });

  it('an inbox with nothing waiting says so and offers Paid message settings', async () => {
    hub.waiting = { count: 0, amountKobo: 0 };
    const onOpenSettings = jest.fn();
    await draw(<PaidQueueView onOpenSettings={onOpenSettings} />);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-queue-empty')).toBeTruthy());
    expect(rtl.screen.queryByTestId('paid-queue-card')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByText('Paid message settings'));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('a failed read says so with Try again, and Try again reads it again', async () => {
    hub.queueFails = 1;
    hub.queue = [queueItem('q3', SADE, 'Can you review my portfolio site?', 21 * HOUR + 40 * MIN + 30_000)];
    await draw(<PaidQueueView onOpenSettings={jest.fn()} />);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-queue-error')).toBeTruthy());
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-row-q3')).toBeTruthy());
    expect(rtl.screen.getByText('21h 40m left')).toBeTruthy();
  });
});

describe('I10 · Reply and I11 · Answered', () => {
  const open = (focusQuestion?: string) => {
    const onOpenChat = jest.fn();
    const onBack = jest.fn();
    return { onOpenChat, onBack, ui: <PaidThreadScreen wawuId="fan-bisi" focusQuestion={focusQuestion} onBack={onBack} onOpenChat={onOpenChat} /> };
  };

  it('I10: the Hub share, its percent and the refund line, with the price under the name', async () => {
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-question-q1-card-title')).toBeTruthy());
    expect(words('paid-thread-name')).toBe('Bisi Akande');
    expect(words('paid-thread-sub')).toBe('Paid DM · ₦1,500');
    expect(words('paid-question-q1-card-title')).toBe('Reply in 1h 12m to earn ₦1,275');
    expect(words('paid-question-q1-card-body')).toBe("That's 85% of ₦1,500. Miss it and Bisi gets their ₦1,500 back.");
    expect(rtl.screen.getByTestId('paid-composer')).toBeTruthy();
    expect(rtl.screen.queryByTestId('paid-message-bar')).toBeNull();
  });

  it('a creator types a reply and taps Reply: one request, the words in the thread, the share on its way (R-55) and the bar becomes Message', async () => {
    hub.thread.questions = [question()];
    await draw(open('q1').ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    expect(rtl.screen.getByTestId('paid-composer-send').props.accessibilityState?.disabled).toBe(true);
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), '  Price the use, not the file.  ');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(hub.replies).toEqual([{ id: 'q1', text: 'Price the use, not the file.' }]);
    expect(rtl.screen.getByText('Price the use, not the file.')).toBeTruthy();
    expect(words('paid-question-q1-card-title')).toBe('₦1,275 is on its way to your wallet');
    expect(words('paid-question-q1-card-body')).toBe('Replied in 49 minutes. Earnings reach your wallet once a day.');
    expect(words('paid-thread-sub')).toBe('Paid DM · answered');
    expect(rtl.screen.queryByTestId('paid-composer')).toBeNull();
  });

  const answered = (state: EarningState) =>
    question({ status: 'responded', respondedAt: new Date().toISOString(), replies: [{ id: 'r1', text: 'Done.', createdAt: new Date().toISOString() }], creatorEarning: { amountKobo: 127_500, sharePct: 85, state } });

  it('I11: "is in your wallet" once the Hub says the share landed', async () => {
    hub.thread.questions = [answered('in_wallet')];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-question-q1-card-title')).toBeTruthy());
    expect(words('paid-question-q1-card-title')).toBe('₦1,275 is in your wallet');
    expect(words('paid-question-q1-card-body')).toBe('Replied in 49 minutes.');
  });

  it('I11 with no wallet yet: the share waits for one and lands when they open it (R-11)', async () => {
    hub.thread.questions = [answered('waiting_for_wallet')];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-question-q1-card-title')).toBeTruthy());
    expect(words('paid-question-q1-card-title')).toBe('₦1,275 is waiting for you');
    expect(words('paid-question-q1-card-body')).toBe('Replied in 49 minutes. It lands when you open your wallet.');
  });

  it('a double tap on Reply answers once', async () => {
    hub.replyMode = 'slow';
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), 'Price the use.');
    const send = rtl.screen.getByTestId('paid-composer-send');
    await rtl.fireEvent.press(send);
    await rtl.fireEvent.press(send);
    await rtl.fireEvent.press(send);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(hub.replies).toHaveLength(1);
  });

  it('an answer after the window is refused in the Hub words, the words stay in the field, and the thread says the time ran out', async () => {
    hub.replyMode = 'late';
    hub.thread.questions = [question({ deadlineAt: new Date(Date.now() + 5 * MIN).toISOString() })];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), 'Too late, sorry.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-thread-notice')).toBeTruthy());
    expect(rtl.screen.getByText('The 24-hour response window for this direct message has passed.')).toBeTruthy();
    expect(hub.replies).toHaveLength(1);
    // The Hub now holds the question as refunded: the thread says so and offers Message, not Reply.
    await rtl.waitFor(() => expect(words('paid-question-q1-card-title')).toBe('The time to reply ran out'));
    expect(words('paid-question-q1-card-body')).toBe("Bisi's ₦1,500 goes back to them.");
    expect(rtl.screen.queryByTestId('paid-composer')).toBeNull();
    expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy();
  });

  it('a reply lost on the way back is read from the Hub and never sent twice', async () => {
    hub.replyMode = 'lost_after';
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), 'Price the use.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(hub.replies).toHaveLength(1);
    expect(rtl.screen.queryByTestId('paid-thread-notice')).toBeNull();
    expect(words('paid-question-q1-card-title')).toBe('₦1,275 is on its way to your wallet');
  });

  it('a reply that never reached the Hub says so, keeps the words, and Reply can try again', async () => {
    hub.replyMode = 'lost_before';
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), 'Price the use.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-thread-notice')).toBeTruthy());
    expect(rtl.screen.getByTestId('paid-composer-input').props.value).toBe('Price the use.');
    expect(rtl.screen.queryByTestId('paid-message-bar')).toBeNull();
    hub.replyMode = 'ok';
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(hub.replies).toHaveLength(2);
  });

  it('every reply carries an Idempotency-Key the Hub can hold (8 to 128 of letters, digits, - and _)', async () => {
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), 'Price the use.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(hub.keys).toHaveLength(1);
    expect(hub.keys[0]).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });

  it('a retry of the same reply reuses its key, and other words make a new reply with a new key', async () => {
    hub.replyMode = 'lost_before';
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    const input = () => rtl.screen.getByTestId('paid-composer-input');
    await rtl.fireEvent.changeText(input(), 'Price the use.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-thread-notice')).toBeTruthy());
    // The same words again: the same reply attempt.
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(hub.keys).toHaveLength(2));
    expect(hub.keys[1]).toBe(hub.keys[0]);
    // Other words: a new reply.
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-thread-notice')).toBeTruthy());
    await rtl.fireEvent.changeText(input(), 'Price the use, and the term.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    await rtl.waitFor(() => expect(hub.keys).toHaveLength(3));
    expect(hub.keys[2]).not.toBe(hub.keys[0]);
    expect(hub.keys[2]).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });

  it('a retry after a lost answer that did reach the Hub carries the same key, whatever the device clock says', async () => {
    // The Hub made the reply and the line dropped; the Hub's clock is ten minutes ahead of the device's.
    hub.skewMs = 10 * MIN;
    hub.replyMode = 'lost_after';
    hub.thread.questions = [question()];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer-input')).toBeTruthy());
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('paid-composer-input'), 'Price the use.');
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-composer-send'));
    // Read back by the Hub's own reply id, not by comparing its time with the device's: the field clears, nothing is sent again.
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(rtl.screen.queryByTestId('paid-thread-notice')).toBeNull();
    expect(hub.replies).toHaveLength(1);
    expect(hub.keys).toHaveLength(1);
  });

  it('Message on an answered question opens the free chat with that person (I12)', async () => {
    hub.thread.questions = [question({ status: 'responded', respondedAt: new Date().toISOString(), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'in_wallet' } })];
    const { ui, onOpenChat } = open();
    await draw(ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message')).toBeTruthy());
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-message'));
    await rtl.waitFor(() => expect(onOpenChat).toHaveBeenCalledWith('chat-9'));
    expect(hub.chats).toBe(1);
  });

  it('a question the Hub holds no share for says the time and the refund only', async () => {
    hub.thread.questions = [question({ creatorEarning: null })];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-question-q1-card-title')).toBeTruthy());
    expect(words('paid-question-q1-card-title')).toBe('Reply in 1h 12m');
  });

  it('a conversation that is gone says it is not available', async () => {
    hub.threadStatus = 404;
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-thread-unavailable')).toBeTruthy());
  });
});

describe('FIX-109 · "+" and "..." in a paid thread (G-INBOX-18-2, -3)', () => {
  const open = () => {
    const onOpenChat = jest.fn();
    const onBack = jest.fn();
    const onSendMoney = jest.fn();
    const onOpenWallet = jest.fn();
    const ui = <PaidThreadScreen wawuId="fan-bisi" onBack={onBack} onOpenChat={onOpenChat} onSendMoney={onSendMoney} onOpenWallet={onOpenWallet} />;
    return { onOpenChat, onBack, onSendMoney, onOpenWallet, ui };
  };
  const waitReady = () => rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-composer')).toBeTruthy());

  it('"+" opens Add to chat with Send money and Request money only, and Send money finds the free chat then opens the send for this person', async () => {
    hub.thread.questions = [question()];
    const { ui, onSendMoney } = open();
    await draw(ui);
    await waitReady();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-plus'));
    expect(await rtl.screen.findByTestId('attach-sheet')).toBeTruthy();
    expect(rtl.screen.getByTestId('attach-send-money')).toBeTruthy();
    expect(rtl.screen.getByTestId('attach-request-money')).toBeTruthy();
    expect(rtl.screen.queryByTestId('attach-photo-video')).toBeNull();
    expect(rtl.screen.queryByTestId('attach-file')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('attach-send-money'));
    await rtl.waitFor(() => expect(onSendMoney).toHaveBeenCalledTimes(1));
    expect(onSendMoney.mock.calls[0]?.[0]).toMatchObject({ wawuId: 'fan-bisi', name: 'Bisi Akande' });
    expect(onSendMoney.mock.calls[0]?.[1]).toBe('chat-9');
    expect(hub.chats).toBe(1);
  });

  it('Request money opens the request sheet for the free chat with this person', async () => {
    hub.thread.questions = [question()];
    const { ui } = open();
    await draw(ui);
    await waitReady();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-plus'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('attach-request-money'));
    expect(await rtl.screen.findByText('Request from Bisi')).toBeTruthy();
    expect(hub.chats).toBe(1);
  });

  it('draws no "+" when the screen was given no way to send or request money', async () => {
    hub.thread.questions = [question()];
    await draw(<PaidThreadScreen wawuId="fan-bisi" onBack={jest.fn()} onOpenChat={jest.fn()} />);
    await waitReady();
    expect(rtl.screen.queryByTestId('paid-plus')).toBeNull();
    expect(rtl.screen.getByTestId('paid-thread-menu')).toBeTruthy();
  });

  it('draws no "+" on the answered bar (Message is its one button), and keeps the "..." menu', async () => {
    hub.thread.questions = [question({ status: 'responded', respondedAt: new Date().toISOString(), replies: [{ id: 'r1', text: 'Done.', createdAt: new Date().toISOString() }], creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'in_wallet' } })];
    await draw(open().ui);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-message-bar')).toBeTruthy());
    expect(rtl.screen.queryByTestId('paid-plus')).toBeNull();
    expect(rtl.screen.getByTestId('paid-thread-menu')).toBeTruthy();
  });

  it('"..." offers Report and Block; Report opens the shared sheet, asks for a reason, reports the open question once and says thanks', async () => {
    hub.thread.questions = [question()];
    await draw(open().ui);
    await waitReady();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-thread-menu'));
    expect(await rtl.screen.findByTestId('paid-menu-report')).toBeTruthy();
    expect(rtl.screen.getByText('Block Bisi')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-menu-report'));
    expect(await rtl.screen.findByText('Report this conversation')).toBeTruthy();
    expect(hub.reports).toEqual([]);
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-reason-harassment'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    await rtl.waitFor(() => expect(hub.reports).toEqual(['direct_message:q1:harassment']));
    expect(await rtl.screen.findByText('Thanks. We’ll review this.')).toBeTruthy();
  });

  it('a repeat report answers the same report (no error, the thanks again); a failed one says so and keeps the sheet', async () => {
    hub.thread.questions = [question()];
    hub.reportMode = 'fail';
    await draw(open().ui);
    await waitReady();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-thread-menu'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-menu-report'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('report-sheet-reason-spam'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    expect(await rtl.screen.findByTestId('report-sheet-failed')).toBeTruthy();
    hub.reportMode = 'dup';
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    expect(await rtl.screen.findByText('Thanks. We’ll review this.')).toBeTruthy();
  });

  it('Block asks first, blocks the asker once, refreshes the lists and leaves the thread; a failure keeps the sheet', async () => {
    hub.thread.questions = [question()];
    hub.blockMode = 'fail';
    const { ui, onBack } = open();
    await draw(ui);
    await waitReady();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-thread-menu'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-menu-block'));
    expect(rtl.screen.getByText('Block Bisi?')).toBeTruthy();
    expect(hub.blocks).toEqual([]);
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-block-yes'));
    expect(await rtl.screen.findByTestId('paid-menu-failed')).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
    hub.blockMode = 'ok';
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-block-yes'));
    await rtl.waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(hub.blocks).toEqual(['fan-bisi', 'fan-bisi']);
  });
});

describe('entries', () => {
  const dmRow = (id: string, side: 'creator' | 'fan', over: Record<string, unknown> = {}) => ({
    id,
    kind: 'paid_dm',
    lastActivityAt: new Date().toISOString(),
    unreadCount: 1,
    preview: { text: 'How do I price a logo?', attachment: null, mine: false, senderName: null, sentAt: new Date().toISOString(), moneyRequest: null },
    chat: null,
    paidDm: { side, other: BISI, questionCount: 1, waitingCount: 1, nextDeadlineAt: new Date(Date.now() + 18 * HOUR + 30 * MIN).toISOString() },
    community: null,
    moneyRequest: null,
    ...over,
  });

  it('a creator gets the Paid DMs chip with the Hub count, and it opens I9; the list shows their paid row and opens the thread', async () => {
    hub.inbox = [dmRow('paid_dm:1', 'creator'), dmRow('paid_dm:2', 'fan')];
    hub.queue = [queueItem('q1', BISI, 'How do I price a logo for a bank?', 72 * MIN + 30_000)];
    await draw(<InboxScreen />);
    await rtl.waitFor(() => expect(rtl.screen.getByText('Paid DMs · 3')).toBeTruthy());
    // The All list: the creator-side row reads "Paid DM · 18h left to reply"; the fan-side row (INBOX-10's) is drawn beside it.
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('row-paid_dm:1')).toBeTruthy());
    expect(rtl.screen.getByTestId('row-paid_dm:2')).toBeTruthy();
    expect(rtl.screen.getAllByText('Paid DM · 18h left to reply')).toHaveLength(2);
    await rtl.fireEvent.press(rtl.screen.getByTestId('row-paid_dm:1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/paid-questions/[wawuId]', params: { wawuId: 'fan-bisi' } });

    await rtl.fireEvent.press(rtl.screen.getByText('Paid DMs · 3'));
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('paid-queue-card')).toBeTruthy());
    expect(rtl.screen.getByTestId('paid-row-q1')).toBeTruthy();
  });

  it('a plain account is shown no Paid DMs chip, and its own paid question is drawn (INBOX-10)', async () => {
    hub.accountType = 'user';
    hub.inbox = [dmRow('paid_dm:1', 'fan')];
    await draw(<InboxScreen />);
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('row-paid_dm:1')).toBeTruthy());
    expect(rtl.screen.queryByText(/Paid DMs/)).toBeNull();
  });
});
