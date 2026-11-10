import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { pickedAccountType } from '@/features/auth/accountType';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { knownSignupChannel, signupChannel, startSignup } from '@/features/auth/signupFlow';
import { readSignupDraft, saveSignupDraft } from '@/features/auth/signupDraft';
import { heldSignup, loadSignup } from '@/features/auth/signupStore';
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
  // WEBAPP-08 F5: after a refresh the module's memory is empty but the tab still holds the waiting sign-up (session storage): the link to its code comes back, and so does what was typed (never the password).
  const phoneCountry = useRef<string | undefined>(undefined);
  const [draft] = useState(() => readSignupDraft());

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
      if (Platform.OS === 'web' && heldSignup() === null) {
        void loadSignup().then((found) => {
          if (current) setHeld(found !== null);
        });
      }
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
      initial={draft}
      onPhoneCountry={(code) => {
        phoneCountry.current = code;
      }}
      onContinue={async (values) => {
        saveSignupDraft({ ...values, phoneCountry: phoneCountry.current });
        try {
          await startSignup(values, pickedAccountType());
        } catch (error) {
          setHeld(heldSignup() !== null);
          throw error;
        }
        router.push('/phone-code');
      }}
      onOpenLegal={() => router.push('/legal-documents')}
      onEnterSentCode={held ? () => router.push('/phone-code') : undefined}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
