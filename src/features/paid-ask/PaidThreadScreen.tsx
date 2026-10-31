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
import { usePaidFromMany, type PaidFromRead } from '@/features/pay-source/usePaidFrom';
import { readFailure } from '@/features/profile-edit/failure';
import { fetchVisitorProfile, visitorKey } from '@/features/visitor/api';
import { visitorName } from '@/features/visitor/model';
import { font, layout, space, useWawu } from '@/theme';
import { useShownPrice } from '@/features/store/ladder/usePrice';

import { fetchQuestion, fetchThread, questionKey, threadKey, type QuestionView, type ThreadDetail } from './api';
import { AskSheets } from './AskSheets';
import { answeredCard, composerLabel, followUpOf, headerLine, isOpen, isWaiting, offTitle, refundedCard, SOURCE_PENDING, threadEntries, waitingCard, whoOf, type AskTerms, type PaidFromState } from './model';
import { AskComposer, ClosedComposer, FailedComposer, LockedComposer, StatusCardView, WaitingComposer } from './parts';
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

/** The next question's terms with the price a person on a phone with a store would pay (null where no rung sells it). */
const shownFollowUp = (followUp: ReturnType<typeof followUpOf>, forKobo: (listKobo: number) => number | null): ReturnType<typeof followUpOf> =>
  followUp !== null && typeof followUp === 'object' ? { ...followUp, priceKobo: followUp.priceKobo === null ? null : forKobo(followUp.priceKobo) } : followUp;

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
  // R-101 point 10: on a phone with a store the offers say the store's price, never the list price.
  const shown = useShownPrice();
  const thread = useQuery(
    {
      queryKey: threadKey(wawuId),
      queryFn: () => fetchThread(wawuId),
      retry: false,
      // Read again while a question is open, also past its time: the Hub pays it back after that, and the card must turn to "refunded" when it does, not on the next visit (SWEEP-1026 row 4).
      refetchInterval: (query) => (focused && query.state.data && isOpen(query.state.data.questions) ? THREAD_POLL_MS : false),
    },
    cache,
  );
  const profile = useQuery({ queryKey: visitorKey(wawuId), queryFn: () => fetchVisitorProfile(wawuId), retry: false }, cache);
  const terms = useAskTerms(wawuId, profile.data ? profile.data.profile : null);
  // The terms could not be read only when there is no profile to read them from: a profile read once whose background re-read failed is still the person's data (FIX-79 L2).
  const termsFailed = profile.isError && !profile.data;

  // No questions yet is the Hub's 404, not a failure: the thread is empty and the person can ask.
  const none = isApiError(thread.error) && thread.error.status === 404;
  const detail: ThreadDetail | null = thread.data ?? null;
  const questions = useMemo(() => detail?.questions ?? [], [detail]);
  const other = detail?.thread.other ?? null;
  const name = other?.name ?? (profile.data ? visitorName(profile.data) : null);
  const avatarUrl = other?.avatarUrl ?? profile.data?.profile.avatarUrl ?? null;
  const tick = other ? tickOf(other) : profile.data ? tickOf({ verification: profile.data.profile.verification }) : undefined;

  // A question the Hub refunded: where the money went is the wallet's own record (the hold), read for each, and again while it is on its way.
  // A question still waiting is read too (PAY-FX, R-91): its payment says which account paid, so the card names the one the money returns to.
  const refunded = useMemo(() => questions.filter((q) => q.mine && (q.status === 'refunded' || q.status === 'awaiting_response')), [questions]);
  const records = useQueries({
    queries: refunded.map((q) => ({
      queryKey: questionKey(q.id),
      queryFn: () => fetchQuestion(q.id),
      retry: false,
      staleTime: 60_000,
      refetchInterval: (query: { state: { data?: QuestionView } }) => (query.state.data?.status === 'refunding' ? 4000 : false),
    })),
    combine: (results) => results.map((r) => ({ record: r.data ?? null, pending: r.isPending })),
  });
  const recordOf = (id: string): QuestionView | null => records[refunded.findIndex((q) => q.id === id)]?.record ?? null;
  // A question that moved on from open to refunded while this screen was up: its wallet record was read while it waited (kept a minute),
  // so it is read again, once, for the refund's amount and time (SWEEP-1026 row 4).
  const lastStatus = useRef(new Map<string, string>());
  useEffect(() => {
    for (const q of questions) {
      if (!q.mine) continue;
      const before = lastStatus.current.get(q.id);
      lastStatus.current.set(q.id, q.status);
      if (before === 'awaiting_response' && q.status === 'refunded') void cache.invalidateQueries({ queryKey: questionKey(q.id) });
    }
  }, [questions, cache]);
  // Which account paid is the PAYMENT's record (PAY-FX, R-91): the wallet's record of a question names the payment but not its source, so
  // each payment is read once (`GET /money/payments/{id}`, kept five minutes) and the cards and stamps read the account from that.
  const sources = usePaidFromMany(
    records.map((r) => r?.record?.payment?.id ?? null),
    cache,
  );
  // The account is known once the question's record and then its payment have been read (or could not be): until then it is not, and the
  // lines that name the money wait for it (SWEEP-1026 row 3).
  const sourceOf = (id: string): PaidFromRead => {
    const at = refunded.findIndex((q) => q.id === id);
    if (at < 0) return { from: null, settled: true };
    if (records[at]?.pending) return { from: null, settled: false };
    return sources[at] ?? { from: null, settled: true };
  };

  const ask = useAsk(
    pay,
    () => {
      void cache.invalidateQueries({ queryKey: threadKey(wawuId) });
      void cache.invalidateQueries({ queryKey: ['inbox'] });
    },
    focused,
  );

  const fromOf = (id: string): PaidFromState => {
    const read = sourceOf(id);
    return read.settled ? read.from : SOURCE_PENDING;
  };
  const entries = useMemo(() => threadEntries(questions, now, fromOf, shown.native), [questions, now, records, sources, shown.native]); // eslint-disable-line react-hooks/exhaustive-deps
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
              ? waitingCard(q, name, now, fromOf(q.id), shown.native)
              : entry.status === 'responded'
                ? answeredCard(name, entry.last ? shownFollowUp(followUpOf(terms, termsFailed), shown.forKobo) : null)
                : // The refund's words name the account, so they wait for the payment's record (the card names no account until then);
                  // a question bought in a store gave a question credit back (R-101 point 6).
                  refundedCard(q, name, sourceOf(q.id).settled ? recordOf(q.id) : null, now, fromOf(q.id), shown.native);
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
    // The creator's profile holds the terms. If that read failed, say so with Try again; the thread above stays readable.
    termsFailed ? (
      <FailedComposer title="Couldn't check if you can ask" message={readFailure(profile.error)} onRetry={() => void profile.refetch()} />
    ) : (
      <WaitingComposer />
    )
  ) : terms.kind === 'off' ? (
    <ClosedComposer line={offTitle(name)} />
  ) : (
    <AskComposer label={composerLabel(latest, shown.forKobo(terms.priceKobo))} onPress={() => openAsk(latest?.status === 'refunded' ? latest.text : undefined)} />
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
