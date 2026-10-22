import { useQuery } from '@tanstack/react-query';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/api/session';
import { IconButton } from '@/components/Button';
import { ErrorState } from '@/components/StateViews';
import { SponsoredSlot } from '@/features/ads/SponsoredSlot';
import { useAd, useAdReports } from '@/features/ads/useAd';
import { fetchMyId, meKey } from '@/features/feed/api';
import { metrics as feedMetrics } from '@/features/feed/look';
import { countsKey, fetchCounts } from '@/features/me/counts';
import { NotificationsBell } from '@/features/notifications/NotificationsBell';
import { FLIX_PATH, FlixRail } from '@/features/movies/FlixRail';
import { moviePath } from '@/features/movies/model';
import { CompleteAccountFlag } from '@/features/open-wallet/CompleteAccountFlag';
import { OPEN_WALLET_PATH } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchMe, meKey as profileKey } from '@/features/profile-edit/api';
import { homeBalanceQuery, walletHomeQuery } from '@/features/wallet/api/home';
import { homeView } from '@/features/wallet/home/model';
import { useWawu } from '@/theme';

import { fetchCreatorSuggestions, suggestionsKey } from './api';
import { CreatorRail } from './CreatorRail';
import { HomeTabs } from './HomeTabs';
import { gutter, todayMetrics as m } from './look';
import { discoverable, homeViews, moneyCard, todayPhase, type HomeView } from './model';
import { useTodayClient } from './client';
import { MoneyCard } from './MoneyCard';
import { Services } from './Services';
import { TodayLoading } from './TodayLoading';

export type TodayScreenProps = {
  onView: (view: HomeView) => void;
  masked: boolean;
  onToggleMask: () => void;
  /** The search button at the end of the tab row opens Search (X5, EXPLORE-02). Not drawn without it. */
  onSearch?: () => void;
  /** The bell at the end of the tab row opens Notifications (M31, `/notifications`). Not drawn without it, nor when signed out. */
  onOpenNotifications?: () => void;
  /** "See all" on Creators to discover opens All creators (X4, EXPLORE-02). Not drawn without it. */
  onSeeAllCreators?: () => void;
  onOpenCreator?: (wawuId: string) => void;
};

/**
 * H1 · Today, Home's first tab (with H11 while it loads; H36 is the same screen with the daily TGIF notification over it). It reads:
 * - the wallet and its balance through the Wallet tab's own reads (`GET /money/wallet`, then
 *   `GET /money/wallet/balance` once it is open; WALLET-01, MONEY-11), or why there is none;
 * - creators to discover (`GET /creators`), without the viewer (`GET /users/me`).
 *
 * Entries whose screens are not built yet are added by the tasks that build them (R-27, R-41):
 * Scan after launch (WALLET-20). The bell (M31, ME-14's screen, HOME-18's entry) opens Notifications and its dot reads `GET /me/counts`. The ad card (H1, H36)
 * is always in TGIF's old place (R-59, DV2-01): it reads `GET /ads?placement=today_slot`; with no campaign, while it loads and
 * when it cannot be read nothing shows, never an empty frame. Today draws no TGIF card and reads no TGIF (R-59, DV2-RM): TGIF is
 * on Explore (EXPLORE-07) and in the morning notification (HOME-16), and the notification opens the reader. The services row
 * (`Services`) draws Monetize for a creator account only. No Bills button on the money card and no Pay bills or Events tile
 * (R-52, R-61, DV2-RM).
 */
export function TodayScreen({ onView, masked, onToggleMask, onSearch, onOpenNotifications, onSeeAllCreators, onOpenCreator }: TodayScreenProps) {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useWawu();
  const focused = useIsFocused();
  const client = useTodayClient();
  // Home exists only for a signed-in session; until one is read, Today draws its loading shapes and asks nothing.
  const session = useSession().status;
  const signedIn = session === 'signedIn';
  const chromeTop = Math.max(insets.top, feedMetrics.statusBar);
  // The bell's dot is the Hub's unread count (`GET /me/counts`), read only for a signed-in person while the bell is drawn. A read that
  // failed or has not come draws the bell without its dot, never an error; the notifications screen refreshes this count as it reads.
  const bell = Boolean(onOpenNotifications) && session !== 'signedOut';
  const counts = useQuery({ queryKey: countsKey, queryFn: fetchCounts, enabled: signedIn && bell }, client);
  const unread = counts.data?.unreadNotifications ?? 0;
  // A creator account has the Create button over the page's foot (ME-04), so its body ends higher (the same answer Create reads, under the same key).
  const creator = useQuery({ queryKey: profileKey, queryFn: fetchMe, select: (profile) => profile.accountType === 'creator', enabled: signedIn }, client).data === true;

  return (
    <View testID="today" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: chromeTop + m.headTop }]}>
      {focused ? <StatusBar style={dark ? 'light' : 'dark'} /> : null}
      <View style={styles.head}>
        <HomeTabs views={homeViews} selected="today" tone="page" onChange={onView} fit style={styles.tabs} />
        {onSearch || bell ? (
          <View testID="today-bar-buttons" style={styles.buttons}>
            {onSearch ? <IconButton icon="Search" label="Search" size={m.barButton} onPress={onSearch} testID="today-search" /> : null}
            {bell && onOpenNotifications ? <NotificationsBell variant="today" onPress={onOpenNotifications} unread={unread} testID="today-bell" /> : null}
          </View>
        ) : null}
      </View>
      <ScrollView testID="today-scroll" contentContainerStyle={[styles.body, creator ? styles.bodyCreator : null]} showsVerticalScrollIndicator={false}>
        {signedIn ? <TodayBody masked={masked} onToggleMask={onToggleMask} onSeeAllCreators={onSeeAllCreators} onOpenCreator={onOpenCreator} /> : <TodayLoading />}
      </ScrollView>
    </View>
  );
}

