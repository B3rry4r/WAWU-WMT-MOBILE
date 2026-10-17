import { QueryClientContext, useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Linking, ScrollView, Share, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Toast } from '@/components/Toast';
import { Banner } from '@/components/Banner';
import { ProductsMeter } from '@/components/ProductsMeter';
import { CreateEntry } from '@/features/create/CreateEntry';
import { fetchFields, fetchMe, fieldsKey, meKey } from '@/features/profile-edit/api';
import { readFailure } from '@/features/profile-edit/failure';
import { layout, radius, space, useWawu } from '@/theme';

import {
  aboutWorksKey,
  draftsKey,
  fetchAboutWorks,
  fetchDrafts,
  fetchGridPage,
  fetchListings,
  fetchMyTier,
  fetchProfileStats,
  fetchServiceState,
  gridKey,
  listingsKey,
  servicesKey,
  statsKey,
  tierKey,
  type MyProfile,
} from './api';
import { AboutTab } from './AboutTab';
import { ContentGrid, GridSkeleton } from './ContentGrid';
import { MeMenuSheet } from './MeMenuSheet';
import {
  countsOf,
  draftTileOf,
  headerBadgeOf,
  liveListings,
  memberSinceLine,
  nameOf,
  openableLink,
  paidMessagesOf,
  productsMeterOf,
  profileShareText,
  roleLinesOf,
  socialLinksOf,
  ticksOf,
  tileOf,
  type ProfileTab,
  type SocialLink,
} from './model';
import { Counts, HeaderSkeleton, NameBlock, ProfileTop, SocialChips, bodyTop } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { RetryNote } from './RetryNote';
import { useProfileSaved } from './savedNotice';
import { ServicesTab } from './ServicesTab';

/** How near the end of the page (in points) the next page of pieces is asked for. */
const MORE_WITHIN = 600;
/** Room under the last block, so it clears the bottom bar's shadow line. */
const BOTTOM_ROOM = space.s3xl;
/** design/_gen/me.js line 18, `profBody`: the blocks stack 16 apart. */
const BODY_GAP = space.lg;
const SERVICE_SKELETON_H = 72;
const ABOUT_SKELETON_H = 120;

/**
 * The cache above the screen, or the app's one cache when there is none (as the Inbox tab reads it), so the
 * tab draws inside the tab navigator on its own. The app's root provides that same cache.
 */
function useCache(): QueryClient {
  return useContext(QueryClientContext) ?? queryClient;
}

export type MeScreenProps = {
  onEditProfile: () => void;
  onAddWork: () => void;
  onOpenWork: (wawuId: string, workId: string) => void;
  /** A listing row on Services opens P8, Your listings (PROS-03, R-41). */
  onOpenListings?: () => void;
  /** The paid messages row on Services opens I21, Paid messages (INBOX-12, R-41). */
  onOpenPaid?: () => void;
  /** Settings, the last row of the Menu sheet (Z1): opens Z2. */
  onOpenSettings: () => void;
  /** The gift button over the cover (M1) opens Invite and earn (RF1, REF-03). Not drawn without it. */
  onOpenInvite?: () => void;
  /** Verification (ME-13): the menu's row, drawn only when given. */
  onOpenVerification?: () => void;
  /** A draft tile in the Content grid (M1) opens Your shop (VF2, VERIFY-01). A draft is not pressed without it. */
  onOpenShop?: () => void;
  /** The Create button, for creator accounts only (M1): opens M19 (ME-04). */
  onCreate?: () => void;
  /** Creator dashboard (M18, ME-07): the menu's first row for a creator account, drawn only when given. */
  onOpenDashboard?: () => void;
  /** My content (M28, ME-07): the menu's second row for a creator account, drawn only when given. */
  onOpenLibrary?: () => void;
};

