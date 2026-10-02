import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';

/**
 * What a development-only route (a preview or the component gallery) shows in a
 * release build: it sends the visitor to where the app opens for them. Home
 * exists only for a signed-in session, so a signed-out visitor goes to sign in
 * instead of to a route that is not there.
 */
export function LeaveDevRoute() {
  const { status } = useSession();
  if (status === 'restoring') return null;
  return <Redirect href={status === 'signedIn' ? '/' : '/sign-in'} />;
}
