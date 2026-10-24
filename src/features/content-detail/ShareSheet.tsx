import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';
import { newClientMessageId } from '@/features/chat/api';
import { copyText } from '@/features/open-wallet/copy';
import { hueFor } from '@/features/feed/model';

import { fetchShareChats, sendLinkToChat, shareChatsKey, type ChatSummary } from './api';
import { contentLink, linkLine, shareText, whatsappUrl } from './model';

/** design/_gen/home.js line 74: four 56 round buttons, the link card, and 52 avatars. */
const m = { circle: 56, person: 52, personSlot: 64, personGap: space.lg, actionWidth: 76, linkSpace: 10, peopleSpace: 10, nameSpace: 6 } as const;

/** The people the sheet offers on its first look: the board draws four. */
const FIRST_LOOK = 4;

export const COULD_NOT_OPEN_WHATSAPP = 'WhatsApp could not be opened. Try again.';
export const COULD_NOT_SHARE = 'The piece could not be shared. Try again.';
export const COULD_NOT_COPY = 'The link could not be copied. Try again.';
export const chatsFailedLine = "Your chats couldn't be loaded.";
export const sendFailedLine = (name: string) => `Couldn't send it to ${name}. Try again.`;

export type ShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The piece: its id (the link), its title and who made it (the words that go with the link). */
  piece: { id: string; title: string; by: string | null };
  /** One share went out (the Hub counts it). */
  onShared: () => void;
};

/**
 * H22 · Share. Copy the link, send it to WhatsApp or the phone's own share sheet, or send it inside the app to a person from the
 * recent chats. Nothing counts as a share until it has gone out. The chat button opens the whole list of recent people where the
 * board draws the first four.
 */
export function ShareSheet({ visible, onClose, piece, onShared }: ShareSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Share" testID="share-sheet">
      <ShareBody piece={piece} onShared={onShared} />
    </BottomSheet>
  );
}

type Note = { tone: 'ok' | 'problem'; text: string } | null;

