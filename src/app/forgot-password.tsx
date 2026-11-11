import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { forgotPasswordRequest, resetPasswordWithCodeRequest } from '@/api/identity';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { ResetByCodeFlow } from '@/features/auth/ResetByCodeFlow';

/**
 * A23, and A24 once the link is sent; or, for a person who asked for a code to their phone instead (APP-RESET, R-133 point 4), the
 * code boxes, the new password and "Password changed". Only reachable signed out (the root layout's guard).
 */
export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  /** The email or number a code was asked for; null while the form is showing. */
  const [codeFor, setCodeFor] = useState<string | null>(null);

  if (codeFor !== null) {
    return (
      <ResetByCodeFlow
        identifier={codeFor}
        onResend={async () => {
          await forgotPasswordRequest(codeFor, 'sms');
        }}
        onSave={(code, password) => resetPasswordWithCodeRequest(codeFor, code, password)}
        onBack={() => setCodeFor(null)}
        onSignIn={() => router.replace({ pathname: '/sign-in', params: codeFor.includes('@') ? { email: codeFor } : {} })}
      />
    );
  }
  return (
    <ForgotPasswordScreen
      initialEmail={typeof email === 'string' && email.includes('@') ? email : ''}
      onSend={(address) => forgotPasswordRequest(address)}
      onSendCode={async (identifier) => {
        await forgotPasswordRequest(identifier, 'sms');
      }}
      onCodeSent={setCodeFor}
      onBackToSignIn={() => router.dismissTo('/sign-in')}
    />
  );
}
