import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

/**
 * design/_gen/events.js `hostBanner` (E1): a 22 corner accent card, 16 by 18 padding, 12 between the words and
 * the button; a 16 bold title over a 12.5 line at 85%, 2 apart; a small white Start.
 */
const bannerMetrics = { padV: 16, padH: 18, between: 12, title: 16, line: 12.5, lineGap: 2, lineOpacity: 0.85 } as const;

/** E1's "Host your event": opens the host wizard, or the tick gate (E21) for an account without a tick. */
export function HostBanner({ onStart }: { onStart: () => void }) {
  const { colors } = useWawu();
  return (
    <View testID="events-host-banner" style={[styles.root, { backgroundColor: colors.accent }]}>
      <View style={styles.words}>
        <Text variant="body" tone="textOnAccent" style={[font(700), styles.title]}>
          Host your event
        </Text>
        <Text variant="body" tone="textOnAccent" style={styles.line}>
          Sell tickets. Verified accounts only.
        </Text>
      </View>
      <Button testID="events-host-start" label="Start" variant="white" size="sm" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.card,
    paddingVertical: bannerMetrics.padV,
    paddingHorizontal: bannerMetrics.padH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: bannerMetrics.between,
  },
  words: { flex: 1, gap: bannerMetrics.lineGap },
  title: { fontSize: bannerMetrics.title, lineHeight: canvasNormalLineHeight(bannerMetrics.title) },
  line: {
    fontSize: bannerMetrics.line,
    lineHeight: canvasNormalLineHeight(bannerMetrics.line),
    opacity: bannerMetrics.lineOpacity,
  },
});
