import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { clearAccountType } from '@/features/auth/accountType';
import { WelcomeScreen } from '@/features/auth/WelcomeScreen';

/**
 * A1. Where the app opens for a signed-out user (the root layout's guard); only
 * reachable signed out. It mounts once per signed-out visit (at cold start and after
 * every sign-out) and stays mounted under A2 and A22, so a pick made in an earlier
 * visit is forgotten here while Back and return within this visit keep it.
 */
export default function WelcomeRoute() {
  const router = useRouter();
  useEffect(() => clearAccountType(), []);
  return <WelcomeScreen onCreateAccount={() => router.push('/account-type')} onSignIn={() => router.push('/sign-in')} />;
}
