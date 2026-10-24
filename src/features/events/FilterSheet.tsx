import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Skeleton, LoadingView } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, useWawu } from '@/theme';

import { countKey, fetchCount, type EventCategory, type EventFilters, type EventKind, type EventOptions, type EventsView } from './api';

const ALL_KINDS = 'all';
const EVERY_CATEGORY = 'every';
const WHEN: readonly { value: EventsView; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];
/** design/_gen/events.js `filters`: the sheet's parts sit 16 apart, each label 10 above its choices; the list is held to what fits under the grabber. */
const GAP = space.lg;
const LABEL_GAP = 10;
const LIST_MAX_H = 360;
const CHEVRON = 18;
const SKELETON_CHIP_H = 38;
const SKELETON_CHIP_W = 96;

export type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** What is applied now: the sheet opens on it. */
  filters: EventFilters;
  /** The words for each kind and category, as the Hub sends them. */
  options: {
    data?: EventOptions;
    isError: boolean;
    isPending: boolean;
    error: unknown;
    refetch: () => void;
  };
  onApply: (filters: EventFilters) => void;
};

/** "Show 24 events", "Show 1 event": the count the Hub reports for the picks. */
export function showLabel(total: number | undefined): string {
  if (total === undefined) return 'Show events';
  return total === 1 ? 'Show 1 event' : `Show ${total} events`;
}

/** E8 · Filters: when, kind and category over the Events screen, and a button that says how many events they show. */
export function FilterSheet({ visible, onClose, filters, options, onApply }: FilterSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Browse the calendar" gap={GAP} testID="events-filters">
      {visible ? <FilterBody filters={filters} options={options} onApply={onApply} /> : null}
    </BottomSheet>
  );
}

/** Mounted each time the sheet opens, so its picks start from what is applied now. */
function FilterBody({ filters, options, onApply }: Pick<FilterSheetProps, 'filters' | 'options' | 'onApply'>) {
  const [draft, setDraft] = useState<EventFilters>(filters);
  const [picking, setPicking] = useState(false);

  const count = useQuery({ queryKey: countKey(draft), queryFn: () => fetchCount(draft) });
  const kinds = options.data?.types ?? [];
  const categories = options.data?.categories ?? [];
  const categoryLabel = categories.find((c) => c.value === draft.category)?.label ?? 'Every category';

  if (picking) {
    return (
      <CategoryList
        categories={categories}
        value={draft.category}
        onPick={(category) => {
          setDraft({ ...draft, category });
          setPicking(false);
        }}
        onBack={() => setPicking(false)}
      />
    );
  }

  return (
    <>
      <Text variant="sheetTitleSm">Browse the calendar</Text>
      <View style={styles.group}>
        <Text variant="label">When</Text>
        <FilterChips variant="option" label="When" items={WHEN} value={draft.view} onChange={(view) => setDraft({ ...draft, view })} />
      </View>
      {options.isPending ? (
        <LoadingView label="Loading the choices">
          <View style={styles.group}>
            <Text variant="label">Kind</Text>
            <View style={styles.skeletons}>
              <Skeleton width={SKELETON_CHIP_W} height={SKELETON_CHIP_H} radius={SKELETON_CHIP_H} />
              <Skeleton width={SKELETON_CHIP_W} height={SKELETON_CHIP_H} radius={SKELETON_CHIP_H} />
            </View>
          </View>
        </LoadingView>
      ) : options.isError ? (
        <ErrorState
          title="Couldn't load the choices"
          message={isApiError(options.error) ? options.error.message : 'Check your connection and try again.'}
          onRetry={options.refetch}
          testID="events-filters-error"
        />
      ) : (
        <>
          <View style={styles.group}>
            <Text variant="label">Kind</Text>
            <FilterChips
              variant="option"
              label="Kind"
              items={[{ value: ALL_KINDS, label: 'All' }, ...kinds.map((k) => ({ value: k.value as string, label: k.label }))]}
              value={draft.kind ?? ALL_KINDS}
              onChange={(value) => setDraft({ ...draft, kind: value === ALL_KINDS ? null : (value as EventKind) })}
            />
          </View>
          <View style={styles.group}>
            <Text variant="label">Category</Text>
            <CategoryField label={categoryLabel} onPress={() => setPicking(true)} />
          </View>
        </>
      )}
      <Button testID="events-filters-apply" label={showLabel(count.data)} onPress={() => onApply(draft)} full />
    </>
  );
}

function CategoryField({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="events-filters-category"
      accessibilityRole="button"
      accessibilityLabel={`Category, ${label}`}
      accessibilityHint="Opens the list of categories"
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.field,
        {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceInput,
          borderColor: colors.borderHairline,
        },
        ring.style,
      ]}
    >
      <Text variant="body" numberOfLines={1} style={[font(500), styles.fieldValue]}>
        {label}
      </Text>
      <Icon name="ChevronDown" size={CHEVRON} color={colors.textMuted} />
    </Pressable>
  );
}

type CategoryListProps = {
  categories: EventOptions['categories'];
  value: EventCategory | null;
  onPick: (category: EventCategory | null) => void;
  onBack: () => void;
};

/** The category choices, one to a row, inside the same sheet. */
function CategoryList({ categories, value, onPick, onBack }: CategoryListProps) {
  const { colors } = useWawu();
  const rows: { value: EventCategory | null; label: string }[] = [{ value: null, label: 'Every category' }, ...categories];
  return (
    <>
      <View style={styles.listHead}>
        <Pressable
          testID="events-filters-back"
          accessibilityRole="button"
          accessibilityLabel="Back to filters"
          hitSlop={space.md}
          onPress={onBack}
        >
          <Icon name="ChevronLeft" size={space.s2xl} color={colors.textPrimary} />
        </Pressable>
        <Text variant="sheetTitleSm">Category</Text>
      </View>
      <ScrollView style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Category">
        {rows.map((row) => {
          const selected = row.value === value;
          return (
            <Pressable
              key={row.value ?? EVERY_CATEGORY}
              testID={`events-category-${row.value ?? EVERY_CATEGORY}`}
              accessibilityRole="radio"
              accessibilityLabel={row.label}
              accessibilityState={{ checked: selected }}
              onPress={() => onPick(row.value)}
              style={[styles.listRow, { borderBottomColor: colors.borderHairline }]}
            >
              <Text variant="body" style={[font(selected ? 700 : 500), styles.fieldValue]}>
                {row.label}
              </Text>
              {selected ? <Icon name="Check" size={space.xl} color={colors.accentFg} strokeWidth={2.4} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: LABEL_GAP },
  skeletons: { flexDirection: 'row', gap: space.sm },
  field: {
    height: fieldMetrics.height,
    borderRadius: fieldMetrics.radius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  fieldValue: { flex: 1, fontSize: fieldMetrics.value },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  list: { maxHeight: LIST_MAX_H },
  listRow: {
    minHeight: fieldMetrics.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
