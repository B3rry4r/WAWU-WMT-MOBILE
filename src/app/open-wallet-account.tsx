import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { OPEN_WALLET_PATH, OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { WalletOpenScreen } from '@/features/open-wallet/WalletOpenScreen';

/**
 * A8 · Wallet open: the account Open your wallet (R-6) just opened, in place
 * of A26 to A7 (`useOpenWalletWay().opened`), on top of whatever started the
 * flow. Its button opens A9 and A10 on top of it; Done (a PIN already set)
 * goes back to where the flow started. Signed in only, by the route graph
 * (SHARED-05).
 */
export default function OpenWalletAccountRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  const createPin = useCallback(() => router.push(OPEN_WALLET_PIN_PATH), [router]);
  const noWallet = useCallback(() => router.replace(OPEN_WALLET_PATH), [router]);
  return <WalletOpenScreen onCreatePin={createPin} onDone={way.leave} onNoWallet={noWallet} />;
}
