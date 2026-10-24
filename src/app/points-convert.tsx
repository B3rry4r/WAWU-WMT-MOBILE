import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { ConvertScreen } from '@/features/points/ConvertScreen';

/**
 * PT6 · Convert to cash (`/points-convert`), with PT6a and PT6b. Wallet's "To cash" button and PT5's round button open it. Signed in
 * only, as the other wallet routes are. Done goes back to the wallet; Forgot PIN? opens W37 and no PIN yet opens A9.
 */
export default function PointsConvertRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <ConvertScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/wallet'))}
      onDone={() => router.dismissTo('/wallet')}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onBuy={() => router.push('/points-buy')}
    />
  );
}
