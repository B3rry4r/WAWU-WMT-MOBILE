import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { ErrorState } from '@/components/StateViews';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { onLiveEvent, onLiveSynced, retainLive } from '@/features/inbox/live';
import { useWawu } from '@/theme';

import { askAgain, fetchThread, legalKeys, resolveThread, sendMessage, sendToConsultant, type LegalQuickReply, type LegalSend, type LegalThread } from './api';
import { FixedPriceCard, MatterCard, matterCardOf } from './cards';
import { readDraft, writeDraft } from './draft';
import { fetchServices, fixedKeys } from './fixed/api';
import { FIXED_PRICE_MATTERS, fixedPriceFor } from './fixed/model';
import { legalMetrics as m } from './look';
import {
  briefToConfirm,
  chatRows,
  canTryAgain,
  failureKind,
  failureText,
  hasSpoken,
  headerOf,
  isLegalLiveEvent,
  needsAnotherAsk,
  placeholderOf,
  tapsOf,
  typedBody,
} from './model';
import { Bubble, BriefCard, ChatBar, ChatLine, Composer, Note, QuickReplies, Typing } from './parts';

/** What the person is waiting on. One thing at a time: a second tap while one is under way is ignored. */
type Working = { kind: 'message'; shown: string } | { kind: 'ask' } | { kind: 'send' };

/** A call that failed. `retry` is null when trying again would only fail the same way (the words are too long, the day's limit is reached). */
type Problem = { text: string; retry: (() => void) | null };

/**
 * S14 to S17: the WAWU Legal assistant. One conversation (`GET /legal/assistant/{id}`) drawn as it stands: the
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
        onStartFixed={(code) => router.push({ pathname: '/legal-fixed', params: { code } })}
      />
    );
  } else {
    body = (
      <>
        <ChatBar header={{ title: 'WAWU Legal', sub: '', human: false }} onBack={leave} />
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
  /** S24's Start this request opens the fixed-price request (S26). */
  onStartFixed: (serviceCode: string) => void;
};

function Chat({ thread, refreshFailed, onRefresh, onLeave, bottom, onBook, onOpenMatter, onStartFixed }: ChatProps) {
  const scroll = useRef<ScrollView>(null);
  // S24: the services the Hub lists are asked for only when this conversation's matter is one that starts as a fixed-price service.
  const fixedMatter = thread.stage === 'profiling' && hasSpoken(thread) && thread.matter in FIXED_PRICE_MATTERS;
  const services = useQuery({ queryKey: fixedKeys.catalogue, queryFn: fetchServices, enabled: fixedMatter, staleTime: 60_000 }, queryClient);
  const fixed = fixedMatter ? fixedPriceFor(thread.matter, services.data) : null;
  const matterCard = thread.consultant && thread.legalRequestId ? matterCardOf(thread.requestStatus) : null;
  const [draft, setDraft] = useState(() => readDraft(thread.id));
  const [working, setWorking] = useState<Working | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  // Two taps in one frame both see the state as it was: the guard is a ref, set before anything is awaited.
  const busy = useRef(false);
  const id = thread.id;

  const change = (text: string) => {
    setDraft(text);
    writeDraft(id, text);
  };
  const keep = (next: LegalThread) => queryClient.setQueryData(legalKeys.thread, next);

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
    } catch (error) {
      const kind = failureKind(error);
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
      if (!saved) {
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
          <ChatLine key={row.id} row={row} />
        ))}
        {working?.kind === 'message' ? <Bubble mine body={working.shown} testID="legal-bubble-sending" dim /> : null}
        {working?.kind === 'message' || working?.kind === 'ask' ? <Typing /> : null}
        {matterCard && thread.legalRequestId ? (
          <MatterCard
            kind={matterCard}
            matterLabel={thread.matterLabel}
            onPress={() => (matterCard === 'book' ? onBook(thread.legalRequestId as string) : onOpenMatter(thread.legalRequestId as string))}
          />
        ) : null}
        {fixed && !sending ? <FixedPriceCard service={fixed} onStart={() => onStartFixed(fixed.code)} /> : null}
        {taps.length > 0 && !sending ? <QuickReplies taps={taps} onTap={tap} disabled={working !== null} /> : null}
        {brief && working?.kind !== 'message' ? <BriefCard brief={brief} onSend={send} sending={working?.kind === 'send'} /> : null}
        {slow && working === null && !problem ? (
          <Note testID="legal-slow" text="The assistant is taking a while to answer. Your message is saved." action="Ask again" onAction={ask} />
        ) : null}
        {problem ? <Note testID="legal-problem" text={problem.text} action={problem.retry ? 'Try again' : undefined} onAction={problem.retry ?? undefined} busy={working !== null} /> : null}
        {refreshFailed && !problem ? <Note testID="legal-stale" text="Could not check for new messages." action="Try again" onAction={onRefresh} /> : null}
      </ScrollView>
      <Composer value={draft} onChange={change} placeholder={placeholderOf(thread)} onSend={canSend ? sendTyped : null} paddingBottom={bottom} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  list: { paddingTop: m.listTop, paddingHorizontal: m.listSide, paddingBottom: m.listBottom, gap: m.between, flexGrow: 1 },
  loading: { paddingTop: m.listTop, paddingHorizontal: m.listSide, gap: m.between },
});

