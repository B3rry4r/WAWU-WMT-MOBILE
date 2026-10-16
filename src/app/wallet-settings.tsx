import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { WalletSettingsScreen } from '@/features/wallet/settings/WalletSettingsScreen';

/**
 * W35 · Wallet settings (`/wallet-settings`). The Wallet tab's settings icon (W1) and Settings' Wallet and PIN row
 * (Z2) open it. Signed in only: the route graph does not guard it (SHARED-CHANGES WALLET-06 R1), so a signed-out visit
 * is sent to the welcome screen here, as the other wallet routes do.
 */
export default function WalletSettingsRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  return (
    <WalletSettingsScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      onOpenPin={() => router.push('/change-pin')}
      onCreatePin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onOpenWallet={entry.open}
      onOpenStatements={() => router.push('/wallet-statement')}
    />
  );
}
