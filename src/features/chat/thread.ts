import { dayKey, dayLabel } from '@/features/communities/format';

import type { ChatMessage } from './api';
import type { ChatSend } from './sends';
import type { OutgoingText } from './useChatThread';

/** What the thread draws, newest first, as the inverted list takes it. */
export type ThreadItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage }
  | { kind: 'out'; key: string; entry: OutgoingText }
  | { kind: 'sent'; key: string; send: ChatSend };

const atOf = (item: Exclude<ThreadItem, { kind: 'day' }>): string => {
  if (item.kind === 'message') return item.message.createdAt;
  if (item.kind === 'out') return item.entry.createdAt;
  return new Date(item.send.at).toISOString();
};

/**
 * The thread newest first: the Hub's messages, the person's own sends that are still on their way, and the sends this phone made from the
 * chat (`./sends`), each day's label after (above) that day's oldest item. The phone's own pending messages are the newest thing there is,
 * so they sit at the bottom whatever their clock says.
 */
export function threadItems(messages: readonly ChatMessage[], outgoing: readonly OutgoingText[], sends: readonly ChatSend[], now: Date = new Date()): ThreadItem[] {
  const settled: Exclude<ThreadItem, { kind: 'day' } | { kind: 'out' }>[] = [
    ...messages.map((message) => ({ kind: 'message' as const, key: message.id, message })),
    ...sends.map((send) => ({ kind: 'sent' as const, key: `sent-${send.transferId}`, send })),
  ].sort((a, b) => Date.parse(atOf(b)) - Date.parse(atOf(a)));
  const items: ThreadItem[] = [];
  for (let i = outgoing.length - 1; i >= 0; i -= 1) {
    const entry = outgoing[i];
    if (entry) items.push({ kind: 'out', key: entry.localId, entry });
  }
  settled.forEach((item, i) => {
    items.push(item);
    const older = settled[i + 1];
    if (!older || dayKey(atOf(older)) !== dayKey(atOf(item))) items.push({ kind: 'day', key: `day-${dayKey(atOf(item))}`, label: dayLabel(atOf(item), now) });
  });
  return items;
}

/** The words a message of another kind carries when it has none of its own: what the app can say of it without opening it. */
export function messageWords(message: Pick<ChatMessage, 'kind' | 'text' | 'attachment'>): string {
  if (message.text) return message.text;
  if (message.kind === 'image') return 'Photo';
  if (message.kind === 'video') return 'Video';
  if (message.kind === 'file') return message.attachment?.name?.trim() || 'File';
  return '';
}
