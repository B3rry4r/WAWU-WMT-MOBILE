import { useRouter } from 'expo-router';

import { WelcomeScreen } from '@/features/auth/WelcomeScreen';

/** A1. Where the app opens for a signed-out user (the root layout's guard); only reachable signed out. */
export default function WelcomeRoute() {
  const router = useRouter();
  return <WelcomeScreen onCreateAccount={() => router.push('/account-type')} onSignIn={() => router.push('/sign-in')} />;
}
