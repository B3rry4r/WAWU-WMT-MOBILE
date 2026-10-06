import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { SelfieScreen } from '@/features/open-wallet/SelfieScreen';

/**
 * A6 · Selfie, with A7 (matched, the account opening) and A16 (no match) as
 * its states: Open your wallet's third step (R-6), pushed on top of A5. Once
 * the account opens, A8 takes the place of every step so far
 * (`useOpenWalletWay().opened`). Signed out, the visitor goes where the app
 * opens for them.
 */
export default function OpenWalletSelfieRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <SelfieScreen onBack={() => (router.canGoBack() ? router.back() : way.restart())} onLeave={way.leave} onRestart={way.restart} onOpened={way.opened} />;
}
