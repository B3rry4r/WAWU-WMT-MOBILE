import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { BuyScreen } from '@/features/points/BuyScreen';

/**
 * PT4 · Buy points (`/points-buy`), with PT4c (points added). Points are bought in the store sheet (R-86). Wallet's Buy points button, PT5's and
 * PT6's open it. Signed in only, as the other wallet routes are. Done goes back to where it was opened from (PT4c says "Back to AI tools"
 * when Studio, PT1, opened it: `?from=studio`).
 */
export default function PointsBuyRoute() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  return <BuyScreen onBack={leave} onDone={leave} doneLabel={from === 'studio' ? 'Back to AI tools' : undefined} />;
}
