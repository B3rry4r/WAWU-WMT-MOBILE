import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

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
  /** The read count's pill: the same 40 high, 14 across, a 17 eye then the words 6 apart at 13.5, at 70% (H29 to H34). */
  pillPad: 14,
  pillGap: 6,
  pillIcon: 17,
  pillWords: 13.5,
  readFaint: 0.7,
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

/**
 * H29 to H34's middle pill: the eye and "N read today", how many people have read today's TGIF. It is a figure, not a
 * control, so it is not a button; it is drawn as the Amen and Share pills are (the glass colour, 40 high) and it is the
 * pill that gives way when the row is full, its words going onto two lines as the board draws them. `count` is the
 * reader's compact count ("3.4K"); the reader draws the pill only once the Hub has given one.
 */
export function ReadPill({ count }: { count: string }) {
  const { colors } = useWawu();
  const words = `${count} read today`;
  return (
    <View
      testID="tgif-readers"
      accessible
      accessibilityLabel={words}
      style={[styles.read, { backgroundColor: colors.surfaceGlass, borderColor: colors.borderGlass }]}
    >
      <Icon name="Eye" size={partMetrics.pillIcon} color={ink} strokeWidth={2} />
      <Text
        variant="body"
        testID="tgif-readers-words"
        style={[font(600), styles.readWords, { color: ink, fontSize: partMetrics.pillWords, lineHeight: canvasNormalLineHeight(partMetrics.pillWords), opacity: partMetrics.readFaint }]}
      >
        {words}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  read: {
    minHeight: partMetrics.pillHeight,
    paddingHorizontal: partMetrics.pillPad,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: partMetrics.pillGap,
    flexShrink: 1,
  },
  readWords: { flexShrink: 1 },
  progress: { flexDirection: 'row', gap: partMetrics.segmentGap },
  segment: { flex: 1, height: partMetrics.segmentHeight, borderRadius: partMetrics.segmentRadius },
});
