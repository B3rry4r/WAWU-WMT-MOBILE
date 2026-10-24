import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { MoviesGate } from '@/features/movies/MoviesGate';
import { MoviesScreen } from '@/features/movies/MoviesScreen';
import { browseParams, useLeave } from '@/features/movies/routes';

/** MV1 · Flix movies (`/movies`), opened from the rail's See all on Home and Explore. Signed in only; drawn only when the Hub says movies are on; off and soon send the person out (R-80). */
export default function MoviesRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = useLeave();
  const off = useCallback(() => router.replace('/'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <MoviesGate onOff={off} showWhilePending>
      <MoviesScreen
        onBack={leave}
        onSearch={() => router.push('/movies/search')}
        onOpenMovie={(id) => router.push({ pathname: '/movies/[id]', params: { id } })}
        onWatch={(id) => router.push({ pathname: '/movies/[id]', params: { id, watch: '1' } })}
        onTrailer={(id) => router.push({ pathname: '/movies/[id]/trailer', params: { id } })}
        onBrowse={(filter) => router.push({ pathname: '/movies/all', params: browseParams(filter) })}
        onOpenTab={(route) => router.navigate(route === 'index' ? '/' : `/${route}`)}
      />
    </MoviesGate>
  );
}
