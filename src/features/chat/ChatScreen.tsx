import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { VerifiedTick } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { dropIntentOfTransfer } from '@/features/send/intent';
import { firstName } from '@/features/send/model';
import { transferQuery } from '@/features/send/api';
import { font, layout, space, useWawu } from '@/theme';

import { chatKey, tickOf, type ChatMessage, type ChatPerson } from './api';
import { AttachmentBubble } from './AttachmentBubbles';
import { attachmentRulesKey, fetchAttachmentLink, fetchAttachmentRules, fileLine, kindOfType, type ChatFile } from './attachments';
import { AttachSheet } from './AttachSheet';
import { DayLabel, RequestBubble, SentBubble, TextBubble } from './Bubbles';
import { ChatClosedBar, ChatComposer } from './ChatComposer';
import { chatSendsQuery } from './ChatSendScreen';
import { RequestPaySheet } from './RequestPaySheet';
import { RequestSheet } from './RequestSheet';
import { pickChatFile, pickPhotoOrVideo } from './pickAttachment';
import { PhotoViewer } from './PhotoViewer';
import { messageWords, threadItems, type ThreadItem } from './thread';
import { queryClient } from '@/api/query';
import { useReporting } from '@/features/report/useReporting';
import { PersonMenu } from '@/features/report/PersonMenu';
import { inboxKey } from '@/features/inbox/api';
import { blockPerson } from '@/features/visitor/api';
import { useChatThread } from './useChatThread';
import { useRequestPay } from './useRequestPay';

/** design/_gen/inbox.js lines 17 and 48: a 64 bar, 12 on the left and 16 on the right, 10 between its parts, a hairline under it; 14 above the messages, 16 at the sides, 10 apart. */
const headMetrics = { height: 64, padLeft: 12, padRight: 16, between: 10, back: 40, avatar: 40, name: 16, sub: 12.5, subGap: 1, tick: 14, tickGap: 4 } as const;
/** The line under a name (I12): where the person is. The app names itself "Who Made This?" with the question mark (R-69). */
const ON_APP = 'on Who Made This?';
const threadMetrics = { padTop: 14, padH: 16, between: 10, loadingRows: 5 } as const;
/** How often a send the provider has not confirmed is read again (`GET /money/transfers/{id}`, our own record). Default (agent), owner may override. */
const SEND_POLL_MS = 4000;
/** How long what a chat takes (`GET /chats/attachment-rules`) is kept before it is asked again: five minutes. Default (agent), owner may override. */
const RULES_STALE_MS = 5 * 60 * 1000;

export type ChatScreenProps = {
  chatId: string;
  onBack: () => void;
  /** Send money (I13): the amount screen, I14, for this person. */
  onSendMoney: (person: ChatPerson) => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). Opens Add money (W15) with the shortfall. A caller that leaves it out shows the short notice without the button. */
  onAddMoney?: (shortfallKobo: number) => void;
};

/**
 * I12 to I19: a chat between two people. The header names the other person; the thread is read from `GET /chats/:id/messages`, newest at
 * the bottom, live; the composer sends text; + opens "Add to chat" (I13) for Send money (I14, then I15's bubble here) and Request money (I16,
 * then I17's bubble, and for the person asked, I18's Decline and Pay with its review and PIN, then I19's Paid).
 */
