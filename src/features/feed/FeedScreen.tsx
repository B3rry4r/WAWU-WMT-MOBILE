import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
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
import { drawablePosts, postKind } from './model';
import { fromPostBottom } from './parts';
import { AudioPost } from './AudioPost';
import { PdfPost } from './PdfPost';
import { PhotoSetPost } from './PhotoSetPost';
import type { PostProps } from './PostFrame';
import { VideoPost } from './VideoPost';

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
 * Home's For you and Following feed (H2 to H6): one post fills the screen, a swipe up
 * brings the next. Posts come from `GET /feed/entries`; this task draws videos, photo sets,
 * PDFs and audio. Courses, templates and the creator and professional cards are HOME-07's
 * and are not drawn until it adds them.
 *
 * On Home (HOME-01) the tab row also holds Today: `onToday` is called when it is pressed, and
 * the feed opens on `initialScope`, the tab pressed on Today.
 */
export type FeedScreenProps = { initialScope?: FeedScope; onToday?: () => void };

export function FeedScreen({ initialScope = 'for_you', onToday }: FeedScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const { dark, colors } = useWawu();
  const focused = useIsFocused();
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

  const posts = useMemo(() => {
    const seen = new Set<string>();
    return drawablePosts(feed.data?.pages.flatMap((p) => p.entries) ?? []).filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [feed.data]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const pagesRead = feed.data?.pages.length ?? 0;
  // A page holding only posts this task does not draw (HOME-07's) reads on, so a feed is never shown empty while the Hub has more.
  useEffect(() => {
    if (posts.length === 0 && pagesRead > 0 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [posts.length, pagesRead, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const empty = feed.isSuccess && posts.length === 0 && !hasNextPage;
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

  const loading = feed.isPending || (posts.length === 0 && feed.isSuccess && Boolean(hasNextPage));
  // Posts and their loading view are drawn over media; the empty and error views are a themed page (H12, H13).
  const showsMedia = loading || posts.length > 0;

  let body;
  if (loading) {
    body = <FeedLoading height={size.height} />;
  } else if (feed.isError && posts.length === 0) {
    body = (
      <View style={styles.centre}>
        <ErrorState
          testID="feed-error"
          icon="WifiOff"
          title="The feed didn't load"
          message="Check your connection, then try again."
          onRetry={() => feed.refetch()}
        />
      </View>
    );
  } else if (empty) {
    const followsNobody = scope === 'following' && following.data === 0;
    body = (
      <View style={styles.centre}>
        <EmptyState
          testID="feed-empty"
          icon={scope === 'following' ? 'UserPlus' : 'Sparkles'}
          title={
            scope === 'for_you' ? 'Nothing to show yet' : followsNobody ? "You're not following anyone yet" : 'No new posts yet'
          }
          message={
            scope === 'for_you'
              ? 'New posts from creators show up here.'
              : followsNobody
                ? 'Follow creators and professionals and their new posts land here first.'
                : 'When people you follow post something new, it lands here first.'
          }
        />
      </View>
    );
  } else {
    body = (
      <FlatList
        key={scope}
        testID={`feed-${scope}`}
        data={posts}
        keyExtractor={(p: FeedItem) => p.id}
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
        renderItem={({ item, index }) => (
          <Post
            item={item}
            active={focused && index === current}
            width={size.width}
            height={size.height}
            myId={me.data ?? null}
            chromeTop={chromeTop}
          />
        )}
      />
    );
  }

  return (
    <View testID="feed" style={[styles.root, { backgroundColor: showsMedia ? media.black : colors.surfacePage }]} onLayout={onLayout}>
      {focused ? <StatusBar style={showsMedia || dark ? 'light' : 'dark'} /> : null}
      {size.height > 0 ? body : null}
      <HomeTabs
        views={onToday ? homeViews : scopes}
        selected={scope}
        tone={showsMedia ? 'media' : 'page'}
        onChange={changeView}
        style={[styles.tabs, { top: chromeTop + metrics.tabsGap }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { position: 'absolute', left: metrics.tabsSide, right: metrics.tabsSide, zIndex: 7 },
  centre: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xl },
  loadingRail: { position: 'absolute', right: metrics.railRight, alignItems: 'center', gap: metrics.railGap },
  loadingWords: { position: 'absolute', left: metrics.side, right: metrics.captionRight, gap: metrics.stack },
});
