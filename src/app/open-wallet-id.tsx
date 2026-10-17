import { useRouter } from 'expo-router';

import { IdDocumentScreen } from '@/features/open-wallet/IdDocumentScreen';
import { OPEN_WALLET_ADDRESS_PATH } from '@/features/open-wallet/entry';
import { useDropDraftOnExit, useOpenWalletWay } from '@/features/open-wallet/leave';

/**
 * A26 · Your ID document (KYC-06): the third step of the review opening, pushed on
 * top of the selfie, or the first thing a person sees when they come back
 * with their details already sent. Signed in only (the route graph, SHARED-05).
 */
export default function OpenWalletIdRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  useDropDraftOnExit();
  return (
    <IdDocumentScreen
      onBack={() => (router.canGoBack() ? router.back() : way.leave())}
      onContinue={() => router.push(OPEN_WALLET_ADDRESS_PATH)}
      onChecking={way.checking}
      onOpened={way.opened}
      onLeave={way.leave}
      onDetails={way.details}
    />
  );
}
