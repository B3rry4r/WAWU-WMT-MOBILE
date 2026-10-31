import { isApiError } from '@/api/errors';
import { MAX_LENGTH, MIN_LENGTH } from '@/features/settings/passwordFailure';

import { resetFailure, type Failure } from './signInFailure';

/** The same address pattern WAWU ID's DTO would accept: something, an at sign, something with a dot. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** WAWU ID mails a 64 character hex token; anything longer than this, or with a space in it, is not one. */
const MAX_TOKEN_LENGTH = 512;

/** What the emailed link carries: `https://wawuafrica.com/reset-password?token=...&email=...` (wawu-id `auth.service.ts` `forgotPassword`). */
export type ResetLink = { token: string; email: string };

type Param = string | string[] | undefined;
const first = (value: Param): string => (Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));

/**
 * The token and the email out of the link's address, or null when the address is not one the server could have mailed (no
 * token, no email, or an email that is not one). Null draws the "link no longer works" screen straight away: there is nothing to
 * send, and the person is told what to do instead of being asked for a password that could not be used.
 */
export function readResetLink(params: { token?: Param; email?: Param }): ResetLink | null {
  const token = first(params.token).trim();
  const email = first(params.email).trim().toLowerCase();
  if (!token || token.length > MAX_TOKEN_LENGTH || /\s/.test(token)) return null;
  if (!LOOKS_LIKE_EMAIL.test(email)) return null;
  return { token, email };
}

/** The form's own checks, run before anything is sent. */
export function resetPasswordProblems(next: string, confirm: string): { next?: string; confirm?: string } {
  return {
    next: !next
      ? 'Enter a new password.'
      : next.length < MIN_LENGTH
        ? `Use at least ${MIN_LENGTH} characters.`
        : next.length > MAX_LENGTH
          ? `Use no more than ${MAX_LENGTH} characters.`
          : undefined,
    confirm: !confirm ? 'Enter the new password again.' : confirm !== next ? "The two passwords don't match." : undefined,
  };
}

/** Whether the live "Passwords match" line shows: both typed, equal, and the password itself a valid one. */
export function passwordsMatch(next: string, confirm: string): boolean {
  return confirm.length > 0 && confirm === next && next.length >= MIN_LENGTH && next.length <= MAX_LENGTH;
}

/** What a refused save becomes: the link is spent (its own screen), a line on the password field, or a banner above the form. */
export type ResetOutcome = { kind: 'invalid' } | { kind: 'field'; message: string } | { kind: 'banner'; failure: Failure };

/**
 * Why `POST /auth/reset-password` failed. WAWU ID answers one 401 ("Invalid or expired reset token") for a token that is wrong,
 * expired or already used (and for an email it does not know), so those are one screen. A 400 on this path is the password's
 * length. The rest is the same wording as asking for the link.
 */
export function resetPasswordOutcome(error: unknown): ResetOutcome {
  if (isApiError(error)) {
    if (error.kind === 'unauthorized') return { kind: 'invalid' };
    if (error.kind === 'validation') return { kind: 'field', message: `Use ${MIN_LENGTH} to ${MAX_LENGTH} characters.` };
  }
  return { kind: 'banner', failure: resetFailure(error) };
}
