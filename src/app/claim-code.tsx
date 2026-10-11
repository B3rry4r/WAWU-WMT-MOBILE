import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/api/session';
import { ClaimCodeScreen } from '@/features/claim/ClaimCodeScreen';
import { rememberClaimVisit } from '@/features/claim/signInReturn';

/**
 * Claim an event registration's plan with its launch access code (JOIN-03, R-48): `/claim-code`. Settings' "Access
 * code" row opens it. A signed-in route like Settings, and not named in the layout's guarded groups, as the other
 * Settings screens are. Signed out (a typed address, or a session that ended while it was open) it sends the visitor to
 * sign-in and remembers the visit, so the sign-in comes back here (round 3, N14); nothing is drawn while the session
 * is read.
 */
export default function ClaimCodeRoute() {
  const router = useRouter();
  const { status } = useSession();
  useEffect(() => {
    if (status === 'signedOut') rememberClaimVisit();
  }, [status]);
  if (status === 'restoring') return null;
  if (status === 'signedOut') return <Redirect href="/sign-in" />;
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <ClaimCodeScreen onBack={leave} onDone={leave} />;
}
