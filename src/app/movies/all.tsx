import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { AllMoviesScreen } from '@/features/movies/AllMoviesScreen';
import { MoviesGate } from '@/features/movies/MoviesGate';
import { filterFromParams, useLeave } from '@/features/movies/routes';

/** MV6 · All movies (`/movies/all`), with MV7 as its filter sheet. The sort, genre, language and premiering choices arrive as route parameters. */
export default function AllMoviesRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sort?: string; genre?: string; language?: string; premiering?: string }>();
  const { status } = useSession();
  const leave = useLeave();
  const off = useCallback(() => router.replace('/'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <MoviesGate onOff={off}>
      <AllMoviesScreen
        key={JSON.stringify(params)}
        initial={filterFromParams(params)}
        onBack={leave}
        onSearch={() => router.push('/movies/search')}
        onOpenMovie={(id) => router.push({ pathname: '/movies/[id]', params: { id } })}
      />
    </MoviesGate>
  );
}
