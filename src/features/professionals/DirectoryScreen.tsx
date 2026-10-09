import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { VerifiedTick } from '@/components/icon';
import { Money, formatMoney } from '@/components/Money';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { fetchFields, proKeys } from '@/features/pro-listing/api';
import { canvasNormalLineHeight, font, layout, space, useWawu } from '@/theme';

import { fetchDirectoryPage, prosKeys, type DirectoryEntry } from './api';
import { chosenField, emptyCopy, fieldChips, hasProTick, messagePrice, rowsOf, type FieldChoice } from './model';
import { ProsNav, RefreshFailed } from './parts';

/**
 * design/_gen/pros.js `list` and `listEmpty`: the body pads 8 above with 14 between its parts (`body(..., { gap: 14 })`);
 * `proRow`: 14 above and below with a hairline under it, a 56 avatar 13 from the words, the name 15.5 at 600 with a 15
 * tick 5 after it, the headline 13 (2 under the name), the field 12 at 600 in the accent (4 under), the price 14.5
 * without kobo and "a message" 11.5 (3 under it). No line in the row sets a line height, so each sits on the canvas's
 * normal line.
 */
export const directoryMetrics = {
  bodyTop: space.sm,
  gap: 14,
  bottom: 40,
  rowPadV: 14,
  avatar: 56,
  between: 13,
  name: 15.5,
  tick: 15,
  tickGap: 5,
  headline: 13,
  headlineGap: 2,
  field: 12,
  fieldGap: 4,
  price: 14.5,
  per: 11.5,
  perGap: 3,
  skeletonRows: 5,
} as const;

export type DirectoryScreenProps = {
  /** The field the route opened on (`?field=`); anything the Hub does not serve opens All. */
  initial?: string | string[];
  onBack: () => void;
  /** A professional was tapped: their profile (P2, or P3 when they are not taking messages). */
  onOpen: (id: string) => void;
  /** P4's "Offer your services": P5, starting from the field the person was looking at (none on All). */
  onOfferServices: (field: string | undefined) => void;
  /** The chip changed, so the route can carry it (a back step lands on the same field). */
  onChange?: (field: FieldChoice) => void;
};

