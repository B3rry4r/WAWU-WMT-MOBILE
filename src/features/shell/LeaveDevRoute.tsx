import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';
import { useSignupGate } from '@/features/auth/signupGate';

/**
 * What a development-only route (a preview or the component gallery) shows in a
 * release build: it sends the visitor to where the app opens for them. Home
 * exists only for a signed-in session, so a signed-out visitor goes to the
 * welcome screen, where the app opens for them, instead of to a route that is
 * not there. Signed in on the email step, "where the app opens" is that step.
 */
export function LeaveDevRoute() {
  const { status } = useSession();
  const gate = useSignupGate();
  if (status === 'restoring' || (status === 'signedIn' && gate.phase !== 'ready')) return null;
  // A signed-in user whose sign-up still has the email step goes there: the tabs are not in the route graph for them.
  return <Redirect href={status === 'signedIn' ? (gate.needsEmail ? '/email-code' : '/') : '/welcome'} />;
}
