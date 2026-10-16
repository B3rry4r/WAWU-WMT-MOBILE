import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { chatsKey, fetchChats, newMessageId, sendCardToChat, type ChatSummary } from './api/chat';
import { fetchShareCard, shareCardKey, type ShareCard, type TgifDay } from './api/tgif';
import { canShareCard, saveCardFile, shareCardFile, writeCard } from './cardFile';
import { cardFileName, pngSize, shareLine, shareText, whatsappUrl } from './model';
import { useCountShare } from './useTgif';

/** design/_gen/home.js, H35: the sheet's parts. The preview is 220 high as drawn; a longer verse makes the card taller and the picture keeps its shape. */
const sheetMetrics = {
  between: 16,
  titleGap: 6,
  title: 20,
  previewHeight: 220,
  target: 76,
  tile: 56,
  tileIcon: 22,
  tileGap: 8,
  label: 12,
  /** A fraction of the screen the list of chats may take before it scrolls. */
  listShare: 0.4,
  avatar: 44,
} as const;

export const COULD_NOT_OPEN_WHATSAPP = 'WhatsApp could not be opened. Try again.';
export const COULD_NOT_SEND = 'The card could not be sent. Try again.';
export const COULD_NOT_SHARE = 'The card could not be shared. Try again.';
export const COULD_NOT_SAVE = 'The card could not be saved. Try again.';
export const SAVE_NOT_ALLOWED = 'Saving needs permission to add to your photos. Allow it in your phone settings, then try again.';
export const SAVED = 'Saved to your photos.';
const SHARE_QUERY = ['tgif', 'phone-can-share'] as const;

export type ShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  date: string;
  day: TgifDay;
  /** Where a person with no chats is sent. */
  onOpenInbox?: () => void;
};

type Mode = { kind: 'targets' } | { kind: 'chat' } | { kind: 'sent'; name: string };

async function openUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * H35 · Share today's verse. The picture is drawn by the Hub (`GET /tgif/{date}/share-image`), the
 * same one that goes out. WhatsApp opens with the verse, where it is from and the link written
 * out; Chat sends the picture into one of the person's chats. Neither counts as a share until
 * it has gone out (`POST /tgif/{date}/share`). Story and Save need the phone's share and
 * media modules (SHARED-CHANGES.md, HOME-09 #2) and are not drawn until they are installed.
 */
export function ShareSheet({ visible, onClose, date, day, onOpenInbox }: ShareSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Share today's verse" gap={sheetMetrics.between} testID="tgif-share-sheet">
      <ShareBody onClose={onClose} date={date} day={day} onOpenInbox={onOpenInbox} />
    </BottomSheet>
  );
}

type ShareBodyProps = Omit<ShareSheetProps, 'visible'>;

