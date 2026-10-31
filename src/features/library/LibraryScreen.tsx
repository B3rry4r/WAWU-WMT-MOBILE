import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { IconButton } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { CreateFrame } from '@/features/create/CreateFrame';
import { AllowanceMeter } from '@/features/create/UploadsMeter';
import { pictureCandidates } from '@/features/feed/model';
import { usePicture } from '@/features/feed/usePicture';
import { kindIcon } from '@/features/me/model';
import { font, space, useWawu } from '@/theme';

import { countsKey, fetchCounts, fetchLibraryPage, listKey, type LibraryFilter, type LibraryPiece } from './api';
import { EMPTY, chipsOf, pillOf, rowLine } from './model';

/** design/_gen/me.js line 96, `libRow`: 13 between the picture and the words, 12 above and below, a 52 square picture with 12 corners; the title 15 / 600, the line 12.5, 3 under it. */
const rowMetrics = { between: 13, partsBetween: 14, padV: 12, thumb: 52, corner: 12, title: 15, line: 12.5, lineGap: 3, mark: 22 } as const;

export type LibraryScreenProps = {
  onBack: () => void;
  /** The Plus in the bar starts a new piece (M19). */
  onCreate: () => void;
  /** "see why" on a turned-down piece opens M26. */
  onSeeWhy: (id: string) => void;
};

/**
 * M28 · My content. The person's own pieces, live, in review and turned down, each with its kind, price and sales (all from `GET
 * /content/mine/library`), the uploads meter from the Hub's own count (`GET /uploads/allowance`) and the chips with the Hub's counts
 * (`GET /content/mine/library/counts`). A turned-down piece opens M26 ("see why"). A live piece has no page of its own to open yet
 * (the content detail is HOME-03's) and a piece in review has no screen drawn, so those rows are not pressed (G-ME-07-1). The meter's
 * "Get verified" is added by ME-12 (R-47).
 */
export function LibraryScreen({ onBack, onCreate, onSeeWhy }: LibraryScreenProps) {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const counts = useQuery({ queryKey: countsKey, queryFn: fetchCounts, staleTime: 0 });
  const list = useInfiniteQuery({
    queryKey: listKey(filter),
    queryFn: ({ pageParam }) => fetchLibraryPage(filter, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: 0,
  });
  // Back from M26 after a delete or a send, and back from the Create steps, shows what the Hub now holds. The first focus is the
  // screen opening, which the two queries above already answer.
  const refetchCounts = counts.refetch;
  const refetchList = list.refetch;
  const opened = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!opened.current) {
        opened.current = true;
        return;
      }
      void refetchCounts();
      void refetchList();
    }, [refetchCounts, refetchList]),
  );
  const pieces = useMemo(() => list.data?.pages.flatMap((page) => page.pieces) ?? [], [list.data]);
  const now = new Date();
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const more = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <CreateFrame
      testID="library-screen"
      title="My content"
      onLeave={onBack}
      gap={rowMetrics.partsBetween}
      onNearEnd={more}
      trailing={<IconButton icon="Plus" label="New piece" onPress={onCreate} testID="library-create" />}
    >
      <AllowanceMeter />
      <FilterChips testID="library-chip" label="Filter my content" items={chipsOf(counts.data)} value={filter} onChange={setFilter} inset={0} />
      {list.isPending ? (
        <SkeletonRows count={5} testID="library-loading" />
      ) : list.isError && pieces.length === 0 ? (
        <ErrorState
          testID="library-error"
          title="Couldn't load your content"
          message={isApiError(list.error) ? list.error.message : 'Check your connection and try again.'}
          onRetry={() => void list.refetch()}
        />
      ) : pieces.length === 0 ? (
        <EmptyState testID="library-empty" icon="Library" title={EMPTY[filter].title} message={EMPTY[filter].message} />
      ) : (
        <View testID="library-list">
          {pieces.map((piece) => (
            <PieceRow key={piece.id} piece={piece} line={rowLine(piece, now)} onSeeWhy={() => onSeeWhy(piece.id)} />
          ))}
          {isFetchingNextPage ? <SkeletonRows count={1} testID="library-more-loading" /> : null}
          {list.isFetchNextPageError && !isFetchingNextPage ? (
            <Pressable accessibilityRole="button" testID="library-more-retry" onPress={() => void fetchNextPage()} style={styles.moreFailed}>
              <Text variant="linkStrong">Couldn&apos;t load more. Try again</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </CreateFrame>
  );
}

function PieceRow({ piece, line, onSeeWhy }: { piece: LibraryPiece; line: string; onSeeWhy: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const pill = pillOf(piece.status);
  // Only a turned-down piece opens something (M26). A live piece's own page is HOME-03's and a piece in review has no screen drawn, so
  // neither row is pressed (R-47, G-ME-07-1).
  const opens = piece.status === 'rejected';
  // The creator's cover first (R-114), then the preview when it is a picture.
  const { uri: still, onError: stillFailed } = usePicture(pictureCandidates(piece, piece.previewAssetUrl));
  const body = (
    <>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
        {still ? (
          <Image testID="library-thumb-image" source={{ uri: still }} contentFit="cover" style={StyleSheet.absoluteFill} onError={stillFailed} />
        ) : (
          <View testID="library-thumb-mark">
            <Icon name={kindIcon(piece.contentType)} size={rowMetrics.mark} color={colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
          {piece.title}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.line}>
          {line}
        </Text>
      </View>
      {pill ? (
        <View style={styles.pill}>
          <StatusPill label={pill.label} tone={pill.tone} icon={pill.icon} />
        </View>
      ) : null}
    </>
  );
  const row = [styles.row, { borderBottomColor: colors.borderHairline }];
  const label = [piece.title, line, pill?.label].filter(Boolean).join(', ');
  return opens ? (
    <Pressable testID={`library-row-${piece.id}`} accessibilityRole="button" accessibilityLabel={label} onPress={onSeeWhy} {...ring.handlers} style={[...row, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={`library-row-${piece.id}`} accessible accessibilityLabel={label} style={row}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, paddingVertical: rowMetrics.padV, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: rowMetrics.thumb, height: rowMetrics.thumb, borderRadius: rowMetrics.corner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, minWidth: 0 },
  // The pill centres on the row, as the board draws it (a StatusPill sits at the top of its parent unless told otherwise).
  pill: { alignSelf: 'center' },
  title: { fontSize: rowMetrics.title },
  line: { fontSize: rowMetrics.line, marginTop: rowMetrics.lineGap },
  moreFailed: { paddingVertical: space.lg, alignItems: 'center' },
});
