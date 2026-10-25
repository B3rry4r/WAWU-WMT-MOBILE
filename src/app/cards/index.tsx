import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { CardsScreen } from '@/features/cards/CardsScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';

/**
 * The person's cards (`/cards`), with W29 as its empty state. The Wallet tab's card row (W1) and Wallet settings' Cards row (W35) open it.
 * Signed in only: the route graph does not guard it, so a signed-out visit is sent to the welcome screen here, as the other wallet routes do.
 */
export default function CardsRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <CardsScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/wallet'))}
      onDone={(id) => router.replace({ pathname: '/cards/[id]', params: { id } })}
      onOpenCard={(id) => router.push({ pathname: '/cards/[id]', params: { id } })}
      onGetCard={() => router.push('/cards/new')}
      onOpenWallet={entry.open}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
    />
  );
}
