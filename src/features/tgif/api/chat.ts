import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import type { ShareCard } from './tgif';

/**
 * H35's "send in chat" calls, as the Hub's contract types them (INBOX-06, free chat between users):
 * - `GET /chats`: the caller's chats, newest first;
 * - `POST /chats/{chatId}/attachments`: where to upload the card's picture;
 * - `POST /chats/{chatId}/messages`: the message, with the picture and the link.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type ChatSummary = components['schemas']['ChatSummary'];

/** The `code` of the error the upload itself raises. */
export const UPLOAD_FAILED = 'upload_failed';

/** How many chats the picker offers: the newest, which is who a person is talking to now. */
const PICKER_LIMIT = 30;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const chatsKey = ['tgif', 'chats'] as const;

export async function fetchChats(): Promise<ChatSummary[]> {
  const page = dataOf<{ items: ChatSummary[] }>(
    await unwrap(api.GET('/api/hub/chats', { params: { query: { limit: PICKER_LIMIT } } })),
    'chats',
  );
  if (!Array.isArray(page.items)) throw unreadable('chats');
  return page.items;
}

/** A fresh id for one send, so sending it again never posts the card twice. */
export function newMessageId(): string {
  const random = Math.random().toString(36).slice(2, 12);
  return `tgif-${Date.now().toString(36)}-${random}`;
}

/** Sends the card's picture to one chat, with the link under it when there is one. */
export async function sendCardToChat(chatId: string, card: ShareCard, fileName: string, link: string | null, messageId: string): Promise<void> {
  const upload = dataOf<{ uploadUrl: string; key: string }>(
    await unwrap(
      api.POST('/api/hub/chats/{chatId}/attachments', {
        params: { path: { chatId } },
        body: { contentType: 'image/png', contentLength: card.blob.size },
      }),
    ),
    'upload',
  );
  let put: Response;
  try {
    put = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: card.blob });
  } catch {
    throw new ApiError('network', 0, 'No connection. Check your internet and try again.');
  }
  if (!put.ok) throw new ApiError('server', put.status, 'The card did not upload. Try again.', UPLOAD_FAILED);
  dataOf<{ id: string }>(
    await unwrap(
      api.POST('/api/hub/chats/{chatId}/messages', {
        params: { path: { chatId } },
        body: { attachment: { key: upload.key, name: fileName }, ...(link ? { text: link } : {}), clientMessageId: messageId },
      }),
    ),
    'message',
  );
}
