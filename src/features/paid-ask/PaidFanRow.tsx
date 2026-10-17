import { useRouter } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { ConversationRow, type ConversationKind } from '@/components/ConversationRow';
import { tickOf } from '@/features/chat/api';
import { rowTime } from '@/features/communities/format';
import { hueFor } from '@/features/feed/model';
import type { InboxItem } from '@/features/inbox/api';

import { paidThreadHref } from './routes';
import { rowLeft } from './model';
import { useNow } from './useNow';

/** The rows of the Inbox this task draws: a fan's own paid questions, as the creator they asked reads them. The creator's side is INBOX-18's. */
export const drawsPaidFanRow = (item: InboxItem): boolean => item.kind === 'paid_dm' && item.paidDm?.side === 'fan';

/**
 * A paid question in the All list (I1): who was asked, "Paid DM · 18h left to reply" while one waits (the Hub's soonest deadline), the last
 * words once none does, the time and what is unread. It opens the thread (I4, I5, I7).
 */
export function PaidFanRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const now = useNow(60_000);
  const dm = item.paidDm;
  if (!dm || dm.side !== 'fan') return null;
  const left = dm.waitingCount > 0 && dm.nextDeadlineAt ? rowLeft(dm.nextDeadlineAt, now) : null;
  let text = 'Paid DM';
  let kind: ConversationKind | undefined;
  if (left !== null) {
    text = `Paid DM · ${left} left to reply`;
    kind = 'dm';
  } else if (item.preview?.text?.trim()) {
    text = item.preview.mine ? `You: ${item.preview.text.trim()}` : item.preview.text.trim();
  }
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={dm.other.name}
      preview={text}
      kind={kind}
      time={rowTime(item.lastActivityAt)}
      unread={item.unreadCount}
      tick={tickOf(dm.other)}
      lead={<Avatar name={dm.other.name} hue={hueFor(dm.other.wawuId)} size={52} source={dm.other.avatarUrl ?? undefined} decorative />}
      onPress={() => router.push(paidThreadHref(dm.other.wawuId))}
    />
  );
}
