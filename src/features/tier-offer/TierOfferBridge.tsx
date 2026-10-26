import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { takeTierOfferCheckout } from './offerStep';

/**
 * Opens what Subscribe asked for once the tier offer is gone (TIER-OFFER, R-94). The offer screen is dropped from the route graph the moment
 * the step ends, so it cannot push the checkout itself; this has no screen and stays mounted. The push waits one turn so it lands on the
 * screen that took the offer's place (Home), and Back from the checkout returns there.
 */
export function TierOfferBridge({ checkout }: { checkout: { tierId: string; kind: 'tier' | 'tiers' } | null }) {
  const router = useRouter();
  const ready = Boolean(useRootNavigationState()?.key);
  useEffect(() => {
    if (!ready || !checkout) return undefined;
    const timer = setTimeout(() => {
      const next = takeTierOfferCheckout();
      if (!next) return;
      // A person billed in dollars is led to the tiers sheet, which says plainly what is open; everyone else goes to the checkout.
      if (next.kind === 'tiers') router.push('/tiers');
      else
        router.push({
          pathname: '/checkout',
          params: { kind: 'tier', tier: next.tierId },
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [ready, checkout, router]);
  return null;
}
