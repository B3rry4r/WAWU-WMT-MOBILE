import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/api/session';
import { CreateButton, createButtonMetrics } from '@/components/CreateButton';
import { fetchUnreadNotifications, unreadKey } from '@/features/explore/api';
import { LoadFailedBanner } from '@/features/explore/LoadFailedBanner';
import { fetchMyId, meKey } from '@/features/feed/api';
import { metrics as feedMetrics } from '@/features/feed/look';
import { OPEN_WALLET_PATH } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchIsCreator, proKeys } from '@/features/pro-listing/api';
import { fetchTgif, settingsKeys } from '@/features/settings/api/hub';
import { dayKey, fetchDay, fetchStats, statsKey } from '@/features/tgif/api/tgif';
import { localDay } from '@/features/tgif/model';
import { homeBalanceQuery, walletHomeQuery } from '@/features/wallet/api/home';
import { homeView } from '@/features/wallet/home/model';
import { space, useWawu } from '@/theme';

import { fetchCreatorSuggestions, suggestionsKey } from './api';
import { CreatorRail } from './CreatorRail';
import { HomeBar } from './HomeBar';
import { gutter, todayMetrics as m } from './look';
import { discoverable, moneyCard, showsTgif, todayPhase, type HomeView } from './model';
import { useTodayClient } from './client';
import { MoneyCard } from './MoneyCard';
import { outcomeOf, useRead } from './reads';
import { Services } from './Services';
import { SponsoredCard } from './SponsoredCard';
import { TgifCard, TgifProblem } from './TgifCard';
import { TodayLoading } from './TodayLoading';

export type TodayScreenProps = {
  onView: (view: HomeView) => void;
  masked: boolean;
  onToggleMask: () => void;
};

/**
 * The bottom padding while Create is drawn (creator accounts): the button's own offset, its height and `space.lg` between it
 * and the last row, so the rail ends above it and no Follow sits under it. Anyone else keeps Today's own.
 */
export const todayBodyBottomCreate = createButtonMetrics.bottom + createButtonMetrics.size + space.lg;

/**
 * H1 · Today, Home's first tab (with H11 while it loads and H36 with TGIF off), drawn whole (R-46). It reads:
 * - the wallet and its balance through the Wallet tab's own reads (`GET /money/wallet`, then
 *   `GET /money/wallet/balance` once it is open; WALLET-01, MONEY-11), or why there is none;
 * - the person's TGIF switch (`GET /settings/tgif`, HOME-11) and, when it is on, today's day and
 *   its readers (`GET /tgif/{date}` and `/stats`, HOME-09 and HOME-10);
 * - creators to discover (`GET /creators`), without the viewer (`GET /users/me`);
 * - for the bar and the Create button, which neither hold the page up nor fail it: the unread notifications
 *   (`GET /me/counts`) and the account type (`GET /users/me`, PROS-03's read, one cached answer with Explore's).
 *
 * Every entry H1 draws is here. Built destinations are wired: the TGIF card (H29), the Events tile (E1) and Follow. The rest
 * are `unbuilt(...)`, drawn and opening nothing until their task is built: search (EXPLORE-02), the bell (ME-14), the
 * currency chip (WALLET-21), Send (WALLET-02), Add (WALLET-05), Bills (BILLS-01), Scan (WALLET-20), the tiles Pay bills
 * (BILLS-01), Legal (LEGAL-02) and Schools (SCHOOLS-03), See all (EXPLORE-02), a creator's card (ME-02), the sponsored
 * card (ADS-01) and Create (ME-04). With TGIF off the sponsored card takes TGIF's place (H36).
 *
 * A failed read never collapses the page: every section stays drawn under one banner with Try again, and Try again keeps
 * them drawn while it reads (`useRead`), never the loading shapes.
 */
export function TodayScreen({ onView, masked, onToggleMask }: TodayScreenProps) {
  // Home exists only for a signed-in session; until one is read, Today draws its loading shapes and asks nothing.
  const signedIn = useSession().status === 'signedIn';
  if (!signedIn) {
    return (
      <TodayFrame onView={onView} unread={0} showCreate={false}>
        <TodayLoading />
      </TodayFrame>
    );
  }
  return <TodayLive onView={onView} masked={masked} onToggleMask={onToggleMask} />;
}

/** The page: the bar, the body that scrolls, and Create over it for a creator account. */
function TodayFrame({ onView, unread, showCreate, children }: { onView: (view: HomeView) => void; unread: number; showCreate: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useWawu();
  const focused = useIsFocused();
  const chromeTop = Math.max(insets.top, feedMetrics.statusBar);
  return (
    <View testID="today" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: chromeTop + m.headTop }]}>
      {focused ? <StatusBar style={dark ? 'light' : 'dark'} /> : null}
      <HomeBar onView={onView} unread={unread} />
      <ScrollView testID="today-scroll" contentContainerStyle={[styles.body, showCreate ? styles.bodyCreate : null]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {showCreate ? <CreateButton /> : null}
    </View>
  );
}