/** P1 and P4: listed professionals, filtered by field, a page at a time. */
export function DirectoryScreen({ initial, onBack, onOpen, onOfferServices, onChange }: DirectoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const fields = useQuery({ queryKey: proKeys.fields, queryFn: fetchFields }, queryClient);
  const fieldList = fields.data ?? [];
  const [picked, setPicked] = useState<FieldChoice | undefined>(undefined);
  const choice = picked ?? chosenField(initial, fieldList);
  const [pulled, setPulled] = useState(false);

  const directory = useInfiniteQuery(
    {
      queryKey: prosKeys.directory(choice),
      queryFn: ({ pageParam }) => fetchDirectoryPage(choice, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled: fields.isSuccess,
    },
    queryClient,
  );
  const rows = rowsOf(directory.data?.pages);
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = directory;

  const pick = (next: FieldChoice) => {
    setPicked(next);
    onChange?.(next);
  };

  const refetchFields = fields.refetch;
  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await Promise.all([refetchFields(), refetch()]);
    } finally {
      setPulled(false);
    }
  }, [refetchFields, refetch]);

  const onEndReached = useCallback(() => {
    if (rows.length > 0 && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [rows.length, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const failure = fields.error ?? directory.error;
  // A refresh that failed while rows from before are on screen: the rows stay, a line says so.
  const refreshFailed = directory.isRefetchError && !isFetchNextPageError && rows.length > 0;
  let state = null;
  let empty = false;
  if (fields.isPending || (fields.isSuccess && directory.isPending)) {
    state = <SkeletonRows count={directoryMetrics.skeletonRows} testID="pros-loading" />;
  } else if ((fields.isError && !fields.data) || (directory.isError && !directory.data)) {
    const offline = isApiError(failure) && failure.kind === 'network';
    state = (
      <ErrorState
        testID="pros-error"
        title="Couldn’t load professionals"
        message={offline ? 'No connection. Check your internet and try again.' : isApiError(failure) ? failure.message : 'Something went wrong. Try again.'}
        icon={offline ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void (fields.isError ? refetchFields() : refetch())}
      />
    );
  } else if (rows.length === 0) {
    empty = true;
    const copy = emptyCopy(choice, fieldList);
    state = (
      <EmptyState
        testID="pros-empty"
        icon="BriefcaseBusiness"
        title={copy.title}
        message={copy.message}
        action={{ label: 'Offer your services', onPress: () => onOfferServices(choice === 'all' ? undefined : choice) }}
      />
    );
  }
  const centred = state !== null && !(fields.isPending || directory.isPending);

  return (
    <View testID="pros-directory" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ProsNav title="Professionals" onBack={onBack} />
      <View style={styles.head}>
        {/* P4 draws the chips straight under the bar: the line about the directory goes with its rows. */}
        {empty ? null : (
          <Text variant="muted" style={styles.intro} testID="pros-intro">
            Vetted practitioners.
          </Text>
        )}
        {fieldList.length > 0 ? <FilterChips items={fieldChips(fieldList)} value={choice} onChange={pick} label="Filter by field" revealSelected testID="pros-chips" /> : null}
        {refreshFailed ? (
          <View style={styles.gutter}>
            <RefreshFailed onRetry={() => void refetch()} testID="pros-refresh-failed" />
          </View>
        ) : null}
      </View>
      <FlatList
        testID="pros-list"
        data={state ? [] : rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProRow entry={item} onPress={() => onOpen(item.id)} />}
        ListEmptyComponent={state}
        ListFooterComponent={
          isFetchNextPageError ? (
            <View style={styles.footer} testID="pros-more-error">
              <Text variant="secondary" accessibilityRole="alert">
                Couldn’t load more professionals.
              </Text>
              <Button label="Try again" variant="secondary" size="sm" icon="RotateCw" onPress={() => void fetchNextPage()} testID="pros-more-retry" />
            </View>
          ) : isFetchingNextPage ? (
            <SkeletonRows count={2} testID="pros-loading-more" />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + directoryMetrics.bottom }, centred && styles.centred]}
      />
    </View>
  );
}

/** One professional: who they are, their field, and the price of a message when they take messages. */
export function ProRow({ entry, onPress }: { entry: DirectoryEntry; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const price = messagePrice(entry);
  const label = [entry.name, entry.headline, entry.field.label, price !== null ? `${formatMoney(price, { decimals: false })} a message` : null].filter(Boolean).join(', ');
  return (
    <Pressable
      testID={`pros-row-${entry.id}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceSunken : 'transparent',
          boxShadow: [{ offsetX: 0, offsetY: -1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <Avatar name={entry.name} hue={hueFor(entry.wawuId)} size={directoryMetrics.avatar} source={entry.avatarUrl ?? undefined} decorative />
      <View style={styles.words}>
        <View style={styles.nameLine}>
          <Text variant="body" numberOfLines={1} style={styles.name}>
            {entry.name}
          </Text>
          {hasProTick(entry) ? <VerifiedTick kind="pro" size={directoryMetrics.tick} /> : null}
        </View>
        <Text variant="body" tone="textSecondary" numberOfLines={2} style={styles.headline}>
          {entry.headline}
        </Text>
        <Text variant="body" tone="accentFg" numberOfLines={1} style={styles.field}>
          {entry.field.label}
        </Text>
      </View>
      {price !== null ? (
        <View style={styles.price}>
          <Money minorUnits={price} decimals={false} size={directoryMetrics.price} testID={`pros-price-${entry.id}`} />
          <Text variant="body" tone="textMuted" style={styles.per}>
            a message
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingTop: directoryMetrics.bodyTop, gap: directoryMetrics.gap },
  intro: { paddingHorizontal: layout.gutter },
  gutter: { paddingHorizontal: layout.gutter },
  list: { flex: 1 },
  content: { flexGrow: 1, paddingTop: directoryMetrics.gap, paddingHorizontal: layout.gutter },
  centred: { justifyContent: 'center' },
  footer: { alignItems: 'center', gap: space.sm, paddingVertical: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: directoryMetrics.between, paddingVertical: directoryMetrics.rowPadV },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: directoryMetrics.tickGap },
  name: { ...font(600), flexShrink: 1, fontSize: directoryMetrics.name, lineHeight: canvasNormalLineHeight(directoryMetrics.name) },
  headline: { fontSize: directoryMetrics.headline, lineHeight: canvasNormalLineHeight(directoryMetrics.headline), marginTop: directoryMetrics.headlineGap },
  field: { ...font(600), fontSize: directoryMetrics.field, lineHeight: canvasNormalLineHeight(directoryMetrics.field), marginTop: directoryMetrics.fieldGap },
  price: { alignItems: 'flex-end' },
  per: { fontSize: directoryMetrics.per, lineHeight: canvasNormalLineHeight(directoryMetrics.per), marginTop: directoryMetrics.perGap },
});
