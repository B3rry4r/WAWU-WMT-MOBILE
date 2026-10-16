import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { DetailScreen } from '@/features/wallet/history/DetailScreen';

/**
 * W27 · Transaction detail (`/transactions/<id>`), the receipt of one movement. Opened from a row on the Wallet tab or on the
 * history. Signed in only, like the history. Back goes to where it was opened from, or to the history when it was opened on its
 * own; Android's back button does the same.
 */
export default function TransactionRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/transactions'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/transactions" />;

  return <DetailScreen id={id} onBack={leave} />;
}
