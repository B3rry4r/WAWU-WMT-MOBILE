import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AddMoneyScreen } from '@/features/addmoney/AddMoneyScreen';
import { shortfallOf } from '@/features/addmoney/model';
import { useSystemBack } from '@/features/professionals/parts';

/**
 * W15 · Add money (`/add-money`), with W45 and W46 as its states. Signed in only. A pay sheet that was short opens it with
 * `?short=<kobo>`, and the screen names what was missing; Back and Done return to that sheet's screen, or to the Wallet tab when
 * nothing is behind it.
 */
export default function AddMoneyRoute() {
  const router = useRouter();
  const { status } = useSession();
  const { short } = useLocalSearchParams<{ short?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/wallet'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  return (
    <AddMoneyScreen
      shortfallKobo={shortfallOf(short)}
      onBack={leave}
      onDone={leave}
      onOpenWay={(rail) => router.push({ pathname: '/add-money/way', params: { rail } })}
    />
  );
}
