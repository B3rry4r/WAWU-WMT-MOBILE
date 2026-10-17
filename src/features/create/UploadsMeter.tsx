import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { Banner } from '@/components/Banner';
import { font, space, useWawu } from '@/theme';

import type { Allowance } from './api';

/** me.js `slotMeter`: a card with 14 by 16 padding, 10 between its parts; the bars 8 high, 4 apart, 4 corners. */
const meterMetrics = { padV: 14, padH: space.lg, between: 10, bar: 8, barGap: space.xs, barCorner: 4, title: 14.5, count: 13.5, line: 12.5 } as const;

/** The words under the bars: the way up when there is one, else what the account has. Both figures are the Hub's. */
export function meterLine(a: Allowance): string {
  return a.tickHeld ? `Verified · up to ${a.uploads.allowed} uploads.` : `Get verified for up to ${a.withTick.uploads} uploads and more reach.`;
}

/** Whether the Hub's own count leaves no upload to start: at "5 of 5 used" a new piece would be refused when it is created. */
export const slotsFull = (a: Allowance): boolean => a.uploads.remaining <= 0;

/**
 * M27's note, as drawn: "Your 5 free uploads are used", then the way up when there is one. The buttons under it on the artboard open
 * Get verified (M11) and the library (M28), which ME-07 and ME-12 build (R-47), so only the words are here.
 */
export function SlotsFullNotice({ allowance }: { allowance: Allowance }) {
  const { tickHeld, uploads, withTick } = allowance;
  return (
    <Banner
      tone="warning"
      testID="create-slots-full"
      title={`Your ${uploads.allowed} ${tickHeld ? '' : 'free '}uploads are used`}
      body={tickHeld ? 'Take something down to make room for a new one.' : `Get verified for up to ${withTick.uploads} uploads, or take something down.`}
    />
  );
}

/**
 * "Uploads 4 of 5 used" with a bar for each upload (M19; ME-07's dashboard draws the same card). The used count, the limit and the
 * level above it are read from `GET /uploads/allowance`, never typed here. The "Get verified" link under it opens M11 and is
 * added by ME-12 (R-47).
 */
export function UploadsMeter({ allowance }: { allowance: Allowance }) {
  const { colors } = useWawu();
  const { used, allowed } = allowance.uploads;
  return (
    <Card padded testID="create-meter" style={styles.card}>
      <View style={styles.head}>
        <Text variant="body" style={[font(600), styles.title]}>
          Uploads
        </Text>
        <Text variant="body" tone="textMuted" testID="create-meter-count" style={styles.count}>{`${used} of ${allowed} used`}</Text>
      </View>
      <View style={styles.bars} accessible accessibilityLabel={`${used} of ${allowed} uploads used`}>
        {Array.from({ length: allowed }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i < used ? colors.accent : colors.surfaceSunken }]} />
        ))}
      </View>
      <Text variant="caption" tone="textMuted" testID="create-meter-line" style={styles.line}>
        {meterLine(allowance)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: meterMetrics.padV, paddingHorizontal: meterMetrics.padH, gap: meterMetrics.between },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1, fontSize: meterMetrics.title },
  count: { fontSize: meterMetrics.count },
  bars: { flexDirection: 'row', gap: meterMetrics.barGap },
  segment: { flex: 1, height: meterMetrics.bar, borderRadius: meterMetrics.barCorner },
  line: { fontSize: meterMetrics.line },
});
