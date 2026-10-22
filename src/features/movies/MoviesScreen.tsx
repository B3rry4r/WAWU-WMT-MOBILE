import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { FilterChips, type ChipItem } from '@/components/FilterChips';
import { Icon } from '@/components/icon';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { SectionHeading } from '@/features/explore/parts';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { detailKey, fetchDetail, fetchFilters, filtersKey, useMoviesHome, type BrowseFilter, type MovieCard, type MovieRail } from './api';
import { heroMetrics as h, posterMetrics } from './look';
import { heroLine, premiereAhead, premiereText } from './model';
import { FlixTabBar } from './FlixTabBar';
import { PosterCard, RailScroller, Scrim, SeeAll } from './parts';

export type MoviesScreenProps = {
  onBack: () => void;
  onSearch: () => void;
  onOpenMovie: (id: string) => void;
  /** "Watch on Flixora" on the hero: MV4 over that movie's page. */
  onWatch: (id: string) => void;
  /** "Trailer" on the hero: MV3. */
  onTrailer: (id: string) => void;
  /** A genre chip or a rail's See all: MV6 with that browse. */
  onBrowse: (filter: Partial<BrowseFilter>) => void;
  /** A tab in the bar under the screen (MV1, MV11 and MV12 draw it, Explore lit): leaves for that tab by its route name. */
  onOpenTab: (route: string) => void;
  /** The time "not premiered yet" is told against. Left out, now. */
  now?: Date;
};

/** The browse a rail's See all opens: its own order, or the premieres for "Premiering soon". */
export function browseOf(rail: Pick<MovieRail, 'key'>): Partial<BrowseFilter> {
  if (rail.key === 'most_watched') return { sort: 'views' };
  if (rail.key === 'top_rated') return { sort: 'rating' };
  if (rail.key === 'premiering_soon') return { premiering: true };
  return { sort: 'newest' };
}

