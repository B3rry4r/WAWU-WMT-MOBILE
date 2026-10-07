import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { radius } from '@/theme';

/** design/_gen/inbox.js line 91: six rows of a 52 circle, a 140 and a 210 line, and a 36 time, 13 apart, 13 above and below. */
const skeletonMetrics = { rows: 6, avatar: 52, name: [140, 14], preview: [210, 12], time: [36, 12], lineRadius: 6, between: 13, padV: 13, lines: 9 } as const;

/** I36: the list while its first page is on the way. */
export function InboxSkeleton({ testID = 'inbox-loading' }: { testID?: string }) {
  return (
    <LoadingView testID={testID} label="Loading your inbox">
      {Array.from({ length: skeletonMetrics.rows }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={skeletonMetrics.avatar} height={skeletonMetrics.avatar} radius={radius.chip} />
          <View style={styles.lines}>
            <Skeleton width={skeletonMetrics.name[0]} height={skeletonMetrics.name[1]} radius={skeletonMetrics.lineRadius} />
            <Skeleton width={skeletonMetrics.preview[0]} height={skeletonMetrics.preview[1]} radius={skeletonMetrics.lineRadius} />
          </View>
          <Skeleton width={skeletonMetrics.time[0]} height={skeletonMetrics.time[1]} radius={skeletonMetrics.lineRadius} />
        </View>
      ))}
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: skeletonMetrics.between, paddingVertical: skeletonMetrics.padV },
  lines: { flex: 1, gap: skeletonMetrics.lines },
});
