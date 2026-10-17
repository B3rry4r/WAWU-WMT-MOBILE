/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * A fan's paid questions (INBOX-10): I4 (waiting), I5 (replied), I7 (refunded), the ask sheet (I3), its not-enough state (I6) and the
 * PIN, on the real thread screen with the Hub as a stand-in `fetch`. The stand-in answers in the Hub's shapes, records every draft,
 * quote and payment (headers and body), and answers a key it knows with the first payment, as the Hub does (`Idempotent-Replayed`),
 * before it looks at the PIN.
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const CREATOR = '00000000-0000-4000-8000-0000000000c1';
const NEW_Q = '99999999-9999-4999-8999-999999999999';
const OLD_Q = '88888888-8888-4888-8888-888888888888';
const PRICE = 150_000;
const FEE = 2325;
const HOUR = 3_600_000;
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();

type Mode = 'paid' | 'pending' | 'wrong_pin_first' | 'lost_after' | 'lost_before' | 'refused';
const hub = {
  mode: 'paid' as Mode,
  balanceKobo: 48_525_075,
  /** What GET /paid-dm/threads answers: null is a 404 (no questions), 'fail' is a 500. */
  thread: null as null | 'fail' | Record<string, unknown>,
  enabled: true,
  paused: false,
  usualMinutes: 180 as number | null,
  drafts: [] as { text: string; key: string | null }[],
  quotes: 0,
  pays: [] as { pin: string | null; key: string; body: Record<string, unknown> }[],
  paidKeys: new Set<string>(),
  payments: 0,
  /** The wallet's record of the refunded question OLD_Q. */
  oldQuestion: null as null | Record<string, unknown>,
  threadReads: 0,
};

const person = { wawuUserId: CREATOR, displayName: 'Chidi Eze', handle: 'chidi', avatarUrl: null, tick: 'creator' };
const tick = (verified: boolean) => ({ verified, expiresAt: null });
const other = { wawuId: CREATOR, name: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: tick(true), professional: tick(false) } };

const quoteView = (text: string) => ({
  question: { id: NEW_Q, creator: person, text, priceKobo: PRICE, replyWindowHours: 24, usualReplyMinutes: hub.usualMinutes },
  payment: {
    kind: 'paid_dm',
    targetId: NEW_Q,
    title: 'Question for Chidi Eze',
    payee: person,
    priceKobo: PRICE,
    fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE },
    totalKobo: PRICE + FEE,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: hub.balanceKobo < PRICE + FEE ? PRICE + FEE - hub.balanceKobo : null,
    willBeHeld: true,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${PRICE + FEE}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
});

const questionView = (status: 'pending' | 'asked', text: string) => ({
  id: NEW_Q,
  method: 'wallet',
  status,
  statusMessage: status === 'pending' ? "We're still confirming this payment. Don't pay again; we'll let you know." : null,
  creator: person,
  text,
  priceKobo: PRICE,
  replyWindowHours: 24,
  deadlineAt: status === 'asked' ? iso(24 * HOUR) : null,
  payment: {
    id: 'pay-1',
    kind: 'paid_dm',
    targetId: NEW_Q,
    title: 'Question for Chidi Eze',
    status: status === 'asked' ? 'completed' : 'pending',
    priceKobo: PRICE,
    fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE },
    totalKobo: PRICE + FEE,
    reference: 'WAW-DM-1',
    hold: null,
    failureReason: null,
    delivered: status === 'asked',
    statusMessage: null,
    createdAt: iso(-1000),
    completedAt: null,
  },
  createdAt: iso(-1000),
  sentAt: status === 'asked' ? iso(-500) : null,
});

