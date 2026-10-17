import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, VerifiedTick } from '@/components/icon';
import { formatMoney } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { tickOf } from '@/features/chat/api';
import { DayLabel, TextBubble } from '@/features/chat/Bubbles';
import { dayKey, dayLabel, firstName } from '@/features/communities/format';
import { hueFor } from '@/features/feed/model';
import { inboxKey } from '@/features/inbox/api';
import { font, layout, radius, space, text as textStyles, useWawu } from '@/theme';

import { fetchThreadPage, openFreeChat, paidKeys, postReply, type PaidQuestion, type PaidThreadDetail } from './api';
import { cardOf, stateOf, type QuestionCard } from './model';
import { useNow } from './useNow';

/** design/_gen/inbox.js lines 24 to 31: a 64 bar (12 left, 16 right, 10 between), 14 above the messages and 16 at the sides, 10 apart; the card 18 round, 12 by 14 in. */
const headMetrics = { height: 64, padLeft: 12, padRight: 16, between: 10, back: 40, avatar: 40, name: 16, sub: 12.5, subGap: 1, tick: 14, tickGap: 4 } as const;
const threadMetrics = { padTop: 14, padH: 16, between: 10, dayPad: 4 } as const;
const cardMetrics = { corner: 18, padV: 12, padH: 14, between: 11, icon: 18, iconStroke: 2.2, title: 14, body: 12.5, bodyTop: 2, bodyLine: 1.4 } as const;
const composerMetrics = { padTop: 10, padH: 16, between: 8, field: 44, fieldCorner: 22, fieldPadV: 10, fieldPadH: 16, fieldFont: 15, fieldLine: 1.35, ringIdle: 1, ringFocus: 1.5, maxLines: 5, round: 44, arrow: 20, arrowStroke: 2.4 } as const;
const lineHeight = composerMetrics.fieldFont * composerMetrics.fieldLine;
const maxField = composerMetrics.fieldPadV * 2 + lineHeight * composerMetrics.maxLines;
/** How often the conversation is read again while a question is open or its share has not landed: a share moves in the creator's one move a day (R-55). */
const REFRESH_MS = 30_000;
/** A reply read back after a lost answer counts as the one just sent only if the Hub made it within this long of the tap. */
const SAME_TAP_MS = 120_000;
const naira = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

export type PaidThreadScreenProps = {
  /** The fan whose questions these are. */
  wawuId: string;
  /** The question the person came for (I9's row), when known: the answer goes to it while it is open. */
  focusQuestion?: string;
  onBack: () => void;
  /** Message on an answered question: the free chat (I12), by its id. */
  onOpenChat: (chatId: string) => void;
};

type Pages = InfiniteData<PaidThreadDetail, string | undefined>;

/**
 * I10 and I11 · A fan's paid questions, as the creator answers them. The thread shows each question with the creator's replies and
 * under it a card in the Hub's words: while it is open "Reply in 1h 12m to earn ₦1,275. That's 85% of ₦1,500. Miss it and Bisi gets their
 * ₦1,500 back." (the brief's I10); once answered, where the share is (R-11, R-55); once the time ran out, that the price went back.
 * Every figure is the Hub's. The composer answers the open question: one request per tap, the field kept when the Hub refuses (its own
 * words under the thread). After the answer the bar becomes Message, the way into the free chat (I12, R-13).
 */
