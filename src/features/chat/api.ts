import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { nameOrSomeone } from '@/features/feed/model';
import { filled } from '@/features/money-attempt/refusal';
import { newRequestKey } from '@/features/wallet/api/settings';

/**
 * The calls behind a chat between two people (INBOX-19: I12 to I15; INBOX-20: I16 to I19), as the Hub's contract types them
 * (INBOX-06, INBOX-15):
 * - `GET /chats/{chatId}`: the chat, the other person, and whether either can still write (`canMessage`);
 * - `GET /chats/{chatId}/messages`: newest first, cursor-paged with an opaque cursor, sent back exactly as given;
 * - `POST /chats/{chatId}/messages`: one text message, once per `clientMessageId`;
 * - `POST /chats/{chatId}/read`: marks the chat read up to a message.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type ChatPerson = components['schemas']['ChatPerson'];
export type ChatSummary = components['schemas']['ChatSummary'];
export type ChatMessage = components['schemas']['ChatMessage'];
export type ChatMessagePage = components['schemas']['ChatMessagePage'];
export type MoneyRequest = components['schemas']['MoneyRequestView'];

type Envelope<T> = { data?: T | null };

/** How many messages one page asks for: the Hub's own default, written down so a page is the same everywhere. */
export const CHAT_PAGE_SIZE = 30;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

export const chatKey = (chatId: string) => ['chat', chatId] as const;
export const chatMessagesKey = (chatId: string) => ['chat', chatId, 'messages'] as const;

const KINDS = ['text', 'image', 'video', 'file', 'money_request'] as const;

/** One message, whole: an id, a known kind, a time. A request with no request attached is refused, never drawn half empty. */
export function readMessage(value: unknown): ChatMessage {
  const m = value as Partial<ChatMessage> | null;
  const ok =
    m &&
    typeof m === 'object' &&
    filled(m.id) &&
    filled(m.senderWawuId) &&
    filled(m.createdAt) &&
    KINDS.includes(m.kind as (typeof KINDS)[number]) &&
    (m.kind !== 'money_request' || (m.moneyRequest && filled(m.moneyRequest.id) && Number.isSafeInteger(m.moneyRequest.amountKobo)));
  if (!ok) throw unreadable('message');
  return m as ChatMessage;
}

/** GET /chats/{chatId}. */
export async function fetchChat(chatId: string): Promise<ChatSummary> {
  const body = (await unwrap(api.GET('/api/hub/chats/{chatId}', { params: { path: { chatId } } }))) as unknown as Envelope<ChatSummary>;
  const chat = body?.data;
  if (!chat || !filled(chat.id) || !chat.other || !filled(chat.other.wawuId)) throw unreadable('chat');
  // The Hub gives a person with no name and no handle `name: ""`: they are named as the feed names them, and the chat opens.
  return { ...chat, other: { ...chat.other, name: nameOrSomeone(chat.other.name, chat.other.handle) } };
}

/** One page of messages, newest first. `nextCursor` is null on the last page. */
export async function fetchChatMessages(chatId: string, cursor?: string): Promise<ChatMessagePage> {
  const body = (await unwrap(
    api.GET('/api/hub/chats/{chatId}/messages', { params: { path: { chatId }, query: { limit: CHAT_PAGE_SIZE, ...(cursor ? { cursor } : {}) } } }),
  )) as unknown as Envelope<ChatMessagePage>;
  const page = body?.data;
  if (!page || !Array.isArray(page.items)) throw unreadable('messages');
  return { items: page.items.map(readMessage), nextCursor: page.nextCursor ?? null };
}

/** POST /chats/{chatId}/messages: the same `clientMessageId` again answers the message already stored. */
export async function sendChatText(chatId: string, text: string, clientMessageId: string): Promise<ChatMessage> {
  const body = (await unwrap(
    api.POST('/api/hub/chats/{chatId}/messages', { params: { path: { chatId } }, body: { text, clientMessageId } }),
  )) as unknown as Envelope<ChatMessage>;
  return readMessage(body?.data);
}

/** POST /chats/{chatId}/read. */
export async function markChatRead(chatId: string, messageId?: string): Promise<void> {
  await unwrap(api.POST('/api/hub/chats/{chatId}/read', { params: { path: { chatId } }, body: messageId ? { messageId } : {} }));
}

/** The app's own id for one message (8 to 64 letters, digits, `_` and `-`): a resend after a lost answer carries the same one. */
export const newClientMessageId = newRequestKey;

/** "creator" or "pro" for a person's tick, when they have one. */
export function tickOf(person: Pick<ChatPerson, 'verification'>): 'creator' | 'pro' | undefined {
  if (person.verification.creator.verified) return 'creator';
  if (person.verification.professional.verified) return 'pro';
  return undefined;
}