export function ChatScreen(props: ChatScreenProps) {
  const { chatId } = props;
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const owner = useSessionAccount(undefined);
  const thread = useChatThread(chatId, focused);
  // REPORT-UGC: press and hold the other person's message to report it; the Hub leaves it out of this person's chat.
  // The thanks is drawn above the composer (REPORT-UGC r1), so the composer's height is read.
  const [composerHeight, setComposerHeight] = useState(0);
  const reporting = useReporting((kind) => {
    void queryClient.invalidateQueries({ queryKey: chatKey(chatId) });
    // A reported person is out of the reporter's lists: the chat with them closes, as the profile page does.
    if (kind === 'profile') {
      void queryClient.invalidateQueries({ queryKey: inboxKey });
      props.onBack();
    }
  }, composerHeight);
  const [menuOpen, setMenuOpen] = useState(false);
  const { chat, messages } = thread;
  const sends = useQuery(chatSendsQuery(owner, chatId));
  const [attachOpen, setAttachOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  // What a chat takes (the File row's line, the picker's types) is the Hub's: read when the person opens the sheet's chat, never written here.
  const rules = useQuery({ queryKey: attachmentRulesKey, queryFn: fetchAttachmentRules, staleTime: RULES_STALE_MS, retry: false });
  const [attachNotice, setAttachNotice] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const pay = useRequestPay({
    chatId,
    patchRequest: thread.patchRequest,
    onOpenWallet: props.onOpenWallet,
    onSetPin: props.onSetPin,
    onForgotPin: props.onForgotPin,
    onAddMoney: props.onAddMoney,
  });

  // Coming back from I14 reads this chat's sends again, so I15's bubble is there.
  const wasFocused = useRef(focused);
  const { refetch: refetchSends } = sends;
  useEffect(() => {
    if (focused && !wasFocused.current) void refetchSends();
    wasFocused.current = focused;
  }, [focused, refetchSends]);

  /** Photo or video, File: the phone's picker, then the chat sends what was chosen. A file the phone cannot read says so; the Hub's refusals show on the file's own bubble. */
  const choose = async (pick: () => Promise<ChatFile | null>) => {
    setAttachNotice(null);
    try {
      const file = await pick();
      if (file) thread.sendFile(file);
    } catch {
      setAttachNotice('That file could not be read. Choose another.');
    }
  };
  const chooseMedia = () => void choose(pickPhotoOrVideo);
  const chooseFile = () => void choose(() => pickChatFile(rules.data?.file.contentTypes ?? ['*/*']));

  /** Opens one file: a fresh link (only the two people in the chat get one), a photo over the thread, anything else in the phone's own viewer. */
  const open = useCallback(
    async (message: ChatMessage) => {
      setOpening(message.id);
      setAttachNotice(null);
      try {
        const link = await fetchAttachmentLink(chatId, message.id);
        if (message.kind === 'image') setViewing(link.url);
        else await Linking.openURL(link.url);
      } catch (error) {
        setAttachNotice(isApiError(error) ? error.message : 'We could not open that file. Try again.');
      } finally {
        setOpening(null);
      }
    },
    [chatId],
  );

  const person = chat.data?.other ?? null;
  // The support side of a support thread (SUPPORT-01): the app's own mark, no "on Who Made This?" line, and no money in the chat.
  const support = person?.support === true;
  const name = person ? firstName(person.name) : '';
  const hidden = isApiError(chat.error) && (chat.error.status === 404 || chat.error.status === 403);
  const items = useMemo(() => threadItems(thread.items, thread.outgoing, sends.data ?? []), [thread.items, thread.outgoing, sends.data]);
  const retryAll = () => {
    void chat.refetch();
    void messages.refetch();
  };

  const renderItem = useCallback(
    ({ item }: { item: ThreadItem }) => {
      if (item.kind === 'day') return <DayLabel label={item.label} />;
      if (item.kind === 'out' && item.entry.file) {
        const entry = item.entry;
        const file = entry.file as ChatFile;
        const kind = kindOfType(file.contentType);
        return (
          <AttachmentBubble
            id={entry.localId}
            kind={kind}
            mine
            contentType={file.contentType}
            uri={kind === 'image' ? file.previewUri : undefined}
            name={file.name}
            bytes={file.blob.size}
            pending={{ status: entry.status, error: entry.error, onRetry: () => thread.retry(entry.localId), onDiscard: () => thread.discard(entry.localId) }}
          />
        );
      }
      if (item.kind === 'out') {
        return (
          <TextBubble
            id={item.entry.localId}
            text={item.entry.text}
            mine
            pending={{ status: item.entry.status, error: item.entry.error, onRetry: () => thread.retry(item.entry.localId), onDiscard: () => thread.discard(item.entry.localId) }}
          />
        );
      }
      if (item.kind === 'sent') return <SentItem owner={owner} chatId={chatId} transferId={item.send.transferId} toName={name} fallbackAt={item.send.at} />;
      const message = item.message;
      if (message.kind === 'money_request' && message.moneyRequest) {
        const request = message.moneyRequest;
        return (
          <RequestBubble
            request={request}
            otherName={name}
            at={message.createdAt}
            busy={pay.starting || pay.declining === request.id}
            onPay={() => void pay.start(request)}
            onDecline={() => void pay.decline(request)}
          />
        );
      }
      if (message.attachment && (message.kind === 'image' || message.kind === 'video' || message.kind === 'file')) {
        return (
          <AttachmentBubble
            id={message.id}
            kind={message.kind}
            mine={message.mine}
            contentType={message.attachment.contentType}
            uri={message.kind === 'image' ? message.attachment.url : undefined}
            name={message.attachment.name}
            bytes={message.attachment.bytes}
            caption={message.text}
            at={message.createdAt}
            opening={opening === message.id}
            onOpen={() => void open(message)}
            onLongPress={message.mine ? undefined : () => reporting.ask('chat_message', message.id)}
          />
        );
      }
      return <TextBubble id={message.id} text={messageWords(message)} mine={message.mine} at={message.createdAt} onLongPress={message.mine ? undefined : () => reporting.ask('chat_message', message.id)} />;
    },
    [thread, pay, name, owner, chatId, open, opening, reporting],
  );

  let body;
  if (hidden) {
    body = (
      <View style={styles.center}>
        <EmptyState testID="chat-unavailable" icon="Ban" title="This chat isn’t available" message="It may have been removed, or you may not be able to see it." />
      </View>
    );
  } else if (chat.isPending || messages.isPending) {
    body = <ThreadSkeleton />;
  } else if ((chat.isError && !chat.data) || (messages.isError && !messages.data)) {
    const error = chat.error ?? messages.error;
    body = (
      <View style={styles.center}>
        <ErrorState
          testID="chat-error"
          title="Couldn’t open this chat"
          message={isApiError(error) ? error.message : 'Something went wrong. Try again.'}
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          onRetry={retryAll}
        />
      </View>
    );
  } else if (items.length === 0) {
    body = (
      <View style={styles.center}>
        <EmptyState
          testID="chat-empty"
          icon="MessageCircle"
          title="No messages yet"
          message={support ? 'Tell us what you need help with.' : `Say hello${name ? ` to ${name}` : ''}.`}
        />
      </View>
    );
  } else {
    body = (
      <FlatList
        testID="chat-messages"
        inverted
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ItemSeparatorComponent={Gap}
        onEndReached={() => {
          if (messages.hasNextPage && !messages.isFetchingNextPage && !messages.isFetchNextPageError) void messages.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListFooterComponent={
          messages.isFetchNextPageError ? (
            <View style={styles.older}>
              <Text variant="secondary">Couldn’t load older messages.</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => void messages.fetchNextPage()} />
            </View>
          ) : messages.isFetchingNextPage ? (
            <View style={styles.older} testID="chat-loading-older">
              <Skeleton width={headMetrics.avatar * 4} height={headMetrics.avatar} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.messages}
        style={styles.list}
      />
    );
  }

  const ready = !hidden && !chat.isPending && !messages.isPending && !(chat.isError && !chat.data) && !(messages.isError && !messages.data);
  const closed = ready && chat.data?.canMessage === false;

  return (
    <KeyboardAvoidingView testID="chat-screen" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderBottomColor: colors.borderHairline }]} testID="chat-header">
        <IconButton icon="ChevronLeft" label="Back" onPress={props.onBack} size={headMetrics.back} testID="chat-back" />
        {person ? (
          <>
            <Avatar name={person.name} hue={hueFor(person.wawuId)} size={headMetrics.avatar} source={person.avatarUrl ?? undefined} brand={support} decorative />
            <View style={styles.words}>
              <View style={styles.nameLine}>
                <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[font(700), { fontSize: headMetrics.name }, styles.name]} testID="chat-name">
                  {person.name}
                </Text>
                {tickOf(person) ? <VerifiedTick kind={tickOf(person)} size={headMetrics.tick} /> : null}
              </View>
              {support ? null : (
                <Text variant="caption" tone="textMuted" numberOfLines={1} style={[{ fontSize: headMetrics.sub }, styles.sub]} testID="chat-sub">
                  {person.handle ? `@${person.handle.replace(/^@/, '')} · ${ON_APP}` : ON_APP}
                </Text>
              )}
            </View>
            {support ? null : <IconButton icon="Ellipsis" label="More" onPress={() => setMenuOpen(true)} size={headMetrics.back} testID="chat-menu" />}
          </>
        ) : null}
      </View>
      <View style={styles.body}>{body}</View>
      {attachNotice ?? pay.notice ? (
        <Pressable
          accessibilityRole="alert"
          onPress={() => {
            setAttachNotice(null);
            pay.clearNotice();
          }}
          style={[styles.notice, { backgroundColor: colors.surfaceChrome }]}
          testID="chat-notice"
        >
          <Text variant="errorLine" tone="danger">
            {attachNotice ?? pay.notice}
          </Text>
        </Pressable>
      ) : null}
      {/* Always drawn with its `onLayout`: a View that gets the handler only later is never observed on the web export. */}
      <View onLayout={(event) => setComposerHeight(Math.round(event.nativeEvent.layout.height))} testID="chat-bottom">
        {ready ? (
          closed ? (
            <ChatClosedBar />
          ) : (
            <ChatComposer onSend={thread.send} busy={thread.busy} onPlus={support ? undefined : () => setAttachOpen(true)} />
          )
        ) : (
          <View style={{ height: Math.max(insets.bottom, space.lg) }} />
        )}
      </View>
      {person && !support ? (
        <>
          <AttachSheet
            visible={attachOpen}
            onClose={() => setAttachOpen(false)}
            name={name}
            onSendMoney={() => props.onSendMoney(person)}
            onRequestMoney={() => setRequestOpen(true)}
            onPickMedia={chooseMedia}
            onPickFile={chooseFile}
            fileLine={fileLine(rules.data)}
          />
          <RequestSheet
            chatId={chatId}
            name={name}
            visible={requestOpen}
            onClose={() => setRequestOpen(false)}
            onSent={thread.add}
            onOpenWallet={props.onOpenWallet}
          />
        </>
      ) : null}
      {pay.sheet ? <RequestPaySheet sheet={pay.sheet} name={name} notice={pay.notice} /> : null}
      {person && !support ? (
        <PersonMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          name={name || person.name}
          report={{ title: 'Report this profile', onPress: () => reporting.ask('profile', person.wawuId) }}
          onBlock={async () => {
            await blockPerson(person.wawuId);
            void queryClient.invalidateQueries({ queryKey: inboxKey });
            void queryClient.invalidateQueries({ queryKey: ['feed'] });
            props.onBack();
          }}
          testID="chat-person-menu"
        />
      ) : null}
      {reporting.element}
      <PhotoViewer uri={viewing} onClose={() => setViewing(null)} />
    </KeyboardAvoidingView>
  );
}

