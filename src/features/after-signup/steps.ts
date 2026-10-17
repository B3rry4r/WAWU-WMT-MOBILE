import { isApiError } from '@/api/errors';
import { signupCompleteStepRequest, type SignupProgressStep } from '@/api/identity';
import { authed } from '@/features/auth/signupApi';
import { refreshSignupGate, setSignupProgress } from '@/features/auth/signupGate';

/**
 * Finishes the sign-up step the person is on (A11 Later, A12 Continue, A13 Go to Home). WAWU ID answers what comes next and
 * the root layout opens it. A 409 means the app was behind (another phone finished the step): read where the sequence stands.
 */
export async function finishStep(step: Exclude<SignupProgressStep, 'email'>): Promise<void> {
  try {
    setSignupProgress(await authed((token) => signupCompleteStepRequest(token, step)));
  } catch (error) {
    if (isApiError(error) && error.status === 409) {
      await refreshSignupGate();
      return;
    }
    throw error;
  }
}
