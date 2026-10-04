import { useRouter } from 'expo-router';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { clearAccountType } from '@/features/auth/accountType';
import { resumeSignup } from '@/features/auth/signupFlow';
import { SignInScreen } from '@/features/auth/SignInScreen';

/** WAWU ID's codes for a password that was right on an account whose phone or email was never confirmed. */
const UNCONFIRMED_CODES = ['PHONE_NOT_CONFIRMED', 'EMAIL_NOT_VERIFIED'];

/**
 * A22 and A25. Only reachable signed out (the root layout's guard). A sign-in that succeeds forgets any A2 pick.
 * A sign-in refused as "not confirmed" while this phone still holds a sign-up waiting for its code opens
 * that code screen instead (SHARED-CHANGES AUTH-05 F1).
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
      }}
      onForgot={(email) => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })}
      onCreateAccount={() => router.push('/account-type')}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
