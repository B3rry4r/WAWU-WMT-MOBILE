import type { QueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { SectionHeading } from '@/features/explore/parts';
import { space } from '@/theme';

import { useMoviesHome, type MovieCard } from './api';
import { FlixSoonCard, isSoon } from './FlixSoon';
import { posterMetrics } from './look';
import { PosterCard, RailScroller, SeeAll } from './parts';

/** The titles the rail shows: the Hub's "New on Flixora" rail, else the first rail that holds any. Null when there is nothing to draw. */
export function railMovies(rails: { key: string; movies: MovieCard[] }[]): MovieCard[] | null {
  const pick = rails.find((r) => r.key === 'new' && r.movies.length > 0) ?? rails.find((r) => r.movies.length > 0);
  return pick ? pick.movies : null;
}

/** Where "See all" goes: the Flix movies screen (MV1), as the board's entry map draws it. */
export const FLIX_PATH = '/movies';

/**
 * The "Flix movies" rail (R-74), drawn on Home's Today screen below Creators and professionals and on Explore below Who Made
 * This? (`flixRail`: a heading with See all, then posters 128 wide, 10 apart, running off the edge). It is drawn only when the Hub
 * answers `enabled: true` with titles to show (R-27, R-47): while it is read, when it cannot be read and when movies are off it
 * draws nothing at all, never an empty frame or an error. A card opens the movie (MV2); See all opens Flix movies (MV1).
 * When the Hub answers `soon: true` (R-77) the rail stays: its title and one card with S13's two lines, which opens Flix movies.
 */
export function FlixRail({ client = queryClient, onSeeAll, onOpenMovie, testID = 'flix-rail' }: { client?: QueryClient; onSeeAll: () => void; onOpenMovie: (id: string) => void; testID?: string }) {
  const home = useMoviesHome(client);
  if (isSoon(home.data)) {
    return (
      <View testID={testID} style={styles.section}>
        <SectionHeading title="Flix movies" />
        <FlixSoonCard testID={`${testID}-soon`} onPress={onSeeAll} />
      </View>
    );
  }
  if (home.data?.enabled !== true) return null;
  const movies = railMovies(home.data.rails);
  if (!movies) return null;
  return (
    <View testID={testID} style={styles.section}>
      <SectionHeading title="Flix movies" action={<SeeAll label="See all Flix movies" onPress={onSeeAll} testID={`${testID}-see-all`} />} />
      <RailScroller testID={`${testID}-list`}>
        {movies.map((movie) => (
          <PosterCard key={movie.id} testID={`${testID}-${movie.id}`} movie={movie} width={posterMetrics.railWidth} onPress={() => onOpenMovie(movie.id)} />
        ))}
      </RailScroller>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
});
