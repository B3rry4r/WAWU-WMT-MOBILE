import { useRouter } from 'expo-router';

import { PayoutAccountScreen } from '@/features/wallet/PayoutAccountScreen';

/**
 * A21 · Payout bank (`/payout-account`). Signed in only: the payout account
 * is kept with the wallet. The route graph lists it under the signed-in guard
 * (SHARED-05), so a signed-out visit never reaches it. After a save it goes back where it came from, unless
 * the bank's name is not the BVN name: then it stays, so the flag is seen.
 */
export default function PayoutAccountRoute() {
  const router = useRouter();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <PayoutAccountScreen
      onBack={back}
      onSaved={(account) => {
        if (account.matchesBvnName !== false && router.canGoBack()) router.back();
      }}
    />
  );
}
