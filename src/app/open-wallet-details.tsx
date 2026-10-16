import { useRouter } from 'expo-router';

import { ConfirmDetailsScreen } from '@/features/open-wallet/ConfirmDetailsScreen';
import { OPEN_WALLET_SELFIE_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';

/**
 * A5 · Confirm your details, step two of Open your wallet (R-6), pushed on
 * top of A26 when a BVN check passes. Signed in only, by the route graph
 * (SHARED-05).
 */
export default function OpenWalletDetailsRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  return (
    <ConfirmDetailsScreen
      onBack={() => (router.canGoBack() ? router.back() : way.restart())}
      onContinue={() => router.push(OPEN_WALLET_SELFIE_PATH)}
      onRestart={way.restart}
      onLeave={way.leave}
    />
  );
}
