import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { pickedAccountType } from '@/features/auth/accountType';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { knownSignupChannel, signupChannel, startSignup } from '@/features/auth/signupFlow';
import { heldSignup } from '@/features/auth/signupStore';

/**
 * A3. Only reachable signed out (the root layout's guard). Continue sends the code (texted by default, mailed when WAWU ID's
 * SIGNUP_VERIFY_CHANNEL is `email`, R-39) and opens A4. The line under the heading names that channel, asked of WAWU ID on arrival.
 * A refused Continue keeps the sign-up already waiting for its code; while one is held, a link goes back to it.
 */
export default function SignUpRoute() {
  const router = useRouter();
  const [held, setHeld] = useState(() => heldSignup() !== null);
  const [channel, setChannel] = useState(knownSignupChannel);
  useEffect(() => {
    let current = true;
    void signupChannel().then((answer) => {
      if (current) setChannel(answer);
    });
    return () => {
      current = false;
    };
  }, []);
  // Coming back from A4 after Start again: the secret is gone, and so is the link.
  useFocusEffect(
    useCallback(() => {
      setHeld(heldSignup() !== null);
    }, []),
  );
  return (
    <SignUpScreen
      channel={channel}
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
