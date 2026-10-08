import { StyleSheet, View } from 'react-native';

import { ink } from './look';

/** design/_gen/home.js, H29 to H34: the controls drawn over a card. Close, the pills, the arrow and Done are the shared IconButton and Button. */
export const partMetrics = {
  segmentGap: 4,
  segmentHeight: 3,
  segmentRadius: 2,
  idleSegment: 0.3,
  /** The close control's diameter (IB size 40) and the arrow's (44). */
  close: 40,
  next: 44,
  /** The Amen and Share pills are 40 high (the shared small button is 34). */
  pillHeight: 40,
} as const;

export type ProgressProps = { steps: number; at: number };

/** One segment per step, white up to and including the step on screen, a third as bright after it. The kit has no progress bar to use. */
export function Progress({ steps, at }: ProgressProps) {
  return (
    <View
      testID="tgif-progress"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Card ${at + 1} of ${steps}`}
      accessibilityValue={{ min: 1, max: steps, now: at + 1 }}
      style={styles.progress}
    >
      {Array.from({ length: steps }, (_, i) => (
        <View
          key={i}
          testID={`tgif-segment-${i}`}
          style={[styles.segment, { backgroundColor: ink, opacity: i <= at ? 1 : partMetrics.idleSegment }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: partMetrics.segmentGap },
  segment: { flex: 1, height: partMetrics.segmentHeight, borderRadius: partMetrics.segmentRadius },
});
