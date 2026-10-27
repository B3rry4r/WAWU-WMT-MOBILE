/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * A fan's paid questions (INBOX-10): I4 (waiting), I5 (replied), I7 (refunded), the ask sheet (I3), its not-enough state (I6) and the
 * PIN, on the real thread screen with the Hub as a stand-in `fetch`. The stand-in answers in the Hub's shapes, records every draft,
 * quote and payment (headers and body), and answers a key it knows with the first payment, as the Hub does (`Idempotent-Replayed`),
 * before it looks at the PIN.
 */
// The navigator's focus: false while another screen (Add money) is on top of the thread, true when it is back in front.
let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));

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
  /** The wallet's record of the waiting question w1 (GET /dm/send/wallet/w1); null leaves it unanswered, as before. */
  waitingQuestion: null as null | Record<string, unknown>,
  /** The Hub's `source` on the payment record (GET /money/payments/pay-1): null for a naira payment, the account's figures for a dollar one. The DM read never carries it. */
  paymentSource: null as null | Record<string, unknown>,
  paymentReads: 0,
  threadReads: 0,
  /** What GET /users/{id}/visitor-profile (the creator's terms) answers: 'ok', 'fail' (a 500) or 'drop' (the request is lost on the way). */
  profile: 'ok' as 'ok' | 'fail' | 'drop',
  profileReads: 0,
  /**
   * While a gate is set the Hub holds that answer back until the test opens it: `thread` is the paid thread, `terms` is the creator's
   * profile and the Hub's pause. The thread is read first and the terms after it (the pause only once the profile is here), so holding
   * the terms shows the screen as a slow phone does: the thread, and not yet the creator's terms. Holding the thread shows the loading state.
   * `pause` holds only the Hub's pause read, so the profile can be here (or fail on a second read) while the pause is still on its way.
   */
  gate: { thread: null as null | Promise<void>, terms: null as null | Promise<void>, pause: null as null | Promise<void>, record: null as null | Promise<void> },
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
    if (hub.gate.thread) await hub.gate.thread;
    if (hub.thread === 'fail') return json(500, { statusCode: 500, message: 'Something went wrong' });
    if (hub.thread === null) return json(404, { statusCode: 404, message: 'No paid questions with this person', data: null });
    return ok(hub.thread);
  }
  if (path === `/users/${CREATOR}/visitor-profile`) {
    hub.profileReads += 1;
    if (hub.gate.terms) await hub.gate.terms;
    if (hub.profile === 'drop') throw new TypeError('Network request failed');
    if (hub.profile === 'fail') return json(500, { statusCode: 500, message: 'Something went wrong' });
    return ok({
      name: 'Chidi Eze',
      own: false,
      following: false,
      profile: { wawuUserId: CREATOR, handle: 'chidi', avatarUrl: null, verification: { creator: tick(true), professional: tick(false) }, dmEnabled: hub.enabled, dmPrice: PRICE / 100, dmResponseHours: 24 },
      fields: {},
      listings: [],
    });
  }
  if (path === `/paid-dm/creators/${CREATOR}/availability`) {
    if (hub.gate.terms) await hub.gate.terms;
    if (hub.gate.pause) await hub.gate.pause;
    return ok({ creatorWawuId: CREATOR, paused: hub.paused, pausedUntil: hub.paused ? '2026-10-24T00:00:00.000Z' : null });
  }
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
  if (path === '/dm/send/wallet/w1' && method === 'GET' && hub.waitingQuestion) {
    if (hub.gate.record) await hub.gate.record;
    return ok(hub.waitingQuestion);
  }
  if (path === '/money/payments/pay-1' && method === 'GET') {
    hub.paymentReads += 1;
    return ok({ ...questionView('asked', 'x').payment, ...(hub.paymentSource ? { source: hub.paymentSource } : {}) });
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
  const tree = () => (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaidThreadScreen wawuId={CREATOR} onBack={onBack} pay={pay} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
  const view = await rtl.render(tree());
  /** The navigator moved focus: the screen is drawn again with what it now reads. */
  const refocus = async (focused: boolean) => {
    mockFocused = focused;
    await view.rerender(tree());
  };
  return { pay, onBack, client, refocus };
}

const within = rtl.within;
const { visitorKey } = require('@/features/visitor/api') as typeof import('@/features/visitor/api');
const { clearAttempts } = require('@/features/feedpay/usePaymentFlow') as typeof import('@/features/feedpay/usePaymentFlow');

rtl.configure({ asyncUtilTimeout: 6000 });

beforeEach(() => {
  mockFocused = true;
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
    waitingQuestion: null,
    paymentSource: null,
    paymentReads: 0,
    threadReads: 0,
    profile: 'ok',
    profileReads: 0,
    gate: { thread: null, terms: null, pause: null, record: null },
  });
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

/** Holds one of the Hub's answers (the thread, the creator's terms, or only the pause) until the returned function is called. */
function hold(what: 'thread' | 'terms' | 'pause' | 'record'): () => void {
  let open = () => {};
  hub.gate[what] = new Promise<void>((resolve) => {
    open = resolve;
  });
  return open;
}

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
    expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toMatch(/^Your money is held by Who Made This\? No reply by (today|tomorrow) \d\d:\d\d and it comes back to your wallet\.$/);
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
    // The offer comes from the creator's terms, which are read after the thread: wait for them, then read the card.
    await rtl.screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
    const card = rtl.screen.getByTestId('paid-card-a1');
    expect(rtl.within(card).getByTestId('paid-card-a1-title').props.children).toBe("Chidi answered, so they've been paid");
    expect(rtl.within(card).getByTestId('paid-card-a1-body').props.children).toBe('Ask a follow-up for ₦1,500. Each paid message gets its own 24-hour window.');
    expect(rtl.screen.getByRole('button', { name: 'Ask a follow-up · ₦1,500' })).toBeTruthy();
  });

  it('until the creator\'s terms are here the newest answer says nothing about asking again, never "closed", and then gives the offer', async () => {
    const open = hold('terms');
    await boot();
    expect(await rtl.screen.findByText('Honestly, I priced by outcome, not hours.')).toBeTruthy();
    const card = rtl.screen.getByTestId('paid-card-a1');
    expect(rtl.within(card).getByTestId('paid-card-a1-title').props.children).toBe("Chidi answered, so they've been paid");
    expect(rtl.within(card).getByTestId('paid-card-a1-body-loading')).toBeTruthy();
    expect(rtl.within(card).queryByTestId('paid-card-a1-body')).toBeNull();
    expect(rtl.screen.queryByText('This question is closed.')).toBeNull();
    expect(rtl.screen.getByTestId('paid-composer-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('paid-composer-ask')).toBeNull();
    open();
    await rtl.screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
    expect(rtl.within(rtl.screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body').props.children).toBe('Ask a follow-up for ₦1,500. Each paid message gets its own 24-hour window.');
    expect(rtl.screen.queryByTestId('paid-card-a1-body-loading')).toBeNull();
  });

  it('a creator who turns out not to take paid messages gets "closed" only once the Hub has said so', async () => {
    hub.paused = true;
    const open = hold('terms');
    await boot();
    await rtl.screen.findByTestId('paid-card-a1');
    expect(rtl.screen.getByTestId('paid-card-a1-body-loading')).toBeTruthy();
    expect(rtl.screen.queryByText('This question is closed.')).toBeNull();
    open();
    await rtl.screen.findByTestId('paid-composer-closed');
    expect(rtl.within(rtl.screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body').props.children).toBe('This question is closed.');
  });

  it('an older answer is closed at once, and only the newest waits for the terms', async () => {
    const older = { ...answeredQ(), id: 'a0', sentAt: iso(-30 * HOUR), deadlineAt: iso(-6 * HOUR), respondedAt: iso(-28 * HOUR) };
    hub.thread = threadOf([answeredQ(), older]);
    const open = hold('terms');
    await boot();
    await rtl.screen.findByTestId('paid-card-a1');
    expect(rtl.within(rtl.screen.getByTestId('paid-card-a0')).getByTestId('paid-card-a0-body').props.children).toBe('This question is closed.');
    expect(rtl.screen.getByTestId('paid-card-a1-body-loading')).toBeTruthy();
    open();
    await rtl.screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
    expect(rtl.within(rtl.screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body').props.children).toMatch(/^Ask a follow-up for ₦1,500\./);
    expect(rtl.within(rtl.screen.getByTestId('paid-card-a0')).getByTestId('paid-card-a0-body').props.children).toBe('This question is closed.');
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

describe('I5 · the creator\'s terms could not be read', () => {
  const offer = 'Ask a follow-up for ₦1,500. Each paid message gets its own 24-hour window.';

  // Each cause by its real shape: the Hub answers 500, or the request is lost on the way.
  it.each([
    ['the Hub answers 500', 'fail'],
    ['the request is dropped', 'drop'],
  ] as const)('when %s: the thread stays readable, the card and the bar say so with Try again, and Try again reads the profile again and brings the offer', async (_cause, how) => {
    hub.profile = how;
    const { onBack } = await boot();
    const screen = rtl.screen;
    // The creator's profile is the only read that failed: the person still reads the thread, the creator's words and Back.
    expect(await screen.findByText('Honestly, I priced by outcome, not hours.')).toBeTruthy();
    const failed = await screen.findByTestId('paid-terms-error');
    expect(within(failed).getByText("Couldn't check if you can ask")).toBeTruthy();
    expect(within(failed).getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByTestId('paid-thread-sub').props.children).toBe('Replied in 2h 14m');
    // No grey bar waits for good: not in the card, not in the bar. The card does not say "closed" or make an offer by guess either.
    const card = screen.getByTestId('paid-card-a1');
    expect(within(card).getByTestId('paid-card-a1-body').props.children).toBe("We couldn't check if you can ask a follow-up. Try again below.");
    expect(within(card).queryByTestId('paid-card-a1-body-loading')).toBeNull();
    expect(screen.queryByTestId('paid-composer-loading')).toBeNull();
    expect(screen.queryByTestId('paid-composer-ask')).toBeNull();
    expect(screen.queryByText('This question is closed.')).toBeNull();
    expect(hub.profileReads).toBe(1);
    await rtl.fireEvent.press(screen.getByTestId('paid-thread-back'));
    expect(onBack).toHaveBeenCalledTimes(1);

    // The Hub is back. Try again reads the profile again (a second read) and the offer appears where the error was.
    hub.profile = 'ok';
    await rtl.fireEvent.press(within(failed).getByRole('button', { name: 'Try again' }));
    await screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
    expect(hub.profileReads).toBe(2);
    expect(within(screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body').props.children).toBe(offer);
    expect(screen.queryByTestId('paid-terms-error')).toBeNull();
    expect(screen.queryByTestId('paid-composer-failed')).toBeNull();
  });

  it('Try again while the Hub is still failing shows the loading bar while it reads, then the error again, and the next Try again can still succeed', async () => {
    hub.profile = 'fail';
    await boot();
    const screen = rtl.screen;
    await screen.findByTestId('paid-terms-error');
    const open = hold('terms');
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('paid-composer-loading')).toBeTruthy();
    expect(screen.queryByTestId('paid-terms-error')).toBeNull();
    open();
    await screen.findByTestId('paid-terms-error');
    expect(hub.profileReads).toBe(2);
    hub.profile = 'ok';
    await rtl.fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
    expect(hub.profileReads).toBe(3);
  });

  it('an empty thread whose profile failed says so too, and Try again brings the "Ask a question" button', async () => {
    hub.thread = null;
    hub.profile = 'fail';
    await boot();
    expect(await rtl.screen.findByTestId('paid-thread-empty')).toBeTruthy();
    await rtl.screen.findByTestId('paid-terms-error');
    expect(rtl.screen.queryByTestId('paid-composer-loading')).toBeNull();
    hub.profile = 'ok';
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    expect(await rtl.screen.findByRole('button', { name: 'Ask a question · ₦1,500' })).toBeTruthy();
  });

  it('a creator\'s profile that was read once and fails on a second read is still the terms: no error flashes while the pause read is on its way (FIX-79 L2)', async () => {
    const open = hold('pause');
    const { client } = await boot();
    const screen = rtl.screen;
    // The profile is here; the pause read is held, so the terms are not known yet and the bar and the card load.
    await screen.findByTestId('paid-card-a1-body-loading');
    expect(await screen.findByTestId('paid-composer-loading')).toBeTruthy();
    // The profile is read again in the background and the Hub fails it. The first read is still the person's data.
    hub.profile = 'fail';
    await rtl.act(async () => {
      await client.refetchQueries({ queryKey: visitorKey(CREATOR) });
    });
    expect(client.getQueryState(visitorKey(CREATOR))?.status).toBe('error');
    // Let the screen draw what it now reads (the cache tells its screens on the next tick).
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(screen.queryByTestId('paid-terms-error')).toBeNull();
    expect(screen.queryByTestId('paid-composer-failed')).toBeNull();
    expect(screen.getByTestId('paid-composer-loading')).toBeTruthy();
    expect(within(screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body-loading')).toBeTruthy();
    // The pause lands: the offer replaces the loading lines, with no error in between.
    open();
    await screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
    expect(within(screen.getByTestId('paid-card-a1')).getByTestId('paid-card-a1-body').props.children).toBe(offer);
    expect(screen.queryByTestId('paid-terms-error')).toBeNull();
  });

  it('a question still waiting needs no terms: the locked bar stays and no error is drawn', async () => {
    hub.thread = threadOf([waitingQ()]);
    hub.profile = 'fail';
    await boot();
    await rtl.screen.findByTestId('paid-card-w1');
    expect(await rtl.screen.findByTestId('paid-composer-locked')).toBeTruthy();
    expect(rtl.screen.queryByTestId('paid-terms-error')).toBeNull();
  });

  it('the loading line is as high as the offer (two lines of the card\'s leading), so the card does not grow when the terms arrive', async () => {
    const open = hold('terms');
    await boot();
    await rtl.screen.findByTestId('paid-card-a1-body-loading');
    const height = (node: { props: { style?: unknown } }) => (StyleSheet.flatten(node.props.style as never) as { height?: number }).height;
    expect(height(rtl.screen.getByTestId('paid-card-a1-body-loading'))).toBeCloseTo(12.5 * 1.4 * 2, 5);
    open();
    await rtl.screen.findByRole('button', { name: 'Ask a follow-up · ₦1,500' });
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

  /** Opens the sheet with a wallet of ₦900, writes the words, taps Add, and leaves the thread for Add money (S3 round 2, F2). */
  async function shortThenAway() {
    hub.balanceKobo = 90_000;
    const view = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-composer-ask'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('ask-text'), 'How do I price a retainer?');
    await rtl.screen.findByTestId('ask-short');
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Add ₦623.25' }));
    expect(view.pay.onAddMoney).toHaveBeenCalledWith(62_325);
    await view.refocus(false);
    return view;
  }

  it('after Add money and coming back, a funded wallet shows Send and the new balance, not the old "You have ₦900.00"; the words stay', async () => {
    const { refocus } = await shortThenAway();
    expect(hub.drafts).toHaveLength(1);
    const quotesBefore = hub.quotes;
    hub.balanceKobo = 190_000; // the money landed while the person was away
    await refocus(true);
    expect(await rtl.screen.findByRole('button', { name: 'Send · ₦1,523.25' })).toBeTruthy();
    expect(rtl.screen.queryByTestId('ask-short')).toBeNull();
    expect(rtl.screen.queryByText(/You have ₦900/)).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('ask-wallet')).getByLabelText('1,900 naira')).toBeTruthy();
    // One fresh quote of the same draft for the return: no new question, the words are the person's.
    expect(hub.quotes).toBe(quotesBefore + 1);
    expect(hub.drafts).toHaveLength(1);
    expect(rtl.screen.getByTestId('ask-text').props.value).toBe('How do I price a retainer?');
    expect(hub.pays).toHaveLength(0);
  });

  it('coming back with the wallet still short asks once and still says what is missing', async () => {
    const { refocus } = await shortThenAway();
    const quotesBefore = hub.quotes;
    await refocus(true);
    await rtl.waitFor(() => expect(hub.quotes).toBe(quotesBefore + 1));
    expect(await rtl.screen.findByText('You need ₦1,523.25. You have ₦900.00.')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Add ₦623.25' })).toBeTruthy();
    // Staying in front (a redraw, the clock) asks nothing more.
    await refocus(true);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(hub.quotes).toBe(quotesBefore + 1);
  });

  it('when the wallet balance is read again and has moved, the sheet asks its quote again, once', async () => {
    const { client } = await shortThenAway();
    const quotesBefore = hub.quotes;
    // The person did not leave the sheet (a deposit landed, or the balance was refreshed elsewhere).
    hub.balanceKobo = 190_000;
    await rtl.act(async () => {
      await client.invalidateQueries({ queryKey: ['money', 'wallet', 'balance'] });
    });
    expect(await rtl.screen.findByRole('button', { name: 'Send · ₦1,523.25' })).toBeTruthy();
    expect(hub.quotes).toBe(quotesBefore + 1);
    expect(hub.drafts).toHaveLength(1);
  });

  it('the return and the balance read together make one fresh quote, not two', async () => {
    const { refocus, client } = await shortThenAway();
    const quotesBefore = hub.quotes;
    hub.balanceKobo = 190_000;
    await refocus(true);
    await rtl.act(async () => {
      await client.invalidateQueries({ queryKey: ['money', 'wallet', 'balance'] });
    });
    expect(await rtl.screen.findByRole('button', { name: 'Send · ₦1,523.25' })).toBeTruthy();
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(hub.quotes).toBe(quotesBefore + 1);
  });

  it('a payment on its way is left alone when the person comes back', async () => {
    hub.mode = 'pending';
    hub.balanceKobo = 48_525_075;
    const { refocus } = await boot();
    await openAndWrite();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: /^Send · ₦/ }));
    await rtl.screen.findByText('Approve ₦1,523.25 to Chidi Eze');
    await refocus(false);
    const quotesBefore = hub.quotes;
    await refocus(true);
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(hub.quotes).toBe(quotesBefore);
    expect(hub.pays).toHaveLength(0);
  });
});

describe('states', () => {
  it('a creator the person has not asked yet is an empty thread, not a failure, and the person can ask', async () => {
    hub.thread = null;
    await boot();
    expect(await rtl.screen.findByTestId('paid-thread-empty')).toBeTruthy();
    // A first question is not a follow-up (S3 round 2, F5). The button comes from the creator's terms, read after the thread: wait for it.
    expect(await rtl.screen.findByRole('button', { name: 'Ask a question · ₦1,500' })).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: /follow-up/ })).toBeNull();
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
    // The Hub is held, so the loading state is what the screen shows however fast the stand-in would have answered.
    const open = hold('thread');
    await boot();
    expect(rtl.screen.getByTestId('paid-thread-loading')).toBeTruthy();
    open();
    await rtl.screen.findByTestId('paid-card-a1');
    expect(rtl.screen.queryByTestId('paid-thread-loading')).toBeNull();
  });
});

describe('PAY-FX (R-91): a paid question from a dollar account', () => {
  const paySourceApi = () => require('@/api/paySource') as typeof import('@/api/paySource');
  const USD_BACK = { currency: 'USD', decimals: 2, amountMinor: 23, providerFeeMinor: 0, wawuFeeMinor: 0, totalMinor: 23, rate: '0.000741', refundedMinor: 23 };
  const USD_PAID = { ...USD_BACK, refundedMinor: null };
  /** The wallet's record of a question exactly as the Hub serves it: GET /dm/send/wallet/{id} has NO `source`; the payment record does (PAY-FX round 5). */
  const dmRecord = (id: string, status: 'asked' | 'refunded', hold: Record<string, unknown> | null) => {
    const base = questionView('asked', 'x');
    return { ...base, id, status, payment: { ...base.payment, status: 'completed', hold } };
  };
  beforeEach(() => {
    hub.thread = threadOf([refundedQ()]);
  });
  afterEach(() => paySourceApi().clearPaySource());

  it('a refund says what went back to the USD account, in dollars, never the Naira wallet', async () => {
    hub.oldQuestion = dmRecord(OLD_Q, 'refunded', { id: 'h1', status: 'refunded', amountKobo: PRICE, refundedKobo: PRICE + FEE, settledAt: iso(-23 * HOUR), heldAt: iso(-48 * HOUR) });
    hub.paymentSource = USD_BACK;
    await boot();
    const card = await rtl.screen.findByTestId(`paid-card-${OLD_Q}`);
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-title`).props.children).toBe('No reply in 24 hours, so you got $0.23 back'));
    expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-body`).props.children).toMatch(/^It went back to your USD account /);
    expect(rtl.screen.queryByText(/₦1,500 paid/)).toBeNull();
  });

  it('a naira refund reads as it always did: the Naira wallet, in naira', async () => {
    hub.oldQuestion = dmRecord(OLD_Q, 'refunded', { id: 'h1', status: 'refunded', amountKobo: PRICE, refundedKobo: PRICE + FEE, settledAt: iso(-23 * HOUR), heldAt: iso(-48 * HOUR) });
    await boot();
    const card = await rtl.screen.findByTestId(`paid-card-${OLD_Q}`);
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-title`).props.children).toMatch(/so you got ₦1,523\.25 back$/));
    expect(rtl.within(card).getByTestId(`paid-card-${OLD_Q}-body`).props.children).toMatch(/^It went back to your Naira wallet /);
  });

  it('a waiting question says the dollars that left and the USD account they come back to, from the payment record', async () => {
    hub.thread = threadOf([waitingQ()]);
    hub.waitingQuestion = { ...dmRecord('w1', 'asked', null), priceKobo: PRICE, deadlineAt: iso(17 * HOUR + 52 * 60_000) };
    hub.paymentSource = USD_PAID;
    const { refocus } = await boot();
    const card = await rtl.screen.findByTestId('paid-card-w1');
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toMatch(/and it comes back to your USD account\.$/));
    expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).not.toContain('wallet');
    expect(rtl.screen.getByText(/ · \$0\.23 paid$/)).toBeTruthy();
    expect(rtl.screen.queryByText(/₦1,500 paid/)).toBeNull();
    // One read of the payment for the one question, however often the screen is drawn again.
    await refocus(false);
    await refocus(true);
    await rtl.screen.findByTestId('paid-card-w1');
    expect(hub.paymentReads).toBe(1);
  });

  it('a waiting question past its time says the money is on its way back to the USD account', async () => {
    hub.thread = threadOf([waitingQ({ deadlineAt: iso(-60_000) })]);
    hub.waitingQuestion = { ...dmRecord('w1', 'asked', null), priceKobo: PRICE, deadlineAt: iso(-60_000) };
    hub.paymentSource = USD_PAID;
    await boot();
    const card = await rtl.screen.findByTestId('paid-card-w1');
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toBe('Your money is on its way back to your USD account.'));
  });

  it('a naira question reads as it always did: "₦1,500 paid" and back to the wallet', async () => {
    hub.thread = threadOf([waitingQ()]);
    hub.waitingQuestion = { ...dmRecord('w1', 'asked', null), priceKobo: PRICE, deadlineAt: iso(17 * HOUR + 52 * 60_000) };
    await boot();
    const card = await rtl.screen.findByTestId('paid-card-w1');
    await rtl.waitFor(() => expect(hub.paymentReads).toBe(1));
    expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toMatch(/and it comes back to your wallet\.$/);
    expect(rtl.screen.getByText(/₦1,500 paid$/)).toBeTruthy();
  });

  it('holds the stamp\u2019s amount and the card\u2019s words until the account is known, so naira never flashes before the dollars (SWEEP-1026 row 3)', async () => {
    hub.thread = threadOf([waitingQ()]);
    hub.waitingQuestion = { ...dmRecord('w1', 'asked', null), priceKobo: PRICE, deadlineAt: iso(17 * HOUR + 52 * 60_000) };
    hub.paymentSource = USD_PAID;
    const open = hold('record');
    await boot();
    const card = await rtl.screen.findByTestId('paid-card-w1');
    // The thread is drawn and the account is not known: the countdown shows, the money's words are a loading line, the stamp is the time.
    expect(rtl.within(card).getByTestId('paid-card-w1-title').props.children).toMatch(/left to reply$/);
    expect(rtl.within(card).getByTestId('paid-card-w1-body-loading')).toBeTruthy();
    expect(rtl.screen.queryByText(/₦1,500/)).toBeNull();
    expect(rtl.screen.queryByText(/paid$/)).toBeNull();
    expect(rtl.screen.queryByText(/comes back to your wallet/)).toBeNull();
    open();
    await rtl.waitFor(() => expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toMatch(/and it comes back to your USD account\.$/));
    expect(rtl.screen.getByText(/ · \$0\.23 paid$/)).toBeTruthy();
    expect(rtl.screen.queryByText(/₦1,500 paid/)).toBeNull();
  });

  it('a card that says the money is on its way back turns to the refund when it lands, without reopening the thread (SWEEP-1026 row 4)', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      hub.thread = threadOf([waitingQ({ deadlineAt: iso(-60_000) })]);
      hub.waitingQuestion = { ...dmRecord('w1', 'asked', null), priceKobo: PRICE, deadlineAt: iso(-60_000) };
      await boot();
      const card = await rtl.screen.findByTestId('paid-card-w1');
      await rtl.waitFor(() => expect(rtl.within(card).getByTestId('paid-card-w1-body').props.children).toBe('Your money is on its way back to your wallet.'));
      // Past its time and still open at the Hub: the thread is read again. The Hub pays it back and says so.
      const before = hub.threadReads;
      hub.thread = threadOf([waitingQ({ status: 'refunded', deadlineAt: iso(-60_000) })]);
      hub.waitingQuestion = dmRecord('w1', 'refunded', { id: 'h1', status: 'refunded', amountKobo: PRICE, refundedKobo: PRICE + FEE, settledAt: iso(-1000), heldAt: iso(-6 * HOUR) });
      await rtl.act(async () => {
        jest.advanceTimersByTime(16_000);
      });
      await rtl.waitFor(() => expect(hub.threadReads).toBeGreaterThan(before));
      await rtl.waitFor(() => expect(rtl.within(rtl.screen.getByTestId('paid-card-w1')).getByTestId('paid-card-w1-title').props.children).toMatch(/so you got ₦1,523\.25 back$/));
      expect(rtl.within(rtl.screen.getByTestId('paid-card-w1')).getByTestId('paid-card-w1-body').props.children).toMatch(/^It went back to your Naira wallet /);
    } finally {
      jest.useRealTimers();
    }
  });

  it('the ask sheet names the USD account from the first moment, not "Checking your balance"', async () => {
    paySourceApi().setPaySourceDefaults({ fallback: 'USD', hasNaira: false });
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: /^Try again · / }));
    await rtl.screen.findByTestId('ask-sheet');
    expect(rtl.screen.getByTestId('ask-wallet-account').props.children).toBe('USD account');
    expect(rtl.screen.queryByText('Checking your balance')).toBeNull();
  });
});
