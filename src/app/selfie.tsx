import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_SELFIE_PATH } from '@/features/open-wallet/entry';

/**
 * `https://wawuafrica.com/selfie` opened in the installed app (LINKS-01): the hosted selfie page's way back. Nothing
 * is drawn and nothing is read from the address (it carries no result): a signed-in person is taken to the selfie
 * step, which asks the Hub where the selfie stands (A6, A7); signed out, to the welcome screen.
 */
export default function SelfieReturnRoute() {
  const { status } = useSession();
  if (status === 'restoring') return null;
  return <Redirect href={status === 'signedIn' ? OPEN_WALLET_SELFIE_PATH : '/welcome'} />;
}
