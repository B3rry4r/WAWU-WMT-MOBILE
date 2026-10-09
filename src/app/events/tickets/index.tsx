import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { MyTicketsScreen } from '@/features/events/MyTicketsScreen';
import { heldRootKey } from '@/features/events/ticketsApi';
import { useRefetchOnFocus } from '@/features/events/useRefetchOnFocus';

/** E6 · My tickets (`/events/tickets`). Signed in only, like the rest of Events. */
export default function MyTicketsRoute() {
  const router = useRouter();
  const { status } = useSession();
  useRefetchOnFocus(heldRootKey);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <MyTicketsScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/events'))}
      onOpenTicket={(ticketId) => router.push({ pathname: '/events/tickets/[ticketId]', params: { ticketId } })}
    />
  );
}
