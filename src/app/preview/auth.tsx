import { useLocalSearchParams, useRouter } from 'expo-router';

import { ApiError } from '@/api/errors';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

/*
 * Development-only harness for the signed-out screens (task AUTH-01), used to
 * screenshot each artboard at 390 px. Release builds redirect home. The real
 * screens run against the real servers at /sign-in and /forgot-password; this
 * route answers in their place, so a state can be shown without a server.
 *
 *   screen=sign-in | forgot | sent        A22 and A25, A23, A24 (default sign-in)
 *   email=<text>                          what the Email field holds
 *   password=<text>                       what the Password field holds (sign-in)
 *   answer=wrong | unconfirmed | offline | busy | server | hold | ok
 *                                         what the server answers when Sign in or
 *                                         Send reset link is pressed (hold never answers)
 *   expires=<seconds>                     the link lifetime the server reports on A24
 *                                         (leave out for a server that sends none)
 */

type Params = { screen?: string; email?: string; password?: string; answer?: string; expires?: string };

const never = <T,>() => new Promise<T>(() => undefined);

function refusal(answer: string | undefined): ApiError | null {
  switch (answer) {
    case 'wrong':
      return new ApiError('unauthorized', 401, 'Invalid credentials');
    case 'unconfirmed':
      return new ApiError('forbidden', 403, 'Verify your email address before signing in.', 'EMAIL_NOT_VERIFIED');
    case 'offline':
      return new ApiError('network', 0, 'No connection.');
    case 'busy':
      return new ApiError('rate_limited', 429, 'Too many requests');
    case 'server':
      return new ApiError('server', 500, 'Internal server error');
    default:
      return null;
  }
}

export default function AuthPreviewRoute() {
  const p = useLocalSearchParams<Params>();
  const router = useRouter();
  if (!__DEV__) return <LeaveDevRoute />;

  const answer = (): Promise<void> => {
    if (p.answer === 'hold') return never<void>();
    const error = refusal(p.answer);
    return error ? Promise.reject(error) : Promise.resolve();
  };
  const expires = p.expires ? Number(p.expires) : null;
  const email = p.email ?? '';

  if (p.screen === 'forgot' || p.screen === 'sent') {
    return (
      <ForgotPasswordScreen
        initialEmail={email}
        initialSent={p.screen === 'sent' ? { email, expiresInSeconds: expires } : undefined}
        onSend={() => answer().then(() => ({ expiresInSeconds: expires }))}
        onBackToSignIn={() => router.push({ pathname: '/preview/auth', params: { screen: 'sign-in', email } })}
      />
    );
  }
  return (
    <SignInScreen
      initialEmail={email}
      initialPassword={p.password ?? ''}
      onSignIn={answer}
      onForgot={(typed) => router.push({ pathname: '/preview/auth', params: { screen: 'forgot', email: typed } })}
      onBack={() => router.back()}
    />
  );
}
