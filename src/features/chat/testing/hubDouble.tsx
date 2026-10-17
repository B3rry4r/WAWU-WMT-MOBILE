import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * The Hub as a stand-in `fetch` for the chat's tests (INBOX-19, INBOX-20): the chat, its messages, money requests, fee quotes, sends and
 * the wallet balance. It answers in the Hub's shapes, records every call (headers and body), and answers an Idempotency-Key it knows with
 * the first payment, before it looks at the PIN or the quote, as the Hub does.
 */
export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
export const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
export const created = (data: unknown) => json(201, { statusCode: 201, message: 'Created', data });
export const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

export const CHAT = 'chat-1';
export const ME = 'user-me';
export const OTHER = 'user-femi';
const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };

export type Mode = 'completed' | 'pending' | 'failed' | 'lost_after' | 'lost_before' | 'short' | 'no_wallet' | 'not_pending' | 'paid_elsewhere' | 'being_paid';

export const hub = {
  mode: 'completed' as Mode,
  balanceKobo: 48_525_075,
  canMessage: true,
  messages: [] as Record<string, unknown>[],
  sentTexts: [] as { text: string; clientMessageId: string | null }[],
  textMode: 'ok' as 'ok' | 'lost_before' | 'lost_after',
  requests: [] as { body: Record<string, unknown> }[],
  requestMode: 'ok' as 'ok' | 'lost_before' | 'no_wallet',
  requestStatus: 'pending' as 'pending' | 'paid' | 'declined' | 'cancelled',
  quotes: [] as number[],
  feeProvider: 1575,
  feeWawu: 1000,
  pays: [] as { path: string; pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Map<string, string>(),
  payments: 0,
  wrongFirst: false,
  transferReads: 0,
  pendingReadsLeft: 1,
  declines: 0,
  requestReads: 0,
  holdQuote: null as null | Promise<void>,
};

export function resetHub() {
  Object.assign(hub, {
    mode: 'completed',
    balanceKobo: 48_525_075,
    canMessage: true,
    messages: [],
    sentTexts: [],
    textMode: 'ok',
    requests: [],
    requestMode: 'ok',
    requestStatus: 'pending',
    quotes: [],
    feeProvider: 1575,
    feeWawu: 1000,
    pays: [],
    paidKeys: new Map<string, string>(),
    payments: 0,
    wrongFirst: false,
    transferReads: 0,
    pendingReadsLeft: 1,
    declines: 0,
    requestReads: 0,
    holdQuote: null,
  });
}

export const person = (wawuId: string, name: string, handle: string | null) => ({ wawuId, name, handle, avatarUrl: null, verification });

export function chatSummary(over: Record<string, unknown> = {}) {
  return {
    id: CHAT,
    other: person(OTHER, 'Femi Bankole', 'femib'),
    createdAt: '2026-10-16T10:00:00.000Z',
    lastActivityAt: '2026-10-16T17:52:00.000Z',
    lastMessage: null,
    unreadCount: 0,
    myLastReadAt: null,
    otherLastReadAt: null,
    canMessage: hub.canMessage,
    ...over,
  };
}

let counter = 0;
export function textMessage(text: string, mine: boolean, createdAt = '2026-10-16T17:40:00.000Z', over: Record<string, unknown> = {}) {
  counter += 1;
  return { id: `m${counter}`, chatId: CHAT, senderWawuId: mine ? ME : OTHER, mine, kind: 'text', text, attachment: null, moneyRequest: null, clientMessageId: null, createdAt, readState: null, ...over };
}

export const REQUEST_ID = 'req-1';
export function requestView(direction: 'outgoing' | 'incoming', over: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    chatId: CHAT,
    messageId: 'm-req',
    direction,
    requesterWawuId: direction === 'outgoing' ? ME : OTHER,
    payerWawuId: direction === 'outgoing' ? OTHER : ME,
    amountKobo: 1_200_000,
    memo: 'Logo edits, round 2',
    status: hub.requestStatus,
    paying: false,
    createdAt: '2026-10-16T16:21:00.000Z',
    resolvedAt: null,
    ...over,
  };
}
export function requestMessage(direction: 'outgoing' | 'incoming', over: Record<string, unknown> = {}) {
  return {
    id: 'm-req',
    chatId: CHAT,
    senderWawuId: direction === 'outgoing' ? ME : OTHER,
    mine: direction === 'outgoing',
    kind: 'money_request',
    text: 'Logo edits, round 2',
    attachment: null,
    moneyRequest: requestView(direction),
    clientMessageId: null,
    createdAt: '2026-10-16T16:21:00.000Z',
    readState: null,
    ...over,
  };
}

