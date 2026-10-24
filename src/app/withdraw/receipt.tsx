import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { WithdrawReceiptScreen } from '@/features/withdraw/WithdrawReceiptScreen';

/** W19 · Withdraw · on its way (`/withdraw/receipt?id=`). Done, and Android's back button, return to the Wallet tab with the new row on top. */
export default function WithdrawReceiptRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const done = () => router.dismissTo('/wallet');
  useSystemBack(done);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/wallet" />;
  return <WithdrawReceiptScreen id={id} onDone={done} onFailed={(failedId) => router.replace({ pathname: '/withdraw/failed', params: { id: failedId } })} />;
}
