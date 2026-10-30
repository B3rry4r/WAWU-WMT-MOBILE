import { api, unwrap } from '@/api/client';
import { ApiError, failureOf } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { formatBytes } from '@/features/create/model';
import { filled } from '@/features/money-attempt/refusal';

import { readMessage, type ChatMessage } from './api';

/**
 * Photos, videos and files in a chat (FIX-104, board I13): the Hub's calls, in the order a send runs them.
 * 1. `POST /chats/{chatId}/attachments`: where to upload one photo, video or PDF (the Hub checks the type, the size, a block and
 *    the sender's storage before it signs anything);
 * 2. a PUT of the bytes to that address;
 * 3. `POST /uploads/confirm`: the storage host's own word that the file landed;
 * 4. `POST /chats/{chatId}/messages` with `attachment.key`, once per `clientMessageId`.
 * A file that is reserved (step 1) and never sent is counted until it is given back: `POST /uploads/release` with its key (a failed upload that is tried
 * again, a failed bubble that is deleted). The Hub gives back what is still left a day on.
 * To open a file: `GET /chats/{chatId}/messages/{messageId}/attachment`, a fresh link that only the two people in the chat get.
 * What a chat takes (types and sizes) is the Hub's: `GET /chats/attachment-rules`.
 */
export type ChatAttachmentRules = components['schemas']['ChatAttachmentRules'];
export type ChatAttachmentLink = components['schemas']['ChatAttachmentLink'];

type Envelope<T> = { data?: T | null };

/** The code of the error the upload itself raises, so a screen knows its sentence is ready to show. */
export const ATTACHMENT_UPLOAD_FAILED = 'upload_failed';

export const attachmentRulesKey = ['chat', 'attachment-rules'] as const;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

const wholeRule = (rule: unknown): boolean => {
  const r = rule as { contentTypes?: unknown; maxBytes?: unknown } | null;
  return !!r && Array.isArray(r.contentTypes) && Number.isSafeInteger(r.maxBytes);
};

/** GET /chats/attachment-rules: the types and the largest size of a photo or video and of a file. */
export async function fetchAttachmentRules(): Promise<ChatAttachmentRules> {
  const body = (await unwrap(api.GET('/api/hub/chats/attachment-rules'))) as unknown as Envelope<ChatAttachmentRules>;
  const rules = body?.data;
  if (!rules || !wholeRule(rules.media) || !wholeRule(rules.file)) throw unreadable('chat file rules');
  return rules;
}

/** "PDF, up to 20 MB": what the File row says, from the Hub's own rule. Left out (null) until the Hub has answered. */
export function fileLine(rules: ChatAttachmentRules | undefined): string | null {
  if (!rules) return null;
  const names = rules.file.contentTypes.map((type) => (type === 'application/pdf' ? 'PDF' : (type.split('/')[1] ?? type).toUpperCase()));
  if (names.length === 0) return null;
  return `${names.join(', ')}, up to ${formatBytes(rules.file.maxBytes)}`;
}

/** A chosen file, as a chat sends it. */
export type ChatFile = {
  blob: Blob;
  /** The file's own name, shown on a PDF. */
  name: string;
  /** What `POST /chats/{chatId}/attachments` takes as `contentType`. */
  contentType: string;
  /** Where the screen can draw it, when it is a photo (or a video the phone can show). */
  previewUri?: string;
  /** Phone builds: deletes the app's own copy once the send has settled. */
  discard?: () => void;
};

export type ChatFileKind = 'image' | 'video' | 'file';

export const kindOfType = (contentType: string): ChatFileKind => (contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : 'file');

/** Where the Hub said to upload one file: the address to PUT to and the key the send takes. */
type UploadTarget = { uploadUrl?: string; key?: string };

/**
 * Steps 2 and 3 for an address the Hub gave (a one-to-one chat's, or a legal matter's): sends the bytes, then asks the Hub to confirm they
 * landed. Answers the key the send takes.
 */