/** One send this phone made from the chat (I15): the Hub's record of it, read by its id and again while the provider has not decided. */
function SentItem({ owner, chatId, transferId, toName, fallbackAt }: { owner: string | null; chatId: string; transferId: string; toName: string; fallbackAt: number }) {
  const transfer = useQuery({
    ...transferQuery(owner, transferId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? SEND_POLL_MS : false),
  });
  const data = transfer.data;
  const status = data?.status;
  // The Hub has decided it: the intent the phone kept for it is let go.
  useEffect(() => {
    if (owner && status && status !== 'pending') void dropIntentOfTransfer(owner, transferId);
  }, [owner, transferId, status]);
  if (!data) {
    return transfer.isError ? (
      <Pressable testID={`sent-${transferId}-retry`} accessibilityRole="button" onPress={() => void transfer.refetch()} style={styles.sentRetry}>
        <Text variant="caption" tone="textMuted">
          Couldn’t read a send you made here. Tap to try again.
        </Text>
      </Pressable>
    ) : (
      <Skeleton width={230} height={140} radius={22} testID={`sent-${transferId}-loading`} />
    );
  }
  const state = data.status === 'completed' ? 'delivered' : data.status === 'pending' ? 'sending' : 'not_delivered';
  void chatId;
  return <SentBubble id={transferId} amountKobo={data.amountKobo} note={data.note} state={state} toName={toName || 'them'} at={data.completedAt ?? data.createdAt ?? new Date(fallbackAt).toISOString()} />;
}