/** What is inside the open sheet. It exists only while the sheet is open, so a sheet opened again starts at its targets. */
function ShareBody({ onClose, date, day, onOpenInbox }: ShareBodyProps) {
  const client = useQueryClient();
  const [mode, setMode] = useState<Mode>({ kind: 'targets' });
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const card = useQuery({ queryKey: shareCardKey(date), queryFn: () => fetchShareCard(date), staleTime: Infinity });
  const phone = useQuery({ queryKey: SHARE_QUERY, queryFn: canShareCard, staleTime: Infinity });
  const counted = useCountShare(date);
  const asPicture = phone.data === true;

  /** The card as a file the phone's sheet and photo library can take; the picture is fetched again if the preview never got it. */
  const cardUri = async () => {
    const picture = await client.fetchQuery({ queryKey: shareCardKey(date), queryFn: () => fetchShareCard(date), staleTime: Infinity });
    return writeCard(picture, date);
  };

  /** One press at a time: a second tap while the first is still working does nothing. */
  const once = async (work: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setProblem(null);
    setSaved(false);
    try {
      await work();
    } finally {
      busy.current = false;
    }
  };

  const whatsappText = async () => {
    if (await openUrl(whatsappUrl(shareText(day)))) counted.mutate();
    else setProblem(COULD_NOT_OPEN_WHATSAPP);
  };

  const whatsapp = () =>
    once(async () => {
      if (asPicture) {
        try {
          await shareCardFile(await cardUri(), 'Share on WhatsApp');
          counted.mutate();
          return;
        } catch {
          // The sheet could not open with the picture: WhatsApp gets the verse as text instead.
        }
      }
      await whatsappText();
    });

  const story = () =>
    once(async () => {
      try {
        await shareCardFile(await cardUri(), 'Share to your story');
        counted.mutate();
      } catch {
        setProblem(COULD_NOT_SHARE);
      }
    });

  const save = () =>
    once(async () => {
      try {
        const out = await saveCardFile(await cardUri());
        if (out === 'saved') setSaved(true);
        else setProblem(SAVE_NOT_ALLOWED);
      } catch {
        setProblem(COULD_NOT_SAVE);
      }
    });

  if (mode.kind === 'chat') {
    return (
      <ChatPicker
        date={date}
        day={day}
        onBack={() => setMode({ kind: 'targets' })}
        onSent={(name) => {
          counted.mutate();
          setMode({ kind: 'sent', name });
        }}
        onOpenInbox={
          onOpenInbox
            ? () => {
                onClose();
                onOpenInbox();
              }
            : undefined
        }
      />
    );
  }
  if (mode.kind === 'sent') return <Sent name={mode.name} onDone={onClose} />;
  return (
    <>
      <Heading title="Share today's verse" line={shareLine(day.shareLink, asPicture)} />
      <Preview card={card.data} loading={card.isPending} error={card.isError ? card.error : null} onRetry={() => void card.refetch()} verse={day.verse} />
      <View style={[styles.targets, asPicture ? styles.targetsSpread : null]}>
        <Target testID="tgif-share-whatsapp" icon="MessageCircle" label="WhatsApp" onPress={() => void whatsapp()} />
        {asPicture ? <Target testID="tgif-share-story" icon="Instagram" label="Story" onPress={() => void story()} /> : null}
        <Target testID="tgif-share-chat" icon="Send" label="Chat" onPress={() => setMode({ kind: 'chat' })} />
        {asPicture ? <Target testID="tgif-share-save" icon="ImageDown" label="Save" onPress={() => void save()} /> : null}
      </View>
      {saved ? (
        <Text variant="muted" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="tgif-share-saved">
          {SAVED}
        </Text>
      ) : null}
      {problem ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="tgif-share-problem">
          {problem}
        </Text>
      ) : null}
    </>
  );
}

type HeadingProps = { title: string; line: string };

function Heading({ title, line }: HeadingProps) {
  return (
    <View style={styles.heading}>
      <Text variant="sheetTitleSm" style={styles.title}>
        {title}
      </Text>
      <Text variant="muted">{line}</Text>
    </View>
  );
}

type PreviewProps = { card: ShareCard | undefined; loading: boolean; error: unknown; onRetry: () => void; verse: string };

/** The card as it will be sent: the Hub's picture at the sheet's width, in the card's own shape. */
function Preview({ card, loading, error, onRetry, verse }: PreviewProps) {
  const size = card ? pngSize(card.uri) : null;
  if (card) {
    return (
      <Image
        testID="tgif-share-preview"
        accessibilityLabel={`The card you are sharing: ${verse}`}
        source={{ uri: card.uri }}
        contentFit="cover"
        style={[styles.preview, size ? { aspectRatio: size.width / size.height } : { height: sheetMetrics.previewHeight }]}
      />
    );
  }
  if (loading) {
    return (
      <LoadingView label="Drawing the card" testID="tgif-share-preview-loading">
        <Skeleton height={sheetMetrics.previewHeight} radius={radius.card} />
      </LoadingView>
    );
  }
  return (
    <ErrorState
      testID="tgif-share-preview-error"
      title="The card could not be drawn"
      message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
      onRetry={onRetry}
    />
  );
}

type TargetProps = { icon: IconName; label: string; onPress: () => void; testID: string };

