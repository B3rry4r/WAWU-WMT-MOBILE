import { signupEmailConfirmRequest } from '@/api/identity';
import { isApiError } from '@/api/errors';
import { noteContactProved } from '@/features/claim/freshToken';
import { authed } from '@/features/auth/signupApi';

/**
 * Confirming the email of an account that is already signed up (G-486): the same two calls the sign-up wizard's email step makes
 * (`POST /auth/signup/email/start` mails a code to the account's own address, `/confirm` checks it), without the wizard's progress.
 * The mailing is `startEmailCode` in `features/auth/signupFlow`; this is the checking half.
 */

/** True once the Hub says the email is proven: the code was right, or it was proven already. Anything else is thrown for the code screen to word. */
export async function confirmAccountEmail(code: string): Promise<void> {
  try {
    await authed((token) => signupEmailConfirmRequest(token, code));
  } catch (error) {
    if (isApiError(error) && error.code === 'EMAIL_ALREADY_PROVEN') return;
    throw error;
  }
  // JOIN-03: the access token in hand was issued before this proof; a claim renews it first.
  await noteContactProved();
}

/** The start answered "already proven": nothing to confirm. */
export const alreadyProven = (error: unknown): boolean => isApiError(error) && error.code === 'EMAIL_ALREADY_PROVEN';

/** The account holds no email address to confirm. */
export const noEmail = (error: unknown): boolean => isApiError(error) && error.code === 'EMAIL_NOT_SET';
