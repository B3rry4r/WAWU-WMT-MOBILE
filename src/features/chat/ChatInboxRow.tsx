import { useRouter } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { ConversationRow, type ConversationKind } from '@/components/ConversationRow';
import { formatMoney } from '@/components/Money';
import { hueFor } from '@/features/feed/model';
import { firstName, rowTime } from '@/features/communities/format';
import type { InboxItem } from '@/features/inbox/api';

import { tickOf, type ChatPerson } from './api';

const ROW_AVATAR = 52;
const naira = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

export type RequestLook = { asker: boolean; amountKobo: number; status: 'pending' | 'paid' | 'cancelled' | 'declined'; memo: string | null; other: string };

/**
 * The line under a name for a money request (I20, and a chat whose last message is one): "Requested ₦12,000 · Logo edits" from them,
 * "You requested ₦12,000" from the person, and what became of it ("You paid ₦12,000", "Femi paid ₦12,000", "Femi declined ₦12,000").
 * Every figure and word is the Hub's.
 */
export function requestLine({ asker, amountKobo, status, memo, other }: RequestLook): { text: string; kind: ConversationKind } {
  const amount = naira(amountKobo);
  const who = firstName(other) || 'They';
  const why = memo?.trim() ? ` · ${memo.trim()}` : '';
  switch (status) {
    case 'paid':
      return { text: `${asker ? `${who} paid` : 'You paid'} ${amount}${why}`, kind: 'done' };
    case 'declined':
      return { text: `${asker ? `${who} declined` : 'You declined'} ${amount}${why}`, kind: 'req' };
    case 'cancelled':
      return { text: `Request for ${amount} cancelled${why}`, kind: 'req' };
    default:
      return { text: `${asker ? 'You requested' : 'Requested'} ${amount}${why}`, kind: 'req' };
  }
}

export type MoveLook = { outgoing: boolean; amountKobo: number; status: 'pending' | 'completed' | 'reversed'; note: string | null };

/**
 * The line under a name for a send between two people (I20): "Sent you ₦5,000" with the arrow-in glyph, "You sent ₦25,000" with none (as the board
 * draws them), then the sender's own note after a dot when they wrote one. A send the provider has not confirmed reads "Payment on its way" (the words
 * a request being paid uses; the Hub shows it to the sender only), and one that was sent back reads "Reversed" (the word the wallet history uses).
 * Every figure and word is the Hub's.
 */
export function moveLine({ outgoing, amountKobo, status, note }: MoveLook): { text: string; kind?: ConversationKind } {
  const amount = naira(amountKobo);
  const why = note?.trim() ? ` · ${note.trim()}` : '';
  if (status === 'reversed') return { text: `Reversed ${amount}${why}`, kind: 'refund' };
  if (status === 'pending') return { text: `Payment on its way · ${amount}` };
  return outgoing ? { text: `You sent ${amount}${why}` } : { text: `Sent you ${amount}${why}`, kind: 'money' };
}

/** The tick a row draws after a name. */
const rowTick = (person: Pick<ChatPerson, 'verification'>) => tickOf(person);

/** A chat in the All list (I1): the person, what was said last and by whom, the time and what is unread. Tapping it opens the chat (I12). */
export function ChatInboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const chat = item.chat;
  if (!chat) return null;
  const preview = item.preview;
  let text = 'No messages yet';
  let kind: ConversationKind | undefined;
  if (preview) {
    if (preview.moneyRequest) {
      const line = requestLine({ asker: preview.mine, amountKobo: preview.moneyRequest.amountKobo, status: preview.moneyRequest.status, memo: preview.text, other: chat.other.name });
      text = line.text;
      kind = line.kind;
    } else {
      const words = preview.text?.trim() || (preview.attachment === 'image' ? 'Photo' : preview.attachment === 'video' ? 'Video' : preview.attachment === 'file' ? 'File' : '');
      if (words) text = preview.mine ? `You: ${words}` : words;
    }
  }
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={chat.other.name}
      preview={text}
      kind={kind}
      time={rowTime(item.lastActivityAt)}
      unread={item.unreadCount}
      tick={rowTick(chat.other)}
      // The support thread (SUPPORT-01) is the app's own row: its mark on the sunken surface, as the board draws "Who Made This?".
      lead={<Avatar name={chat.other.name} hue={hueFor(chat.other.wawuId)} size={ROW_AVATAR} source={chat.other.avatarUrl ?? undefined} brand={chat.other.support === true} testID={`row-${item.id}-avatar`} decorative />}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } })}
    />
  );
}

/** A money request in the Money view (I20): who it is with, what was asked and how it stands. Tapping it opens the chat it is in. */
export function MoneyRequestInboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const request = item.moneyRequest;
  if (!request) return null;
  const line = requestLine({ asker: request.direction === 'outgoing', amountKobo: request.amountKobo, status: request.status, memo: request.memo, other: request.other.name });
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={request.other.name}
      preview={request.paying && request.status === 'pending' ? `Payment on its way · ${naira(request.amountKobo)}` : line.text}
      kind={line.kind}
      time={rowTime(item.lastActivityAt)}
      unread={0}
      tick={rowTick(request.other)}
      lead={<Avatar name={request.other.name} hue={hueFor(request.other.wawuId)} size={ROW_AVATAR} source={request.other.avatarUrl ?? undefined} decorative />}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: request.chatId } })}
    />
  );
}

/** A send between two people in the Money view (I20): who it is with, what was sent and in which direction. Tapping it opens the chat of the two. */
export function MoneyMoveInboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const move = item.moneyMove;
  if (!move) return null;
  const line = moveLine({ outgoing: move.direction === 'outgoing', amountKobo: move.amountKobo, status: move.status, note: move.note });
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={move.other.name}
      preview={line.text}
      kind={line.kind}
      time={rowTime(item.lastActivityAt)}
      unread={0}
      tick={rowTick(move.other)}
      lead={<Avatar name={move.other.name} hue={hueFor(move.other.wawuId)} size={ROW_AVATAR} source={move.other.avatarUrl ?? undefined} decorative />}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: move.chatId } })}
    />
  );
}
