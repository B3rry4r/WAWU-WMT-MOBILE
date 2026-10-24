import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { FilterChips } from '@/components/FilterChips';
import { Icon, type IconName } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { CreateFrame } from '@/features/create/CreateFrame';
import { countsKey } from '@/features/me/counts';
import { kindIcon } from '@/features/me/model';
import { font, space, useWawu } from '@/theme';

import { fetchSavedPage, removeSaved, savedKey, savedRoot, type SavedEntry, type SavedPage, type SavedTab } from './api';
import { EMPTY, TABS, metaOf, titleOf } from './model';

/** design/_gen/me.js `saved`: a two column grid, 10 apart; a 150 high picture with 18 corners, the 30 round mark 8 in from its top right corner, 8 to the title (14 / 600) and the line (12.5). */
const tileMetrics = { cells: 10, picture: 150, corner: 18, mark: 30, markInset: 8, markIcon: 15, textGap: 8, titleSize: 14, titleLead: 18, line: 12.5, lineLead: 16, partsBetween: 14 } as const;
/** How long the notice of a save that could not be taken back stays up. */
export const NOTICE_MS = 4000;

export type SavedScreenProps = {
  onBack: () => void;
  /** A saved event opens E2. */
  onOpenEvent: (id: string) => void;
  /** A saved piece opens its own page (HOME-03, `/content/<id>`). Left out, a piece's tile is not pressed. A saved creator opens nothing until ME-02 adds their profile. */
  onOpenContent?: (id: string) => void;
};

/** The cache without the save the Hub has taken back. */
function without(data: InfiniteData<SavedPage, string | null> | undefined, id: string) {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.filter((entry) => entry.id !== id) })) };
}

/**
 * M30 · Saved. What the person kept, newest first, from `GET /me/saved`, by the chips All, Content, Events and Creators. The mark on a
 * tile takes the save back (`DELETE` on the piece, the event or the creator): the tile goes at once and comes back, in its place and with
 * a notice, if the Hub refuses (each take-back on its own, so two in flight cannot undo each other). A saved event opens E2 and a saved piece its own page (HOME-03); a creator opens nothing until ME-02 adds their profile.
 */
