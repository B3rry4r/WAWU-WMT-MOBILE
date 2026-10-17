import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import type { EventView } from '../api';
import { EventsTabs, NavBar } from '../chrome';
import { useRefetchOnFocus } from '../useRefetchOnFocus';
import { fetchMinePage, fetchSold, mineKey, soldKey } from './organiserApi';
import { opensOf, pillOf, rowLine } from './organiserFormat';

/** design/_gen/events.js `myEvents` (E17): a card per event, 10 between, a 56 picture with a 16 corner, the pill at the right end. */
const rowMetrics = { gap: 10, pad: 12, thumb: 56, thumbCorner: radius.input, between: 12, title: 16, line: 13.5, top: 14, bottom: 40 } as const;
const SKELETONS = 3;

export type MyEventsScreenProps = {
  onBack: () => void;
  onDiscover: () => void;
  onHost: () => void;
  /** A live event opens its dashboard (E18). */
  onOpenLive: (id: string) => void;
  /** A sent-back event opens E22. */
  onOpenSentBack: (id: string) => void;
  now?: () => number;
};

/** E17 · My events: the host's own events at every status, with what the Hub says about each (a live one's sales, a sent-back one's note). */
export function MyEventsScreen({ onBack, onDiscover, onHost, onOpenLive, onOpenSentBack, now = Date.now }: MyEventsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const mine = useInfiniteQuery({
    queryKey: mineKey,
    queryFn: ({ pageParam }) => fetchMinePage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
  const events = (mine.data?.pages ?? []).flatMap((page) => page.events);
  // The sales are the Hub's too. A row that has no count yet (or never gets one) draws its date alone, never "0 sold".
  const sold = useQuery({ queryKey: soldKey, queryFn: fetchSold, retry: false });
  useRefetchOnFocus(['events', 'mine']);
  const [at] = useState(() => now());

  return (
    <View testID="my-events-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Events" onBack={onBack} backTestID="my-events-back" />
      <EventsTabs active="mine" onChange={(tab) => (tab === 'discover' ? onDiscover() : tab === 'host' ? onHost() : undefined)} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: rowMetrics.bottom + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {mine.isPending ? (
          <LoadingView label="Loading your events" testID="my-events-loading">
            {Array.from({ length: SKELETONS }, (_, i) => (
              <Skeleton key={i} height={rowMetrics.thumb + rowMetrics.pad * 2} radius={radius.card} />
            ))}
          </LoadingView>
        ) : mine.isError && !mine.data ? (
          <ErrorState
            testID="my-events-error"
            title="Couldn't load your events"
            message={isApiError(mine.error) ? mine.error.message : 'Check your connection and try again.'}
            onRetry={() => void mine.refetch()}
          />
        ) : events.length === 0 ? (
          <EmptyState
            testID="my-events-empty"
            icon="CalendarDays"
            title="No events yet"
            message="Events you host show up here."
            action={{ label: 'Host an event', onPress: onHost }}
          />
        ) : (
          <>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                sold={sold.data?.[event.id]}
                now={at}
                onOpen={opensOf(event) === 'dashboard' ? () => onOpenLive(event.id) : opensOf(event) === 'sent-back' ? () => onOpenSentBack(event.id) : null}
              />
            ))}
            {mine.hasNextPage ? (
              <View style={styles.more}>
                <Button testID="my-events-more" label="Show more" variant="secondary" size="md" loading={mine.isFetchingNextPage} onPress={() => void mine.fetchNextPage()} />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EventCard({ event, sold, now, onOpen }: { event: EventView; sold: number | undefined; now: number; onOpen: (() => void) | null }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const pill = pillOf(event);
  const line = rowLine(event, sold, now);
  const note = event.status === 'rejected' ? event.lastDecisionReason : null;
  const body = (
    <Card style={styles.card} testID={`my-event-${event.id}`}>
      <View style={styles.top}>
        <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
          {event.bannerUrl ? <Image source={event.bannerUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityElementsHidden /> : null}
        </View>
        <View style={styles.words}>
          <Text variant="body" numberOfLines={1} style={[font(700), { fontSize: rowMetrics.title, lineHeight: canvasNormalLineHeight(rowMetrics.title) }]}>
            {event.name}
          </Text>
          <Text variant="body" tone="textMuted" numberOfLines={1} style={{ fontSize: rowMetrics.line }}>
            {line}
          </Text>
        </View>
        <StatusPill label={pill.label} tone={pill.tone} icon={pill.icon} testID={`my-event-pill-${event.id}`} />
      </View>
      {note ? (
        <Text variant="body" tone="textSecondary" style={{ fontSize: rowMetrics.line }} testID={`my-event-note-${event.id}`}>
          <Text variant="body" style={[font(700), { fontSize: rowMetrics.line }]}>
            {"Reviewer's note: "}
          </Text>
          {note}
        </Text>
      ) : null}
    </Card>
  );
  if (!onOpen) return body;
  return (
    <Pressable
      testID={`my-event-open-${event.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${pill.label}, ${line}`}
      onPress={onOpen}
      {...ring.handlers}
      style={ring.style}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  body: { paddingHorizontal: layout.gutter, paddingTop: rowMetrics.top, gap: rowMetrics.gap },
  card: { padding: rowMetrics.pad, gap: space.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  thumb: { width: rowMetrics.thumb, height: rowMetrics.thumb, borderRadius: rowMetrics.thumbCorner, overflow: 'hidden' },
  words: { flex: 1, gap: space.xs },
  more: { alignItems: 'center', paddingTop: space.md },
});
