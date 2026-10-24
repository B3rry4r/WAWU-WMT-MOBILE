import { isApiError } from '@/api/errors';

import { UPLOAD_FAILED } from './upload';

/** Where a refused save belongs: on the handle field, or in the banner above the form. */
export type SaveFailure = { handle?: string; banner?: string };

/**
 * `PUT /users/me/handle` refused the username: taken (409, ignoring case) or not allowed (400: a word kept back, a
 * name with nothing to read, a bad shape). The message is the Hub's own sentence, shown under the handle field.
 */
export class HandleRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandleRefused';
  }
}

/** What a failed username change becomes: a refusal that belongs on the field, or the error itself for the banner. */
export function handleFailure(error: unknown): unknown {
  return isApiError(error) && (error.kind === 'conflict' || error.kind === 'validation') ? new HandleRefused(error.message) : error;
}

export function saveFailure(error: unknown): SaveFailure {
  if (error instanceof HandleRefused) return { handle: error.message };
  if (isApiError(error)) {
    if (error.kind === 'network' || error.kind === 'validation' || error.status === 200) return { banner: error.message };
  }
  return { banner: 'Your profile did not save. Try again.' };
}

/** A read that failed: the server's own sentence for no connection, a plain one for the rest. */
export function readFailure(error: unknown): string {
  return isApiError(error) && (error.kind === 'network' || error.status === 200) ? error.message : 'Something went wrong. Try again.';
}

/** The app's own sentence when the photo library failed, or the chosen photo could not be read (lead ruling after the verifier, D1). */
export const PICK_FAILED = "We couldn't open that photo. Try another one.";

/** A picture that did not go up: no connection, or the storage refused it; whatever else the Hub says, the same plain sentence. */
export function uploadFailure(error: unknown): string {
  return isApiError(error) && (error.kind === 'network' || error.code === UPLOAD_FAILED) ? error.message : 'Your picture did not upload. Try again.';
}
