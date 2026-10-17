import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import { EarningsScreen } from '@/features/wallet/earnings/EarningsScreen';

/**
 * W39 · Earnings (`/earnings`), a creator's: what was earned, split by stream and by piece. Opened from the Creator dashboard
 * (ME-07 adds its row, R-47); the Hub answers any signed-in person, and someone who has earned nothing sees the empty state.
 * Signed in only: the route graph does not guard it (the same as the other wallet routes), so a signed-out visit is sent to
 * the welcome screen here. Back goes to where it was opened from, or to the Wallet tab when it was opened on its own; Android's
 * back button does the same. Open your wallet is the same entry every money screen uses.
 */
export default function EarningsRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return <EarningsScreen onBack={leave} onOpenWallet={() => router.push(OPEN_WALLET_PATH)} />;
}
