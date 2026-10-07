import { isApiError } from '@/api/client';

import { waitInWords } from './failure';

/** What the change-password form shows when WAWU ID refuses: a line on one field, or a banner above the form. */
export type PasswordFailure =
  | { where: 'current' | 'new'; message: string }
  | { where: 'banner'; tone: 'danger' | 'warning'; title: string; body: string };

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

/** The form's own checks, run before anything is sent. */
export function passwordProblems(current: string, next: string): { current?: string; next?: string } {
  return {
    current: current ? undefined : 'Enter your current password.',
    next: !next
      ? 'Enter a new password.'
      : next.length < MIN_LENGTH
        ? `Use at least ${MIN_LENGTH} characters.`
        : next.length > MAX_LENGTH
          ? `Use no more than ${MAX_LENGTH} characters.`
          : undefined,
  };
}

/** The password changed on the server but the person signed out before the answer came, so this phone holds no session for it. */
export const SIGNED_OUT_FIRST: PasswordFailure = {
  where: 'banner',
  tone: 'warning',
  title: 'Your password was changed',
  body: 'You signed out before it finished. Sign in with your new password.',
};

export function passwordFailure(error: unknown): PasswordFailure {
  if (!isApiError(error)) {
    return { where: 'banner', tone: 'danger', title: 'Your password was not changed', body: 'Something went wrong. Try again.' };
  }
  if (error.code === 'CURRENT_PASSWORD_WRONG') return { where: 'current', message: 'That is not your current password.' };
  if (error.code === 'PASSWORD_UNCHANGED') return { where: 'new', message: 'Choose a password that is different from your current one.' };
  if (error.code === 'PASSWORD_NOT_SET') {
    return {
      where: 'banner',
      tone: 'warning',
      title: 'This account has no password yet',
      body: 'Sign out, then use Forgot password on the sign-in screen to set one.',
    };
  }
  if (error.kind === 'rate_limited') {
    return {
      where: 'banner',
      tone: 'warning',
      title: 'Too many tries',
      body: error.retryAfterSeconds ? `Wait ${waitInWords(error.retryAfterSeconds)} and try again.` : 'Wait a little and try again.',
    };
  }
  if (error.kind === 'validation') return { where: 'new', message: `Use ${MIN_LENGTH} to ${MAX_LENGTH} characters.` };
  if (error.kind === 'unauthorized') {
    return { where: 'banner', tone: 'danger', title: 'Your session ended', body: 'Sign in again, then change your password.' };
  }
  if (error.kind === 'network') return { where: 'banner', tone: 'danger', title: 'No connection', body: 'Check your internet and try again.' };
  // An answer the app could not read (status 200) is the app's own sentence and says the password did change.
  if (error.kind === 'unknown' && error.status === 200 && error.message) {
    return { where: 'banner', tone: 'warning', title: 'Your password was changed', body: 'Sign in again with your new password.' };
  }
  return { where: 'banner', tone: 'danger', title: 'Your password was not changed', body: 'Something went wrong. Try again.' };
}
