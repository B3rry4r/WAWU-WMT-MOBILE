import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { useWawu } from '@/theme';

/**
 * The picture of a community: a rounded square, not a circle (design/_gen/inbox.js line 8 `groupAv`: 52 with
 * a 16 corner; the room's header draws it 40 with a 12 corner, line 71). A community without a picture is
 * normal (a host is never blocked on finding one), so it shows a tinted tile with a group glyph.
 */
export const tileMetrics = {
  row: { size: 52, corner: 16 },
  header: { size: 40, corner: 12 },
  /** The glyph is 46% of the tile, as the avatar's initials are 36% of a circle. */
  glyphScale: 0.46,
} as const;

export type GroupTileProps = {
  uri: string | null;
  size: (typeof tileMetrics)['row'] | (typeof tileMetrics)['header'];
  testID?: string;
};

export function GroupTile({ uri, size, testID }: GroupTileProps) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size.size, height: size.size, borderRadius: size.corner, backgroundColor: colors.accentTint }]}
    >
      {uri ? (
        <Image testID={testID ? `${testID}-image` : undefined} source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <Icon name="Users" size={Math.round(size.size * tileMetrics.glyphScale)} color={colors.accentFg} strokeWidth={2} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
});
