import { isApiError } from '@/api/errors';
import { APP_NAME_COPY } from '@/lib/appName';

import type { LegalBrief, LegalMessage, LegalQuickReply, LegalThread } from './api';

/** The assistant's name in a chat header (S14 to S17): the app's name, then Legal (R-69). */
export const LEGAL_NAME = `${APP_NAME_COPY} Legal`;

/** The consultant's first name ("Adaora" for "Adaora Nnaji"), or null when the Hub holds no name. */
export function firstNameOf(name: string | null | undefined): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? first : null;
}

export type ChatRow =
  | { kind: 'bubble'; id: string; mine: boolean; body: string }
  /** A photo, video or PDF on a line (R2-LEGAL3): drawn with the one-to-one chat's file bubble. `url` is the link the Hub served with the conversation. */
  | { kind: 'file'; id: string; mine: boolean; contentType: string; name: string | null; bytes: number; url: string | null }
  | { kind: 'who'; id: string; text: string }
  | { kind: 'system'; id: string; text: string };

/**
 * The thread as S14 to S17 draw it, oldest first. A consultant's messages are named once at the start of each
 * run ("Adaora Nnaji · Consultant", S17), and the line "Adaora joined. The assistant has stopped replying."
 * stands before the first of them, wherever the consultant's first message falls among the client's.
 */
export function chatRows(thread: LegalThread): ChatRow[] {
  const rows: ChatRow[] = [];
  const joined = firstNameOf(thread.consultant?.name);
  let announced = false;
  let previous: LegalMessage['authorRole'] | null = null;
  for (const message of thread.messages) {
    if (message.authorRole === 'consultant') {
      if (!announced) {
        announced = true;
        rows.push({
          kind: 'system',
          id: `joined-${message.id}`,
          text: `${joined ?? 'A consultant'} joined. The assistant has stopped replying.`,
        });
      }
      if (previous !== 'consultant') {
        const name = (message.consultantName ?? thread.consultant?.name ?? '').trim();
        rows.push({ kind: 'who', id: `who-${message.id}`, text: name ? `${name} · Consultant` : 'Consultant' });
      }
    }
    const mine = message.authorRole === 'client';
    if (message.attachment) {
      const { contentType, name, bytes, url } = message.attachment;
      rows.push({ kind: 'file', id: message.id, mine, contentType, name: name ?? null, bytes, url: url ?? null });
    } else {
      rows.push({ kind: 'bubble', id: message.id, mine, body: message.body });
    }
    previous = message.authorRole;
  }
  return rows;
}

export type ChatHeader = {
  title: string;
  sub: string;
  /** A consultant's initials on a pink disc (S17), not the assistant's scales. */
  human: boolean;
};

/** Whether the person has said anything yet: S14 is the conversation before that. */
export function hasSpoken(thread: LegalThread): boolean {
  return thread.messages.some((m) => m.authorRole === 'client');
}

/** The bar's name and the line under it, from where the conversation stands. */
export function headerOf(thread: LegalThread): ChatHeader {
  if (thread.consultant) {
    return { title: thread.consultant.name?.trim() || 'Consultant', sub: thread.consultant.name?.trim() ? `Consultant · ${LEGAL_NAME}` : LEGAL_NAME, human: true };
  }
  if (thread.stage === 'sent') return { title: LEGAL_NAME, sub: 'Waiting for a consultant', human: false };
  return { title: LEGAL_NAME, sub: hasSpoken(thread) ? 'Assistant' : 'Assistant · a consultant takes over', human: false };
}

/**
 * Whether the person can send files in this conversation (R2-LEGAL3): once the Hub has made the matter (a sent brief, or a started fixed-price
 * request) and until it is delivered or cancelled. Before then there is nothing to attach them to.
 */
export function canAttach(thread: Pick<LegalThread, 'legalRequestId' | 'requestStatus'>): boolean {
  return Boolean(thread.legalRequestId) && thread.requestStatus !== 'delivered' && thread.requestStatus !== 'cancelled';
}

/** The composer's hint: S14 "Type your message", S16 "Add anything else", S17 "Message Adaora". */
export function placeholderOf(thread: LegalThread): string {
  const first = firstNameOf(thread.consultant?.name);
  if (thread.consultant) return first ? `Message ${first}` : 'Message your consultant';
  if (thread.stage === 'sent') return 'Message a consultant';
  return thread.stage === 'brief_ready' ? 'Add anything else' : 'Type your message';
}

/** The brief card (S16): only while it can be sent. */
export function briefToConfirm(thread: LegalThread): LegalBrief | null {
  return thread.stage === 'brief_ready' && thread.brief?.ready ? thread.brief : null;
}

/** The taps under the newest assistant line: none once sent, none while an answer is awaited, none beside the brief card. */
export function tapsOf(thread: LegalThread): LegalQuickReply[] {
  if (thread.stage !== 'profiling' || thread.awaitingReply) return [];
  return thread.quickReplies;
}

/** The assistant could not answer the last message: it is kept, and "Ask again" asks for the reply. */
export function needsAnotherAsk(thread: LegalThread): boolean {
  return thread.stage !== 'sent' && thread.awaitingReply;
}

/** What a typed message can be sent as: words with something in them, trimmed. */
export function typedBody(draft: string): string | null {
  const body = draft.trim();
  return body === '' ? null : body;
}

/** Why a call failed, in the server's own sentence, or a plain one when there was none. */
export function failureText(error: unknown): string {
  return isApiError(error) && error.message ? error.message : 'Something went wrong. Try again.';
}

export type FailureKind = 'offline' | 'unavailable' | 'other';

/** `unavailable` is the assistant that could not answer (503): the message was kept, so the answer is to ask again. */
export function failureKind(error: unknown): FailureKind {
  if (!isApiError(error)) return 'other';
  if (error.kind === 'network') return 'offline';
  if (error.status === 503 && (error.code === 'assistant_unavailable' || error.code === 'assistant_at_capacity')) return 'unavailable';
  return 'other';
}

/** The assistant cannot answer because its provider's allowance is spent, not because it is slow: the Hub's code for it (R2-LEGAL2, CHECK-3 M-4). */
export const isAtCapacity = (error: unknown): boolean => isApiError(error) && error.code === 'assistant_at_capacity';

/** What the note says while the assistant is busy, and while it is only slow. The message is kept either way, and "Ask again" asks for the answer. */
export const BUSY_NOTE = 'The assistant is busy right now. Your message is saved.';
export const SLOW_NOTE = 'The assistant is taking a while to answer. Your message is saved.';

/** The words of a live frame that says a conversation changed (LEGAL-02, BACKEND_GAPS G-502). */
export function isLegalLiveEvent(event: unknown): boolean {
  return typeof event === 'object' && event !== null && (event as { type?: unknown }).type === 'legal.thread';
}

/**
 * Whether sending the same thing again can work: no connection, the server in trouble, or the assistant busy or
 * unable to answer. Words that are too long, a day's limit reached and a conversation that is full are not.
 */
export function canTryAgain(error: unknown): boolean {
  if (!isApiError(error)) return true;
  return error.kind === 'network' || error.kind === 'server' || error.code === 'assistant_busy' || error.code === 'assistant_unavailable' || error.code === 'assistant_at_capacity';
}
