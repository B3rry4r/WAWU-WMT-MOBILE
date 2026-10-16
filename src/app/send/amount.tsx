import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { AmountScreen } from '@/features/send/AmountScreen';
import { payeeFromParams, payeeParams } from '@/features/send/model';
import { useSystemBack } from '@/features/professionals/parts';

/** W9 · Send · amount (`/send/amount`): the person from W7 rides in the params. Without one, back to W7. */
export default function SendAmountRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const payee = payeeFromParams(params);
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!payee) return <Redirect href="/send" />;
  return (
    <AmountScreen
      payee={payee}
      onBack={leave}
      onContinue={({ amountKobo, note }) =>
        router.push({ pathname: '/send/review', params: { ...payeeParams(payee), amount: String(amountKobo), ...(note ? { note } : {}) } })
      }
    />
  );
}
