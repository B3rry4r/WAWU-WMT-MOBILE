import { StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { unbuilt } from '@/lib/unbuilt';
import { space } from '@/theme';

/**
 * wallet.js line 42 (`actions`): Send and Add money are secondary 54 pills with their glyph, side by side, then
 * Swap as a 54 round button, 8 apart. The two pills grow from their own width (a flex of 1 on content-sized
 * pills), which is why the canvas draws Send narrower than Add money.
 *
 * Send (W7) is WALLET-02's, Add money (W15) WALLET-05's and Swap (W20) WALLET-21's: each is drawn and does
 * nothing until its task wires it, and none of them reads, charges or moves money here (R-46).
 */
const ACTIONS = { swap: 54 } as const;

export function WalletActions() {
  return (
    <View testID="wallet-actions" style={styles.row}>
      <Button testID="wallet-send" label="Send" icon="ArrowUpRight" variant="secondary" onPress={unbuilt('WALLET-02')} style={styles.pill} />
      <Button testID="wallet-add-money" label="Add money" icon="Plus" variant="secondary" onPress={unbuilt('WALLET-05')} style={styles.pill} />
      <IconButton testID="wallet-swap" icon="ArrowLeftRight" label="Swap" size={ACTIONS.swap} onPress={unbuilt('WALLET-21')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { flexGrow: 1, flexBasis: 'auto' },
});
