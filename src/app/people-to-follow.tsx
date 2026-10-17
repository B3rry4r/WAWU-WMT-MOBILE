import { useRouter } from 'expo-router';

import { finishStep } from '@/features/after-signup/steps';
import { FollowScreen } from '@/features/after-signup/FollowScreen';
import { stepLabel, useSignupGate } from '@/features/auth/signupGate';

/** A13 · People to follow (`/people-to-follow`). The last step after sign-up for a person who came to discover; Go to Home finishes it. */
export default function PeopleToFollowRoute() {
  const router = useRouter();
  const gate = useSignupGate();
  return (
    <FollowScreen
      step={stepLabel(gate.progress, 'follows')}
      onDone={async () => {
        await finishStep('follows');
        router.replace('/');
      }}
    />
  );
}
