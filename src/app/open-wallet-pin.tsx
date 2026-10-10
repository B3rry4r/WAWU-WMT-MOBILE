import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { CreatePinScreen } from '@/features/open-wallet/CreatePinScreen';
import { OPEN_WALLET_ACCOUNT_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';

/**
 * A9 and A10, creating the transaction PIN: the last step of Open your wallet
 * (R-6), pushed on top of A8. Once the PIN is set the person goes back to
 * where the flow started (`useOpenWalletWay().leave`). Signed out, the visitor
 * goes where the app opens for them.
 */
export default function OpenWalletPinRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  const { status } = useSession();
  const toAccount = useCallback(() => (router.canGoBack() ? router.back() : router.replace(OPEN_WALLET_ACCOUNT_PATH)), [router]);
  const notOpen = useCallback(() => router.replace(OPEN_WALLET_ACCOUNT_PATH), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <CreatePinScreen onBack={toAccount} onDone={way.leave} onNotOpen={notOpen} onLeave={way.leave} onForgotPin={() => router.push('/reset-pin')} />;
}
