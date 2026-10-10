import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { layout, space } from '@/theme';

/**
 * design/_gen/kit.js line 24 (`Big`) holding wallet.js line 41 (`walletHead`): the title sits 6 below the
 * status bar and 14 above what follows, and the scan and settings buttons (42 round, 8 apart) stand at the
 * far end. Every state draws the bar, the loading one (W4) and the error ones (W6) included.
 *
 * Scan (W24, "Scan to pay and my QR code") is WALLET-20's and settings (W35) is WALLET-06's: each is drawn
 * and does nothing until its task wires it (R-46).
 */
const BAR = { top: 6, bottom: 14, titleGap: 10 } as const;

export function WalletBar() {
  return (
    <View testID="wallet-bar" style={styles.bar}>
      <Text variant="title" accessibilityRole="header">
        Wallet
      </Text>
      <View style={styles.icons}>
        <IconButton testID="wallet-scan" icon="ScanLine" label="Scan to pay" onPress={unbuilt('WALLET-20')} />
        <IconButton testID="wallet-settings" icon="Settings2" label="Wallet settings" onPress={unbuilt('WALLET-06')} />
      </View>
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
    justifyContent: 'space-between',
    gap: BAR.titleGap,
  },
  icons: { flexDirection: 'row', gap: space.sm },
});
