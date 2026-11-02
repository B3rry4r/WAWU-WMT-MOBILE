import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { GetCardScreen } from '@/features/cards/GetCardScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';

/** W29 · Get a card (`/cards/new`), from the list's "Get another card". A card made replaces this screen with its own. */
export default function NewCardRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <GetCardScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/cards'))}
      onDone={(id) => router.replace({ pathname: '/cards/[id]', params: { id } })}
      onOpenWallet={entry.open}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
    />
  );
}
