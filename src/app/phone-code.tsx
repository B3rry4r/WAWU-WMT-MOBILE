import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { CodeScreen } from '@/features/auth/CodeScreen';
import { confirmSignupCode, maskedPhone, resendSignupCode, resumeSignup } from '@/features/auth/signupFlow';
import { emailOutcome, PHONE_NOT_SAVED, phoneOutcome } from '@/features/auth/signupFailure';
import { clearSignup, heldSignup, started } from '@/features/auth/signupStore';

/** After this many wrong codes in a row the sign-up's secret is dead: BACKEND_GAPS G-18 (N-1). */
const RESTART_AFTER = 4;

/**
 * A4 and A15. Only reachable signed out. The right code issues the first session, and the root layout moves on.
 * Where the code went is what WAWU ID's answer says. By default (SIGNUP_VERIFY_CHANNEL `phone`) it is texted and the screen is
 * the phone one ("Verify your phone", "Sent by SMS to 0803 ••• 4412."); with `email` it is mailed to the address typed on A3
 * ("Verify your email", "Sent to n•••@example.com", R-39). A mailed sign-up made without the number typed (another account
 * holds it) says so under the heading.
 * Opened with nothing in memory (the browser build reloaded on this address), it asks WAWU ID where the held
 * sign-up stands, as the welcome screen does after a restart; with no sign-up left it sends the user to A3.
 */
export default function PhoneCodeRoute() {
  const [phase, setPhase] = useState<'checking' | 'open' | 'gone'>(() => (heldSignup() && started() ? 'open' : 'checking'));
  useEffect(() => {
    if (phase !== 'checking') return undefined;
    let alive = true;
    void resumeSignup().then((step) => alive && setPhase(step === 'phone' ? 'open' : 'gone'));
    return () => {
      alive = false;
    };
  }, [phase]);
  if (phase === 'gone') return <Redirect href="/sign-up" />;
  if (phase === 'checking') return null;
  return <PhoneCode />;
}

function PhoneCode() {
  const router = useRouter();
  const held = heldSignup();
  const state = started();
  const [resendIn] = useState(() => (state ? Math.max(0, state.resendIn - Math.floor((Date.now() - state.at) / 1000)) : 0));
  if (!held || !state) return <Redirect href="/sign-up" />;
  const mailed = state.channel === 'email';
  return (
    <CodeScreen
      testID="phone-code"
      navTitle={mailed ? 'Verify your email' : 'Verify your phone'}
      subtitle={mailed ? (state.maskedEmail ? `Sent to ${state.maskedEmail}` : 'Sent to your email address') : `Sent by SMS to ${maskedPhone(held.phone)}.`}
      resendIn={resendIn}
      aside={mailed && state.phoneNotSaved ? PHONE_NOT_SAVED : undefined}
      extra={!mailed && state.emailCodeRequired ? { label: 'Code from your email', hint: 'We also emailed a code to confirm your email address.' } : undefined}
      onSubmit={(code, emailCode) => confirmSignupCode(code, emailCode)}
      onResend={resendSignupCode}
      classify={mailed ? emailOutcome : phoneOutcome}
      restartAfter={RESTART_AFTER}
      onRestart={() => {
        void clearSignup();
        if (router.canGoBack()) router.back();
        else router.replace('/sign-up');
      }}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/sign-up'))}
    />
  );
}
