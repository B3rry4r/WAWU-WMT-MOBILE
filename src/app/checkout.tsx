import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { CheckoutScreen } from '@/features/verify/CheckoutScreen';

const KINDS = ['tier', 'renew', 'upgrade'] as const;

/**
 * VF6 · Checkout (`/checkout?kind=<tier|renew|upgrade>&tier=<id>`). Opened by VF5's Continue, VF14's Renew and VF5b's Upgrade. A tier is
 * bought in the store sheet (R-86). Signed in only. Back returns to the tiers; a tier the Hub has granted opens VF7 in its place.
 */
export default function CheckoutRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { kind, tier } = useLocalSearchParams<{ kind?: string; tier?: string }>();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const which = KINDS.find((k) => k === kind);
  if (!which || !tier) return <Redirect href="/tiers" />;

  return (
    <CheckoutScreen
      kind={which}
      tierId={tier}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/tiers'))}
      onPaid={(granted) => router.replace({ pathname: '/tier-done', params: { tier: granted } })}
    />
  );
}
