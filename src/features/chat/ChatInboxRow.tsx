import { useRouter } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { ConversationRow, type ConversationKind } from '@/components/ConversationRow';
import { formatMoney } from '@/components/Money';
import { hueFor, UNNAMED_CREATOR } from '@/features/feed/model';
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

/**
 * What an Inbox row calls a person: their name, else their @handle, else "Someone". The Hub gives a person with no name `name: ""`
 * (every new account starts so), and a row used to draw that as a blank line.
 */
export function rowNameOf(person: Pick<ChatPerson, 'name' | 'handle'>): string {
  const name = person.name?.trim();
  if (name) return name;
  const handle = person.handle?.trim().replace(/^@/, '');
  return handle ? `@${handle}` : UNNAMED_CREATOR;
}

/** The name an avatar takes its initial from: the row's name without the "@" (so "@kemi" gives "K", not "@"). */
export const avatarNameOf = (person: Pick<ChatPerson, 'name' | 'handle'>): string => rowNameOf(person).replace(/^@/, '');

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
      const line = requestLine({ asker: preview.mine, amountKobo: preview.moneyRequest.amountKobo, status: preview.moneyRequest.status, memo: preview.text, other: rowNameOf(chat.other) });
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
      name={rowNameOf(chat.other)}
      preview={text}
      kind={kind}
      time={rowTime(item.lastActivityAt)}
      unread={item.unreadCount}
      tick={rowTick(chat.other)}
      // The support thread (SUPPORT-01) is the app's own row: its mark on the sunken surface, as the board draws "Who Made This?".
      lead={<Avatar name={avatarNameOf(chat.other)} hue={hueFor(chat.other.wawuId)} size={ROW_AVATAR} source={chat.other.avatarUrl ?? undefined} brand={chat.other.support === true} testID={`row-${item.id}-avatar`} decorative />}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } })}
    />
  );
}

/** A money request in the Money view (I20): who it is with, what was asked and how it stands. Tapping it opens the chat it is in. */
export function MoneyRequestInboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const request = item.moneyRequest;
  if (!request) return null;
  const line = requestLine({ asker: request.direction === 'outgoing', amountKobo: request.amountKobo, status: request.status, memo: request.memo, other: rowNameOf(request.other) });
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={rowNameOf(request.other)}
      preview={request.paying && request.status === 'pending' ? `Payment on its way · ${naira(request.amountKobo)}` : line.text}
      kind={line.kind}
      time={rowTime(item.lastActivityAt)}
      unread={0}
      tick={rowTick(request.other)}
      lead={<Avatar name={avatarNameOf(request.other)} hue={hueFor(request.other.wawuId)} size={ROW_AVATAR} source={request.other.avatarUrl ?? undefined} decorative />}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: request.chatId } })}
    />
  );
}
