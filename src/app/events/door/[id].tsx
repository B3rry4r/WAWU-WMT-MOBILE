import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { DoorScreen } from '@/features/events/door/DoorScreen';

/**
 * E19 to E24 · At the door (`/events/door/<event id>`). Signed in only. The organiser's dashboard (EVENTS-08, E18)
 * opens it with the event's id; the Hub decides who may scan, so a person who is not the organiser or door staff
 * is told so at their first scan.
 */
export default function DoorRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <DoorScreen eventId={String(id)} onClose={() => (router.canGoBack() ? router.back() : router.replace('/events'))} />;
}
