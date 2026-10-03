import { useRouter } from 'expo-router';

import { pickedAccountType } from '@/features/auth/accountType';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { startSignup } from '@/features/auth/signupFlow';

/** A3. Only reachable signed out (the root layout's guard). Continue texts the code and opens A4. */
export default function SignUpRoute() {
  const router = useRouter();
  return (
    <SignUpScreen
      onContinue={async (values) => {
        await startSignup(values, pickedAccountType());
        router.push('/phone-code');
      }}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
