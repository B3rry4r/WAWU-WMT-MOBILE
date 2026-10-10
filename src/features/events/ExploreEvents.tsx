import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { gradientEnds } from '@/components/MediaCard';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import { defaultFilters, featuredKey, fetchEventsPage, fetchFeatured, type EventView } from './api';
import { SeeAll } from './EventsScreen';
import { dateLine, placeOf } from './format';
import { DateBadge } from './parts';

/**
 * Explore's event entries (R-41, EVENTS-01 round 6), as design/_gen/explore.js draws them on X1, X15 and X14:
 * - `hero`: the FEATURED EVENT card, 196 high at corner 24, its words 18 in from the sides and 16 from the bottom,
 *   7 apart: the kicker 11 bold, the name 22 bold, "12 Oct · Eko Convention Centre" 13 at 80%;
 * - `eventsRail`: "Upcoming events" with See all, 12 above a rail of cards 230 wide at corner 20, 10 apart, running
 *   off the right edge; a card is a 120 high picture with the date badge 10 in, then the name 15 semi-bold and the
 *   place 12.5 muted after a 13 pin, padded 11 above, 13 at the sides and below;
 * - X14's 196 high block where the hero will be.
 * The hero's three pager dots are drawn by Explore itself (`HeroDots` in src/features/explore/parts.tsx, R-46), not here.
 */
export const exploreEventMetrics = {
  heroHeight: 196,
  heroCorner: 24,
  heroInsetX: 18,
  heroInsetBottom: 16,
  heroStack: 7,
  kicker: 11,
  kickerTracking: 0.08,
  name: 22,
  nameTracking: -0.025,
  nameLeading: 1.1,
  line: 13,
  lineOpacity: 0.8,
  railGap: space.md,
  cardWidth: 230,
  cardCorner: radius.media,
  cardsApart: 10,
  picture: 120,
  badgeInset: 10,
  wordsTop: 11,
  wordsX: 13,
  wordsBottom: 13,
  title: 15,
  place: 12.5,
  pin: 13,
  placeGap: space.xs,
  placeTop: space.xs,
  /** The rail shows the first ten upcoming events; See all opens the whole list (E1). */
  railLimit: 10,
} as const;

const m = exploreEventMetrics;

export const exploreRailKey = ['events', 'explore-rail'] as const;

/** The featured event and the upcoming events, read for Explore (only when it can open them). A failure draws neither and is not retried: Explore's other parts carry on. */
export function useExploreEvents(enabled = true) {
  const featured = useQuery({ queryKey: featuredKey(defaultFilters), queryFn: () => fetchFeatured(defaultFilters), enabled, retry: false }, queryClient);
  const rail = useQuery({ queryKey: exploreRailKey, queryFn: () => fetchEventsPage(defaultFilters, 1), enabled, retry: false }, queryClient);
  const refetchFeatured = featured.refetch;
  const refetchRail = rail.refetch;
  const refetch = useCallback(
    () => (enabled ? Promise.all([refetchFeatured(), refetchRail()]) : Promise.resolve([])),
    [enabled, refetchFeatured, refetchRail],
  );
  // D12: Explore holds X14 until both reads have answered or failed (not retried here, so a failure settles at once),
  // so nothing moves after its first paint.
  const settled = !enabled || (!featured.isPending && !rail.isPending);
  return { settled, featured: featured.data ?? null, upcoming: (rail.data?.events ?? []).slice(0, m.railLimit), refetch };
}

