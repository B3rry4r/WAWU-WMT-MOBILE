import { isApiError } from '@/api/errors';

import { fieldOfMessage, type FormField } from './form';
import { UPLOAD_FAILED } from './upload';

/** Where a refused save belongs: under the field the Hub's sentence is about, or in the banner above the form. */
export type SaveFailure = { field?: FormField; message?: string; banner?: string };

export function saveFailure(error: unknown): SaveFailure {
  if (isApiError(error)) {
    if (error.kind === 'validation') {
      const field = fieldOfMessage(error.message);
      return field ? { field, message: error.message } : { banner: error.message };
    }
    if (error.kind === 'network' || error.status === 200) return { banner: error.message };
  }
  return { banner: 'Your work did not save. Try again.' };
}

/** A read that failed: the server's own sentence for no connection, a plain one for the rest. */
export function readFailure(error: unknown): string {
  return isApiError(error) && (error.kind === 'network' || error.status === 200) ? error.message : 'Something went wrong. Try again.';
}

const HTTP_TOO_LARGE = 413;
/** The Hub names a file type it does not take with "... is not allowed in <folder>. Allowed: ..."; the folder is its own name, not words for a person. */
const TYPE_REFUSED = /not allowed/i;

/**
 * A file that did not go up: no connection, the storage refusing it, a file the Hub says is too big (413) or
 * of a kind it does not take, or anything else in one plain sentence. The Hub's own sentences name its upload
 * folder, so those two are written here in words for a person.
 */
export function uploadFailure(error: unknown): string {
  if (isApiError(error)) {
    if (error.kind === 'network' || error.code === UPLOAD_FAILED) return error.message;
    if (error.status === HTTP_TOO_LARGE) return 'That file is too big to add.';
    if (error.kind === 'validation' && TYPE_REFUSED.test(error.message)) return 'That kind of file cannot be added. Choose a photo or a video.';
  }
  return 'That file did not upload. Try again.';
}
