import { isApiError } from '@/api/errors';

/** What a refused sign-in or reset request says, and in which tone. Every sentence is for the user: no codes, no status numbers. */
export type Failure = {
  /** Which banner colour: a wrong password is the user's to fix; a dead connection or server is not. */
  tone: 'danger' | 'warning';
  title: string;
  body: string;
  /** True when the cause is the email or password themselves, so the password field is outlined red (A25). */
  credentials: boolean;
};

/** A25's banner, word for word (design/_gen/auth.js line 21). An unknown email and a wrong password are the same message on purpose: the screen never says which account exists. */
const mismatch: Failure = {
  tone: 'danger',
  title: "That email and password don't match",
  body: 'Check them, or reset your password.',
  credentials: true,
};

const notConfirmed: Failure = {
  tone: 'warning',
  title: "Your account isn't confirmed yet",
  body: 'Finish confirming it, then sign in. If you were signing up here, create your account again to get a new code.',
  credentials: false,
};

/** A password that was right on a sign-up whose phone was never confirmed, with no code waiting on this phone: the way on is a new sign-up (an unconfirmed one gives up its email and phone to it). */
const phoneNotConfirmed: Failure = {
  tone: 'warning',
  title: "Your phone isn't confirmed yet",
  body: 'Create your account again to get a new code.',
  credentials: false,
};

const offline: Failure = {
  tone: 'danger',
  title: 'No connection',
  body: 'Check your internet and try again.',
  credentials: false,
};

const busy: Failure = {
  tone: 'warning',
  title: 'Too many tries',
  body: 'Wait a moment, then try again.',
  credentials: false,
};

const broken: Failure = {
  tone: 'danger',
  title: 'Something went wrong on our side',
  body: 'Try again in a moment.',
  credentials: false,
};

/** WAWU ID's codes for an account whose email or phone was never confirmed (auth.service.ts `login`, `refuseIfPending`). */
const UNCONFIRMED_CODES = ['EMAIL_NOT_VERIFIED', 'PHONE_NOT_CONFIRMED'];

/**
 * Why a sign-in failed, by its real cause. WAWU ID answers 401 for a wrong
 * password and 404 (`USER_NOT_IN_WAWUID`) for an unknown email or phone; both
 * are A25. 403 with an unconfirmed-account code means the password was right
 * but sign-up was never finished.
 */
export function signInFailure(error: unknown): Failure {
  if (!isApiError(error)) return broken;
  if (error.code === 'PHONE_NOT_CONFIRMED') return phoneNotConfirmed;
  if (error.code && UNCONFIRMED_CODES.includes(error.code)) return notConfirmed;
  switch (error.kind) {
    case 'unauthorized':
    case 'not_found':
    case 'validation':
      return mismatch;
    case 'network':
      return offline;
    case 'rate_limited':
      return busy;
    default:
      return broken;
  }
}

/** Why asking for a reset link failed. The server answers the same for every address, so a refusal is never about the address. */
export function resetFailure(error: unknown): Failure {
  if (!isApiError(error)) return broken;
  switch (error.kind) {
    case 'network':
      return offline;
    case 'rate_limited':
      return busy;
    default:
      return broken;
  }
}
