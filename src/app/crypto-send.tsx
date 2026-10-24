import { Redirect, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import { CryptoSendScreen } from '@/features/wallet/fx/CryptoSendScreen';

/** W23 · Crypto · send (`/crypto-send`), opened from Send on the Crypto tab. The review and the PIN open over it; a send the Hub took replaces it with its receipt. Signed in only. */
export default function CryptoSendRoute() {
  const router = useRouter();
  const { status } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <CryptoSendScreen
      onBack={leave}
      onSent={(send) => router.replace({ pathname: '/fx-receipt', params: { kind: 'send', id: send.id } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
