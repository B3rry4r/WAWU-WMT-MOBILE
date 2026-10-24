import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { MoviesGate } from '@/features/movies/MoviesGate';
import { useLeave } from '@/features/movies/routes';
import { SearchScreen } from '@/features/movies/SearchScreen';

/** MV8 · Search movies (`/movies/search`), with MV10 when nothing is found. */
export default function SearchMoviesRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = useLeave();
  const off = useCallback(() => router.replace('/'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <MoviesGate onOff={off}>
      <SearchScreen onBack={leave} onOpenMovie={(id) => router.push({ pathname: '/movies/[id]', params: { id } })} />
    </MoviesGate>
  );
}
