import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { layout } from '@/theme';

/**
 * design/_gen/kit.js line 24 (`Big`) holding wallet.js line 41 (`walletHead`): the title sits 6 below the
 * status bar and 14 above what follows, with the round icon buttons at the far end, 8 apart. Every state draws the bar,
 * the loading one (W4) and the error ones (W6) included.
 *
 * The canvas draws a scan icon (W24, "Scan to pay and my QR code", WALLET-20) and a settings icon (W35, "Opens Wallet
 * settings", WALLET-06). The settings icon is here, as drawn, now W35 is built; the scan icon is drawn by the task
 * that builds where it leads (R-47), so until then the bar holds the title and the settings icon.
 */
const BAR = { top: 6, bottom: 14 } as const;

export function WalletBar() {
  const router = useRouter();
  return (
    <View testID="wallet-bar" style={styles.bar}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Wallet
      </Text>
      <IconButton icon="Settings2" label="Wallet settings" onPress={() => router.push('/wallet-settings')} testID="wallet-settings" />
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
  },
  title: { flexShrink: 1 },
});
