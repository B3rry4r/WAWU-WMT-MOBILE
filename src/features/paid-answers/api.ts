import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The creator's side of paid questions (INBOX-18: I9, I10, I11), as the Hub's contract types it:
 * - `GET /paid-dm/waiting`: how many questions wait on a reply and what they were paid, over every one of them (the I9 card);
 * - `GET /paid-dm/queue`: the waiting list, soonest deadline first, a page at a time (the I9 rows);
 * - `GET /paid-dm/threads/{wawuId}?as=creator`: one fan's questions with their replies, each with what the creator earns by it
 *   (`creatorEarning`: the Hub's share, its percent and where the share is), newest first (I10, I11);
 * - `POST /paid-dm/questions/{messageId}/replies`: the answer, a write, sent with an `Idempotency-Key` (one per reply attempt).
 * Every figure on these screens is read from these answers; the app adds up and divides nothing (R-5, R-21).
 */
export type PaidWaiting = components['schemas']['PaidDmWaiting'];
export type PaidQueueItem = components['schemas']['PaidDmQueueItem'];
export type PaidQueuePage = components['schemas']['PaidDmQueuePage'];
export type PaidThreadDetail = components['schemas']['PaidDmThreadDetail'];
export type PaidQuestion = components['schemas']['PaidDmQuestion'];
export type PaidEarning = NonNullable<PaidQuestion['creatorEarning']>;
export type PaidPerson = components['schemas']['DmOtherParty'];

type Envelope<T> = { data?: T | null };

export const QUEUE_PAGE_SIZE = 20;
export const THREAD_PAGE_SIZE = 20;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const paidKeys = {
  root: ['paid-answers'] as const,
  waiting: ['paid-answers', 'waiting'] as const,
  queue: ['paid-answers', 'queue'] as const,
  thread: (wawuId: string) => ['paid-answers', 'thread', wawuId] as const,
};

export async function fetchWaiting(): Promise<PaidWaiting> {
  const waiting = dataOf<PaidWaiting>(await unwrap(api.GET('/api/hub/paid-dm/waiting')), 'waiting questions');
  if (typeof waiting.count !== 'number' || typeof waiting.amountKobo !== 'number') throw unreadable('waiting questions');
  return waiting;
}

export async function fetchQueuePage(cursor?: string): Promise<PaidQueuePage> {
  const page = dataOf<PaidQueuePage>(
    await unwrap(api.GET('/api/hub/paid-dm/queue', { params: { query: { limit: QUEUE_PAGE_SIZE, ...(cursor ? { cursor } : {}) } } })),
    'questions waiting for you',
  );
  if (!Array.isArray(page.items)) throw unreadable('questions waiting for you');
  return page;
}

export async function fetchThreadPage(wawuId: string, cursor?: string): Promise<PaidThreadDetail> {
  const page = dataOf<PaidThreadDetail>(
    await unwrap(
      api.GET('/api/hub/paid-dm/threads/{wawuId}', {
        params: { path: { wawuId }, query: { as: 'creator', limit: THREAD_PAGE_SIZE, ...(cursor ? { cursor } : {}) } },
      }),
    ),
    'conversation',
  );
  if (!Array.isArray(page.questions) || !page.thread) throw unreadable('conversation');
  return page;
}

/**
 * The answer. The `Idempotency-Key` is one per reply attempt and travels again, unchanged, on every retry of that attempt: the
 * Hub stores the reply once per key and answers a repeat with the first (INBOX-18 round 2), so a lost answer is safe to send
 * again. The Hub's refusal (window closed, already settled) keeps its own words in the ApiError.
 */
export async function postReply(messageId: string, text: string, key: string): Promise<PaidQuestion> {
  return dataOf<PaidQuestion>(
    await unwrap(
      api.POST('/api/hub/paid-dm/questions/{messageId}/replies', {
        params: { path: { messageId }, header: { 'Idempotency-Key': key } },
        body: { text },
        fetch: resendsUnderKey,
      }),
    ),
    'answer',
  );
}

/** The free chat with this person (R-13), opened or found: where Message on an answered question goes (I12). */
export async function openFreeChat(wawuId: string): Promise<string> {
  const chat = dataOf<components['schemas']['ChatSummary']>(await unwrap(api.POST('/api/hub/chats', { body: { wawuId } })), 'chat');
  return chat.id;
}

/**
 * Reports the conversation (G-INBOX-18-3): `POST /dm/{messageId}/report` for the question in hand. The Hub keeps one report per
 * person and question, so a second one is a 409 the screen reads as "already reported".
 */
export async function reportQuestion(questionId: string): Promise<void> {
  await unwrap(api.POST('/api/hub/dm/{messageId}/report', { params: { path: { messageId: questionId } }, body: {} }));
}

/** Blocks the person who asked (`POST /settings/privacy/blocked`, the same call as the profile's menu). */
export async function blockAsker(wawuId: string): Promise<void> {
  await unwrap(api.POST('/api/hub/settings/privacy/blocked', { body: { blockedWawuId: wawuId } }));
}
