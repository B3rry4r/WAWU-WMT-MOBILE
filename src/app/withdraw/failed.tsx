import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { FailedScreen } from '@/features/send/FailedScreen';

/**
 * W14 · a withdrawal the bank did not take (`/withdraw/failed?id=`): the same screen a failed send uses, which says what came back from
 * the Hub's own record (the money back, a charge kept as its own row, or where to look when nothing is recorded yet). Done, and Android's
 * back button, return to the Wallet tab. Try again starts a new withdrawal from W17 (a new quote and a new key, never the failed one again).
 */
export default function WithdrawFailedRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const done = () => router.dismissTo('/wallet');
  useSystemBack(done);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/wallet" />;
  return (
    <FailedScreen
      id={id}
      onDone={done}
      onReceipt={(transferId) => router.replace({ pathname: '/withdraw/receipt', params: { id: transferId } })}
      onTryAgain={() => router.replace('/withdraw')}
    />
  );
}
