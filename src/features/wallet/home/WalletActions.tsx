import { StyleSheet, View } from 'react-native';

import { Button, IconButton, type ButtonSize } from '@/components/Button';
import { unbuilt } from '@/lib/unbuilt';
import { space } from '@/theme';

import { useRowRoom } from './useRowRoom';

/**
 * wallet.js line 42 (`actions`): Send and Add money are secondary 54 pills with their glyph, side by side, then
 * Swap as a 54 round button, 8 apart. The two pills grow from their own width (a flex of 1 on content-sized
 * pills), which is why the canvas draws Send narrower than Add money.
 *
 * Send (W7) is WALLET-02's, Add money (W15) WALLET-05's and Swap (W20) WALLET-21's: each is drawn and does
 * nothing until its task wires it, and none of them reads, charges or moves money here (R-46).
 *
 * The canvas fits this row on a 390 screen with 7 px to spare, and nothing narrower is drawn. Below that the
 * pills give way, in this order (round 2, defect 1):
 *  1. their side padding gives the room back: 12 is the floor, and the canvas's 24 is only ever slack, because the
 *     pills grow from their content, so a pill is the same width whatever its padding while the row has room;
 *  2. then the label steps down to the next of the kit's own sizes (kit.js line 15, `Btn`: 16, 14.5, 13.5), the
 *     pill's 54 height and its glyph's pairing with the label unchanged. The row never wraps a word (the canvas's
 *     button is `white-space: nowrap`) and never clips one.
 * Swap stays the canvas's 54: with the pills at the floor and the smallest label there is room to spare at 320.
 *
 * `ACTION_ROOM` are row widths, from the DOM at the default text size: what each step needs measured at 295 (16),
 * 279 (14.5) and 268 (13.5) with the floor padding, plus about 5 percent for a phone's own text rendering.
 */
const ACTIONS = { height: 54, swap: 54, padFloor: space.md } as const;
export const ACTION_ROOM = { lg: 310, md: 292 } as const;

/** The label size for a row that has `room` to use. */
export function actionSize(room: number): ButtonSize {
  if (room >= ACTION_ROOM.lg) return 'lg';
  if (room >= ACTION_ROOM.md) return 'md';
  return 'sm';
}

export function WalletActions() {
  const size = actionSize(useRowRoom());
  return (
    <View testID="wallet-actions" style={styles.row}>
      <Button testID="wallet-send" label="Send" icon="ArrowUpRight" variant="secondary" size={size} onPress={unbuilt('WALLET-02')} style={styles.pill} />
      <Button testID="wallet-add-money" label="Add money" icon="Plus" variant="secondary" size={size} onPress={unbuilt('WALLET-05')} style={styles.pill} />
      <IconButton testID="wallet-swap" icon="ArrowLeftRight" label="Swap" size={ACTIONS.swap} onPress={unbuilt('WALLET-21')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 0, height: ACTIONS.height, paddingHorizontal: ACTIONS.padFloor },
});
