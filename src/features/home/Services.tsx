import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

/**
 * H1 and H36's "What would you like to do today?" (design/_gen/home.js `services`, kit `Tile` at size 60, tone
 * accent): the heading 18.5 bold, 14 above four equal columns; each tile a 60 square at corner 19.2 (32% of 60) on the
 * card colour with a hairline, its glyph 25 in the accent, the word 12.5 semi-bold under it, 8 apart.
 *
 * U-H1 (lead ruling b, 8 Oct 2026): the tiles present pack from the left in the canvas's order, as HOME-01 treated
 * every other left-out entry; there is no empty slot. Today that is `[Events][Legal][ ][ ]`. Tile size and spacing stay
 * as drawn (each tile in a quarter of the row). Each later task adds its tile in canvas order: Legal (LEGAL-02, built), then
 * the fourth, Schools (SCHOOLS-03; BRIEF H1 puts it where the canvas draws Shop). Pay bills stays off at launch
 * (R-42), so it takes no slot. The canvas order is Pay bills, Events, Legal, then the fourth; Events was drawn second
 * but, with Pay bills absent, is first.
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

/** The tiles present, in the canvas's order (U-H1). `TodayLoading` draws one shape for each. */
function presentServices(onOpenEvents: () => void, onOpenLegal: () => void): Service[] {
  return [
    { key: 'events', icon: 'CalendarDays', label: 'Events', onPress: onOpenEvents },
    { key: 'legal', icon: 'Scale', label: 'Legal', onPress: onOpenLegal },
  ];
}
export const servicesPresent = presentServices(() => undefined, () => undefined).length;

export function Services({ onOpenEvents, onOpenLegal }: { onOpenEvents: () => void; onOpenLegal: () => void }) {
  const columns = presentServices(onOpenEvents, onOpenLegal);
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
  heading: { fontSize: m.heading, letterSpacing: m.headingTracking * m.heading },
  grid: { flexDirection: 'row' },
  column: { width: '25%', alignItems: 'center' },
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
