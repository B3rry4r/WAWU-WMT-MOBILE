import { isApiError } from '@/api/errors';
import {
  phoneVerifyConfirmRequest,
  phoneVerifyStartRequest,
  signupCompleteStepRequest,
  signupEmailConfirmRequest,
  signupEmailStartRequest,
  signupRequest,
  signupResumeRequest,
  type EmailCodeSent,
} from '@/api/identity';
import { adoptSession } from '@/api/session';

import { wireAccountType, type AccountType } from './accountType';
import { authed } from './signupApi';
import { refreshSignupGate, setSignupProgress } from './signupGate';
import { clearSignup, heldSignup, loadSignup, saveSignup, setStarted, started } from './signupStore';

/**
 * A3 Continue. A new sign-up replaces the one before it, so the old secret is
 * dropped first. WAWU ID's answer carries the number as it stored it and the
 * `attempt`; both are kept (secure store) for A4, resend and resume.
 * `accountType` goes to WAWU ID only: never to the Hub (G-34, R-6).
 */
export async function startSignup(values: { email: string; phone: string; password: string }, pick: AccountType | null): Promise<void> {
  await clearSignup();
  const accountType = wireAccountType(pick);
  const answer = await signupRequest({
    email: values.email,
    phone: values.phone,
    password: values.password,
    ...(accountType ? { accountType } : {}),
  });
  await saveSignup({ phone: answer.phone, attempt: answer.attempt });
  setStarted({ emailCodeRequired: answer.emailCodeRequired, resendIn: answer.resendIn, expiresIn: answer.expiresIn });
}

/** A4: the right code(s) issue the first session; the secret is not needed any more. */
export async function confirmPhone(code: string, emailCode: string): Promise<void> {
  const held = heldSignup();
  if (!held) throw new Error('No sign-up is waiting for a code.');
  const tokens = await phoneVerifyConfirmRequest({
    phone: held.phone,
    attempt: held.attempt,
    code,
    ...(emailCode ? { emailCode } : {}),
  });
  await clearSignup();
  await adoptSession(tokens);
}

/** A4 Resend: another text for the same sign-up. Resolves with the server's `resendIn`. */
export async function resendPhoneCode(): Promise<number> {
  const held = heldSignup();
  if (!held) throw new Error('No sign-up is waiting for a code.');
  const answer = await phoneVerifyStartRequest({ phone: held.phone, attempt: held.attempt });
  return answer.resendIn;
}

/**
 * On start, and after a sign-in answered "not confirmed": asks WAWU ID where a
 * held sign-up stands. `phone` reopens A4 (with the time that is left); `details`
 * clears the secret and sends the user back to A3. Nothing held, or a call that
 * could not be made (offline), answers null and keeps what is held.
 */
export async function resumeSignup(): Promise<'phone' | 'details' | null> {
  const held = heldSignup() ?? (await loadSignup());
  if (!held) return null;
  try {
    const answer = await signupResumeRequest({ phone: held.phone, attempt: held.attempt });
    if (answer.step === 'phone') {
      setStarted({
        emailCodeRequired: answer.emailCodeRequired === true,
        resendIn: answer.resendIn ?? 0,
        expiresIn: answer.expiresIn ?? 0,
      });
      return 'phone';
    }
    await clearSignup();
    return 'details';
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}

/** A4's subtitle number: the stored +234 number written as it is dialled, middle hidden (0803 ••• 4412). */
export function maskedPhone(phone: string): string {
  const national = phone.startsWith('+234') ? `0${phone.slice(4)}` : phone;
  if (national.length < 8) return national;
  return `${national.slice(0, 4)} ••• ${national.slice(-4)}`;
}

export { started };

/* ---- The email step (after A4, no artboard; SHARED-CHANGES AUTH-05 F2) ---- */

/** Mails a code to the account's own address. A code already sent a moment ago answers 429 with the wait; the screen shows that wait. */
export function startEmailCode(): Promise<EmailCodeSent> {
  return authed(signupEmailStartRequest);
}

/** The right code proves the email; the answer says what comes next, and the root layout moves on. */
export async function confirmEmailCode(code: string): Promise<void> {
  try {
    setSignupProgress(await authed((token) => signupEmailConfirmRequest(token, code)));
  } catch (error) {
    if (isApiError(error) && error.status === 409) {
      // Proven already, or no address on the account: the server's progress says where to go.
      await refreshSignupGate();
      return;
    }
    throw error;
  }
}

/** "Later": the email is put off, and the next step opens. A 409 means the app was behind: read the progress again. */
export async function putOffEmail(): Promise<void> {
  try {
    setSignupProgress(await authed((token) => signupCompleteStepRequest(token, 'email')));
  } catch (error) {
    if (isApiError(error) && error.status === 409) {
      await refreshSignupGate();
      return;
    }
    throw error;
  }
}
