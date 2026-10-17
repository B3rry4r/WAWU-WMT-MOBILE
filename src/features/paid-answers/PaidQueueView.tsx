import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { VerifiedTick } from '@/components/icon';
import { formatMoney, Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { tickOf } from '@/features/chat/api';
import { hueFor } from '@/features/feed/model';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchQueuePage, fetchWaiting, paidKeys, type PaidQueueItem } from './api';
import { leftPill, msLeft } from './model';
import { paidThreadHref } from './routes';
import { useNow } from './useNow';

/** design/_gen/inbox.js line 44: a 52 circle, 13 between it and the words, 13 above and below each row, the pill 7 under the question. */
const rowMetrics = { avatar: 52, between: 13, padV: 13, name: 16, amount: 14.5, question: 14, questionTop: 4, pillTop: 7, cardGap: 14, tickGap: 4, barTop: 8 } as const;
const cardMetrics = { padV: 14, padH: 16, caption: 12.5, amount: 22, amountTop: 5, unit: 13, unitGap: 6, between: 12 } as const;
const naira = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

export const waitingQuery = { queryKey: paidKeys.waiting, queryFn: fetchWaiting, staleTime: 0 } as const;

export type PaidQueueViewProps = {
  /** Settings (I21): the card's button, and the empty state's way on. */
  onOpenSettings: () => void;
};

/**
 * I9 · Paid DMs, to answer: the creator's view of the Paid DMs chip. "Waiting on your reply ₦4,500 from 3 questions" with Settings, then
 * each question that waits, soonest deadline first (the Hub's order), its price and what is left of its window, red under 2 hours. The
 * figures in the card cover every waiting question (`GET /paid-dm/waiting`), not only the rows read so far. A row opens the fan's
 * conversation (I10). With nothing waiting, the empty state; a failed read, an error with Try again.
 */
