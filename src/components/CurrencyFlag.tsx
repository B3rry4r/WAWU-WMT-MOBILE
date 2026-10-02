import { StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, useWawu, type ColorToken } from '@/theme';

export type FlagCurrency = 'NGN' | 'USD' | 'USDT' | 'BTC';

/** design/_gen/kit.js line 12, `CUR`: the sign and the `--cur-*` colour of each currency. */
const coins: Record<FlagCurrency, { sign: string; bg: ColorToken; name: string }> = {
  NGN: { sign: '₦', bg: 'curNgn', name: 'Naira' },
  USD: { sign: '$', bg: 'curUsd', name: 'Dollar' },
  USDT: { sign: '₮', bg: 'curUsdt', name: 'Tether' },
  BTC: { sign: '₿', bg: 'curBtc', name: 'Bitcoin' },
};

/** design/_gen/kit.js line 26, `Flag`: `s = 36`, the sign at `s * 0.46`, 700, a white sign (the `textOnAccent` token, white in both themes). */
const defaultSize = 36;
const signScale = 0.46;

/**
 * Alan Sans has no ₦, ₮ or ₿, so the platform font draws them, as in `Money`
 * (D15 in DECISIONS.md). Alan Sans has "$".
 */
const platformFont = 'System';
const inAlanSans: readonly FlagCurrency[] = ['USD'];

export type CurrencyFlagProps = {
  currency: FlagCurrency;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The round currency coin beside a wallet or account (kit `Flag`). */
export function CurrencyFlag({ currency, size = defaultSize, style, testID }: CurrencyFlagProps) {
  const { colors } = useWawu();
  const coin = coins[currency];
  const face = inAlanSans.includes(currency) ? font(700) : { fontFamily: platformFont, fontWeight: '700' as const };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={coin.name}
      style={[styles.coin, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors[coin.bg] }, style]}
    >
      <NativeText style={[face, { fontSize: size * signScale, color: colors.textOnAccent }]}>{coin.sign}</NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
