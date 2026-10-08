import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { Skeleton, LoadingView } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { fetchMyId, meKey } from '@/features/feed/api';
import { font, layout, radius, space, useWawu } from '@/theme';

import { categoriesKey, creatorsKey, fetchCategories, fetchCreatorsPage, type ExploreCreator } from './api';
import { categoryChips, chosenCategory, emptyCategoryCopy, type CategoryChoice } from './categories';
import { CreatorCard, creatorCardMetrics } from './CreatorCard';
import { FOLLOW_NOTICE_MS, useFollow } from './follow';
import { nextCreatorsPage } from './paging';

/**
 * design/_gen/kit.js line 34, `nav`: a 56 bar, 20 at the sides, a 42 round back button and a 17 bold title;
 * explore.js `categories`: the body pads 8 above, 14 between the chips and the grid, two columns 10 apart.
 */
export const categoriesMetrics = {
  navHeight: 56,
  navButton: 42,
  title: 17,
  titleTracking: -0.02,
  bodyTop: space.sm,
  chipsGap: 14,
  bottom: 40,
  skeletonCards: 4,
  /** The refusal line sits this far above the safe area (the bottom toast's own 24). */
  noticeBottom: 24,
} as const;

export type CategoriesScreenProps = {
  /** The category the screen opens on, as the route carried it. Anything unknown opens All. */
  initial?: string | string[];
  onBack: () => void;
  /** The chip changed, so the route can carry it (a link or a back step lands on the same category). */
  onChange?: (category: CategoryChoice) => void;
};

/** One column of the two: the screen less its gutters and the gap, halved. */
function useCellWidth(): number {
  const { width } = useWindowDimensions();
  return Math.floor((width - 2 * layout.gutter - creatorCardMetrics.between) / 2);
}

function GridSkeleton({ testID = 'categories-loading' }: { testID?: string }) {
  const cell = useCellWidth();
  return (
    <LoadingView testID={testID} label="Loading creators">
      <View style={styles.grid}>
        {Array.from({ length: categoriesMetrics.skeletonCards }, (_, i) => (
          <Skeleton key={i} width={cell} height={creatorCardMetrics.gridHeight} radius={radius.media} />
        ))}
      </View>
    </LoadingView>
  );
}

/** X2, X3 and X13: every creator category as a chip above the creators in it, each with Follow. */
export function CategoriesScreen({ initial, onBack, onChange }: CategoriesScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const categories = useQuery({ queryKey: categoriesKey, queryFn: fetchCategories }, queryClient);
  const list = categories.data ?? [];
  const [picked, setPicked] = useState<CategoryChoice | undefined>(undefined);
  const choice = picked ?? chosenCategory(initial, list);
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId }, queryClient);
  const follow = useFollow();
  const cell = useCellWidth();
  const [pulled, setPulled] = useState(false);

  const creators = useInfiniteQuery({
    queryKey: creatorsKey(choice),
    queryFn: ({ pageParam }) => fetchCreatorsPage(choice, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextCreatorsPage,
    enabled: categories.isSuccess,
  }, queryClient);
  const items: ExploreCreator[] = creators.data?.pages.flatMap((p) => p.items) ?? [];
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = creators;

  const pick = (next: CategoryChoice) => {
    setPicked(next);
    onChange?.(next);
  };

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await Promise.all([categories.refetch(), refetch()]);
    } finally {
      setPulled(false);
    }
  }, [categories, refetch]);

  const onEndReached = useCallback(() => {
    if (items.length > 0 && hasNextPage && !isFetchingNextPage && !creators.isFetchNextPageError) void fetchNextPage();
  }, [items.length, hasNextPage, isFetchingNextPage, creators.isFetchNextPageError, fetchNextPage]);

  const failure = categories.error ?? creators.error;
  let state = null;
  let centered = false;
  if (categories.isPending || (categories.isSuccess && creators.isPending)) {
    state = <GridSkeleton />;
  } else if ((categories.isError && !categories.data) || (creators.isError && !creators.data)) {
    centered = true;
    state = (
      <ErrorState
        testID="categories-error"
        title="Couldn’t load creators"
        message={isApiError(failure) ? failure.message : 'Something went wrong. Try again.'}
        icon={isApiError(failure) && failure.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void (categories.isError ? categories.refetch() : refetch())}
      />
    );
  } else if (items.length === 0) {
    centered = true;
    const copy = emptyCategoryCopy(choice, list);
    state = <EmptyState testID="categories-empty" icon="Compass" title={copy.title} message={copy.message} />;
  }

  return (
    <View testID="categories-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="categories-back" />
        </View>
        <View style={styles.titles}>
          <Text variant="body" numberOfLines={1} accessibilityRole="header" style={styles.title}>
            Categories
          </Text>
        </View>
        <View style={styles.side} />
      </View>
      <View style={styles.chips}>
        {list.length > 0 ? (
          <FilterChips items={categoryChips(list)} value={choice} onChange={pick} label="Choose a category" revealSelected testID="categories-chips" />
        ) : null}
      </View>
      <FlatList
        testID="categories-list"
        data={state ? [] : items}
        key="grid"
        numColumns={2}
        keyExtractor={(item) => item.wawuId}
        renderItem={({ item }) => (
          <CreatorCard
            testID={`categories-creator-${item.wawuId}`}
            creator={item}
            width={cell}
            height={creatorCardMetrics.gridHeight}
            onToggleFollow={item.wawuId === me.data ? undefined : () => follow.toggle(item)}
          />
        )}
        columnWrapperStyle={styles.columns}
        ListEmptyComponent={state}
        ListFooterComponent={
          creators.isFetchNextPageError ? (
            <View style={styles.footer}>
              <Text variant="secondary">Couldn’t load more creators.</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => void fetchNextPage()} />
            </View>
          ) : isFetchingNextPage ? (
            <GridSkeleton testID="categories-loading-more" />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + categoriesMetrics.bottom }, centered && styles.centered]}
      />
      <Toast
        message={follow.notice}
        tone="alert"
        placement="bottom"
        offset={insets.bottom + categoriesMetrics.noticeBottom}
        lines={2}
        duration={FOLLOW_NOTICE_MS}
        onHide={follow.dismiss}
        testID="follow-notice"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: categoriesMetrics.navHeight, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: categoriesMetrics.navButton },
  titles: { flex: 1, minWidth: 0, alignItems: 'center' },
  title: { ...font(700), fontSize: categoriesMetrics.title, letterSpacing: categoriesMetrics.titleTracking * categoriesMetrics.title, textAlign: 'center' },
  chips: { paddingTop: categoriesMetrics.bodyTop },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingTop: categoriesMetrics.chipsGap, paddingHorizontal: layout.gutter, gap: creatorCardMetrics.between },
  centered: { justifyContent: 'center' },
  columns: { gap: creatorCardMetrics.between },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: creatorCardMetrics.between },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
});