export function PaidThreadScreen({ wawuId, focusQuestion, onBack, onOpenChat }: PaidThreadScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const now = useNow();
  const key = paidKeys.thread(wawuId);
  const thread = useInfiniteQuery(
    {
      queryKey: key,
      queryFn: ({ pageParam }) => fetchThreadPage(wawuId, pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      staleTime: 0,
      refetchInterval: (query) => {
        if (!focused) return false;
        const questions = query.state.data?.pages.flatMap((p) => p.questions) ?? [];
        return questions.some((q) => q.status === 'awaiting_response' || (q.status === 'responded' && q.creatorEarning !== null && q.creatorEarning.state !== 'in_wallet')) ? REFRESH_MS : false;
      },
    },
    queryClient,
  );
  const person = thread.data?.pages[0]?.thread.other ?? null;
  const asker = person ? firstName(person.name) || null : null;
  // Newest first from the Hub; the thread reads oldest first, newest at the bottom.
  const questions = useMemo(() => (thread.data?.pages.flatMap((p) => p.questions) ?? []).slice().reverse(), [thread.data]);
  // The question the composer answers: the one the person came for while it is open, else the one due soonest.
  const open = useMemo(() => {
    const waiting = questions.filter((q) => stateOf(q, now) === 'open');
    const asked = focusQuestion ? waiting.find((q) => q.id === focusQuestion) : undefined;
    return asked ?? waiting.slice().sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt))[0] ?? null;
  }, [questions, focusQuestion, now]);

  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const { refetch } = thread;

  const patch = useCallback(
    (answered: PaidQuestion) => {
      queryClient.setQueryData<Pages>(key, (data) => (data ? { ...data, pages: data.pages.map((page) => ({ ...page, questions: page.questions.map((q) => (q.id === answered.id ? answered : q)) })) } : data));
      void queryClient.invalidateQueries({ queryKey: paidKeys.waiting });
      void queryClient.invalidateQueries({ queryKey: paidKeys.queue });
      void queryClient.invalidateQueries({ queryKey: inboxKey });
    },
    [key],
  );

  /** Takes the words; true means the Hub took them (the field clears). One request per tap: a second tap while one is out does nothing. */
  const send = useCallback(
    async (words: string): Promise<boolean> => {
      if (sending.current || !open) return false;
      const text = words.trim();
      if (!text) return false;
      sending.current = true;
      setBusy(true);
      setNotice(null);
      const tappedAt = Date.now();
      try {
        patch(await postReply(open.id, text));
        return true;
      } catch (error) {
        const lost = !isApiError(error) || error.kind === 'network' || error.kind === 'server' || error.kind === 'unknown';
        if (lost) {
          // The answer may have reached the Hub before the line dropped: read the conversation before saying it failed, and never send twice.
          const fresh = await refetch().catch(() => null);
          const there = fresh?.data?.pages.flatMap((p) => p.questions).find((q) => q.id === open.id);
          if (there?.replies.some((r) => r.text === text && Math.abs(new Date(r.createdAt).getTime() - tappedAt) < SAME_TAP_MS)) {
            patch(there);
            return true;
          }
          setNotice(isApiError(error) && error.kind !== 'unknown' ? error.message : 'Your answer could not be sent. Try again.');
        } else {
          // The Hub refused (the window closed, already settled): its own words, and what it now holds.
          setNotice(error.message);
          void refetch();
        }
        return false;
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    [open, patch, refetch],
  );

  const [opening, setOpening] = useState(false);
  const openChat = useCallback(async () => {
    if (opening) return;
    setOpening(true);
    try {
      onOpenChat(await openFreeChat(wawuId));
    } catch (error) {
      setNotice(isApiError(error) ? error.message : 'The chat could not be opened. Try again.');
    } finally {
      setOpening(false);
    }
  }, [opening, onOpenChat, wawuId]);

  const sub = subtitle(questions, open, now);
  let body;
  if (thread.isPending) {
    body = <ThreadSkeleton />;
  } else if (thread.isError && !thread.data) {
    const gone = isApiError(thread.error) && (thread.error.status === 404 || thread.error.status === 403);
    body = (
      <View style={styles.center}>
        {gone ? (
          <EmptyState testID="paid-thread-unavailable" icon="Ban" title="This conversation isn’t available" message="It may have been removed, or you may not be able to see it." />
        ) : (
          <ErrorState
            testID="paid-thread-error"
            title="Couldn’t open this conversation"
            message={isApiError(thread.error) ? thread.error.message : 'Something went wrong. Try again.'}
            icon={isApiError(thread.error) && thread.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            onRetry={() => void refetch()}
          />
        )}
      </View>
    );
  } else {
    body = (
      <ScrollView testID="paid-thread" contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {thread.hasNextPage ? (
          <View style={styles.older}>
            <Button label="Earlier questions" variant="secondary" size="sm" loading={thread.isFetchingNextPage} onPress={() => void thread.fetchNextPage()} testID="paid-thread-older" />
          </View>
        ) : null}
        {questions.map((question, index) => (
          <QuestionBlock key={question.id} question={question} previous={questions[index - 1]} asker={asker} now={now} />
        ))}
      </ScrollView>
    );
  }

  const ready = thread.isSuccess;
  return (
    <KeyboardAvoidingView testID="paid-thread-screen" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderBottomColor: colors.borderHairline }]} testID="paid-thread-header">
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} size={headMetrics.back} testID="paid-thread-back" />
        {person ? (
          <>
            <Avatar name={person.name} hue={hueFor(person.wawuId)} size={headMetrics.avatar} source={person.avatarUrl ?? undefined} decorative />
            <View style={styles.words}>
              <View style={styles.nameLine}>
                <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[font(700), { fontSize: headMetrics.name }, styles.name]} testID="paid-thread-name">
                  {person.name}
                </Text>
                {tickOf(person) ? <VerifiedTick kind={tickOf(person)} size={headMetrics.tick} /> : null}
              </View>
              {sub ? (
                <Text variant="caption" tone={sub.tone} numberOfLines={1} style={[{ fontSize: headMetrics.sub }, styles.sub]} testID="paid-thread-sub">
                  {sub.text}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
      <View style={styles.body}>{body}</View>
      {notice ? (
        <Pressable accessibilityRole="alert" onPress={() => setNotice(null)} style={[styles.notice, { backgroundColor: colors.surfaceChrome }]} testID="paid-thread-notice">
          <Text variant="errorLine" tone="danger">
            {notice}
          </Text>
        </Pressable>
      ) : null}
      {ready ? open ? <ReplyComposer busy={busy} onSend={send} /> : <MessageBar name={asker} busy={opening} onPress={() => void openChat()} /> : <View style={{ height: Math.max(insets.bottom, space.lg) }} />}
    </KeyboardAvoidingView>
  );
}

/** The line under the name: "Paid DM · ₦1,500" while one waits, "Paid DM · answered" (in the positive colour) once the newest is answered. */
function subtitle(questions: PaidQuestion[], open: PaidQuestion | null, now: number): { text: string; tone: 'textMuted' | 'positive' } | null {
  if (questions.length === 0) return null;
  const waiting = questions.filter((q) => stateOf(q, now) === 'open').length;
  if (open) return { text: waiting > 1 ? `Paid DM · ${naira(open.amountKobo)} · ${waiting} waiting` : `Paid DM · ${naira(open.amountKobo)}`, tone: 'textMuted' };
  const last = questions[questions.length - 1];
  if (last && stateOf(last, now) === 'answered') return { text: 'Paid DM · answered', tone: 'positive' };
  return { text: 'Paid DM', tone: 'textMuted' };
}

/** One question: its day when it changes, the fan's words, the creator's replies, and the card that says what it is worth or what became of it. */
function QuestionBlock({ question, previous, asker, now }: { question: PaidQuestion; previous: PaidQuestion | undefined; asker: string | null; now: number }) {
  const card = cardOf(question, asker, now, naira);
  const newDay = !previous || dayKey(previous.sentAt) !== dayKey(question.sentAt);
  return (
    <View testID={`paid-question-${question.id}`} style={styles.block}>
      {newDay ? <DayLabel label={dayLabel(question.sentAt)} /> : null}
      <TextBubble id={`q-${question.id}`} text={question.text} mine={false} at={question.sentAt} />
      {question.replies.map((reply) => (
        <TextBubble key={reply.id} id={`r-${reply.id}`} text={reply.text} mine at={reply.createdAt} />
      ))}
      <QuestionCardView card={card} testID={`paid-question-${question.id}-card`} />
    </View>
  );
}

function QuestionCardView({ card, testID }: { card: QuestionCard; testID: string }) {
  const { colors } = useWawu();
  const tint = card.tone === 'warning' ? colors.warningTint : card.tone === 'positive' ? colors.positiveTint : colors.surfaceSunken;
  const ink = card.tone === 'warning' ? colors.warning : card.tone === 'positive' ? colors.positive : colors.textSecondary;
  return (
    <View testID={testID} accessible accessibilityLabel={`${card.title}. ${card.body}`} style={[styles.card, { backgroundColor: tint }]}>
      <Icon name={card.icon} size={cardMetrics.icon} color={ink} strokeWidth={cardMetrics.iconStroke} />
      <View style={styles.cardWords}>
        <Text variant="body" style={[font(600), { fontSize: cardMetrics.title }]} testID={`${testID}-title`}>
          {card.title}
        </Text>
        <Text variant="body" tone="textSecondary" style={{ fontSize: cardMetrics.body, lineHeight: cardMetrics.body * cardMetrics.bodyLine, marginTop: cardMetrics.bodyTop }} testID={`${testID}-body`}>
          {card.body}
        </Text>
      </View>
    </View>
  );
}

/** I10's composer: the field and Reply. The field keeps its words when the answer is not taken. */
function ReplyComposer({ busy, onSend }: { busy: boolean; onSend: (text: string) => Promise<boolean> }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const hasWords = value.trim().length > 0;
  const press = async () => {
    if (!hasWords || busy) return;
    if (await onSend(value)) setValue('');
  };
  return (
    <View testID="paid-composer" style={[styles.composer, { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      <TextInput
        testID="paid-composer-input"
        accessibilityLabel="Your reply"
        value={value}
        onChangeText={setValue}
        placeholder="Your reply"
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={Platform.OS === 'web' ? 1 : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.field,
          Platform.OS === 'web' ? browserOutlineOff : null,
          textStyles.body,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceInput,
            boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: focused ? composerMetrics.ringFocus : composerMetrics.ringIdle, color: focused ? colors.accent : colors.borderHairline, inset: true }],
          },
        ]}
      />
      <Button label="Reply" size="md" disabled={!hasWords} loading={busy} onPress={() => void press()} testID="paid-composer-send" />
    </View>
  );
}

