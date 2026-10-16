import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { RecipientScreen } from '@/features/send/RecipientScreen';
import { payeeParams } from '@/features/send/model';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * W7 · Send · to a WAWU user (`/send`), opened from Send on the Wallet tab and on Home's balance card. Signed in only. Back goes to
 * where it was opened from, or to the Wallet tab when it was opened on its own; Android's back button does the same.
 */
export default function SendRecipientRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <RecipientScreen onBack={leave} onPick={(payee) => router.push({ pathname: '/send/amount', params: payeeParams(payee) })} />;
}
