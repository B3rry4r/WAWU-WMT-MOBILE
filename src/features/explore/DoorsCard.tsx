import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

/** design/_gen/explore.js line 19, `door`: 13 by 14 inside, a 40 tile of 12 round, 12 to the words, a 15 title and a 12.5 line 2 under it, a 17 chevron. */
export const doorMetrics = { padV: 13, padH: 14, iconToWords: 12, tile: 40, tileRadius: 12, glyph: 19, title: 15, sub: 12.5, subGap: 2, chevron: 17 } as const;

export type Door = {
  id: string;
  icon: IconName;
  title: string;
  sub: string;
  onPress: () => void;
  /** The door's reads are on their way (SERVICES-FEEDBACK 1): the row keeps its pressed look and the app's spinner takes the icon's place in its tile (the Create button floats over the row's right end). */
  busy?: boolean;
};

/**
 * X1 and X15's doors card, one row per door whose screen is built: Find a professional, Find a school, List your services.
 * Every door passed here opens something (R-47).
 */
export function DoorsCard({ doors }: { doors: readonly Door[] }) {
  const { colors } = useWawu();
  return (
    <View testID="explore-doors" style={[styles.card, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
      {doors.map((door, i) => (
        <DoorRow key={door.id} door={door} first={i === 0} />
      ))}
    </View>
  );
}

function DoorRow({ door, first }: { door: Door; first: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`explore-door-${door.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${door.title}, ${door.sub}`}
      accessibilityState={{ busy: door.busy ?? false }}
      onPress={door.onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed || door.busy ? colors.surfaceSunken : 'transparent', boxShadow: first ? [] : [{ offsetX: 0, offsetY: 1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] },
        ring.style,
      ]}
    >
      <View style={[styles.tile, { backgroundColor: colors.accentTint }]}>
        {door.busy ? (
          <ActivityIndicator testID={`explore-door-${door.id}-busy`} size="small" color={colors.accentFg} />
        ) : (
          <Icon name={door.icon} size={doorMetrics.glyph} color={colors.accentFg} />
        )}
      </View>
      <View style={styles.words}>
        <Text variant="body" style={styles.title}>
          {door.title}
        </Text>
        <Text variant="meta" style={styles.sub}>
          {door.sub}
        </Text>
      </View>
      <Icon name="ChevronRight" size={doorMetrics.chevron} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', flexShrink: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: doorMetrics.iconToWords, paddingVertical: doorMetrics.padV, paddingHorizontal: doorMetrics.padH },
  tile: { width: doorMetrics.tile, height: doorMetrics.tile, borderRadius: doorMetrics.tileRadius, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1 },
  title: { ...font(600), fontSize: doorMetrics.title, lineHeight: canvasNormalLineHeight(doorMetrics.title) },
  sub: { fontSize: doorMetrics.sub, marginTop: doorMetrics.subGap },
});
