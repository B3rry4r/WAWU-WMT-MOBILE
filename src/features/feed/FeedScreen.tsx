import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import type { FlowHandlers } from '@/features/feedpay/usePaymentFlow';
import { useFeedPay } from '@/features/feedpay/useFeedPay';
import { HomeTabs } from '@/features/home/HomeTabs';
import { homeViews, type HomeView } from '@/features/home/model';
import { radius, space, useWawu } from '@/theme';

import {
  feedKey,
  fetchFeedPage,
  fetchFollowingCount,
  fetchMyId,
  followingCountKey,
  meKey,
  type FeedItem,
  type FeedScope,
} from './api';
import { media, metrics } from './look';
import { feedRows, postKind, type FeedRow } from './model';
import { fromPostBottom } from './parts';
import { AudioPost } from './AudioPost';
import { CoursePost } from './CoursePost';
import { FeedCreatorCard } from './FeedCreatorCard';
import { FeedProfessionalCard } from './FeedProfessionalCard';
import { FollowingEmpty } from './FollowingEmpty';
import { PdfPost } from './PdfPost';
import { PhotoSetPost } from './PhotoSetPost';
import type { PostProps } from './PostFrame';
import { TemplatePost } from './TemplatePost';
import { VideoPost } from './VideoPost';
import { todayMetrics } from '@/features/home/look';

/** The feed's own two tabs; Home adds Today before them (H1, HOME-01). */
const scopes: readonly { view: HomeView; label: string }[] = homeViews.filter((v) => v.view !== 'today');

function Post(props: PostProps) {
  switch (postKind(props.item)) {
    case 'video':
      return <VideoPost {...props} />;
    case 'photos':
      return <PhotoSetPost {...props} />;
    case 'pdf':
      return <PdfPost {...props} />;
    case 'audio':
      return <AudioPost {...props} />;
    case 'course':
      return <CoursePost {...props} />;
    case 'template':
      return <TemplatePost {...props} />;
    default:
      return null;
  }
}

/** The feed while its first page is on the way: the post's rail and words, quiet. */
function FeedLoading({ height }: { height: number }) {
  const block = { backgroundColor: media.glass };
  return (
    <LoadingView testID="feed-loading" label="Loading the feed">
      <View style={{ height }}>
        <View style={[styles.loadingRail, { bottom: fromPostBottom(metrics.railBottom) + metrics.tipSlot }]}>
          <Skeleton width={metrics.avatar} height={metrics.avatar} radius={radius.chip} style={block} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={metrics.railIcon} height={metrics.railIcon} radius={radius.chip} style={block} />
          ))}
        </View>
        <View style={[styles.loadingWords, { bottom: fromPostBottom(metrics.captionBottom) }]}>
          <Skeleton width={metrics.loadingPill} height={metrics.pillH} radius={radius.chip} style={block} />
          <Skeleton width="50%" height={metrics.tick} style={block} />
          <Skeleton width="80%" height={metrics.tick} style={block} />
        </View>
      </View>
    </LoadingView>
  );
}

/**
 * Home's For you and Following feed (H2 to H8): one post fills the screen, a swipe up
 * brings the next. Posts come from `GET /feed/entries`: videos, photo sets, PDFs, audio, courses (H7)
 * and templates (H8), and among them, on For you, a creator card (H9) and a professional card (H10).
 * Following with no one followed is H12, and a feed that cannot be read is H13.
 *
 * On Home (HOME-01) the tab row also holds Today: `onToday` is called when it is pressed, and
 * the feed opens on `initialScope`, the tab pressed on Today.
 */
export type FeedScreenProps = {
  initialScope?: FeedScope;
  onToday?: () => void;
  /** The search button at the end of the tab row opens Search (X5, EXPLORE-02). Not drawn without it. */
  onSearch?: () => void;
  /**
   * Where the feed's wallet payments lead when they need somewhere else (Open your wallet, a PIN to set, Forgot PIN, add money).
   * With it, the rail draws ₦ Tip (H26, HOME-13); left out, no payment can start from the feed.
   */
  pay?: FlowHandlers;
  /** A post's caption, and a piece in a creator card's strip, open that piece's own page (H19, HOME-03). Left out, they only read. */
  onOpenPiece?: (item: Pick<FeedItem, 'id'>) => void;
  /** A professional card's Profile opens their page (P2) with the listing's id. Not drawn without it. */
  onOpenProfessional?: (id: string) => void;
  /** A professional card's Message opens the paid question (I3), and a paid question opens its thread (I4) with the creator's WAWU ID. Message is not drawn without it and `pay`. */
  onOpenPaidThread?: (creatorWawuId: string) => void;
  /** A creator card's Profile button opens that creator's profile (H9, M5). Not drawn without it. */
  onOpenCreator?: (wawuId: string) => void;
  /** "Find people to follow" on an empty Following, and the creators rail's "See all" beside it, open All creators (X4). Not drawn without it. */
  onSeeAllCreators?: () => void;
};