export function SavedScreen({ onBack, onOpenEvent, onOpenContent }: SavedScreenProps) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<SavedTab>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const list = useInfiniteQuery({
    queryKey: savedKey(tab),
    queryFn: ({ pageParam }) => fetchSavedPage(tab, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 0,
  });
  // Back from an event (where it may have been un-saved) shows what the Hub now holds. The first focus is the screen opening.
  const refetch = list.refetch;
  const opened = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!opened.current) {
        opened.current = true;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  // A save being taken back is hidden by its id while the Hub is asked; the cache is not written until the Hub agrees. A refusal only
  // stops hiding that one entry, so it comes back in its own place whatever else is in flight.
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(() => new Set());
  const stopHiding = (id: string) =>
    setLeaving((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  const remove = useMutation({
    mutationFn: removeSaved,
    onMutate: (entry: SavedEntry) => {
      setLeaving((current) => new Set(current).add(entry.id));
    },
    onSuccess: (_data, entry) => {
      queryClient.setQueriesData<InfiniteData<SavedPage, string | null>>({ queryKey: savedRoot }, (data) => without(data, entry.id));
      stopHiding(entry.id);
    },
    onError: (_error, entry) => {
      stopHiding(entry.id);
      setNotice("Couldn't remove it. Try again.");
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: countsKey }),
  });

  const entries = useMemo(() => (list.data?.pages.flatMap((page) => page.items) ?? []).filter((entry) => !leaving.has(entry.id)), [list.data, leaving]);
  const now = new Date();
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;
  const more = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const pairs = useMemo(() => {
    const out: SavedEntry[][] = [];
    for (let i = 0; i < entries.length; i += 2) out.push(entries.slice(i, i + 2));
    return out;
  }, [entries]);

  return (
    <View style={styles.root}>
      <CreateFrame testID="saved-screen" title="Saved" onLeave={onBack} gap={tileMetrics.partsBetween} onNearEnd={more}>
        <FilterChips testID="saved-chip" label="Filter what you saved" items={TABS} value={tab} onChange={setTab} inset={0} />
        {list.isPending ? (
          <SkeletonRows count={4} testID="saved-loading" />
        ) : list.isError && entries.length === 0 ? (
          <ErrorState
            testID="saved-error"
            title="Couldn't load your saved items"
            message={isApiError(list.error) ? list.error.message : 'Check your connection and try again.'}
            onRetry={() => void list.refetch()}
          />
        ) : entries.length === 0 ? (
          <EmptyState testID="saved-empty" icon="Bookmark" title={EMPTY[tab].title} message={EMPTY[tab].message} />
        ) : (
          <View testID="saved-grid" style={styles.grid}>
            {pairs.map((pair) => (
              <View key={pair[0].id} style={styles.pair}>
                {pair.map((entry) => (
                  <Tile
                    key={entry.id}
                    entry={entry}
                    meta={metaOf(entry, now)}
                    onOpen={openerOf(entry, onOpenEvent, onOpenContent)}
                    onRemove={() => remove.mutate(entry)}
                  />
                ))}
                {pair.length === 1 ? <View style={styles.tile} /> : null}
              </View>
            ))}
            {isFetchingNextPage ? <SkeletonRows count={1} testID="saved-more-loading" /> : null}
            {list.isFetchNextPageError && !isFetchingNextPage ? (
              <Pressable accessibilityRole="button" testID="saved-more-retry" onPress={() => void fetchNextPage()} style={styles.moreFailed}>
                <Text variant="linkStrong">Couldn&apos;t load more. Try again</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </CreateFrame>
      <Toast message={notice} tone="alert" placement="bottom" offset={insets.bottom + space.s2xl} duration={NOTICE_MS} onHide={() => setNotice(null)} testID="saved-notice" />
    </View>
  );
}

/** What a tap on a tile does: a saved event opens its page, a saved piece its own page (when that opens somewhere), a creator nothing yet. */
function openerOf(entry: SavedEntry, onOpenEvent: (id: string) => void, onOpenContent: ((id: string) => void) | undefined): (() => void) | undefined {
  if (entry.kind === 'event' && entry.event) {
    const id = entry.event.id;
    return () => onOpenEvent(id);
  }
  if (entry.kind === 'content' && entry.content && onOpenContent) {
    const id = entry.content.id;
    return () => onOpenContent(id);
  }
  return undefined;
}

function pictureOf(entry: SavedEntry): string | null {
  if (entry.kind === 'content') return entry.content?.thumbnailUrl ?? null;
  if (entry.kind === 'event') return entry.event?.bannerUrl ?? null;
  return null;
}

function glyphOf(entry: SavedEntry): IconName {
  if (entry.kind === 'content' && entry.content) return kindIcon(entry.content.contentType);
  return entry.kind === 'event' ? 'CalendarDays' : 'UserRound';
}

function Tile({ entry, meta, onOpen, onRemove }: { entry: SavedEntry; meta: string; onOpen?: () => void; onRemove: () => void }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const picture = pictureOf(entry);
  const title = titleOf(entry);
  const label = [title, meta].filter(Boolean).join(', ');
  const creator = entry.kind === 'creator' ? entry.creator : null;
  const body = (
    <>
      <View style={[styles.picture, { backgroundColor: colors.surfaceSunken }]}>
        {picture && !broken ? (
          <Image source={{ uri: picture }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
        ) : creator ? (
          <Avatar name={title} size={72} source={creator.avatarUrl ?? undefined} decorative />
        ) : (
          <Icon name={glyphOf(entry)} size={32} color={colors.textMuted} />
        )}
      </View>
      <Text variant="body" numberOfLines={2} style={[font(600), styles.title]}>
        {title}
      </Text>
      {meta ? (
        <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.line}>
          {meta}
        </Text>
      ) : null}
    </>
  );
  return (
    <View testID={`saved-tile-${entry.id}`} style={styles.tile}>
      {onOpen ? (
        <Pressable accessibilityRole="button" accessibilityLabel={label} testID={`saved-open-${entry.id}`} onPress={onOpen} style={styles.words}>
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={label} style={styles.words}>
          {body}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title} from Saved`}
        testID={`saved-remove-${entry.id}`}
        hitSlop={8}
        onPress={onRemove}
        style={[styles.mark, { backgroundColor: colors.surfaceScrim }]}
      >
        <Icon name="Bookmark" size={tileMetrics.markIcon} color={colors.textOnAccent} fill={colors.textOnAccent} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grid: { gap: tileMetrics.cells },
  pair: { flexDirection: 'row', gap: tileMetrics.cells },
  tile: { flex: 1, minWidth: 0 },
  words: { gap: tileMetrics.textGap },
  picture: { height: tileMetrics.picture, borderRadius: tileMetrics.corner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: tileMetrics.titleSize, lineHeight: tileMetrics.titleLead },
  line: { fontSize: tileMetrics.line, lineHeight: tileMetrics.lineLead },
  mark: { position: 'absolute', top: tileMetrics.markInset, right: tileMetrics.markInset, width: tileMetrics.mark, height: tileMetrics.mark, borderRadius: tileMetrics.mark / 2, alignItems: 'center', justifyContent: 'center' },
  moreFailed: { paddingVertical: space.lg, alignItems: 'center' },
});
