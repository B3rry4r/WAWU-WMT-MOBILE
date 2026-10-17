import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { exploreEventMetrics as ev } from '@/features/events/ExploreEvents';
import { SeeAll } from '@/features/events/EventsScreen';
import { canvasNormalLineHeight, layout, radius, useWawu } from '@/theme';

import { creatorCardMetrics } from './CreatorCard';

/**
 * The smaller parts of X1. Where the Hub serves nothing yet the canvas has no empty state, so a section whose task is built
 * keeps its heading and its frame and holds the place with a neutral picture (R-47): the sunken block the shared `Skeleton`
 * uses, a quiet glyph on it, and no name, date, place or price. A neutral picture is not pressable.
 */
export const placeholderMetrics = {
  glyph: 36,
  cards: 3,
} as const;

const count = (n: number) => Array.from({ length: n }, (_, i) => i);

/** The neutral picture: a sunken block with one quiet glyph centred on it. */
function Frame({ icon, testID, style }: { icon: IconName; testID?: string; style: StyleProp<ViewStyle> }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={[styles.frame, { backgroundColor: colors.surfaceSunken }, style]}>
      <Icon name={icon} size={placeholderMetrics.glyph} color={colors.textMuted} strokeWidth={1.5} />
    </View>
  );
}

/** `SH`: a heading with its action at the right (when its destination is built), the two sitting on one baseline row (aligned to the bottom). */
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.headingLine}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

/** Featured creators with nobody featured: the rail's place held by three neutral cards. */
export function CreatorsRailEmpty() {
  return (
    <View testID="explore-featured-empty" accessible accessibilityLabel="Featured creators, none to show" style={styles.bleed}>
      <View style={styles.creatorsRail}>
        {count(placeholderMetrics.cards).map((i) => (
          <Frame key={i} icon="UserRound" style={styles.creatorFrame} />
        ))}
      </View>
    </View>
  );
}

/** One upcoming-event card with nothing on it: the card's size, hairline and picture block, its words' room left empty. */
function EventCardBlank() {
  const { colors } = useWawu();
  return (
    <View style={[styles.eventCard, { backgroundColor: colors.surfaceCard }]}>
      <Frame icon="CalendarDays" style={styles.eventPicture} />
      <View style={styles.eventWords} />
      <View pointerEvents="none" style={[styles.eventEdge, { borderColor: colors.borderHairline }]} />
    </View>
  );
}

/** Upcoming events with none to show: the heading and its See all (E1, built, so it works), and three neutral cards. */
export function ExploreEventsEmpty({ onSeeAll }: { onSeeAll: () => void }) {
  return (
    <View testID="explore-events" style={styles.section}>
      <SectionHeading title="Upcoming events" action={<SeeAll onPress={onSeeAll} testID="explore-events-see-all" />} />
      <View testID="explore-events-empty" accessible accessibilityLabel="Upcoming events, none to show" style={styles.bleed}>
        <View style={styles.eventsRail}>
          {count(placeholderMetrics.cards).map((i) => (
            <EventCardBlank key={i} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  headingLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  section: { gap: ev.railGap },
  /** Runs off both edges as the real rails do, and is clipped there: a neutral frame is not a list, so it does not scroll. */
  bleed: { marginHorizontal: -layout.gutter, flexGrow: 0, overflow: 'hidden' },
  creatorFrame: { width: creatorCardMetrics.railWidth, height: creatorCardMetrics.railHeight, borderRadius: radius.media },
  eventPicture: { alignSelf: 'stretch', height: ev.picture },
  creatorsRail: { flexDirection: 'row', gap: creatorCardMetrics.between, paddingHorizontal: layout.gutter },
  eventsRail: { flexDirection: 'row', gap: ev.cardsApart, paddingHorizontal: layout.gutter },
  eventCard: { width: ev.cardWidth, borderRadius: ev.cardCorner, overflow: 'hidden' },
  eventWords: {
    paddingTop: ev.wordsTop,
    paddingHorizontal: ev.wordsX,
    paddingBottom: ev.wordsBottom,
    height: ev.wordsTop + canvasNormalLineHeight(ev.title) + ev.placeTop + canvasNormalLineHeight(ev.place) + ev.wordsBottom,
  },
  eventEdge: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: ev.cardCorner, borderWidth: StyleSheet.hairlineWidth },
});
