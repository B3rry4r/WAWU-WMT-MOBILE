import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';

/**
 * `https://wawuafrica.com/activate` opened in the installed app (LINKS-01, W3): the "Set My Password" button in the activation
 * email wawu-id sends for an account an admin set up. Nothing is drawn and nothing is read from the address (the token and the
 * email in it are not used here): signed out lands on sign-in, where the person signs in or asks for a new password; signed in
 * lands on Home.
 */
export default function ActivateRoute() {
  const { status } = useSession();
  if (status === 'restoring') return null;
  return <Redirect href={status === 'signedIn' ? '/' : '/sign-in'} />;
}
