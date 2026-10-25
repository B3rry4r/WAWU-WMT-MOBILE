import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { newClientMessageId } from '@/features/chat/api';
import { fetchShareChats, sendLinkToChat, shareChatsKey, type ChatSummary } from '@/features/content-detail/api';
import { hueFor } from '@/features/feed/model';
import { space } from '@/theme';

const AVATAR = 40;
/** The sheet lists as many recent chats as fit under the title without taking the screen over. */
const LIST_MAX = 360;

export const CHATS_FAILED = "Your chats couldn't be loaded.";
export const NO_CHATS = 'Your recent chats show up here.';
export const sendFailed = (name: string) => `Couldn't send it to ${name}. Try again.`;

export type ChatSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The line and the link that go to the person chosen. */
  text: string;
};

/**
 * RF2's "Who Made This? chat" target: the invite line and the link go to a person from the recent chats, inside the app, in a message
 * of their own. A person the sender may not message (`canMessage` false) is not listed. One id per chat until a send is taken, so a tap
 * after a lost answer never posts the invite twice (the same rule as the content share sheet, H22).
 */
export function ChatSheet({ visible, onClose, text }: ChatSheetProps) {
  const chats = useQuery({ queryKey: shareChatsKey, queryFn: fetchShareChats, staleTime: 0, enabled: visible });
  const [sending, setSending] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const ids = useRef(new Map<string, string>());
  const people = (chats.data ?? []).filter((c) => c.canMessage);

  const send = async (chat: ChatSummary) => {
    if (sending) return;
    setSending(chat.id);
    setNote(null);
    const id = ids.current.get(chat.id) ?? newClientMessageId();
    ids.current.set(chat.id, id);
    try {
      await sendLinkToChat(chat.id, text, id);
      ids.current.delete(chat.id);
      setNote({ ok: true, text: `Sent to ${chat.other.name}.` });
    } catch {
      setNote({ ok: false, text: sendFailed(chat.other.name) });
    } finally {
      setSending(null);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} label="Send in chat" testID="invite-chat-sheet">
      <Text variant="sheetTitleSm">Send in chat</Text>
      {chats.isPending ? (
        <View style={styles.stack} testID="invite-chat-loading" accessibilityLabel="Loading your chats">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={AVATAR + space.lg} />
          ))}
        </View>
      ) : chats.isError ? (
        <View style={styles.stack} testID="invite-chat-error">
          <Text variant="errorLine" accessibilityRole="alert">
            {CHATS_FAILED}
          </Text>
          <Button label="Try again" variant="secondary" size="sm" onPress={() => void chats.refetch()} loading={chats.isFetching} testID="invite-chat-retry" />
        </View>
      ) : people.length === 0 ? (
        <Text variant="muted" testID="invite-chat-empty">
          {NO_CHATS}
        </Text>
      ) : (
        <ScrollView style={styles.list} testID="invite-chat-list">
          <GroupedList>
            {people.map((chat) => (
              <ListRow
                key={chat.id}
                testID={`invite-chat-person-${chat.other.wawuId}`}
                lead={<Avatar name={chat.other.name} hue={hueFor(chat.other.wawuId)} source={chat.other.avatarUrl ?? undefined} size={AVATAR} decorative />}
                title={chat.other.name}
                accessibilityLabel={`Send to ${chat.other.name}`}
                onPress={sending ? undefined : () => void send(chat)}
              />
            ))}
          </GroupedList>
        </ScrollView>
      )}
      {note ? (
        <Text variant={note.ok ? 'kvValue' : 'errorLine'} tone={note.ok ? 'positive' : undefined} accessibilityRole={note.ok ? undefined : 'alert'} testID="invite-chat-note">
          {note.text}
        </Text>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md },
  list: { maxHeight: LIST_MAX },
});
