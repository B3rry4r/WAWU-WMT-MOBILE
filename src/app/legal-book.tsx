import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { BookScreen } from '@/features/legal/book/BookScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';

/**
 * S18 · Book, S19 · Pay (over it) and S25 · No slots (`/legal-book?requestId=<id>`). Signed in only. Paying leads to Open your wallet (no wallet yet, R-6), A9 (no
 * PIN yet), the Wallet tab (add money) and, once the consultation is paid or an in-person one is asked for, the matter (S20), which takes this page's place so Back
 * never returns to a Pay button.
 */
export default function LegalBookRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!requestId) return <Redirect href="/legal" />;

  return (
    <BookScreen
      requestId={String(requestId)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/legal'))}
      onBooked={() => router.replace({ pathname: '/legal-matter', params: { id: String(requestId) } })}
      wallet={{
        onOpenWallet: entry.open,
        onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
        onForgotPin: () => router.push('/reset-pin'),
        onAddMoney: () => router.dismissTo('/wallet'),
      }}
    />
  );
}
