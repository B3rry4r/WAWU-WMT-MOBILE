import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ConfirmDetailsScreen } from '@/features/open-wallet/ConfirmDetailsScreen';
import { OPEN_WALLET_SELFIE_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';

/**
 * A5 · Confirm your details, step two of Open your wallet (R-6), pushed on
 * top of A26 when a BVN check passes. Signed out there is nothing to confirm,
 * so the visitor goes where the app opens for them.
 */
export default function OpenWalletDetailsRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <ConfirmDetailsScreen
      onBack={() => (router.canGoBack() ? router.back() : way.restart())}
      onContinue={() => router.push(OPEN_WALLET_SELFIE_PATH)}
      onRestart={way.restart}
      onLeave={way.leave}
    />
  );
}
