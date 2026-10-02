import type { ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useWawu } from '@/theme';

import { rowMetrics } from './ListRow';

/** The circle is as big as a transaction's lead (44), each line as high as small text, with the design's 8 corner. */
const rowLead = 44;
const rowLine = 14;
const lineRadius = 8;
/** design/_gen/kit.js line 65 (`skel`): the default corner is 12. */
const skeletonRadius = 12;

export type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  /** A radius token. Defaults to the tile corner. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A quiet block where a figure or picture will be. Never an animation the design does not draw, never a zero. */
export function Skeleton({ width = '100%', height, radius: corner = skeletonRadius, style, testID }: SkeletonProps) {
  const { colors } = useWawu();
  return <View testID={testID} style={[{ width, height, borderRadius: corner, backgroundColor: colors.surfaceSunken }, styles.block, style]} />;
}

export type LoadingViewProps = {
  children: ReactNode;
  /** What a screen reader says while the content is on its way. */
  label?: string;
  testID?: string;
};

/** Wraps skeleton blocks so a screen reader hears one "Loading", not a run of empty shapes. */
export function LoadingView({ children, label = 'Loading', testID }: LoadingViewProps) {
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      importantForAccessibility="yes"
    >
      {children}
    </View>
  );
}

export type SkeletonRowsProps = { count?: number; testID?: string };

/** The loading view of a list of rows: a circle and two lines, as many times as `count`. It has no gutter of its own: the screen pads it exactly as it pads the rows it stands in for. */
export function SkeletonRows({ count = 4, testID }: SkeletonRowsProps) {
  return (
    <LoadingView testID={testID}>
      <View style={styles.rows}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={styles.row}>
            <Skeleton width={rowLead} height={rowLead} radius={radius.chip} />
            <View style={styles.lines}>
              <Skeleton width="55%" height={rowLine} radius={lineRadius} />
              <Skeleton width="35%" height={rowLine} radius={lineRadius} />
            </View>
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  block: { flexShrink: 0 },
  rows: { gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  lines: { flex: 1, gap: space.sm },
});
