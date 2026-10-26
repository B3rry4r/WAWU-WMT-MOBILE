import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AccountsScreen } from '@/features/wallet/accounts/AccountsScreen';

/** Accounts and currencies (`/accounts`): opened from Wallet settings, which draws its row only with a wallet open. Signed in only. */
export default function AccountsRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <AccountsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/wallet-settings'))} />;
}
