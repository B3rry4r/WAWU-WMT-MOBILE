import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useRefetchTiersOnFocus } from '@/features/events/useRefetchTiersOnFocus';
import { EventDetailScreen } from '@/features/events/EventDetailScreen';

/** E2 · Event, and E9 when every ticket has sold (`/events/<id>`). Signed in only, like the Events list. */
export default function EventRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  useRefetchTiersOnFocus(String(id));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <EventDetailScreen id={String(id)} onBack={() => (router.canGoBack() ? router.back() : router.replace('/events'))} />;
}
