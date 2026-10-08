import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { EventsScreen } from '@/features/events/EventsScreen';

/**
 * E1 · Events (`/events`). Signed in only: the calendar is read with the
 * person's token, and a row's Going flag is theirs. The route graph does not
 * list it under the signed-in guard (no `_layout.tsx` edit belongs to this
 * task), so a signed-out visit is sent to the welcome screen here, as
 * `/edit-profile` does.
 */
export default function EventsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <EventsScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onOpenEvent={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
    />
  );
}
