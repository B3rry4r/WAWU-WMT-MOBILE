import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { SearchField } from '@/features/search/parts';
import { space } from '@/theme';
import { useSearchText } from '@/features/search/hooks';

import { useSearch } from './api';
import { searchMetrics as s } from './look';
import { totalText } from './model';
import { ResultRow } from './parts';

export const SEARCH_MAX = 80;

/**
 * MV8 · Search, with MV10 when nothing is found. A title, an original title or a tagline holding the typed words
 * (`GET /movies/search`, read once typing pauses), the Hub's count over the rows ("3 movies"), a row opens the movie. Nothing is
 * drawn under the field until something is typed. The board's MV10 button reads "Clear filters"; search has no filters, so this
 * one clears the words ("Clear search").
 */
export function SearchScreen({ onBack, onOpenMovie }: { onBack: () => void; onOpenMovie: (id: string) => void }) {
  const text = useSearchText(SEARCH_MAX);
  const search = useSearch(text.query, queryClient);
  const items = search.data?.pages.flatMap((page) => page.items) ?? [];
  const total = search.data?.pages[0]?.total ?? 0;

  let body = null;
  if (text.query !== '') {
    if (search.isPending) {
      body = <SkeletonRows count={4} testID="movies-search-loading" />;
    } else if (search.isError) {
      body = <ErrorState testID="movies-search-error" icon="WifiOff" title="Couldn't search movies" message="Check your connection and try again." onRetry={() => void search.refetch()} />;
    } else if (items.length === 0) {
      body = (
        <View style={styles.empty}>
          <EmptyState
            testID="movies-search-empty"
            icon="Clapperboard"
            title={`No movies for "${text.query}"`}
            message="Try another word."
            action={{ label: 'Clear search', onPress: () => text.submit('') }}
          />
        </View>
      );
    } else {
      body = (
        <>
          <Text variant="body" tone="textMuted" testID="movies-search-count" style={{ fontSize: s.count }}>
            {totalText(total)}
          </Text>
          <View testID="movies-search-results">
            {items.map((movie) => (
              <ResultRow key={movie.id} testID={`movies-search-${movie.id}`} movie={movie} onPress={() => onOpenMovie(movie.id)} />
            ))}
          </View>
          {search.hasNextPage ? <Button testID="movies-search-more" label="Show more" variant="secondary" size="md" loading={search.isFetchingNextPage} onPress={() => void search.fetchNextPage()} /> : null}
        </>
      );
    }
  }

  return (
    <ScreenFrame testID="movies-search-screen" idPrefix="movies-search" title="Search" gap={space.md} keyboard onBack={onBack}>
      <SearchField
        testID="movies-search-field"
        value={text.text}
        onChange={text.setText}
        onSubmit={(value) => void text.submit(value)}
        onClear={() => void text.submit('')}
        placeholder="Search movies"
        maxLength={SEARCH_MAX}
        autoFocus
      />
      {body}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center' },
});
