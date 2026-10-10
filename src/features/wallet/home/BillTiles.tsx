import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { useRowRoom } from './useRowRoom';

/**
 * wallet.js line 43 (`bills`, kit `Tile` at its default size): five columns spread edge to edge, each a 54
 * square at the tile corner on the card colour with a hairline, its glyph 23 in the text colour, the word 12.5
 * semi-bold in the secondary colour under it, 8 apart; the column is 16 wider than the square.
 *
 * The kit's `Tile` takes a size (kit.js line 23: the column is the size plus 16, the glyph is the size times
 * 0.42, rounded), and 54 is the one that makes five columns exactly the 350 of a 390 screen. A narrower phone
 * has less than 350, so the size steps down by that same rule until five columns fit (`billTileSize`): 54 from
 * 390 up (the canvas, to the pixel), 51 at 375, 48 at 360, 44 at 340, 40 at 320. Nothing is a fixed 70.
 */
export const BILL_TILE = { square: 54, glyphRatio: 0.42, extra: 2 * space.sm, label: 12.5, gap: space.sm, count: 5 } as const;

/** The square's size for a row that has `room` to use: the canvas's 54 when five columns of it fit, less when they do not. */
export function billTileSize(room: number, count: number = BILL_TILE.count): number {
  return Math.max(0, Math.min(BILL_TILE.square, Math.floor(room / count) - BILL_TILE.extra));
}

/** The glyph in a square of that size (kit.js line 23: the size times 0.42, rounded; 23 in the canvas's 54). */
export function billGlyph(square: number): number {
  return Math.round(square * BILL_TILE.glyphRatio);
}

/**
 * The canvas's hotspot for the bills row (design/_gen/wallet.js, "Wallet · Airtime, Data, Power, TV: that bill,
 * preselected, S2") sends every tile to the Services list, which BILLS-01 builds (its artboards are S2, S3, S4,
 * S10 and S13). Until it does each tile is drawn and does nothing (R-46).
 */
type Bill = { key: string; icon: IconName; label: string; onPress: () => void };
const BILLS: readonly Bill[] = [
  { key: 'airtime', icon: 'Smartphone', label: 'Airtime', onPress: unbuilt('BILLS-01') },
  { key: 'data', icon: 'Wifi', label: 'Data', onPress: unbuilt('BILLS-01') },
  { key: 'power', icon: 'Zap', label: 'Power', onPress: unbuilt('BILLS-01') },
  { key: 'tv', icon: 'Tv', label: 'TV', onPress: unbuilt('BILLS-01') },
  { key: 'more', icon: 'LayoutGrid', label: 'More', onPress: unbuilt('BILLS-01') },
];

export function BillTiles() {
  const size = billTileSize(useRowRoom(), BILLS.length);
  return (
    <View testID="wallet-bills" style={styles.row}>
      {BILLS.map((bill) => (
        <Tile key={bill.key} bill={bill} size={size} />
      ))}
    </View>
  );
}

function Tile({ bill, size }: { bill: Bill; size: number }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`wallet-bill-${bill.key}`}
      accessibilityRole="button"
      accessibilityLabel={bill.label}
      onPress={bill.onPress}
      {...ring.handlers}
      style={[styles.tile, { width: size + BILL_TILE.extra }, ring.style]}
    >
      <View style={[styles.square, { width: size, height: size, backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
        <Icon name={bill.icon} size={billGlyph(size)} color={colors.textPrimary} />
      </View>
      <Text variant="body" tone="textSecondary" numberOfLines={1} style={[font(600), styles.label]}>
        {bill.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { alignItems: 'center', gap: BILL_TILE.gap },
  square: {
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: BILL_TILE.label, lineHeight: canvasNormalLineHeight(BILL_TILE.label) },
});
