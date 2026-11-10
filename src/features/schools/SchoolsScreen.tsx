import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button, pressScale } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { LoadingView, Skeleton, SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { NavBar } from '@/features/events/chrome';
import { RefreshFailed } from '@/features/professionals/parts';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { fetchSchoolsPage, schoolsKeys, type SchoolCard } from './api';
import { cardLine, categoryChips, cleanQuery, emptyCopy, fromText, rowsOf, SEARCH_MAX, type CategoryChoice } from './model';
import { Cover, Fee, SchoolLogo, SearchPill } from './parts';
import { SEARCH_DELAY_MS, useDebounced } from './useDebounced';

/**
 * design/_gen/schools.js `list` and `sch`: the body pads 8 above with 14 between the search, the chips and each card
 * (`body(..., { gap: 14 })`); a card is the card colour at corner 22 with a hairline, a 110 picture, then 12 above and
 * below and 14 at the sides with 12 between a 44 logo (corner 14, 3 ring in the card colour, pulled 34 up over the
 * picture), the words (name 15.5 at 700, the line under it 12.5 muted, 2 below) and the price (the word "from" 11.5
 * muted, then the amount 14.5, with its kobo only when it has some; a lowest fee of nothing reads "Free" with no "from"). The words sit on the canvas's normal line.
 */
export const schoolsMetrics = {
  bodyTop: space.sm,
  partGap: 14,
  bottom: 40,
  /** `body` default bottom padding in design/_gen/kit.js; SC10 centres its block in what is left above it. */
  emptyBottom: 120,
  cover: 110,
  rowPadV: 12,
  rowPadH: 14,
  between: 12,
  logo: 44,
  logoCorner: 14,
  logoInitials: 16,
  logoRing: 3,
  logoRise: 34,
  name: 15.5,
  line: 12.5,
  lineGap: 2,
  from: 11.5,
  price: 14.5,
  skeletonCards: 3,
} as const;

export type SchoolsScreenProps = {
  onBack: () => void;
  /** A school was tapped: its page (SC2). */
  onOpen: (id: string) => void;
};

/** SC1 · Schools, and SC10 when a search or a category matches none: search, category chips and the schools, a page at a time. */
export function SchoolsScreen({ onBack, onOpen }: SchoolsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const [typed, setTyped] = useState('');
  const [category, setCategory] = useState<CategoryChoice>('all');
  const { settled, flush } = useDebounced(typed, SEARCH_DELAY_MS);
  // What goes to the Hub: the settled text with control characters and broken halves taken out, cut to its limit.
  const q = cleanQuery(settled);
  const [pulled, setPulled] = useState(false);

  const list = useInfiniteQuery(
    {
      queryKey: schoolsKeys.list(category, q),
      queryFn: ({ pageParam }) => fetchSchoolsPage(category, q, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      // While a new search or category is on its way, the rows from before stay; the screen never flashes empty between keys.
      placeholderData: keepPreviousData,
    },
    queryClient,
  );
  const rows = rowsOf(list.data?.pages);
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = list;

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  }, [refetch]);

  // Set the moment the next page is asked for and cleared when it settles: `isFetchingNextPage` is state and lags the ask
  // by a render, so a second end-reached in the same tick would otherwise ask again.
  const asking = useRef(false);
  const onEndReached = useCallback(() => {
    if (asking.current || !hasNextPage || isFetchingNextPage || isFetchNextPageError || list.isPlaceholderData) return;
    asking.current = true;
    void fetchNextPage().finally(() => {
      asking.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, list.isPlaceholderData, fetchNextPage]);

  // A refresh that failed while rows from before are on screen: the rows stay, a line says so.
  const refreshFailed = list.isRefetchError && !isFetchNextPageError && rows.length > 0;
  // Nothing to draw yet: the first read, or a new search or category after an empty one.
  const loading = list.isPending || (list.isPlaceholderData && rows.length === 0);
  let state = null;
  let empty = false;
  if (loading) {
    state = <SchoolsSkeleton />;
  } else if (list.isError && !list.data) {
    const offline = isApiError(list.error) && list.error.kind === 'network';
    state = (
      <ErrorState
        testID="schools-error"
        title="Couldn’t load schools"
        message={offline ? 'No connection. Check your internet and try again.' : isApiError(list.error) ? list.error.message : 'Something went wrong. Try again.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void refetch()}
      />
    );
  } else if (rows.length === 0) {
    empty = true;
    const copy = emptyCopy(category, q);
    state = <EmptyState testID="schools-empty" icon="GraduationCap" title={copy.title} message={copy.message} />;
  }
  const centred = state !== null && !loading;

  return (
    <KeyboardAvoidingView testID="schools-directory" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Schools" onBack={onBack} backTestID="schools-back" />
      <View style={styles.head}>
        <View style={styles.gutter}>
          <SearchPill value={typed} maxLength={SEARCH_MAX} onChange={setTyped} onSubmit={flush} testID="schools-search" />
        </View>
        <FilterChips items={categoryChips} value={category} onChange={setCategory} label="Filter by category" testID="schools-chips" />
        {refreshFailed ? (
          <View style={styles.gutter}>
            <RefreshFailed onRetry={() => void refetch()} testID="schools-refresh-failed" />
          </View>
        ) : null}
      </View>
      <FlatList
        testID="schools-list"
        data={state ? [] : rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SchoolRow school={item} onPress={() => onOpen(item.id)} />}
        ItemSeparatorComponent={Gap}
        ListEmptyComponent={state}
        ListFooterComponent={
          isFetchNextPageError ? (
            <View style={styles.footer} testID="schools-more-error">
              <Text variant="secondary" accessibilityRole="alert">
                Couldn’t load more schools.
              </Text>
              <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={() => void fetchNextPage()} testID="schools-more-retry" />
            </View>
          ) : isFetchingNextPage ? (
            <SkeletonRows count={2} testID="schools-loading-more" />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: empty ? schoolsMetrics.emptyBottom : insets.bottom + schoolsMetrics.bottom }, centred && styles.centred]}
      />
    </KeyboardAvoidingView>
  );
}

function Gap() {
  return <View style={styles.gap} />;
}

/** SC1 while the first schools are on their way: a card's shapes (its picture, logo, two lines and a price), as many times as `skeletonCards`. */
function SchoolsSkeleton() {
  const { colors } = useWawu();
  return (
    <LoadingView label="Loading schools" testID="schools-loading">
      <View style={styles.skeletonStack}>
        {Array.from({ length: schoolsMetrics.skeletonCards }, (_, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
            <Skeleton height={schoolsMetrics.cover} radius={0} />
            <View style={styles.row}>
              <Skeleton width={schoolsMetrics.logo} height={schoolsMetrics.logo} radius={schoolsMetrics.logoCorner} />
              <View style={styles.words}>
                <Skeleton width="70%" height={schoolsMetrics.name} />
                <Skeleton width="45%" height={schoolsMetrics.line} style={styles.skeletonLine} />
              </View>
              <Skeleton width={schoolsMetrics.logo} height={schoolsMetrics.price} />
            </View>
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

/** One school: its picture, its logo, its name, where it is and how many courses it has, and the lowest course fee. */
export function SchoolRow({ school, onPress }: { school: SchoolCard; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const from = school.fromPriceKobo;
  const label = [school.name, cardLine(school), from === null ? null : fromText(from)].filter(Boolean).join(', ');
  return (
    <Pressable
      testID={`schools-row-${school.id}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
          transform: [{ scale: pressed ? pressScale : 1 }],
        },
        ring.style,
      ]}
    >
      <Cover height={schoolsMetrics.cover} testID={`schools-cover-${school.id}`} />
      <View style={styles.row}>
        <SchoolLogo
          school={school}
          size={schoolsMetrics.logo}
          corner={schoolsMetrics.logoCorner}
          initials={schoolsMetrics.logoInitials}
          ring={{ width: schoolsMetrics.logoRing, color: 'surfaceCard' }}
          rise={schoolsMetrics.logoRise}
          testID={`schools-logo-${school.id}`}
        />
        <View style={styles.words}>
          <Text variant="body" numberOfLines={1} style={styles.name}>
            {school.name}
          </Text>
          <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.line}>
            {cardLine(school)}
          </Text>
        </View>
        {from === null ? null : (
          <View style={styles.price}>
            {from === 0 ? null : (
              <Text variant="body" tone="textMuted" style={styles.from}>
                from
              </Text>
            )}
            <Fee kobo={from} size={schoolsMetrics.price} testID={`schools-price-${school.id}`} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingTop: schoolsMetrics.bodyTop, gap: schoolsMetrics.partGap },
  gutter: { paddingHorizontal: layout.gutter },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingTop: schoolsMetrics.partGap, paddingHorizontal: layout.gutter },
  centred: { justifyContent: 'center' },
  gap: { height: schoolsMetrics.partGap },
  skeletonStack: { gap: schoolsMetrics.partGap },
  skeletonLine: { marginTop: schoolsMetrics.lineGap },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  card: { borderRadius: radius.card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: schoolsMetrics.between, paddingVertical: schoolsMetrics.rowPadV, paddingHorizontal: schoolsMetrics.rowPadH },
  words: { flex: 1, minWidth: 0 },
  name: { ...font(700), fontSize: schoolsMetrics.name, lineHeight: canvasNormalLineHeight(schoolsMetrics.name) },
  line: { fontSize: schoolsMetrics.line, lineHeight: canvasNormalLineHeight(schoolsMetrics.line), marginTop: schoolsMetrics.lineGap },
  price: { alignItems: 'flex-end' },
  from: { fontSize: schoolsMetrics.from, lineHeight: canvasNormalLineHeight(schoolsMetrics.from) },
});
