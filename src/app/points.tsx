import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PointsScreen } from '@/features/points/PointsScreen';

/**
 * PT5 · Your points (`/points`). Signed in only: the route graph does not guard it, so a signed-out visit is sent to the welcome
 * screen here, as the other wallet routes do. The round button on its bar opens PT6. The Points card on Wallet (W1) that opens
 * this screen is DV2-02's.
 */
export default function PointsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <PointsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/wallet'))} onConvert={() => router.push('/points-convert')} />;
}
