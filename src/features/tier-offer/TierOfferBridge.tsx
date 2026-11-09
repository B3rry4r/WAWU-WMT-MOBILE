import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { takeTierOfferCheckout, useTierOfferShowing } from './offerStep';

/**
 * Opens what Subscribe asked for once the tier offer is gone (TIER-OFFER, R-94). The offer screen is dropped from the route graph the moment
 * the step ends, so it cannot push the checkout itself; this has no screen and stays mounted. The push waits one turn so it lands on the
 * screen that took the offer's place (Home), and Back from the checkout returns there.
 */
export function TierOfferBridge({ checkout }: { checkout: { tierId: string; kind: 'tier' } | null }) {
  const router = useRouter();
  const ready = Boolean(useRootNavigationState()?.key);
  // WEBAPP-06: a bills address (cold or in-app) is outside the route graph while the offer is up and draws nothing; it goes where "/" goes, the offer.
  const offerUp = useTierOfferShowing();
  const path = usePathname();
  useEffect(() => {
    if (Platform.OS === 'web' && ready && offerUp && path.startsWith('/bills')) router.replace('/tier-offer');
  }, [ready, offerUp, path, router]);
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
