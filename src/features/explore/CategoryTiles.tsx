import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import type { CategoryTileItem } from './categories';

/**
 * design/_gen/explore.js `catTile`: 92 by 84, corner 18, 6 inside at the sides, a 21 icon in the accent
 * ink 7 above an 11 semi-bold label (line height 1.2). The first tile (All) is on: accent tint, a 1.5 accent ring;
 * the rest are cards with a hairline. The row scrolls to the screen's right edge, 8 between tiles.
 */
export const tileMetrics = { width: 92, height: 84, padH: 6, icon: 21, iconGap: 7, label: 11, labelLeading: 1.2, ringOn: 1.5 } as const;

function Tile({ item, on, onPress }: { item: CategoryTileItem; on: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`explore-tile-${item.kind === 'category' ? item.id : item.kind}`}
      accessibilityRole="button"
      accessibilityLabel={item.kind === 'more' ? 'More categories' : item.label}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: on ? colors.accentTint : pressed ? colors.surfaceSunken : colors.surfaceCard,
          borderColor: on ? colors.accent : colors.borderHairline,
          borderWidth: on ? tileMetrics.ringOn : StyleSheet.hairlineWidth,
        },
        ring.style,
      ]}
    >
      <Icon name={item.icon} size={tileMetrics.icon} color={colors.accentFg} />
      <Text variant="body" numberOfLines={2} style={[font(600), styles.label]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export type CategoryTilesProps = {
  items: readonly CategoryTileItem[];
  onOpen: (item: CategoryTileItem) => void;
};

/** X1's category tiles: All, the first categories, More. Each opens Categories (X2, X3). */
export function CategoryTiles({ items, onOpen }: CategoryTilesProps) {
  return (
    <ScrollView
      testID="explore-tiles"
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <Tile key={item.kind === 'category' ? item.id : item.kind} item={item} on={item.kind === 'all'} onPress={() => onOpen(item)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, marginHorizontal: -layout.gutter },
  row: { gap: space.sm, paddingHorizontal: layout.gutter },
  tile: {
    width: tileMetrics.width,
    height: tileMetrics.height,
    paddingHorizontal: tileMetrics.padH,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tileMetrics.iconGap,
    flexShrink: 0,
  },
  label: { fontSize: tileMetrics.label, lineHeight: tileMetrics.label * tileMetrics.labelLeading, textAlign: 'center' },
});
