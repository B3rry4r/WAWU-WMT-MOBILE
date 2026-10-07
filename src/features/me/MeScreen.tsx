import { QueryClientContext, useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Linking, ScrollView, Share, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Banner } from '@/features/auth/Banner';
import { fetchFields, fetchMe, fieldsKey, meKey } from '@/features/profile-edit/api';
import { readFailure } from '@/features/profile-edit/failure';
import { SavedToast } from '@/features/profile-edit/SavedToast';
import { layout, radius, space, useWawu } from '@/theme';

import { ABOUT_WORKS_SHOWN, aboutWorksKey, fetchAboutWorks, fetchGridPage, fetchListings, fetchProfileStats, fetchServiceState, gridKey, listingsKey, servicesKey, statsKey, type MyProfile } from './api';
import { AboutTab } from './AboutTab';
import { ContentGrid, GridSkeleton } from './ContentGrid';
import {
  countsOf,
  liveListings,
  memberSinceLine,
  nameOf,
  openableLink,
  paidMessagesOf,
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
};

/**
 * M1 · Me (the tab's root): the person's own profile as visitors see it, with Content, Services and About
 * (M1, M2, M4) and "Profile saved" after an edit (M10). The profile, its details and its counts load together
 * for the header; each tab loads its own part when it is first opened.
 *
 * Left out until the task that builds where they lead adds them, as drawn (R-27, R-41): QR (WALLET-20, after
 * launch), Menu (ME-03), the tick and the "Get your professional tick" prompt (ME-12), the Create button
 * (ME-04), and the way into paid message settings (INBOX-12) and the listings (PROS-03) from Services.
 */
export function MeScreen({ onEditProfile, onAddWork, onOpenWork }: MeScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const cache = useCache();
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe }, cache);
  const fields = useQuery({ queryKey: fieldsKey, queryFn: fetchFields }, cache);
  const stats = useQuery({ queryKey: statsKey, queryFn: fetchProfileStats }, cache);
  const [tab, setTab] = useState<ProfileTab>('content');
  const [notice, setNotice] = useState<string | null>(null);

  // M10: "Profile saved", posted by M8's route as it closes, is drawn over the profile while it is up.
  const toast = useProfileSaved();
  useEffect(() => {
    if (toast) AccessibilityInfo.announceForAccessibility('Profile saved');
  }, [toast]);

  const wawuId = me.data?.wawuUserId ?? null;
  const failed = me.isError || fields.isError || stats.isError;
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

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (tab !== 'content' || !grid.hasNextPage || grid.isFetchingNextPage) return;
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - MORE_WITHIN) void grid.fetchNextPage();
  };

  return (
    <View testID="me-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScrollView testID="me-scroll" onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ProfileTop coverUrl={me.data?.coverUrl ?? null} top={insets.top} canShare={ready !== null} onShare={() => void share()} />
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
                bio={ready.profile.bio}
                onEditProfile={onEditProfile}
              />
              {notice ? <Banner tone="warning" title="That did not open" body={notice} testID="me-notice" /> : null}
              <SocialChips links={socialLinksOf(ready.profile, ready.details)} onOpen={(link: SocialLink) => void open(link.url, 'That link')} />
              <Counts counts={countsOf(ready.counts)} />
              <ProfileTabs value={tab} onChange={setTab} />
              {tab === 'content' ? <ContentBody query={grid} /> : null}
              {tab === 'services' ? <ServicesBody creator={ready.profile.accountType === 'creator'} /> : null}
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
      {toast ? <SavedToast message="Profile saved" /> : null}
    </View>
  );
}

type GridQuery = ReturnType<typeof useInfiniteQuery<Awaited<ReturnType<typeof fetchGridPage>>>>;

function ContentBody({ query }: { query: GridQuery }) {
  if (query.isError && !query.data) {
    return <ErrorState testID="me-grid-error" title="Your content did not load" message={readFailure(query.error)} onRetry={() => void query.refetch()} />;
  }
  if (!query.data) {
    return (
      <LoadingView label="Loading your content" testID="me-grid-loading">
        <GridSkeleton />
      </LoadingView>
    );
  }
  const tiles = query.data.pages.flatMap((page) => page.pieces).map(tileOf);
  if (tiles.length === 0) {
    return <EmptyState testID="me-grid-empty" icon="LayoutGrid" title="Nothing published yet" message="What you publish shows here, as people see it on your profile." />;
  }
  return (
    <View style={styles.gridWrap}>
      <ContentGrid tiles={tiles} />
      {query.isFetchingNextPage ? <GridSkeleton /> : null}
      {query.isFetchNextPageError ? (
        <ErrorState testID="me-grid-more-error" title="More content did not load" message={readFailure(query.error)} onRetry={() => void query.fetchNextPage()} />
      ) : null}
    </View>
  );
}

function ServicesBody({ creator }: { creator: boolean }) {
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
  return <ServicesTab paid={paid} listings={live} />;
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
      works={works.data.works.slice(0, ABOUT_WORKS_SHOWN)}
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
});
