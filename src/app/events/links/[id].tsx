import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { isEventId } from '@/features/events/door/doorApi';
import { SharedLinksScreen } from '@/features/events/organiser/SharedLinksScreen';

/** Shared links (`/events/links/<event id>`): opened from the organiser dashboard (E18). Signed in only. */
export default function SharedLinksRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!isEventId(String(id))) return <Redirect href="/events/mine" />;

  return <SharedLinksScreen id={String(id)} onBack={() => (router.canGoBack() ? router.back() : router.replace('/events/mine'))} />;
}