export function feeQuote(amountKobo: number) {
  const total = amountKobo + hub.feeProvider + hub.feeWawu;
  return {
    kind: 'wawu_transfer',
    billCategory: null,
    amountKobo,
    fee: { providerFeeKobo: hub.feeProvider, wawuFeeKobo: hub.feeWawu, totalFeeKobo: hub.feeProvider + hub.feeWawu },
    parts: [
      { code: 'balance_transfer', source: 'provider', amountKobo: hub.feeProvider },
      { code: 'wawu_fee', source: 'wawu', amountKobo: hub.feeWawu },
    ],
    totalKobo: total,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tq-${amountKobo}-${hub.quotes.length}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
}

export function transferView(status: 'pending' | 'completed' | 'failed', amountKobo = 1_200_000, note: string | null = null) {
  return {
    id: 'tr-1',
    kind: 'wawu_user',
    status,
    amountKobo,
    fee: { providerFeeKobo: hub.feeProvider, wawuFeeKobo: hub.feeWawu, totalFeeKobo: hub.feeProvider + hub.feeWawu },
    totalKobo: amountKobo + hub.feeProvider + hub.feeWawu,
    note,
    reference: 'WAW-TRF-1',
    toWawuUser: { wawuUserId: OTHER, displayName: 'Femi Bankole', handle: 'femib', avatarUrl: null, tick: null },
    toBankAccount: null,
    timeline: [],
    failureReason: status === 'failed' ? 'The bank did not take it.' : null,
    reversal: null,
    statusMessage: null,
    transactionId: null,
    createdAt: '2026-10-17T10:42:00.000Z',
    completedAt: status === 'completed' ? '2026-10-17T10:42:03.000Z' : null,
  };
}

/** What a pay call answers, by mode. `kind` is where the stand-in is asked (a request's pay, or a send). */
function payAnswer(path: string, key: string, body: Record<string, unknown>, pin: string | null, amountKobo: number, note: string | null) {
  hub.pays.push({ path, pin, key, body });
  // The Hub answers a key it knows with the first payment, before it looks at the PIN or the quote.
  if (hub.paidKeys.has(key)) return created(transferView(hub.paidKeys.get(key) as 'completed', amountKobo, note));
  if (hub.mode === 'no_wallet') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
  if (hub.wrongFirst && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
  if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 50_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 50_000 });
  if (hub.mode === 'not_pending') {
    hub.requestStatus = 'cancelled';
    return refuse(409, { code: 'money_request_not_pending', message: 'This request is not open any more.' });
  }
  if (hub.mode === 'paid_elsewhere') {
    hub.requestStatus = 'paid';
    return refuse(409, { code: 'money_request_not_pending', message: 'This request is not open any more.' });
  }
  if (hub.mode === 'being_paid') return refuse(409, { code: 'money_request_being_paid', message: 'This request is being paid.' });
  if (hub.mode === 'lost_before' && hub.pays.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
  if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
    hub.paidKeys.set(key, 'completed');
    hub.payments += 1;
    hub.requestStatus = 'paid';
    return json(500, { statusCode: 500, message: 'Something went wrong' });
  }
  const status = hub.mode === 'pending' ? 'pending' : hub.mode === 'failed' ? 'failed' : 'completed';
  hub.paidKeys.set(key, status);
  hub.payments += 1;
  if (status === 'completed' && path.includes('money-requests')) hub.requestStatus = 'paid';
  return created(transferView(status, amountKobo, note));
}

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  const key = request.headers.get('idempotency-key') ?? '';
  const pin = request.headers.get('x-transaction-pin');
  if (path === `/chats/${CHAT}` && method === 'GET') return ok(chatSummary());
  if (path === `/chats/${CHAT}/messages` && method === 'GET') return ok({ items: hub.messages, nextCursor: null });
  if (path === `/chats/${CHAT}/messages` && method === 'POST') {
    const body = (await request.json()) as { text: string; clientMessageId: string | null };
    hub.sentTexts.push({ text: body.text, clientMessageId: body.clientMessageId });
    const known = hub.messages.find((m) => m.clientMessageId === body.clientMessageId);
    if (hub.textMode === 'lost_before' && hub.sentTexts.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    const message = known ?? { ...textMessage(body.text, true, new Date().toISOString()), clientMessageId: body.clientMessageId };
    if (!known) hub.messages.unshift(message);
    if (hub.textMode === 'lost_after' && hub.sentTexts.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    return created(message);
  }
  if (path === `/chats/${CHAT}/read`) return ok({ chatId: CHAT, lastReadAt: null, lastReadMessageId: null, unreadCount: 0 });
  if (path === `/chats/${CHAT}/money-requests` && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.requests.push({ body });
    if (hub.requestMode === 'no_wallet') return refuse(409, { code: 'wallet_not_open', message: 'Open your wallet first.' });
    if (hub.requestMode === 'lost_before' && hub.requests.length === 1) return json(500, { statusCode: 500, message: 'Something went wrong' });
    const message = requestMessage('outgoing', { moneyRequest: requestView('outgoing', { amountKobo: body.amountKobo, memo: body.memo ?? null }), text: (body.memo as string) ?? null });
    return created(message);
  }
  if (path === `/chats/${CHAT}/money-requests/${REQUEST_ID}` && method === 'GET') {
    hub.requestReads += 1;
    const pending = hub.mode === 'pending' && hub.requestStatus === 'pending' && hub.pendingReadsLeft > 0;
    if (pending) hub.pendingReadsLeft -= 1;
    else if (hub.mode === 'pending' && hub.requestStatus === 'pending') hub.requestStatus = 'paid';
    return ok(requestView('incoming', { paying: pending }));
  }
  if (path === `/chats/${CHAT}/money-requests/${REQUEST_ID}/pay` && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    return payAnswer(path, key, body, pin, 1_200_000, null);
  }
  if (path === `/chats/${CHAT}/money-requests/${REQUEST_ID}/decline` && method === 'POST') {
    hub.declines += 1;
    hub.requestStatus = 'declined';
    return created(requestView('incoming', { status: 'declined' }));
  }
  if (path === '/money/fees/quote') {
    const amount = Number(url.searchParams.get('amountKobo'));
    hub.quotes.push(amount);
    if (hub.holdQuote) await hub.holdQuote;
    return ok(feeQuote(amount));
  }
  if (path === '/money/transfers/wawu' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    return payAnswer(path, key, body, pin, Number(body.amountKobo), (body.note as string) ?? null);
  }
  if (path === '/money/transfers/tr-1' && method === 'GET') {
    hub.transferReads += 1;
    if (hub.mode === 'pending' && hub.pendingReadsLeft > 0) {
      hub.pendingReadsLeft -= 1;
      return ok(transferView('pending', 2_500_000, 'For the shoot, thank you'));
    }
    return ok(transferView('completed', 2_500_000, 'For the shoot, thank you'));
  }
  if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2026-10-17T09:00:00.000Z' });
  throw new Error(`no answer for ${method} ${path}`);
}) as typeof fetch;

const clients: QueryClient[] = [];
export function clearClients() {
  clients.splice(0).forEach((c) => c.clear());
}

export async function renderWith(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

export async function enterPin(pin: string) {
  const user = userEvent.setup();
  // The PIN sheet is drawn after whatever is under it, and a screen with its own keypad (the amount) has keys of the same names.
  for (const d of pin) {
    const keys = await rtl.screen.findAllByRole('button', { name: d });
    await user.press(keys[keys.length - 1] as (typeof keys)[number]);
  }
}