async function putAndConfirm(target: UploadTarget | null | undefined, file: Pick<ChatFile, 'blob' | 'contentType'>, onReserved?: (key: string) => void): Promise<string> {
  if (!target || !filled(target.uploadUrl) || !filled(target.key)) throw unreadable('upload address');
  // The Hub counts the file from here: whoever called knows which key to give back if the rest fails.
  onReserved?.(target.key as string);
  let response: Response;
  try {
    response = await fetch(target.uploadUrl as string, { method: 'PUT', headers: { 'content-type': file.contentType }, body: file.blob });
  } catch (error) {
    throw failureOf(error);
  }
  if (!response.ok) throw new ApiError('server', response.status, 'That file did not upload. Try again.', ATTACHMENT_UPLOAD_FAILED);
  const settled = (await unwrap(api.POST('/api/hub/uploads/confirm', { body: { key: target.key as string } }))) as unknown as Envelope<{ status?: unknown }>;
  if (settled?.data?.status === 'abandoned') throw new ApiError('server', 0, 'That file did not upload. Try again.', ATTACHMENT_UPLOAD_FAILED);
  return target.key as string;
}

/**
 * Steps 1 to 3: asks the Hub where to upload, sends the bytes, and asks the Hub to confirm they landed. Answers the key the send takes.
 * The Hub's own sentence travels with a refusal (a type a chat cannot hold, a file over the size, storage full, a block).
 */
export async function uploadChatFile(chatId: string, file: Pick<ChatFile, 'blob' | 'contentType'>, onReserved?: (key: string) => void): Promise<string> {
  const body = (await unwrap(
    api.POST('/api/hub/chats/{chatId}/attachments', {
      params: { path: { chatId } },
      body: { contentType: file.contentType as 'application/pdf', contentLength: file.blob.size },
    }),
  )) as unknown as Envelope<UploadTarget>;
  return putAndConfirm(body?.data, file, onReserved);
}

/** The same three steps for a legal matter's chat (R2-LEGAL3): `POST /legal/assistant/{id}/attachments` says where, the rest is the chat's. */
export async function uploadLegalFile(threadId: string, file: Pick<ChatFile, 'blob' | 'contentType'>, onReserved?: (key: string) => void): Promise<string> {
  const body = (await unwrap(
    api.POST('/api/hub/legal/assistant/{id}/attachments', {
      params: { path: { id: threadId } },
      body: { contentType: file.contentType as 'application/pdf', contentLength: file.blob.size },
    }),
  )) as unknown as Envelope<UploadTarget>;
  return putAndConfirm(body?.data, file, onReserved);
}

/**
 * POST /uploads/release: gives back a chat upload that will not be sent (a failed upload being tried again, a failed bubble deleted), so it stops
 * counting toward the person's storage. Never throws: a key the Hub no longer holds, or one a message already carries, needs nothing from here.
 */
export async function releaseChatUpload(key: string): Promise<void> {
  try {
    await unwrap(api.POST('/api/hub/uploads/release', { body: { key } }));
  } catch {
    // Left for the Hub: a reservation that never landed is settled after 15 minutes, a landed file that no message carries is given back a day on.
  }
}

/** Step 4: POST /chats/{chatId}/messages with the uploaded file; the same `clientMessageId` again answers the message already stored. */
export async function sendChatFile(chatId: string, key: string, name: string | null, clientMessageId: string): Promise<ChatMessage> {
  const body = (await unwrap(
    api.POST('/api/hub/chats/{chatId}/messages', {
      params: { path: { chatId } },
      body: { attachment: { key, ...(name ? { name } : {}) }, clientMessageId },
    }),
  )) as unknown as Envelope<ChatMessage>;
  return readMessage(body?.data);
}

/** GET /chats/{chatId}/messages/{messageId}/attachment: a fresh link to open one file. */
export async function fetchAttachmentLink(chatId: string, messageId: string): Promise<ChatAttachmentLink> {
  const body = (await unwrap(
    api.GET('/api/hub/chats/{chatId}/messages/{messageId}/attachment', { params: { path: { chatId, messageId } } }),
  )) as unknown as Envelope<ChatAttachmentLink>;
  const link = body?.data;
  if (!link || !filled(link.url)) throw unreadable('file link');
  return link;
}
