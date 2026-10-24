import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OrderTicketScreen } from '@/features/events/OrderTicketScreen';

/**
 * E5 · Ticket, after paying (`/events/orders/<orderId>`): the buy flow replaces the event page with this one, so Back from here never
 * lands on a Get tickets button for tickets already bought. Signed in only, like the rest of Events.
 */
export default function OrderTicketRoute() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <OrderTicketScreen
      orderId={String(orderId)}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/events'))}
      onMyTickets={() => router.replace('/events/tickets')}
    />
  );
}
