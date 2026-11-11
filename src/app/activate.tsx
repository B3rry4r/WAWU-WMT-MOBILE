import { activateRequest } from '@/api/identity';
import { LinkPasswordRoute } from '@/features/auth/LinkPasswordRoute';
import type { ResetPasswordCopy } from '@/features/auth/ResetPasswordScreen';

/** The words of the activation form: the same screen as the reset link's, for a first password. */
const COPY: ResetPasswordCopy = {
  navTitle: 'Set your password',
  saveLabel: 'Set password',
  doneTitle: 'Password set',
  doneMessage: 'Sign in with your new password.',
  invalidMessage: 'It has expired or was already used.\nAsk for a reset link instead.',
};

/**
 * `https://usewmt.com/activate?token=...&email=...`, the "Set My Password" button in the mail WAWU ID sends for an account an admin
 * set up (APP-RESET, R-133 points 1 and 4; it only signed the person in or sent them to sign-in before, and never read the token).
 * The person chooses their first password and `POST /auth/activate` spends the token. A token that is expired, already used, or
 * for an account that already has a password gets one plain sentence and the way to Forgot password.
 */
export default function ActivateRoute() {
  return <LinkPasswordRoute save={(link, password) => activateRequest(link.token, link.email, password)} copy={COPY} />;
}
