import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SwitchRow } from '@/components/SwitchRow';
import { Text } from '@/components/Text';
import { font, space } from '@/theme';

import { fetchBrowse, type BrowseFilter, type MovieFilters } from './api';
import { sheetMetrics } from './look';
import { SORTS, totalText } from './model';

export type FilterSheetProps = {
  visible: boolean;
  filter: BrowseFilter;
  /** The genres and languages the Hub holds now; null while they have not been read. */
  options: MovieFilters | null;
  onApply: (filter: BrowseFilter) => void;
  onClose: () => void;
};

const NONE = '';

/** One group of options (genre or language) that wraps inside the sheet; tapping the one that is on turns it off. */
function OptionGroup({ title, items, value, onChange, testID }: { title: string; items: readonly string[]; value: string | null; onChange: (next: string | null) => void; testID: string }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text variant="label">{title}</Text>
      <FilterChips
        variant="option"
        label={title}
        testID={testID}
        items={items.map((item) => ({ value: item, label: item }))}
        value={value ?? NONE}
        onChange={(next) => onChange(next === value ? null : next)}
      />
    </View>
  );
}

/**
 * MV7 · Filter: sort (newest, top rated, most watched, A to Z), genre, language and "Premiering soon only", with a button that
 * says how many movies those choices show. The count is the Hub's own total for the choices as they stand (`GET /movies/browse`,
 * one title asked for), read as the choices change; nothing is applied until the button is pressed.
 */
export function FilterSheet({ visible, filter, options, onApply, onClose }: FilterSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Filter movies" gap={space.lg} testID="movies-filter">
      {visible ? <FilterBody filter={filter} options={options} onApply={onApply} /> : null}
    </BottomSheet>
  );
}

/** The sheet's choices. It is drawn only while the sheet is open, so each opening starts from the filter that is on screen. */
function FilterBody({ filter, options, onApply }: Pick<FilterSheetProps, 'filter' | 'options' | 'onApply'>) {
  const [draft, setDraft] = useState(filter);
  const count = useQuery({ queryKey: ['movies', 'count', draft], queryFn: () => fetchBrowse(draft, 1, 1) }, queryClient);
  const label = count.data ? `Show ${totalText(count.data.total)}` : 'Show movies';
  return (
    <>
      <Text variant="h2" accessibilityRole="header" style={styles.title}>
        Filter movies
      </Text>
      <View style={styles.group}>
        <Text variant="label">Sort</Text>
        <SegmentedTabs label="Sort movies" testID="movies-sort" items={SORTS.map((s) => ({ value: s.value, label: s.label }))} value={draft.sort} onChange={(sort) => setDraft((d) => ({ ...d, sort }))} />
      </View>
      <OptionGroup title="Genre" testID="movies-genres" items={options?.genres ?? []} value={draft.genre} onChange={(genre) => setDraft((d) => ({ ...d, genre }))} />
      <OptionGroup title="Language" testID="movies-languages" items={options?.languages ?? []} value={draft.language} onChange={(language) => setDraft((d) => ({ ...d, language }))} />
      <SwitchRow
        testID="movies-premiering"
        title="Premiering soon only"
        subtitle="Trailers now, the film on its date"
        on={draft.premiering}
        onChange={(premiering) => setDraft((d) => ({ ...d, premiering }))}
      />
      <Button testID="movies-filter-apply" label={label} onPress={() => onApply(draft)} disabled={count.data?.total === 0} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...font(700) },
  group: { gap: sheetMetrics.group },
});