function Gap() {
  return <View style={styles.gap} />;
}

function ThreadSkeleton() {
  return (
    <LoadingView testID="chat-loading" label="Loading the messages">
      <View style={styles.skeletonPad}>
        {Array.from({ length: threadMetrics.loadingRows }, (_, i) => (
          <View key={i} style={[i % 2 === 0 ? styles.skeletonLeft : styles.skeletonRight, i > 0 && styles.skeletonGap]}>
            <Skeleton width={i % 2 === 0 ? '60%' : '45%'} height={headMetrics.avatar} radius={20} />
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    minHeight: headMetrics.height,
    paddingLeft: headMetrics.padLeft,
    paddingRight: headMetrics.padRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: headMetrics.between,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: headMetrics.tickGap },
  name: { flexShrink: 1 },
  sub: { marginTop: headMetrics.subGap },
  body: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  list: { flex: 1 },
  /** The list is inverted, so `flex-end` seats a short thread at the top, under the header, as the design draws it; a long one fills the screen and scrolls. */
  messages: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: threadMetrics.padTop, paddingBottom: threadMetrics.padTop, paddingHorizontal: threadMetrics.padH },
  gap: { height: threadMetrics.between },
  older: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  notice: { paddingHorizontal: layout.gutter, paddingVertical: space.sm },
  sentRetry: { alignSelf: 'flex-end', paddingVertical: space.sm },
  skeletonPad: { paddingTop: threadMetrics.padTop, paddingHorizontal: threadMetrics.padH },
  skeletonLeft: { alignItems: 'flex-start' },
  skeletonRight: { alignItems: 'flex-end' },
  skeletonGap: { marginTop: threadMetrics.between },
});
