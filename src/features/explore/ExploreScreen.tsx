import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Toast } from '@/components/Toast';
import {
  ExploreEventsRail,
  ExploreFeaturedEvent,
  useExploreEvents,
} from '@/features/events/ExploreEvents';
import { fetchMyId, meKey } from '@/features/feed/api';
import { layout, space, useWawu } from '@/theme';

import { categoriesKey, featuredKey, fetchCategories, fetchFeaturedCreators } from './api';
import { categoryTiles, type CategoryChoice } from './categories';
import { CategoryTiles } from './CategoryTiles';
import { CreatorCard, creatorCardMetrics } from './CreatorCard';
import { DoorsCard, type Door } from './DoorsCard';
import { ExploreBar } from './ExploreBar';
import { ExploreSkeleton } from './ExploreSkeleton';
import { FOLLOW_NOTICE_MS, useFollow } from './follow';
import { LoadFailedBanner } from './LoadFailedBanner';
import {
  CreatorsRailEmpty,
  ExploreEventsEmpty,
  ExploreFeaturedEventEmpty,
  HeroDots,
  SectionHeading,
} from './parts';

/**
 * design/_gen/explore.js `body`: the body pads 8 above and 120 below (over a tab bar that here is its own box), 20
 * between sections; a section heading sits 12 above its rail (`col(..., 12)`). The bar above it is `ExploreBar`'s.
 * The task that draws the Create button (ME-04) also gives the body the room under its last row that the button covers.
 */
export const exploreMetrics = {
  bodyTop: space.sm,
  bodyBottom: 120 - layout.tabbarH,
  sectionGap: space.xl,
  headingGap: space.md,
} as const;

export type ExploreScreenProps = {
  /** A category tile was tapped: `all` for All and More, else the category's id (X2, X3). */
  onOpenCategory: (category: CategoryChoice) => void;
  /** The featured event or an event card was tapped (E2, EVENTS-01). */
  onOpenEvent: (id: string) => void;
  /** Upcoming events' See all (E1, EVENTS-01). */
  onSeeAllEvents: () => void;
  /** The "Find a professional" door (PROS-01): the directory, P1. */
  onFindProfessional: () => void;
  /** The "Find a school" door (SCHOOLS-03): the schools list, SC1. */
  onFindSchool: () => void;
  /** The "List your services" door (PROS-03): P5, or P8 for a person who has applied. */
  onListServices: () => void;
};

/**
 * X1 and X14: Explore, showing what is built (R-47). It reads the creator categories, the featured creators, the featured
 * event and the upcoming events. When the categories or the featured creators cannot be read, every section stays drawn as
 * it is when nothing is served (the bar, the neutral frames, the doors) under one banner with a Try again that reads
 * everything again.
 *
 * Every entry drawn here opens something: a category tile (X2, X3), the featured event and an event card (E2), Upcoming
 * events' See all (E1), "Find a professional" (PROS-01), "Find a school" (SCHOOLS-03) and "List your services" (PROS-03). A featured creator's card shows
 * the creator and its Follow follows, but the card itself opens nothing, because the profile it leads to is not built. What
 * X1 draws for screens that are not built is not drawn: the search pill and Featured creators' See all (EXPLORE-02), the
 * bell (ME-14) and Create (ME-04). The task that builds each one adds it, as drawn. A section
 * with nothing to show keeps its heading and draws neutral frames (`parts.tsx`).
 */
export function ExploreScreen({ onOpenCategory, onOpenEvent, onSeeAllEvents, onFindProfessional, onFindSchool, onListServices }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const focused = useIsFocused();
  const categories = useQuery({ queryKey: categoriesKey, queryFn: fetchCategories }, queryClient);
  const featured = useQuery({ queryKey: featuredKey, queryFn: fetchFeaturedCreators }, queryClient);
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId }, queryClient);
  const follow = useFollow();
  const events = useExploreEvents();
  const refetchEvents = events.refetch;
  const [pulled, setPulled] = useState(false);

  const refetchCategories = categories.refetch;
  const refetchFeatured = featured.refetch;
  // One list of reads for coming back to the tab, a pull and Try again.
  const refetchAll = useCallback(
    () => Promise.all([refetchCategories(), refetchFeatured(), refetchEvents()]),
    [refetchCategories, refetchFeatured, refetchEvents],
  );

  // Coming back to the tab reads again when what is held has gone stale (a read that failed holds nothing, so it is stale).
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

  // The doors whose screens are built, in X1's order: Find a professional, Find a school, List your services.
  const doors: Door[] = [
    { id: 'find-professional', icon: 'BriefcaseBusiness', title: 'Find a professional', sub: 'Accountants, lawyers, designers', onPress: onFindProfessional },
    { id: 'find-school', icon: 'GraduationCap', title: 'Find a school', sub: 'Courses from schools and academies', onPress: onFindSchool },
    { id: 'list-services', icon: 'Sparkles', title: 'List your services', sub: 'Get paid to answer questions', onPress: onListServices },
  ];

  let body;
  if (categories.isPending || featured.isPending || !events.settled) {
    body = <ExploreSkeleton />;
  } else {
    const creators = featured.data ?? [];
    const featuredEvent = events.featured;
    // A failed read draws every section as a read that served nothing does (neutral frames), under one banner.
    body = (
      <>
        {failed ? (
          <LoadFailedBanner
            title="Couldn’t load Explore"
            message={isApiError(failure) ? failure.message : 'Something went wrong. Try again.'}
            icon={isApiError(failure) && failure.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            retrying={categories.isFetching || featured.isFetching}
            onRetry={() => void refetchAll()}
          />
        ) : null}
        {featuredEvent ? (
          <View testID="explore-hero">
            <ExploreFeaturedEvent event={featuredEvent} onOpen={() => onOpenEvent(featuredEvent.id)} />
            <HeroDots color={colors.textOnAccent} />
          </View>
        ) : (
          <ExploreFeaturedEventEmpty />
        )}
        <CategoryTiles
          items={categoryTiles(categories.data ?? [])}
          onOpen={(tile) => onOpenCategory(tile.kind === 'category' ? (tile.id as CategoryChoice) : 'all')}
        />
        <View testID="explore-featured" style={styles.section}>
          <SectionHeading title="Featured creators" />
          {creators.length > 0 ? (
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
          ) : (
            <CreatorsRailEmpty />
          )}
        </View>
        {events.upcoming.length > 0 ? (
          <ExploreEventsRail events={events.upcoming} onOpen={onOpenEvent} onSeeAll={onSeeAllEvents} />
        ) : (
          <ExploreEventsEmpty onSeeAll={onSeeAllEvents} />
        )}
        <DoorsCard doors={doors} />
      </>
    );
  }

  return (
    <View testID="explore-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ExploreBar />
      <ScrollView
        testID="explore-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      >
        {body}
      </ScrollView>
      <Toast message={follow.notice} tone="alert" placement="bottom" lines={2} duration={FOLLOW_NOTICE_MS} onHide={follow.dismiss} testID="follow-notice" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: exploreMetrics.bodyTop,
    paddingBottom: exploreMetrics.bodyBottom,
    paddingHorizontal: layout.gutter,
    gap: exploreMetrics.sectionGap,
  },
  section: { gap: exploreMetrics.headingGap },
  bleed: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  rail: { gap: creatorCardMetrics.between, paddingHorizontal: layout.gutter },
});
