import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/api/session';
import { useBonusGate } from '@/features/verify/bonusGate';
import { BonusGateView } from '@/features/verify/BonusGate';
import { finishBonusStep, settleBonusStep } from '@/features/verify/bonusStep';
import { BonusScreen } from '@/features/verify/BonusScreen';

/**
 * VF1 · Your bonus is waiting (`/verify-bonus`), shown once right after sign-up (SHARED-CHANGES VERIFY-01 #1, #2). "Build my shop"
 * opens VF2 (`/shop`). A drafts shop is for creator accounts (the Hub refuses the rest), so a person the Hub knows to be someone
 * else is sent Home. Signed in only: the route graph guards it (a signed-out visit never draws it), and a signed-out visit that
 * reaches it is sent to the welcome screen here too.
 *
 * The step comes once, so only an answer ends it: a known non-creator ends it here, "Build my shop" ends it there. While the Hub does
 * not know the account type yet (a new account's profile is written a moment after sign-up) or the read fails, VF1 stays: its loading
 * state, asking again, or a note with "Try again" (`bonusGate.ts`).
 */
export default function VerifyBonusRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { gate, error, retry } = useBonusGate(status === 'signedIn');
  useEffect(() => {
    // Drawn once is enough: closing the app on this screen never brings it back (`bonusStep.ts`).
    if (gate === 'creator') settleBonusStep();
    // Someone with no shop to build has nothing to see here, so the step ends for them and they go Home.
    if (gate === 'other') finishBonusStep();
  }, [gate]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate === 'other') return <Redirect href="/" />;
  if (gate === 'checking') return <BonusGateView state="loading" onRetry={retry} />;
  if (gate === 'waiting' || gate === 'error') return <BonusGateView state={gate} error={error} onRetry={retry} />;

  return (
    <BonusScreen
      onBuild={() => {
        finishBonusStep();
        router.replace('/shop');
      }}
    />
  );
}