/** Inside the open sheet, so a sheet opened again starts at its four people. */
function ShareBody({ piece, onShared }: Pick<ShareSheetProps, 'piece' | 'onShared'>) {
  const { colors } = useWawu();
  const [all, setAll] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const keys = useRef(new Map<string, string>());
  const chats = useQuery({ queryKey: shareChatsKey, queryFn: fetchShareChats, staleTime: 0 });

  const link = contentLink(piece.id);
  const words = shareText(piece.title, piece.by, link);
  const people = (chats.data ?? []).filter((c) => c.canMessage);
  const shown = all ? people : people.slice(0, FIRST_LOOK);

  const copy = async () => {
    setNote(null);
    if (await copyText(link)) {
      setCopied(true);
      onShared();
    } else setNote({ tone: 'problem', text: COULD_NOT_COPY });
  };
  const whatsapp = async () => {
    setNote(null);
    try {
      await Linking.openURL(whatsappUrl(words));
      onShared();
    } catch {
      setNote({ tone: 'problem', text: COULD_NOT_OPEN_WHATSAPP });
    }
  };
  const more = async () => {
    setNote(null);
    try {
      const result = await Share.share({ message: words });
      if (result.action === Share.sharedAction) onShared();
    } catch {
      setNote({ tone: 'problem', text: COULD_NOT_SHARE });
    }
  };
  const send = async (chat: ChatSummary) => {
    if (sending) return;
    setSending(chat.id);
    setNote(null);
    // One id per chat until the send is taken, so a tap after a lost answer never posts the link twice.
    const id = keys.current.get(chat.id) ?? newClientMessageId();
    keys.current.set(chat.id, id);
    try {
      await sendLinkToChat(chat.id, words, id);
      keys.current.delete(chat.id);
      setNote({ tone: 'ok', text: `Sent to ${chat.other.name}.` });
      onShared();
    } catch {
      setNote({ tone: 'problem', text: sendFailedLine(chat.other.name) });
    } finally {
      setSending(null);
    }
  };

  return (
    <>
      <Text variant="sheetTitleSm">Share</Text>
      <View style={styles.actions}>
        <ShareAction testID="share-chat" icon="MessageCircle" label="Who Made This? chat" selected={all} onPress={() => setAll((v) => !v)} />
        <ShareAction testID="share-copy" icon="Link" label="Copy link" onPress={() => void copy()} />
        <ShareAction testID="share-whatsapp" icon="Send" label="WhatsApp" onPress={() => void whatsapp()} />
        <ShareAction testID="share-more" icon="Ellipsis" label="More" onPress={() => void more()} />
      </View>
      <Card padded testID="share-link-card" style={styles.linkCard}>
        <View style={styles.linkRow}>
          <Text variant="secondary" numberOfLines={1} style={styles.link} testID="share-link">
            {linkLine(piece.id)}
          </Text>
          <Button testID="share-copy-button" label={copied ? 'Copied' : 'Copy'} icon={copied ? 'Check' : 'Copy'} variant="secondary" size="sm" onPress={() => void copy()} selected={copied} />
        </View>
      </Card>
      {note ? (
        <Text variant={note.tone === 'ok' ? 'kvValue' : 'errorLine'} tone={note.tone === 'ok' ? 'positive' : undefined} accessibilityRole={note.tone === 'ok' ? undefined : 'alert'} testID="share-note">
          {note.text}
        </Text>
      ) : null}
      <View style={styles.people}>
        <Text variant="label">Send to</Text>
        {chats.isPending ? (
          <View style={styles.row} testID="share-people-loading" accessibilityLabel="Loading your chats">
            {Array.from({ length: FIRST_LOOK }, (_, i) => (
              <Skeleton key={i} width={m.person} height={m.person} radius={m.person / 2} />
            ))}
          </View>
        ) : chats.isError ? (
          <View style={styles.row} testID="share-people-error">
            <Text variant="errorLine" accessibilityRole="alert" style={styles.grow}>
              {chatsFailedLine}
            </Text>
            <Button label="Try again" variant="secondary" size="sm" onPress={() => void chats.refetch()} loading={chats.isFetching} testID="share-people-retry" />
          </View>
        ) : people.length === 0 ? (
          <Text variant="muted" testID="share-people-empty" style={{ color: colors.textMuted }}>
            Your recent chats show up here.
          </Text>
        ) : (
          <View style={styles.wrap} testID="share-people">
            {shown.map((chat) => (
              <Person key={chat.id} chat={chat} busy={sending === chat.id} onPress={() => void send(chat)} />
            ))}
          </View>
        )}
      </View>
    </>
  );
}

function ShareAction({ icon, label, onPress, testID, selected }: { icon: 'MessageCircle' | 'Link' | 'Send' | 'Ellipsis'; label: string; onPress: () => void; testID: string; selected?: boolean }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { expanded: selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.action, ring.style]}
    >
      <IconTile icon={icon} tone="neutral" size={m.circle} />
      <Text variant="caption" tone="textSecondary" style={[styles.actionLabel, font(600)]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Person({ chat, busy, onPress }: { chat: ChatSummary; busy: boolean; onPress: () => void }) {
  const ring = useFocusRing();
  const first = chat.other.name.trim().split(/\s+/)[0];
  return (
    <Pressable
      testID={`share-person-${chat.other.wawuId}`}
      accessibilityRole="button"
      accessibilityLabel={`Send to ${chat.other.name}`}
      accessibilityState={{ busy }}
      disabled={busy}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.person, busy && styles.busy, ring.style]}
    >
      <Avatar name={chat.other.name} hue={hueFor(chat.other.wawuId)} source={chat.other.avatarUrl ?? undefined} size={m.person} decorative />
      <Text variant="caption" tone="textSecondary" numberOfLines={1} style={[styles.personName, font(600)]}>
        {first}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { width: m.actionWidth, alignItems: 'center', gap: space.sm },
  actionLabel: { textAlign: 'center' },
  linkCard: { paddingVertical: space.md, paddingHorizontal: space.md + 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: m.linkSpace },
  link: { flex: 1 },
  people: { gap: m.peopleSpace },
  row: { flexDirection: 'row', alignItems: 'center', gap: m.personGap },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: m.personGap },
  grow: { flex: 1 },
  person: { width: m.personSlot - space.sm, alignItems: 'center', gap: m.nameSpace },
  personName: { textAlign: 'center' },
  busy: { opacity: 0.5 },
});
