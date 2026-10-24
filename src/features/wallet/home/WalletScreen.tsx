import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { onSessionEnd } from '@/api/session';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { OPEN_WALLET_ACCOUNT_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { layout, radius, useWawu } from '@/theme';

import { myPointsQuery, type MyPoints } from '@/features/points/api';

import { homeBalanceQuery, recentTransactionsQuery, walletHomeQuery } from '../api/home';
import { myPassQuery, type MyPass } from '../api/pass';
import { PassesTile } from '../pass/PassesTile';
import { BalanceCard, ACCT } from './BalanceCard';
import { PointsTile } from './PointsTile';
import { WalletActions, type WalletAction } from './WalletActions';
import { homeView, stateWords, type HomeView } from './model';
import { RecentTransactions } from './RecentTransactions';
import { WalletBar } from './WalletBar';
import { WorldHome } from '../world/WorldHome';
import { BODY_GAP, WalletSkeleton } from './WalletSkeleton';

/**
 * design/_gen/wallet.js lines 44 and 65 to 67: the body starts 4 down (the title bar is `WalletBar`), and
 * kit.js line 35 (`body`) leaves 120 under it over a tab bar that overlays it; here the bar is its own box.
 * W6's card (line 67) is padded 10 by 16 with a 28 corner.
 */
const HOME = { bodyTop: 4, bodyBottom: 120 - layout.tabbarH, statePadV: 10, statePadH: 16, infoGap: 10 } as const;
/** The Points card's stand-in while its read is out: as high as the card (12 + the head, the count and the line + 12). */
const INFO_SKELETON = 86;

/**
 * The Wallet tab (WALLET-01, reworked by DV2-02 to the 16 Oct board): W1, and its states W4 (loading), W5 (a new account) and W6 (the
 * bank did not answer), against `GET /money/wallet`, `GET /money/wallet/balance`, `GET /money/transactions`, `GET /me/points` and `GET /me/tier`.
 *
 * Cash is the card (the Hub's balance), Points and Passes sit under it as information, then the actions, then Transactions. There are no
 * bills anywhere on this tab (R-52).
 *
 * The screen shows what is built (R-47). The canvas draws more, and each of these is added by the task that builds where it leads, as
 * drawn: the scan icon (WALLET-20); the Dollar and Crypto tabs and Swap (WALLET-21);
 * the WAWU card row (WALLET-22). Add money and Withdraw (WALLET-05), Send (WALLET-02), Buy points (POINTS-06) and To cash (POINTS-05) are built. The Passes card (WALLET-38)
 * is drawn when `GET /me/tier` has an event pass, beside the Points card (wallet.js line 47, 10 apart). The settings icon is built
 * (WALLET-06, W35), and See all and a row open the history and a receipt (WALLET-04, W26 and W27). Nothing here reads, charges or moves
 * money beyond the reads above.
 *
 * W6's card with its words also holds every other state that has no balance to show (no wallet, opening, frozen, a
 * failed read), because the canvas draws no other.
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
  const router = useRouter();

  const wallet = useQuery(walletHomeQuery(owner), queryClient);
  const state = wallet.data?.state;
  // WALLET-41: a person who opened from outside Nigeria has no naira account to read a balance or rows from.
  const open = (state === 'open' || state === 'frozen') && !wallet.data?.world;
  const balance = useQuery(homeBalanceQuery(owner, open), queryClient);
  const recent = useQuery(recentTransactionsQuery(owner, open), queryClient);
  // The Passes card: drawn only when the Hub says the person has a pass (WALLET-38). A read that fails draws nothing here.
  const pass = useQuery(myPassQuery(owner), queryClient);
  // The Points card: the Hub's balance as a count. Nothing is drawn for a read that failed (never a 0 the Hub did not say).
  const points = useQuery(myPointsQuery(owner), queryClient);

  const view = homeView(wallet, balance);
  const [hidden, setHidden] = useState(false);
  const [pulled, setPulled] = useState(false);

  const refreshAll = useCallback(async () => {
    const asked: Promise<unknown>[] = [wallet.refetch()];
    if (open) asked.push(balance.refetch(), recent.refetch(), pass.refetch(), points.refetch());
    await Promise.all(asked);
  }, [wallet, balance, recent, pass, points, open]);

  // Coming back to the tab asks again: the balance is the bank's, never one held from before.
  const seen = useRef(focused);
  useEffect(() => {
    if (focused && !seen.current) void refreshAll();
    seen.current = focused;
  }, [focused, refreshAll]);

  const actions = builtActions(router);
  const openWallet = useLeadToOpenWallet(view.kind === 'no_wallet', focused, entry.open);
  // The account opened and no PIN is set (it landed while the tab said "Your account is opening", or while the app was closed): the
  // board's step after the account is "Create your transaction PIN", so the person is led there once, never left on W1 unasked (U3b).
  useLeadToCreatePin(owner, open && wallet.data?.pinIsSet === false, focused, () => router.push(OPEN_WALLET_ACCOUNT_PATH));

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
      <WalletBar />
      <ScrollView
        testID="wallet-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.body}
        refreshControl={
          view.kind === 'loading' ? undefined : <RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
      >
        {owner === null ? (
          <WalletSkeleton tiles={actions.length} />
        ) : (
          <Body
            owner={owner}
            view={view}
            hidden={hidden}
            onToggleHidden={() => setHidden((was) => !was)}
            onOpenWallet={openWallet}
            actions={actions}
            points={points.isSuccess ? points.data : points.isPending && points.isFetching ? 'loading' : null}
            onOpenPoints={() => router.push('/points')}
            pass={pass.data ?? null}
            onOpenPass={() => router.push('/pass')}
            onRetryWallet={() => void wallet.refetch()}
            onRetryBalance={() => void balance.refetch()}
            recent={{
              rows: recent.data,
              pending: recent.isFetching,
              failed: recent.isError,
              onRetry: () => void recent.refetch(),
              onSeeAll: () => router.push('/transactions'),
              onOpen: (id: string) => router.push({ pathname: '/transactions/[id]', params: { id } }),
              onOpenGroup: (key: string) => router.push({ pathname: '/transactions', params: { group: key } }),
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

type BodyProps = {
  owner: string;
  view: HomeView;
  hidden: boolean;
  onToggleHidden: () => void;
  onOpenWallet: () => void;
  /** The actions that are built, in the board's order. */
  actions: readonly WalletAction[];
  /** The Hub's points, `'loading'` while the first read is out, or null when it has none to show (a failed read draws nothing). */
  points: MyPoints | 'loading' | null;
  onOpenPoints: () => void;
  /** The person's event pass, or null when the Hub has none (or has not answered): no Passes card then. */
  pass: MyPass | null;
  onOpenPass: () => void;
  onRetryWallet: () => void;
  onRetryBalance: () => void;
  recent: Pick<Parameters<typeof RecentTransactions>[0], 'rows' | 'pending' | 'failed' | 'onRetry' | 'onSeeAll' | 'onOpen' | 'onOpenGroup'>;
};

