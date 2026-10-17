import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { HistoryScreen } from '@/features/wallet/history/HistoryScreen';

/**
 * W26 · Transaction history (`/transactions`), with W28 as its empty state. Opened from the Wallet tab's See all. With `?group=<key>`
 * it lists the movements a grouped row stands for, opened from that row. Signed in only: the route graph does not guard it
 * (the same as the other wallet routes), so a signed-out visit is sent to the welcome screen here. Back goes to where it was
 * opened from, or to the Wallet tab when it was opened on its own; Android's back button does the same.
 */
export default function TransactionsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { group } = useLocalSearchParams<{ group?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <HistoryScreen
      group={typeof group === 'string' && group !== '' ? group : undefined}
      onBack={leave}
      onOpenTransaction={(id) => router.push({ pathname: '/transactions/[id]', params: { id } })}
      onOpenGroup={(key) => router.push({ pathname: '/transactions', params: { group: key } })}
    />
  );
}