/**
 * M1 · Me (the tab's root): the person's own profile as visitors see it, with Content, Services and About
 * (M1, M2, M4) and "Profile saved" after an edit (M10). The profile, its details and its counts load together
 * for the header; each tab loads its own part when it is first opened.
 *
 * Menu (BRAND-01) raises the Me menu (Z1) and its Settings row opens Z2, so a signed-in person always has a way
 * into Settings, also while the profile is loading or has failed. Not drawn yet (the task that builds
 * where each leads adds it, R-47): QR (WALLET-20, after launch), the tick and the "Get your professional tick" prompt (ME-12), the
 * Create button (ME-04), and the way into paid message settings (INBOX-12) from Services. The listings
 * (PROS-03) are in.
 *
 * DV2-03: a person with a running tier sees its badge by their name and the "N of M products" meter under the counts (`GET /me/tier`);
 * a creator's drafts lead the Content grid, each tagged Draft (`GET /product-drafts`). The Voice Intro player (Bio, AI voice, R-66) is
 * not drawn: the Hub serves no `voiceIntro` yet (VOICE-01, BACKEND_GAPS G-800), so there is nothing to play (R-47). A draft tile opens
 * Your shop (VF2, VERIFY-01), where the draft is edited or deleted.
 */
export function MeScreen({ onEditProfile, onAddWork, onOpenWork, onOpenListings, onOpenPaid, onOpenSettings, onOpenInvite, onOpenVerification, onOpenShop, onCreate, onOpenDashboard, onOpenLibrary }: MeScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const cache = useCache();
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe }, cache);
  const fields = useQuery({ queryKey: fieldsKey, queryFn: fetchFields }, cache);
  const stats = useQuery({ queryKey: statsKey, queryFn: fetchProfileStats }, cache);
  // The tier and its meter are read apart from the page: a failure here leaves the profile on screen with a note and a retry.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier }, cache);
  const [tab, setTab] = useState<ProfileTab>('content');
  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // M10: "Profile saved", posted by M8's route as it closes, is drawn over the profile while it is up.
  const toast = useProfileSaved();
  useEffect(() => {
    if (toast) AccessibilityInfo.announceForAccessibility('Profile saved');
  }, [toast]);

  const wawuId = me.data?.wawuUserId ?? null;
  // Drafts are for creator accounts (the Hub refuses the rest), so only a creator asks.
  const creator = me.data?.accountType === 'creator';
  // The whole-page error only when there is nothing to show: a refresh that fails (after a save on M8, say) keeps the profile on screen.
  const failed = (me.isError && !me.data) || (fields.isError && !fields.data) || (stats.isError && !stats.data);
  const ready = me.data && fields.data && stats.data ? { profile: me.data, details: fields.data, counts: stats.data } : null;

  const share = async () => {
    if (!me.data) return;
    setNotice(null);
    try {
      await Share.share({ message: profileShareText(nameOf(me.data), me.data.handle) });
    } catch {
      setNotice('Sharing is not available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  const open = async (url: string, what: string) => {
    setNotice(null);
    try {
      await Linking.openURL(url);
    } catch {
      setNotice(`${what} did not open. Try again.`);
    }
  };

  const grid = useInfiniteQuery({
    queryKey: gridKey(wawuId ?? ''),
    queryFn: ({ pageParam }) => fetchGridPage(wawuId as string, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
    enabled: wawuId !== null && tab === 'content',
  }, cache);
  const drafts = useQuery({ queryKey: draftsKey, queryFn: fetchDrafts, enabled: creator && tab === 'content' }, cache);

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (tab !== 'content' || !grid.hasNextPage || grid.isFetchingNextPage) return;
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - MORE_WITHIN) void grid.fetchNextPage();
  };

  return (
    <View testID="me-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScrollView testID="me-scroll" onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ProfileTop
          coverUrl={me.data?.coverUrl ?? null}
          top={insets.top}
          canShare={ready !== null}
          onShare={() => void share()}
          onOpenInvite={onOpenInvite}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <View style={[styles.body, { paddingTop: bodyTop(insets.top) }]}>
          {failed ? (
            <ErrorState
              testID="me-error"
              title="Your profile did not load"
              message={readFailure(me.error ?? fields.error ?? stats.error)}
              onRetry={() => {
                if (me.isError) void me.refetch();
                if (fields.isError) void fields.refetch();
                if (stats.isError) void stats.refetch();
              }}
            />
          ) : !ready ? (
            <LoadingView label="Loading your profile" testID="me-loading">
              <View style={styles.skeleton}>
                <HeaderSkeleton />
              </View>
            </LoadingView>
          ) : (
            <>
              <NameBlock
                wawuId={ready.profile.wawuUserId}
                name={nameOf(ready.profile)}
                avatarUrl={ready.profile.avatarUrl}
                ticks={ticksOf(ready.profile)}
                badge={headerBadgeOf(tier.data, ready.details.badge)}
                bio={ready.profile.bio}
                onEditProfile={onEditProfile}
              />
              {notice ? <Banner tone="warning" title="That did not open" body={notice} testID="me-notice" /> : null}
              <SocialChips links={socialLinksOf(ready.profile, ready.details)} onOpen={(link: SocialLink) => void open(link.url, 'That link')} />
              <Counts counts={countsOf(ready.counts)} />
              <TierMeter tier={tier} />
              <ProfileTabs value={tab} onChange={setTab} />
              {tab === 'content' ? <ContentBody query={grid} drafts={drafts} creator={creator} onOpenShop={onOpenShop} /> : null}
              {tab === 'services' ? <ServicesBody creator={ready.profile.accountType === 'creator'} onOpenListings={onOpenListings} onOpenPaid={onOpenPaid} /> : null}
              {tab === 'about' ? (
                <AboutBody
                  me={ready.profile}
                  location={ready.details.location}
                  skills={ready.details.skills}
                  memberSince={ready.details.memberSince ?? ready.profile.createdAt}
                  onAddWork={onAddWork}
                  onOpenWork={(workId) => onOpenWork(ready.profile.wawuUserId, workId)}
                  onOpenWebsite={(url) => void open(openableLink(url), 'Your website')}
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      {onCreate ? <CreateEntry onPress={onCreate} /> : null}
      <Toast message={toast ? 'Profile saved' : null} testID="profile-saved" />
      <MeMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSettings={() => {
          setMenuOpen(false);
          onOpenSettings();
        }}
        onOpenVerification={
          onOpenVerification
            ? () => {
                setMenuOpen(false);
                onOpenVerification();
              }
            : undefined
        }
        onOpenDashboard={
          creator && onOpenDashboard
            ? () => {
                setMenuOpen(false);
                onOpenDashboard();
              }
            : undefined
        }
        onOpenLibrary={
          creator && onOpenLibrary
            ? () => {
                setMenuOpen(false);
                onOpenLibrary();
              }
            : undefined
        }
      />
    </View>
  );
}

type GridQuery = ReturnType<typeof useInfiniteQuery<Awaited<ReturnType<typeof fetchGridPage>>>>;

type TierQuery = ReturnType<typeof useQuery<Awaited<ReturnType<typeof fetchMyTier>>>>;
type DraftsQuery = ReturnType<typeof useQuery<Awaited<ReturnType<typeof fetchDrafts>>>>;

/**
 * The products meter under the counts. Loading is a block the meter's size; a person with no running tier sees nothing here
 * (`productsMeterOf` is null); a failed read is a note with a retry, never "no tier".
 */
function TierMeter({ tier }: { tier: TierQuery }) {
  if (tier.isError && !tier.data) return <RetryNote testID="me-tier-error" title="Your tier did not load" onRetry={() => void tier.refetch()} />;
  if (!tier.data) return <ProductsMeter loading used={0} allowed={0} testID="me-products-loading" />;
  const meter = productsMeterOf(tier.data);
  return meter ? <ProductsMeter used={meter.used} allowed={meter.allowed} caption={meter.caption} testID="me-products" /> : null;
}

function ContentBody({ query, drafts, creator, onOpenShop }: { query: GridQuery; drafts: DraftsQuery; creator: boolean; onOpenShop?: () => void }) {
  if (query.isError && !query.data) {
    return <ErrorState testID="me-grid-error" title="Your content did not load" message={readFailure(query.error)} onRetry={() => void query.refetch()} />;
  }
  // A creator's drafts lead the grid, so the grid waits for them too (a failed read does not hold it: the note below tells them).
  if (!query.data || (creator && drafts.isPending)) {
    return (
      <LoadingView label="Loading your content" testID="me-grid-loading">
        <GridSkeleton />
      </LoadingView>
    );
  }
  const draftsFailed = creator && drafts.isError && !drafts.data;
  const note = draftsFailed ? <RetryNote testID="me-drafts-error" title="Your drafts did not load" onRetry={() => void drafts.refetch()} /> : null;
  const tiles = [...(drafts.data ?? []).map(draftTileOf), ...query.data.pages.flatMap((page) => page.pieces).map(tileOf)];
  if (tiles.length === 0) {
    return (
      <View style={styles.gridWrap}>
        {note ? <View style={styles.note}>{note}</View> : null}
        <EmptyState testID="me-grid-empty" icon="LayoutGrid" title="Nothing published yet" message="What you publish shows here, as people see it on your profile." />
      </View>
    );
  }
  return (
    <View style={styles.gridWrap}>
      {note ? <View style={styles.note}>{note}</View> : null}
      <ContentGrid tiles={tiles} onOpenDraft={onOpenShop} />
      {query.isFetchingNextPage ? <GridSkeleton /> : null}
      {query.isFetchNextPageError ? (
        <ErrorState testID="me-grid-more-error" title="More content did not load" message={readFailure(query.error)} onRetry={() => void query.fetchNextPage()} />
      ) : null}
    </View>
  );
}

function ServicesBody({ creator, onOpenListings, onOpenPaid }: { creator: boolean; onOpenListings?: () => void; onOpenPaid?: () => void }) {
  const cache = useCache();
  const services = useQuery({ queryKey: servicesKey, queryFn: fetchServiceState, enabled: creator }, cache);
  const listings = useQuery({ queryKey: listingsKey, queryFn: fetchListings }, cache);
  if ((creator && services.isError) || listings.isError) {
    return (
      <ErrorState
        testID="me-services-error"
        title="Your services did not load"
        message={readFailure(services.error ?? listings.error)}
        onRetry={() => {
          if (services.isError) void services.refetch();
          if (listings.isError) void listings.refetch();
        }}
      />
    );
  }
  if ((creator && !services.isSuccess) || !listings.data) {
    return (
      <LoadingView label="Loading your services" testID="me-services-loading">
        <View style={styles.skeleton}>
          <Skeleton height={SERVICE_SKELETON_H} radius={radius.card} />
          <Skeleton height={SERVICE_SKELETON_H} radius={radius.card} />
        </View>
      </LoadingView>
    );
  }
  const paid = creator ? paidMessagesOf(services.data) : null;
  const live = liveListings(listings.data);
  if (!paid && live.length === 0) {
    return <EmptyState testID="me-services-empty" icon="BriefcaseBusiness" title="No services yet" message="Paid messages and professional listings show here once they are on." />;
  }
  return <ServicesTab paid={paid} listings={live} onOpenListings={onOpenListings} onOpenPaid={onOpenPaid} />;
}

type AboutBodyProps = {
  me: MyProfile;
  location: string | null;
  skills: readonly string[];
  memberSince: string | null;
  onAddWork: () => void;
  onOpenWork: (workId: string) => void;
  onOpenWebsite: (url: string) => void;
};

function AboutBody({ me, location, skills, memberSince, onAddWork, onOpenWork, onOpenWebsite }: AboutBodyProps) {
  const cache = useCache();
  const works = useQuery({ queryKey: aboutWorksKey, queryFn: fetchAboutWorks }, cache);
  if (works.isError) {
    return <ErrorState testID="me-about-error" title="Your featured works did not load" message={readFailure(works.error)} onRetry={() => void works.refetch()} />;
  }
  if (!works.data) {
    return (
      <LoadingView label="Loading your about" testID="me-about-loading">
        <View style={styles.skeleton}>
          <Skeleton height={ABOUT_SKELETON_H} radius={radius.card} />
          <Skeleton height={ABOUT_SKELETON_H} radius={radius.card} />
        </View>
      </LoadingView>
    );
  }
  return (
    <AboutTab
      works={works.data.works}
      facts={{ bio: me.bio, location, memberSince: memberSinceLine(memberSince), website: me.websiteUrl }}
      roles={roleLinesOf(me.experience ?? [])}
      skills={skills}
      onAddWork={onAddWork}
      onOpenWork={onOpenWork}
      onOpenWebsite={onOpenWebsite}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: BOTTOM_ROOM },
  body: { paddingHorizontal: layout.gutter, gap: BODY_GAP },
  skeleton: { gap: BODY_GAP },
  gridWrap: { gap: space.xs },
  note: { marginBottom: space.sm },
});