const threadOf = (questions: Record<string, unknown>[]) => ({
  thread: { other, side: 'fan', questionCount: questions.length, waitingCount: 0, nextDeadlineAt: null, lastActivityAt: iso(-1000), lastText: 'x', lastTextMine: true },
  questions,
  nextCursor: null,
});
const waitingQ = (over: Record<string, unknown> = {}) => ({
  id: 'w1',
  text: 'I run a 6-person design studio in Lagos. How did you price your first retainer clients?',
  amountKobo: PRICE,
  status: 'awaiting_response',
  mine: true,
  sentAt: iso(-(6 * HOUR + 8 * 60_000)),
  deadlineAt: iso(17 * HOUR + 52 * 60_000),
  respondedAt: null,
  replies: [],
  ...over,
});
const answeredQ = () =>
  waitingQ({
    id: 'a1',
    status: 'responded',
    sentAt: iso(-3 * HOUR),
    deadlineAt: iso(21 * HOUR),
    respondedAt: iso(-(3 * HOUR) + (2 * HOUR + 14 * 60_000)),
    replies: [
      { id: 'r1', text: 'Honestly, I priced by outcome, not hours.', createdAt: iso(-HOUR) },
      { id: 'r2', text: "Send me your current rate card and I'll tell you where it's soft.", createdAt: iso(-HOUR + 1000) },
    ],
  });
const refundedQ = () => waitingQ({ id: OLD_Q, text: 'Can I order a custom mix for my sister’s graduation?', status: 'refunded', sentAt: iso(-48 * HOUR), deadlineAt: iso(-24 * HOUR) });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === `/paid-dm/threads/${CREATOR}`) {
    hub.threadReads += 1;
    if (hub.thread === 'fail') return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.thread === null) return json(404, { statusCode: 404, message: 'No paid questions with this person', data: null });
    return ok(hub.thread);
  }
  if (path === `/users/${CREATOR}/visitor-profile`) {
    return ok({
      name: 'Chidi Eze',
      own: false,
      following: false,
      profile: { wawuUserId: CREATOR, handle: 'chidi', avatarUrl: null, verification: { creator: tick(true), professional: tick(false) }, dmEnabled: hub.enabled, dmPrice: PRICE / 100, dmResponseHours: 24 },
      fields: {},
      listings: [],
    });
  }
  if (path === `/paid-dm/creators/${CREATOR}/availability`) return ok({ creatorWawuId: CREATOR, paused: hub.paused, pausedUntil: hub.paused ? '2026-10-24T00:00:00.000Z' : null });
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === `/dm/${CREATOR}/send/wallet` && method === 'POST') {
    const body = (await request.json()) as { text: string };
    hub.drafts.push({ text: body.text, key: request.headers.get('idempotency-key') });
    return json(201, { statusCode: 201, message: 'Created', data: quoteView(body.text) });
  }
  if (path === `/dm/send/wallet/${NEW_Q}/quote` && method === 'GET') {
    hub.quotes += 1;
    return ok(quoteView(hub.drafts.at(-1)?.text ?? ''));
  }
  if (path === '/dm/send/wallet/pay' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    const key = request.headers.get('idempotency-key') ?? '';
    hub.pays.push({ pin: request.headers.get('x-transaction-pin'), key, body });
    const text = hub.drafts.at(-1)?.text ?? '';
    if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: questionView('asked', text) });
    if (hub.mode === 'wrong_pin_first' && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    if (hub.mode === 'refused') return refuse(409, { code: 'question_already_waiting', message: 'You can send once they reply.' });
    if (hub.mode === 'lost_before' && hub.pays.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
      hub.paidKeys.add(key);
      hub.payments += 1;
      return json(500, { statusCode: 500, message: 'Something went wrong' });
    }
    hub.paidKeys.add(key);
    hub.payments += 1;
    return json(201, { statusCode: 201, message: 'Created', data: questionView(hub.mode === 'pending' ? 'pending' : 'asked', text) });
  }
  if (path === `/dm/send/wallet/${NEW_Q}` && method === 'GET') return ok(questionView('asked', hub.drafts.at(-1)?.text ?? ''));
  if (path === `/dm/send/wallet/${OLD_Q}` && method === 'GET') {
    if (!hub.oldQuestion) return json(404, { statusCode: 404, message: 'We could not find that question.', data: null });
    return ok(hub.oldQuestion);
  }
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

