import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

import { kindIcon, type GridTile } from './model';

/**
 * design/_gen/me.js line 14, `grid`: three across, 4 between, 128 high, out to the screen's edges (the body's
 * 20 is taken back). A paid tile is frosted (10 blur, black at 0.3) with a 15 lock (2.4) 8 in from the top
 * right; every tile has a 12 play mark (1.8, filled) and 12 at 600 white, 8 from the left and 7 from the bottom.
 */
export const gridMetrics = { columns: 3, between: space.xs, height: 128, frost: 10, lock: 15, lockStroke: 2.4, mark: 12, markStroke: 1.8, inset: 8, bottom: 7, captionGap: 4, caption: 12, kindIcon: 28 } as const;

/** The grid, as rows of three: a flex row keeps every tile the same width at any screen width. */
export function ContentGrid({ tiles }: { tiles: readonly GridTile[] }) {
  const rows: GridTile[][] = [];
  for (let i = 0; i < tiles.length; i += gridMetrics.columns) rows.push(tiles.slice(i, i + gridMetrics.columns));
  return (
    <View testID="me-grid" style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((tile) => (
            <Tile key={tile.id} tile={tile} />
          ))}
          {Array.from({ length: gridMetrics.columns - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Tile({ tile }: { tile: GridTile }) {
  const { colors } = useWawu();
  // A still that will not load (a link that has expired) shows the kind of file instead, never an empty box.
  const [broken, setBroken] = useState(false);
  const still = tile.still && !broken ? tile.still : null;
  return (
    <View
      testID={`me-tile-${tile.id}`}
      accessible
      accessibilityLabel={tile.spoken}
      style={[styles.cell, styles.tile, { backgroundColor: colors.surfaceSunken }]}
    >
      {still ? (
        <Image
          source={{ uri: still }}
          contentFit="cover"
          blurRadius={tile.locked ? gridMetrics.frost : 0}
          style={StyleSheet.absoluteFill}
          onError={() => setBroken(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.centre]}>
          <Icon name={kindIcon(tile.kind)} size={gridMetrics.kindIcon} color={colors.textMuted} />
        </View>
      )}
      {/* The white caption needs the veil on a paid tile and on any tile with no picture behind it (light mode's sunken block is near white). */}
      {tile.locked || !still ? <View testID={`me-tile-${tile.id}-veil`} style={[StyleSheet.absoluteFill, { backgroundColor: colors.mediaBlack30 }]} /> : null}
      {tile.locked ? (
        <View style={styles.lock}>
          <Icon name="Lock" size={gridMetrics.lock} color={colors.textOnAccent} strokeWidth={gridMetrics.lockStroke} />
        </View>
      ) : null}
      <View style={styles.caption}>
        <Icon name="Play" size={gridMetrics.mark} color={colors.textOnAccent} strokeWidth={gridMetrics.markStroke} fill={colors.textOnAccent} />
        <Text variant="caption" tone="textOnAccent" style={styles.captionText} testID={`me-tile-${tile.id}-caption`}>
          {tile.caption}
        </Text>
      </View>
    </View>
  );
}

/** Three loading tiles in the grid's place. */
export function GridSkeleton() {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {Array.from({ length: gridMetrics.columns }, (_, i) => (
          <View key={i} style={styles.cell}>
            <Skeleton height={gridMetrics.height} radius={0} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: gridMetrics.between, marginHorizontal: -layout.gutter },
  row: { flexDirection: 'row', gap: gridMetrics.between },
  cell: { flex: 1, height: gridMetrics.height },
  tile: { overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  lock: { position: 'absolute', top: gridMetrics.inset, right: gridMetrics.inset },
  caption: { position: 'absolute', left: gridMetrics.inset, bottom: gridMetrics.bottom, flexDirection: 'row', alignItems: 'center', gap: gridMetrics.captionGap },
  captionText: { ...font(600), fontSize: gridMetrics.caption },
});
