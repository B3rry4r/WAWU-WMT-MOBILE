import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { finishBonusStep, settleBonusStep } from '@/features/verify/bonusStep';
import { BonusScreen } from '@/features/verify/BonusScreen';

/**
 * VF1 · Your bonus is waiting (`/verify-bonus`), shown once right after sign-up (SHARED-CHANGES VERIFY-01 #1, #2). "Build my shop"
 * opens VF2 (`/shop`). A drafts shop is for creator accounts (the Hub refuses the rest), so anyone else who opens it is sent Home.
 * Signed in only: the route graph guards it (a signed-out visit never draws it), and a signed-out visit that reaches it is sent to the welcome screen here too.
 */
export default function VerifyBonusRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const ready = status === 'signedIn' && gate === 'creator';
  // Drawn once is enough: closing the app on this screen never brings it back (`bonusStep.ts`). A person with no shop to build (an
  // account that is not a creator's) has nothing to see here, so the step ends for them and they go Home.
  const other = status === 'signedIn' && gate === 'other';
  useEffect(() => {
    if (ready) settleBonusStep();
    if (other) finishBonusStep();
  }, [ready, other]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <BonusScreen
      onBuild={() => {
        finishBonusStep();
        router.replace('/shop');
      }}
    />
  );
}
