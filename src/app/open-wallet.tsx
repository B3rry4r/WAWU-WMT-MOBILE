import { useRouter } from 'expo-router';

import { OPEN_WALLET_DETAILS_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { OpenWalletScreen } from '@/features/open-wallet/OpenWalletScreen';
import { ReviewResume } from '@/features/open-wallet/ReviewResume';
import { LoadingView } from '@/components/Skeleton';
import { AuthFrame } from '@/features/auth/AuthFrame';

/**
 * The first step of Open your wallet (R-6, with A14 as its state). Reached from
 * anything that moves money when there is no wallet yet (`useOpenWalletEntry`).
 * A passed check goes on to A5, pushed on top so this step and the details it
 * keeps stay put. A person whose details the Hub already has (the bank is
 * reviewing them) is taken to where the review stands instead (KYC-06:
 * A26, A28 or A29). Signed in only, by the route graph (SHARED-05): signed
 * out, there is no wallet to open.
 */
export default function OpenWalletRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  return (
    <ReviewResume
      onDocuments={way.needsDocuments}
      onChecking={way.checking}
      onRejected={way.rejected}
      fallback={
        <AuthFrame testID="open-wallet-resume" bare>
          <LoadingView label="Loading your account">{null}</LoadingView>
        </AuthFrame>
      }
    >
      <OpenWalletScreen
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        onContinue={() => router.push(OPEN_WALLET_DETAILS_PATH)}
      />
    </ReviewResume>
  );
}
