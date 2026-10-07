import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button, IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import {
  activeFilterCount,
  defaultFilters,
  fetchEventsPage,
  fetchFeatured,
  fetchFromPrices,
  fetchOptions,
  featuredKey,
  filtersAreDefault,
  fromPricesKey,
  listKey,
  optionsKey,
  type EventFilters,
  type EventView,
} from './api';
import { FilterSheet } from './FilterSheet';
import { startsThisWeek } from './format';
import { useGoing } from './going';
import { EventRow, FeaturedCard, rowMetrics } from './parts';

/** design/_gen/kit.js `nav`: a 56 bar, 20 sides, a 42 round button each end, a 17 bold title between. */
const navMetrics = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
/** design/_gen/events.js `evTabs`: 22 between tabs, 15 semi-bold, an underline 2 thick, 11 above it. */
const tabMetrics = { between: 22, font: 15, underline: 2, padBottom: 11 } as const;
/** design/_gen/events.js `discover`: 14 above the body, 18 between the hero, the list and the banner; the list's heading line is `SH`. */
const bodyMetrics = { top: 14, stack: 18, bottom: 40, seeAll: 14, listGap: 4 } as const;
const SKELETON_ROWS = 3;

/**
 * The tabs under the title. Discover is the screen's own. My events (EVENTS-08)
 * and Host event (EVENTS-04) are added by the task that builds where each
 * leads, as drawn (docs/WORKFLOW.md section 7), so this list grows then.
 */
const tabs = [{ value: 'discover', label: 'Discover' }] as const;

export type EventsScreenProps = {
  onBack: () => void;
  onOpenEvent: (id: string) => void;
};

