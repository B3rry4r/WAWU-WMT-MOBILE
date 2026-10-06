import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { PayoutAccountScreen } from '@/features/wallet/PayoutAccountScreen';

/**
 * A21 · Payout bank (`/payout-account`). Signed in only: the payout account
 * is kept with the wallet. The route graph does not list it under the signed-in
 * guard yet (SHARED-CHANGES WALLET-11 #2), so a signed-out visit is sent to the
 * welcome screen here. After a save it goes back where it came from, unless
 * the bank's name is not the BVN name: then it stays, so the flag is seen.
 */
export default function PayoutAccountRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

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
