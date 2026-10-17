import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { MyEventsScreen } from '@/features/events/organiser/MyEventsScreen';

/**
 * E17 · My events (`/events/mine`): the host's own events at every status. Signed in only, like the Events list. A live event
 * opens its dashboard (E18), a sent-back one opens E22.
 */
export default function MyEventsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <MyEventsScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/events'))}
      onDiscover={() => router.replace('/events')}
      onHost={() => router.replace('/events/host')}
      onOpenLive={(id) => router.push({ pathname: '/events/dashboard/[id]', params: { id } })}
      onOpenSentBack={(id) => router.push({ pathname: '/events/sent-back/[id]', params: { id } })}
    />
  );
}
