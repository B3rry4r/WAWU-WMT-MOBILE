import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { Money } from '@/components/Money';
import { ACCT, BalanceEye, FittedBalance, MoneyGround } from '@/features/wallet/home/BalanceCard';
import { radius, useWawu } from '@/theme';

import { cardInk, todayMetrics as m, todayWords } from './look';
import type { MoneyCardState } from './model';

export type MoneyCardProps = {
  state: MoneyCardState;
  /** The figure hidden behind dots (the eye). */
  masked: boolean;
  onToggleMask: () => void;
  /** Opens Open your wallet (A26) for a person with no wallet yet. */
  onOpenWallet: () => void;
  /** Asks `GET /money/wallet` again (opening, or that read failed). */
  onRetryWallet: () => void;
  /** Asks for the balance again (the bank did not answer, frozen, or that read failed). */
  onRetryBalance: () => void;
  retrying: boolean;
};

/**
 * H1's Naira balance card: the Naira chip and the eye, then the bank's figure, on the Wallet tab's own money
 * ground (`MoneyGround`, `--shadow-money`) at H1's 26 corner. The figure is W1's `FittedBalance` at H1's 38, so
 * a balance is never cut off here either; with no figure, the Wallet tab's words for the state and its one
 * button take the figure's place.
 *
 * Send, Add and Bills are added by WALLET-02, WALLET-05 and BILLS-01 with their screens, and Scan by WALLET-20
 * after launch (R-27, R-41); the chip's currency switch comes with the Dollar and Crypto accounts (WALLET-21),
 * so the chip is a label until then.
 */
export function MoneyCard({ state, masked, onToggleMask, onOpenWallet, onRetryWallet, onRetryBalance, retrying }: MoneyCardProps) {
  const { shadows } = useWawu();

  let body;
  if (state.kind === 'figure') {
    body = (
      <View style={styles.figure}>
        <FittedBalance testID="today-balance" availableKobo={state.kobo} hidden={masked} base={m.figure} />
      </View>
    );
  } else if (state.kind === 'loading') {
    body = (
      <View style={styles.loadingFigure}>
        <Money testID="today-balance-loading" minorUnits={0} loading size={m.figure} tone="textOnAccent" />
      </View>
    );
  } else {
    const press = { open_wallet: onOpenWallet, check_wallet: onRetryWallet, retry_wallet: onRetryWallet, retry_balance: onRetryBalance }[state.action];
    const failed = state.state === 'unreachable' || state.state === 'wallet_error' || state.state === 'balance_error';
    body = (
      <View style={styles.notice} testID={`today-balance-${state.state}`}>
        <Text accessibilityRole="header" style={[todayWords.notice, { color: cardInk.ink }]}>
          {state.title}
        </Text>
        <Text accessibilityRole={failed ? 'alert' : undefined} style={[todayWords.noticeBody, { color: cardInk.ink }]}>
          {state.message}
        </Text>
        <View style={styles.action}>
          {state.action === 'open_wallet' ? (
            <Button testID="today-open-wallet" label="Open your wallet" size="md" icon="Wallet" onPress={press} />
          ) : (
            <Button
              testID="today-balance-retry"
              label={state.action === 'check_wallet' ? 'Check again' : 'Try again'}
              variant="glass"
              size="md"
              icon="RotateCw"
              loading={retrying}
              onPress={press}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View testID="today-balance-card" style={[styles.card, { boxShadow: shadows.money }]}>
      <MoneyGround corner={radius.money} glowId="today-balance-glow" />
      <View style={styles.top}>
        <View style={[styles.chip, { backgroundColor: cardInk.chip }]}>
          <CurrencyFlag currency="NGN" size={m.flag} />
          <Text style={[todayWords.chip, { color: cardInk.ink }]}>Naira</Text>
        </View>
        {state.kind === 'figure' ? <BalanceEye testID="today-balance-eye" hidden={masked} onPress={onToggleMask} /> : null}
      </View>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.money,
    paddingTop: m.moneyPadTop,
    paddingHorizontal: m.moneyPadX,
    paddingBottom: m.moneyPadBottom,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    height: m.chipHeight,
    borderRadius: radius.chip,
    paddingLeft: m.chipPadLeft,
    paddingRight: m.chipPadRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.chipGap,
  },
  /** H1's 14 under the chip row, of which the shared fitted figure keeps W1's 10 itself. */
  figure: { marginTop: m.figureTop - ACCT.figureTop },
  loadingFigure: { marginTop: m.figureTop },
  notice: { marginTop: m.noticeTop, alignItems: 'flex-start' },
  action: { marginTop: m.noticeGap },
});
