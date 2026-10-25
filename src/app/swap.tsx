import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';
import { SwapScreen } from '@/features/wallet/fx/swap/SwapScreen';

const one = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/**
 * W20 · Swap (`/swap`, with `from` and `to` as currency codes), opened from the Dollar, other currency and Crypto tabs on the Wallet tab. W21's review
 * and W11's PIN sheet open over it; a swap that went in replaces it with its receipt. Signed in only.
 */
export default function SwapRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <SwapScreen
      from={one(params.from)}
      to={one(params.to)}
      onBack={leave}
      onOpenAccounts={() => router.replace('/wallet')}
      onSwapped={(swap) => router.replace({ pathname: '/fx-receipt', params: { kind: 'swap', id: swap.id } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
