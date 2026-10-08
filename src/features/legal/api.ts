import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * The legal assistant's calls (S14 to S17), as the Hub's contract types them (LEGAL-01):
 * - `POST /legal/assistant`: open the conversation, or pick up the unfinished one;
 * - `GET /legal/assistant/{id}`: the whole conversation;
 * - `POST /legal/assistant/{id}/messages`: typed words (`body`) or a tap (`quickReplyId`);
 * - `POST /legal/assistant/{id}/reply`: ask the assistant again after a 503;
 * - `POST /legal/assistant/{id}/send`: "Send to a consultant";
 * - `GET /legal/intake/mine`: where a conversation already sent to a consultant is found again.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data`
 * (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
export type LegalThread = components['schemas']['LegalAssistantThread'];
export type LegalMessage = components['schemas']['LegalAssistantMessage'];
export type LegalQuickReply = components['schemas']['LegalAssistantQuickReply'];
export type LegalBrief = components['schemas']['LegalAssistantBrief'];
type IntakeView = components['schemas']['IntakeView'];

/** What one message carries: words, or the id of a tap the thread offered. Exactly one. */
export type LegalSend = { body: string } | { quickReplyId: string };

type Envelope<T> = { data?: T | null };

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'The conversation could not be read. Try again.');
}

function threadOf(body: unknown): LegalThread {
  const data = (body as Envelope<LegalThread> | null)?.data;
  if (!data || typeof data !== 'object' || !Array.isArray(data.messages) || typeof data.id !== 'string') throw unreadable();
  return data;
}

export const legalKeys = {
  all: ['legal'] as const,
  thread: ['legal', 'thread'] as const,
};

/** The conversation `id` names. */
export async function fetchThread(id: string): Promise<LegalThread> {
  return threadOf(await unwrap(api.GET('/api/hub/legal/assistant/{id}', { params: { path: { id } } })));
}

/** Opens a new conversation, or returns the unfinished one. */
export async function openThread(): Promise<LegalThread> {
  return threadOf(await unwrap(api.POST('/api/hub/legal/assistant')));
}

export async function sendMessage(id: string, message: LegalSend): Promise<LegalThread> {
  return threadOf(await unwrap(api.POST('/api/hub/legal/assistant/{id}/messages', { params: { path: { id } }, body: message })));
}

export async function askAgain(id: string): Promise<LegalThread> {
  return threadOf(await unwrap(api.POST('/api/hub/legal/assistant/{id}/reply', { params: { path: { id } } })));
}

export async function sendToConsultant(id: string): Promise<LegalThread> {
  return threadOf(await unwrap(api.POST('/api/hub/legal/assistant/{id}/send', { params: { path: { id } } })));
}

/** How many earlier conversations are looked at when finding the one the person is in. */
const EARLIER_LOOKED_AT = 5;

function rowsOf(body: unknown): IntakeView[] {
  const data = (body as Envelope<IntakeView[]> | null)?.data;
  if (Array.isArray(data)) return data;
  return Array.isArray(body) ? (body as IntakeView[]) : [];
}

/**
 * The conversation the person is in, newest first: one still being profiled, or one sent to a
 * consultant that no quote has answered yet (`requestStatus` `awaiting_quote`, where a consultant
 * joins before any payment); otherwise a new one. The Hub has no route that returns a sent
 * conversation on its own, so the person's intakes are read and the likely ones asked for; an
 * intake from the older form answers 404 and is passed over (BACKEND_GAPS G-471).
 */
export async function resolveThread(): Promise<LegalThread> {
  const rows = rowsOf(await unwrap(api.GET('/api/hub/legal/intake/mine')));
  const likely = rows.filter((row) => row.status === 'in_progress' || Boolean(row.legalRequestId)).slice(0, EARLIER_LOOKED_AT);
  for (const row of likely) {
    try {
      const thread = await fetchThread(row.id);
      if (thread.stage !== 'sent' || thread.requestStatus === 'awaiting_quote') return thread;
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== 'not_found') throw error;
    }
  }
  return openThread();
}
