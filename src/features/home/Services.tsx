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
 * R-61 (owner, 16 Oct 2026): the drawn row is Studio, Learn, Monetize, Legal. Learn (Schools, SCHOOLS-03) and Legal
 * (LEGAL-02) are built; Monetize opens the Create hub (M19), which is for creator accounts only (R-38), so it is drawn
 * for them and for no one else (R-47: a buyer's tap would send them back Home). Studio is POINTS-07's tile, added where the
 * canvas draws it, first. The two tiles the 16 Oct export dropped are gone (DV2-RM): Pay bills (R-52, bills are off) and
 * Events (R-61, events are reached from Explore). The tiles present pack from the left, four to a line as drawn (U-H1:
 * there is no empty slot), so the row is the canvas's once Studio is in.
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

export type ServicesProps = {
  onOpenLearn: () => void;
  onOpenLegal: () => void;
  /** Opens the Create hub (M19). Given only to a creator account: without it Monetize is not drawn. */
  onOpenMonetize?: () => void;
};

/** The tiles present, in the canvas's order (R-61). `TodayLoading` draws one shape for each that is always there. */
function presentServices({ onOpenLearn, onOpenLegal, onOpenMonetize }: ServicesProps): Service[] {
  const tiles: (Service | null)[] = [
    { key: 'schools', icon: 'GraduationCap', label: 'Learn', onPress: onOpenLearn },
    onOpenMonetize ? { key: 'monetize', icon: 'HandCoins', label: 'Monetize', onPress: onOpenMonetize } : null,
    { key: 'legal', icon: 'Scale', label: 'Legal', onPress: onOpenLegal },
  ];
  return tiles.filter((tile): tile is Service => tile !== null);
}
const nothing = () => undefined;
/** The tiles every account has: what the loading shapes stand in for. */
export const servicesPresent = presentServices({ onOpenLearn: nothing, onOpenLegal: nothing }).length;

export function Services(props: ServicesProps) {
  const columns = presentServices(props);
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: m.headingBelow },
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
