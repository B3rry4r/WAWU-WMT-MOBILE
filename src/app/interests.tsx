import { queryClient } from '@/api/query';
import { interestsKey, saveInterests } from '@/features/after-signup/api';
import { InterestsScreen } from '@/features/after-signup/InterestsScreen';
import { finishStep } from '@/features/after-signup/steps';
import { closeInterests, stepLabel, useSignupGate } from '@/features/auth/signupGate';

/**
 * A12 · What are you into? (`/interests`). The step after sign-up for a person who came to discover. Continue saves the picks on the Hub,
 * then finishes the step; WAWU ID answers that A13 is next and the route graph opens it, so nothing here navigates. Reopened from A13's
 * Back it has a Back of its own, and Continue only saves the new picks.
 */
export default function InterestsRoute() {
  const gate = useSignupGate();
  return (
    <InterestsScreen
      step={stepLabel(gate.progress, 'interests')}
      onBack={gate.reopened ? closeInterests : undefined}
      onContinue={async (picks) => {
        queryClient.setQueryData(interestsKey, await saveInterests(picks));
        // Reopened from A13: WAWU ID already has this step done, so the new picks are all that is left to do.
        if (gate.reopened) closeInterests();
        else await finishStep('interests');
      }}
    />
  );
}
