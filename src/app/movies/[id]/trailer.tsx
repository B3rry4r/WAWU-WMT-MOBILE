import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { MoviesGate } from '@/features/movies/MoviesGate';
import { useLeave } from '@/features/movies/routes';
import { TrailerScreen } from '@/features/movies/TrailerScreen';

/** MV3 · Trailer (`/movies/<id>/trailer`): a file trailer plays here, a YouTube one opens outside the app. */
export default function TrailerRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  const leave = useLeave();
  const off = useCallback(() => router.replace('/'), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <MoviesGate onOff={off}>
      <TrailerScreen movieId={String(id)} onClose={leave} onOpenTerms={() => router.push('/terms')} onOpenPrivacy={() => router.push('/privacy-policy')} />
    </MoviesGate>
  );
}
