import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { DeleteAccountScreen } from '@/features/delete-account/DeleteAccountScreen';
import { useSystemBack } from '@/features/professionals/parts';

/** Z6 · Delete account (`/settings/delete-account`). Z2's Delete account row opens it. Withdraw opens W17; Continue opens Z7. Signed in only. */
export default function DeleteAccountRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <DeleteAccountScreen onBack={leave} onWithdraw={() => router.push('/withdraw')} onContinue={() => router.push('/settings/delete-account/confirm')} />;
}
