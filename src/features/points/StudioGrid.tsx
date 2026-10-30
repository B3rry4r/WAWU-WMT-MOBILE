import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { MenuRow } from './StudioPrompt';
import { Popover, usePopover } from './StudioPopover';
import type { AiTool } from './studioApi';
import { HOME_WORDS, type Tile } from './studioHomeModel';
import { costLine, STUDIO_WORDS, toolIcon } from './studioModel';

/** ElevenLabs' tiles in WAWU's tokens: a rounded square with the icon in it, 4 to a line 10 apart, one or two words under it. */
const GRID = { perLine: 4, between: 10, lineGap: 18, icon: 26, label: 13, labelTop: 8, dim: 0.5, moreWash: 6 } as const;

export type StudioGridProps = {
  tiles: readonly Tile[];
  /** Every other tool the Hub lists: the rows of More. */
  more: readonly AiTool[];
  /** No points: every tool is dimmed (a tool still opens, where the quote says what is short). */
  none: boolean;
  onOpenTool?: (tool: AiTool) => void;
};

type Cell = { key: string; tile?: Tile; more?: true };

/** The grid of the main tools, then More. With nothing for More there is no More tile (R-47). */
export function StudioGrid({ tiles, more, none, onOpenTool }: StudioGridProps) {
  const moreRef = useRef<View>(null);
  const menu = usePopover(moreRef);
  const cells: Cell[] = tiles.map((tile) => ({ key: tile.tool.id, tile }));
  if (more.length > 0) cells.push({ key: 'more', more: true });
  const lines: Cell[][] = [];
  for (let i = 0; i < cells.length; i += GRID.perLine) lines.push(cells.slice(i, i + GRID.perLine));
  return (
    <View testID="studio-tools" style={styles.grid}>
      {lines.map((line) => (
        <View key={line[0].key} style={styles.line}>
          {line.map((cell) =>
            cell.tile ? (
              <GridTile key={cell.key} tile={cell.tile} dim={none || !cell.tile.tool.enabled} onOpen={cell.tile.tool.enabled && onOpenTool ? () => onOpenTool(cell.tile!.tool) : undefined} />
            ) : (
              <MoreTile key={cell.key} open={menu.open} anchorRef={moreRef} onPress={menu.show} />
            ),
          )}
          {Array.from({ length: GRID.perLine - line.length }, (_, i) => (
            <View key={`pad-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
      <Popover visible={menu.open} onClose={menu.hide} anchor={menu.anchor} align="right" label={HOME_WORDS.moreMenu} testID="studio-more-menu">
        {more.map((tool) => {
          const line = tool.enabled ? costLine(tool) : STUDIO_WORDS.unavailable;
          const open = tool.enabled && onOpenTool;
          return (
            <MenuRow
              key={tool.id}
              testID={`studio-tool-${tool.id}`}
              icon={toolIcon(tool)}
              title={tool.name}
              line={tool.description}
              label={`${tool.name}, ${line}`}
              dim={none || !tool.enabled}
              onPress={
                open
                  ? () => {
                      menu.hide();
                      onOpenTool(tool);
                    }
                  : undefined
              }
            />
          );
        })}
      </Popover>
    </View>
  );
}

/** The square, its icon and the words under it: a button when the tool opens, a plain card when it does not. */
function Face({ icon, label, wash }: { icon: IconName; label: string; wash?: boolean }) {
  const { colors } = useWawu();
  return (
    <>
      <View style={[styles.wash, wash ? { backgroundColor: colors.surfaceSunken } : null]} />
      <View style={[styles.square, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
        <Icon name={icon} size={GRID.icon} color={colors.textSecondary} strokeWidth={1.6} />
      </View>
      <Text variant="body" numberOfLines={2} style={[font(500), styles.label, { fontSize: GRID.label, lineHeight: canvasNormalLineHeight(GRID.label) }]}>
        {label}
      </Text>
    </>
  );
}

function GridTile({ tile, dim, onOpen }: { tile: Tile; dim: boolean; onOpen?: () => void }) {
  const ring = useFocusRing();
  const line = tile.tool.enabled ? costLine(tile.tool) : STUDIO_WORDS.unavailable;
  const label = `${tile.tool.name}, ${line}`;
  const face = <Face icon={toolIcon(tile.tool)} label={tile.label} />;
  return onOpen ? (
    <Pressable testID={`studio-tool-${tile.tool.id}`} accessibilityRole="button" accessibilityLabel={label} onPress={onOpen} {...ring.handlers} style={[styles.cell, dim ? styles.dim : null, ring.style]}>
      {face}
    </Pressable>
  ) : (
    <View testID={`studio-tool-${tile.tool.id}`} accessible accessibilityLabel={label} style={[styles.cell, dim ? styles.dim : null]}>
      {face}
    </View>
  );
}

function MoreTile({ open, anchorRef, onPress }: { open: boolean; anchorRef: React.RefObject<View | null>; onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      ref={anchorRef}
      collapsable={false}
      testID="studio-more"
      accessibilityRole="button"
      accessibilityLabel={HOME_WORDS.moreMenu}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.cell, ring.style]}
    >
      <Face icon="Ellipsis" label={HOME_WORDS.more} wash={open} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { gap: GRID.lineGap },
  line: { flexDirection: 'row', gap: GRID.between },
  // Four to a line with the gap between: each cell is a quarter of the line less its share of the gaps.
  cell: { flex: 1, minWidth: 0, alignItems: 'center' },
  square: { width: '100%', aspectRatio: 1, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  // ElevenLabs washes the whole More cell while its menu is open.
  wash: { position: 'absolute', top: -GRID.moreWash, bottom: -GRID.moreWash, left: -GRID.moreWash / 2, right: -GRID.moreWash / 2, borderRadius: radius.tile },
  label: { textAlign: 'center', marginTop: GRID.labelTop, paddingHorizontal: space.xs / 2 },
  dim: { opacity: GRID.dim },
});
