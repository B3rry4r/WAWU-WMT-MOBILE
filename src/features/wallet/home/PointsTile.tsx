import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { PointsFigure, formatPoints, formatPointsCount } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import type { MyPoints } from '@/features/points/api';
import { endsOn } from '@/features/points/model';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';


/**
 * design/_gen/wallet.js line 46, `mini`, the same card as the Passes card beside it: a 20 corner, padded 12 by 14, the parts 4 apart. The
 * head is a 15 star and the word at 12.5 / 600 muted, 6 apart; the count is 18 / 700 tracked -0.02em (`PointsFigure` at `tile`); the
 * line under it is 12 muted.
 */
export const POINTS_TILE = { radius: 20, padV: 12, padH: 14, stack: 4, head: 12.5, headGap: 6, icon: 15, sub: 12 } as const;

/**
 * The line under the count: how many of the points end first, and on which day, from the Hub's own `nextExpiry` ("400 end 12 Jan").
 * No line when none of them is ending (nothing to say, nothing invented).
 */
export function pointsEndLine(next: MyPoints['nextExpiry'], now: Date): string | null {
  if (!next) return null;
  const day = endsOn(next.expiresAt, now);
  return day === '' ? null : `${formatPointsCount(next.points)} end ${day}`;
}

/** W1's Points card: the Hub's balance as a count (never naira), and when the soonest-ending points end. Tapping it opens Your points. */
export function PointsTile({ points, now, onPress }: { points: Pick<MyPoints, 'balance' | 'nextExpiry'>; now: Date; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const line = pointsEndLine(points.nextExpiry, now);
  return (
    <Pressable
      testID="wallet-points"
      accessibilityRole="button"
      accessibilityLabel={['Points', formatPoints(points.balance), line].filter(Boolean).join(', ')}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.tile,
        { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
        ring.style,
      ]}
    >
      <View style={styles.head}>
        <Icon name="Sparkles" size={POINTS_TILE.icon} color={colors.accentFg} />
        <Text variant="body" tone="textMuted" style={[font(600), { fontSize: POINTS_TILE.head, lineHeight: canvasNormalLineHeight(POINTS_TILE.head) }]}>
          Points
        </Text>
      </View>
      <PointsFigure count={points.balance} size="tile" testID="wallet-points-count" />
      {line ? (
        <Text variant="body" tone="textMuted" numberOfLines={1} testID="wallet-points-ends" style={{ fontSize: POINTS_TILE.sub, lineHeight: canvasNormalLineHeight(POINTS_TILE.sub) }}>
          {line}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minWidth: 0, borderRadius: POINTS_TILE.radius, paddingVertical: POINTS_TILE.padV, paddingHorizontal: POINTS_TILE.padH, gap: POINTS_TILE.stack },
  head: { flexDirection: 'row', alignItems: 'center', gap: POINTS_TILE.headGap },
});
