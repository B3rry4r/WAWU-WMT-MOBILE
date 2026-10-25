import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useSession } from '@/api/session';
import { HoldingScreen } from '@/features/capital/HoldingScreen';

/** One Capital investment (`/capital/order?id=`): where it stands, its figures and movements, and Withdraw. */
export default function CapitalOrderRoute() {
  const router = useRouter();
  const { status } = useSession();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (status === 'restoring') return null;
  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (!id) return <Redirect href="/capital" />;
  return (
    <HoldingScreen
      orderId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/capital'))}
      onWithdraw={(orderId) => router.push({ pathname: '/capital/withdraw', params: { id: orderId } })}
      onReview={(orderId) => router.push({ pathname: '/capital/review', params: { id: orderId } })}
    />
  );
}
