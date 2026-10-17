import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { TiersScreen } from '@/features/verify/TiersScreen';

/**
 * VF5 · Make it official, and VF5b · Upgrade (`/tiers`). "See tiers" on the host form's needs-a-tier page (E21), "Get verified" on the
 * Create hub (M19), the tier badge on Me, "Publish" for a person with no tier (VERIFY-04) and "Upgrade" on Your tier (VF14) open it.
 * Signed in only. Continue opens the checkout (VF6) with the tier chosen; closing returns to where it was opened from.
 */
export default function TiersRoute() {
  const router = useRouter();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <TiersScreen
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onContinue={(kind, tier) => router.push({ pathname: '/checkout', params: { kind, tier } })}
    />
  );
}
