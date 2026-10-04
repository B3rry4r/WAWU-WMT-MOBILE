import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { clearAccountType } from '@/features/auth/accountType';
import { resumeSignup } from '@/features/auth/signupFlow';
import { WelcomeScreen } from '@/features/auth/WelcomeScreen';

/**
 * A1. Where the app opens for a signed-out user (the root layout's guard); only
 * reachable signed out. It mounts once per signed-out visit (at cold start and after
 * every sign-out) and stays mounted under A2 and A22, so a pick made in an earlier
 * visit is forgotten here while Back and return within this visit keep it.
 * A sign-up left waiting for its code is picked up here: if WAWU ID still holds
 * it, A4 opens with the time left on its code (SHARED-CHANGES AUTH-05 F1).
 */
export default function WelcomeRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  useEffect(() => clearAccountType(), []);
  useEffect(() => {
    let alive = true;
    void resumeSignup().then((step) => {
      if (alive && step === 'phone' && navigation.isFocused()) router.push('/phone-code');
    });
    return () => {
      alive = false;
    };
  }, [navigation, router]);
  return <WelcomeScreen onCreateAccount={() => router.push('/account-type')} onSignIn={() => router.push('/sign-in')} />;
}