/** E1 · Events: the featured event, this week's list with a Going toggle on each row, and the filter sheet (E8). */
export function EventsScreen({ onBack, onOpenEvent }: EventsScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const going = useGoing();
  const [now] = useState(() => Date.now());

  const featured = useQuery({ queryKey: featuredKey(filters), queryFn: () => fetchFeatured(filters) });
  const list = useInfiniteQuery({
    queryKey: listKey(filters),
    queryFn: ({ pageParam }) => fetchEventsPage(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
  const options = useQuery({ queryKey: optionsKey, queryFn: fetchOptions });

  const hero = featured.data ?? null;
  const events = useMemo(
    () => (list.data?.pages ?? []).flatMap((page) => page.events).filter((e) => e.id !== hero?.id),
    [list.data, hero?.id],
  );
  // What a person can pay now (G-271), asked once the list and the featured card are known; an event with no
  // tiers has no price to ask for. The Hub's own `priceFromNaira` counts sold-out and ended tiers, so it is not drawn.
  const priced = useMemo(
    () => [...(hero ? [hero] : []), ...events].filter((e) => e.ticketed).map((e) => e.id),
    [hero, events],
  );
  const prices = useQuery({
    queryKey: fromPricesKey(priced),
    queryFn: () => fetchFromPrices(priced),
    enabled: !list.isPending && !featured.isPending && priced.length > 0,
    placeholderData: keepPreviousData,
    // Prices are a nicety: a failure leaves the rows without a price line and is never retried.
    retry: false,
  });
  const weekMode = filtersAreDefault(filters) && !showAll && events.some((e) => startsThisWeek(e, now));
  const shown = weekMode ? events.filter((e) => startsThisWeek(e, now)) : events;
  const heading = weekMode ? 'This week' : filters.view === 'past' ? 'Past events' : 'Upcoming';
  const moreToSee = weekMode && (shown.length < events.length || list.hasNextPage);

  const apply = (next: EventFilters) => {
    setFilters(next);
    setShowAll(false);
    setSheetOpen(false);
  };

  const refetchAll = () => {
    void featured.refetch();
    void list.refetch();
  };

  const filterCount = activeFilterCount(filters);

  return (
    <View testID="events-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="events-back" />
        <Text variant="body" accessibilityRole="header" numberOfLines={1} style={[styles.title, font(700)]}>
          Events
        </Text>
        <IconButton
          icon="SlidersHorizontal"
          label={filterCount > 0 ? `Filters, ${filterCount} on` : 'Filters'}
          onPress={() => setSheetOpen(true)}
          testID="events-filter"
        />
      </View>
      <TabStrip />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: bodyMetrics.bottom + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {list.isPending ? (
          <EventsSkeleton />
        ) : list.isError ? (
          <ErrorState
            testID="events-error"
            title="Couldn't load events"
            message={isApiError(list.error) ? list.error.message : 'Check your connection and try again.'}
            onRetry={refetchAll}
          />
        ) : (
          <>
            {going.failure ? (
              <Text variant="errorLine" accessibilityRole="alert" testID="events-going-error">
                {going.failure}
              </Text>
            ) : null}
            {hero ? <FeaturedCard event={hero} fromNaira={prices.data?.[hero.id]} onOpen={() => onOpenEvent(hero.id)} /> : null}
            {shown.length === 0 ? (
              hero ? null : (
                <EmptyState
                  testID="events-empty"
                  icon="CalendarDays"
                  title={filtersAreDefault(filters) ? 'No events yet' : 'No events match'}
                  message={filtersAreDefault(filters) ? 'Events show up here once they are approved.' : 'Try a different kind or category.'}
                  action={filtersAreDefault(filters) ? undefined : { label: 'Clear filters', onPress: () => apply(defaultFilters) }}
                />
              )
            ) : (
              <View style={styles.list}>
                <View style={styles.headingLine}>
                  <Text variant="h2" accessibilityRole="header">
                    {heading}
                  </Text>
                  {moreToSee ? <SeeAll onPress={() => setShowAll(true)} /> : null}
                </View>
                {shown.map((event: EventView) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    fromNaira={prices.data?.[event.id]}
                    busy={going.busy.has(event.id)}
                    onOpen={() => onOpenEvent(event.id)}
                    onToggleGoing={() => void going.toggle(event.id)}
                  />
                ))}
                {!weekMode && list.hasNextPage ? (
                  <View style={styles.more}>
                    <Button
                      testID="events-more"
                      label="Show more"
                      variant="secondary"
                      size="md"
                      loading={list.isFetchingNextPage}
                      onPress={() => void list.fetchNextPage()}
                    />
                  </View>
                ) : null}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <FilterSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} filters={filters} options={options} onApply={apply} />
    </View>
  );
}

function TabStrip() {
  const { colors } = useWawu();
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: colors.borderHairline }]}>
      {tabs.map((tab) => (
        <View
          key={tab.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
          style={[styles.tab, { borderBottomColor: colors.accent }]}
        >
          <Text variant="body" style={[font(600), { fontSize: tabMetrics.font }]}>
            {tab.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SeeAll({ onPress }: { onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="events-see-all"
      accessibilityRole="button"
      accessibilityLabel="See all events"
      hitSlop={space.md}
      onPress={onPress}
      {...ring.handlers}
      style={ring.style}
    >
      <Text variant="linkStrong" style={{ fontSize: bodyMetrics.seeAll }}>
        See all
      </Text>
    </Pressable>
  );
}

/** What the screen is until the Hub answers: the hero's block and three rows' shapes. */
function EventsSkeleton() {
  return (
    <LoadingView label="Loading events" testID="events-loading">
      <View style={styles.skeletons}>
        <Skeleton height={190} radius={radius.card} />
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width={rowMetrics.thumb} height={rowMetrics.thumb} radius={rowMetrics.thumbCorner} />
            <View style={styles.skeletonWords}>
              <Skeleton width="70%" height={16} />
              <Skeleton width="40%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  nav: {
    height: navMetrics.height,
    paddingHorizontal: layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: { flex: 1, textAlign: 'center', fontSize: navMetrics.title, letterSpacing: navMetrics.titleTracking * navMetrics.title },
  tabs: { flexDirection: 'row', gap: tabMetrics.between, paddingHorizontal: layout.gutter, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingBottom: tabMetrics.padBottom, borderBottomWidth: tabMetrics.underline, marginBottom: -StyleSheet.hairlineWidth },
  body: { paddingHorizontal: layout.gutter, paddingTop: bodyMetrics.top, gap: bodyMetrics.stack },
  headingLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { gap: bodyMetrics.listGap },
  more: { alignItems: 'center', paddingTop: space.lg },
  skeletons: { gap: bodyMetrics.stack },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.gap },
  skeletonWords: { flex: 1, gap: space.sm },
});
