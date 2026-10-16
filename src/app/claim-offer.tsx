import { useRouter } from 'expo-router';

import { ClaimOfferScreen } from '@/features/claim/ClaimOfferScreen';
import { finishOfferStep } from '@/features/claim/offerStep';

/**
 * "Have an access code?" (JOIN-03 round 2, SHARED-CHANGES JOIN-03 #4): shown once, right after sign-up, by the root
 * layout's guard (`claim-offer`). Skip ends it and the app opens; Enter code ends it and opens the claim screen, whose
 * Back and Done both land on Home. It never blocks anything: the guard drops it as soon as either is pressed.
 */
export default function ClaimOfferRoute() {
  const router = useRouter();
  return (
    <ClaimOfferScreen
      onSkip={finishOfferStep}
      onEnter={() => {
        finishOfferStep();
        router.push('/claim-code');
      }}
    />
  );
}
