import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { isEventId } from '@/features/events/door/doorApi';
import { DashboardScreen } from '@/features/events/organiser/DashboardScreen';

/**
 * E18 · Organiser dashboard, and E25 over it (`/events/dashboard/<event id>`). Signed in only. The Hub decides whose event it is:
 * a person who does not host it is told so.
 */
export default function DashboardRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!isEventId(String(id))) return <Redirect href="/events/mine" />;

  const eventId = String(id);
  return (
    <DashboardScreen
      id={eventId}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/events/mine'))}
      onDoor={() => router.push({ pathname: '/events/door/[id]', params: { id: eventId } })}
      onTickets={() => router.push({ pathname: '/events/ticket-types/[id]', params: { id: eventId } })}
      onLinks={() => router.push({ pathname: '/events/links/[id]', params: { id: eventId } })}
      onEdit={() => router.push({ pathname: '/events/edit/[id]', params: { id: eventId } })}
      onCalledOff={() => router.replace('/events/mine')}
    />
  );
}