/** I11's bar: Message, the way into the free chat with this person (I12, R-13). The whole bar is one button. */
function MessageBar({ name, busy, onPress }: { name: string | null; busy: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const insets = useSafeAreaInsets();
  return (
    <View testID="paid-message-bar" style={[styles.composer, { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      <Pressable
        testID="paid-message"
        accessibilityRole="button"
        accessibilityLabel={name ? `Message ${name}` : 'Message'}
        accessibilityState={{ busy }}
        onPress={onPress}
        {...ring.handlers}
        style={[styles.messageField, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: composerMetrics.ringIdle, color: colors.borderHairline, inset: true }] }, ring.style]}
      >
        <Text variant="body" tone="textMuted" style={{ fontSize: composerMetrics.fieldFont }}>
          Message
        </Text>
      </Pressable>
      <View style={[styles.round, { backgroundColor: colors.surfaceSunken }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name="ArrowUp" size={composerMetrics.arrow} color={colors.textDisabled} strokeWidth={composerMetrics.arrowStroke} />
      </View>
    </View>
  );
}

function ThreadSkeleton() {
  return (
    <LoadingView testID="paid-thread-loading" label="Loading the conversation">
      <View style={styles.skeleton}>
        <Skeleton width="60%" height={headMetrics.avatar * 1.4} radius={20} />
        <Skeleton width="100%" height={64} radius={cardMetrics.corner} style={styles.skeletonGap} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { minHeight: headMetrics.height, paddingLeft: headMetrics.padLeft, paddingRight: headMetrics.padRight, flexDirection: 'row', alignItems: 'center', gap: headMetrics.between, borderBottomWidth: StyleSheet.hairlineWidth },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: headMetrics.tickGap },
  name: { flexShrink: 1 },
  sub: { marginTop: headMetrics.subGap },
  body: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  messages: { flexGrow: 1, paddingTop: threadMetrics.padTop, paddingBottom: threadMetrics.padTop, paddingHorizontal: threadMetrics.padH, gap: threadMetrics.between },
  older: { alignItems: 'center', paddingBottom: space.sm },
  block: { gap: threadMetrics.between },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: cardMetrics.between, borderRadius: cardMetrics.corner, paddingVertical: cardMetrics.padV, paddingHorizontal: cardMetrics.padH, alignSelf: 'stretch' },
  cardWords: { flex: 1, minWidth: 0 },
  notice: { paddingHorizontal: layout.gutter, paddingVertical: space.sm },
  composer: { flexDirection: 'row', alignItems: 'center', gap: composerMetrics.between, paddingTop: composerMetrics.padTop, paddingHorizontal: composerMetrics.padH, borderTopWidth: StyleSheet.hairlineWidth },
  field: { flex: 1, minHeight: composerMetrics.field, maxHeight: maxField, borderRadius: composerMetrics.fieldCorner, paddingVertical: composerMetrics.fieldPadV, paddingHorizontal: composerMetrics.fieldPadH, fontSize: composerMetrics.fieldFont, lineHeight },
  messageField: { flex: 1, minHeight: composerMetrics.field, borderRadius: composerMetrics.fieldCorner, paddingVertical: composerMetrics.fieldPadV, paddingHorizontal: composerMetrics.fieldPadH, justifyContent: 'center' },
  round: { width: composerMetrics.round, height: composerMetrics.round, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  skeleton: { paddingTop: threadMetrics.padTop, paddingHorizontal: threadMetrics.padH },
  skeletonGap: { marginTop: threadMetrics.between },
});
