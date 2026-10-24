import { useRouter } from 'expo-router';

import { Avatar } from '@/components/Avatar';
import { ConversationRow, type ConversationKind } from '@/components/ConversationRow';
import { tickOf } from '@/features/chat/api';
import { avatarNameOf, rowNameOf } from '@/features/chat/ChatInboxRow';
import { rowTime } from '@/features/communities/format';
import { hueFor } from '@/features/feed/model';
import type { InboxItem } from '@/features/inbox/api';

import { leftShort, msLeft } from './model';
import { paidThreadHref } from './routes';
import { useNow } from './useNow';

/** The rows of the Inbox this task draws: a fan's paid questions, as the creator they were asked of reads them. The fan's own side is INBOX-10's. */
export const drawsPaidRow = (item: InboxItem): boolean => item.kind === 'paid_dm' && item.paidDm?.side === 'creator';

/**
 * A paid question in the All list (I1): who asked, "Paid DM · 18h left to reply" while one waits (the Hub's soonest deadline), the last
 * words once none does, the time and what is unread. It opens the conversation (I10, I11).
 */
export function PaidInboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const now = useNow();
  const dm = item.paidDm;
  if (!dm || dm.side !== 'creator') return null;
  const left = dm.waitingCount > 0 && dm.nextDeadlineAt ? msLeft(dm.nextDeadlineAt, now) : null;
  let text = 'Paid DM';
  let kind: ConversationKind | undefined;
  if (left !== null) {
    text = `Paid DM · ${dm.waitingCount > 1 ? `${dm.waitingCount} waiting · ` : ''}${leftShort(left)} left to reply`;
    kind = 'dm';
  } else if (item.preview?.text?.trim()) {
    text = item.preview.mine ? `You: ${item.preview.text.trim()}` : item.preview.text.trim();
  }
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={rowNameOf(dm.other)}
      preview={text}
      kind={kind}
      time={rowTime(item.lastActivityAt)}
      unread={item.unreadCount}
      tick={tickOf(dm.other)}
      lead={<Avatar name={avatarNameOf(dm.other)} hue={hueFor(dm.other.wawuId)} size={52} source={dm.other.avatarUrl ?? undefined} decorative />}
      onPress={() => router.push(paidThreadHref(dm.other.wawuId))}
    />
  );
}

