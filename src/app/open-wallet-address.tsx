import { useRouter } from 'expo-router';

import { useDropDraftOnExit, useOpenWalletWay } from '@/features/open-wallet/leave';
import { ProofOfAddressScreen } from '@/features/open-wallet/ProofOfAddressScreen';

/** A27 · Proof of address (KYC-06): pushed on top of A26. Submit sends the documents, then A28 takes the place of both. */
export default function OpenWalletAddressRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  useDropDraftOnExit();
  return (
    <ProofOfAddressScreen
      onBack={() => (router.canGoBack() ? router.back() : way.leave())}
      onSubmitted={way.checking}
      onChecking={way.checking}
      onOpened={way.opened}
      onDetails={way.details}
    />
  );
}
