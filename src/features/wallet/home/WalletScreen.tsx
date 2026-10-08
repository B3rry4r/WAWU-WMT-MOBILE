import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { layout, useWawu } from '@/theme';

import { homeBalanceQuery, recentTransactionsQuery, walletHomeQuery } from '../api/home';
import { BalanceCard, ACCT } from './BalanceCard';
import { homeView, stateWords, type HomeView } from './model';
import { RecentTransactions } from './RecentTransactions';
import { BODY_GAP, WalletSkeleton } from './WalletSkeleton';

/**
 * design/_gen/kit.js line 24 (`Big`): the title sits 6 below the status bar and 14 above what follows.
 * wallet.js lines 52 and 65 to 67: the body starts 4 down, and kit.js line 35 (`body`) leaves 120 under it
 * over a tab bar that overlays it; here the bar is its own box. W6's card (line 67) is padded 10 by 16
 * with a 28 corner.
 */
const HOME = { titleTop: 6, titleBottom: 14, bodyTop: 4, bodyBottom: 120 - layout.tabbarH, statePadV: 10, statePadH: 16 } as const;

/**
 * The Wallet tab (WALLET-01): W1, and its states W4 (loading), W5 (a new account) and W6 (the bank did
 * not answer), against `GET /money/wallet`, `GET /money/wallet/balance` and `GET /money/transactions`.
 *
 * Built now with what exists (R-41). Left out until the task that builds where each leads adds it as
 * drawn (R-27): the scan icon (WALLET-20) and the settings icon (WALLET-06); the Naira, Dollar and
 * Crypto tabs and Swap (WALLET-21); Send (WALLET-02) and Add money (WALLET-05); the bills tiles
 * (BILLS-01); the WAWU card row (WALLET-22); See all and a row's detail (WALLET-04).
 *
 * Nobody has a wallet until they open one (R-6): with none, tapping the tab opens Open your wallet
 * (A26). Coming back without opening one shows the way in again; coming back from A10 shows W5.
 */
