import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { BuyScreen } from '@/features/points/BuyScreen';

/**
 * PT4 · Buy points (`/points-buy`), with PT4b (paying) and PT4c (points added). Wallet's Buy points button, PT5's and PT6's open it.
 * Signed in only, as the other wallet routes are. Done goes back to where it was opened from; Forgot PIN? opens W37 and no PIN yet
 * opens A9.
 */
export default function PointsBuyRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  return <BuyScreen onBack={leave} onDone={leave} onForgotPin={() => router.push('/reset-pin')} onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)} />;
}
