import { queryClient } from '@/api/query';
import { interestsKey, saveInterests } from '@/features/after-signup/api';
import { InterestsScreen } from '@/features/after-signup/InterestsScreen';
import { finishStep } from '@/features/after-signup/steps';
import { stepLabel, useSignupGate } from '@/features/auth/signupGate';

/**
 * A12 · What are you into? (`/interests`). The step after sign-up for a person who came to discover. Continue saves the picks on the Hub,
 * then finishes the step; WAWU ID answers that A13 is next and the route graph opens it, so nothing here navigates.
 */
export default function InterestsRoute() {
  const gate = useSignupGate();
  return (
    <InterestsScreen
      step={stepLabel(gate.progress, 'interests')}
      onContinue={async (picks) => {
        queryClient.setQueryData(interestsKey, await saveInterests(picks));
        await finishStep('interests');
      }}
    />
  );
}
