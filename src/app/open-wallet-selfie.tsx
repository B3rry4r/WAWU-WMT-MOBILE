import { useRouter } from 'expo-router';

import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { SelfieScreen } from '@/features/open-wallet/SelfieScreen';

/**
 * A6 · Selfie, with A7 (matched, the account opening) and A16 (no match) as
 * its states: Open your wallet's third step (R-6), pushed on top of A5. Once
 * the account opens, A8 takes the place of every step so far
 * (`useOpenWalletWay().opened`). Signed in only, by the route graph
 * (SHARED-05).
 */
export default function OpenWalletSelfieRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  return <SelfieScreen onBack={() => (router.canGoBack() ? router.back() : way.restart())} onLeave={way.leave} onRestart={way.restart} onOpened={way.opened} />;
}
