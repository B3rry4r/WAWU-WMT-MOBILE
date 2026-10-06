import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_DETAILS_PATH } from '@/features/open-wallet/entry';
import { OpenWalletScreen } from '@/features/open-wallet/OpenWalletScreen';

/**
 * A26 (with A14 as its state): the first step of Open your wallet (R-6).
 * Reached from anything that moves money when there is no wallet yet
 * (`useOpenWalletEntry`). A passed check goes on to A5, pushed on top so A26
 * and the details it keeps stay put. Signed out, there is no wallet to open,
 * so the visitor goes where the app opens for them.
 */
export default function OpenWalletRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <OpenWalletScreen
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContinue={() => router.push(OPEN_WALLET_DETAILS_PATH)}
    />
  );
}
