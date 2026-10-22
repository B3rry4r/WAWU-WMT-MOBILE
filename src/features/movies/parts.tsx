import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type DimensionValue } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { gradientEnds } from '@/components/MediaCard';
import { font, layout, radius, space, useWawu, type GradientToken } from '@/theme';

import type { MovieCard } from './api';
import { posterMetrics as p, searchMetrics as s, starColor } from './look';
import { cardLine, isRated, ratingText } from './model';

/** A poster, or a quiet block with a clapperboard where the title has none (a layout never jumps when it arrives). */
export function Poster({ uri, width, height, corner, testID }: { uri: string | null; width: DimensionValue; height: number; corner: number; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.poster, { width, height, borderRadius: corner, backgroundColor: colors.surfaceSunken }]}>
      {uri ? (
        <Image testID={testID ? `${testID}-image` : undefined} source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
      ) : (
        <Icon name="Clapperboard" size={p.placeholderIcon} color={colors.textMuted} strokeWidth={1.8} />
      )}
    </View>
  );
}

/**
 * One title as a poster with its caption (`flixPoster`): the picture 1.47 times its width with the rating in a pill at the
 * bottom-left, then the title and "Drama · 2024". A title nobody has rated draws no pill.
 */
export function PosterCard({ movie, width, onPress, testID }: { movie: MovieCard; width: DimensionValue; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const numeric = typeof width === 'number' ? width : p.railWidth;
  const line = cardLine(movie);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[movie.title, line, isRated(movie) ? `rated ${ratingText(movie.rating)}` : null].filter(Boolean).join(', ')}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.card, { width }, ring.style]}
    >
      <View>
        <Poster uri={movie.posterImage} width="100%" height={Math.round(numeric * p.ratio)} corner={p.radius} testID={testID ? `${testID}-poster` : undefined} />
        {isRated(movie) ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceScrim }]}>
            <Icon name="Star" size={p.star} color={starColor} fill={starColor} strokeWidth={p.starStroke} />
            <Text variant="caption" tone="textOnAccent" style={[font(700), styles.badgeText]}>
              {ratingText(movie.rating)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
        {movie.title}
      </Text>
      {line ? (
        <Text variant="caption" tone="textMuted" numberOfLines={1} style={styles.sub}>
          {line}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** One search result (`resRow`): a small poster, the title, "Crime · 2025", the stars, a chevron. */
export function ResultRow({ movie, onPress, testID }: { movie: MovieCard; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const line = cardLine(movie);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={[movie.title, line].filter(Boolean).join(', ')}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.row, { borderBottomColor: colors.borderHairline }, ring.style]}
    >
      <Poster uri={movie.posterImage} width={s.thumbWidth} height={s.thumbHeight} corner={s.thumbRadius} />
      <View style={styles.rowWords}>
        <Text variant="body" numberOfLines={2} style={[font(600), { fontSize: s.rowTitle }]}>
          {movie.title}
        </Text>
        {line ? (
          <Text variant="caption" tone="textMuted" style={styles.rowLine}>
            {line}
          </Text>
        ) : null}
        {isRated(movie) ? (
          <View style={styles.rowStars}>
            <Icon name="Star" size={s.rowStar} color={starColor} fill={starColor} strokeWidth={p.starStroke} />
            <Text variant="caption" style={[font(600), { fontSize: s.rowLine }]}>
              {ratingText(movie.rating)}
            </Text>
          </View>
        ) : null}
      </View>
      <Icon name="ChevronRight" size={s.rowChevron} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  railRow: { gap: p.railGap, paddingHorizontal: layout.gutter },
  poster: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  card: { gap: p.captionGap },
  badge: {
    position: 'absolute',
    left: p.badgeInset,
    bottom: p.badgeInset,
    height: p.badgeHeight,
    paddingHorizontal: p.badgePadX,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: p.badgeGap,
  },
  badgeText: { fontSize: p.badgeFont },
  title: { fontSize: p.title },
  sub: { fontSize: p.sub, marginTop: p.subPull },
  row: { flexDirection: 'row', alignItems: 'center', gap: s.rowGap, paddingVertical: s.rowPad, borderBottomWidth: StyleSheet.hairlineWidth },
  rowWords: { flex: 1, minWidth: 0 },
  rowLine: { fontSize: s.rowLine, marginTop: s.rowLineTop },
  rowStars: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: s.rowStarTop },
});

/** A picture's darkening at its foot (the shared card scrim), laid over a hero or a backdrop. */
export function Scrim({ token, testID }: { token: GradientToken; testID?: string }) {
  const ends = gradientEnds(token.angle);
  return (
    <LinearGradient
      testID={testID}
      pointerEvents="none"
      colors={token.colors as unknown as readonly [string, string, ...string[]]}
      locations={token.locations as unknown as readonly [number, number, ...number[]]}
      start={ends.start}
      end={ends.end}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** A rail's "See all": the heading's action, in the accent. */
export function SeeAll({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={space.md} onPress={onPress} {...ring.handlers} style={ring.style}>
      <Text variant="linkStrong">See all</Text>
    </Pressable>
  );
}

/** Posters in a row that runs off the edge: 10 apart, bled to the screen's sides (`margin-right:-20px`). */
export function RailScroller({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.railRow} testID={testID}>
      {children}
    </ScrollView>
  );
}
