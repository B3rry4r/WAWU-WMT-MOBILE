import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { pickedAccountType } from '@/features/auth/accountType';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { knownSignupChannel, signupChannel, startSignup } from '@/features/auth/signupFlow';
import { heldSignup } from '@/features/auth/signupStore';
import { askUsername } from '@/features/auth/identityApi';
import { useCountries } from '@/features/geo/useGeo';

/**
 * A3. Only reachable signed out (the root layout's guard). Continue sends the code (texted by default, mailed when WAWU ID's
 * SIGNUP_VERIFY_CHANNEL is `email`, R-39) and opens A4. The line under the heading names that channel, asked of WAWU ID each time A3 comes into focus.
 * A refused Continue keeps the sign-up already waiting for its code; while one is held, a link goes back to it.
 */
export default function SignUpRoute() {
  const router = useRouter();
  const [held, setHeld] = useState(() => heldSignup() !== null);
  const [channel, setChannel] = useState(knownSignupChannel);
  // The Hub's countries (GEO-03, R-85): the phone field's list and the country of residence. Public, so asked before anyone is signed in.
  const countries = useCountries();
  // Each time A3 comes into focus (a first visit, and a return from A4): the setting can change while the app is open,
  // so A3 names the channel A4 will name. The last answer stays on screen until the new one arrives.
  useFocusEffect(
    useCallback(() => {
      let current = true;
      void signupChannel().then((answer) => {
        if (current) setChannel(answer);
      });
      // Coming back from A4 after Start again: the secret is gone, and so is the link.
      setHeld(heldSignup() !== null);
      return () => {
        current = false;
      };
    }, []),
  );
  return (
    <SignUpScreen
      channel={channel}
      countries={countries.data}
      countriesFailed={countries.isError}
      onRetryCountries={() => void countries.refetch()}
      checkUsername={askUsername}
      onContinue={async (values) => {
        try {
          await startSignup(values, pickedAccountType());
        } catch (error) {
          setHeld(heldSignup() !== null);
          throw error;
        }
        router.push('/phone-code');
      }}
      onOpenTerms={() => router.push('/terms')}
      onOpenPrivacy={() => router.push('/privacy-policy')}
      onEnterSentCode={held ? () => router.push('/phone-code') : undefined}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
