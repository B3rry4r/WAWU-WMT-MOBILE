import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';

/**
 * `https://wawuafrica.com/receipt/<code>` opened in the installed app (LINKS-01, H6): a receipt's check address, on its own
 * path so an invite claim (`/r/<code>`) is never handed a receipt code. The app has no screen that finds a receipt by its code
 * (a receipt is read by its transaction, W27, and only its owner can), so nothing is drawn and the code is not read: signed in
 * lands on the wallet's history, where the receipt is; signed out, on the welcome screen.
 */
export default function ReceiptLinkRoute() {
  const { status } = useSession();
  if (status === 'restoring') return null;
  return <Redirect href={status === 'signedIn' ? '/transactions' : '/welcome'} />;
}
