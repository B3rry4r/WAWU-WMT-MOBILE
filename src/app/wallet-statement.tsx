import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { StatementScreen } from '@/features/wallet/statements/StatementScreen';

/**
 * W38 · Statement (`/wallet-statement`). Wallet settings' Statements row opens it (W35). Signed in only: the route
 * graph does not guard it (SHARED-CHANGES WALLET-06 R1), so a signed-out visit is sent to the welcome screen here, as
 * the other wallet routes do. After Send statement the person is back on W35, which shows the toast.
 */
export default function WalletStatementRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/wallet-settings'));
  return <StatementScreen onBack={back} onSent={back} onOpenWallet={entry.open} />;
}
