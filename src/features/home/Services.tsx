import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

/**
 * H1 and H36's "What would you like to do today?" (design/_gen/home.js `services`, kit `Tile` at size 60, tone
 * accent): the heading 18.5 bold, 14 above four equal columns; each tile a 60 square at corner 19.2 (32% of 60) on the
 * card colour with a hairline, its glyph 25 in the accent, the word 12.5 semi-bold under it, 8 apart.
 *
 * All four tiles are drawn, in the canvas's order, with BRIEF H1's Schools where the canvas draws Shop (R-2, R-46):
 * Pay bills (S2, BILLS-01), Events (E1, wired: EVENTS-01), Legal (S14, LEGAL-02) and Schools (SC1, SCHOOLS-03). A tile
 * whose screen is not built opens nothing; the task that builds the screen wires it here.
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

/** The four tiles in the canvas's order (BRIEF H1: Schools in Shop's place). `TodayLoading` draws one shape for each. */
function presentServices(onOpenEvents: () => void): Service[] {
  return [
    { key: 'pay-bills', icon: 'Receipt', label: 'Pay bills', onPress: unbuilt('BILLS-01') },
    { key: 'events', icon: 'CalendarDays', label: 'Events', onPress: onOpenEvents },
    { key: 'legal', icon: 'Scale', label: 'Legal', onPress: unbuilt('LEGAL-02') },
    { key: 'schools', icon: 'GraduationCap', label: 'Schools', onPress: unbuilt('SCHOOLS-03') },
  ];
}
export const servicesPresent = presentServices(() => undefined).length;

export function Services({ onOpenEvents }: { onOpenEvents: () => void }) {
  const columns = presentServices(onOpenEvents);
  return (
    <View testID="today-services" style={styles.root}>
      <Text variant="body" accessibilityRole="header" style={[font(700), styles.heading]}>
        What would you like to do today?
      </Text>
      <View style={styles.grid}>
        {columns.map((service) => (
          <View key={service.key} style={styles.column}>
            <Tile service={service} />
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
      <Text variant="body" tone="textSecondary" numberOfLines={1} style={[font(600), { fontSize: m.label, lineHeight: canvasNormalLineHeight(m.label) }]}>
        {service.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: m.headingBelow },
  /** `line-height: normal` (24 at 18.5), as the canvas's heading has it. */
  heading: { fontSize: m.heading, lineHeight: canvasNormalLineHeight(m.heading), letterSpacing: m.headingTracking * m.heading },
  grid: { flexDirection: 'row' },
  column: { width: '25%', alignItems: 'center' },
  /** The column is a quarter of the row: on a narrow phone the tile gives way to it, the square and the word still fit. */
  tile: { alignItems: 'center', gap: m.labelGap, width: m.width, maxWidth: '100%' },
  square: {
    width: m.tile,
    height: m.tile,
    borderRadius: m.corner,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
