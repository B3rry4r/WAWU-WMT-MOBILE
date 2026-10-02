import { useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { SignInScreen } from '@/features/auth/SignInScreen';

/** A22 and A25. Only reachable signed out (the root layout's guard). */
export default function SignInRoute() {
  const router = useRouter();
  const { signIn } = useSession();
  return (
    <SignInScreen
      onSignIn={signIn}
      onForgot={(email) => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })}
      onCreateAccount={() => router.push('/account-type')}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
