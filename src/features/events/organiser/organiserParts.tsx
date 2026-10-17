import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

/**
 * design/_gen/events.js `dashboard` (E18): three figure tiles in a row with 10 between, a wide card for what the host is owed,
 * its figure at 30, and the grouped list under them. Sizes sit here once.
 */
export const dashMetrics = { tileGap: 10, tilePad: 14, label: 13.5, figure: 28, netFigure: 32, netPad: 16, stack: 14, call: 14.5 } as const;

/** One of E18's three figures: a label over the number. A figure that has not arrived is a bar, never a 0. */
export function StatTile({ label, value, testID }: { label: string; value: number | null; testID: string }) {
  const { colors } = useWawu();
  return (
    <Card padded style={styles.tile} testID={testID}>
      <Text variant="body" tone="textMuted" style={{ fontSize: dashMetrics.label }}>
        {label}
      </Text>
      {value === null ? (
        <View style={[styles.bar, { backgroundColor: colors.surfaceSunken }]} />
      ) : (
        <Text
          variant="body"
          accessibilityLabel={`${label} ${value}`}
          style={[font(700), { fontSize: dashMetrics.figure, lineHeight: canvasNormalLineHeight(dashMetrics.figure), fontVariant: ['tabular-nums'] }]}
        >
          {value.toLocaleString('en-US')}
        </Text>
      )}
    </Card>
  );
}

/** E18's "Yours after our cut": the Hub's figure for what the host is owed, and the host's share beside it when the Hub has sent it. */
export function NetCard({ kobo, percent }: { kobo: number; percent: number | null }) {
  return (
    <Card padded testID="dash-net">
      <View style={styles.netRow}>
        <View style={styles.netWords}>
          <Text variant="body" tone="textSecondary" style={{ fontSize: dashMetrics.label }}>
            Yours after our cut
          </Text>
          <Money minorUnits={kobo} decimals={false} size={dashMetrics.netFigure} weight={700} testID="dash-net-figure" />
        </View>
        {percent === null ? null : <StatusPill label={`${percent}%`} tone="positive" testID="dash-net-percent" />}
      </View>
    </Card>
  );
}

/**
 * The coral pill E25 draws for "Cancel and refund everyone". The shared Button has no danger look yet: SHARED-CHANGES.md
 * EVENTS-08 #1 asks for one, and this stand-in goes when it lands.
 */
export function DangerButton({ label, onPress, loading, testID }: { label: string; onPress: () => void; loading?: boolean; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(loading) }}
      onPress={loading ? undefined : onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.danger, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }, ring.style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnAccent} />
      ) : (
        <Text variant="body" style={[font(700), { color: colors.textOnAccent, fontSize: 16 }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** E18's "Call the event off": the danger-coloured words under the list. */
export function CallOffLink({ onPress }: { onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable testID="dash-call-off" accessibilityRole="button" accessibilityLabel="Call the event off" hitSlop={space.md} onPress={onPress} {...ring.handlers} style={[styles.call, ring.style]}>
      <Text variant="body" tone="danger" style={[font(600), { fontSize: dashMetrics.call }]}>
        Call the event off
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, gap: space.xs },
  bar: { height: dashMetrics.figure, width: '60%', borderRadius: radius.chip },
  netRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  netWords: { flexShrink: 1, gap: space.xs },
  danger: { height: 54, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s2xl },
  call: { alignSelf: 'center', paddingVertical: space.md },
});
