import { useRouter } from 'expo-router';

import { ClaimCodeScreen } from '@/features/claim/ClaimCodeScreen';

/**
 * Claim an event registration's plan with its launch access code (JOIN-03, R-48): `/claim-code`. Settings' "Access
 * code" row opens it. A signed-in route like Settings, and not named in the layout's guarded groups, as the other
 * Settings screens are.
 */
export default function ClaimCodeRoute() {
  const router = useRouter();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <ClaimCodeScreen onBack={leave} onDone={leave} />;
}
