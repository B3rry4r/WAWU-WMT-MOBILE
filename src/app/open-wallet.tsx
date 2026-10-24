import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';

import { OPEN_WALLET_DETAILS_PATH } from '@/features/open-wallet/entry';
import { useOpenWalletWay } from '@/features/open-wallet/leave';
import { OpenWalletScreen } from '@/features/open-wallet/OpenWalletScreen';
import { ResumeFallback } from '@/features/open-wallet/ResumeFallback';
import { ReviewResume } from '@/features/open-wallet/ReviewResume';

/**
 * A31 · BVN and NIN, the first of four steps of Complete your account (R-6, with A14 as its state). Reached from
 * Home's flag (A30) and from anything that moves money when there is no wallet yet (`useOpenWalletEntry`).
 * A passed check (or, under the review opening, the numbers held) goes on to A5, pushed on top so this step and
 * the details it keeps stay put. A person whose details the Hub already has (the bank is
 * reviewing them) is taken to where the review stands instead (KYC-06:
 * A26, A28 or A29). Signed in only, by the route graph (SHARED-05): signed
 * out, there is no wallet to open.
 */
export default function OpenWalletRoute() {
  const router = useRouter();
  const way = useOpenWalletWay();
  // `again`: the person was sent here to add their details again (A27, A29), so the review is not resumed.
  const { again } = useLocalSearchParams<{ again?: string }>();
  // A31 stays mounted under A5, A26 and A27: only while it is in front may it send a person to where the review stands.
  const focused = useIsFocused();
  return (
    <ReviewResume
      skip={again === '1'}
      active={focused}
      onDocuments={way.needsDocuments}
      onSelfie={way.selfie}
      onChecking={way.checking}
      onRejected={way.rejected}
      fallback={<ResumeFallback />}
    >
      <OpenWalletScreen
        onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        onContinue={() => router.push(OPEN_WALLET_DETAILS_PATH)}
      />
    </ReviewResume>
  );
}
