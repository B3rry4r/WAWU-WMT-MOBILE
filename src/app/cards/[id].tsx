import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { CardScreen } from '@/features/cards/CardScreen';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';

/** W31 · Card detail, W32 · Card frozen (`/cards/<id>`). Opened from the card list, or right after a card is made. */
export default function CardRoute() {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const { status } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/cards'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (typeof id !== 'string' || id === '') return <Redirect href="/cards" />;
  return (
    <CardScreen
      id={id}
      onBack={leave}
      onGone={() => router.replace('/cards')}
      onOpenWallet={entry.open}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
      onForgotPin={() => router.push('/reset-pin')}
    />
  );
}