function Body({ owner, view, hidden, onToggleHidden, onOpenWallet, actions, points, onOpenPoints, pass, onOpenPass, onRetryWallet, onRetryBalance, recent }: BodyProps) {
  switch (view.kind) {
    case 'loading':
      return <WalletSkeleton tiles={actions.length} />;
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
    case 'world':
      return <WorldHome owner={owner} />;
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
          {points !== null || pass ? (
            <View testID="wallet-info-row" style={styles.infoRow}>
              {points === 'loading' ? (
                <Skeleton testID="wallet-points-loading" height={INFO_SKELETON} radius={radius.card} style={styles.half} />
              ) : points ? (
                <PointsTile points={points} now={new Date()} onPress={onOpenPoints} />
              ) : null}
              {pass ? <PassesTile pass={pass} onPress={onOpenPass} /> : null}
              {(points !== null ? 1 : 0) + (pass ? 1 : 0) === 1 ? <View style={styles.half} /> : null}
            </View>
          ) : null}
          <WalletActions actions={actions} />
          <RecentTransactions {...recent} accountNumber={view.account.accountNumber} now={new Date()} />
        </>
      );
  }
}

/** W6 (wallet.js line 67): a card padded 10 by 16 with a 28 corner holding the kit's `empty` block. */
function StateCard({ children }: { children: ReactNode }) {
  return <Card style={styles.state}>{children}</Card>;
}

/**
 * The actions that are built, in the board's order (Add money, Send, Withdraw, Buy points, To cash): Add money opens W15, Send opens W7,
 * Withdraw opens W17, Buy points opens PT4 and To cash opens PT6 (WALLET-05 added Add money and Withdraw with their screens, R-47).
 */
function builtActions(router: ReturnType<typeof useRouter>): WalletAction[] {
  return [
    { key: 'add-money', icon: 'Plus', label: 'Add money', onPress: () => router.push('/add-money'), accent: true },
    { key: 'send', icon: 'ArrowUpRight', label: 'Send', onPress: () => router.push('/send') },
    { key: 'withdraw', icon: 'Landmark', label: 'Withdraw', onPress: () => router.push('/withdraw') },
    { key: 'buy-points', icon: 'Sparkles', label: 'Buy points', onPress: () => router.push('/points-buy') },
    { key: 'to-cash', icon: 'Banknote', label: 'To cash', onPress: () => router.push('/points-convert') },
  ];
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

/** Whose wallets the tab has already led to A8 in this session: one nudge each, so Back from A8 stays on the tab and never loops. */
const ledToPin = new Set<string>();
onSessionEnd(() => ledToPin.clear());

/**
 * With an open wallet and no PIN, being on the tab opens A8 (Your wallet is open, whose button is "Create your transaction PIN", A9 and
 * A10), once per session for each account. A person who goes back from it is on the tab as before: Settings (W36) still creates the PIN
 * and every payment sheet still leads to it.
 */
export function useLeadToCreatePin(owner: string | null, noPin: boolean, focused: boolean, lead: () => void): void {
  const leadRef = useRef(lead);
  useEffect(() => {
    leadRef.current = lead;
  });
  useEffect(() => {
    if (!owner || !noPin || !focused || ledToPin.has(owner)) return;
    ledToPin.add(owner);
    leadRef.current();
  }, [owner, noPin, focused]);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  body: { flexGrow: 1, gap: BODY_GAP, paddingTop: HOME.bodyTop, paddingHorizontal: layout.gutter, paddingBottom: HOME.bodyBottom },
  infoRow: { flexDirection: 'row', gap: HOME.infoGap },
  // One card of the two, when the other is not drawn: it keeps the half it has beside the other.
  half: { flex: 1, minWidth: 0 },
  state: { borderRadius: ACCT.radius, paddingVertical: HOME.statePadV, paddingHorizontal: HOME.statePadH },
});
