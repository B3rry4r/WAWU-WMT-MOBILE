import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { TicketScreen } from '@/features/events/TicketScreen';
import { heldTicketKey } from '@/features/events/ticketsApi';
import { useRefetchOnFocus } from '@/features/events/useRefetchOnFocus';

/** E7 · Ticket QR, and E12 once it has been scanned (`/events/tickets/<id>`). Signed in only. */
export default function TicketRoute() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { status } = useSession();
  useRefetchOnFocus(heldTicketKey(String(ticketId)));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <TicketScreen
      id={String(ticketId)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/events/tickets'))}
      onOpenTicket={(next) => router.replace({ pathname: '/events/tickets/[ticketId]', params: { ticketId: next } })}
    />
  );
}
