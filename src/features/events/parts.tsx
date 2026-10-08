import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { gradientEnds } from '@/components/MediaCard';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import type { EventView } from './api';
import { badgeOf, heroPrice, placeOf, priceLine } from './format';

/** design/_gen/events.js `dateB`: 44 by 48, 12 corner, month 9.5 at 85%, day 18, both bold; the row's copy is drawn at 80%. */
export const badgeMetrics = {
  width: 44,
  height: 48,
  corner: 12,
  month: 9.5,
  day: 18,
  monthOpacity: 0.85,
  monthTracking: 0.08,
  rowScale: 0.8,
} as const;

/** The month and day an event starts, in the event's own zone (Lagos by default). */
export function DateBadge({ startsAt, zone, scale = 1 }: { startsAt: string; zone: { timezone?: string | null } | null; scale?: number }) {
  const { colors } = useWawu();
  const { month, day } = badgeOf(startsAt, zone ?? undefined);
  return (
    <View
      accessible
      accessibilityLabel={`${month} ${day}`}
      style={[
        styles.badge,
        {
          width: badgeMetrics.width * scale,
          height: badgeMetrics.height * scale,
          borderRadius: badgeMetrics.corner * scale,
          backgroundColor: colors.accent,
        },
      ]}
    >
      <Text
        variant="body"
        tone="textOnAccent"
        style={[
          font(700),
          {
            fontSize: badgeMetrics.month * scale,
            lineHeight: badgeMetrics.month * scale * 1.3,
            letterSpacing: badgeMetrics.monthTracking * badgeMetrics.month * scale,
            opacity: badgeMetrics.monthOpacity,
          },
        ]}
      >
        {month}
      </Text>
      <Text
        variant="body"
        tone="textOnAccent"
        style={[font(700), { fontSize: badgeMetrics.day * scale, lineHeight: badgeMetrics.day * scale }]}
      >
        {day}
      </Text>
    </View>
  );
}

/** design/_gen/events.js `going`: 32 high, 12 across, 6 between icon and word, 13 semi-bold, icon 15 at stroke 2. */
const goingMetrics = { height: 32, padH: 12, inner: 6, font: 13, icon: 15, stroke: 2 } as const;

export type GoingButtonProps = {
  going: boolean;
  /** The event's name, so a screen reader hears what "Going" is about. */
  name: string;
  /** A request is on its way: another press is ignored. */
  busy?: boolean;
  onPress: () => void;
  testID?: string;
};

/** The free interest signal: "Going?" until the person says so, "Going" after (E1 rows, E2). */
export function GoingButton({ going, name, busy, onPress, testID }: GoingButtonProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const ink = going ? colors.accentFg : colors.textPrimary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={going ? `Going to ${name}. Tap to say you are not going` : `Mark yourself going to ${name}`}
      accessibilityState={{ selected: going, busy: Boolean(busy) }}
      disabled={busy}
      onPress={onPress}
      hitSlop={space.sm}
      {...ring.handlers}
      style={[
        styles.going,
        going ? { backgroundColor: colors.accentTint } : { borderColor: colors.borderStrong, borderWidth: StyleSheet.hairlineWidth },
        ring.style,
      ]}
    >
      <Icon name={going ? 'CalendarCheck' : 'CalendarPlus'} size={goingMetrics.icon} color={ink} strokeWidth={goingMetrics.stroke} />
      <Text variant="body" style={[font(600), { fontSize: goingMetrics.font, color: ink }]}>
        {going ? 'Going' : 'Going?'}
      </Text>
    </Pressable>
  );
}

/** design/_gen/events.js `evRow`: 12 above and below, 12 between, a 72 square picture with a 16 corner, title 15, place 12.5, price 13. */
export const rowMetrics = {
  padV: space.md,
  gap: space.md,
  thumb: 72,
  thumbCorner: radius.input,
  badgeInset: 6,
  title: 15,
  place: 12.5,
  placeIcon: 12,
  price: 13,
  priceGap: 6,
  placeGap: 3,
} as const;

export type EventRowProps = {
  event: EventView;
  /** What a person can pay now (the Hub's `from-prices`); null or missing draws no price line. */
  fromNaira?: number | null;
  busy?: boolean;
  onOpen: () => void;
  onToggleGoing: () => void;
};

