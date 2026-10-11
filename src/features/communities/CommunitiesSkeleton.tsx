import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';

import { tileMetrics } from './GroupTile';

/** The rows of I24 while they are on its way: a rounded picture, a name bar and a line bar, as the communities draw them. */
const skeletonMetrics = { rows: 4, name: [150, 14], line: [210, 12], time: [36, 12], lineRadius: 6, between: 13, padV: 13, lines: 9 } as const;

export function CommunitiesSkeleton({ rows = skeletonMetrics.rows, testID = 'communities-loading' }: { rows?: number; testID?: string }) {
  return (
    <LoadingView testID={testID} label="Loading communities">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={tileMetrics.row.size} height={tileMetrics.row.size} radius={tileMetrics.row.corner} />
          <View style={styles.lines}>
            <Skeleton width={skeletonMetrics.name[0]} height={skeletonMetrics.name[1]} radius={skeletonMetrics.lineRadius} style={styles.bar} />
            <Skeleton width={skeletonMetrics.line[0]} height={skeletonMetrics.line[1]} radius={skeletonMetrics.lineRadius} style={styles.bar} />
          </View>
          <Skeleton width={skeletonMetrics.time[0]} height={skeletonMetrics.time[1]} radius={skeletonMetrics.lineRadius} />
        </View>
      ))}
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: skeletonMetrics.between, paddingVertical: skeletonMetrics.padV },
  lines: { flex: 1, minWidth: 0, gap: skeletonMetrics.lines },
  bar: { maxWidth: '100%' },
});
