import { isApiError } from '@/api/errors';

import { UPLOAD_FAILED } from './upload';

/** Where a refused save belongs: on the handle field, or in the banner above the form. */
export type SaveFailure = { handle?: string; banner?: string };

/** The Hub answers 400 "handle is already taken" when another account has the handle (`user-profile.service.ts`). */
const HANDLE_TAKEN = /handle is already taken/i;

export function saveFailure(error: unknown): SaveFailure {
  if (isApiError(error)) {
    if (HANDLE_TAKEN.test(error.message)) return { handle: 'That handle is taken. Try another.' };
    if (error.kind === 'network' || error.kind === 'validation' || error.status === 200) return { banner: error.message };
  }
  return { banner: 'Your profile did not save. Try again.' };
}

/** A read that failed: the server's own sentence for no connection, a plain one for the rest. */
export function readFailure(error: unknown): string {
  return isApiError(error) && (error.kind === 'network' || error.status === 200) ? error.message : 'Something went wrong. Try again.';
}

/** A picture that did not go up: no connection, or the storage refused it; whatever else the Hub says, the same plain sentence. */
export function uploadFailure(error: unknown): string {
  return isApiError(error) && (error.kind === 'network' || error.code === UPLOAD_FAILED) ? error.message : 'Your picture did not upload. Try again.';
}
