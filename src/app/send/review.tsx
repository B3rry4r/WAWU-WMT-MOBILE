import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { ReviewScreen } from '@/features/send/ReviewScreen';
import { payeeFromParams } from '@/features/send/model';

/**
 * W10 · Send · review, with W11's PIN sheet over it (`/send/review`): the person, the amount in kobo and the note ride in the
 * params. Without a person or a whole-kobo amount, back to W7. A completed send replaces this screen with its receipt. The phone's
 * own Back is the screen's (`ReviewScreen`): it goes to the wallet when the send is only waiting for the provider.
 */
export default function SendReviewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const payee = payeeFromParams(params);
  const raw = Array.isArray(params.amount) ? params.amount[0] : params.amount;
  const amountKobo = typeof raw === 'string' && /^[0-9]+$/.test(raw) ? Number(raw) : 0;
  const note = (Array.isArray(params.note) ? params.note[0] : params.note) ?? '';
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send'));
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!payee || !Number.isSafeInteger(amountKobo) || amountKobo <= 0) return <Redirect href="/send" />;
  return (
    <ReviewScreen
      payee={payee}
      amountKobo={amountKobo}
      note={note}
      onBack={leave}
      onSent={(id) => router.replace({ pathname: '/send/receipt', params: { id } })}
      onFailed={(id) => router.replace({ pathname: '/send/failed', params: { id } })}
      onLeave={() => router.dismissTo('/wallet')}
      onAddMoney={() => router.dismissTo('/wallet')}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
