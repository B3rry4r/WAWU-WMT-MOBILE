import { isApiError } from '@/api/errors';
import {
  phoneVerifyConfirmRequest,
  phoneVerifyStartRequest,
  signupCompleteStepRequest,
  signupEmailCodeConfirmRequest,
  signupEmailCodeStartRequest,
  signupEmailConfirmRequest,
  signupEmailStartRequest,
  signupRequest,
  signupChannelRequest,
  signupResumeRequest,
  type EmailCodeSent,
  type SignupChannel,
} from '@/api/identity';
import { adoptSession } from '@/api/session';
import { maskedNumber } from '@/features/geo/phone';
import { noteContactProved } from '@/features/claim/freshToken';
import { markOfferPending } from '@/features/claim/offerStep';
import { markBonusPending } from '@/features/verify/bonusStep';

import { wireAccountType, type AccountType } from './accountType';
import { askUsername } from './identityApi';
import { claimSignupUsername } from './identityStep';
import { authed } from './signupApi';
import { UsernameRefused, usernameOf, usernameProblem } from './username';
import { refreshSignupGate, setSignupProgress } from './signupGate';
import { clearSignup, heldSignup, loadSignup, saveSignup, setStarted, started } from './signupStore';

/**
 * A3 Continue. A new sign-up replaces the one before it, but only when the
 * server answers with a new secret: a refused, offline or failed Continue keeps
 * the old secret, whose code may still be live. WAWU ID's answer carries the number as it stored it and the
 * `attempt`; both are kept (secure store) for A4, resend and resume. It also says where the code went:
 * `channel: 'email'` (WAWU ID's SIGNUP_VERIFY_CHANNEL is `email`, R-39, with the address masked as `maskedEmail`) or,
 * by default (the value is `phone`), no channel field and a text. `phoneNotSaved: true` says a mailed sign-up was made
 * without the number typed, because another account holds it.
 * `accountType` goes to WAWU ID only: never to the Hub (G-34, R-6).
 */
export async function startSignup(
  values: { firstName: string; lastName: string; username: string; email: string; phone: string; countryCode?: string; password: string },
  pick: AccountType | null,
): Promise<void> {
  const accountType = wireAccountType(pick);
  // The username is asked of the Hub once more at Continue (SIGNUP-NAMES, R-82): a name taken since the line under the field
  // last said "free" is refused here with the Hub's words, before a code is sent.
  const username = usernameOf(values.username);
  const own = usernameProblem(username);
  if (own) throw new UsernameRefused(own);
  const said = await askUsername(username);
  if (!said.available) throw new UsernameRefused(said.message ?? 'That username is taken. Try another.');
  const answer = await signupRequest({
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email,
    // In full international form, with the country of residence beside it (GEO-03, R-85; WAWU ID GEO-01).
    phone: values.phone,
    ...(values.countryCode ? { countryCode: values.countryCode } : {}),
    password: values.password,
    ...(accountType ? { accountType } : {}),
  });
  await saveSignup({ phone: answer.phone, attempt: answer.attempt, username });
  setStarted({
    channel: answer.channel === 'email' ? 'email' : 'sms',
    maskedEmail: answer.maskedEmail ?? null,
    phoneNotSaved: answer.phoneNotSaved === true,
    emailCodeRequired: answer.emailCodeRequired,
    resendIn: answer.resendIn,
    expiresIn: answer.expiresIn,
  });
}

let knownChannel: SignupChannel | null = null;
/** Counts the asks of `signupChannel`; the highest one is the latest. */
let lastAsk = 0;

/**
 * A3: which way the code will travel, so the line under the heading names the channel A4 will then name (the
 * words follow WAWU ID's SIGNUP_VERIFY_CHANNEL, AUTH-07 round 3). Asked again each time A3 comes into focus (round 4,
 * the verifier's F-G): the setting can change while the app stays open, and an answer kept for the whole run
 * would leave A3 naming the old channel while A4 names the new one. Null when WAWU ID could not be asked: the line is
 * then left out, never guessed.
 */
