import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { HostScreen } from '@/features/events/host/HostScreen';

/** E13 to E16 and E21 · Host an event (`/events/host`). Signed in only, like the Events list. */
export default function HostRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/events'));
  return <HostScreen onBack={leave} onDiscover={() => router.replace('/events')} onDone={() => router.replace('/events')} />;
}