export function PaidQueueView({ onOpenSettings }: PaidQueueViewProps) {
  const { colors } = useWawu();
  const router = useRouter();
  const now = useNow();
  const [pulled, setPulled] = useState(false);
  const waiting = useQuery(waitingQuery, queryClient);
  const queue = useInfiniteQuery(
    {
      queryKey: paidKeys.queue,
      queryFn: ({ pageParam }) => fetchQueuePage(pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      staleTime: 0,
    },
    queryClient,
  );
  const items = queue.data?.pages.flatMap((page) => page.items) ?? [];
  const { refetch: refetchQueue, fetchNextPage, hasNextPage, isFetchingNextPage } = queue;
  const { refetch: refetchWaiting } = waiting;

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await Promise.all([refetchQueue(), refetchWaiting()]);
    } finally {
      setPulled(false);
    }
  }, [refetchQueue, refetchWaiting]);
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !queue.isFetchNextPageError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, queue.isFetchNextPageError, fetchNextPage]);

  let body = null;
  let center = false;
  if (queue.isPending) {
    body = <QueueSkeleton />;
  } else if (queue.isError && !queue.data) {
    center = true;
    body = (
      <ErrorState
        testID="paid-queue-error"
        title="Couldn’t load your questions"
        message={isApiError(queue.error) ? queue.error.message : 'Something went wrong. Try again.'}
        icon={isApiError(queue.error) && queue.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void onRefresh()}
      />
    );
  } else if (items.length === 0) {
    center = true;
    body = (
      <EmptyState
        testID="paid-queue-empty"
        icon="Clock"
        title="No questions waiting"
        message="When a fan pays to ask you a question, it shows up here with the time you have to reply."
        action={{ label: 'Paid message settings', onPress: onOpenSettings }}
      />
    );
  }

  const header =
    items.length > 0 && waiting.data ? (
      <Card padded testID="paid-queue-card" style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardWords}>
            <Text variant="caption" tone="textMuted" style={{ fontSize: cardMetrics.caption }}>
              Waiting on your reply
            </Text>
            <View style={styles.amountLine}>
              <Money minorUnits={waiting.data.amountKobo} size={cardMetrics.amount} weight={700} decimals={waiting.data.amountKobo % 100 !== 0} testID="paid-queue-total" />
              <Text variant="caption" tone="textMuted" style={{ fontSize: cardMetrics.unit }} testID="paid-queue-count">
                {`from ${waiting.data.count} ${waiting.data.count === 1 ? 'question' : 'questions'}`}
              </Text>
            </View>
          </View>
          <Button label="Settings" icon="Settings2" variant="secondary" size="sm" onPress={onOpenSettings} testID="paid-queue-settings" />
        </View>
      </Card>
    ) : null;

  return (
    <FlatList
      testID="paid-queue"
      data={body ? [] : items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <QueueRow item={item} now={now} onOpen={() => router.push(paidThreadHref(item.sender.wawuId, item.id))} />}
      ListHeaderComponent={header}
      ListEmptyComponent={body}
      ListFooterComponent={
        items.length === 0 ? null : queue.isFetchNextPageError ? (
          <View style={styles.footer}>
            <Text variant="secondary">Couldn’t load more questions.</Text>
            <Button label="Try again" variant="secondary" size="sm" onPress={() => void fetchNextPage()} />
          </View>
        ) : isFetchingNextPage ? (
          <QueueSkeleton rows={1} testID="paid-queue-loading-more" />
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      contentContainerStyle={[styles.content, center && styles.centered]}
      style={styles.list}
    />
  );
}

function QueueRow({ item, now, onOpen }: { item: PaidQueueItem; now: number; onOpen: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const left = msLeft(item.deadlineAt, now);
  const pill = left === null ? null : leftPill(left);
  const tick = tickOf(item.sender);
  return (
    <Pressable
      testID={`paid-row-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={[item.sender.name, item.text, naira(item.amountKobo), pill?.label].filter(Boolean).join(', ')}
      onPress={onOpen}
      {...ring.handlers}
      style={[styles.row, { borderBottomColor: colors.borderHairline }, ring.style]}
    >
      <Avatar name={item.sender.name} hue={hueFor(item.sender.wawuId)} size={rowMetrics.avatar} source={item.sender.avatarUrl ?? undefined} decorative />
      <View style={styles.words}>
        <View style={styles.nameLine}>
          <View style={styles.nameWrap}>
            <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: rowMetrics.name }, styles.name]}>
              {item.sender.name}
            </Text>
            {tick ? <VerifiedTick kind={tick} size={14} /> : null}
          </View>
          <Money minorUnits={item.amountKobo} size={rowMetrics.amount} weight={600} decimals={item.amountKobo % 100 !== 0} />
        </View>
        <Text variant="body" tone="textSecondary" numberOfLines={1} style={[{ fontSize: rowMetrics.question }, styles.question]}>
          {item.text}
        </Text>
        {pill ? (
          <View style={styles.pill}>
            <StatusPill label={pill.label} tone={pill.tone} icon="Clock" testID={`paid-row-${item.id}-left`} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function QueueSkeleton({ rows = 3, testID = 'paid-queue-loading' }: { rows?: number; testID?: string }) {
  return (
    <LoadingView testID={testID} label="Loading your questions">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={rowMetrics.avatar} height={rowMetrics.avatar} radius={radius.chip} />
          <View style={styles.words}>
            <Skeleton width={140} height={14} radius={6} style={styles.bar} />
            <Skeleton width={210} height={12} radius={6} style={styles.bar} />
          </View>
        </View>
      ))}
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: space.sm, paddingBottom: 120 - layout.tabbarH },
  centered: { justifyContent: 'center' },
  card: { marginBottom: rowMetrics.cardGap, paddingVertical: cardMetrics.padV, paddingHorizontal: cardMetrics.padH },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: cardMetrics.between },
  cardWords: { flex: 1, minWidth: 0 },
  amountLine: { flexDirection: 'row', alignItems: 'baseline', gap: cardMetrics.unitGap, marginTop: cardMetrics.amountTop, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, paddingVertical: rowMetrics.padV, borderBottomWidth: StyleSheet.hairlineWidth },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.tickGap, flexShrink: 1 },
  name: { flexShrink: 1 },
  question: { marginTop: rowMetrics.questionTop },
  pill: { marginTop: rowMetrics.pillTop, alignSelf: 'flex-start' },
  bar: { marginTop: rowMetrics.barTop, maxWidth: '100%' },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
});
