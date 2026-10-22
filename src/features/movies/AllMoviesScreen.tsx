import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button, IconButton } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { Icon } from '@/components/icon';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchFilters, filtersKey, noFilter, useBrowse, type BrowseFilter } from './api';
import { FilterSheet } from './FilterSheet';
import { posterMetrics as p, searchMetrics as s } from './look';
import { activeFilters, SORTS, totalText } from './model';
import { PosterCard } from './parts';

export type AllMoviesScreenProps = {
  /** Where the browse starts: a rail's order, a genre chip or the premieres. */
  initial?: Partial<BrowseFilter>;
  onBack: () => void;
  onSearch: () => void;
  onOpenMovie: (id: string) => void;
};

/** The search pill: it looks like the field and opens Search (MV8) when pressed. */
function SearchPill({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  return (
    <Pressable
      testID="movies-all-search"
      accessibilityRole="search"
      accessibilityLabel="Search movies"
      onPress={onPress}
      style={[styles.pill, { backgroundColor: colors.surfaceInput, borderColor: colors.borderHairline }]}
    >
      <Icon name="Search" size={s.glass} color={colors.textMuted} />
      <Text variant="body" tone="textMuted" style={{ fontSize: s.font }}>
        Search movies
      </Text>
    </Pressable>
  );
}

/**
 * MV6 · All movies, with MV7 (the filter sheet) and the empty answer (MV10's picture) when a filter shows nothing. It reads
 * `GET /movies/browse`: a page at a time with the Hub's total ("148 movies") and the chosen sort; the genre row and the sheet's
 * options come from `GET /movies/filters`. A cannot-load answer says so with Try again.
 */
export function AllMoviesScreen({ initial, onBack, onSearch, onOpenMovie }: AllMoviesScreenProps) {
  const { colors } = useWawu();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<BrowseFilter>({ ...noFilter, ...initial });
  const [sheet, setSheet] = useState(false);
  const browse = useBrowse(filter, queryClient);
  const filters = useQuery({ queryKey: filtersKey, queryFn: fetchFilters }, queryClient);
  const items = browse.data?.pages.flatMap((page) => page.items) ?? [];
  const total = browse.data?.pages[0]?.total ?? 0;
  const cardWidth = Math.floor((width - 2 * layout.gutter - p.gridColGap) / 2);
  const genres = [{ value: 'All', label: 'All' }, ...(filters.data?.genres ?? []).map((g) => ({ value: g, label: g }))];
  const sortLabel = SORTS.find((x) => x.value === filter.sort)?.label ?? 'Newest';

  let body;
  if (browse.isPending) {
    body = (
      <View testID="movies-all-loading" accessibilityLabel="Loading" style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width={cardWidth} height={Math.round(cardWidth * p.ratio)} radius={p.radius} />
        ))}
      </View>
    );
  } else if (browse.isError) {
    body = <ErrorState testID="movies-all-error" icon="WifiOff" title="Couldn't load movies" message="Check your connection and try again." onRetry={() => void browse.refetch()} />;
  } else if (items.length === 0) {
    const narrowed = activeFilters(filter) > 0;
    body = narrowed ? (
      <EmptyState
        testID="movies-all-empty"
        icon="Clapperboard"
        title="No movies found"
        message="Try another word, or clear the filters."
        action={{ label: 'Clear filters', onPress: () => setFilter((f) => ({ ...f, genre: null, language: null, premiering: false })) }}
      />
    ) : (
      <EmptyState testID="movies-all-empty" icon="Clapperboard" title="No movies yet" message="New titles show up here as they arrive." />
    );
  } else {
    body = (
      <>
        <View testID="movies-all-grid" style={styles.grid}>
          {items.map((movie) => (
            <PosterCard key={movie.id} testID={`movies-all-${movie.id}`} movie={movie} width={cardWidth} onPress={() => onOpenMovie(movie.id)} />
          ))}
        </View>
        {browse.hasNextPage ? <Button testID="movies-all-more" label="Show more" variant="secondary" size="md" loading={browse.isFetchingNextPage} onPress={() => void browse.fetchNextPage()} /> : null}
      </>
    );
  }

  return (
    <ScreenFrame
      testID="movies-all-screen"
      idPrefix="movies-all"
      title="All movies"
      gap={space.lg}
      onBack={onBack}
      right={<IconButton icon="SlidersHorizontal" label="Filter movies" onPress={() => setSheet(true)} testID="movies-all-filter" />}
    >
      <SearchPill onPress={onSearch} />
      {genres.length > 1 ? (
        <View style={styles.bleed}>
          <FilterChips items={genres} value={filter.genre ?? 'All'} label="Genres" testID="movies-all-genre" onChange={(g) => setFilter((f) => ({ ...f, genre: g === 'All' ? null : g }))} />
        </View>
      ) : null}
      {browse.isSuccess ? (
        <View style={styles.sortRow}>
          <Text variant="body" tone="textMuted" testID="movies-all-total" style={{ fontSize: s.sortFont }}>
            {totalText(total)}
          </Text>
          <Pressable testID="movies-all-sort" accessibilityRole="button" accessibilityLabel={`Sort: ${sortLabel}`} onPress={() => setSheet(true)} style={styles.sort}>
            <Text variant="body" style={[font(700), { fontSize: s.sortFont }]}>
              {sortLabel}
            </Text>
            <Icon name="ChevronDown" size={s.chevron} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>
      ) : null}
      {body}
      <FilterSheet
        visible={sheet}
        filter={filter}
        options={filters.data ?? null}
        onClose={() => setSheet(false)}
        onApply={(next) => {
          setFilter(next);
          setSheet(false);
        }}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: s.height,
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.pillGap,
    paddingHorizontal: s.padX,
  },
  bleed: { marginHorizontal: -layout.gutter },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sort: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: p.gridColGap, rowGap: p.gridRowGap },
});
