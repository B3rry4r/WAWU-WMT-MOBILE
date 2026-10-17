import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { addMoneyHref } from '@/features/addmoney/entry';
import { useRefetchTiersOnFocus } from '@/features/events/useRefetchTiersOnFocus';
import { EventDetailScreen } from '@/features/events/EventDetailScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';

/**
 * E2 · Event, and E9 when every ticket has sold (`/events/<id>`), with E3 (pay), E4 (PIN) and E10 (still confirming) over and in it.
 * Signed in only, like the Events list. Paying leads to Open your wallet (no wallet yet, R-6), A9 (no PIN yet), Add money (W15, with what was
 * missing) and, once the tickets are issued, E5, which takes this page's place so Back never returns to a Get tickets button.
 */
export default function EventRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  useRefetchTiersOnFocus(String(id));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <EventDetailScreen
      id={String(id)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/events'))}
      buy={{
        onOpenOrder: (orderId) => router.replace({ pathname: '/events/orders/[orderId]', params: { orderId } }),
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: (short) => router.push(addMoneyHref(short)),
      }}
    />
  );
}
