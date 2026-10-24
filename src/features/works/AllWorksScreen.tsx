import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Button, IconButton } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { layout, radius, space, useWawu } from '@/theme';

import { fetchMyId, fetchWorks, myIdKey, reorderWorks, worksKey, worksRoot, type Work } from './api';
import { readFailure } from './failure';
import { categoryOfChip, chipOfCategory, chipsFor, headerSubtitle, type CategoryChip } from './model';
import { moved, ReorderList } from './ReorderList';
import { cardMetrics, WorkCard } from './WorkCard';
import { WorksFrame } from './WorksFrame';

/** design/_gen/me.js line 70 (M34): two columns 12 apart, 16 between rows; the chips run 36 high (`FilterChips`). The loading cards stand in for four of them. */
const gridMetrics = { columnGap: space.md, rowGap: space.lg, loadingCards: 4, chipSkeleton: 36 } as const;
const LABEL_SKELETON_H = 14;

export type AllWorksScreenProps = {
  /** Whose works: a WAWU ID or a handle. */
  wawuId: string;
  onBack: () => void;
  onOpenWork: (workId: string) => void;
  /** Opens M36. Offered on the person's own empty page only. */
  onAddWork: () => void;
};

/**
 * M34 · All works. Reads `GET /users/{wawuId}/featured-works` (`?category=`): the chips are the
 * categories the person used, picking one asks the Hub for that category, and a work opens M35.
 * The bar's second line is the person's name and how many works they have in all.
 */
export function AllWorksScreen({ wawuId, onBack, onOpenWork, onAddWork }: AllWorksScreenProps) {
  const { colors } = useWawu();
  const [category, setCategory] = useState<string | null>(null);
  const works = useQuery({
    queryKey: worksKey(wawuId, category),
    queryFn: () => fetchWorks(wawuId, category),
    placeholderData: keepPreviousData,
  });
  const data = works.data;
  const count = data?.count ?? 0;
  // Whose page this is: an empty page offers Add, and a page of two or more works offers Reorder, to its owner only.
  const mine = useQuery({ queryKey: myIdKey, queryFn: fetchMyId, enabled: data !== undefined && (count === 0 || count > 1) });

  // The chips stay up while another category loads or fails, so the person can always get back to All.
  const [chips, setChips] = useState<CategoryChip[]>([]);
  const fresh = data && !works.isPlaceholderData ? chipsFor(data.categories) : null;
  if (fresh && !sameChips(fresh, chips)) setChips(fresh);

  const own = data !== undefined && mine.data !== undefined && mine.data === data.owner.wawuId;

  // Reorder (FIX-113, G-252): the owner's whole list, never a category's part of it (the Hub takes every work or none).
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Work[] | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const saveOrder = useMutation({
    mutationFn: (list: readonly Work[]) => reorderWorks(list.map((work) => work.id)),
    onMutate: () => setOrderError(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: worksRoot });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      AccessibilityInfo.announceForAccessibility('Order saved');
      setOrder(null);
    },
    onError: (error) => {
      setOrderError(orderFailure(error));
      // Another device added or removed a work: read the list again, so the next try is of what is there now.
      if (isApiError(error) && error.status === 409) void works.refetch().then(() => setOrder(null));
    },
  });
  const canReorder = own && category === null && data !== undefined && data.works.length > 1 && data.works.length === data.count;
  const changed = order !== null && data !== undefined && order.some((work, i) => work.id !== data.works[i]?.id);
  const subtitle = data ? headerSubtitle(data.owner.displayName, data.count) : undefined;
  const selected = chipOfCategory(category);

  return (
    <WorksFrame
      title="Works"
      subtitle={subtitle}
      onBack={order ? () => setOrder(null) : onBack}
      testID="works-screen"
      right={canReorder && !order && data ? <IconButton icon="ArrowDownUp" label="Reorder works" onPress={() => setOrder(data.works)} testID="works-reorder-start" /> : undefined}
      footer={
        order ? (
          <View testID="works-reorder-bar" style={[styles.bar, { paddingBottom: insets.bottom + space.md, backgroundColor: colors.surfacePage }]}>
            <Button label="Save order" full onPress={() => saveOrder.mutate(order)} disabled={!changed} loading={saveOrder.isPending} testID="works-reorder-save" />
            <Button label="Cancel" variant="secondary" full onPress={() => setOrder(null)} disabled={saveOrder.isPending} testID="works-reorder-cancel" />
          </View>
        ) : undefined
      }
    >
      {order ? (
        <>
          {orderError ? <Banner tone="danger" title="That did not work" body={orderError} testID="works-reorder-error" /> : null}
          <ReorderList works={order} disabled={saveOrder.isPending} onMove={(from, to) => setOrder((current) => (current ? moved(current, from, to) : current))} />
        </>
      ) : null}
      {order ? null : chips.length > 0 ? (
        <View style={styles.chips}>
          <FilterChips testID="works-chips" label="Filter works by category" items={chips} value={selected} onChange={(value) => setCategory(categoryOfChip(value))} />
        </View>
      ) : null}
      {order ? null : data ? (
        data.works.length > 0 ? (
          <Grid works={data.works} onOpenWork={onOpenWork} />
        ) : category !== null ? (
          <EmptyState
            testID="works-empty-category"
            icon="Image"
            title={`Nothing under ${category}`}
            message="No works have this category."
            action={{ label: 'Show all works', onPress: () => setCategory(null) }}
          />
        ) : own ? (
          <EmptyState
            testID="works-empty-own"
            icon="ImagePlus"
            title="No works yet"
            message="Add a work and it shows on your profile."
            action={{ label: 'Add a work', onPress: onAddWork }}
          />
        ) : (
          <EmptyState testID="works-empty" icon="Image" title="No works yet" message="Nothing has been added here." />
        )
      ) : works.isError ? (
        <Problem error={works.error} onRetry={() => void works.refetch()} />
      ) : (
        <Loading chips={chips.length === 0} />
      )}
      {!order && data && works.isError ? <Problem error={works.error} onRetry={() => void works.refetch()} /> : null}
    </WorksFrame>
  );
}

