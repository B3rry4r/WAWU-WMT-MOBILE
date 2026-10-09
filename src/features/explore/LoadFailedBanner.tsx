import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { radius, space, useWawu } from '@/theme';

/**
 * The failed-read banner at the top of Explore (R-46: a failed read never collapses the screen to one message). It is
 * the app's `ErrorState` (a tile, a title, what went wrong, "Try again") laid out as one compact row, because the
 * sections stay drawn under it. X1 has no error artboard (X12 is the search screen's), so the look is `ErrorState`'s:
 * the same tile, words and secondary button, on a card with the hairline the search pill uses, with the kit banner's
 * smaller text (`kvValue` over `bannerBody`, design/_gen/kit.js line 58) so the title keeps to one line beside the
 * button. `ErrorState` itself is a centred block with no compact form; the SHARED-CHANGES row COMPLETE-02 F2 asks for
 * one so this file can go.
 */
export const loadFailedMetrics = { tile: 36, pad: space.md, gap: space.md, words: 3 } as const;

export type LoadFailedBannerProps = {
  title: string;
  message: string;
  icon: IconName;
  /** Runs the reads again. */
  onRetry: () => void;
  /** A read is in flight: the button shows its spinner and ignores presses. */
  retrying?: boolean;
};

export function LoadFailedBanner({ title, message, icon, onRetry, retrying }: LoadFailedBannerProps) {
  const { colors } = useWawu();
  return (
    <View
      testID="explore-error"
      style={[
        styles.root,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
      ]}
    >
      <IconTile icon={icon} size={loadFailedMetrics.tile} />
      <View style={styles.words}>
        <Text variant="kvValue" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="bannerBody" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {message}
        </Text>
      </View>
      <Button testID="explore-error-retry" label="Try again" icon="RotateCw" variant="secondary" size="sm" loading={retrying} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: loadFailedMetrics.gap,
    padding: loadFailedMetrics.pad,
    borderRadius: radius.tile,
  },
  words: { flex: 1, minWidth: 0, gap: loadFailedMetrics.words },
});
