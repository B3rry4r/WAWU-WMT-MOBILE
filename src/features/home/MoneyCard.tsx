import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Money } from '@/components/Money';
import { ACCT, BalanceEye, FittedBalance, MoneyGround } from '@/features/wallet/home/BalanceCard';
import { unbuilt } from '@/lib/unbuilt';
import { radius, useWawu } from '@/theme';

import { cardInk, todayMetrics as m, todayWords } from './look';
import type { MoneyCardState } from './model';
import { MoneyActions } from './MoneyActions';

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
  /**
   * The page's own banner carries Try again (every read failed): a card that failed to read says what failed and leaves its
   * button out, so the screen has one Try again for that, not one on every section.
   */
  quiet?: boolean;
};

/** The Naira chip with its chevron. The currency switch it stands for (W2, W3) is WALLET-21's: until then it opens nothing. */
function CurrencyChip() {
  const ring = useFocusRing();
  return (
    <Pressable
      testID="today-currency"
      accessibilityRole="button"
      accessibilityLabel="Naira"
      onPress={unbuilt('WALLET-21')}
      {...ring.handlers}
      style={[styles.chip, { backgroundColor: cardInk.chip }, ring.style]}
    >
      <CurrencyFlag currency="NGN" size={m.flag} />
      <Text style={[todayWords.chip, { color: cardInk.ink }]}>Naira</Text>
      <Icon name="ChevronDown" size={m.chevron} color={cardInk.ink} />
    </Pressable>
  );
}

/**
 * H1's Naira balance card: the Naira chip and the eye, then the bank's figure, on the Wallet tab's own money
 * ground (`MoneyGround`, `--shadow-money`) at H1's 26 corner. The figure is W1's `FittedBalance` at H1's 38, so
 * a balance is never cut off here either; with no figure, the Wallet tab's words for the state and its one
 * button take the figure's place.
 *
 * The eye is drawn in every state (it sets whether a figure shows when there is one). Under it, always, come the four
 * actions Send, Add, Bills and Scan (`MoneyActions`), whatever state the figure is in. The chip's chevron is the currency switch (Dollar and Crypto, W2 and W3, WALLET-21): drawn, and it opens nothing
 * until that task is built (R-46).
 */
export function MoneyCard({ state, masked, onToggleMask, onOpenWallet, onRetryWallet, onRetryBalance, retrying, quiet = false }: MoneyCardProps) {
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
    // The page's banner carries Try again for a read that failed: this card then says what failed and has no button of its own.
    const showAction = !(quiet && (state.state === 'wallet_error' || state.state === 'balance_error'));
    body = (
      <View style={styles.notice} testID={`today-balance-${state.state}`}>
        <Text accessibilityRole="header" style={[todayWords.notice, { color: cardInk.ink }]}>
          {state.title}
        </Text>
        <Text accessibilityRole={failed ? 'alert' : undefined} style={[todayWords.noticeBody, { color: cardInk.ink }]}>
          {state.message}
        </Text>
        {showAction ? (
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
        ) : null}
      </View>
    );
  }

  return (
    <View testID="today-balance-card" style={[styles.card, { boxShadow: shadows.money }]}>
      <MoneyGround corner={radius.money} glowId="today-balance-glow" />
      <View style={styles.top}>
        <CurrencyChip />
        <BalanceEye testID="today-balance-eye" hidden={masked} onPress={onToggleMask} />
      </View>
      {body}
      <MoneyActions />
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
