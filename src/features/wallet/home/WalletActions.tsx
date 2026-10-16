import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { space } from '@/theme';

import { useRowRoom } from './useRowRoom';

/**
 * design/_gen/wallet.js line 43, `actions`: a row 8 apart holding two `secondary` buttons that share what is left, and a 54 round
 * switch-currency button (`IB('ArrowLeftRight', { size: 54 })`). Only the buttons whose screens are built are drawn (R-47): Send
 * (WALLET-02). Add money (WALLET-05) and the currency switch (WALLET-21) add theirs, as drawn, packed from the left.
 *
 * Send keeps the width it has in the canvas, one of two equal buttons beside the 54 round one, so adding the other two moves nothing.
 */
export const ACTIONS = { gap: space.sm, round: 54, buttons: 2 } as const;

/** One button's width for a row with `room` to use: the room less the round button and the gaps, shared by the two buttons. */
export function actionWidth(room: number): number {
  return Math.max(0, Math.floor((room - ACTIONS.round - ACTIONS.gap * ACTIONS.buttons) / ACTIONS.buttons));
}

export function WalletActions({ onSend }: { onSend: () => void }) {
  const width = actionWidth(useRowRoom());
  return (
    <View testID="wallet-actions" style={styles.row}>
      <View style={{ width }}>
        <Button testID="wallet-action-send" label="Send" icon="ArrowUpRight" variant="secondary" full onPress={onSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'flex-start', gap: ACTIONS.gap } });
