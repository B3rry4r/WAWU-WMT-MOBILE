import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

/** The note's card is the products meter's card (design/_gen/me.js line 17, `prodMeter`): 18 corner, 12 by 14 padding, the line 13.5 at 600. */
const noteMetrics = { padV: 12, padH: 14, font: 13.5, retry: 34 } as const;

export type RetryNoteProps = {
  /** What did not load, in the app's words ("Your tier did not load"). */
  title: string;
  onRetry: () => void;
  /** What the round retry mark is called for a screen reader; it says what it retries when two notes can show together ("Try loading your tier again"). */
  retryLabel?: string;
  testID?: string;
};

/**
 * A part of the Me header or grid that failed to load while the rest of the page did: the profile stays on screen, and this
 * sits where the part would be with a round retry mark (named "Try again" for a screen reader). The boards draw no failed state, so it wears the meter's card.
 */
export function RetryNote({ title, onRetry, retryLabel = 'Try again', testID }: RetryNoteProps) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[
        styles.card,
        { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
      ]}
    >
      <Text variant="body" tone="textSecondary" style={styles.title}>
        {title}
      </Text>
      <IconButton icon="RotateCw" label={retryLabel} size={noteMetrics.retry} onPress={onRetry} testID={testID ? `${testID}-retry` : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    borderRadius: radius.tile,
    paddingVertical: noteMetrics.padV,
    paddingHorizontal: noteMetrics.padH,
  },
  title: { ...font(600), flex: 1, fontSize: noteMetrics.font, lineHeight: canvasNormalLineHeight(noteMetrics.font) },
});