export async function signupChannel(): Promise<SignupChannel | null> {
  // Only the latest ask may set what a newly mounted A3 draws first: an answer to an earlier visit that lands after a
  // later ask began is returned to its own caller and then forgotten (SWEEP-AUTH AUTH-07 N-2).
  const mine = ++lastAsk;
  let answer: SignupChannel | null;
  try {
    answer = await signupChannelRequest();
  } catch {
    answer = null;
  }
  if (mine === lastAsk) knownChannel = answer;
  return answer;
}

/** What the last ask of `signupChannel` learned (null before it has, or when it failed). */
export function knownSignupChannel(): SignupChannel | null {
  return knownChannel;
}

/** Forgets the learned channel (tests, and a sign-out that wants a fresh answer). */
export function forgetSignupChannel(): void {
  knownChannel = null;
  // An ask still on its way is older than this and may not set the channel back.
  lastAsk += 1;
}

/**
 * A4: the right code(s) issue the first session; the secret is not needed any more. A mailed code
 * (SIGNUP_VERIFY_CHANNEL=email) goes to `signup/email-code/confirm`, a texted one (the default) to `phone/verify/confirm`.
 */
export async function confirmSignupCode(code: string, emailCode: string): Promise<void> {
  const held = heldSignup();
  if (!held) throw new Error('No sign-up is waiting for a code.');
  const tokens =
    started()?.channel === 'email'
      ? await signupEmailCodeConfirmRequest({ phone: held.phone, attempt: held.attempt, code })
      : await phoneVerifyConfirmRequest({
          phone: held.phone,
          attempt: held.attempt,
          code,
          ...(emailCode ? { emailCode } : {}),
        });
  const username = held.username ?? null;
  await clearSignup();
  // JOIN-03: this account is new, so it is asked once whether it has an access code (SHARED-CHANGES JOIN-03 #4).
  await markOfferPending(tokens.accessToken);
  // VERIFY-01: and, after that, once to "Your bonus is waiting" (VF1), the same way (SHARED-CHANGES VERIFY-01 #1).
  await markBonusPending(tokens.accessToken);
  // SIGNUP-NAMES: once the session is adopted the username chosen on the form is claimed on the Hub; the gate waits for it.
  await claimSignupUsername(() => adoptSession(tokens), username);
}

/** A4 Resend: another code for the same sign-up, by the channel it started with. Resolves with the server's `resendIn`. */
export async function resendSignupCode(): Promise<number> {
  const held = heldSignup();
  if (!held) throw new Error('No sign-up is waiting for a code.');
  const request = started()?.channel === 'email' ? signupEmailCodeStartRequest : phoneVerifyStartRequest;
  const answer = await request({ phone: held.phone, attempt: held.attempt });
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
        channel: answer.channel === 'email' ? 'email' : 'sms',
        maskedEmail: answer.maskedEmail ?? null,
        phoneNotSaved: answer.phoneNotSaved === true,
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

/**
 * A4's subtitle number, middle hidden: a Nigerian number as it is dialled at home (0803 ••• 4412), any other with its own
 * country code (+233 ••• 4567).
 */
export function maskedPhone(phone: string): string {
  return maskedNumber(phone) || phone;
}

export { started };

/* ---- The email step (after A4, no artboard; SHARED-CHANGES AUTH-05 F2) ----
 * Reached only after a texted sign-up (SIGNUP_VERIFY_CHANNEL=phone, the default): a mailed sign-up proves the email at A4, so
 * the server's progress never says `email` for it and the root layout never opens this step (AUTH-07). */

/** Mails a code to the account's own address. A code already sent a moment ago answers 429 with the wait; the screen shows that wait. */
export function startEmailCode(): Promise<EmailCodeSent> {
  return authed(signupEmailStartRequest);
}

/** The right code proves the email; the answer says what comes next, and the root layout moves on. */
export async function confirmEmailCode(code: string): Promise<void> {
  try {
    setSignupProgress(await authed((token) => signupEmailConfirmRequest(token, code)));
    // JOIN-03: the access token in hand was issued before this proof; a claim renews it first (SHARED-CHANGES JOIN-03 #6).
    await noteContactProved();
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
