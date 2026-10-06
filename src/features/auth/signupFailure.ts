import { isApiError } from '@/api/errors';

import type { Failure } from './signInFailure';

/** How long to wait, as `m:ss`, from the server's own seconds. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** What a code screen does with a refused call. */
export type Outcome =
  | { kind: 'wrong' }
  | { kind: 'locked'; seconds: number }
  | { kind: 'wait'; seconds: number }
  | { kind: 'notice'; failure: Failure };

const notice = (title: string, body: string, tone: Failure['tone'] = 'danger'): Outcome => ({
  kind: 'notice',
  failure: { tone, title, body, credentials: false },
});

const offline = () => notice('No connection', 'Check your internet and try again.');
const broken = () => notice('Something went wrong on our side', 'Try again in a moment.');
const unsent = () => notice("We couldn't send the code", 'Try again in a moment.', 'warning');
/** WAWU ID changed the way it sends codes while this sign-up waited: the old one cannot finish, a new one can. */
const changed = () => notice('This sign-up needs to start again', 'Go back and tap Continue to get a new code.', 'warning');

/** Seconds the server asked for. A 429 that names none is treated as the shortest wait the screen can show. */
const waitOf = (retry: number | undefined) => (typeof retry === 'number' && retry > 0 ? retry : 1);

/**
 * A refused phone code call (confirm or resend), by its real cause. Codes are
 * WAWU ID's (contract `ErrorBody.code`): a wrong or expired code is
 * PHONE_CODE_INVALID, four wrong ones lock the number (429 PHONE_CODE_LOCKED),
 * a resend too early is PHONE_CODE_RESEND_TOO_SOON (both with `retryAfterSeconds`).
 */
export function phoneOutcome(error: unknown): Outcome {
  if (!isApiError(error)) return broken();
  if (error.kind === 'network') return offline();
  switch (error.code) {
    case 'PHONE_CODE_INVALID':
      return { kind: 'wrong' };
    case 'PHONE_CODE_LOCKED':
      return { kind: 'locked', seconds: waitOf(error.retryAfterSeconds) };
    case 'PHONE_CODE_RESEND_TOO_SOON':
      return { kind: 'wait', seconds: waitOf(error.retryAfterSeconds) };
    case 'RATE_LIMITED':
      return { kind: 'locked', seconds: waitOf(error.retryAfterSeconds) };
    case 'PHONE_ALREADY_CONFIRMED':
      return notice('This sign-up is already confirmed', 'Sign in with your email and password.', 'warning');
    case 'SMS_NOT_CONFIGURED':
    case 'SMS_SEND_FAILED':
      return unsent();
    case 'SIGNUP_CHANNEL_DISABLED':
      return changed();
    default:
      break;
  }
  if (error.kind === 'conflict') return notice('That email or phone number is already in use', 'Sign in, or start again with different details.');
  if (error.kind === 'rate_limited') return { kind: 'locked', seconds: waitOf(error.retryAfterSeconds) };
  return broken();
}

/**
 * The same for a code that was mailed, on A4 and A15 (the sign-up's own code, R-39) and on the later email step:
 * EMAIL_CODE_INVALID, EMAIL_CODE_LOCKED, EMAIL_CODE_RESEND_TOO_SOON, and, for the sign-up's code only,
 * EMAIL_ALREADY_CONFIRMED, EMAIL_NOT_CONFIGURED, EMAIL_SEND_FAILED and SIGNUP_CHANNEL_DISABLED.
 */
export function emailOutcome(error: unknown): Outcome {
  if (!isApiError(error)) return broken();
  if (error.kind === 'network') return offline();
  switch (error.code) {
    case 'EMAIL_CODE_INVALID':
      return { kind: 'wrong' };
    case 'EMAIL_CODE_LOCKED':
      return { kind: 'locked', seconds: waitOf(error.retryAfterSeconds) };
    case 'EMAIL_CODE_RESEND_TOO_SOON':
      return { kind: 'wait', seconds: waitOf(error.retryAfterSeconds) };
    case 'RATE_LIMITED':
      return { kind: 'locked', seconds: waitOf(error.retryAfterSeconds) };
    case 'EMAIL_ALREADY_CONFIRMED':
      return notice('This sign-up is already confirmed', 'Sign in with your email and password.', 'warning');
    case 'EMAIL_NOT_CONFIGURED':
    case 'EMAIL_SEND_FAILED':
      return unsent();
    case 'SIGNUP_CHANNEL_DISABLED':
      return changed();
    default:
      break;
  }
  if (error.kind === 'conflict') return notice('That email or phone number is already in use', 'Sign in, or start again with different details.');
  if (error.kind === 'rate_limited') return { kind: 'locked', seconds: waitOf(error.retryAfterSeconds) };
  return broken();
}

/** Why A3's Continue failed, as the banner above the form (and which field to outline). */
export type SignupFailure = Failure & { field?: 'email' | 'phone' };

export function signupFailure(error: unknown): SignupFailure {
  const plain = (title: string, body: string, tone: Failure['tone'] = 'danger'): SignupFailure => ({ tone, title, body, credentials: false });
  if (!isApiError(error)) return plain('Something went wrong on our side', 'Try again in a moment.');
  if (error.kind === 'network') return plain('No connection', 'Check your internet and try again.');
  switch (error.code) {
    case 'PHONE_INVALID':
      return { ...plain('That phone number is not valid', 'Check it and try again.'), field: 'phone' };
    case 'PHONE_NOT_SUPPORTED':
      return { ...plain("We can't use that number yet", 'Use a Nigerian number that starts with 0 or +234.'), field: 'phone' };
    case 'SMS_NOT_CONFIGURED':
    case 'SMS_SEND_FAILED':
    case 'EMAIL_NOT_CONFIGURED':
    case 'EMAIL_SEND_FAILED':
      return plain("We couldn't send the code", 'Try again in a moment.', 'warning');
    case 'PHONE_CODE_RESEND_TOO_SOON':
    case 'EMAIL_CODE_RESEND_TOO_SOON': {
      const left = typeof error.retryAfterSeconds === 'number' && error.retryAfterSeconds > 0 ? ` Wait ${clock(error.retryAfterSeconds)} before sending another, or` : ' Wait a moment, or';
      return plain('A code was just sent', `${left} enter the one we sent.`.trim(), 'warning');
    }
    case 'RATE_LIMITED': {
      const wait = typeof error.retryAfterSeconds === 'number' && error.retryAfterSeconds > 0 ? ` Try again in ${clock(error.retryAfterSeconds)}.` : ' Try again in a little while.';
      return plain('Too many tries', `Wait before asking for another code.${wait}`, 'warning');
    }
    default:
      break;
  }
  if (error.kind === 'conflict') return plain('That email or phone number is already in use', 'Sign in instead, or use different details.');
  if (error.kind === 'rate_limited') return plain('Too many tries', 'Wait a moment, then try again.', 'warning');
  if (error.kind === 'validation') return plain('Check your details', 'Make sure the email, phone number and password are right.');
  return plain('Something went wrong on our side', 'Try again in a moment.');
}
