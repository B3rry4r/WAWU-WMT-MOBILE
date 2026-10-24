import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { WithdrawScreen } from '@/features/capital/WithdrawScreen';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';

/** Withdraw from a Capital investment, with the PIN sheet over it (`/capital/withdraw?id=`). */
export default function CapitalWithdrawRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/capital" />;
  return (
    <WithdrawScreen
      orderId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/capital'))}
      onDone={() => router.dismissTo('/capital')}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
