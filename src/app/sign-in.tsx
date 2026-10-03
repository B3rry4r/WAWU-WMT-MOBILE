import { useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { clearAccountType } from '@/features/auth/accountType';
import { SignInScreen } from '@/features/auth/SignInScreen';

/** A22 and A25. Only reachable signed out (the root layout's guard). A sign-in that succeeds forgets any A2 pick. */
export default function SignInRoute() {
  const router = useRouter();
  const { signIn } = useSession();
  return (
    <SignInScreen
      onSignIn={async (identifier, password) => {
        await signIn(identifier, password);
        clearAccountType();
      }}
      onForgot={(email) => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })}
      onCreateAccount={() => router.push('/account-type')}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
