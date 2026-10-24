import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { useSystemBack } from '@/features/professionals/parts';
import { ReceiveScreen } from '@/features/wallet/fx/ReceiveScreen';

/** W22 · Crypto · receive (`/crypto-receive`, `coin` names the coin to start on), opened from Receive on the Crypto tab. Signed in only. */
export default function CryptoReceiveRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { coin } = useLocalSearchParams<{ coin?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return <ReceiveScreen coin={Array.isArray(coin) ? coin[0] : coin} onBack={leave} />;
}
