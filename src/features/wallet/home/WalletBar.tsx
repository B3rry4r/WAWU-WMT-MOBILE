import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { layout } from '@/theme';

/**
 * design/_gen/kit.js line 24 (`Big`) holding wallet.js line 41 (`walletHead`): the title sits 6 below the
 * status bar and 14 above what follows. Every state draws the bar, the loading one (W4) and the error ones (W6) included.
 *
 * The canvas also draws a scan icon (W24, "Scan to pay and my QR code", WALLET-20) and a settings icon (W35, WALLET-06) at
 * the far end. Each is drawn by the task that builds where it leads (R-47), so until then the bar is the title alone.
 */
const BAR = { top: 6, bottom: 14 } as const;

export function WalletBar() {
  return (
    <View testID="wallet-bar" style={styles.bar}>
      <Text variant="title" accessibilityRole="header">
        Wallet
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: BAR.top,
    paddingBottom: BAR.bottom,
    paddingHorizontal: layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
