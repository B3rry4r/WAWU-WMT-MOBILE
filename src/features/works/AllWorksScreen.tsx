import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { FilterChips } from '@/components/FilterChips';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { layout, radius, space, useWawu } from '@/theme';

import { fetchMyId, fetchWorks, myIdKey, worksKey, type Work } from './api';
import { readFailure } from './failure';
import { categoryOfChip, chipOfCategory, chipsFor, headerSubtitle, type CategoryChip } from './model';
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
  const [category, setCategory] = useState<string | null>(null);
  const works = useQuery({
    queryKey: worksKey(wawuId, category),
    queryFn: () => fetchWorks(wawuId, category),
    placeholderData: keepPreviousData,
  });
  const data = works.data;
  const count = data?.count ?? 0;
  const mine = useQuery({ queryKey: myIdKey, queryFn: fetchMyId, enabled: data !== undefined && count === 0 });

  // The chips stay up while another category loads or fails, so the person can always get back to All.
  const [chips, setChips] = useState<CategoryChip[]>([]);
  const fresh = data && !works.isPlaceholderData ? chipsFor(data.categories) : null;
  if (fresh && !sameChips(fresh, chips)) setChips(fresh);

  const own = data !== undefined && mine.data !== undefined && mine.data === data.owner.wawuId;
  const subtitle = data ? headerSubtitle(data.owner.displayName, data.count) : undefined;
  const selected = chipOfCategory(category);

  return (
    <WorksFrame title="Works" subtitle={subtitle} onBack={onBack} testID="works-screen">
      {chips.length > 0 ? (
        <View style={styles.chips}>
          <FilterChips testID="works-chips" label="Filter works by category" items={chips} value={selected} onChange={(value) => setCategory(categoryOfChip(value))} />
        </View>
      ) : null}
      {data ? (
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
      {data && works.isError ? <Problem error={works.error} onRetry={() => void works.refetch()} /> : null}
    </WorksFrame>
  );
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
  loading: { gap: space.lg },
  loadingCard: { flex: 1, gap: cardMetrics.stack },
  loadingPicture: { width: '100%', aspectRatio: 1 / cardMetrics.ratio, borderRadius: radius.input },
});
