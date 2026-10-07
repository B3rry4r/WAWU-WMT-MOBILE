import { isApiError } from '@/api/errors';

import { fieldOfMessage, mediaHint, type FormField } from './form';
import { UPLOAD_FAILED } from './upload';

/** Where a refused save belongs: under the field the Hub's sentence is about, or in the banner above the form. `full` is a profile that cannot take another work. */
export type SaveFailure = { field?: FormField; message?: string; banner?: string; full?: true };

/** What M36's cap notice says: the way out is a work's own Remove (M35), so that is what it names. */
export const PROFILE_FULL = 'Your profile already shows as many works as it can. To add another, open one of your works and choose Remove.';

/** The Hub names the cap in its own words ("A profile can feature at most 50 works. Remove one to add another."). */
const CAP_SENTENCE = /\bat most \d+ works\b/i;

/**
 * The request validator's own sentences ("media must contain no more than 8 elements", "year must be an integer number")
 * start with a lower-case key. They are written for a developer, so they are never shown: each one is replaced here with
 * the app's words for that field. The Hub's service sentences start with a capital ("Year must be a year from 1950 to 2027").
 */
const RAW_VALIDATOR = /(?:^|\. )(media|title|role|year|client|link|category|description)(?:\.\d+)? (?:must|should)\b/;

export function saveFailure(error: unknown): SaveFailure {
  if (isApiError(error)) {
    if (error.kind === 'validation') {
      if (CAP_SENTENCE.test(error.message)) return { banner: PROFILE_FULL, full: true };
      const raw = RAW_VALIDATOR.exec(error.message);
      if (raw) {
        const key = raw[1];
        if (key === 'media') return { banner: `Too many files. ${mediaHint}` };
        if (key === 'year') return { field: 'year', message: 'Enter the year as four digits.' };
        return { field: key as FormField, message: 'Check this and try again.' };
      }
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

/** A work that would not come off: already gone (the same result as removing it), or a sentence to show with the sheet still open. */
export function removeFailure(error: unknown): { gone: true; message?: undefined } | { gone?: false; message: string } {
  if (isApiError(error)) {
    if (error.kind === 'not_found') return { gone: true };
    if (error.kind === 'network') return { message: error.message };
  }
  return { message: 'The work was not removed. Try again.' };
}
