import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PointsScreen } from '@/features/points/PointsScreen';

/**
 * PT5 · Your points (`/points`). Signed in only: the route graph does not guard it, so a signed-out visit is sent to the welcome
 * screen here, as the other wallet routes do. Buy points opens PT4. There is no way to cash from here (R-103). The Points card on
 * Wallet (W1) opens this screen.
 */
export default function PointsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <PointsScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/wallet'))}
      onBuy={() => router.push('/points-buy')}
    />
  );
}
