import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
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
 * preselected, S2") sends every tile to the Services list, `/bills` (S2, BILLS-01). The preselected bill is BILLS-03's
 * refinement, so until it lands every tile opens S2 itself.
 *
 * Only the tiles whose screens are built are drawn (R-47): Power (electricity, S3 and S4) and More (S2 itself). Airtime, Data
 * and TV open screens that BILLS-03 builds, so BILLS-03 adds those three tiles, as drawn, in the canvas's order:
 * `{ key: 'airtime', icon: 'Smartphone', label: 'Airtime' }`, `{ key: 'data', icon: 'Wifi', label: 'Data' }` before Power and
 * `{ key: 'tv', icon: 'Tv', label: 'TV' }` after it. The two that are drawn sit in the canvas's own columns (packed from the left,
 * each a column of `BILL_TILE.square + BILL_TILE.extra`), at the size five columns give, so adding the three moves nothing.
 */
type Bill = { key: string; icon: IconName; label: string };
const BILLS: readonly Bill[] = [
  { key: 'power', icon: 'Zap', label: 'Power' },
  { key: 'more', icon: 'LayoutGrid', label: 'More' },
];

/** How many tiles are drawn, for the loading shapes that stand for them (W4). */
export const BILLS_DRAWN = BILLS.length;

export function BillTiles() {
  const router = useRouter();
  // The size the canvas's five columns give, not the two that are drawn: a bigger tile now would shrink when BILLS-03 adds three.
  const size = billTileSize(useRowRoom());
  return (
    <View testID="wallet-bills" style={styles.row}>
      {BILLS.map((bill) => (
        <Tile key={bill.key} bill={bill} size={size} onPress={() => router.push('/bills')} />
      ))}
    </View>
  );
}

function Tile({ bill, size, onPress }: { bill: Bill; size: number; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`wallet-bill-${bill.key}`}
      accessibilityRole="button"
      accessibilityLabel={bill.label}
      onPress={onPress}
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
  row: { flexDirection: 'row', justifyContent: 'flex-start' },
  tile: { alignItems: 'center', gap: BILL_TILE.gap },
  square: {
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: BILL_TILE.label, lineHeight: canvasNormalLineHeight(BILL_TILE.label) },
});
