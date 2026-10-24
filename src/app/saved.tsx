import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { SavedScreen } from '@/features/saved/SavedScreen';

/** M30 · Saved (`/saved`), opened from the Me menu (M7). A saved event opens E2 and a saved piece its own page (`/content/<id>`); Back returns here. Signed in only: anyone else is sent to Welcome. */
export default function SavedRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <SavedScreen
      onBack={leave}
      onOpenEvent={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
      onOpenContent={(id) => router.push({ pathname: '/content/[id]', params: { id } })}
      onOpenCourse={(id) => router.push({ pathname: '/schools/courses/[id]', params: { id } })}
    />
  );
}
