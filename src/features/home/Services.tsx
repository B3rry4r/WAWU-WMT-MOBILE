import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

/**
 * H1 and H36's "What would you like to do today?" (design/_gen/home.js `services`, kit `Tile` at size 60, tone
 * accent): the heading 18.5 bold, 14 above four equal columns; each tile a 60 square at corner 19.2 (32% of 60) on the
 * card colour with a hairline, its glyph 25 in the accent, the word 12.5 semi-bold under it, 8 apart.
 *
 * Each tile is added by the task that builds where it leads, in the column the canvas draws it (R-41): Events
 * (E1, EVENTS-01) in the second. Pay bills (BILLS-01), Legal (LEGAL-02) and the fourth tile (SCHOOLS-03 by
 * HOME-01's table; the canvas draws Shop) leave their columns empty until then.
 */
export const servicesMetrics = {
  heading: 18.5,
  headingTracking: -0.025,
  headingBelow: 14,
  tile: 60,
  /** `Tile`: the corner is 32% of the square, the glyph 42% of it, the column it sits in 16 wider. */
  corner: 19.2,
  glyph: 25,
  width: 76,
  labelGap: space.sm,
  label: 12.5,
} as const;
const m = servicesMetrics;

type Service = { key: string; icon: IconName; label: string; onPress: () => void };

export function Services({ onOpenEvents }: { onOpenEvents: () => void }) {
  const columns: (Service | null)[] = [
    null,
    { key: 'events', icon: 'CalendarDays', label: 'Events', onPress: onOpenEvents },
    null,
    null,
  ];
  return (
    <View testID="today-services" style={styles.root}>
      <Text variant="body" accessibilityRole="header" style={[font(700), styles.heading]}>
        What would you like to do today?
      </Text>
      <View style={styles.grid}>
        {columns.map((service, i) => (
          <View key={service?.key ?? `empty-${i}`} style={styles.column}>
            {service ? <Tile service={service} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Tile({ service }: { service: Service }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`today-service-${service.key}`}
      accessibilityRole="button"
      accessibilityLabel={service.label}
      onPress={service.onPress}
      {...ring.handlers}
      style={[styles.tile, ring.style]}
    >
      <View style={[styles.square, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
        <Icon name={service.icon} size={m.glyph} color={colors.accentFg} />
      </View>
      <Text variant="body" tone="textSecondary" numberOfLines={1} style={[font(600), { fontSize: m.label }]}>
        {service.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: m.headingBelow },
  heading: { fontSize: m.heading, letterSpacing: m.headingTracking * m.heading },
  grid: { flexDirection: 'row' },
  column: { flex: 1, alignItems: 'center' },
  tile: { alignItems: 'center', gap: m.labelGap, width: m.width },
  square: {
    width: m.tile,
    height: m.tile,
    borderRadius: m.corner,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