/** The Hub's own sentence for a refused order (a 409 says the works changed), or a plain one. */
function orderFailure(error: unknown): string {
  if (isApiError(error) && (error.kind === 'network' || error.status === 409)) return error.message;
  return 'The order was not saved. Try again.';
}

function sameChips(a: readonly CategoryChip[], b: readonly CategoryChip[]): boolean {
  return a.length === b.length && a.every((chip, i) => chip.value === b[i].value);
}

function Grid({ works, onOpenWork }: { works: Work[]; onOpenWork: (workId: string) => void }) {
  const rows: Work[][] = [];
  for (let i = 0; i < works.length; i += 2) rows.push(works.slice(i, i + 2));
  return (
    <View testID="works-grid" style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((work) => (
            <WorkCard key={work.id} work={work} testID={`work-${work.id}`} onPress={() => onOpenWork(work.id)} />
          ))}
          {row.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

function Problem({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (isApiError(error) && error.kind === 'not_found') {
    return <ErrorState testID="works-unavailable" icon="CircleAlert" title="This page is not available" message="There are no works to show here." />;
  }
  const offline = isApiError(error) && error.kind === 'network';
  return (
    <ErrorState
      testID="works-error"
      icon={offline ? 'WifiOff' : 'CircleAlert'}
      title="The works did not load"
      message={readFailure(error)}
      onRetry={onRetry}
    />
  );
}

function Loading({ chips }: { chips: boolean }) {
  const { colors } = useWawu();
  return (
    <LoadingView label="Loading works" testID="works-loading">
      <View style={styles.loading}>
        {chips ? <Skeleton width="70%" height={gridMetrics.chipSkeleton} radius={radius.chip} /> : null}
        <View style={styles.grid}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1].map((col) => (
                <View key={col} style={styles.loadingCard}>
                  <View style={[styles.loadingPicture, { backgroundColor: colors.surfaceSunken }]} />
                  <Skeleton width="80%" height={LABEL_SKELETON_H} />
                  <Skeleton width="50%" height={LABEL_SKELETON_H} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  chips: { marginHorizontal: -layout.gutter },
  grid: { gap: gridMetrics.rowGap },
  row: { flexDirection: 'row', gap: gridMetrics.columnGap },
  spacer: { flex: 1 },
  bar: { paddingHorizontal: layout.gutter, paddingTop: space.md, gap: space.sm },
  loading: { gap: space.lg },
  loadingCard: { flex: 1, gap: cardMetrics.stack },
  loadingPicture: { width: '100%', aspectRatio: 1 / cardMetrics.ratio, borderRadius: radius.input },
});
