import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { CreateFrame } from '@/features/create/CreateFrame';
import { pictureCandidates } from '@/features/feed/model';
import { usePicture } from '@/features/feed/usePicture';
import { kindIcon } from '@/features/me/model';
import { font, space, useWawu } from '@/theme';

import { fetchPurchasesPage, purchasesKey, type PurchaseEntry } from './api';
import { EMPTY, KIND_ICONS, actionOf, rowLine, searchTerm, targetOf, type PurchaseTarget } from './model';
import { PurchaseSearch } from './PurchaseSearch';

/** design/_gen/me.js `buyRow`: 13 between the picture and the words, 12 above and below, a 56 square picture with 14 corners; the title 15 / 600, the line 12.5, 3 under it. */
const rowMetrics = { between: 13, partsBetween: 14, padV: 12, thumb: 56, corner: 14, title: 15, titleLead: 20, line: 12.5, lineLead: 17, lineGap: 3, mark: 24 } as const;
/** How long the box waits after the last key before it asks the Hub (the search is a read, so a short pause is enough). */
export const SEARCH_WAIT_MS = 350;

export type PurchasesScreenProps = {
  onBack: () => void;
  /** What a purchase opens: the piece, the ticket, My courses or the community's room. Left out, no row is pressed. */
  onOpen?: (target: PurchaseTarget) => void;
};

/**
 * M29 · My purchases. Everything the person paid for, newest first, from `GET /me/purchases/all`: the pieces they unlocked (with the
 * creator, the type and the date, or for a course how far they are, "3 of 12 done", the Hub's own count), tickets, credit packs, school
 * fees and community passes (what it is, the day and what was paid), a purchase the Hub paid back marked "Refunded". The box searches
 * by a part of a title or a creator's handle on the Hub (2 characters or more). A row opens what it bought where that screen exists: a
 * piece (H19/H20), a ticket (E5), My courses (SC8) for a school fee, a community's room for a pass; a piece also has the board's Watch,
 * Read or Resume. Download is not drawn (no download screen is built), nor is anything for a credit pack (nothing to open).
 */
export function PurchasesScreen({ onBack, onOpen }: PurchasesScreenProps) {
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
            <PurchaseRow key={entry.id} entry={entry} line={rowLine(entry, now)} onOpen={onOpen} />
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

function PurchaseRow({ entry, line, onOpen }: { entry: PurchaseEntry; line: string; onOpen?: (target: PurchaseTarget) => void }) {
  const { colors } = useWawu();
  const piece = entry.kind === 'content_unlock' ? entry.content : null;
  // The Hub's thumbnail is the piece's public file: a clip or a PDF for most kinds, which is never handed to Image (it would be fetched to fail).
  // The creator's cover first (R-114), then the thumbnail when it is a picture.
  const { uri: picture, onError: pictureFailed } = usePicture(piece ? pictureCandidates(piece, piece.thumbnailUrl) : []);
  const glyph = entry.kind === 'content_unlock' ? kindIcon(piece?.contentType ?? 'video') : KIND_ICONS[entry.kind];
  const target = onOpen ? targetOf(entry) : null;
  const action = target ? actionOf(entry) : null;
  const label = `${entry.title}, ${line}`;
  const body = (
    <>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
        {picture ? (
          <Image testID="purchase-thumb-image" source={{ uri: picture }} contentFit="cover" style={StyleSheet.absoluteFill} onError={pictureFailed} />
        ) : (
          <View testID="purchase-thumb-mark">
            <Icon name={glyph} size={rowMetrics.mark} color={colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.title]}>
          {entry.title}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={2} style={styles.line}>
          {line}
        </Text>
      </View>
    </>
  );
  return (
    <View testID={`purchase-row-${entry.id}`} style={[styles.row, { borderBottomColor: colors.borderHairline }]}>
      {target ? (
        <Pressable accessibilityRole="button" accessibilityLabel={label} testID={`purchase-open-${entry.id}`} onPress={() => onOpen?.(target)} style={styles.press}>
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={label} style={styles.press}>
          {body}
        </View>
      )}
      {target && action ? <Button testID={`purchase-action-${entry.id}`} label={action} variant="secondary" size="sm" onPress={() => onOpen?.(target)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, paddingVertical: rowMetrics.padV, borderBottomWidth: StyleSheet.hairlineWidth },
  thumb: { width: rowMetrics.thumb, height: rowMetrics.thumb, borderRadius: rowMetrics.corner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  press: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  words: { flex: 1, minWidth: 0 },
  title: { fontSize: rowMetrics.title, lineHeight: rowMetrics.titleLead },
  line: { fontSize: rowMetrics.line, lineHeight: rowMetrics.lineLead, marginTop: rowMetrics.lineGap },
  moreFailed: { paddingVertical: space.lg, alignItems: 'center' },
});
