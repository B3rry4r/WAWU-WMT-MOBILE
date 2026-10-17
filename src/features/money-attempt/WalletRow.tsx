import { StyleSheet, View } from 'react-native';

import { CurrencyFlag } from '@/components/CurrencyFlag';
import { Icon } from '@/components/icon';
import { Money } from '@/components/Money';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { radius, space, useWawu } from '@/theme';

import { WALLET_LABEL } from './refusal';

/** design/_gen/kit.js line 69, `fromWallet`: a 36 coin, 12 apart, 14 by 16 inside; the title 15 / 600, the line 13; a 20 check. */
const walletMetrics = { flag: 36, between: 12, padV: 14, line: 13, check: 20, lineTop: 2, corner: radius.card } as const;

/** kit.js line 69, `fromWallet`: the naira coin, "Pay from wallet", the wallet's balance (the bank's figure) and a ring check. */
export function WalletRow({ balanceKobo }: { balanceKobo: number | null }) {
  const { colors } = useWawu();
  return (
    <View
      testID="pay-from-wallet"
      style={[styles.wallet, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}
    >
      <CurrencyFlag currency="NGN" size={walletMetrics.flag} />
      <View style={styles.words}>
        <Text variant="cardTitle">Pay from wallet</Text>
        <View style={styles.line}>
          <Text variant="meta" tone="textMuted">
            {WALLET_LABEL} ·
          </Text>
          {balanceKobo === null ? (
            <Skeleton width={space.xl * 3} height={walletMetrics.line} testID="wallet-balance-loading" />
          ) : (
            <Money minorUnits={balanceKobo} size={walletMetrics.line} weight={500} tone="textMuted" testID="wallet-balance" />
          )}
          <Text variant="meta" tone="textMuted">
            available
          </Text>
        </View>
      </View>
      <Icon name="CircleCheck" size={walletMetrics.check} color={colors.accentFg} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wallet: { flexDirection: 'row', alignItems: 'center', gap: walletMetrics.between, paddingVertical: walletMetrics.padV, paddingHorizontal: space.lg, borderRadius: walletMetrics.corner },
  words: { flex: 1, minWidth: 0 },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap', marginTop: walletMetrics.lineTop },
});
