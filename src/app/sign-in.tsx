import { useRouter } from 'expo-router';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { clearAccountType } from '@/features/auth/accountType';
import { resumeSignup } from '@/features/auth/signupFlow';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { takeClaimVisit } from '@/features/claim/signInReturn';

/** WAWU ID's codes for a password that was right on an account whose phone or email was never confirmed. */
const UNCONFIRMED_CODES = ['PHONE_NOT_CONFIRMED', 'EMAIL_NOT_VERIFIED'];

/**
 * A22 and A25. Only reachable signed out (the root layout's guard). A sign-in that succeeds forgets any A2 pick.
 * A sign-in refused as "not confirmed" while this phone still holds a sign-up waiting for its code opens
 * that code screen instead (SHARED-CHANGES AUTH-05 F1). A sign-in that was asked for by the access code screen goes
 * back to it (SHARED-CHANGES JOIN-03 #10).
 */
export default function SignInRoute() {
  const router = useRouter();
  const { signIn } = useSession();
  return (
    <SignInScreen
      onSignIn={async (identifier, password) => {
        try {
          await signIn(identifier, password);
        } catch (error) {
          if (isApiError(error) && error.code && UNCONFIRMED_CODES.includes(error.code) && (await resumeSignup()) === 'phone') {
            router.push('/phone-code');
            return;
          }
          throw error;
        }
        clearAccountType();
        // A signed-out visit to the claim screen sent this person here: back to it (JOIN-03 round 3, N14).
        if (takeClaimVisit()) router.replace('/claim-code');
      }}
      onForgot={(email) => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })}
      onCreateAccount={() => router.push('/account-type')}
      // Opened cold (a link, a reload) there is no screen behind: back goes to the welcome screen, so the arrow is always there (A22, CHECK-3 L-8).
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
    />
  );
}