/** One way to send the card: a 56 square tile and its name under it. */
function Target({ icon, label, onPress, testID }: TargetProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.target, ring.style]}>
      <View style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
        <Icon name={icon} size={sheetMetrics.tileIcon} color={colors.textPrimary} />
      </View>
      <Text variant="body" style={[font(600), styles.targetLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ChatPickerProps = {
  date: string;
  day: TgifDay;
  onBack: () => void;
  onSent: (name: string) => void;
  onOpenInbox?: () => void;
};

/** "Chat": the person's own chats, newest first; one tap sends the card to that chat. */
function ChatPicker({ date, day, onBack, onSent, onOpenInbox }: ChatPickerProps) {
  const { colors } = useWawu();
  const client = useQueryClient();
  const { height } = useWindowDimensions();
  const chats = useQuery({ queryKey: chatsKey, queryFn: fetchChats });
  const [sending, setSending] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const ids = useRef(new Map<string, string>());

  const send = async (chat: ChatSummary) => {
    if (sending) return;
    setSending(chat.id);
    setProblem(null);
    try {
      const card = await client.fetchQuery({ queryKey: shareCardKey(date), queryFn: () => fetchShareCard(date), staleTime: Infinity });
      // The same message id for every try at this chat, so a retry after a dropped answer posts the card once.
      const id = ids.current.get(chat.id) ?? newMessageId();
      ids.current.set(chat.id, id);
      await sendCardToChat(chat.id, card, cardFileName(date), day.shareLink, id);
      ids.current.delete(chat.id);
      onSent(chat.other.name);
    } catch (error) {
      setProblem(isApiError(error) ? error.message : COULD_NOT_SEND);
    } finally {
      setSending(null);
    }
  };

  return (
    <>
      <Heading title="Send in chat" line="Pick who gets today's verse." />
      {chats.isPending ? (
        <LoadingView label="Loading your chats" testID="tgif-chats-loading">
          <View style={styles.skeletons}>
            <Skeleton height={sheetMetrics.avatar} />
            <Skeleton height={sheetMetrics.avatar} />
            <Skeleton height={sheetMetrics.avatar} />
          </View>
        </LoadingView>
      ) : chats.isError ? (
        <ErrorState
          testID="tgif-chats-error"
          title="Your chats could not be loaded"
          message={isApiError(chats.error) ? chats.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void chats.refetch()}
        />
      ) : chats.data.length === 0 ? (
        <EmptyState
          testID="tgif-chats-empty"
          icon="MessageCircle"
          title="No chats yet"
          message="Start a chat from Messages, then share the verse again."
          action={onOpenInbox ? { label: 'Open Messages', onPress: onOpenInbox } : undefined}
        />
      ) : (
        <ScrollView testID="tgif-chats" style={{ maxHeight: height * sheetMetrics.listShare }} showsVerticalScrollIndicator={false}>
          <GroupedList>
            {chats.data.map((chat) => (
              <ListRow
                key={chat.id}
                testID={`tgif-chat-${chat.id}`}
                lead={<Avatar name={chat.other.name} source={chat.other.avatarUrl ?? undefined} size={sheetMetrics.avatar} decorative />}
                title={chat.other.name}
                subtitle={chat.canMessage ? (chat.other.handle ? `@${chat.other.handle}` : undefined) : 'Messages are off in this chat'}
                trailing={sending === chat.id ? <ActivityIndicator testID="tgif-chat-sending" size="small" color={colors.textSecondary} /> : undefined}
                onPress={chat.canMessage && !sending ? () => void send(chat) : undefined}
              />
            ))}
          </GroupedList>
        </ScrollView>
      )}
      {problem ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="tgif-chat-problem">
          {problem}
        </Text>
      ) : null}
      <Button label="Back" variant="outline" size="md" full onPress={onBack} testID="tgif-chat-back" />
    </>
  );
}

type SentProps = { name: string; onDone: () => void };

function Sent({ name, onDone }: SentProps) {
  return (
    <View testID="tgif-sent" style={styles.sent}>
      <IconTile icon="CircleCheck" tone="in" size={56} />
      <Text variant="sheetTitleSm" accessibilityLiveRegion="polite" style={styles.title}>
        Sent
      </Text>
      <Text variant="muted" style={styles.sentLine}>
        {`Today's verse is in your chat with ${name}.`}
      </Text>
      <Button label="Done" size="md" variant="secondary" onPress={onDone} testID="tgif-sent-done" />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: sheetMetrics.titleGap },
  title: { fontSize: sheetMetrics.title },
  preview: { width: '100%', borderRadius: radius.card, overflow: 'hidden' },
  targets: { flexDirection: 'row', gap: space.lg },
  /** Four targets, as the canvas lays them out: the sheet's width shared out between them. */
  targetsSpread: { justifyContent: 'space-between' },
  target: { width: sheetMetrics.target, alignItems: 'center', gap: sheetMetrics.tileGap },
  tile: { width: sheetMetrics.tile, height: sheetMetrics.tile, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  targetLabel: { fontSize: sheetMetrics.label },
  skeletons: { gap: space.sm },
  sent: { alignItems: 'center', gap: space.md },
  sentLine: { textAlign: 'center' },
});