/** X1's FEATURED EVENT card: the picture under a dark fade, the kicker, the name, and its day and place. */
export function ExploreFeaturedEvent({ event, onOpen }: { event: EventView; onOpen: () => void }) {
  const { colors, gradients } = useWawu();
  const ring = useFocusRing();
  const ends = gradientEnds(gradients.scrimCard.angle);
  const line = [dateLine(event.startsAt, event), placeOf(event)].filter(Boolean).join(' · ');
  return (
    <Pressable
      testID="explore-featured-event"
      accessibilityRole="button"
      accessibilityLabel={`Featured event: ${event.name}, ${line}`}
      onPress={onOpen}
      {...ring.handlers}
      style={[styles.hero, { backgroundColor: colors.surfaceCardInk }, ring.style]}
    >
      {event.bannerUrl ? (
        <Image source={event.bannerUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityElementsHidden />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={gradients.scrimCard.colors as unknown as readonly [string, string, ...string[]]}
        locations={gradients.scrimCard.locations as unknown as readonly [number, number, ...number[]]}
        start={ends.start}
        end={ends.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroWords}>
        <Text
          variant="body"
          style={[
            font(700),
            { fontSize: m.kicker, lineHeight: canvasNormalLineHeight(m.kicker), letterSpacing: m.kickerTracking * m.kicker, color: darkColors.accentFg },
          ]}
        >
          FEATURED EVENT
        </Text>
        <Text variant="body" tone="textOnAccent" numberOfLines={2} style={[font(700), styles.heroName]}>
          {event.name}
        </Text>
        <Text variant="body" tone="textOnAccent" numberOfLines={1} style={styles.heroLine}>
          {line}
        </Text>
      </View>
    </Pressable>
  );
}

/** X1 and X15's "Upcoming events": the heading with See all (E1), then a card per event (E2). */
export function ExploreEventsRail({
  events,
  onOpen,
  onSeeAll,
}: {
  events: readonly EventView[];
  onOpen: (id: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <View testID="explore-events" style={styles.section}>
      <View style={styles.headingLine}>
        <Text variant="h2" accessibilityRole="header">
          Upcoming events
        </Text>
        <SeeAll onPress={onSeeAll} testID="explore-events-see-all" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.rail}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} onOpen={() => onOpen(event.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function EventCard({ event, onOpen }: { event: EventView; onOpen: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const place = placeOf(event);
  return (
    <Pressable
      testID={`explore-event-${event.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${dateLine(event.startsAt, event)}${place ? `, ${place}` : ''}`}
      onPress={onOpen}
      {...ring.handlers}
      style={[styles.card, { backgroundColor: colors.surfaceCard }, ring.style]}
    >
      <View style={[styles.picture, { backgroundColor: colors.surfaceSunken }]}>
        {event.bannerUrl ? (
          <Image source={event.bannerUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityElementsHidden />
        ) : null}
        <View style={styles.badge}>
          <DateBadge startsAt={event.startsAt} zone={event} />
        </View>
      </View>
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: m.title, lineHeight: canvasNormalLineHeight(m.title) }]}>
          {event.name}
        </Text>
        {place ? (
          <View style={styles.place}>
            <Icon name="MapPin" size={m.pin} color={colors.textMuted} />
            <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.placeText}>
              {place}
            </Text>
          </View>
        ) : null}
      </View>
      <View pointerEvents="none" style={[styles.edge, { borderColor: colors.borderHairline }]} />
    </Pressable>
  );
}

/** X14's block where the featured event will be. */
export function ExploreFeaturedEventSkeleton() {
  return <Skeleton height={m.heroHeight} radius={m.heroCorner} />;
}

const styles = StyleSheet.create({
  hero: { height: m.heroHeight, borderRadius: m.heroCorner, overflow: 'hidden' },
  heroWords: { position: 'absolute', left: m.heroInsetX, right: m.heroInsetX, bottom: m.heroInsetBottom, gap: m.heroStack },
  heroName: { fontSize: m.name, letterSpacing: m.nameTracking * m.name, lineHeight: m.name * m.nameLeading },
  heroLine: { fontSize: m.line, lineHeight: canvasNormalLineHeight(m.line), opacity: m.lineOpacity },
  section: { gap: m.railGap },
  headingLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bleed: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  rail: { gap: m.cardsApart, paddingHorizontal: layout.gutter },
  card: { width: m.cardWidth, borderRadius: m.cardCorner, overflow: 'hidden' },
  /** The canvas draws the card's hairline inset, so it adds nothing to the card's size (D13). */
  edge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: m.cardCorner, borderWidth: StyleSheet.hairlineWidth },
  picture: { height: m.picture },
  badge: { position: 'absolute', left: m.badgeInset, top: m.badgeInset },
  words: { paddingTop: m.wordsTop, paddingHorizontal: m.wordsX, paddingBottom: m.wordsBottom },
  place: { flexDirection: 'row', alignItems: 'center', gap: m.placeGap, marginTop: m.placeTop },
  placeText: { flexShrink: 1, fontSize: m.place, lineHeight: canvasNormalLineHeight(m.place) },
});
