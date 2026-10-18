import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import { fetchFeeQuote, readQuote, readTransfer, type FeeQuote, type Transfer } from '@/features/send/api';
import { HTTP_CREATED, filled, reasonOf, readRefusal, type Refusal } from '@/features/money-attempt/refusal';

import { readMessage, type ChatMessage, type MoneyRequest } from './api';

/**
 * The calls behind a money request in a chat (INBOX-20: I16 to I19), as the Hub's contract types them (INBOX-15):
 * - `POST /chats/{chatId}/money-requests`: ask the other person for money. The answer is the chat message that carries the request;
 *   `clientRequestId` makes a resend after a lost answer return the first request instead of asking twice. The asker needs an open wallet.
 * - `GET .../{requestId}`: the request as it stands (settles an unconfirmed payment first).
 * - `POST .../{requestId}/pay`: a send to the person who asked, with the send's fees on top (R-10). The PIN is the `X-Transaction-Pin`
 *   header and the `Idempotency-Key` is one per attempt. The answer is the send, as `POST /money/transfers/wawu` answers it.
 * - `POST .../{requestId}/decline`: the person who was asked says no.
 * Fees come from the same quote as a send (`GET /money/fees/quote?kind=wawu_transfer`).
 */
type Envelope<T> = { data?: T | null };

export { fetchFeeQuote };
export type { FeeQuote, Transfer };

export const requestKey = (chatId: string, requestId: string) => ['chat', chatId, 'request', requestId] as const;

const filledAmount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/** What asking for money came to. */
export type CreateOutcome =
  | { kind: 'done'; message: ChatMessage }
  /** `409 wallet_not_open` or `wallet_opening`: the asker has to open their wallet first (R-6). */
  | { kind: 'no_wallet' }
  /** No answer that proves anything: ask again with the SAME `clientRequestId` and the Hub returns the first request. */
  | { kind: 'unanswered' }
  | { kind: 'refused'; code: string | null; message: string };

/** POST /chats/{chatId}/money-requests. Never rejects. */
export async function createMoneyRequest(chatId: string, input: { amountKobo: number; memo: string; clientRequestId: string }): Promise<CreateOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/chats/{chatId}/money-requests', {
      params: { path: { chatId } },
      body: { amountKobo: input.amountKobo, ...(input.memo.trim() ? { memo: input.memo.trim() } : {}), clientRequestId: input.clientRequestId },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', message: readMessage((data as unknown as Envelope<ChatMessage> | undefined)?.data) };
    } catch {
      return { kind: 'unanswered' };
    }
  }
  const refusal = readRefusal(response.status, error, 'This request was not sent. Try again.', 'This request was not sent. Try again.');
  if (refusal.kind === 'no_wallet') return { kind: 'no_wallet' };
  if (refusal.kind === 'unanswered') return { kind: 'unanswered' };
  const { code, message } = reasonOf(error);
  return { kind: 'refused', code, message: message || 'This request was not sent. Try again.' };
}

/** GET .../{requestId}: the request as it stands. */
export async function fetchMoneyRequest(chatId: string, requestId: string): Promise<MoneyRequest> {
  const body = (await unwrap(
    api.GET('/api/hub/chats/{chatId}/money-requests/{requestId}', { params: { path: { chatId, requestId } } }),
  )) as unknown as Envelope<MoneyRequest>;
  const request = body?.data;
  if (!request || !filled(request.id) || !filledAmount(request.amountKobo)) throw new ApiError('unknown', 200, 'The request could not be read. Try again.');
  return request;
}

/** POST .../{requestId}/decline: answers the request as it now stands (declined, or what it already was). */
export async function declineMoneyRequest(chatId: string, requestId: string): Promise<MoneyRequest> {
  const body = (await unwrap(
    api.POST('/api/hub/chats/{chatId}/money-requests/{requestId}/decline', { params: { path: { chatId, requestId } } }),
  )) as unknown as Envelope<MoneyRequest>;
  const request = body?.data;
  if (!request || !filled(request.id)) throw new ApiError('unknown', 200, 'The request could not be read. Try again.');
  return request;
}

/** What paying a request came to. */
export type PayRequestOutcome =
  | { kind: 'done'; transfer: Transfer }
  /** The request is not open any more (paid, declined or cancelled by the other person while this was happening): read it again. */
  | { kind: 'not_pending' }
  | { kind: 'not_yours' }
  /** The fees moved: this is the quote as it stands now. */
  | { kind: 'quote_changed'; quote: FeeQuote }
  | Exclude<Refusal, { kind: 'quote_changed' }>;

export type PayRequestInput = {
  chatId: string;
  requestId: string;
  quote: FeeQuote;
  /** One per attempt, kept across a wrong PIN and an answer that never came. */
  key: string;
  pin: string;
};

/** POST .../{requestId}/pay. Never rejects: whatever came back (or did not) is a `PayRequestOutcome`. */
export async function payMoneyRequest(input: PayRequestInput): Promise<PayRequestOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/chats/{chatId}/money-requests/{requestId}/pay', {
      params: { path: { chatId: input.chatId, requestId: input.requestId }, header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: { expectedTotalKobo: input.quote.totalKobo, quoteToken: input.quote.quoteToken },
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', transfer: readTransfer((data as unknown as Envelope<Transfer> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the send may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  const { code } = reasonOf(error);
  if (code === 'money_request_not_pending') return { kind: 'not_pending' };
  if (code === 'money_request_not_yours') return { kind: 'not_yours' };
  const refusal = readRefusal(response.status, error, 'This payment was not taken. Nothing left your wallet.', 'There is not enough in your wallet for this payment.');
  if (refusal.kind === 'quote_changed') {
    try {
      return { kind: 'quote_changed', quote: readQuote(refusal.quote) };
    } catch {
      return { kind: 'refused', code, message: 'The fees changed. Close this and try again.' };
    }
  }
  return refusal;
}
