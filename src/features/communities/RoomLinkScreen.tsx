import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { useSession } from '@/api/session';
import { IconButton } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { layout, radius, space, useWawu } from '@/theme';

import { resolveLink } from './api';

const linkMetrics = { tile: 56, line: 14, bar: 40 } as const;

export type RoomLinkScreenProps = { slug: string };

/**
 * A room link `wawu/c/<slug>`. It asks the server which room the slug names (`GET /communities/links/:slug`) and
 * opens that room in this screen's place, so Back goes to where the link was opened from. A slug nobody holds
 * says so. Someone who is signed out is asked to sign in first.
 */
export function RoomLinkScreen({ slug }: RoomLinkScreenProps) {
  const router = useRouter();
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const { status } = useSession();
  const signedIn = status === 'signedIn';
  const room = useQuery({ queryKey: ['community', 'link', slug], queryFn: () => resolveLink(slug), enabled: signedIn, gcTime: 0 }, queryClient);
  const found = room.data?.id;

  useEffect(() => {
    if (found) router.replace({ pathname: '/community/[id]', params: { id: found } });
  }, [found, router]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/inbox'));

  let body;
  if (status === 'signedOut') {
    body = (
      <EmptyState
        testID="room-link-signed-out"
        icon="Lock"
        title="Sign in to open this community"
        message="Community links open once you are signed in."
        action={{ label: 'Sign in', onPress: () => router.push('/sign-in') }}
      />
    );
  } else if (room.isError) {
    const gone = isApiError(room.error) && room.error.status === 404;
    body = gone ? (
      <EmptyState
        testID="room-link-unknown"
        icon="Ban"
        title="This link doesn’t lead to a community"
        message="The community may have been taken down, or the link may have been mistyped."
        action={{ label: 'Go to your inbox', onPress: () => router.replace('/inbox') }}
      />
    ) : (
      <ErrorState
        testID="room-link-error"
        title="Couldn’t open this link"
        message={isApiError(room.error) ? room.error.message : 'Something went wrong. Try again.'}
        icon={isApiError(room.error) && room.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        onRetry={() => void room.refetch()}
      />
    );
  } else {
    body = (
      <LoadingView testID="room-link-loading" label="Opening the community">
        <View style={styles.loading}>
          <Skeleton width={linkMetrics.tile} height={linkMetrics.tile} radius={radius.tile} />
          <Skeleton width={layout.screenW / 2} height={linkMetrics.line} />
        </View>
      </LoadingView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]} testID="room-link-screen">
      <View style={styles.bar}>
        <IconButton icon="ChevronLeft" label="Back" onPress={leave} size={linkMetrics.bar} testID="room-link-back" />
      </View>
      <View style={styles.center}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { paddingHorizontal: space.md, paddingVertical: space.sm, flexDirection: 'row' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: layout.gutter },
  loading: { alignItems: 'center', gap: space.md },
});
