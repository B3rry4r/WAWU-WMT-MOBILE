import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { MovieScreen } from '@/features/movies/MovieScreen';
import { MoviesGate } from '@/features/movies/MoviesGate';
import { useLeave } from '@/features/movies/routes';

/** MV2 · Movie, MV9 for a title that has not premiered, and MV4 and MV5 over it (`/movies/<id>`). `watch=1` opens MV4 at once. */
export default function MovieRoute() {
  const router = useRouter();
  const { id, watch } = useLocalSearchParams<{ id: string; watch?: string }>();
  const { status } = useSession();
  const leave = useLeave();
  const off = useCallback(() => router.replace('/'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <MoviesGate onOff={off}>
      <MovieScreen
        movieId={String(id)}
        startWatching={watch === '1'}
        onBack={leave}
        onTrailer={() => router.push({ pathname: '/movies/[id]/trailer', params: { id: String(id) } })}
        onOpenTerms={() => router.push('/terms')}
        onOpenPrivacy={() => router.push('/privacy-policy')}
      />
    </MoviesGate>
  );
}
