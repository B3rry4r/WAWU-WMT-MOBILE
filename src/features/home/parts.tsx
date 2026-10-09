import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { radius, space, useWawu } from '@/theme';

import { gutter, todayMetrics as m } from './look';

/** How many neutral cards hold the rail's place: three, the last running off the edge (the canvas draws three). */
const NEUTRAL_CARDS = 3;

/**
 * The neutral picture R-46 puts where the Hub serves nothing and the canvas draws no empty state: the sunken block the
 * shared `Skeleton` uses, one quiet glyph on it, and no name, date or price. It is not pressable.
 */
export function NeutralFrame({ icon, style, testID }: { icon: IconName; style?: StyleProp<ViewStyle>; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={[styles.frame, { backgroundColor: colors.surfaceSunken }, style]}>
      <Icon name={icon} size={m.frameGlyph} color={colors.textMuted} strokeWidth={1.5} />
    </View>
  );
}

/**
 * "Creators to discover" with nobody to suggest: the rail's place held by three neutral cards at the cards' own size, so
 * the section keeps its height. The heading and See all stay (the rail's own component draws them).
 */
export function CreatorsRailEmpty() {
  return (
    <View testID="today-creators-empty" accessible accessibilityLabel="Creators to discover, none to show" style={styles.bleed}>
      <View style={styles.rail}>
        {Array.from({ length: NEUTRAL_CARDS }, (_, i) => (
          <NeutralFrame key={i} icon="UserRound" style={styles.card} />
        ))}
      </View>
    </View>
  );
}

/** "See all" on Creators to discover: the list of every creator (X4) is EXPLORE-02's, so until it is built the link opens nothing. */
export function SeeAllCreators() {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="today-creators-see-all"
      accessibilityRole="button"
      accessibilityLabel="See all creators"
      hitSlop={space.md}
      onPress={unbuilt('EXPLORE-02')}
      {...ring.handlers}
      style={ring.style}
    >
      <Text variant="linkStrong" style={styles.seeAll}>
        See all
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  /** Runs off both edges as the real rail does, and is clipped there: a neutral frame is not a list, so it does not scroll. */
  bleed: { marginHorizontal: -gutter, flexGrow: 0, overflow: 'hidden' },
  rail: { flexDirection: 'row', gap: m.cardsApart, paddingHorizontal: gutter },
  card: { width: m.cardWidth, height: m.cardHeight, borderRadius: radius.media },
  seeAll: { fontSize: m.seeAll },
});