export function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const focused = useIsFocused();
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();

  const wallet = useQuery(walletHomeQuery(owner), queryClient);
  const state = wallet.data?.state;
  const open = state === 'open' || state === 'frozen';
  const balance = useQuery(homeBalanceQuery(owner, open), queryClient);
  const recent = useQuery(recentTransactionsQuery(owner, open), queryClient);

  const view = homeView(wallet, balance);
  const [hidden, setHidden] = useState(false);
  const [pulled, setPulled] = useState(false);

  const refreshAll = useCallback(async () => {
    const asked: Promise<unknown>[] = [wallet.refetch()];
    if (open) asked.push(balance.refetch(), recent.refetch());
    await Promise.all(asked);
  }, [wallet, balance, recent, open]);

  // Coming back to the tab asks again: the balance is the bank's, never one held from before.
  const seen = useRef(focused);
  useEffect(() => {
    if (focused && !seen.current) void refreshAll();
    seen.current = focused;
  }, [focused, refreshAll]);

  const openWallet = useLeadToOpenWallet(view.kind === 'no_wallet', focused, entry.open);

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refreshAll();
    } finally {
      setPulled(false);
    }
  }, [refreshAll]);

  return (
    <View testID="wallet-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.title}>
        <Text variant="title" accessibilityRole="header">
          Wallet
        </Text>
      </View>
      <ScrollView
        testID="wallet-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.body}
        refreshControl={
          view.kind === 'loading' ? undefined : <RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
      >
        {owner === null ? (
          <WalletSkeleton />
        ) : (
          <Body
            view={view}
            hidden={hidden}
            onToggleHidden={() => setHidden((was) => !was)}
            onOpenWallet={openWallet}
            onRetryWallet={() => void wallet.refetch()}
            onRetryBalance={() => void balance.refetch()}
            recent={{
              rows: recent.data,
              pending: recent.isFetching,
              failed: recent.isError,
              onRetry: () => void recent.refetch(),
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

type BodyProps = {
  view: HomeView;
  hidden: boolean;
  onToggleHidden: () => void;
  onOpenWallet: () => void;
  onRetryWallet: () => void;
  onRetryBalance: () => void;
  recent: { rows: Parameters<typeof RecentTransactions>[0]['rows']; pending: boolean; failed: boolean; onRetry: () => void };
};

function Body({ view, hidden, onToggleHidden, onOpenWallet, onRetryWallet, onRetryBalance, recent }: BodyProps) {
  switch (view.kind) {
    case 'loading':
      return <WalletSkeleton />;
    case 'wallet_error':
      return (
        <StateCard>
          <ErrorState
            testID="wallet-error"
            {...stateWords(view)}
            icon={isApiError(view.error) && view.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            onRetry={onRetryWallet}
          />
        </StateCard>
      );
    case 'no_wallet':
      return (
        <StateCard>
          <EmptyState
            testID="wallet-none"
            icon="Wallet"
            {...stateWords(view)}
            action={{ label: 'Open your wallet', onPress: onOpenWallet }}
          />
        </StateCard>
      );
    case 'opening':
      return (
        <StateCard>
          <EmptyState
            testID="wallet-opening"
            icon="Clock"
            {...stateWords(view)}
            action={{ label: 'Check again', onPress: onRetryWallet }}
          />
        </StateCard>
      );
    case 'unreachable':
      return (
        <StateCard>
          <ErrorState testID="wallet-unreachable" icon="CloudOff" {...stateWords(view)} onRetry={onRetryBalance} />
        </StateCard>
      );
    case 'frozen':
      return (
        <StateCard>
          <ErrorState testID="wallet-frozen" icon="Snowflake" {...stateWords(view)} onRetry={onRetryBalance} />
        </StateCard>
      );
    case 'balance_error':
      return (
        <StateCard>
          <ErrorState
            testID="wallet-balance-error"
            {...stateWords(view)}
            icon={isApiError(view.error) && view.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            onRetry={onRetryBalance}
          />
        </StateCard>
      );
    case 'ready':
      return (
        <>
          <BalanceCard
            availableKobo={view.availableKobo}
            accountNumber={view.account.accountNumber}
            bankName={view.account.bankName}
            hidden={hidden}
            onToggleHidden={onToggleHidden}
          />
          <RecentTransactions {...recent} accountNumber={view.account.accountNumber} now={new Date()} />
        </>
      );
  }
}

/** W6's card: the kit's `card` padded 10 by 16 with a 28 corner, holding the kit's `empty` block. */
function StateCard({ children }: { children: ReactNode }) {
  return <Card style={styles.state}>{children}</Card>;
}

/**
 * With no wallet, being on the tab opens Open your wallet (A26), once per visit. Every way this tab opens
 * A26 (on its own, or the card's Open your wallet) goes through the returned `open`, which marks that the
 * tab is now under the flow; the next time the tab comes back into view is that flow's Back, and it stays
 * on the tab (its way in is drawn there), so Back never loops. Coming back from another tab is a new visit
 * and opens A26 again.
 */
export function useLeadToOpenWallet(noWallet: boolean, focused: boolean, openFlow: () => void): () => void {
  const led = useRef(false);
  const wasFocused = useRef(focused);
  const open = useCallback(() => {
    led.current = true;
    openFlow();
  }, [openFlow]);
  useEffect(() => {
    const returned = focused && !wasFocused.current;
    wasFocused.current = focused;
    if (!focused) return;
    if (returned && led.current) {
      led.current = false;
      return;
    }
    if (noWallet && !led.current) open();
  }, [focused, noWallet, open]);
  return open;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { paddingTop: HOME.titleTop, paddingBottom: HOME.titleBottom, paddingHorizontal: layout.gutter },
  scroll: { flex: 1 },
  body: { flexGrow: 1, gap: BODY_GAP, paddingTop: HOME.bodyTop, paddingHorizontal: layout.gutter, paddingBottom: HOME.bodyBottom },
  state: { borderRadius: ACCT.radius, paddingVertical: HOME.statePadV, paddingHorizontal: HOME.statePadH },
});
