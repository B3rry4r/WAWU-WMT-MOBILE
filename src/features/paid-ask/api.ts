import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { filled, isKobo, readData, readPaymentQuote, sendPayment, unreadable, type PayOutcome } from '@/features/feedpay/payCall';

/**
 * The calls behind asking a creator a paid question from the wallet (INBOX-10, I3 to I7), as the Hub's contract types them
 * (INBOX-17, INBOX-08, INBOX-09):
 * - `POST /dm/{creatorWawuId}/send/wallet`: drafts the question and answers I3: the price, the reply window, the creator's
 *   usual reply time and the wallet payment's quote (the charge on top, the total, the balance, the shortfall). Nothing moves.
 * - `GET /dm/send/wallet/{questionId}/quote`: the same sheet again, with a fresh quote. Asked on every tap of Send.
 * - `POST /dm/send/wallet/pay`: pays the quote once. The PIN is the `X-Transaction-Pin` header; the `Idempotency-Key` is one per
 *   attempt and travels again, unchanged, on every retry.
 * - `GET /dm/send/wallet/{questionId}`: one question as it stands now, with its payment and its hold (the refund shows there).
 * - `GET /paid-dm/threads/{wawuId}`: the fan's questions to one creator with every reply bubble (I4, I5, I7).
 * - `GET /paid-dm/creators/{wawuId}/availability`: whether the creator has paused paid messages (I8).
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`, so each call reads it itself.
 */
export type AskQuote = components['schemas']['PaidQuestionQuoteView'];
export type QuestionView = components['schemas']['PaidQuestionWalletView'];
export type ThreadDetail = components['schemas']['PaidDmThreadDetail'];
export type ThreadQuestion = components['schemas']['PaidDmQuestion'];
export type ThreadOther = components['schemas']['DmOtherParty'];
export type Availability = components['schemas']['PaidDmAvailability'];

/** How many questions one thread page asks for. */
export const THREAD_PAGE = 20;

export const threadKey = (wawuId: string) => ['paid-dm', 'thread', wawuId] as const;
export const questionKey = (id: string) => ['money', 'paid-dm', 'question', id] as const;
export const availabilityKey = (wawuId: string) => ['paid-dm', 'availability', wawuId] as const;

const STATUSES: readonly QuestionView['status'][] = ['unpaid', 'pending', 'asked', 'answered', 'refunding', 'refunded', 'failed', 'reversed'];

/** A quote the sheet can draw and the payment can carry: the question, its price, its window and a readable payment quote. */
export function readAskQuote(value: unknown): AskQuote {
  const q = value as Partial<AskQuote> | null;
  const question = q?.question;
  if (!q || typeof q !== 'object' || !question || !filled(question.id) || !isKobo(question.priceKobo) || typeof question.replyWindowHours !== 'number') {
    throw unreadable('price');
  }
  const minutes = question.usualReplyMinutes;
  return {
    question: { ...question, usualReplyMinutes: typeof minutes === 'number' && minutes > 0 ? minutes : null },
    payment: readPaymentQuote(q.payment),
  };
}

/** A question as the screens read it: a known status, whole-kobo money, and the payment (null while unpaid) with its hold. */
export function readQuestion(value: unknown): QuestionView {
  const v = value as Partial<QuestionView> | null;
  const ok =
    v &&
    typeof v === 'object' &&
    filled(v.id) &&
    STATUSES.includes(v.status as QuestionView['status']) &&
    isKobo(v.priceKobo) &&
    typeof v.replyWindowHours === 'number';
  if (!ok) throw unreadable('question');
  return v as QuestionView;
}

/** POST /dm/{creatorWawuId}/send/wallet. Rejects with the shared `ApiError`: `wallet_not_open` leads to Open your wallet, the rest carry the Hub's sentence. */
export async function askQuestion(input: { creatorWawuId: string; text: string; key?: string }): Promise<AskQuote> {
  return readAskQuote(
    await readData(
      api.POST('/api/hub/dm/{creatorWawuId}/send/wallet', {
        params: { path: { creatorWawuId: input.creatorWawuId }, header: input.key ? { 'Idempotency-Key': input.key } : {} },
        body: { text: input.text },
      }),
      'price',
    ),
  );
}

/** GET /dm/send/wallet/{questionId}/quote: a fresh quote for a question already drafted. */
export async function requoteQuestion(questionId: string): Promise<AskQuote> {
  return readAskQuote(await readData(api.GET('/api/hub/dm/send/wallet/{questionId}/quote', { params: { path: { questionId } } }), 'price'));
}

/** GET /dm/send/wallet/{questionId}: our own records only; the Hub never asks the provider. */
export async function fetchQuestion(questionId: string): Promise<QuestionView> {
  return readQuestion(await readData(api.GET('/api/hub/dm/send/wallet/{questionId}', { params: { path: { questionId } } }), 'question'));
}

export type PayQuestionInput = { questionId: string; expectedTotalKobo: number; quoteToken: string; key: string; pin: string };

/** POST /dm/send/wallet/pay. Never rejects: whatever came back (or did not) is a `PayOutcome`. */
export function payQuestion(input: PayQuestionInput): Promise<PayOutcome<QuestionView>> {
  return sendPayment(
    () =>
      api.POST('/api/hub/dm/send/wallet/pay', {
        params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
        body: { questionId: input.questionId, expectedTotalKobo: input.expectedTotalKobo, quoteToken: input.quoteToken },
      }),
    readQuestion,
    'There is not enough in your wallet for this question.',
  );
}

type Envelope<T> = { data?: T | null };

/** The fan's thread with one creator: newest question first, each with its reply bubbles. */
export async function fetchThread(wawuId: string): Promise<ThreadDetail> {
  const body = (await unwrap(
    api.GET('/api/hub/paid-dm/threads/{wawuId}', { params: { path: { wawuId }, query: { as: 'fan', limit: THREAD_PAGE } } }),
  )) as unknown as Envelope<ThreadDetail>;
  const detail = body?.data;
  if (!detail || typeof detail !== 'object' || !detail.thread || !Array.isArray(detail.questions)) {
    throw new ApiError('unknown', 200, 'These questions could not be read. Try again.');
  }
  return detail;
}

/** Whether the Hub has paused the creator's paid messages (I8). Read on its own: a failed read leaves the creator's own switch to decide. */
export async function fetchAvailability(wawuId: string): Promise<Availability> {
  const body = (await unwrap(api.GET('/api/hub/paid-dm/creators/{wawuId}/availability', { params: { path: { wawuId } } }))) as unknown as Envelope<Availability>;
  const value = body?.data;
  if (!value || typeof value.paused !== 'boolean') throw new ApiError('unknown', 200, 'Whether this creator takes paid messages could not be read.');
  return value;
}
