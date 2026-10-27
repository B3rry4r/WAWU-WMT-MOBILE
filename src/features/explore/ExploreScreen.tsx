import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/StateViews';
import { Toast } from '@/components/Toast';
import { CreateEntry } from '@/features/create/CreateEntry';
import { useAdList } from '@/features/ads/useAd';
import { ExploreEventsRail, useExploreEvents } from '@/features/events/ExploreEvents';
import { fetchMyId, meKey } from '@/features/feed/api';
import { FlixRail } from '@/features/movies/FlixRail';
import { NO_CREATORS_LINE, NO_CREATORS_TITLE } from '@/features/home/CreatorRail';
import { TgifCard, TgifProblem } from '@/features/home/TgifCard';
import { todayMetrics } from '@/features/home/look';
import { countsKey, fetchCounts } from '@/features/me/counts';
import { dayKey, fetchDay, fetchStats, statsKey } from '@/features/tgif/api/tgif';
import { SERVICES_DOOR_NOTICE_MS, type ServicesDoor } from '@/features/pro-listing/useListServicesDoor';
import { localDay } from '@/features/tgif/model';
import { layout, radius, space, useWawu } from '@/theme';

import { categoriesKey, featuredKey, fetchCategories, fetchFeaturedCreators } from './api';
import { categoryTiles, type CategoryChoice } from './categories';
import { CategoryTiles } from './CategoryTiles';
import { CreatorCard, creatorCardMetrics } from './CreatorCard';
import { DoorsCard, type Door } from './DoorsCard';
import { ExploreBar } from './ExploreBar';
import { ExploreSkeleton } from './ExploreSkeleton';
import { ExploreSlider } from './ExploreSlider';
import { FOLLOW_NOTICE_MS, useFollow } from './follow';
import { LoadFailedBanner } from './LoadFailedBanner';
import { SectionHeading, SeeAllCreators } from './parts';
import { sliderSlides } from './slider';

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
  /** What the door shows while its reads run and when one fails (SERVICES-FEEDBACK 1): the row works at once, and a failed read is said in a line at the bottom. */
  servicesDoor?: ServicesDoor;
  /** The Create button, for creator accounts only (X1, X14): opens M19 (ME-04). */
  onCreate?: () => void;
  /** The TGIF card was tapped (X1): opens today's reader (H29, `/tgif`). */
  onOpenTgif: () => void;
  /** The search pill in the bar opens Search (X5, EXPLORE-02). Not drawn without it. */
  onSearch?: () => void;
  /** Featured creators' See all opens All creators (X4, EXPLORE-02). Not drawn without it. */
  onSeeAllCreators?: () => void;
  /** The bell in the bar opens Notifications (M31, ME-14). Not drawn without it. */
  onOpenNotifications?: () => void;
  /** A featured creator's card opens their profile (M5, ME-02). The card is not pressed without it. */
  onOpenCreator?: (wawuId: string) => void;
  /** The Flix movies rail's See all opens Flix movies (MV1, FLIX-03). The rail is not drawn without this and `onOpenMovie`. */
  onSeeAllMovies?: () => void;
  /** A poster on the Flix movies rail opens that movie (MV2, FLIX-03). */
  onOpenMovie?: (id: string) => void;
};

/**
 * X1, X16, X17 and X14: Explore, showing what is built (R-47). It reads the creator categories, the featured creators, the
 * featured and upcoming events, the slider's adverts and today's TGIF. The slider at the top takes turns between an advert and
 * a featured event, an advert first (R-59); with no event it is adverts only (X17) and with neither it is not drawn. Under it
 * is the TGIF card (X1), which opens the reader. When the categories or the featured creators cannot be read, every section
 * stays drawn as it is when nothing is served (the bar, the doors) under one banner with a Try again that
 * reads everything again.
 *
 * Every entry drawn here opens something: a slide (E2), a category tile (X2, X3), an event card (E2), Upcoming events' See
 * all (E1), the TGIF card (H29), "Find a professional" (PROS-01), "Find a school" (SCHOOLS-03) and "List your services"
 * (PROS-03). A featured creator's card shows the creator and its Follow follows, but the card itself opens nothing, because
 * the profile it leads to is not built. What X1 draws for screens that are not built is not drawn: the search pill and
 * Featured creators' See all (EXPLORE-02), the bell (ME-14). The task that builds each one adds it, as drawn. The board draws no
 * empty state for Featured creators or Upcoming events, so a row the Hub has nothing for is left out, heading and all (FIX-68 F-6,
 * R-47, owner 9 Oct); it comes back the moment the Hub serves one. X17's Sponsored block, which the board draws in
 * Upcoming events' place, is not drawn: the Hub serves an advert only while its event is upcoming, so that rail always holds it.
 */
