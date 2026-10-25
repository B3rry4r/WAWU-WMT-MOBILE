import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { ErrorState } from '@/components/StateViews';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { attachmentRulesKey, fetchAttachmentRules, fileLine, kindOfType, type ChatFile } from '@/features/chat/attachments';
import { AttachmentBubble } from '@/features/chat/AttachmentBubbles';
import { AttachSheet } from '@/features/chat/AttachSheet';
import { pickChatFile, pickPhotoOrVideo } from '@/features/chat/pickAttachment';
import { PhotoViewer } from '@/features/chat/PhotoViewer';
import { onLiveEvent, onLiveSynced, retainLive } from '@/features/inbox/live';
import { useWawu } from '@/theme';

import { askAgain, fetchThread, legalKeys, resolveThread, sendMessage, sendToConsultant, type LegalQuickReply, type LegalSend, type LegalThread } from './api';
import { FixedPriceCard, MatterCard, matterCardOf } from './cards';
import { readDraft, writeDraft } from './draft';
import { legalMetrics as m } from './look';
import {
  briefToConfirm,
  canAttach,
  chatRows,
  canTryAgain,
  failureKind,
  failureText,
  hasSpoken,
  isAtCapacity,
  headerOf,
  isLegalLiveEvent,
  BUSY_NOTE,
  LEGAL_NAME,
  needsAnotherAsk,
  placeholderOf,
  SLOW_NOTE,
  tapsOf,
  typedBody,
  type ChatRow,
} from './model';
import { useLegalFiles } from './useLegalFiles';
import { Bubble, BriefCard, ChatBar, ChatLine, Composer, Note, QuickReplies, Typing } from './parts';

/** How long what a chat takes (`GET /chats/attachment-rules`) is kept before it is asked again: five minutes, as the one-to-one chat does. */
const RULES_STALE_MS = 5 * 60 * 1000;

/** What the person is waiting on. One thing at a time: a second tap while one is under way is ignored. */
type Working = { kind: 'message'; shown: string } | { kind: 'ask' } | { kind: 'send' };

/** A call that failed. `retry` is null when trying again would only fail the same way (the words are too long, the day's limit is reached). */
type Problem = { text: string; retry: (() => void) | null };

/**
 * S14 to S17: the Who Made This? Legal assistant. One conversation (`GET /legal/assistant/{id}`) drawn as it stands: the
 * assistant's opening lines and its taps (S14), its questions and the person's answers (S15), the brief to check
 * and "Send to a consultant" (S16), then the consultant's conversation once the brief is sent, where a consultant
 * joins and the assistant stops (S17), with the card that books a consultation (S18, LEGAL-04). A fixed-price matter shows S24's card (LEGAL-06).
 *
 * The conversation is read when the screen opens, when it is shown again, when the app comes back to the
 * foreground and when the live connection says it changed (`legal.thread`, BACKEND_GAPS G-502) or comes back; a
 * consultant's message arrives that way with no polling.
 */
