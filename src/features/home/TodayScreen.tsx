import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/api/session';
import { ErrorState } from '@/components/StateViews';
import { fetchMyId, meKey } from '@/features/feed/api';
import { metrics as feedMetrics } from '@/features/feed/look';
import { OPEN_WALLET_PATH } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchTgif, settingsKeys } from '@/features/settings/api/hub';
import { dayKey, fetchDay, fetchStats, statsKey } from '@/features/tgif/api/tgif';
import { localDay } from '@/features/tgif/model';
import { homeBalanceQuery, walletHomeQuery } from '@/features/wallet/api/home';
import { homeView } from '@/features/wallet/home/model';
import { useWawu } from '@/theme';

import { fetchCreatorSuggestions, suggestionsKey } from './api';
import { CreatorRail } from './CreatorRail';
import { HomeTabs } from './HomeTabs';
import { gutter, todayMetrics as m } from './look';
import { discoverable, homeViews, moneyCard, showsTgif, todayPhase, type HomeView } from './model';
import { useTodayClient } from './client';
import { MoneyCard } from './MoneyCard';
import { Services } from './Services';
import { TgifCard, TgifProblem } from './TgifCard';
import { TodayLoading } from './TodayLoading';

export type TodayScreenProps = {
  onView: (view: HomeView) => void;
  masked: boolean;
  onToggleMask: () => void;
};

/**
 * H1 · Today, Home's first tab (with H11 while it loads and H36 with TGIF off). It reads:
 * - the wallet and its balance through the Wallet tab's own reads (`GET /money/wallet`, then
 *   `GET /money/wallet/balance` once it is open; WALLET-01, MONEY-11), or why there is none;
 * - the person's TGIF switch (`GET /settings/tgif`, HOME-11) and, when it is on, today's day and
 *   its readers (`GET /tgif/{date}` and `/stats`, HOME-09 and HOME-10);
 * - creators to discover (`GET /creators`), without the viewer (`GET /users/me`).
 *
 * Entries whose screens are not built yet are added by the tasks that build them (R-27, R-41):
 * search (EXPLORE-02), the bell (ME-14), Send (WALLET-02), Add (WALLET-05), See all (EXPLORE-02),
 * a creator's profile (ME-02) and Create (ME-04); Scan after launch (WALLET-20). The sponsored
 * card that takes TGIF's place when it is off (H36) is ADS-01's; with no campaign nothing shows. The Events tile
 * (E1) is EVENTS-01's, in the services row (`Services`).
 */
export function TodayScreen({ onView, masked, onToggleMask }: TodayScreenProps) {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useWawu();
  const focused = useIsFocused();
  // Home exists only for a signed-in session; until one is read, Today draws its loading shapes and asks nothing.
  const signedIn = useSession().status === 'signedIn';
  const chromeTop = Math.max(insets.top, feedMetrics.statusBar);

  return (
    <View testID="today" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: chromeTop + m.headTop }]}>
      {focused ? <StatusBar style={dark ? 'light' : 'dark'} /> : null}
      <View style={styles.head}>
        <HomeTabs views={homeViews} selected="today" tone="page" onChange={onView} />
      </View>
      <ScrollView testID="today-scroll" contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {signedIn ? <TodayBody masked={masked} onToggleMask={onToggleMask} /> : <TodayLoading withTgif />}
      </ScrollView>
    </View>
  );
}

/** Today's parts, read for the signed-in person. */
function TodayBody({ masked, onToggleMask }: Pick<TodayScreenProps, 'masked' | 'onToggleMask'>) {
  const router = useRouter();
  const client = useTodayClient();
  const date = localDay();

  // The Wallet tab's own reads, keyed by the account (WALLET-01): the card and the tab share one cached answer.
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletHomeQuery(owner), client);
  const open = wallet.data?.state === 'open' || wallet.data?.state === 'frozen';
  const balance = useQuery(homeBalanceQuery(owner, open), client);
  const tgifSwitch = useQuery({ queryKey: settingsKeys.tgif, queryFn: fetchTgif }, client);
  const tgifOn = showsTgif(tgifSwitch.data, tgifSwitch.isError);
  const tgifDay = useQuery({ queryKey: dayKey(date), queryFn: () => fetchDay(date), staleTime: Infinity, enabled: tgifOn }, client);
  const tgifStats = useQuery({ queryKey: statsKey(date), queryFn: () => fetchStats(date), enabled: tgifOn && tgifDay.isSuccess }, client);
  const creators = useQuery({ queryKey: suggestionsKey, queryFn: fetchCreatorSuggestions }, client);
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId, staleTime: Infinity }, client);

  const money = moneyCard(homeView(wallet, balance));
  const read = (q: { isPending: boolean; isError: boolean }) => ({ pending: q.isPending, failed: q.isError });
  const moneyFailed = money.kind === 'notice' && (money.state === 'wallet_error' || money.state === 'balance_error');
  const phase = todayPhase({
    balance: { pending: money.kind === 'loading', failed: moneyFailed, walletAnswer: money.kind === 'notice' && !moneyFailed },
    tgifSwitch: read(tgifSwitch),
    tgifDay: tgifSwitch.isPending || tgifOn ? read(tgifDay) : null,
    creators: read(creators),
  });

  const retryAll = () => {
    void wallet.refetch();
    if (open) void balance.refetch();
    void tgifSwitch.refetch();
    if (tgifOn) void tgifDay.refetch();
    void creators.refetch();
    void me.refetch();
  };

  const people = creators.data ? discoverable(creators.data, me.data) : null;

  if (phase === 'loading') {
    return <TodayLoading withTgif={tgifSwitch.isPending || tgifOn} />;
  }
  if (phase === 'error') {
    return (
      <ErrorState
        testID="today-error"
        icon="WifiOff"
        title="Today didn't load"
        message="Check your connection, then try again."
        onRetry={retryAll}
      />
    );
  }
  return (
    <>
      <MoneyCard
        state={money}
        masked={masked}
        onToggleMask={onToggleMask}
        onOpenWallet={() => router.push(OPEN_WALLET_PATH)}
        onRetryWallet={() => void wallet.refetch()}
        onRetryBalance={() => void balance.refetch()}
        retrying={wallet.isFetching || balance.isFetching}
        onOpenBills={() => router.push('/bills')}
      />
      {tgifOn && tgifDay.data ? (
        <TgifCard
          day={tgifDay.data}
          readers={typeof tgifStats.data?.readers === 'number' ? tgifStats.data.readers : null}
          onOpen={() => router.push('/tgif')}
        />
      ) : tgifOn && tgifDay.isError ? (
        <TgifProblem date={date} onRetry={() => void tgifDay.refetch()} retrying={tgifDay.isFetching} />
      ) : null}
      <Services onOpenBills={() => router.push('/bills')} onOpenEvents={() => router.push('/events')} onOpenLegal={() => router.push('/legal')} onOpenSchools={() => router.push('/schools')} />
      <CreatorRail creators={people} onRetry={() => void creators.refetch()} retrying={creators.isFetching} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { height: m.headRow, marginBottom: m.headBottom, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center' },
  body: { paddingTop: m.bodyTop, paddingHorizontal: gutter, paddingBottom: m.bodyBottom, gap: m.between },
});
