import { Redirect, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PATH, OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { WalletOpenScreen } from '@/features/open-wallet/WalletOpenScreen';

/**
 * A8 · Wallet open: the account Open your wallet (R-6) just opened, in place
 * of A26 to A7 (`useOpenWalletWay().opened`), on top of whatever started the
 * flow. Its button opens A9 and A10 on top of it; Done (a PIN already set)
 * goes back to where the flow started. Signed out, the visitor goes where the
 * app opens for them.
 */
export default function OpenWalletAccountRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  const { status } = useSession();
  const createPin = useCallback(() => router.push(OPEN_WALLET_PIN_PATH), [router]);
  const noWallet = useCallback(() => router.replace(OPEN_WALLET_PATH), [router]);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <WalletOpenScreen onCreatePin={createPin} onDone={way.leave} onNoWallet={noWallet} />;
}