/** Today's parts, read for the signed-in person. */
function TodayBody({ masked, onToggleMask, onSeeAllCreators, onOpenCreator }: Pick<TodayScreenProps, 'masked' | 'onToggleMask' | 'onSeeAllCreators' | 'onOpenCreator'>) {
  const router = useRouter();
  const client = useTodayClient();

  // The Wallet tab's own reads, keyed by the account (WALLET-01): the card and the tab share one cached answer.
  const owner = useSessionAccount(undefined);
  const wallet = useQuery(walletHomeQuery(owner), client);
  const open = wallet.data?.state === 'open' || wallet.data?.state === 'frozen';
  const balance = useQuery(homeBalanceQuery(owner, open), client);
  // The ad card is always in TGIF's old place (R-59).
  const ad = useAd('today_slot', true, client);
  const creators = useQuery({ queryKey: suggestionsKey, queryFn: fetchCreatorSuggestions }, client);
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId, staleTime: Infinity }, client);
  // Monetize opens the Create hub, which is for creator accounts (R-38): the person's own profile says whether this is one.
  // It is the same answer the Create button reads, under the same key; until it has come Monetize is not drawn.
  const isCreator = useQuery({ queryKey: profileKey, queryFn: fetchMe, select: (profile) => profile.accountType === 'creator' }, client).data === true;

  const money = moneyCard(homeView(wallet, balance));
  const read = (q: { isPending: boolean; isError: boolean }) => ({ pending: q.isPending, failed: q.isError });
  const moneyFailed = money.kind === 'notice' && (money.state === 'wallet_error' || money.state === 'balance_error');
  const phase = todayPhase({
    balance: { pending: money.kind === 'loading', failed: moneyFailed, walletAnswer: money.kind === 'notice' && !moneyFailed },
    creators: read(creators),
  });

  // The card is on screen once Today is drawn (not its loading or error view) and this tab is the one in front.
  const focused = useIsFocused();
  const sponsored = phase === 'ready' ? ad.data ?? null : null;
  // A view is told to the Hub once the card's picture is on screen: a picture that fails draws no card, so it is never viewed (SWEEP-APP rows 62 and 106).
  const [pictureOf, setPictureOf] = useState<string | null>(null);
  const reports = useAdReports(sponsored, focused && sponsored !== null && pictureOf === sponsored.artworkUrl);

  const retryAll = () => {
    void wallet.refetch();
    if (open) void balance.refetch();
    void creators.refetch();
    void me.refetch();
  };

  const people = creators.data ? discoverable(creators.data, me.data) : null;

  if (phase === 'loading') {
    return <TodayLoading />;
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
  // A30: until the wallet is open (no wallet yet, or the bank is still making it) the flag leads into the steps.
  const incomplete = money.kind === 'notice' && (money.state === 'no_wallet' || money.state === 'opening');
  return (
    <>
      {incomplete ? <CompleteAccountFlag onPress={() => router.push(OPEN_WALLET_PATH)} /> : null}
      <MoneyCard
        state={money}
        masked={masked}
        onToggleMask={onToggleMask}
        onOpenWallet={() => router.push(OPEN_WALLET_PATH)}
        onRetryWallet={() => void wallet.refetch()}
        onRetryBalance={() => void balance.refetch()}
        retrying={wallet.isFetching || balance.isFetching}
        onSend={() => router.push('/send')}
        onAdd={() => router.push('/add-money')}
      />
      {sponsored ? (
        <SponsoredSlot
          ad={sponsored}
          onPictureLoad={() => setPictureOf(sponsored.artworkUrl)}
          onOpen={() => {
            reports.tap();
            router.push({ pathname: '/events/[id]', params: { id: sponsored.ctaDestinationId } });
          }}
        />
      ) : null}
      <Services
        onOpenStudio={() => router.push('/studio')}
        onOpenLearn={() => router.push('/schools')}
        onOpenLegal={() => router.push('/legal')}
        onOpenMonetize={isCreator ? () => router.push('/create') : undefined}
      />
      <CreatorRail creators={people} onRetry={() => void creators.refetch()} retrying={creators.isFetching} onSeeAll={onSeeAllCreators} onOpenCreator={onOpenCreator} />
      <FlixRail client={client} testID="today-flix" onSeeAll={() => router.push(FLIX_PATH)} onOpenMovie={(id) => router.push(moviePath(id))} />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { height: m.headRow, marginBottom: m.headBottom, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center' },
  tabs: { marginRight: m.barClear },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: m.barButtonsApart, flexShrink: 0 },
  body: { paddingTop: m.bodyTop, paddingHorizontal: gutter, paddingBottom: m.bodyBottom, gap: m.between },
  bodyCreator: { paddingBottom: m.bodyBottomCreator },
});
