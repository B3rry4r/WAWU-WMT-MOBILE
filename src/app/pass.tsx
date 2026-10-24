import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PassScreen } from '@/features/wallet/pass/PassScreen';

/**
 * W44 · Your pass (`/pass`). The Passes card on the Wallet tab (W1) opens it. Signed in only: the route graph does not
 * guard it, so a signed-out visit is sent to the welcome screen here, as the other wallet routes do.
 */
export default function PassRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <PassScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}