export function LegalChatScreen() {
  const router = useRouter();
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const signedIn = useSession().status === 'signedIn';

  const query = useQuery(
    {
      queryKey: legalKeys.thread,
      queryFn: () => {
        const known = queryClient.getQueryData<LegalThread>(legalKeys.thread);
        return known ? fetchThread(known.id) : resolveThread();
      },
      enabled: signedIn,
      staleTime: 0,
      refetchOnMount: 'always',
    },
    queryClient,
  );
  const { refetch } = query;
  const thread = query.data;

  // Shown again, back in the foreground, or told by the live connection: read the conversation again.
  const refresh = useCallback(() => {
    if (queryClient.getQueryData(legalKeys.thread)) void refetch();
  }, [refetch]);
  // Shown again after being away (not the first time it is shown: opening already read it).
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current) refresh();
    wasFocused.current = focused;
  }, [focused, refresh]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && focused) refresh();
    });
    return () => sub.remove();
  }, [focused, refresh]);
  useEffect(() => {
    if (!signedIn || !focused) return undefined;
    const release = retainLive();
    const offEvent = onLiveEvent((event) => {
      if (isLegalLiveEvent(event)) refresh();
    });
    const offSynced = onLiveSynced(refresh);
    return () => {
      offEvent();
      offSynced();
      release();
    };
  }, [signedIn, focused, refresh]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const bottom = Math.max(insets.bottom, m.composerBottom);

  let body;
  if (thread) {
    body = (
      <Chat
        key={thread.id}
        thread={thread}
        refreshFailed={query.isError}
        onRefresh={refresh}
        onLeave={leave}
        bottom={bottom}
        onBook={(requestId) => router.push({ pathname: '/legal-book', params: { requestId } })}
        onOpenMatter={(id) => router.push({ pathname: '/legal-matter', params: { id } })}
        onStartFixed={(id) => router.push({ pathname: '/legal-fixed', params: { id } })}
      />
    );
  } else {
    body = (
      <>
        <ChatBar header={{ title: LEGAL_NAME, sub: '', human: false }} onBack={leave} />
        <View style={styles.fill}>
          {query.isError ? <Failed error={query.error} onRetry={() => void refetch()} /> : <LoadingBubbles />}
        </View>
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      testID="legal-chat"
      behavior="padding"
      style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

function Failed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const offline = failureKind(error) === 'offline';
  return (
    <ErrorState
      testID="legal-error"
      icon={offline ? 'WifiOff' : 'CircleAlert'}
      title={offline ? "You're offline" : "The assistant didn't open"}
      message={offline ? 'Check your connection, then try again.' : failureText(error)}
      onRetry={onRetry}
    />
  );
}

/** The assistant's first lines are on their way: quiet bubbles where they will be. */
function LoadingBubbles() {
  return (
    <LoadingView label="Opening the assistant" testID="legal-loading">
      <View style={styles.loading}>
        <Skeleton width="62%" height={m.bubblePadY * 2 + m.bubbleText * m.bubbleLeading * 3} radius={m.bubbleCorner} />
        <Skeleton width="62%" height={m.bubblePadY * 2 + m.bubbleText * m.bubbleLeading * 2} radius={m.bubbleCorner} />
      </View>
    </LoadingView>
  );
}

type ChatProps = {
  thread: LegalThread;
  refreshFailed: boolean;
  onRefresh: () => void;
  onLeave: () => void;
  bottom: number;
  /** S17's Book: the consultant's card opens the booking (S18) of the matter this conversation became. */
  onBook: (requestId: string) => void;
  /** Once booked the same card opens the matter (S20 to S23). */
  onOpenMatter: (requestId: string) => void;
  /** S24's Start this request opens the fixed-price request (S26) of this conversation. */
  onStartFixed: (threadId: string) => void;
};

function Chat({ thread, refreshFailed, onRefresh, onLeave, bottom, onBook, onOpenMatter, onStartFixed }: ChatProps) {
  const scroll = useRef<ScrollView>(null);
  // S24: the Hub says on the conversation when its matter has a fixed price WAWU set (R-14); then Start this request replaces Send to a consultant.
  // The card is drawn once profiling is done (R2-LEGAL3): while the assistant has taps waiting for an answer, or its last answer is awaited, the
  // questions come first, as the board orders it (the assistant's line, then the card).
  const fixedService = thread.stage !== 'sent' && hasSpoken(thread) ? thread.fixedPrice : null;
  const fixed = fixedService && tapsOf(thread).length === 0 && !thread.awaitingReply ? fixedService : null;
  // The card back to the matter: once a consultant has joined, and for a matter that needs none (a fixed-price request) from the moment it exists.
  const cardKind = thread.legalRequestId ? matterCardOf(thread.requestStatus, thread.requestPath) : null;
  const matterCard = cardKind && (thread.consultant || cardKind === 'open') ? cardKind : null;
  // Only the Hub's busy words are drawn while the assistant is out of calls; any answer clears them.
  const [busyNote, setBusyNote] = useState(false);
  const [draft, setDraft] = useState(() => readDraft(thread.id));
  const [working, setWorking] = useState<Working | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  // Files (R2-LEGAL3): the + opens "Add to chat" once the matter exists; what a chat takes is the Hub's (the same rules as the one-to-one chat).
  const attachable = canAttach(thread);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachNotice, setAttachNotice] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const rules = useQuery({ queryKey: attachmentRulesKey, queryFn: fetchAttachmentRules, staleTime: RULES_STALE_MS, retry: false, enabled: attachable }, queryClient);
  // Two taps in one frame both see the state as it was: the guard is a ref, set before anything is awaited.
  const busy = useRef(false);
  const id = thread.id;

  const change = (text: string) => {
    setDraft(text);
    writeDraft(id, text);
  };
  const keep = (next: LegalThread) => queryClient.setQueryData(legalKeys.thread, next);
  const files = useLegalFiles(thread.id, keep);

  /** Photo or video, File: the phone's picker, then the chat sends what was chosen. A file the phone cannot read says so; the Hub's refusals show on the file's own bubble. */
  const choose = async (pick: () => Promise<ChatFile | null>) => {
    setAttachNotice(null);
    try {
      const file = await pick();
      if (file) files.add(file);
    } catch {
      setAttachNotice('That file could not be read. Choose another.');
    }
  };

  /** Opens one file the conversation holds: a fresh link is asked for (the one served with the conversation lives 15 minutes), a photo opens over the chat, a PDF in the phone's own viewer. */
  const openFile = async (row: Extract<ChatRow, { kind: 'file' }>) => {
    setOpening(row.id);
    setAttachNotice(null);
    try {
      const fresh = await fetchThread(thread.id);
      keep(fresh);
      const link = fresh.messages.find((message) => message.id === row.id)?.attachment?.url ?? null;
      if (!link) throw new Error('no link');
      if (kindOfType(row.contentType) === 'image') setViewing(link);
      else await Linking.openURL(link);
    } catch (error) {
      setAttachNotice(isApiError(error) && error.message ? error.message : 'We could not open that file. Try again.');
    } finally {
      setOpening(null);
    }
  };

  /**
   * One call at a time. Typed words leave the box when they are sent and come back if the send fails, in front of
   * anything typed meanwhile, so a failure never costs the person their words. A refusal that kept the message
   * (the assistant could not answer) reads the conversation again so the message shows.
   */
  const run = async (what: Working, call: () => Promise<LegalThread>, retry: () => void, typed?: string) => {
    if (busy.current) return;
    busy.current = true;
    setWorking(what);
    setProblem(null);
    if (typed !== undefined) change('');
    try {
      keep(await call());
      setBusyNote(false);
    } catch (error) {
      const kind = failureKind(error);
      const capacity = isAtCapacity(error);
      if (capacity) setBusyNote(true);
      const code = isApiError(error) ? error.code : undefined;
      let saved = false;
      if (what.kind === 'message' && (kind === 'unavailable' || code === 'assistant_busy' || code === 'quick_reply_unknown')) {
        try {
          keep(await fetchThread(id));
          saved = kind === 'unavailable';
        } catch {
          // The conversation could not be read again; the words go back into the box below.
        }
      }
      // Asking again while the assistant is still busy changes nothing on screen: the same plain words, the same Ask again.
      if (!saved && !(capacity && what.kind === 'ask')) {
        if (typed !== undefined) {
          const now = readDraft(id);
          change(now === '' ? typed : `${typed}\n${now}`);
        }
        setProblem({ text: failureText(error), retry: canTryAgain(error) ? retry : null });
      }
    } finally {
      busy.current = false;
      setWorking(null);
    }
  };

  const submit = (message: LegalSend, shown: string, typed?: string) => {
    void run({ kind: 'message', shown }, () => sendMessage(id, message), typed === undefined ? () => submit(message, shown) : sendTyped, typed);
  };
  function sendTyped() {
    const text = typedBody(readDraft(id));
    if (text) submit({ body: text }, text, readDraft(id));
  }
  const tap = (reply: LegalQuickReply) => submit({ quickReplyId: reply.id }, reply.label);
  const ask = () => void run({ kind: 'ask' }, () => askAgain(id), ask);
  const send = () => void run({ kind: 'send' }, () => sendToConsultant(id), send);

  const rows = chatRows(thread);
  const brief = briefToConfirm(thread);
  const taps = tapsOf(thread);
  const slow = needsAnotherAsk(thread);
  const header = headerOf(thread);
  const sending = working?.kind === 'message';
  const canSend = typedBody(draft) !== null && working === null;

  return (
    <>
      <ChatBar header={header} onBack={onLeave} />
      <ScrollView
        ref={scroll}
        testID="legal-list"
        style={styles.fill}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      >
        {rows.map((row) => (
          <ChatLine key={row.id} row={row} onOpenFile={(file) => void openFile(file)} openingId={opening} />
        ))}
        {files.outgoing.map((entry) => {
          const kind = kindOfType(entry.file.contentType);
          return (
            <AttachmentBubble
              key={entry.localId}
              id={entry.localId}
              kind={kind}
              mine
              contentType={entry.file.contentType}
              uri={kind === 'image' ? entry.file.previewUri : undefined}
              name={entry.file.name}
              bytes={entry.file.blob.size}
              pending={{ status: entry.status, error: entry.error, onRetry: () => files.retry(entry.localId), onDiscard: () => files.discard(entry.localId) }}
            />
          );
        })}
        {working?.kind === 'message' ? <Bubble mine body={working.shown} testID="legal-bubble-sending" dim /> : null}
        {working?.kind === 'message' || working?.kind === 'ask' ? <Typing /> : null}
        {matterCard && thread.legalRequestId ? (
          <MatterCard
            kind={matterCard}
            matterLabel={thread.matterLabel}
            onPress={() => (matterCard === 'book' ? onBook(thread.legalRequestId as string) : onOpenMatter(thread.legalRequestId as string))}
          />
        ) : null}
        {fixed && !sending ? <FixedPriceCard service={fixed} onStart={() => onStartFixed(thread.id)} /> : null}
        {taps.length > 0 && !sending ? <QuickReplies taps={taps} onTap={tap} disabled={working !== null} /> : null}
        {brief && !fixedService && working?.kind !== 'message' ? <BriefCard brief={brief} onSend={send} sending={working?.kind === 'send'} /> : null}
        {slow && working === null && !problem ? (
          <Note testID="legal-slow" text={busyNote ? BUSY_NOTE : SLOW_NOTE} action="Ask again" onAction={ask} />
        ) : null}
        {problem ? <Note testID="legal-problem" text={problem.text} action={problem.retry ? 'Try again' : undefined} onAction={problem.retry ?? undefined} busy={working !== null} /> : null}
        {attachNotice ? <Note testID="legal-attach-problem" text={attachNotice} /> : null}
        {refreshFailed && !problem ? <Note testID="legal-stale" text="Could not check for new messages." action="Try again" onAction={onRefresh} /> : null}
      </ScrollView>
      <Composer
        value={draft}
        onChange={change}
        placeholder={placeholderOf(thread)}
        onSend={canSend ? sendTyped : null}
        paddingBottom={bottom}
        onPlus={attachable ? () => setAttachOpen(true) : undefined}
      />
      {attachable ? (
        <AttachSheet
          visible={attachOpen}
          onClose={() => setAttachOpen(false)}
          onPickMedia={() => void choose(pickPhotoOrVideo)}
          onPickFile={() => void choose(() => pickChatFile(rules.data?.file.contentTypes ?? ['*/*']))}
          fileLine={fileLine(rules.data)}
        />
      ) : null}
      <PhotoViewer uri={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  list: { paddingTop: m.listTop, paddingHorizontal: m.listSide, paddingBottom: m.listBottom, gap: m.between, flexGrow: 1 },
  loading: { paddingTop: m.listTop, paddingHorizontal: m.listSide, gap: m.between },
});

