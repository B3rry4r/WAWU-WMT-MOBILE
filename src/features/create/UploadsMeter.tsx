import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { ProductsMeter } from '@/components/ProductsMeter';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { productsMeterOf, runningTier } from '@/features/me/model';
import { font, radius, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance, type Allowance } from './api';

/** me.js `slotMeter`: a card with 14 by 16 padding, 10 between its parts; the bars 8 high, 4 apart, 4 corners. */
const meterMetrics = { padV: 14, padH: space.lg, between: 10, bar: 8, barGap: space.xs, barCorner: 4, title: 14.5, count: 13.5, line: 12.5 } as const;

/** The words under the bars: the way up when there is one, else what the account has. Both figures are the Hub's. */
export function meterLine(a: Allowance): string {
  return a.tickHeld ? `Verified · up to ${a.uploads.allowed} uploads.` : `Get verified for up to ${a.withTick.uploads} uploads and more reach.`;
}

/** Whether the Hub allows this account no upload at all (no tier and no tick, R-43). There is nothing to count, so no meter and no "used" note is drawn for it. */
export const noAllowance = (a: Allowance): boolean => a.uploads.allowed <= 0;

/**
 * Whether the Hub's own count leaves no upload to start: at "5 of 5 used" a new piece would be refused when it is created. An account
 * with no allowance at all is not "full": it has no places to be full of, and the Hub's own refusal says why when it turns a send down.
 */
export const slotsFull = (a: Allowance): boolean => !noAllowance(a) && a.uploads.remaining <= 0;

/** Whether the account is on the Hub's free allowance (the word "free" is said only to it): no tick, and its limit is the free level's. A tier holder is not. */
export const onFreeAllowance = (a: Allowance): boolean => !a.tickHeld && a.free.uploads > 0 && a.uploads.allowed === a.free.uploads;

/**
 * design/_gen/kit.js line 58 (`banner`, warning) with the buttons in me.js line 95 (`slotsFull`): an 18 radius tint box, 14 by 16 inside, a
 * 19 mark with 12 after it, the title at 14.5 / 600, the words at 13 on a 1.45 line, and small buttons 8 under them, 8 apart.
 */
const noticeMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, iconNudge: 1, buttonsTop: 8, buttonsGap: space.sm } as const;

/**
 * M27's note, as drawn: "Your 5 free uploads are used", then the way up when there is one, and the two buttons under it as the board
 * orders them. "Get verified" opens the tiers (VF5, ME-12), drawn when the screen gives it a place to go and the person has no tick;
 * "Open library" (M28) is ME-07's. `Banner` takes no buttons, so the box is drawn here until it does (SHARED-CHANGES ME-07 #1, the
 * same ask as INBOX-13 #2).
 */
export function SlotsFullNotice({ allowance, onOpenLibrary, onGetVerified }: { allowance: Allowance; onOpenLibrary?: () => void; onGetVerified?: () => void }) {
  const { colors } = useWawu();
  // A person who holds a tier is never told to "Get verified" (RELEASE-02 second pass, M-3): the Hub's tier read decides, as it does for the Create tile.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false });
  const holdsTier = runningTier(tier.data) !== null;
  const { uploads, withTick } = allowance;
  const tickHeld = allowance.tickHeld || holdsTier;
  if (noAllowance(allowance)) return null;
  return (
    <View testID="create-slots-full" accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.notice, { backgroundColor: colors.warningTint }]}>
      <View style={styles.noticeIcon}>
        <Icon name="Library" size={noticeMetrics.icon} color={colors.warning} strokeWidth={2.2} />
      </View>
      <View style={styles.noticeText}>
        <Text variant="kvValue">{`Your ${uploads.allowed} ${onFreeAllowance(allowance) ? 'free ' : ''}uploads are used`}</Text>
        <Text variant="bannerBody">{tickHeld ? 'Take something down to make room for a new one.' : `Get verified for up to ${withTick.uploads} uploads, or take something down.`}</Text>
        {onOpenLibrary || (!tickHeld && onGetVerified) ? (
          <View style={styles.noticeButtons}>
            {!tickHeld && onGetVerified ? <Button testID="create-get-verified" label="Get verified" size="sm" onPress={onGetVerified} /> : null}
            {onOpenLibrary ? <Button testID="create-slots-full-library" label="Open library" variant="secondary" size="sm" onPress={onOpenLibrary} /> : null}
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
  // A person who holds a tier is shown the tier's own count and name ("3 of 3 products", "Verify · ends 26 Nov"), as Create and Me show it, and
  // never the free level's "Get verified" line (RELEASE-02 second pass, L-p2-12). The Hub's tier read is the one that decides.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false });
  const products = productsMeterOf(tier.data);
  if (products) return <ProductsMeter used={products.used} allowed={products.allowed} tier={products.tier} testID="meter-products" />;
  if (tier.isPending) return <Skeleton testID="meter-loading" height={96} radius={radius.card} />;
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
 * added by ME-12 (R-47). An account the Hub allows nothing (no tier, no tick) gets no card: "0 of 0 used" counts nothing.
 */
export function UploadsMeter({ allowance, onGetVerified }: { allowance: Allowance; onGetVerified?: () => void }) {
  const { colors } = useWawu();
  const { used, allowed } = allowance.uploads;
  if (noAllowance(allowance)) return null;
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
      {!allowance.tickHeld && onGetVerified ? <Button testID="create-meter-get-verified" label="Get verified" size="card" onPress={onGetVerified} style={styles.noticeButton} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  noticeButton: { alignSelf: 'flex-start' },
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