function Hero({ movie, now, onWatch, onTrailer }: { movie: MovieCard; now: Date; onWatch: () => void; onTrailer: () => void }) {
  const { colors, gradients } = useWawu();
  // The card does not say whether the title has a trailer: the movie's own answer does (the page it opens reads the same one).
  const detail = useQuery({ queryKey: detailKey(movie.id), queryFn: () => fetchDetail(movie.id) }, queryClient);
  const premiere = premiereAhead(movie, now) ? premiereText(movie.premierDate, now) : null;
  return (
    <View testID="flix-hero" style={[styles.hero, { backgroundColor: colors.surfaceSunken }]}>
      {movie.backdropImage ?? movie.posterImage ? (
        <Image testID="flix-hero-image" source={{ uri: (movie.backdropImage ?? movie.posterImage) as string }} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
      ) : null}
      <Scrim token={gradients.scrimCard} />
      <View style={[styles.badge, { backgroundColor: colors.surfaceGlass }]}>
        <Icon name="Clapperboard" size={h.badgeIcon} color={colors.textOnAccent} strokeWidth={2.2} />
        <Text variant="caption" tone="textOnAccent" style={[font(700), styles.badgeText]}>
          ON FLIXORA
        </Text>
      </View>
      <View style={styles.heroWords}>
        <View>
          {premiere ? (
            <View style={styles.heroPremiere}>
              <StatusPill testID="flix-hero-premiere" label={premiere} tone="accent" icon="CalendarClock" />
            </View>
          ) : null}
          <Text variant="h1" tone="textOnAccent" numberOfLines={2} accessibilityRole="header" style={styles.heroTitle}>
            {movie.title}
          </Text>
          <Text variant="secondary" tone="textOnAccent" style={styles.heroLine}>
            {heroLine(movie)}
          </Text>
        </View>
        {premiere === null || detail.data?.trailer ? (
          <View style={styles.heroButtons}>
            {premiere === null ? <Button testID="flix-hero-watch" label="Watch on Flixora" variant="white" size="sm" onPress={onWatch} /> : null}
            {detail.data?.trailer ? <Button testID="flix-hero-trailer" label="Trailer" variant="glass" size="sm" icon="Play" onPress={onTrailer} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** MV11: the shapes of MV1 while the Hub answers. */
export function MoviesLoading() {
  return (
    <View testID="movies-loading" accessibilityLabel="Loading" style={styles.loading}>
      <Skeleton height={h.height} radius={h.radius} />
      <View style={styles.loadingChips}>
        <Skeleton width={64} height={36} radius={radius.chip} />
        <Skeleton width={80} height={36} radius={radius.chip} />
        <Skeleton width={72} height={36} radius={radius.chip} />
      </View>
      <Skeleton width={140} height={16} radius={6} />
      <View style={styles.loadingRow}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={posterMetrics.mvRailWidth} height={Math.round(posterMetrics.mvRailWidth * posterMetrics.ratio)} radius={posterMetrics.radius} />
        ))}
      </View>
    </View>
  );
}

/**
 * MV1 · Flix movies, with MV11 while it loads and MV12 when the Hub cannot answer. The hero, a genre row and the Hub's rails
 * (New on Flixora, Most watched, Top rated, Premiering soon: only the ones that hold titles), all from `GET /movies`; the genres
 * from `GET /movies/filters`. Nothing here is a sample: a title, poster, rating or date comes from Flixora through the Hub.
 */
export function MoviesScreen({ onBack, onSearch, onOpenMovie, onWatch, onTrailer, onBrowse, onOpenTab, now = new Date() }: MoviesScreenProps) {
  const home = useMoviesHome(queryClient);
  const filters = useQuery({ queryKey: filtersKey, queryFn: fetchFilters }, queryClient);
  const data = home.data?.enabled ? home.data : null;
  const genres: ChipItem<string>[] = [{ value: 'All', label: 'All' }, ...(filters.data?.genres ?? []).map((g) => ({ value: g, label: g }))];
  const rails = (data?.rails ?? []).filter((r) => r.movies.length > 0);

  let body;
  if (home.isPending) {
    body = <MoviesLoading />;
  } else if (!home.isError && !data) {
    // Movies are off: the gate is taking the person out, so nothing is drawn meanwhile.
    body = null;
  } else if (home.isError || !data) {
    // MV12 draws its message in the middle of the screen, with a purple Try again.
    body = (
      <View testID="movies-error-block" style={styles.centred}>
        <ErrorState testID="movies-error" icon="WifiOff" title="Couldn't load movies" message="Check your connection and try again." actionVariant="primary" onRetry={() => void home.refetch()} />
      </View>
    );
  } else {
    body = (
      <>
        {data.hero ? <Hero movie={data.hero} now={now} onWatch={() => onWatch(data.hero!.id)} onTrailer={() => onTrailer(data.hero!.id)} /> : null}
        {genres.length > 1 ? (
          <View style={styles.bleed}>
            <FilterChips
              items={genres}
              value="All"
              label="Genres"
              testID="movies-genre"
              onChange={(genre) => (genre === 'All' ? onBrowse({}) : onBrowse({ genre }))}
            />
          </View>
        ) : null}
        {rails.map((rail) => (
          <View key={rail.key} testID={`movies-rail-${rail.key}`} style={styles.section}>
            <SectionHeading title={rail.title} action={<SeeAll label={`See all ${rail.title}`} onPress={() => onBrowse(browseOf(rail))} testID={`movies-rail-${rail.key}-see-all`} />} />
            <RailRow movies={rail.movies} railKey={rail.key} onOpen={onOpenMovie} />
          </View>
        ))}
      </>
    );
  }
  return (
    <View style={styles.page}>
      <ScreenFrame
        testID="movies-screen"
        idPrefix="movies"
        title="Flix movies"
        gap={h.sectionGap}
        onBack={onBack}
        right={data || home.isPending ? <IconButton icon="Search" label="Search movies" onPress={onSearch} testID="movies-search" /> : undefined}
      >
        {body}
      </ScreenFrame>
      <FlixTabBar onOpenTab={onOpenTab} />
    </View>
  );
}

function RailRow({ movies, railKey, onOpen }: { movies: MovieCard[]; railKey: string; onOpen: (id: string) => void }) {
  return (
    <RailScroller>
      {movies.map((movie) => (
        <PosterCard key={movie.id} testID={`movies-${railKey}-${movie.id}`} movie={movie} width={posterMetrics.mvRailWidth} onPress={() => onOpen(movie.id)} />
      ))}
    </RailScroller>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: { height: h.height, borderRadius: h.radius, overflow: 'hidden', flexShrink: 0 },
  badge: {
    position: 'absolute',
    top: h.badgeTop,
    left: h.badgeLeft,
    height: h.badgeHeight,
    paddingHorizontal: h.badgePadX,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: h.badgeGap,
  },
  badgeText: { fontSize: h.badgeFont, letterSpacing: h.badgeFont * h.badgeTrack },
  heroWords: { position: 'absolute', left: h.inset, right: h.inset, bottom: h.inset, gap: h.between },
  heroTitle: { fontSize: h.title, lineHeight: undefined },
  heroLine: { fontSize: h.line, lineHeight: canvasNormalLineHeight(h.line), opacity: h.lineOpacity, marginTop: h.lineTop },
  heroPremiere: { marginBottom: h.premiereGap },
  centred: { flexGrow: 1, justifyContent: 'center' },
  heroButtons: { flexDirection: 'row', gap: h.buttonsGap },
  bleed: { marginHorizontal: -layout.gutter },
  section: { gap: space.md },
  loading: { gap: h.sectionGap },
  loadingChips: { flexDirection: 'row', gap: space.sm },
  loadingRow: { flexDirection: 'row', gap: posterMetrics.railGap },
});
