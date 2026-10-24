import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { MatterScreen } from '@/features/legal/matter/MatterScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';

/**
 * S20 to S23 (`/legal-matter?id=<request id>`): one legal matter, tracked: the consultation booked (S20), the quote to sign (S21), pay to start (S22) and the documents
 * delivered (S23). Signed in only.
 */
export default function LegalMatterRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/legal" />;

  return (
    <MatterScreen
      requestId={String(id)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/legal'))}
      wallet={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: () => router.dismissTo('/wallet'),
      }}
    />
  );
}
