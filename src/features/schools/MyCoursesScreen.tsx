import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button, pressScale } from '@/components/Button';
import { FilterChips, type ChipItem } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { LoadingView, Skeleton, SkeletonRows } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { NavBar } from '@/features/events/chrome';
import { RefreshFailed } from '@/features/professionals/parts';
import { canvasNormalLineHeight, font, layout, space, useWawu } from '@/theme';

import { enrolKeys, fetchEnrolmentsPage, type EnrolmentRow, type EnrolTab } from './enrolApi';
import { rowLine, rowState } from './enrolModel';
import { Cover } from './parts';
import { useToday } from './useToday';

/**
 * design/_gen/schools.js `mine` (SC8): the body pads 20 at the sides with 12 between the chips and each card; a card pads 12 at
 * corner 20 with a 60 square picture at corner 14, 12 from the words; the title is 15 at 600, the line under it 12.5 muted 3 below,
 * and the pill 7 under that.
 */
export const mineMetrics = { between: 12, cardPad: 12, cardCorner: 20, picture: 60, pictureCorner: 14, titleGap: 12, title: 15, line: 12.5, lineTop: 3, pillTop: 7, bottom: 24, skeletonRows: 3 } as const;

const tabs: readonly ChipItem<EnrolTab>[] = [
  { value: 'current', label: 'Current' },
  { value: 'finished', label: 'Finished' },
];

export type MyCoursesScreenProps = {
  onBack: () => void;
  /** A row: the enrolment (SC7's receipt, or SC5 for a place not paid yet). */
  onOpen: (enrolmentId: string) => void;
  /** The empty list's way forward: the schools (SC1). */
  onFindSchools: () => void;
};

/**
 * SC8 · My courses: the student's enrolments in two tabs, Current and Finished, newest first, a page at a time. Each row has the
 * school and the start, and one pill that says where it stands. "week 3 of 6" is left out until something writes progress
 * (BACKEND_GAPS). Every row is read from the Hub's list (`GET /schools/enrolments`), never from LearnCourse.
 */
export function MyCoursesScreen({ onBack, onOpen, onFindSchools }: MyCoursesScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const [tab, setTab] = useState<EnrolTab>('current');
  const [pulled, setPulled] = useState(false);

  const list = useInfiniteQuery(
    {
      queryKey: enrolKeys.mine(tab),
      queryFn: ({ pageParam }) => fetchEnrolmentsPage(tab, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      // A row's state changes when a payment settles or a class begins: the list is read again each time the screen opens.
      staleTime: 0,
    },
    queryClient,
  );
  const rows = (() => {
    const seen = new Set<string>();
    const out: EnrolmentRow[] = [];
    for (const page of list.data?.pages ?? []) {
      for (const row of page.items) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          out.push(row);
        }
      }
    }
    return out;
  })();
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = list;

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  }, [refetch]);

  const asking = useRef(false);
  const onEndReached = useCallback(() => {
    if (asking.current || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    asking.current = true;
    void fetchNextPage().finally(() => {
      asking.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const refreshFailed = list.isRefetchError && !isFetchNextPageError && rows.length > 0;
  let state = null;
  if (list.isPending) {
    state = <MineSkeleton />;
  } else if (list.isError && !list.data) {
    const offline = isApiError(list.error) && list.error.kind === 'network';
    state = (
      <ErrorState
        testID="mine-error"
        title="Couldn’t load your courses"
        message={offline ? 'No connection. Check your internet and try again.' : isApiError(list.error) ? list.error.message : 'Something went wrong. Try again.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void refetch()}
      />
    );
  } else if (rows.length === 0) {
    state =
      tab === 'current' ? (
        <EmptyState
          testID="mine-empty"
          icon="GraduationCap"
          title="No courses yet"
          message="Courses you enrol in show up here."
          action={{ label: 'Find a school', onPress: onFindSchools }}
        />
      ) : (
        <EmptyState testID="mine-empty" icon="GraduationCap" title="No finished courses" message="Courses you finish show up here." />
      );
  }

  return (
    <View testID="mine-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="My courses" onBack={onBack} backTestID="mine-back" />
      <FlatList
        testID="mine-list"
        data={state ? [] : rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CourseRow row={item} today={today} onPress={() => onOpen(item.id)} />}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={
          <View style={styles.head}>
            <FilterChips items={tabs} value={tab} onChange={setTab} label="Show courses" testID="mine-tabs" />
            {refreshFailed ? <RefreshFailed onRetry={() => void refetch()} testID="mine-refresh-failed" /> : null}
          </View>
        }
        ListEmptyComponent={state}
        ListFooterComponent={
          isFetchNextPageError ? (
            <View style={styles.footer} testID="mine-more-error">
              <Text variant="secondary" accessibilityRole="alert">
                Couldn’t load more courses.
              </Text>
              <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={() => void fetchNextPage()} testID="mine-more-retry" />
            </View>
          ) : isFetchingNextPage ? (
            <SkeletonRows count={2} testID="mine-loading-more" />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + mineMetrics.bottom }]}
      />
    </View>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

function CourseRow({ row, today, onPress }: { row: EnrolmentRow; today: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const state = rowState(row, today);
  return (
    <Pressable
      testID={`mine-row-${row.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${row.course.title}, ${rowLine(row, today)}, ${state.label}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.card,
        ring.style,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
          transform: [{ scale: pressed ? pressScale : 1 }],
        },
      ]}
    >
      <Cover height={mineMetrics.picture} style={styles.picture} />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={2} style={styles.title}>
          {row.course.title}
        </Text>
        <Text variant="secondary" tone="textMuted" numberOfLines={2} style={styles.line}>
          {rowLine(row, today)}
        </Text>
        <View style={styles.pill}>
          <StatusPill testID={`mine-pill-${row.id}`} label={state.label} tone={state.tone} icon={state.icon} />
        </View>
      </View>
    </Pressable>
  );
}

function MineSkeleton() {
  return (
    <LoadingView label="Loading your courses" testID="mine-loading">
      <View style={styles.skeleton}>
        {Array.from({ length: mineMetrics.skeletonRows }, (_, i) => (
          <Skeleton key={i} height={mineMetrics.picture + mineMetrics.cardPad * 2} radius={mineMetrics.cardCorner} />
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { gap: space.sm, marginBottom: mineMetrics.between, marginHorizontal: -layout.gutter },
  content: { paddingHorizontal: layout.gutter, flexGrow: 1 },
  gap: { height: mineMetrics.between },
  card: { flexDirection: 'row', alignItems: 'center', gap: mineMetrics.titleGap, padding: mineMetrics.cardPad, borderRadius: mineMetrics.cardCorner },
  picture: { width: mineMetrics.picture, borderRadius: mineMetrics.pictureCorner, flexShrink: 0 },
  words: { flex: 1, minWidth: 0 },
  title: { ...font(600), fontSize: mineMetrics.title, lineHeight: canvasNormalLineHeight(mineMetrics.title) },
  line: { marginTop: mineMetrics.lineTop, fontSize: mineMetrics.line, lineHeight: canvasNormalLineHeight(mineMetrics.line) },
  pill: { marginTop: mineMetrics.pillTop, flexDirection: 'row' },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  skeleton: { gap: mineMetrics.between },
});

