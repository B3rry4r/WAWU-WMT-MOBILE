import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Icon } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { CreateFrame } from '@/features/create/CreateFrame';
import { kindIcon } from '@/features/me/model';
import { font, space, useWawu } from '@/theme';

import { fetchPurchasesPage, purchasesKey, type PurchaseEntry } from './api';
import { EMPTY, rowLine, searchTerm } from './model';
import { PurchaseSearch } from './PurchaseSearch';

/** design/_gen/me.js `buyRow`: 13 between the picture and the words, 12 above and below, a 56 square picture with 14 corners; the title 15 / 600, the line 12.5, 3 under it. */
const rowMetrics = { between: 13, partsBetween: 14, padV: 12, thumb: 56, corner: 14, title: 15, titleLead: 20, line: 12.5, lineLead: 17, lineGap: 3, mark: 24 } as const;
/** How long the box waits after the last key before it asks the Hub (the search is a read, so a short pause is enough). */
export const SEARCH_WAIT_MS = 350;

export type PurchasesScreenProps = { onBack: () => void };

/**
 * M29 · My purchases. The pieces the person bought, newest first, from `GET /me/purchases`, each with the creator, the type and the
 * date, or for a course how far the person is ("3 of 12 done", the Hub's own count). The box searches by a part of a title or a
 * creator's handle on the Hub (2 characters or more). Each row's Watch, Read, Resume or Download opens the piece, which is HOME-03's
 * screen, so those buttons are not drawn until it adds them (R-47). The Hub lists only pieces: a ticket, a credit pack or a school
 * fee is on its own screen, never here.
 */
export function PurchasesScreen({ onBack }: PurchasesScreenProps) {
  const [typed, setTyped] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const wanted = searchTerm(typed);
    if (wanted === term) return undefined;
    const timer = setTimeout(() => setTerm(wanted), SEARCH_WAIT_MS);
    return () => clearTimeout(timer);
  }, [typed, term]);

  const list = useInfiniteQuery({
    queryKey: purchasesKey(term),
    queryFn: ({ pageParam }) => fetchPurchasesPage(term, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 0,
    // While a new search is on its way the rows of the last one stay, so typing does not flash the list.
    placeholderData: keepPreviousData,
  });
  const rows = useMemo(() => list.data?.pages.flatMap((page) => page.items) ?? [], [list.data]);
  const now = new Date();
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const more = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const empty = term === '' ? EMPTY.none : EMPTY.search(term);

  return (
    <CreateFrame testID="purchases-screen" title="My purchases" onLeave={onBack} gap={rowMetrics.partsBetween} onNearEnd={more}>
      <PurchaseSearch value={typed} onChange={setTyped} testID="purchases-search" />
      {list.isPending ? (
        <SkeletonRows count={5} testID="purchases-loading" />
      ) : list.isError && rows.length === 0 ? (
        <ErrorState
          testID="purchases-error"
          title="Couldn't load your purchases"
          message={isApiError(list.error) ? list.error.message : 'Check your connection and try again.'}
          onRetry={() => void list.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState testID="purchases-empty" icon={term === '' ? 'ShoppingBag' : 'SearchX'} title={empty.title} message={empty.message} />
      ) : (
        <View testID="purchases-list">
          {rows.map((entry) => (
            <PurchaseRow key={entry.id} entry={entry} line={rowLine(entry, now)} />
          ))}
          {isFetchingNextPage ? <SkeletonRows count={1} testID="purchases-more-loading" /> : null}
          {list.isFetchNextPageError && !isFetchingNextPage ? (
            <Pressable accessibilityRole="button" testID="purchases-more-retry" onPress={() => void fetchNextPage()} style={styles.moreFailed}>
              <Text variant="linkStrong">Couldn&apos;t load more. Try again</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </CreateFrame>
  );
}

function PurchaseRow({ entry, line }: { entry: PurchaseEntry; line: string }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const picture = entry.content.thumbnailUrl && !broken ? entry.content.thumbnailUrl : null;
  return (
    <View testID={`purchase-row-${entry.id}`} accessible accessibilityLabel={`${entry.content.title}, ${line}`} style={[styles.row, { borderBottomColor: colors.borderHairline }]}>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
        {picture ? (
          <Image source={{ uri: picture }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
        ) : (
          <Icon name={kindIcon(entry.content.contentType)} size={rowMetrics.mark} color={colors.textMuted} />
        )}
      </View>
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
          {entry.content.title}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={2} style={styles.line}>
          {line}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, paddingVertical: rowMetrics.padV, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: rowMetrics.thumb, height: rowMetrics.thumb, borderRadius: rowMetrics.corner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, minWidth: 0 },
  title: { fontSize: rowMetrics.title, lineHeight: rowMetrics.titleLead },
  line: { fontSize: rowMetrics.line, lineHeight: rowMetrics.lineLead, marginTop: rowMetrics.lineGap },
  moreFailed: { paddingVertical: space.lg, alignItems: 'center' },
});
