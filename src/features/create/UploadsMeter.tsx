import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance, type Allowance } from './api';

/** me.js `slotMeter`: a card with 14 by 16 padding, 10 between its parts; the bars 8 high, 4 apart, 4 corners. */
const meterMetrics = { padV: 14, padH: space.lg, between: 10, bar: 8, barGap: space.xs, barCorner: 4, title: 14.5, count: 13.5, line: 12.5 } as const;

/** The words under the bars: the way up when there is one, else what the account has. Both figures are the Hub's. */
export function meterLine(a: Allowance): string {
  return a.tickHeld ? `Verified · up to ${a.uploads.allowed} uploads.` : `Get verified for up to ${a.withTick.uploads} uploads and more reach.`;
}

/** Whether the Hub's own count leaves no upload to start: at "5 of 5 used" a new piece would be refused when it is created. */
export const slotsFull = (a: Allowance): boolean => a.uploads.remaining <= 0;

/**
 * design/_gen/kit.js line 58 (`banner`, warning) with the buttons in me.js line 95 (`slotsFull`): an 18 radius tint box, 14 by 16 inside, a
 * 19 mark with 12 after it, the title at 14.5 / 600, the words at 13 on a 1.45 line, and small buttons 8 under them, 8 apart.
 */
const noticeMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, iconNudge: 1, buttonsTop: 8, buttonsGap: space.sm } as const;

/**
 * M27's note, as drawn: "Your 5 free uploads are used", then the way up when there is one, and "Open library" (M28) under it. The
 * board's other button, "Get verified" (M11, replaced by ME-12's tiers), is added by ME-12 (R-47). `Banner` takes no buttons, so the
 * box is drawn here until it does (SHARED-CHANGES ME-07 #1, the same ask as INBOX-13 #2).
 */
export function SlotsFullNotice({ allowance, onOpenLibrary }: { allowance: Allowance; onOpenLibrary?: () => void }) {
  const { colors } = useWawu();
  const { tickHeld, uploads, withTick } = allowance;
  return (
    <View testID="create-slots-full" accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: colors.warningTint }]}>
      <View style={styles.noticeIcon}>
        <Icon name="Library" size={noticeMetrics.icon} color={colors.warning} strokeWidth={2.2} />
      </View>
      <View style={styles.noticeText}>
        <Text variant="kvValue">{`Your ${uploads.allowed} ${tickHeld ? '' : 'free '}uploads are used`}</Text>
        <Text variant="bannerBody">{tickHeld ? 'Take something down to make room for a new one.' : `Get verified for up to ${withTick.uploads} uploads, or take something down.`}</Text>
        {onOpenLibrary ? (
          <View style={styles.noticeButtons}>
            <Button testID="create-slots-full-library" label="Open library" variant="secondary" size="sm" onPress={onOpenLibrary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * The meter with its three states, for a screen that is not Create: the card once `GET /uploads/allowance` has answered, a skeleton
 * while it has not, and a short note with Try again when it failed (the screen around it still works).
 */
export function AllowanceMeter() {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance, staleTime: 0 });
  if (allowance.data) return <UploadsMeter allowance={allowance.data} />;
  if (allowance.isError) {
    return (
      <View testID="meter-error" accessibilityRole="alert" style={[styles.failed, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
        <Text variant="body" style={font(600)}>
          Your uploads did not load
        </Text>
        <Text variant="caption" tone="textMuted">
          {isApiError(allowance.error) ? allowance.error.message : 'Check your connection and try again.'}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => void allowance.refetch()} testID="meter-retry" {...ring.handlers} style={ring.style}>
          <Text variant="linkStrong">Try again</Text>
        </Pressable>
      </View>
    );
  }
  return <Skeleton testID="meter-loading" height={96} radius={radius.card} />;
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
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: noticeMetrics.iconToText, borderRadius: radius.tile, paddingVertical: noticeMetrics.padV, paddingHorizontal: space.lg },
  noticeIcon: { paddingTop: noticeMetrics.iconNudge },
  noticeText: { flex: 1, gap: noticeMetrics.inner },
  noticeButtons: { marginTop: noticeMetrics.buttonsTop, flexDirection: 'row', gap: noticeMetrics.buttonsGap },
  failed: { borderRadius: radius.card, padding: space.lg, gap: space.xs },
});
