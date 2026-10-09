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
import { fetchIsCreator, proKeys } from '@/features/pro-listing/api';
import { unbuilt } from '@/lib/unbuilt';
import { layout, space, useWawu } from '@/theme';

import { categoriesKey, featuredKey, fetchCategories, fetchFeaturedCreators, fetchUnreadNotifications, unreadKey } from './api';
import { categoryTiles, type CategoryChoice } from './categories';
import { CategoryTiles } from './CategoryTiles';
import { CreateButton, createButtonMetrics } from './CreateButton';
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
  SeeAllCreators,
} from './parts';

/**
 * design/_gen/explore.js `body`: the body pads 8 above and 120 below (over a tab bar that here is its own box), 20
 * between sections; a section heading sits 12 above its rail (`col(..., 12)`). The bar above it is `ExploreBar`'s.
 *
 * `bodyBottomCreate` is the bottom padding while the Create button is drawn (creator accounts). The canvas's 120 leaves
 * 30 under the last row here, but the button stands 16 above the tab bar and is 58 high, so it covers the bottom 74 and
 * the last row's chevron sat under it at the end of the scroll. The padding is the button's own offset, its height and
 * the same 16 again (`space.lg`) between the button and the row: 16 + 58 + 16 = 90. Everyone else keeps the canvas's 30.
 */
export const exploreMetrics = {
  bodyTop: space.sm,
  bodyBottom: 120 - layout.tabbarH,
  bodyBottomCreate: createButtonMetrics.bottom + createButtonMetrics.size + space.lg,
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
  /** The "List your services" door (PROS-03): P5, or P8 for a person who has applied. */
  onListServices: () => void;
};

/**
 * X1 and X14: Explore, drawn whole (R-46). It reads the creator categories, the featured creators, the featured event
 * and the upcoming events, and, for the bar and the Create button, the unread notifications and the account type.
 * When the categories or the featured creators cannot be read, every section stays drawn as it is when nothing is served
 * (the bar, the neutral frames, the doors, Create) under one banner with a Try again that reads everything again.
 *
 * Every entry X1 draws is here. Built destinations are wired: a category tile (X2, X3), the featured event and an event
 * card (E2), Upcoming events' See all (E1) and "List your services" (PROS-03). The rest are `unbuilt(...)`: the search
 * pill and Featured creators' See all (EXPLORE-02), the bell (ME-14), a creator card (ME-02), Find a professional
 * (PROS-01), Find a school (SCHOOLS-03) and Create (ME-04); the task that builds each one wires it. A section with
 * nothing to show keeps its heading and draws neutral frames (`parts.tsx`).
 */
export function ExploreScreen({ onOpenCategory, onOpenEvent, onSeeAllEvents, onListServices }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const focused = useIsFocused();
  const categories = useQuery({ queryKey: categoriesKey, queryFn: fetchCategories }, queryClient);
  const featured = useQuery({ queryKey: featuredKey, queryFn: fetchFeaturedCreators }, queryClient);
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId }, queryClient);
  // The bell's dot and the Create button read on their own: neither holds the screen up, and neither fails it (no dot, no button).
  const unread = useQuery({ queryKey: unreadKey, queryFn: fetchUnreadNotifications, retry: false }, queryClient);
  const creator = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator, retry: false }, queryClient);
  const follow = useFollow();
  const events = useExploreEvents();
  const refetchEvents = events.refetch;
  const [pulled, setPulled] = useState(false);

  const refetchCategories = categories.refetch;
  const refetchFeatured = featured.refetch;
  const refetchUnread = unread.refetch;
  const refetchCreator = creator.refetch;
  // One list of reads for coming back to the tab, a pull and Try again. The account type is in it so that Create comes back
  // for a creator after a read that failed once (it is not retried on its own, so a failure settles at once).
  const refetchAll = useCallback(
    () => Promise.all([refetchCategories(), refetchFeatured(), refetchEvents(), refetchUnread(), refetchCreator()]),
    [refetchCategories, refetchFeatured, refetchEvents, refetchUnread, refetchCreator],
  );

  // Coming back to the tab reads again when what is held has gone stale (a read that failed holds nothing, so it is stale).
  const stale = categories.isStale || featured.isStale || unread.isStale || creator.isStale;
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

  // The doors, in X1's order: Find a professional, Find a school, List your services.
  const doors: Door[] = [
    { id: 'find-professional', icon: 'BriefcaseBusiness', title: 'Find a professional', sub: 'Accountants, lawyers, designers', onPress: unbuilt('PROS-01') },
    { id: 'find-school', icon: 'GraduationCap', title: 'Find a school', sub: 'Courses from schools and academies', onPress: unbuilt('SCHOOLS-03') },
    { id: 'list-services', icon: 'Sparkles', title: 'List your services', sub: 'Get paid to answer questions', onPress: onListServices },
  ];

  let body;
  if (categories.isPending || featured.isPending || !events.settled) {
    body = <ExploreSkeleton />;
  } else {
    const creators = featured.data ?? [];
    const featuredEvent = events.featured;
    // A failed read draws every section as a read that served nothing does (neutral frames), under one banner (R-46).
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
          <SectionHeading title="Featured creators" action={<SeeAllCreators />} />
          {creators.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.rail}>
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.wawuId}
                  testID={`explore-featured-${creator.wawuId}`}
                  creator={creator}
                  onPress={unbuilt('ME-02')}
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

  const showCreate = creator.data === true;

  return (
    <View testID="explore-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ExploreBar unread={unread.data ?? 0} />
      <ScrollView
        testID="explore-scroll"
        style={styles.scroll}
        contentContainerStyle={[styles.content, showCreate ? styles.contentCreate : null]}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      >
        {body}
      </ScrollView>
      {showCreate ? <CreateButton /> : null}
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
  /** While Create is drawn the last row ends above it (`exploreMetrics.bodyBottomCreate`). */
  contentCreate: { paddingBottom: exploreMetrics.bodyBottomCreate },
  section: { gap: exploreMetrics.headingGap },
  bleed: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  rail: { gap: creatorCardMetrics.between, paddingHorizontal: layout.gutter },
});
