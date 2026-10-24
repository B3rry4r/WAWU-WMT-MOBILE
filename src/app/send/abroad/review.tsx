import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { readHeldQuote } from '@/features/abroad/model';
import { AbroadReviewScreen } from '@/features/abroad/screens';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';
import { useSystemBack } from '@/features/professionals/parts';

/** Send abroad · review and the PIN (`/send/abroad/review?quote=`, NUV-11). The quote rides in the params; the Hub checks it again at the send. */
export default function SendAbroadReviewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams<{ quote?: string }>();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/send/abroad'));
  useSystemBack(leave);
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  const quote = readHeldQuote(params.quote);
  if (!quote) return <Redirect href="/send/abroad" />;
  return (
    <AbroadReviewScreen
      quote={quote}
      onBack={leave}
      onSent={(id) => router.replace({ pathname: '/send/abroad/receipt', params: { id } })}
      onNewQuote={leave}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