/** One event in the list: picture with its date, name, place, "from" price and the Going toggle. */
export function EventRow({ event, fromNaira, busy, onOpen, onToggleGoing }: EventRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const place = placeOf(event);
  const price = priceLine({ ticketed: event.ticketed, priceFromNaira: fromNaira ?? null });
  return (
    <View style={[styles.row, { borderBottomColor: colors.borderHairline }]}>
      <Pressable
        testID={`event-row-${event.id}`}
        accessibilityRole="button"
        accessibilityLabel={[event.name, place, price].filter(Boolean).join(', ')}
        onPress={onOpen}
        {...ring.handlers}
        style={[styles.open, ring.style]}
      >
        <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
          {event.bannerUrl ? (
            <Image source={event.bannerUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityElementsHidden />
          ) : null}
          <View style={styles.thumbBadge}>
            <DateBadge startsAt={event.startsAt} zone={event} scale={badgeMetrics.rowScale} />
          </View>
        </View>
        <View style={styles.words}>
          <Text
            variant="body"
            numberOfLines={1}
            style={[font(600), { fontSize: rowMetrics.title, lineHeight: canvasNormalLineHeight(rowMetrics.title) }]}
          >
            {event.name}
          </Text>
          {place ? (
            <View style={styles.place}>
              <Icon name="MapPin" size={rowMetrics.placeIcon} color={colors.textMuted} />
              <Text variant="body" tone="textMuted" numberOfLines={1} style={[styles.placeFont, styles.placeText]}>
                {place}
              </Text>
            </View>
          ) : null}
          {price ? (
            <Text variant="body" style={[font(600), styles.price]}>
              {price}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <GoingButton testID={`event-going-${event.id}`} going={event.userGoing} name={event.name} busy={busy} onPress={onToggleGoing} />
    </View>
  );
}

/** design/_gen/events.js `featured`: 190 high, 24 corner, the badge 14 in, the words 16 in and 14 up; FEATURED 11 bold at 0.08em, name 20 bold, line 12.5. */
export const heroMetrics = {
  height: 190,
  corner: 24,
  badgeInset: 14,
  wordsInset: 16,
  wordsBottom: 14,
  kicker: 11,
  kickerTracking: 0.08,
  name: 20,
  line: 12.5,
  lineOpacity: 0.8,
  stack: 4,
} as const;

/** The featured event: the picture under a dark fade, its date, FEATURED, name, place and "from" price. */
export function FeaturedCard({ event, fromNaira, onOpen }: { event: EventView; fromNaira?: number | null; onOpen: () => void }) {
  const { colors, gradients } = useWawu();
  const ring = useFocusRing();
  const ends = gradientEnds(gradients.scrimCard.angle);
  const line = [placeOf(event), heroPrice({ ticketed: event.ticketed, priceFromNaira: fromNaira ?? null })].filter(Boolean).join(' · ');
  return (
    <Pressable
      testID="events-featured"
      accessibilityRole="button"
      accessibilityLabel={`Featured: ${event.name}${line ? `, ${line}` : ''}`}
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
      <View style={styles.heroBadge}>
        <DateBadge startsAt={event.startsAt} zone={event} />
      </View>
      <View style={styles.heroWords}>
        <Text
          variant="body"
          style={[
            font(700),
            {
              fontSize: heroMetrics.kicker,
              lineHeight: canvasNormalLineHeight(heroMetrics.kicker),
              letterSpacing: heroMetrics.kickerTracking * heroMetrics.kicker,
              color: darkColors.accentFg,
            },
          ]}
        >
          FEATURED
        </Text>
        <Text variant="body" tone="textOnAccent" numberOfLines={2} style={[font(700), styles.heroName]}>
          {event.name}
        </Text>
        {line ? (
          <Text variant="body" tone="textOnAccent" numberOfLines={1} style={styles.heroLine}>
            {line}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  going: {
    height: goingMetrics.height,
    paddingHorizontal: goingMetrics.padH,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: goingMetrics.inner,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rowMetrics.gap,
    paddingTop: rowMetrics.padV,
    // The canvas draws the divider inside the 96 high row (an inset shadow), so it takes its width from the bottom padding.
    paddingBottom: rowMetrics.padV - StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: rowMetrics.gap, minWidth: 0 },
  thumb: { width: rowMetrics.thumb, height: rowMetrics.thumb, borderRadius: rowMetrics.thumbCorner, overflow: 'hidden' },
  thumbBadge: { position: 'absolute', left: rowMetrics.badgeInset, top: rowMetrics.badgeInset },
  words: { flex: 1, minWidth: 0 },
  place: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: rowMetrics.placeGap },
  placeFont: { fontSize: rowMetrics.place, lineHeight: canvasNormalLineHeight(rowMetrics.place) },
  placeText: { flexShrink: 1 },
  price: { marginTop: rowMetrics.priceGap, fontSize: rowMetrics.price, lineHeight: canvasNormalLineHeight(rowMetrics.price) },
  hero: { height: heroMetrics.height, borderRadius: heroMetrics.corner, overflow: 'hidden' },
  heroBadge: { position: 'absolute', left: heroMetrics.badgeInset, top: heroMetrics.badgeInset },
  heroWords: {
    position: 'absolute',
    left: heroMetrics.wordsInset,
    right: heroMetrics.wordsInset,
    bottom: heroMetrics.wordsBottom,
    gap: heroMetrics.stack,
  },
  heroName: { fontSize: heroMetrics.name, lineHeight: canvasNormalLineHeight(heroMetrics.name) },
  heroLine: { fontSize: heroMetrics.line, lineHeight: canvasNormalLineHeight(heroMetrics.line), opacity: heroMetrics.lineOpacity },
});