export function FeedScreen({ initialScope = 'for_you', onToday, onSearch, pay: payHandlers, onOpenPiece, onOpenProfessional, onOpenPaidThread, onOpenCreator, onSeeAllCreators }: FeedScreenProps = {}) {
  const focused = useIsFocused();
  const pay = useFeedPay(payHandlers, { onOpenPaidThread, focused });
  const insets = useSafeAreaInsets();
  const { dark, colors } = useWawu();
  const chromeTop = Math.max(insets.top, metrics.statusBar);
  const [scope, setScope] = useState<FeedScope>(initialScope);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [current, setCurrent] = useState(0);

  const feed = useInfiniteQuery({
    queryKey: feedKey(scope),
    queryFn: ({ pageParam }) => fetchFeedPage(scope, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId, staleTime: Infinity });

  const rows = useMemo(() => feedRows(feed.data?.pages.flatMap((p) => p.entries) ?? []), [feed.data]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const pagesRead = feed.data?.pages.length ?? 0;
  // A page holding nothing the feed draws (a kind it has no layout for) reads on, so a feed is never shown empty while the Hub has more.
  useEffect(() => {
    if (rows.length === 0 && pagesRead > 0 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [rows.length, pagesRead, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const empty = feed.isSuccess && rows.length === 0 && !hasNextPage;
  const following = useQuery({
    queryKey: followingCountKey,
    queryFn: fetchFollowingCount,
    enabled: empty && scope === 'following',
  });

  const changeView = (next: HomeView) => {
    if (next === 'today') {
      onToday?.();
      return;
    }
    if (next === scope) return;
    setCurrent(0);
    setScope(next);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.height <= 0) return;
    const at = Math.round(e.nativeEvent.contentOffset.y / size.height);
    if (at !== current) setCurrent(at);
  };

  const loading = feed.isPending || (rows.length === 0 && feed.isSuccess && Boolean(hasNextPage));
  // Posts and their loading view are drawn over media; the empty and error views are a themed page (H12, H13).
  const showsMedia = loading || rows.length > 0;

  let body;
  if (loading) {
    body = <FeedLoading height={size.height} />;
  } else if (feed.isError && rows.length === 0) {
    body = (
      <View style={styles.centre}>
        <ErrorState
          testID="feed-error"
          icon="WifiOff"
          title="The feed didn't load"
          message="Check your connection. Anything you've bought is still in My purchases."
          onRetry={() => feed.refetch()}
        />
      </View>
    );
  } else if (empty && scope === 'following' && following.isPending) {
    // The count that tells "you follow no one" from "they have not posted" is on its way.
    body = null;
  } else if (empty && scope === 'following' && following.data === 0) {
    body = (
      <FollowingEmpty top={chromeTop + metrics.tabsGap + todayMetrics.headRow + todayMetrics.headBottom + todayMetrics.bodyTop} myId={me.data ?? null} onFindPeople={onSeeAllCreators} />
    );
  } else if (empty) {
    body = (
      <View style={styles.centre}>
        <EmptyState
          testID="feed-empty"
          icon={scope === 'following' ? 'UserPlus' : 'Sparkles'}
          title={scope === 'for_you' ? 'Nothing to show yet' : 'No new posts yet'}
          message={scope === 'for_you' ? 'New posts from creators show up here.' : 'When people you follow post something new, it lands here first.'}
        />
      </View>
    );
  } else {
    body = (
      <FlatList
        key={scope}
        testID={`feed-${scope}`}
        data={rows}
        keyExtractor={(row: FeedRow) => row.key}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={size.height || undefined}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: size.height, offset: size.height * index, index })}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={2}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        renderItem={({ item: row, index }) => {
          if (row.kind === 'creator') {
            return <FeedCreatorCard card={row.card} width={size.width} height={size.height} chromeTop={chromeTop} onOpenWork={onOpenPiece ? (id) => onOpenPiece({ id }) : undefined} onOpenProfile={onOpenCreator} />;
          }
          if (row.kind === 'professional') {
            return (
              <FeedProfessionalCard
                card={row.card}
                width={size.width}
                height={size.height}
                chromeTop={chromeTop}
                onOpenProfile={onOpenProfessional}
                onMessage={row.card.wawuId === me.data ? undefined : pay.onMessage}
              />
            );
          }
          return (
            <Post
              item={row.item}
              active={focused && index === current}
              width={size.width}
              height={size.height}
              myId={me.data ?? null}
              chromeTop={chromeTop}
              onTip={pay.onTip}
              onUnlock={pay.onUnlock}
              unlocking={pay.unlockingId === row.item.id}
              onOpen={onOpenPiece}
            />
          );
        }}
      />
    );
  }

  return (
    <View testID="feed" style={[styles.root, { backgroundColor: showsMedia ? media.black : colors.surfacePage }]} onLayout={onLayout}>
      {focused ? <StatusBar style={showsMedia || dark ? 'light' : 'dark'} /> : null}
      {size.height > 0 ? body : null}
      {pay.sheets}
      <HomeTabs
        views={onToday ? homeViews : scopes}
        selected={scope}
        tone={showsMedia ? 'media' : 'page'}
        onChange={changeView}
        style={[styles.tabs, { top: chromeTop + metrics.tabsGap }]}
      />
      {onSearch ? (
        showsMedia ? (
          <Pressable
            testID="feed-search"
            accessibilityRole="button"
            accessibilityLabel="Search"
            hitSlop={space.md}
            onPress={onSearch}
            style={[styles.search, { top: chromeTop + metrics.tabsGap }]}
          >
            <Icon name="Search" size={24} color={media.ink} />
          </Pressable>
        ) : (
          <View style={[styles.search, { top: chromeTop + metrics.tabsGap }]}>
            <IconButton icon="Search" label="Search" size={40} onPress={onSearch} testID="feed-search" />
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { position: 'absolute', left: metrics.tabsSide, right: metrics.tabsSide, zIndex: 7 },
  search: { position: 'absolute', right: metrics.tabsSide, zIndex: 8 },
  centre: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xl },
  loadingRail: { position: 'absolute', right: metrics.railRight, alignItems: 'center', gap: metrics.railGap },
  loadingWords: { position: 'absolute', left: metrics.side, right: metrics.captionRight, gap: metrics.stack },
});
