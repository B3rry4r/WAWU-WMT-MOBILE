import { useRouter } from 'expo-router';

import { ConfirmDetailsScreen } from '@/features/open-wallet/ConfirmDetailsScreen';
import { OPEN_WALLET_ID_PATH, OPEN_WALLET_SELFIE_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';

/**
 * A5 · Confirm your details, step two of Open your wallet (R-6), pushed on
 * top of A31 when a BVN check passes (or, under the review opening, when the
 * numbers are held: the person types their name here, and A26 follows, with
 * no selfie before it). Signed in only, by the route graph (SHARED-05).
 */
export default function OpenWalletDetailsRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  return (
    <ConfirmDetailsScreen
      onBack={() => (router.canGoBack() ? router.back() : way.restart())}
      onContinue={() => router.push(OPEN_WALLET_SELFIE_PATH)}
      onReviewContinue={() => router.push(OPEN_WALLET_ID_PATH)}
      onRestart={way.restart}
      onLeave={way.leave}
    />
  );
}
