import { Redirect } from 'expo-router';

import { useSession } from '@/api/session';
import { finishTierOffer, useTierOfferCloseButton } from '@/features/tier-offer/offerStep';
import { TierOfferScreen } from '@/features/tier-offer/TierOfferScreen';

/**
 * The tier offer (`/tier-offer`, TIER-OFFER, R-94), shown once right after sign-up by the root layout's guard, after the sign-up's own steps and
 * before Home. The close X (or "Not now", by the admin setting) ends it and Home opens; a tier's Subscribe ends it and the checkout (VF6) opens
 * on top of Home. It never blocks anything: the guard drops it as soon as either is pressed. Signed in only; the route graph guards it.
 */
export default function TierOfferRoute() {
  const { status } = useSession();
  const closeButton = useTierOfferCloseButton();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <TierOfferScreen
      closeButton={closeButton}
      onClose={() => finishTierOffer()}
      onSubscribe={(tierId, currency) => finishTierOffer({ tierId, kind: currency === 'NGN' ? 'tier' : 'tiers' })}
    />
  );
}
