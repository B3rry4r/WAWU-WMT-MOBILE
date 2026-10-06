import { useLocalSearchParams, useRouter } from 'expo-router';

import { ApiError } from '@/api/errors';
import { AccountTypeScreen } from '@/features/auth/AccountTypeScreen';
import type { AccountType } from '@/features/auth/accountType';
import { CodeScreen } from '@/features/auth/CodeScreen';
import { emailOutcome, phoneOutcome } from '@/features/auth/signupFailure';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { WelcomeScreen } from '@/features/auth/WelcomeScreen';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

/*
 * Development-only harness for the signed-out screens (task AUTH-01), used to
 * screenshot each artboard at 390 px. Release builds redirect home. The real
 * screens run against the real servers at /sign-in and /forgot-password; this
 * route answers in their place, so a state can be shown without a server.
 *
 *   screen=welcome | account-type | sign-in | forgot | sent
 *                                         A1, A2, A22 and A25, A23, A24 (default sign-in)
 *   pick=discover | earn                  A2: which card is picked (none when left out)
 *   continue=1                            A2: draw the Continue button (the app draws it
 *                                         once AUTH-04 adds A3; here it opens nothing)
 *   email=<text>                          what the Email field holds
 *   password=<text>                       what the Password field holds (sign-in)
 *   answer=wrong | unconfirmed | offline | busy | server | hold | ok
 *                                         what the server answers when Sign in or
 *                                         Send reset link is pressed (hold never answers)
 *   expires=<seconds>                     the link lifetime the server reports on A24
 *                                         (leave out for a server that sends none)
 *
 * AUTH-04 adds (every figure below is the preview's own, standing in for the server's):
 *   screen=sign-up                        A3 (email, password and phone as above)
 *   phone=<text>                          what A3's Phone number field holds
 *   screen=phone-code | email-code        A4 and A15, and the email step
 *   digits=<up to 6 digits>               what the boxes hold
 *   wrong=1                               A15: the wrong-code line (needs 6 digits)
 *   resend=<seconds>                      the server's resendIn (default 42; 0 shows Resend code)
 *   extra=1                               A4 with the email code field (emailCodeRequired, texted sign-up only)
 *   answer=badcode | locked | busy | offline | server | hold | ok | conflict | phone | sms | mail
 *                                         what Continue / the sixth digit / Resend answer
 *   lockfor=<seconds>                     the retryAfterSeconds on locked, busy
 *
 * AUTH-07 (R-39): screen=phone-code is A4 and A15 with the code MAILED ("Verify your email", "Sent to n•••@example.com"),
 * which is what WAWU ID does by default. channel=sms draws the texted version it replaced ("Verify your phone",
 * "Sent by SMS to 0803 ••• 4412"), what WAWU ID does with SIGNUP_VERIFY_CHANNEL=sms.
 *   channel=sms                           A4 and A15 as the text version
 */

type Params = {
  screen?: string;
  pick?: string;
  continue?: string;
  email?: string;
  password?: string;
  answer?: string;
  expires?: string;
  phone?: string;
  digits?: string;
  wrong?: string;
  resend?: string;
  extra?: string;
  lockfor?: string;
  channel?: string;
};

const never = <T,>() => new Promise<T>(() => undefined);

function refusal(answer: string | undefined, lockSeconds?: number, family = 'PHONE'): ApiError | null {
  switch (answer) {
    case 'wrong':
      return new ApiError('unauthorized', 401, 'Invalid credentials');
    case 'unconfirmed':
      return new ApiError('forbidden', 403, 'Verify your email address before signing in.', 'EMAIL_NOT_VERIFIED');
    case 'offline':
      return new ApiError('network', 0, 'No connection.');
    case 'busy':
      return new ApiError('rate_limited', 429, 'Too many requests', 'RATE_LIMITED', lockSeconds);
    case 'server':
      return new ApiError('server', 500, 'Internal server error');
    case 'badcode':
      return new ApiError('validation', 400, 'That code is not right', `${family}_CODE_INVALID`);
    case 'locked':
      return new ApiError('rate_limited', 429, 'Too many wrong codes', `${family}_CODE_LOCKED`, lockSeconds);
    case 'conflict':
      return new ApiError('conflict', 409, 'An account with this email or phone already exists');
    case 'phone':
      return new ApiError('validation', 400, 'Enter a valid phone number', 'PHONE_NOT_SUPPORTED');
    case 'sms':
      return new ApiError('server', 503, 'We could not send the code', 'SMS_SEND_FAILED');
    case 'mail':
      return new ApiError('server', 503, 'We could not send the code', 'EMAIL_SEND_FAILED');
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
    const error = refusal(p.answer, p.lockfor ? Number(p.lockfor) : undefined, p.screen === 'phone-code' && p.channel === 'sms' ? 'PHONE' : 'EMAIL');
    return error ? Promise.reject(error) : Promise.resolve();
  };
  const expires = p.expires ? Number(p.expires) : null;
  const email = p.email ?? '';

  if (p.screen === 'welcome') {
    return (
      <WelcomeScreen
        onCreateAccount={() => router.push({ pathname: '/preview/auth', params: { screen: 'account-type' } })}
        onSignIn={() => router.push({ pathname: '/preview/auth', params: { screen: 'sign-in' } })}
      />
    );
  }
  if (p.screen === 'account-type') {
    const pick: AccountType | undefined = p.pick === 'discover' || p.pick === 'earn' ? p.pick : undefined;
    return <AccountTypeScreen initialPick={pick} onContinue={p.continue ? () => router.push({ pathname: '/preview/auth', params: { screen: 'sign-up' } }) : undefined} onBack={() => router.back()} />;
  }
  if (p.screen === 'sign-up') {
    return (
      <SignUpScreen
        initial={{ email, phone: p.phone ?? '', password: p.password ?? '' }}
        onContinue={answer}
        onBack={() => router.back()}
      />
    );
  }
  if (p.screen === 'phone-code' || p.screen === 'email-code') {
    const code = p.screen === 'phone-code';
    const texted = code && p.channel === 'sms';
    return (
      <CodeScreen
        testID={p.screen}
        navTitle={code ? (texted ? 'Verify your phone' : 'Verify your email') : 'Check your email'}
        subtitle={code ? (texted ? 'Sent by SMS to 0803 ••• 4412' : 'Sent to n•••@example.com') : 'Sent to lennox@wawu.africa'}
        resendIn={p.resend === undefined ? 42 : Number(p.resend)}
        initialDigits={p.digits ?? ''}
        initialWrong={p.wrong === '1'}
        extra={texted && p.extra ? { label: 'Code from your email', hint: 'We also emailed a code to confirm your email address.' } : undefined}
        onSubmit={answer}
        onResend={() => answer().then(() => (p.resend === undefined ? 42 : Number(p.resend)))}
        classify={texted ? phoneOutcome : emailOutcome}
        restartAfter={code ? 4 : undefined}
        onRestart={() => router.back()}
        later={code ? undefined : { label: 'Later', onPress: answer }}
        onBack={() => router.back()}
      />
    );
  }
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
      onCreateAccount={() => router.push({ pathname: '/preview/auth', params: { screen: 'account-type' } })}
      onForgot={(typed) => router.push({ pathname: '/preview/auth', params: { screen: 'forgot', email: typed } })}
      onBack={() => router.back()}
    />
  );
}
