import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { detailKey, fetchDetail, type MovieDetail } from './api';
import { pageMetrics as m, starColor } from './look';
import { castHue, countText, isRated, pageLine, premiereAhead, premiereText, ratingWords, tagsOf } from './model';
import { Poster } from './parts';
import { WatchFlow } from './WatchFlow';

export type MovieScreenProps = {
  movieId: string;
  onBack: () => void;
  /** A `file` trailer opens MV3 (`/movies/<id>/trailer`); a `youtube` one is opened outside the app by the screen itself. */
  onTrailer: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  /** Opens MV4 at once (the "Watch on Flixora" on MV1's hero and on MV3 arrive here asking for it). */
  startWatching?: boolean;
  now?: Date;
};

function Tag({ label }: { label: string }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.tag, { borderColor: colors.borderStrong }]}>
      <Text variant="caption" style={[font(600), { fontSize: m.tagFont, lineHeight: canvasNormalLineHeight(m.tagFont) }]}>
        {label}
      </Text>
    </View>
  );
}

/** What a trailer card says under "Watch the trailer": where it plays. */
export const trailerWhere = (kind: 'file' | 'youtube') => (kind === 'file' ? 'Plays in the app' : 'Opens YouTube');

function Body({ movie, onTrailer, now }: { movie: MovieDetail; onTrailer: () => void; now: Date }) {
  const { colors } = useWawu();
  const ahead = premiereAhead(movie, now);
  const premiere = ahead ? premiereText(movie.premierDate, now) : null;
  const tags = tagsOf(movie);
  const cover = movie.backdropImage ?? movie.posterImage;
  return (
    <>
      <View style={styles.top}>
        <View style={[styles.posterShadow, { borderRadius: m.posterRadius }]}>
          <Poster uri={movie.posterImage} width={m.posterWidth} height={m.posterHeight} corner={m.posterRadius} testID="movie-poster" />
        </View>
        <View style={styles.words}>
          {premiere ? <StatusPill testID="movie-premiere" label={premiere} tone="accent" icon="CalendarClock" stretch /> : null}
          <Text variant="h1" accessibilityRole="header" testID="movie-title" style={styles.title}>
            {movie.title}
          </Text>
          <Text variant="body" tone="textMuted" style={{ fontSize: m.line, lineHeight: canvasNormalLineHeight(m.line) }}>
            {pageLine(movie)}
          </Text>
          <View style={styles.rating}>
            <Icon name="Star" size={m.starSmall} color={starColor} fill={starColor} strokeWidth={2.4} />
            <Text variant="body" style={[font(600), { fontSize: m.line }]}>
              {isRated(movie) ? ratingWords(movie) : 'New'}
            </Text>
            <Text variant="body" tone="textMuted" style={{ fontSize: m.line }}>
              {isRated(movie) && movie.views > 0 ? `· ${countText(movie.views)} views` : ahead ? '· premieres soon' : ''}
            </Text>
          </View>
        </View>
      </View>
      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>
      ) : null}
      {movie.trailer ? (
        <Pressable
          testID="movie-trailer"
          accessibilityRole="button"
          accessibilityLabel="Watch the trailer"
          onPress={onTrailer}
          style={[styles.trailer, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}
        >
          <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
            {cover ? <Image source={{ uri: cover }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} /> : null}
            <View style={[styles.play, { backgroundColor: colors.surfaceScrim }]}>
              <Icon name="Play" size={m.playIcon} color={colors.textOnAccent} fill={colors.textOnAccent} strokeWidth={2.4} />
            </View>
          </View>
          <View style={styles.trailerWords}>
            <Text variant="body" style={[font(600), { fontSize: m.trailerTitle }]}>
              Watch the trailer
            </Text>
            <Text variant="body" tone="textMuted" style={{ fontSize: m.trailerSub, marginTop: m.trailerSubTop }}>
              {trailerWhere(movie.trailer.kind)}
            </Text>
          </View>
        </Pressable>
      ) : null}
      {movie.synopsis ? (
        <Text variant="body" tone="textSecondary" testID="movie-synopsis" style={{ fontSize: m.synopsis, lineHeight: m.synopsis * m.synopsisLead }}>
          {movie.synopsis}
        </Text>
      ) : null}
      {movie.cast.length > 0 ? (
        <View style={styles.cast}>
          <Text variant="label">Cast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castRow}>
            {movie.cast.map((person, i) => (
              <View key={`${person.name}-${i}`} style={styles.castPerson}>
                <Avatar name={person.name} hue={castHue(i)} size={m.castAvatar} decorative />
                <Text variant="body" style={[font(600), styles.castName]}>
                  {person.name}
                </Text>
                {person.character ? (
                  <Text variant="body" tone="textMuted" style={styles.castPart}>
                    {person.character}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  );
}

/**
 * MV2 · Movie, and MV9 · Premiering soon for a title whose premiere date is still ahead (trailer only until then). It reads
 * `GET /movies/{id}`; every word, picture and figure is the Hub's. The page's foot is "Watch on Flixora" (MV4 opens over it) with
 * what the board says under it, or, before a premiere, "Watch the trailer". A `file` trailer opens MV3; a `youtube` one opens
 * outside the app (G-FLIX-3). The board's share button is not drawn: the Hub serves no address to share.
 */
export function MovieScreen({ movieId, onBack, onTrailer, onOpenTerms, onOpenPrivacy, startWatching = false, now = new Date() }: MovieScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const detail = useQuery({ queryKey: detailKey(movieId), queryFn: () => fetchDetail(movieId) }, queryClient);
  const [sheet, setSheet] = useState(startWatching);
  const movie = detail.data;
  const ahead = movie ? premiereAhead(movie, now) : false;
  const cover = movie ? movie.backdropImage ?? movie.posterImage : null;
  const playTrailer = () => {
    if (!movie?.trailer) return;
    if (movie.trailer.kind === 'youtube') void Linking.openURL(movie.trailer.url).catch(() => undefined);
    else onTrailer();
  };

  let foot = null;
  if (movie && ahead) {
    foot = movie.trailer ? (
      <>
        <Button testID="movie-foot-trailer" label="Watch the trailer" icon="Play" onPress={playTrailer} />
        <Text variant="body" tone="textMuted" style={styles.note}>
          Only the trailer is out until the premiere
        </Text>
      </>
    ) : null;
  } else if (movie) {
    foot = (
      <>
        <Button testID="movie-watch" label="Watch on Flixora" onPress={() => setSheet(true)} />
        <Text variant="body" tone="textMuted" style={styles.note}>
          Plays on Flixora in Chrome or Edge on a computer
        </Text>
      </>
    );
  }

  return (
    <View testID="movie-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <View style={styles.backdrop}>
        {cover ? <Image testID="movie-backdrop" source={{ uri: cover }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} /> : null}
        <LinearGradient
          pointerEvents="none"
          colors={[colors.mediaBlack35, colors.mediaBlack0, colors.surfacePage]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
        <IconButton icon="ChevronLeft" label="Back" tone="glass" onPress={onBack} testID="movie-back" />
      </View>
      {detail.isPending ? (
        <View testID="movie-loading" accessibilityLabel="Loading" style={[styles.scroll, styles.loading, { paddingTop: insets.top + 6 + 42 + m.bodyTop }]}>
          <Skeleton width="100%" height={m.posterHeight} radius={m.posterRadius} />
          <Skeleton height={56} radius={m.trailerRadius} />
          <Skeleton height={80} radius={space.md} />
        </View>
      ) : detail.isError || !movie ? (
        <View style={[styles.scroll, { paddingTop: insets.top + 6 + 42 + space.s3xl }]}>
          <ErrorState testID="movie-error" icon="WifiOff" title="Couldn't load this movie" message="Check your connection and try again." onRetry={() => void detail.refetch()} />
        </View>
      ) : (
        <ScrollView testID="movie-scroll" contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 6 + 42 + m.bodyTop, paddingBottom: m.bodyBottom }]}>
          <Body movie={movie} onTrailer={playTrailer} now={now} />
        </ScrollView>
      )}
      {foot ? (
        <View testID="movie-foot" style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: Math.max(insets.bottom, m.footBottom - m.footGap) }]}>
          {foot}
        </View>
      ) : null}
      {movie ? (
        <WatchFlow
          movieId={movie.id}
          title={movie.title}
          mustAgreeTerms={movie.mustAgreeTerms}
          visible={sheet && !ahead}
          onClose={() => setSheet(false)}
          onOpenTerms={onOpenTerms}
          onOpenPrivacy={onOpenPrivacy}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, height: m.backdrop },
  bar: { paddingHorizontal: layout.gutter, flexDirection: 'row', justifyContent: 'space-between', zIndex: 3 },
  scroll: { paddingHorizontal: layout.gutter, gap: m.between },
  loading: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: m.posterGap },
  posterShadow: { flexShrink: 0 },
  words: { flex: 1, gap: m.words },
  title: { fontSize: m.title, lineHeight: m.title * 1.1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: m.ratingGap },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: m.tagsGap },
  tag: { height: m.tagHeight, paddingHorizontal: m.tagPadX, borderRadius: radius.chip, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  trailer: { flexDirection: 'row', alignItems: 'center', gap: m.trailerGap, padding: m.trailerPad, borderRadius: m.trailerRadius, borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: m.thumbWidth, height: m.thumbHeight, borderRadius: m.thumbRadius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  play: { width: m.play, height: m.play, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  trailerWords: { flex: 1 },
  cast: { gap: m.castGroup },
  castRow: { gap: m.castGap },
  castPerson: { width: m.castWidth, alignItems: 'center', gap: m.castBetween },
  castName: { fontSize: m.castName, lineHeight: m.castName * 1.2, textAlign: 'center' },
  castPart: { fontSize: m.castPart, textAlign: 'center', marginTop: m.castPartPull },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: layout.gutter, paddingTop: space.md, gap: m.footGap },
  note: { fontSize: m.footNote, textAlign: 'center' },
});
