import { useLocalSearchParams, useRouter } from 'expo-router';

import { forgotPasswordRequest } from '@/api/identity';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';

/** A23, and A24 once the link is sent. Only reachable signed out (the root layout's guard). */
export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  return (
    <ForgotPasswordScreen
      initialEmail={typeof email === 'string' && email.includes('@') ? email : ''}
      onSend={forgotPasswordRequest}
      onBackToSignIn={() => router.dismissTo('/sign-in')}
    />
  );
}
