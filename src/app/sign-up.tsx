import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { pickedAccountType } from '@/features/auth/accountType';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { startSignup } from '@/features/auth/signupFlow';
import { heldSignup } from '@/features/auth/signupStore';

/**
 * A3. Only reachable signed out (the root layout's guard). Continue sends the code (mailed by default, R-39) and opens A4.
 * A refused Continue keeps the sign-up already waiting for its code; while one is held, a link goes back to it.
 */
export default function SignUpRoute() {
  const router = useRouter();
  const [held, setHeld] = useState(() => heldSignup() !== null);
  // Coming back from A4 after Start again: the secret is gone, and so is the link.
  useFocusEffect(
    useCallback(() => {
      setHeld(heldSignup() !== null);
    }, []),
  );
  return (
    <SignUpScreen
      onContinue={async (values) => {
        try {
          await startSignup(values, pickedAccountType());
        } catch (error) {
          setHeld(heldSignup() !== null);
          throw error;
        }
        router.push('/phone-code');
      }}
      onEnterSentCode={held ? () => router.push('/phone-code') : undefined}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
