import { QueryClientContext, useInfiniteQuery, useMutation, useQuery, type QueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, Share, StyleSheet, View, Linking, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query';
import { isApiError } from '@/api/errors';
import { BottomSheet } from '@/components/BottomSheet';
import { Banner } from '@/components/Banner';
import { Button, IconButton } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { exploreKey, setFollowing } from '@/features/explore/api';
import { followRefusedNotice, FOLLOW_NOTICE_MS } from '@/features/explore/follow';
import { hueFor } from '@/features/feed/model';
import type { FlowHandlers } from '@/features/feedpay/usePaymentFlow';
import { fetchGridPage, gridKey } from '@/features/me/api';
import { ContentGrid, GridSkeleton } from '@/features/me/ContentGrid';
import { countsOf, roleLinesOf, socialLinksOf, tileOf, type ProfileTab, type SocialLink } from '@/features/me/model';
import { Counts, HeaderSkeleton, NameBlock, SocialChips, bodyTop } from '@/features/me/ProfileHeader';
import { ProfileTabs } from '@/features/me/ProfileTabs';
import { AskSheets } from '@/features/paid-ask/AskSheets';
import { askButtonLabel, offBody, offTitle } from '@/features/paid-ask/model';
import { useAsk } from '@/features/paid-ask/useAsk';
import { useAskTerms } from '@/features/paid-ask/useAskTerms';
import { openFreeChat } from '@/features/paid-answers/api';
import { tickOf } from '@/features/chat/api';
import { ServicesTab } from '@/features/me/ServicesTab';
import { readFailure } from '@/features/profile-edit/failure';
import { TipSheets } from '@/features/tips/TipSheets';
import { useTip } from '@/features/tips/useTip';
import { WorksFrame } from '@/features/works/WorksFrame';
import { layout, radius, space, useWawu } from '@/theme';

import {
  blockPerson,
  educationKey,
  fetchEducation,
  fetchVisitorProfile,
  fetchVisitorWorks,
  visitorKey,
  visitorWorksKey,
  type VisitorProfile,
} from './api';
import {
  headlineLine,
  openToChips,
  paidLine,
  placeLine,
  profileShareText,
  subtitleLine,
  visitorBadge,
  visitorName,
  visitorTicks,
} from './model';
import { Actions, type ActionsProps, EducationCard, ExperienceCard, FootBar, IntroCard, SkillsCard, VisitorTop, WorksCard } from './parts';

/** How near the end of the page (in points) the next page of pieces is asked for. */
const MORE_WITHIN = 600;
const BOTTOM_ROOM = space.s3xl;
/** design/_gen/me.js `profBody`: the blocks stack 16 apart. */
const BODY_GAP = space.lg;
const SKELETON_H = 120;

function useCache(): QueryClient {
  return useContext(QueryClientContext) ?? queryClient;
}

export type VisitorProfileScreenProps = {
  /** The person's WAWU ID or handle (the route's `wawuId`). */
  wawuId: string;
  onBack: () => void;
  /** The Hub says this is the person's own profile: the route sends them to the Me tab. */
  onOwn: () => void;
  /** See all N (M34). */
  onOpenAllWorks: (wawuId: string) => void;
  /** A work (M35). */
  onOpenWork: (wawuId: string, workId: string) => void;
  /** A professional listing on Services opens that professional's page. */
  onOpenListing: (listingId: string) => void;
  /** After Block: the profile is gone for both people, so the route leaves it. */
  onBlocked: () => void;
  /** Where the tip's and the question's wallet steps lead (Open your wallet, a PIN to set, Forgot PIN, add money). The ₦ button is drawn only when given (R-47). */
  pay?: FlowHandlers;
  /** A question was paid: the thread (I4) opens. Message and its price are drawn only when this and `pay` are given (R-47). */
  onOpenPaidThread?: (wawuId: string) => void;
  /**
   * The free chat with this person (R-13) is open: its id goes here and the chat (I12) opens. Message (free) is drawn only when this is
   * given, and whether or not the person takes paid messages: "Messages off" only means paid messages are off (SWEEP-FLOWS B3).
   */
  onOpenChat?: (chatId: string) => void;
  /** False while another screen (Add money) is on top of this one, true when it is in front. The route says; the ask sheet asks its quote again on return (I6). */
  focused?: boolean;
};

type ActionsAsk = NonNullable<ActionsProps['ask']>;
const NOT_WIRED: FlowHandlers = { onOpenWallet: () => undefined, onSetPin: () => undefined, onForgotPin: () => undefined, onAddMoney: () => undefined };

/**
 * M5 · Public profile, M6 · Following and M33 · About, as a visitor: somebody else's profile. Content, Services and About
 * (R-9: no Shop tab). Content and Services draw M5's page (cover, name, counts, Follow and the ₦ tip, then the tab); About draws
 * M33's (a bar with the name and a line under it, the tabs, the cards, and Follow pinned at the bottom).
 *
 * One call (`GET /users/{wawuId}/visitor-profile`) decides the whole page, so a person the Hub hides (blocked either way, deleted,
 * no public profile) shows the Hub's answer and nothing else, never a half-drawn profile. Follow and Following write once per tap
 * with what the Hub answers; the counts are re-read after. Message with its price (I2) opens the ask sheet (I3) when the Hub says the
 * creator takes paid questions; when it does not, "Messages off" and the note under it (I8). Not drawn yet (the task that builds the
 * screen adds it, R-47): the Bio voice player (VOICE-01).
 */
export function VisitorProfileScreen({ wawuId, onBack, onOwn, onOpenAllWorks, onOpenWork, onOpenListing, onBlocked, pay, onOpenPaidThread, onOpenChat, focused = true }: VisitorProfileScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const cache = useCache();
  const profile = useQuery({ queryKey: visitorKey(wawuId), queryFn: () => fetchVisitorProfile(wawuId), retry: false }, cache);
  const [tab, setTab] = useState<ProfileTab>('content');
  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const tip = useTip(pay ?? NOT_WIRED);
  const asking = Boolean(pay && onOpenPaidThread);
  const ask = useAsk(pay ?? NOT_WIRED, (who) => onOpenPaidThread?.(who), focused);

  const view = profile.data ?? null;
  const person = view?.profile.wawuUserId ?? null;
  const name = view ? visitorName(view) : '';
  const terms = useAskTerms(asking && view && !view.own ? person : null, asking && view && !view.own ? view.profile : null);

  useEffect(() => {
    if (view?.own) onOwn();
  }, [view?.own, onOwn]);

  // Set the moment a tap is taken, not when React next draws: two taps in one frame still write once.
  const writing = useRef(false);
  const follow = useMutation(
    {
      mutationFn: (next: boolean) => setFollowing(person as string, next),
      onSettled: () => {
        writing.current = false;
      },
      onMutate: (next) => {
        cache.setQueryData<VisitorProfile>(visitorKey(wawuId), (old) => (old ? { ...old, following: next } : old));
      },
      onSuccess: (following) => {
        cache.setQueryData<VisitorProfile>(visitorKey(wawuId), (old) => (old ? { ...old, following } : old));
        void cache.invalidateQueries({ queryKey: visitorKey(wawuId) });
        void cache.invalidateQueries({ queryKey: exploreKey });
        void cache.invalidateQueries({ queryKey: ['feed'] });
      },
      onError: (_error, next) => {
        cache.setQueryData<VisitorProfile>(visitorKey(wawuId), (old) => (old ? { ...old, following: !next } : old));
        setNotice(followRefusedNotice(name || 'this person', next));
      },
    },
    cache,
  );
  const toggleFollow = () => {
    if (!view || writing.current) return;
    writing.current = true;
    setNotice(null);
    follow.mutate(!view.following);
  };

  // One Block at a time, as for Follow: a second tap before the first answer sends nothing (SWEEP-APP row ME-02 L1).
  const blocking = useRef(false);
  const block = useMutation(
    {
      mutationFn: () => blockPerson(person as string),
      onSettled: () => {
        blocking.current = false;
      },
      onSuccess: () => {
        setConfirmBlock(false);
        setMenuOpen(false);
        void cache.invalidateQueries({ queryKey: ['profile'] });
        void cache.invalidateQueries({ queryKey: exploreKey });
        void cache.invalidateQueries({ queryKey: ['feed'] });
        onBlocked();
      },
    },
    cache,
  );

  // One free chat opened at a time: a second tap while the first is on its way opens nothing more (the Hub finds the same chat anyway).
  const chatting = useRef(false);
  const [openingChat, setOpeningChat] = useState(false);
  const message = async () => {
    if (!person || !onOpenChat || chatting.current) return;
    chatting.current = true;
    setOpeningChat(true);
    setNotice(null);
    try {
      onOpenChat(await openFreeChat(person));
    } catch (error) {
      setNotice(isApiError(error) && error.message ? error.message : 'The chat could not be opened. Try again.');
    } finally {
      chatting.current = false;
      setOpeningChat(false);
    }
  };

  const share = async () => {
    if (!view) return;
    setNotice(null);
    try {
      await Share.share({ message: profileShareText(name, view.profile.handle) });
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

  const grid = useInfiniteQuery(
    {
      queryKey: gridKey(person ?? ''),
      queryFn: ({ pageParam }) => fetchGridPage(person as string, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled: person !== null && !view?.own && tab === 'content',
    },
    cache,
  );

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (tab !== 'content' || !grid.hasNextPage || grid.isFetchingNextPage) return;
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - MORE_WITHIN) void grid.fetchNextPage();
  };

  const hidden = profile.isError && isApiError(profile.error) && profile.error.status === 404;
  const askAction: ActionsAsk | undefined =
    !asking || !view || !terms
      ? undefined
      : terms.kind === 'off'
        ? { kind: 'off' }
        : {
            kind: 'on',
            label: askButtonLabel(terms.priceKobo),
            onPress: () =>
              ask.begin({
                wawuId: view.profile.wawuUserId,
                name,
                avatarUrl: view.profile.avatarUrl,
                hue: hueFor(view.profile.wawuUserId),
                tick: tickOf(view.profile),
                priceKobo: terms.priceKobo,
                windowHours: terms.windowHours,
              }),
          };
  const tipHandler = pay && view ? () => tip.begin({ wawuId: view.profile.wawuUserId, name, avatarUrl: view.profile.avatarUrl, hue: hueFor(view.profile.wawuUserId) }) : undefined;
  const toast = (
    <Toast message={notice} tone="alert" placement="bottom" offset={insets.bottom + space.xl} duration={FOLLOW_NOTICE_MS} onHide={() => setNotice(null)} testID="visitor-notice" />
  );
  const sheets = (
    <>
      {view ? (
        <BottomSheet visible={menuOpen} onClose={() => { setMenuOpen(false); setConfirmBlock(false); }} label="More" gap={space.md} testID="visitor-menu">
          {confirmBlock ? (
            <View style={styles.confirm} testID="visitor-block-confirm">
              <Text variant="h2" accessibilityRole="header">{`Block ${name}?`}</Text>
              <Text variant="body" tone="textSecondary">
                You will not see each other&rsquo;s profiles, and any follow between you ends.
              </Text>
              {block.isError ? (
                <Text variant="body" tone="danger" accessibilityRole="alert" testID="visitor-block-failed">
                  {isApiError(block.error) && block.error.kind === 'network' ? block.error.message : 'Could not block them. Try again.'}
                </Text>
              ) : null}
              <Button testID="visitor-block-yes" label="Block" variant="primary" loading={block.isPending}
                onPress={() => {
                  if (blocking.current) return;
                  blocking.current = true;
                  block.mutate();
                }}
                full
              />
              <Button testID="visitor-block-no" label="Cancel" variant="secondary" onPress={() => { block.reset(); setConfirmBlock(false); }} full />
            </View>
          ) : (
            <GroupedList testID="visitor-menu-list">
              {onOpenChat ? (
                <ListRow
                  testID="visitor-menu-message"
                  lead={<IconTile icon="MessageCircle" />}
                  title={`Message ${name}`}
                  onPress={() => {
                    setMenuOpen(false);
                    void message();
                  }}
                />
              ) : null}
              <ListRow testID="visitor-menu-block" lead={<IconTile icon="Ban" />} title={`Block ${name}`} onPress={() => setConfirmBlock(true)} />
            </GroupedList>
          )}
        </BottomSheet>
      ) : null}
      {pay ? <TipSheets tip={tip} onAddMoney={pay.onAddMoney} onOpenWallet={pay.onOpenWallet} onForgotPin={pay.onForgotPin} /> : null}
      {pay && asking ? <AskSheets ask={ask} onAddMoney={pay.onAddMoney} onOpenWallet={pay.onOpenWallet} onForgotPin={pay.onForgotPin} /> : null}
    </>
  );

  // The page when the Hub answered: M33 for the About tab, M5 and M6 for the others.
  if (view && !view.own && tab === 'about') {
    return (
      <>
        <WorksFrame
          testID="visitor-screen"
          title={name}
          subtitle={subtitleLine(view) ?? undefined}
          onBack={onBack}
          right={<IconButton icon="Share" label="Share this profile" onPress={() => void share()} testID="visitor-share" />}
          below={
            <View style={styles.tabsRow}>
              <ProfileTabs value={tab} onChange={setTab} accent />
            </View>
          }
          footer={
            <FootBar bottom={insets.bottom}>
              <Actions following={view.following} busy={follow.isPending} onToggleFollow={toggleFollow} wide />
            </FootBar>
          }
        >
          <AboutBody wawuId={wawuId} view={view} onOpenAllWorks={onOpenAllWorks} onOpenWork={onOpenWork} />
        </WorksFrame>
        {toast}
        {sheets}
      </>
    );
  }

  return (
    <View testID="visitor-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScrollView testID="visitor-scroll" onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <VisitorTop
          coverUrl={view?.profile.coverUrl ?? null}
          top={insets.top}
          canShare={view !== null && !view.own}
          onBack={onBack}
          onShare={() => void share()}
          onOpenMenu={view && !view.own ? () => setMenuOpen(true) : undefined}
        />
        <View style={[styles.body, { paddingTop: bodyTop(insets.top) }]}>
          {hidden ? (
            <EmptyState
              testID="visitor-unavailable"
              icon="Ban"
              title="This profile is not available"
              message={isApiError(profile.error) && profile.error.message ? profile.error.message : 'User not found'}
              action={{ label: 'Go back', onPress: onBack }}
            />
          ) : profile.isError ? (
            <ErrorState testID="visitor-error" title="This profile did not load" message={readFailure(profile.error)} onRetry={() => void profile.refetch()} />
          ) : !view || view.own ? (
            <LoadingView label="Loading this profile" testID="visitor-loading">
              <View style={styles.skeleton}>
                <HeaderSkeleton />
              </View>
            </LoadingView>
          ) : (
            <>
              <NameBlock
                wawuId={view.profile.wawuUserId}
                name={name}
                avatarUrl={view.profile.avatarUrl}
                ticks={visitorTicks(view)}
                badge={visitorBadge(view.fields)}
                bio={view.profile.bio}
              />
              <SocialChips links={socialLinksOf(view.profile, view.fields)} onOpen={(link: SocialLink) => void open(link.url, 'That link')} />
              <Counts counts={countsOf({ followerCount: view.profile.followerCount, followingCount: view.profile.followingCount, postCount: view.profile.contentCount })} />
              <Actions following={view.following} busy={follow.isPending} onToggleFollow={toggleFollow} onTip={tipHandler} ask={askAction} />
              {terms?.kind === 'off' ? <Banner tone="info" icon="Info" title={offTitle(name)} body={offBody(name)} testID="visitor-messages-off" /> : null}
              {terms?.kind === 'off' && onOpenChat ? (
                <Button testID="visitor-message-free" label={`Message ${name}`} icon="MessageCircle" variant="secondary" size="md" loading={openingChat} onPress={() => void message()} full />
              ) : null}
              <ProfileTabs value={tab} onChange={setTab} />
              {tab === 'content' ? <ContentBody query={grid} /> : null}
              {tab === 'services' ? <ServicesBody view={view} onOpenListing={onOpenListing} /> : null}
            </>
          )}
        </View>
      </ScrollView>
      {toast}
      {sheets}
    </View>
  );
}

type GridQuery = ReturnType<typeof useInfiniteQuery<Awaited<ReturnType<typeof fetchGridPage>>>>;

function ContentBody({ query }: { query: GridQuery }) {
  if (query.isError && !query.data) {
    return <ErrorState testID="visitor-grid-error" title="Their content did not load" message={readFailure(query.error)} onRetry={() => void query.refetch()} />;
  }
  if (!query.data) {
    return (
      <LoadingView label="Loading their content" testID="visitor-grid-loading">
        <GridSkeleton />
      </LoadingView>
    );
  }
  const tiles = query.data.pages.flatMap((page) => page.pieces).map(tileOf);
  if (tiles.length === 0) {
    return <EmptyState testID="visitor-grid-empty" icon="LayoutGrid" title="Nothing published yet" message="What they publish shows here." />;
  }
  return (
    <View style={styles.gridWrap}>
      <ContentGrid tiles={tiles} />
      {query.isFetchingNextPage ? <GridSkeleton /> : null}
      {query.isFetchNextPageError ? (
        <ErrorState testID="visitor-grid-more-error" title="More content did not load" message={readFailure(query.error)} onRetry={() => void query.fetchNextPage()} />
      ) : null}
    </View>
  );
}

function ServicesBody({ view, onOpenListing }: { view: VisitorProfile; onOpenListing: (listingId: string) => void }) {
  const paid = paidLine(view.profile);
  if (!paid && view.listings.length === 0) {
    return <EmptyState testID="visitor-services-empty" icon="BriefcaseBusiness" title="No services yet" message="Paid messages and professional listings show here once they are on." />;
  }
  return <ServicesTab paid={paid} listings={view.listings} onOpenListing={onOpenListing} />;
}

/** M33's cards. The works and the education load apart from the page: a failure in one leaves the rest on screen with its own note and retry. */
function AboutBody({ wawuId, view, onOpenAllWorks, onOpenWork }: { wawuId: string; view: VisitorProfile; onOpenAllWorks: (wawuId: string) => void; onOpenWork: (wawuId: string, workId: string) => void }) {
  const cache = useCache();
  const person = view.profile.wawuUserId;
  const works = useQuery({ queryKey: visitorWorksKey(person), queryFn: () => fetchVisitorWorks(person), retry: false }, cache);
  const education = useQuery({ queryKey: educationKey(person), queryFn: () => fetchEducation(person), retry: false }, cache);
  return (
    <View testID="visitor-about" style={styles.about}>
      <IntroCard headline={headlineLine(view.profile)} place={placeLine(view.fields)} located={Boolean(view.fields.location?.trim())} openTo={openToChips(view.fields.openTo)} />
      {works.isError ? (
        <ErrorState testID="visitor-works-error" title="Their featured works did not load" message={readFailure(works.error)} onRetry={() => void works.refetch()} />
      ) : !works.data ? (
        <LoadingView label="Loading their featured works" testID="visitor-works-loading">
          <Skeleton height={SKELETON_H} radius={radius.card} />
        </LoadingView>
      ) : (
        <WorksCard works={works.data.works} count={works.data.count} onSeeAll={() => onOpenAllWorks(wawuId)} onOpenWork={(workId) => onOpenWork(wawuId, workId)} />
      )}
      <ExperienceCard roles={roleLinesOf(view.profile.experience)} />
      <SkillsCard skills={view.fields.skills} />
      {education.isError ? (
        <ErrorState testID="visitor-education-error" title="Their education did not load" message={readFailure(education.error)} onRetry={() => void education.refetch()} />
      ) : !education.data ? (
        <LoadingView label="Loading their education" testID="visitor-education-loading">
          <Skeleton height={SKELETON_H} radius={radius.card} />
        </LoadingView>
      ) : (
        <EducationCard rows={education.data} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: BOTTOM_ROOM },
  body: { paddingHorizontal: layout.gutter, gap: BODY_GAP },
  skeleton: { gap: BODY_GAP },
  gridWrap: { gap: space.xs },
  about: { gap: space.md },
  tabsRow: { paddingHorizontal: layout.gutter },
  confirm: { gap: space.md },
});
