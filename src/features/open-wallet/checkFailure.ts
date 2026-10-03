import { isApiError } from '@/api/errors';
import { identityProblem } from '@/api/walletIdentity';

/** Where a refused BVN check shows on A26. */
export type CheckFailure =
  /** On one field, in the server's own sentence: A14 on the phone, an unknown BVN on the BVN. */
  | { kind: 'field'; field: 'phone' | 'bvn'; message: string }
  /** Above the form: the check did not run, or may not run again yet. */
  | { kind: 'banner'; tone: 'danger' | 'warning'; title: string; body: string }
  /** The step ends: a Naira wallet is not available to this account, or one is already open. */
  | { kind: 'end'; end: 'not_available' | 'wallet_open'; message: string };

/**
 * Turns the BVN check's refusal (KYC-01, contract CONVENTIONS section 8) into
 * what A26 shows. The words are the server's (`message`), never invented
 * here, except the banner titles, which say which kind of trouble it is.
 */
export function checkFailure(error: unknown): CheckFailure {
  const message = isApiError(error) ? error.message : 'Something went wrong. Try again.';
  switch (identityProblem(error)) {
    case 'phone_mismatch':
      return { kind: 'field', field: 'phone', message };
    case 'not_confirmed':
      return { kind: 'field', field: 'bvn', message };
    case 'phone_not_nigerian':
      return { kind: 'end', end: 'not_available', message };
    case 'wallet_open':
      return { kind: 'end', end: 'wallet_open', message };
    case 'limit':
      return { kind: 'banner', tone: 'warning', title: "You've used today's checks", body: message };
    case 'unreachable':
      return { kind: 'banner', tone: 'danger', title: "We couldn't check your BVN", body: message };
    default:
      break;
  }
  if (isApiError(error) && error.kind === 'network') {
    return { kind: 'banner', tone: 'danger', title: 'No connection', body: message };
  }
  if (isApiError(error) && error.kind === 'rate_limited') {
    return { kind: 'banner', tone: 'warning', title: 'Too many tries', body: 'Wait a minute, then try again.' };
  }
  return { kind: 'banner', tone: 'danger', title: "We couldn't check your BVN", body: message };
}