/** Today's parts, read for the signed-in person. */
function TodayLive({ onView, masked, onToggleMask }: TodayScreenProps) {
  const router = useRouter();
  const client = useTodayClient();
  const focused = useIsFocused();
  const date = localDay();

  // The Wallet tab's own reads, keyed by the account (WALLET-01): the card and the tab share one cached answer.
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletHomeQuery(owner), client);
  const open = wallet.data?.state === 'open' || wallet.data?.state === 'frozen';
  const balance = useQuery(homeBalanceQuery(owner, open), client);
  const tgifSwitch = useQuery({ queryKey: settingsKeys.tgif, queryFn: fetchTgif }, client);
  const switchRead = useRead(outcomeOf(tgifSwitch));
  const tgifOn = showsTgif(tgifSwitch.data, switchRead.failed);
  const tgifDay = useQuery({ queryKey: dayKey(date), queryFn: () => fetchDay(date), staleTime: Infinity, enabled: tgifOn }, client);
  const dayRead = useRead(outcomeOf(tgifDay));
  const tgifStats = useQuery({ queryKey: statsKey(date), queryFn: () => fetchStats(date), enabled: tgifOn && tgifDay.isSuccess }, client);
  const creators = useQuery({ queryKey: suggestionsKey, queryFn: fetchCreatorSuggestions }, client);
  const creatorsRead = useRead(outcomeOf(creators));
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId, staleTime: Infinity }, client);
  // The bell's dot and the Create button read on their own: neither holds the page up, and neither fails it (no dot, no button).
  const unread = useQuery({ queryKey: unreadKey, queryFn: fetchUnreadNotifications, retry: false }, client);
  const account = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator, retry: false }, client);

  const money = moneyCard(homeView(wallet, balance));
  const moneyFailed = money.kind === 'notice' && (money.state === 'wallet_error' || money.state === 'balance_error');
  const moneyRead = useRead(money.kind === 'loading' ? 'pending' : moneyFailed ? 'failed' : 'ok');
  const phase = todayPhase({
    balance: { ...moneyRead, walletAnswer: money.kind === 'notice' && !moneyFailed },
    tgifSwitch: switchRead,
    tgifDay: switchRead.pending || tgifOn ? dayRead : null,
    creators: creatorsRead,
  });

  const refetchUnread = unread.refetch;
  const refetchAccount = account.refetch;
  const retryAll = () => {
    void wallet.refetch();
    if (open) void balance.refetch();
    void tgifSwitch.refetch();
    if (tgifOn) void tgifDay.refetch();
    void creators.refetch();
    void me.refetch();
    void refetchUnread();
    void refetchAccount();
  };

  // Coming back to the tab reads the bell's count and the account type again when what is held has gone stale (a read that
  // failed holds nothing, so a creator whose account read failed once gets Create back).
  const stale = unread.isStale || account.isStale;
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current && stale) {
      void refetchUnread();
      void refetchAccount();
    }
    wasFocused.current = focused;
  }, [focused, stale, refetchUnread, refetchAccount]);

  const people = creators.data ? discoverable(creators.data, me.data) : null;
  const fetching = wallet.isFetching || balance.isFetching || tgifSwitch.isFetching || tgifDay.isFetching || creators.isFetching;

  let body;
  if (phase === 'loading') {
    body = <TodayLoading />;
  } else {
    body = (
      <>
        {phase === 'error' ? (
          <View testID="today-error">
            <LoadFailedBanner
              title="Today didn't load"
              message="Check your connection, then try again."
              icon="WifiOff"
              retrying={fetching}
              onRetry={retryAll}
            />
          </View>
        ) : null}
        <MoneyCard
          state={money}
          masked={masked}
          onToggleMask={onToggleMask}
          onOpenWallet={() => router.push(OPEN_WALLET_PATH)}
          onRetryWallet={() => void wallet.refetch()}
          onRetryBalance={() => void balance.refetch()}
          retrying={wallet.isFetching || balance.isFetching}
          quiet={phase === 'error'}
        />
        {tgifOn ? (
          tgifDay.data ? (
            <TgifCard
              day={tgifDay.data}
              readers={typeof tgifStats.data?.readers === 'number' ? tgifStats.data.readers : null}
              onOpen={() => router.push('/tgif')}
            />
          ) : dayRead.failed ? (
            <TgifProblem date={date} onRetry={phase === 'error' ? undefined : () => void tgifDay.refetch()} retrying={tgifDay.isFetching} />
          ) : null
        ) : (
          <SponsoredCard />
        )}
        <Services onOpenEvents={() => router.push('/events')} />
        <CreatorRail creators={people} onRetry={phase === 'error' ? undefined : () => void creators.refetch()} retrying={creators.isFetching} />
      </>
    );
  }

  return (
    <TodayFrame onView={onView} unread={unread.data ?? 0} showCreate={account.data === true}>
      {body}
    </TodayFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: m.bodyTop, paddingHorizontal: gutter, paddingBottom: m.bodyBottom, gap: m.between },
  /** While Create is drawn the last row ends above it (`todayBodyBottomCreate`). */
  bodyCreate: { paddingBottom: todayBodyBottomCreate },
});
