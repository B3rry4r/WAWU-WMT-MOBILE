import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { VerificationScreen } from '@/features/verification/VerificationScreen';

/**
 * Verification (`/verification`, M15 to M17). The Me menu's Verification row opens it. Signed in only: the route graph
 * does not guard it, so a signed-out visit is sent to the welcome screen here, as the wallet routes do.
 */
export default function VerificationRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <VerificationScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} onOpenWallet={entry.open} />;
}
