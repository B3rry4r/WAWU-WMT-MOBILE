import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

/**
 * wallet.js line 43 (`bills`, kit `Tile` at its default size): five columns spread edge to edge, each a 54
 * square at the tile corner on the card colour with a hairline, its glyph 23 in the text colour, the word 12.5
 * semi-bold in the secondary colour under it, 8 apart; the column is 16 wider than the square.
 */
export const BILL_TILE = { square: 54, glyph: 23, column: 70, label: 12.5, gap: space.sm } as const;

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
  return (
    <View testID="wallet-bills" style={styles.row}>
      {BILLS.map((bill) => (
        <Tile key={bill.key} bill={bill} />
      ))}
    </View>
  );
}

function Tile({ bill }: { bill: Bill }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`wallet-bill-${bill.key}`}
      accessibilityRole="button"
      accessibilityLabel={bill.label}
      onPress={bill.onPress}
      {...ring.handlers}
      style={[styles.tile, ring.style]}
    >
      <View style={[styles.square, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
        <Icon name={bill.icon} size={BILL_TILE.glyph} color={colors.textPrimary} />
      </View>
      <Text variant="body" tone="textSecondary" numberOfLines={1} style={[font(600), styles.label]}>
        {bill.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { width: BILL_TILE.column, alignItems: 'center', gap: BILL_TILE.gap },
  square: {
    width: BILL_TILE.square,
    height: BILL_TILE.square,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: BILL_TILE.label, lineHeight: canvasNormalLineHeight(BILL_TILE.label) },
});
