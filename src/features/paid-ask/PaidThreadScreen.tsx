import { QueryClientContext, useQueries, useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useContext, useEffect, useMemo, useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { isApiError } from '@/api/errors';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { VerifiedTick } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { tickOf } from '@/features/chat/api';
import { DayLabel, TextBubble } from '@/features/chat/Bubbles';
import { hueFor } from '@/features/feed/model';
import type { FlowHandlers } from '@/features/feedpay/usePaymentFlow';
import { readFailure } from '@/features/profile-edit/failure';
import { fetchVisitorProfile, visitorKey } from '@/features/visitor/api';
import { visitorName } from '@/features/visitor/model';
import { font, layout, space, useWawu } from '@/theme';

import { fetchQuestion, fetchThread, questionKey, threadKey, type QuestionView, type ThreadDetail } from './api';
import { AskSheets } from './AskSheets';
import { answeredCard, composerLabel, headerLine, isWaiting, offTitle, refundedCard, threadEntries, waitingCard, whoOf, type AskTerms } from './model';
import { AskComposer, ClosedComposer, LockedComposer, StatusCardView, WaitingComposer } from './parts';
import { useAsk } from './useAsk';
import { useAskTerms } from './useAskTerms';
import { useNow } from './useNow';

/** design/_gen/inbox.js `chatHead` (the same bar as the chat, I12): 64 high, 12 on the left and 16 on the right, 10 between its parts, a hairline under it. */
const head = { height: 64, padLeft: 12, padRight: 16, between: 10, back: 40, avatar: 40, name: 16, sub: 12.5, subGap: 1, tick: 14, tickGap: 4 } as const;
/** design/_gen/inbox.js `msgs`: 14 above the messages, 16 at the sides, 10 apart. */
const list = { padTop: 14, padH: 16, between: 10, loadingRows: 3 } as const;
/** How often a thread that waits is read again, for the creator's answer (no push opens this screen's live feed yet). PROVISIONAL(PAID-THREAD-POLL, owner=INBOX-10, why=no ruling sizes it; fifteen seconds is short enough to see an answer and light enough for one read). */
export const THREAD_POLL_MS = 15_000;

export type PaidThreadScreenProps = {
  /** The creator's WAWU ID. */
  wawuId: string;
  onBack: () => void;
  /** Where the wallet steps lead (Open your wallet, a PIN to set, Forgot PIN, Add money). */
  pay: FlowHandlers;
};

/**
 * I4 · Waiting for a reply, I5 · Replied and I7 · Refunded: a fan's paid questions to one creator, with the Hub's state under each (the
 * countdown and where the money is, the creator's words, or the refund and where it went). Every figure and time is the Hub's. The
 * composer is locked while a question waits, and after an answer or a refund it is the button that asks again (the ask sheet, I3).
 */
export function PaidThreadScreen({ wawuId, onBack, pay }: PaidThreadScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const cache = useContext(QueryClientContext) ?? queryClient;
  const focused = useIsFocused();
  const now = useNow(30_000, focused);
  const thread = useQuery(
    {
      queryKey: threadKey(wawuId),
      queryFn: () => fetchThread(wawuId),
      retry: false,
      refetchInterval: (query) => (focused && query.state.data && isWaiting(query.state.data.questions, Date.now()) ? THREAD_POLL_MS : false),
    },
    cache,
  );
  const profile = useQuery({ queryKey: visitorKey(wawuId), queryFn: () => fetchVisitorProfile(wawuId), retry: false }, cache);
  const terms = useAskTerms(wawuId, profile.data ? profile.data.profile : null);

  // No questions yet is the Hub's 404, not a failure: the thread is empty and the person can ask.
  const none = isApiError(thread.error) && thread.error.status === 404;
  const detail: ThreadDetail | null = thread.data ?? null;
  const questions = useMemo(() => detail?.questions ?? [], [detail]);
  const other = detail?.thread.other ?? null;
  const name = other?.name ?? (profile.data ? visitorName(profile.data) : null);
  const avatarUrl = other?.avatarUrl ?? profile.data?.profile.avatarUrl ?? null;
  const tick = other ? tickOf(other) : profile.data ? tickOf({ verification: profile.data.profile.verification }) : undefined;

  // A question the Hub refunded: where the money went is the wallet's own record (the hold), read for each, and again while it is on its way.
  const refunded = useMemo(() => questions.filter((q) => q.mine && q.status === 'refunded'), [questions]);
  const records = useQueries({
    queries: refunded.map((q) => ({
      queryKey: questionKey(q.id),
      queryFn: () => fetchQuestion(q.id),
      retry: false,
      staleTime: 60_000,
      refetchInterval: (query: { state: { data?: QuestionView } }) => (query.state.data?.status === 'refunding' ? 4000 : false),
    })),
    combine: (results) => results.map((r) => r.data ?? null),
  });
  const recordOf = (id: string): QuestionView | null => records[refunded.findIndex((q) => q.id === id)] ?? null;

  const ask = useAsk(
    pay,
    () => {
      void cache.invalidateQueries({ queryKey: threadKey(wawuId) });
      void cache.invalidateQueries({ queryKey: ['inbox'] });
    },
    focused,
  );

  const entries = useMemo(() => threadEntries(questions, now), [questions, now]);
  const latest = useMemo(() => [...questions].filter((q) => q.mine).sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt))[0] ?? null, [questions]);
  const waiting = isWaiting(questions, now);
  const sub = headerLine(latest);

  const scroll = useRef<ScrollView>(null);
  const lastCount = useRef(0);
  useEffect(() => {
    if (entries.length !== lastCount.current) {
      lastCount.current = entries.length;
      requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: false }));
    }
  }, [entries.length]);

  const openAsk = (preset?: string) => {
    if (terms?.kind !== 'on') return;
    ask.begin({
      wawuId,
      name,
      avatarUrl,
      hue: hueFor(wawuId),
      tick,
      priceKobo: terms.priceKobo,
      windowHours: terms.windowHours,
      text: preset,
    });
  };

  const loading = thread.isPending && !none;
  const failed = thread.isError && !none;
  let body;
  if (failed) {
    body = (
      <View style={styles.center}>
        <ErrorState testID="paid-thread-error" title="Couldn't open these questions" message={readFailure(thread.error)} onRetry={() => void thread.refetch()} />
      </View>
    );
  } else if (loading) {
    body = (
      <LoadingView testID="paid-thread-loading" label="Loading your questions">
        <View style={styles.skeletonPad}>
          {Array.from({ length: list.loadingRows }, (_, i) => (
            <View key={i} style={[i % 2 === 0 ? styles.right : styles.left, i > 0 && styles.skeletonGap]}>
              <Skeleton width={i % 2 === 0 ? '60%' : '75%'} height={i % 2 === 0 ? head.avatar * 1.5 : head.avatar * 2} radius={20} />
            </View>
          ))}
        </View>
      </LoadingView>
    );
  } else if (entries.length === 0) {
    body = (
      <View style={styles.center}>
        <EmptyState testID="paid-thread-empty" icon="MessageCircle" title="No paid questions yet" message={`Ask ${whoOf(name)} a question and ${whoOf(name)} has a set time to answer it.`} />
      </View>
    );
  } else {
    body = (
      <ScrollView ref={scroll} testID="paid-thread-list" contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {entries.map((entry) => {
          if (entry.kind === 'day') return <DayLabel key={entry.key} label={entry.label} />;
          if (entry.kind === 'question') return <TextBubble key={entry.key} id={entry.key} text={entry.text} mine stamp={entry.stamp} />;
          if (entry.kind === 'reply') return <TextBubble key={entry.key} id={entry.key} text={entry.text} mine={false} stamp={entry.stamp} />;
          const q = entry.question;
          const card =
            entry.status === 'awaiting_response'
              ? waitingCard(q, name, now)
              : entry.status === 'responded'
                ? answeredCard(name, entry.last && terms?.kind === 'on' ? { priceKobo: terms.priceKobo, windowHours: terms.windowHours } : null)
                : refundedCard(q, name, recordOf(q.id), now);
          return <StatusCardView key={entry.key} testID={`paid-card-${q.id}`} card={card} />;
        })}
      </ScrollView>
    );
  }

  const ready = !failed && !loading;
  const composer = !ready ? (
    <View style={{ height: Math.max(insets.bottom, space.lg) }} />
  ) : waiting ? (
    <LockedComposer line={`You can send once ${whoOf(name)} replies`} />
  ) : terms === null ? (
    <WaitingComposer />
  ) : terms.kind === 'off' ? (
    <ClosedComposer line={offTitle(name)} />
  ) : (
    <AskComposer label={composerLabel(latest, terms.priceKobo)} onPress={() => openAsk(latest?.status === 'refunded' ? latest.text : undefined)} />
  );

  return (
    <KeyboardAvoidingView testID="paid-thread-screen" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderBottomColor: colors.borderHairline }]} testID="paid-thread-header">
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} size={head.back} testID="paid-thread-back" />
        {name ? (
          <>
            <Avatar name={name} hue={hueFor(wawuId)} size={head.avatar} source={avatarUrl ?? undefined} decorative />
            <View style={styles.words}>
              <View style={styles.nameLine}>
                <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[font(700), { fontSize: head.name }, styles.name]} testID="paid-thread-name">
                  {name}
                </Text>
                {tick ? <VerifiedTick kind={tick} size={head.tick} /> : null}
              </View>
              <Text variant="caption" tone={sub.tone === 'positive' ? 'positive' : 'textMuted'} numberOfLines={1} style={[{ fontSize: head.sub }, styles.sub]} testID="paid-thread-sub">
                {ready ? sub.text : 'Paid DM'}
              </Text>
            </View>
          </>
        ) : null}
      </View>
      <View style={styles.body}>{body}</View>
      {composer}
      <AskSheets ask={ask} onAddMoney={pay.onAddMoney} onOpenWallet={pay.onOpenWallet} onForgotPin={pay.onForgotPin} />
    </KeyboardAvoidingView>
  );
}

export type { AskTerms };

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    minHeight: head.height,
    paddingLeft: head.padLeft,
    paddingRight: head.padRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: head.between,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: head.tickGap },
  name: { flexShrink: 1 },
  sub: { marginTop: head.subGap },
  body: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter },
  messages: { paddingTop: list.padTop, paddingBottom: list.padTop, paddingHorizontal: list.padH, gap: list.between },
  skeletonPad: { paddingTop: list.padTop, paddingHorizontal: list.padH },
  skeletonGap: { marginTop: list.between },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
});
