import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';
import { useSignupGate } from '@/features/auth/signupGate';
import { useStartHref } from '@/features/shell/startHref';

/**
 * What a development-only route (a preview or the component gallery) shows in a
 * release build: it sends the visitor to where the app opens for them. Home
 * exists only for a signed-in session, so a signed-out visitor goes to the
 * welcome screen, where the app opens for them, instead of to a route that is
 * not there. Signed in part way through sign-up, "where the app opens" is the step they have not finished (WEBAPP-09 W1).
 */
export function LeaveDevRoute() {
  const { status } = useSession();
  const gate = useSignupGate();
  const start = useStartHref();
  if (status === 'restoring' || (status === 'signedIn' && gate.phase !== 'ready')) return null;
  // A signed-in user whose sign-up has a step left goes there: the tabs are not in the route graph for them.
  return <Redirect href={status === 'signedIn' ? start : '/welcome'} />;
}
