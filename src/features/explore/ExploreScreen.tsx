import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { BrandMark } from '@/components/BrandMark';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMyId, meKey } from '@/features/feed/api';
import { layout, space, useWawu } from '@/theme';

import { categoriesKey, featuredKey, fetchCategories, fetchFeaturedCreators } from './api';
import { categoryTiles, type CategoryChoice } from './categories';
import { CategoryTiles } from './CategoryTiles';
import { CreatorCard, creatorCardMetrics } from './CreatorCard';
import { ExploreSkeleton } from './ExploreSkeleton';
import { useFollow } from './follow';

/**
 * design/_gen/explore.js `topBar` and `body`: the bar pads 6 above, 20 at the sides and 14 below, the mark 34 wide;
 * the body pads 8 above and 120 below (over a tab bar that here is its own box), 20 between sections; a section
 * heading sits 12 above its rail (`col(..., 12)`).
 */
export const exploreMetrics = {
  barTop: 6,
  barBottom: 14,
  mark: 34,
  /** The bar's row is as high as the 44 search pill and bell it carries on the canvas, so the body starts where X1 draws it. */
  barRow: layout.tapMin,
  bodyTop: space.sm,
  bodyBottom: 120 - layout.tabbarH,
  sectionGap: space.xl,
  headingGap: space.md,
} as const;

export type ExploreScreenProps = {
  /** A category tile was tapped: `all` for All and More, else the category's id (X2, X3). */
  onOpenCategory: (category: CategoryChoice) => void;
};

/**
 * X1 and X14: Explore's browse, with a real error state (a request failed, with a retry). It reads the creator
 * categories and the featured creators. Entries whose screens are not built yet are not drawn (R-27, R-41): the
 * search bar and bell (EXPLORE-02, ME-14), the featured event, Upcoming events and its See all (EVENTS-01), Featured
 * creators' See all (EXPLORE-02), opening a creator (ME-02), the doors (PROS-01, SCHOOLS-03, PROS-03) and Create (ME-04).
 */
export function ExploreScreen({ onOpenCategory }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const focused = useIsFocused();
  const categories = useQuery({ queryKey: categoriesKey, queryFn: fetchCategories });
  const featured = useQuery({ queryKey: featuredKey, queryFn: fetchFeaturedCreators });
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId });
  const follow = useFollow();
  const [pulled, setPulled] = useState(false);

  const refetchCategories = categories.refetch;
  const refetchFeatured = featured.refetch;
  const refetchAll = useCallback(
    () => Promise.all([refetchCategories(), refetchFeatured()]),
    [refetchCategories, refetchFeatured],
  );

  // Coming back to the tab reads again when what is held has gone stale.
  const stale = categories.isStale || featured.isStale;
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current && stale) void refetchAll();
    wasFocused.current = focused;
  }, [focused, stale, refetchAll]);

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refetchAll();
    } finally {
      setPulled(false);
    }
  }, [refetchAll]);

  const failed = (categories.isError && !categories.data) || (featured.isError && !featured.data);
  const failure = categories.error ?? featured.error;

  let body;
  if (categories.isPending || featured.isPending) {
    body = <ExploreSkeleton />;
  } else if (failed) {
    body = (
      <View style={styles.centered}>
        <ErrorState
          testID="explore-error"
          title="Couldn’t load Explore"
          message={isApiError(failure) ? failure.message : 'Something went wrong. Try again.'}
          icon={isApiError(failure) && failure.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void refetchAll()}
        />
      </View>
    );
  } else {
    const creators = featured.data ?? [];
    body = (
      <>
        <CategoryTiles
          items={categoryTiles(categories.data ?? [])}
          onOpen={(tile) => onOpenCategory(tile.kind === 'category' ? (tile.id as CategoryChoice) : 'all')}
        />
        {creators.length > 0 ? (
          <View testID="explore-featured" style={styles.section}>
            <Text variant="h2">Featured creators</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.rail}>
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.wawuId}
                  testID={`explore-featured-${creator.wawuId}`}
                  creator={creator}
                  onToggleFollow={creator.wawuId === me.data ? undefined : () => follow.toggle(creator)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </>
    );
  }

  return (
    <View testID="explore-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <BrandMark width={exploreMetrics.mark} testID="explore-mark" />
      </View>
      <ScrollView
        testID="explore-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      >
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    paddingTop: exploreMetrics.barTop,
    paddingBottom: exploreMetrics.barBottom,
    paddingHorizontal: layout.gutter,
    minHeight: exploreMetrics.barTop + exploreMetrics.barRow + exploreMetrics.barBottom,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: exploreMetrics.bodyTop,
    paddingBottom: exploreMetrics.bodyBottom,
    paddingHorizontal: layout.gutter,
    gap: exploreMetrics.sectionGap,
  },
  centered: { flex: 1, justifyContent: 'center' },
  section: { gap: exploreMetrics.headingGap },
  bleed: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  rail: { gap: creatorCardMetrics.between, paddingHorizontal: layout.gutter },
});
