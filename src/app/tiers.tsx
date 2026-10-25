import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from '@/api/session';
import { TiersScreen } from '@/features/verify/TiersScreen';

/**
 * VF5 · Make it official, and VF5b · Upgrade (`/tiers`). "See tiers" on the host form's needs-a-tier page (E21), "Get verified" on the
 * Create hub (M19), the tier badge on Me, "Publish" for a person with no tier (VERIFY-04) and "Upgrade" on Your tier (VF14) open it.
 * Signed in only. Continue closes the sheet first and opens the checkout (VF6) with the tier chosen once the sheet is closed: the sheet
 * is a Modal, which sits above every screen, so a checkout pushed under an open one cannot be paid or tapped. Coming back from the
 * checkout opens the sheet again with the choice as it was. Closing returns to where it was opened from.
 */
export default function TiersRoute() {
  const router = useRouter();
  const { status } = useSession();
  const [going, setGoing] = useState<{ kind: 'tier' | 'upgrade'; tier: string } | null>(null);
  // A person billed in dollars is led to the wallet to add a dollar account: the sheet closes first, as it does for the checkout.
  const [toWallet, setToWallet] = useState<string | null>(null);
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  // The sheet is open whenever this screen is the one in front; the checkout it left for is on top while `going` is set.
  useFocusEffect(
    useCallback(() => {
      setGoing(null);
      setToWallet(null);
    }, []),
  );
  // Runs after the render that closed the sheet, so the checkout is pushed with the sheet already closing.
  useEffect(() => {
    if (going) routerRef.current.push({ pathname: '/checkout', params: { kind: going.kind, tier: going.tier } });
  }, [going]);
  useEffect(() => {
    // The Wallet tab takes the currency: opening the wallet with that first account (R-87), or the add-a-currency step of one that is open.
    if (toWallet) routerRef.current.push({ pathname: '/wallet', params: { add: toWallet } });
  }, [toWallet]);

  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <TiersScreen
      open={going === null && toWallet === null}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      // A second tap while the sheet is closing keeps the first choice: one push, never two.
      onContinue={(kind, tier) => setGoing((already) => already ?? { kind, tier })}
      onAddAccount={(currency) => setToWallet(currency)}
    />
  );
}
