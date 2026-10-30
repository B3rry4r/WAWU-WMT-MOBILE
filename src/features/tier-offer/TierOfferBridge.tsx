import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { takeTierOfferCheckout } from './offerStep';

/**
 * Opens what Subscribe asked for once the tier offer is gone (TIER-OFFER, R-94). The offer screen is dropped from the route graph the moment
 * the step ends, so it cannot push the checkout itself; this has no screen and stays mounted. The push waits one turn so it lands on the
 * screen that took the offer's place (Home), and Back from the checkout returns there.
 */
export function TierOfferBridge({ checkout }: { checkout: { tierId: string; kind: 'tier' } | null }) {
  const router = useRouter();
  const ready = Boolean(useRootNavigationState()?.key);
  useEffect(() => {
    if (!ready || !checkout) return undefined;
    const timer = setTimeout(() => {
      const next = takeTierOfferCheckout();
      if (!next) return;
      // Everyone goes to the store checkout (R-86), whatever currency they are billed in: the store charges in its own.
      router.push({
        pathname: '/checkout',
        params: { kind: 'tier', tier: next.tierId },
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [ready, checkout, router]);
  return null;
}
