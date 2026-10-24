import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { DashboardScreen } from '@/features/creator/DashboardScreen';
import { OPEN_WALLET_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * M18 · Creator dashboard (`/creator`), opened from the Me menu (Z1). Paid messages opens I21 (`/paid-message-settings`), the wallet row
 * opens Open your wallet (A26, `/open-wallet`) until a wallet is open, Earnings opens W39 (`/earnings`) and My content opens M28
 * (`/library`) and Host a community opens I32 (`/community/new`); each returns here with Back. Creator accounts only: anyone else who opens it is sent Home, as the Create routes do.
 */
export default function CreatorRoute() {
  const router = useRouter();
  const { status } = useSession();
  const gate = useCreatorGate(status === 'signedIn');
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (gate !== 'creator') return gate === 'checking' ? null : <Redirect href="/" />;

  return (
    <DashboardScreen
      onBack={leave}
      onOpenPaid={() => router.push('/paid-message-settings')}
      onOpenWallet={() => router.push(OPEN_WALLET_PATH)}
      onOpenEarnings={() => router.push('/earnings')}
      onOpenLibrary={() => router.push('/library')}
      onOpenCommunity={() => router.push('/community/new')}
    />
  );
}
