import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import { WithdrawScreen } from '@/features/withdraw/WithdrawScreen';

/**
 * W17 · Withdraw (`/withdraw`), with W11's PIN sheet over it. Signed in only. A taken withdrawal replaces this screen with W19, so
 * Back from there never lands on a finished form; one the bank did not take goes to W14. Change opens A21, the payout account.
 */
export default function WithdrawRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <WithdrawScreen
      onBack={leave}
      onChangeDestination={() => router.push('/payout-account')}
      onStarted={(id) => router.replace({ pathname: '/withdraw/receipt', params: { id } })}
      onFailed={(id) => router.replace({ pathname: '/withdraw/failed', params: { id } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