const clients: QueryClient[] = [];
const wired = () => ({ onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function boot(pay = wired()) {
  const { PaidThreadScreen } = require('../PaidThreadScreen') as typeof import('../PaidThreadScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const onBack = jest.fn();
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaidThreadScreen wawuId={CREATOR} onBack={onBack} pay={pay} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { pay, onBack, client };
}

const { clearAttempts } = require('@/features/feedpay/usePaymentFlow') as typeof import('@/features/feedpay/usePaymentFlow');

rtl.configure({ asyncUtilTimeout: 6000 });

beforeEach(() => {
  clearAttempts();
  Object.assign(hub, {
    mode: 'paid',
    balanceKobo: 48_525_075,
    thread: threadOf([answeredQ()]),
    enabled: true,
    paused: false,
    usualMinutes: 180,
    drafts: [],
    quotes: 0,
    pays: [],
    paidKeys: new Set<string>(),
    payments: 0,
    oldQuestion: null,
    threadReads: 0,
  });
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

/** Opens the ask sheet from the thread's composer, writes the question and waits for the Hub's quote. */
async function openAndWrite(text = 'How do I price a retainer?') {
  const screen = rtl.screen;
  await rtl.fireEvent.press(await screen.findByTestId('paid-composer-ask'));
  await screen.findByTestId('ask-sheet');
  await rtl.fireEvent.changeText(screen.getByTestId('ask-text'), text);
  await rtl.waitFor(() => expect(screen.getByTestId('ask-send').props.accessibilityState?.disabled).not.toBe(true));
  await screen.findByRole('button', { name: /^Send · ₦/ });
}

describe('I4 · waiting for a reply', () => {
  beforeEach(() => {
    hub.thread = threadOf([waitingQ()]);
  });

  it('a user sees the question with "₦1,500 paid", the countdown, where the money is, and a composer that says when they can send', async () => {
    await boot();
    const card = await rtl.screen.findByTestId('paid-card-w1');
    expect(rtl.within(card).getByTestId('paid-card-w1-title').props.children).toMatch(/^Chidi has 17h \d\dm left to reply$/);
    expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toMatch(/^Your ₦1,500 is held by Who Made This\? No reply by (today|tomorrow) \d\d:\d\d and it comes back to your wallet\.$/);
    expect(rtl.screen.getByText(/₦1,500 paid$/)).toBeTruthy();
    expect(rtl.screen.getByTestId('paid-thread-sub').props.children).toBe('Paid DM · replies within 24h');
    expect(rtl.screen.getByTestId('paid-composer-locked-field').props.placeholder).toBe('You can send once Chidi replies');
    expect(rtl.screen.queryByTestId('paid-composer-ask')).toBeNull();
    expect(rtl.screen.queryByText(/Fintava/)).toBeNull();
  });

  it('the thread is read again while a question waits, so the creator\'s answer shows without leaving', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      await boot();
      await rtl.screen.findByTestId('paid-card-w1');
      const before = hub.threadReads;
      hub.thread = threadOf([answeredQ()]);
      await rtl.act(async () => {
        jest.advanceTimersByTime(16_000);
      });
      await rtl.waitFor(() => expect(hub.threadReads).toBeGreaterThan(before));
      await rtl.screen.findByTestId('paid-card-a1');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('I5 · replied', () => {
  it('a user reads the creator\'s two bubbles, "Replied in 2h 14m", "answered, so they\'ve been paid" and the follow-up offer', async () => {
    await boot();
    expect(await rtl.screen.findByText('Honestly, I priced by outcome, not hours.')).toBeTruthy();
    expect(rtl.screen.getByText("Send me your current rate card and I'll tell you where it's soft.")).toBeTruthy();
    expect(rtl.screen.getByTestId('paid-thread-sub').props.children).toBe('Replied in 2h 14m');
    const card = rtl.screen.getByTestId('paid-card-a1');
    expect(rtl.within(card).getByTestId('paid-card-a1-title').props.children).toBe("Chidi answered, so they've been paid");
    expect(rtl.within(card).getByTestId('paid-card-a1-body').props.children).toBe('Ask a follow-up for ₦1,500. Each paid message gets its own 24 hours window.');
    expect(rtl.screen.getByRole('button', { name: 'Ask a follow-up · ₦1,500' })).toBeTruthy();
  });

  it('draws no follow-up when the Hub says the creator is not taking paid messages, and says so in place of the composer (I8)', async () => {
    hub.paused = true;
    await boot();
    expect(await rtl.screen.findByTestId('paid-composer-closed')).toBeTruthy();
    expect(rtl.screen.getByText("Chidi isn't taking paid messages right now")).toBeTruthy();
    expect(rtl.screen.queryByTestId('paid-composer-ask')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body').props.children).toBe('This question is closed.');
  });
});

describe('I7 · refunded', () => {
  beforeEach(() => {
    hub.thread = threadOf([refundedQ()]);
  });
  const record = (settledAt: string | null, status: 'refunded' | 'refunding') => ({
    ...questionView('asked', 'x'),
    id: OLD_Q,
    status,
    payment: { ...questionView('asked', 'x').payment, status: 'completed', hold: { id: 'h1', status: 'refunded', amountKobo: PRICE, refundedKobo: PRICE + FEE, settledAt, heldAt: iso(-48 * HOUR) } },
  });

  it('a user sees how much came back and when, from the wallet\'s own record, and "Try again" with the old words', async () => {
    hub.oldQuestion = record(iso(-23 * HOUR), 'refunded');
    await boot();
    const card = await rtl.screen.findByTestId(`paid-card-${OLD_Q}`);
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-title`).props.children).toBe('No reply in 24 hours, so you got ₦1,523.25 back'));
    expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-body`).props.children).toMatch(/^It went back to your Naira wallet (today|yesterday|on [A-Za-z]+|[A-Za-z]+) at \d\d:\d\d\. Chidi earned nothing\.$/);
    expect(rtl.screen.getByTestId('paid-thread-sub').props.children).toBe('Paid DM · refunded');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Try again · ₦1,500' }));
    expect((await rtl.screen.findByTestId('ask-text')).props.value).toBe('Can I order a custom mix for my sister’s graduation?');
  });

  it('while the refund is on its way it says so, with the figure the wallet gives', async () => {
    hub.oldQuestion = record(null, 'refunding');
    await boot();
    const card = await rtl.screen.findByTestId(`paid-card-${OLD_Q}`);
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-title`).props.children).toBe('No reply in 24 hours, so ₦1,523.25 is coming back'));
  });

  it('a question with no wallet record (asked another way) says only that it was refunded, with no amount', async () => {
    await boot();
    const card = await rtl.screen.findByTestId(`paid-card-${OLD_Q}`);
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-title`).props.children).toBe('No reply in 24 hours, so this question was refunded'));
  });
});

describe('I3 · the ask sheet', () => {
  it('a user sees the usual reply time, the three lines, the breakdown of ₦1,500 + the bank charge = ₦1,523.25 and "Send · ₦1,523.25"', async () => {
    await boot();
    await openAndWrite();
    const sheet = rtl.screen.getByTestId('ask-sheet');
    expect(rtl.within(sheet).getByText('Ask Chidi')).toBeTruthy();
    expect(rtl.within(sheet).getByTestId('ask-usual').props.children).toBe('Usually replies in about 3 hours');
    expect(rtl.within(sheet).getByText('Chidi has 24 hours to reply')).toBeTruthy();
    expect(rtl.within(sheet).getByText('No reply in time, your ₦1,523.25 comes back')).toBeTruthy();
    expect(rtl.within(sheet).getByText('Held by Who Made This? until Chidi answers')).toBeTruthy();
    const rows = rtl.within(sheet).getByTestId('ask-breakdown');
    expect(rtl.within(rows).getByLabelText('1,500 naira')).toBeTruthy();
    expect(rtl.within(rows).getByText('Bank charge')).toBeTruthy();
    expect(rtl.within(rows).getByLabelText('23 naira 25 kobo')).toBeTruthy();
    expect(rtl.within(rows).getByLabelText('1,523 naira 25 kobo')).toBeTruthy();
    expect(rtl.within(sheet).getByText('Pay from wallet')).toBeTruthy();
    expect(rtl.screen.queryByText(/in full|Fintava/)).toBeNull();
  });

  it('draws no "usually replies in" line until the Hub has a figure', async () => {
    hub.usualMinutes = null;
    await boot();
    await openAndWrite();
    expect(rtl.screen.queryByTestId('ask-usual')).toBeNull();
  });

  it('one draft is made for the words on the sheet, and each tap on Send asks for a fresh quote of that draft', async () => {
    await boot();
    await openAndWrite('Same words');
    expect(hub.drafts).toHaveLength(1);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Send · ₦/ }));
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    expect(hub.drafts).toHaveLength(1);
    expect(hub.quotes).toBe(1);
  });
});

describe('I3, W11 · paying', () => {
  it('a user taps Send, approves with the PIN, and the question is paid once with the quote the Hub gave', async () => {
    await boot();
    await openAndWrite('How do I price a retainer?');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Send · ₦/ }));
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    await enterPin('4829');
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('ask-sheet')).toBeNull());
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].key).toMatch(/[0-9a-f-]{36}/);
    expect(hub.pays[0].body).toEqual({ questionId: NEW_Q, expectedTotalKobo: PRICE + FEE, quoteToken: `tok-${PRICE + FEE}` });
    expect(hub.payments).toBe(1);
    // The thread is read again so the new question shows.
    await rtl.waitFor(() => expect(hub.threadReads).toBeGreaterThan(1));
  });

  it('two taps on Send open one PIN sheet and pay once', async () => {
    await boot();
    await openAndWrite();
    const send = rtl.screen.getByRole('button', { name: /^Send · ₦/ });
    await rtl.act(async () => {
      rtl.fireEvent.press(send);
      rtl.fireEvent.press(send);
    });
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.payments).toBe(1));
    expect(hub.pays).toHaveLength(1);
  });

  it('a wrong PIN moves nothing, and the right one is sent under the SAME key', async () => {
    hub.mode = 'wrong_pin_first';
    await boot();
    await openAndWrite();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Send · ₦/ }));
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    await enterPin('1111');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    expect(hub.payments).toBe(0);
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.payments).toBe(1));
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.drafts).toHaveLength(1);
  });

  it('a lost answer, then the person tries again: the same key, the same question, one debit', async () => {
    hub.mode = 'lost_after';
    await boot();
    await openAndWrite();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Send · ₦/ }));
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    // The sheet still stands; the person goes again.
    await rtl.waitFor(() => expect(hub.payments).toBe(1));
    await enterPin('4829');
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('ask-sheet')).toBeNull());
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
    expect(hub.payments).toBe(1);
    expect(hub.drafts).toHaveLength(1);
  });

  it('the Hub refusing a second question to the same creator shows its sentence and moves nothing', async () => {
    hub.mode = 'refused';
    await boot();
    await openAndWrite();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Send · ₦/ }));
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    await enterPin('4829');
    await rtl.screen.findByText('You can send once they reply.');
    expect(hub.payments).toBe(0);
  });
});

