import { useRouter } from 'expo-router';

import { ConversationRow } from '@/components/ConversationRow';
import type { InboxItem } from '@/features/inbox/api';

import { lastLine, rowTime } from './format';
import { GroupTile, tileMetrics } from './GroupTile';
import { openRoom } from './routes';

/**
 * A community in the All list (I1): the group's picture, its name, who spoke last and what they said, the
 * time and what is unread, drawn by the shared conversation row. Tapping it opens the room (I25).
 */
export function CommunityInboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const community = item.community;
  if (!community) return null;
  const preview = item.preview;
  return (
    <ConversationRow
      testID={`row-${item.id}`}
      name={community.name}
      preview={
        preview
          ? lastLine({ text: preview.text, hasPhoto: preview.attachment === 'image', mine: preview.mine, senderName: preview.senderName })
          : 'No messages yet'
      }
      time={rowTime(item.lastActivityAt)}
      unread={item.unreadCount}
      lead={<GroupTile uri={community.imageUrl} size={tileMetrics.row} />}
      onPress={() => openRoom(router, community.communityId)}
    />
  );
}