export function ExploreScreen({ onOpenCategory, onOpenEvent, onSeeAllEvents, onFindProfessional, onFindSchool, onListServices, servicesDoor, onCreate, onOpenTgif, onSearch, onSeeAllCreators, onOpenNotifications, onOpenCreator, onSeeAllMovies, onOpenMovie }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const focused = useIsFocused();
  const categories = useQuery({ queryKey: categoriesKey, queryFn: fetchCategories }, queryClient);
  const featured = useQuery({ queryKey: featuredKey, queryFn: fetchFeaturedCreators }, queryClient);
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId }, queryClient);
  const follow = useFollow();
  const events = useExploreEvents();
  const refetchEvents = events.refetch;
  // The slider's adverts (R-59, ADS-07). A read that fails is no adverts: a sponsored card is never an error on the screen.
  const ads = useAdList('explore_slider', true, queryClient);
  const refetchAds = ads.refetch;
  // Today's TGIF (X1): the day, then its readers once the day is read. Not retried, so a failure settles at once and says so.
  const date = localDay();
  const tgifDay = useQuery({ queryKey: dayKey(date), queryFn: () => fetchDay(date), staleTime: Infinity, retry: false }, queryClient);
  const tgifStats = useQuery({ queryKey: statsKey(date), queryFn: () => fetchStats(date), enabled: tgifDay.isSuccess }, queryClient);
  const refetchTgifDay = tgifDay.refetch;
  const refetchTgifStats = tgifStats.refetch;
  const tgifRead = tgifDay.isSuccess;
  const [pulled, setPulled] = useState(false);

  // The bell's dot: how many notifications are unread (`GET /me/counts`). A failed read draws the bell without a dot, never an error.
  const counts = useQuery({ queryKey: countsKey, queryFn: fetchCounts, enabled: Boolean(onOpenNotifications) }, queryClient);
  const refetchCounts = counts.refetch;
  const refetchCategories = categories.refetch;
  const refetchFeatured = featured.refetch;
  // One list of reads for coming back to the tab, a pull and Try again.
  const refetchAll = useCallback(
    () => Promise.all([refetchCategories(), refetchFeatured(), refetchEvents(), refetchAds(), tgifRead ? refetchTgifStats() : refetchTgifDay(), onOpenNotifications ? refetchCounts() : undefined]),
    [refetchCategories, refetchFeatured, refetchEvents, refetchAds, tgifRead, refetchTgifStats, refetchTgifDay, onOpenNotifications, refetchCounts],
  );

  // Coming back to the tab reads again when what is held has gone stale (a read that failed holds nothing, so it is stale).
  const stale = categories.isStale || featured.isStale || ads.isStale || (Boolean(onOpenNotifications) && counts.isStale);
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
    { id: 'list-services', icon: 'Sparkles', title: 'List your services', sub: 'Get paid to answer questions', onPress: onListServices, busy: servicesDoor?.busy },
  ];

  const slides = sliderSlides(ads.data ?? [], events.featured);

  let body;
  if (categories.isPending || featured.isPending || !events.settled || ads.isPending) {
    body = <ExploreSkeleton />;
  } else {
    const creators = featured.data ?? [];
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
        {slides.length > 0 ? <ExploreSlider slides={slides} showing={focused} onOpenEvent={onOpenEvent} /> : null}
        <View testID="explore-tgif">
          {tgifDay.data ? (
            <TgifCard day={tgifDay.data} readers={typeof tgifStats.data?.readers === 'number' ? tgifStats.data.readers : null} onOpen={onOpenTgif} />
          ) : tgifDay.isError ? (
            <TgifProblem date={date} onRetry={() => void refetchTgifDay()} retrying={tgifDay.isFetching} />
          ) : (
            <Skeleton testID="explore-tgif-loading" height={todayMetrics.tgifHeight} radius={radius.card} />
          )}
        </View>
        <CategoryTiles
          items={categoryTiles(categories.data ?? [])}
          onOpen={(tile) => onOpenCategory(tile.kind === 'category' ? (tile.id as CategoryChoice) : 'all')}
        />
        {creators.length > 0 ? (
          <View testID="explore-featured" style={styles.section}>
            <SectionHeading
              title="Who Made This?"
              action={onSeeAllCreators ? <SeeAllCreators onPress={onSeeAllCreators} testID="explore-featured-see-all" /> : undefined}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.rail}>
              {creators.map((creator) => (
                <CreatorCard
                  key={creator.wawuId}
                  testID={`explore-featured-${creator.wawuId}`}
                  creator={creator}
                  onPress={onOpenCreator ? () => onOpenCreator(creator.wawuId) : undefined}
                  onToggleFollow={creator.wawuId === me.data ? undefined : () => follow.toggle(creator)}
                />
              ))}
            </ScrollView>
          </View>
        ) : featured.data !== undefined ? (
          // The creators read worked and served nobody: the section stays drawn with its designed empty state, as Home's does (R-47, FIX-100 #6).
          <View testID="explore-featured" style={styles.section}>
            <SectionHeading
              title="Who Made This?"
              action={onSeeAllCreators ? <SeeAllCreators onPress={onSeeAllCreators} testID="explore-featured-see-all" /> : undefined}
            />
            <EmptyState testID="explore-featured-empty" icon="Users" title={NO_CREATORS_TITLE} message={NO_CREATORS_LINE} />
          </View>
        ) : null}
        {onSeeAllMovies && onOpenMovie ? <FlixRail client={queryClient} testID="explore-flix" onSeeAll={onSeeAllMovies} onOpenMovie={onOpenMovie} /> : null}
        {events.upcoming.length > 0 ? <ExploreEventsRail events={events.upcoming} onOpen={onOpenEvent} onSeeAll={onSeeAllEvents} /> : null}
        <DoorsCard doors={doors} />
      </>
    );
  }

  return (
    <View testID="explore-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ExploreBar onSearch={onSearch} onOpenNotifications={onOpenNotifications} unread={counts.data?.unreadNotifications ?? 0} />
      <ScrollView
        testID="explore-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.content}
        // No scrollbar on the web build: its 15 px came out of the ad slide's width (335 against the Today card's 350, FIX-P5, L3). Today hides it too.
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      >
        {body}
      </ScrollView>
      {onCreate ? <CreateEntry onPress={onCreate} /> : null}
      <Toast message={follow.notice} tone="alert" placement="bottom" lines={2} duration={FOLLOW_NOTICE_MS} onHide={follow.dismiss} testID="follow-notice" />
      <Toast message={servicesDoor?.notice ?? null} tone="alert" placement="bottom" lines={2} duration={SERVICES_DOOR_NOTICE_MS} onHide={servicesDoor?.dismiss} testID="services-door-notice" />
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