describe('I6 · not enough in the wallet', () => {
  it('a user with ₦900 sees "You need ₦1,523.25. You have ₦900.00." and "Add ₦623.25", which opens Add money with the shortfall', async () => {
    hub.balanceKobo = 90_000;
    const { pay } = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-composer-ask'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('ask-text'), 'How do I price a retainer?');
    const short = await rtl.screen.findByTestId('ask-short');
    expect(rtl.within(short).getByText('Not enough in your Naira wallet')).toBeTruthy();
    expect(rtl.within(short).getByText('You need ₦1,523.25. You have ₦900.00.')).toBeTruthy();
    expect(rtl.screen.getByText('No reply in time, your ₦1,523.25 comes back')).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: /^Send/ })).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Add ₦623.25' }));
    expect(pay.onAddMoney).toHaveBeenCalledWith(62_325);
    expect(hub.pays).toHaveLength(0);
  });
});

describe('states', () => {
  it('a creator the person has not asked yet is an empty thread, not a failure, and the person can ask', async () => {
    hub.thread = null;
    await boot();
    expect(await rtl.screen.findByTestId('paid-thread-empty')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Ask a follow-up · ₦1,500' })).toBeTruthy();
  });

  it('a failed read shows the error with Try again, and no composer', async () => {
    hub.thread = 'fail';
    await boot();
    expect(await rtl.screen.findByTestId('paid-thread-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('paid-composer-ask')).toBeNull();
    hub.thread = threadOf([answeredQ()]);
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    await rtl.screen.findByTestId('paid-card-a1');
  });

  it('shows the loading state before the Hub answers', async () => {
    await boot();
    expect(rtl.screen.getByTestId('paid-thread-loading')).toBeTruthy();
    await rtl.screen.findByTestId('paid-card-a1');
  });
});
