import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { kindIcon, type GridTile } from './model';

/**
 * design/_gen/me.js line 14, `grid`: three across, 4 between, 128 high, out to the screen's edges (the body's
 * 20 is taken back). A paid tile is frosted (10 blur, black at 0.3) with a 15 lock (2.4) 8 in from the top
 * right; every tile has a 12 play mark (1.8, filled) and 12 at 600 white, 8 from the left and 7 from the bottom.
 * line 18 (`draftTag`): a draft carries a 22 high tag 8 in from the top and the left, 8 across, 11 at 700 white on ink.
 */
export const gridMetrics = {
  columns: 3,
  between: space.xs,
  height: 128,
  frost: 10,
  lock: 15,
  lockStroke: 2.4,
  mark: 12,
  markStroke: 1.8,
  inset: 8,
  bottom: 7,
  captionGap: 4,
  caption: 12,
  kindIcon: 28,
  draftTag: { height: 22, padH: 8, font: 11 },
} as const;

/** The grid, as rows of three: a flex row keeps every tile the same width at any screen width. */
export function ContentGrid({ tiles, onOpenDraft, onOpenPiece }: { tiles: readonly GridTile[]; onOpenDraft?: () => void; onOpenPiece?: (id: string) => void }) {
  const rows: GridTile[][] = [];
  for (let i = 0; i < tiles.length; i += gridMetrics.columns) rows.push(tiles.slice(i, i + gridMetrics.columns));
  return (
    <View testID="me-grid" style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((tile) => (
            <Tile key={tile.id} tile={tile} onOpenDraft={onOpenDraft} onOpenPiece={onOpenPiece} />
          ))}
          {Array.from({ length: gridMetrics.columns - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Tile({ tile, onOpenDraft, onOpenPiece }: { tile: GridTile; onOpenDraft?: () => void; onOpenPiece?: (id: string) => void }) {
  const { colors } = useWawu();
  // A still that will not load (a link that has expired) shows the kind of file instead, never an empty box.
  const [broken, setBroken] = useState(false);
  const still = tile.still && !broken ? tile.still : null;
  // A draft opens the shop that finishes it (VF2, VERIFY-01); a published piece opens its own page (WALK-FIX H1, design M5: the grid is the
  // way in). A screen that gives no opener leaves its tiles as plain pictures.
  const opens = tile.draft ? onOpenDraft ?? null : onOpenPiece ? () => onOpenPiece(tile.id) : null;
  const Frame = opens ? Pressable : View;
  return (
    <Frame
      testID={`me-tile-${tile.id}`}
      accessible
      accessibilityLabel={tile.spoken}
      {...(opens ? { accessibilityRole: 'button' as const, onPress: opens } : {})}
      style={[styles.cell, styles.tile, { backgroundColor: colors.surfaceSunken }]}
    >
      {still ? (
        <Image
          testID="grid-thumb-image"
          source={{ uri: still }}
          contentFit="cover"
          blurRadius={tile.locked ? gridMetrics.frost : 0}
          style={StyleSheet.absoluteFill}
          onError={() => setBroken(true)}
        />
      ) : (
        <View testID="grid-thumb-mark" style={[StyleSheet.absoluteFill, styles.centre]}>
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
      {tile.draft ? (
        // The canvas inks the tag at 0.7; the nearest token is mediaInk55, and the tile's veil sits under it.
        <View testID={`me-tile-${tile.id}-draft`} style={[styles.draftTag, { backgroundColor: colors.mediaInk55 }]}>
          <Text variant="caption" tone="textOnAccent" style={styles.draftText}>
            Draft
          </Text>
        </View>
      ) : null}
      {tile.draft ? (
        // A draft has no views to play: its title sits where a piece's figure does.
        <View style={[styles.caption, styles.draftCaption]}>
          <Text variant="caption" tone="textOnAccent" numberOfLines={1} style={[styles.captionText, styles.draftTitle]} testID={`me-tile-${tile.id}-caption`}>
            {tile.caption}
          </Text>
        </View>
      ) : (
        <View style={styles.caption}>
          <Icon name="Play" size={gridMetrics.mark} color={colors.textOnAccent} strokeWidth={gridMetrics.markStroke} fill={colors.textOnAccent} />
          <Text variant="caption" tone="textOnAccent" style={styles.captionText} testID={`me-tile-${tile.id}-caption`}>
            {tile.caption}
          </Text>
        </View>
      )}
    </Frame>
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
  // The title may use the tile's width less the two insets and no more.
  draftCaption: { right: gridMetrics.inset },
  draftTitle: { flexShrink: 1 },
  draftTag: {
    position: 'absolute',
    top: gridMetrics.inset,
    left: gridMetrics.inset,
    height: gridMetrics.draftTag.height,
    paddingHorizontal: gridMetrics.draftTag.padH,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftText: { ...font(700), fontSize: gridMetrics.draftTag.font, lineHeight: canvasNormalLineHeight(gridMetrics.draftTag.font) },
});
