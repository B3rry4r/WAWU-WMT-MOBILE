import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { ReviewScreen } from '@/features/capital/ReviewScreen';
import { OPEN_WALLET_PIN_PATH } from '@/features/open-wallet/entry';

/** The review of a Capital reservation, with the PIN sheet over it (`/capital/review?id=`). */
export default function CapitalReviewRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/capital" />;
  return (
    <ReviewScreen
      orderId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/capital'))}
      onStartAgain={(productId) => router.replace({ pathname: '/capital/product', params: { id: productId } })}
      onDone={() => router.dismissTo('/capital')}
      onOpenOrder={(orderId) => router.replace({ pathname: '/capital/order', params: { id: orderId } })}
      onForgotPin={() => router.push('/reset-pin')}
      onSetPin={() => router.push(OPEN_WALLET_PIN_PATH)}
    />
  );
}
